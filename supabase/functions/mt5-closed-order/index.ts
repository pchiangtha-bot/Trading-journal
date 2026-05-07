import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-mt5-token, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || req.headers.get("x-mt5-token")?.trim() || "";
}

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

function timestampOrNull(value: unknown, serverOffsetMinutes = 0) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  const offset = Number.isFinite(Number(serverOffsetMinutes)) ? Number(serverOffsetMinutes) : 0;
  const date = Number.isFinite(numeric)
    ? new Date((numeric > 100000000000 ? numeric : numeric * 1000) - offset * 60000)
    : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function payloadSourceText(payload: Record<string, unknown>) {
  return String(firstValue(payload.client_platform, payload.platform, payload.mobile_engine, payload.source) || "").toLowerCase();
}

function isHistoryPayload(payload: Record<string, unknown>) {
  return payloadSourceText(payload).includes("history");
}

function payloadServerOffsetMinutes(payload: Record<string, unknown>) {
  if (isHistoryPayload(payload)) return 0;
  const explicitOffset = numberOrNull(firstValue(
    payload.server_utc_offset_minutes,
    payload.mt5_server_utc_offset_minutes,
    payload.broker_utc_offset_minutes,
    payload.server_timezone_offset_minutes
  ));
  return explicitOffset ?? 180;
}
function textOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function cleanDirection(value: unknown) {
  return String(value || "").toLowerCase() === "sell" ? "Sell" : "Buy";
}

function cleanRecordKey(value: unknown) {
  return String(value ?? "").trim();
}

function uniqueRecordKeys(values: unknown[]) {
  return [...new Set(values.map(cleanRecordKey).filter(Boolean))];
}

function mt5RecordKeys(record: Record<string, unknown>, payload: Record<string, unknown>) {
  return uniqueRecordKeys([
    record.external_id,
    payload.external_id,
    payload.position_id,
    payload.order_id,
    payload.ticket,
    payload.exit_ticket,
    payload.deal_ticket,
    payload.close_ticket,
    payload.closed_ticket
  ]);
}

function tradeRecordKeys(trade: Record<string, unknown>) {
  return uniqueRecordKeys([
    trade.mt5ExternalId,
    trade.mt5_external_id,
    trade.externalId,
    trade.external_id,
    trade.mt5PositionId,
    trade.mt5_position_id,
    trade.positionId,
    trade.position_id,
    trade.mt5DealId,
    trade.mt5_deal_id,
    trade.dealTicket,
    trade.deal_ticket,
    trade.ticket
  ]);
}

function tradeNotesHaveKey(trade: Record<string, unknown>, keys: string[]) {
  const notes = String(trade.notes || "").toLowerCase();
  return keys.some((key) => key.length >= 4 && notes.includes(key.toLowerCase()));
}

async function journalAlreadyHasMt5Record(supabase: any, userId: string, keys: string[]) {
  if (!keys.length) return { duplicate: false };
  const { data: profile, error } = await supabase
    .from("journal_profiles")
    .select("trades")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { duplicate: false, error: error.message };
  const profileTrades = Array.isArray(profile?.trades) ? profile.trades : [];
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  const duplicate = profileTrades.some((trade: unknown) => {
    if (!trade || typeof trade !== "object") return false;
    const row = trade as Record<string, unknown>;
    const rowKeys = tradeRecordKeys(row).map((key) => key.toLowerCase());
    return rowKeys.some((key) => keySet.has(key)) || tradeNotesHaveKey(row, keys);
  });
  return { duplicate };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Use POST." }, 405);

  const token = bearerToken(req);
  if (!token || token.length < 24) return jsonResponse({ error: "Missing MT5 bridge token." }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Missing Supabase function secrets." }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });

  const tokenHash = await sha256Hex(token);
  const { data: bridge, error: tokenError } = await supabase
    .from("mt5_bridge_tokens")
    .select("id,user_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (tokenError) return jsonResponse({ error: tokenError.message }, 500);
  if (!bridge) return jsonResponse({ error: "MT5 bridge token was not accepted." }, 401);

  if (payload.action === "poll_history_request") {
    const { data: request, error: requestError } = await supabase
      .from("mt5_history_requests")
      .select("id,start_date,end_date")
      .eq("user_id", bridge.user_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (requestError) return jsonResponse({ error: requestError.message }, 500);
    if (!request) return jsonResponse({ ok: true, request: null });

    const { error: updateError } = await supabase
      .from("mt5_history_requests")
      .update({ status: "processing", picked_up_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", request.id)
      .eq("user_id", bridge.user_id);

    if (updateError) return jsonResponse({ error: updateError.message }, 500);
    return jsonResponse({ ok: true, request });
  }

  if (payload.action === "complete_history_request") {
    const requestId = textOrNull(payload.request_id);
    if (!requestId) return jsonResponse({ error: "Missing history request id." }, 400);
    const status = String(payload.status || "done") === "error" ? "error" : "done";
    const { error: updateError } = await supabase
      .from("mt5_history_requests")
      .update({
        status,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_count: numberOrNull(payload.order_count) ?? 0,
        error_message: textOrNull(payload.error_message)
      })
      .eq("id", requestId)
      .eq("user_id", bridge.user_id);

    if (updateError) return jsonResponse({ error: updateError.message }, 500);
    return jsonResponse({ ok: true });
  }

  const externalId = textOrNull(payload.external_id)
    || [payload.broker_account, firstValue(payload.position_id, payload.order_id, payload.ticket), firstValue(payload.exit_ticket, payload.deal_ticket, payload.close_ticket, payload.closed_ticket)]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(":")
    || [payload.source, payload.client_platform, payload.broker_account, payload.symbol, firstValue(payload.close_time, payload.closed_at, payload.time), payload.profit]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(":");

  if (!externalId) return jsonResponse({ error: "Missing external position id." }, 400);

  const serverOffsetMinutes = payloadServerOffsetMinutes(payload);

  const record = {
    user_id: bridge.user_id,
    external_id: externalId,
    broker_account: textOrNull(payload.broker_account),
    broker_server: textOrNull(payload.broker_server),
    symbol: textOrNull(payload.symbol) || "UNKNOWN",
    direction: cleanDirection(firstValue(payload.direction, payload.side, payload.type)),
    opened_at: timestampOrNull(firstValue(payload.open_time, payload.opened_at), serverOffsetMinutes),
    closed_at: timestampOrNull(firstValue(payload.close_time, payload.closed_at, payload.time), serverOffsetMinutes) || new Date().toISOString(),
    lot_size: numberOrNull(firstValue(payload.lot_size, payload.volume, payload.lots)),
    entry_price: numberOrNull(firstValue(payload.entry_price, payload.open_price)),
    exit_price: numberOrNull(firstValue(payload.exit_price, payload.close_price)),
    stop_loss: numberOrNull(firstValue(payload.stop_loss, payload.sl)),
    take_profit: numberOrNull(firstValue(payload.take_profit, payload.tp)),
    profit: numberOrNull(payload.profit),
    commission: numberOrNull(payload.commission),
    swap: numberOrNull(payload.swap),
    status: "new",
    raw: payload,
    updated_at: new Date().toISOString()
  };

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("mt5_detected_orders")
    .select("id,status")
    .eq("user_id", bridge.user_id)
    .eq("external_id", externalId)
    .maybeSingle();

  if (existingOrderError) return jsonResponse({ error: existingOrderError.message }, 500);
  const preservedStatus = ["ignored", "recorded"].includes(String(existingOrder?.status || ""))
    ? String(existingOrder?.status)
    : "";

  const duplicateCheck = await journalAlreadyHasMt5Record(supabase, bridge.user_id, mt5RecordKeys(record, payload));
  if (duplicateCheck.error) return jsonResponse({ error: duplicateCheck.error }, 500);
  if (duplicateCheck.duplicate) {
    const recordedRecord = { ...record, status: preservedStatus || "recorded", updated_at: new Date().toISOString() };
    const { error: upsertRecordedError } = await supabase
      .from("mt5_detected_orders")
      .upsert(recordedRecord, { onConflict: "user_id,external_id" });
    if (upsertRecordedError) return jsonResponse({ error: upsertRecordedError.message }, 500);

    await supabase
      .from("mt5_bridge_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", bridge.id);
    return jsonResponse({ ok: true, duplicate: true, already_recorded: true });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("mt5_detected_orders")
    .upsert(preservedStatus ? { ...record, status: preservedStatus } : record, { onConflict: "user_id,external_id" })
    .select("id")
    .single();

  await supabase
    .from("mt5_bridge_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", bridge.id);

  if (insertError) return jsonResponse({ error: insertError.message }, 500);

  return jsonResponse({ ok: true, id: inserted.id });
});
