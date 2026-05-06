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

function timestampOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric > 100000000000 ? numeric : numeric * 1000)
    : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function textOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

function cleanDirection(value: unknown) {
  return String(value || "").toLowerCase() === "sell" ? "Sell" : "Buy";
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

  const record = {
    user_id: bridge.user_id,
    external_id: externalId,
    broker_account: textOrNull(payload.broker_account),
    broker_server: textOrNull(payload.broker_server),
    symbol: textOrNull(payload.symbol) || "UNKNOWN",
    direction: cleanDirection(firstValue(payload.direction, payload.side, payload.type)),
    opened_at: timestampOrNull(firstValue(payload.open_time, payload.opened_at)),
    closed_at: timestampOrNull(firstValue(payload.close_time, payload.closed_at, payload.time)) || new Date().toISOString(),
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

  const { data: inserted, error: insertError } = await supabase
    .from("mt5_detected_orders")
    .insert(record)
    .select("id")
    .single();

  await supabase
    .from("mt5_bridge_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", bridge.id);

  if (insertError) {
    if (insertError.code === "23505") return jsonResponse({ ok: true, duplicate: true });
    return jsonResponse({ error: insertError.message }, 500);
  }

  return jsonResponse({ ok: true, id: inserted.id });
});
