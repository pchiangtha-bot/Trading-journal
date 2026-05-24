//+------------------------------------------------------------------+
//| FX Edge Journal - Closed Position Bridge                         |
//| Attach this EA to one chart in MT5 desktop.                       |
//+------------------------------------------------------------------+
#property strict
#property version   "1.00"
#property description "Sends fully closed MT5 positions to FX Edge Journal via Supabase Edge Function."

input string WebhookUrl = "https://lzaetartgfejsnwpiezc.supabase.co/functions/v1/mt5-closed-order";
input string BridgeToken = "";
input bool   EnableBridgeLeaderElection = true;
input string BridgeDeviceId = "";
input string BridgeDeviceLabel = "MT5 desktop";
input int    BridgeHeartbeatSeconds = 30;
input bool   SendPartialCloses = false;
input int    HistoryLookbackDays = 30;
input int    TimeoutMs = 7000;
input bool   UploadHistoryOnStart = false;
input string HistoryStartDate = "";
input string HistoryEndDate = "";
input int    MaxHistoryRecords = 300;
input bool   PollHistoryRequests = true;
input int    HistoryRequestPollSeconds = 60;
input int    LiveRetrySeconds = 90;
input int    LiveRetryIntervalSeconds = 5;

string sentKeys[];
ulong pendingLiveDeals[];
datetime pendingLiveDealAddedAt[];
bool bridgeIsLeader = true;
datetime lastBridgeHeartbeatAt = 0;
datetime lastHistoryRequestPollAt = 0;
datetime lastLiveRetryAt = 0;

int OnInit()
  {
    Print("FX Edge Journal bridge loaded.");
    Print("Allow this URL in MT5: Tools > Options > Expert Advisors > Allow WebRequest for listed URL: https://lzaetartgfejsnwpiezc.supabase.co");
    if(BridgeToken == "")
       Print("BridgeToken is empty. Generate a token inside FX Edge Journal, then paste it into this EA input.");
    bridgeIsLeader = !EnableBridgeLeaderElection;
    int timerSeconds = 0;
    if(PollHistoryRequests)
       timerSeconds = (int)MathMax(15, HistoryRequestPollSeconds);
    if(LiveRetrySeconds > 0)
      {
       int retryTimerSeconds = (int)MathMax(1, LiveRetryIntervalSeconds);
       if(timerSeconds == 0 || retryTimerSeconds < timerSeconds)
          timerSeconds = retryTimerSeconds;
      }
    if(EnableBridgeLeaderElection)
      {
       RefreshBridgeLeadership();
       int heartbeatTimerSeconds = (int)MathMax(15, BridgeHeartbeatSeconds);
       if(timerSeconds == 0 || heartbeatTimerSeconds < timerSeconds)
          timerSeconds = heartbeatTimerSeconds;
      }
    if(timerSeconds > 0)
       EventSetTimer(timerSeconds);
    if(UploadHistoryOnStart)
      {
       if(!EnableBridgeLeaderElection || bridgeIsLeader)
          UploadClosedHistoryPeriod(HistoryStartDate, HistoryEndDate, "");
       else
          Print("FX Edge Journal history upload on start is waiting because another bridge is active.");
      }
    return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

void OnTimer()
  {
    datetime now = TimeLocal();
    if(EnableBridgeLeaderElection &&
       (lastBridgeHeartbeatAt == 0 || now - lastBridgeHeartbeatAt >= (int)MathMax(15, BridgeHeartbeatSeconds)))
       RefreshBridgeLeadership();

    if(PollHistoryRequests &&
       (!EnableBridgeLeaderElection || bridgeIsLeader) &&
       (lastHistoryRequestPollAt == 0 || now - lastHistoryRequestPollAt >= (int)MathMax(15, HistoryRequestPollSeconds)))
      {
       lastHistoryRequestPollAt = now;
       PollHistoryRequest();
      }
    RetryPendingLiveDeals();
  }

void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
  {
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD)
      return;
    if(trans.deal == 0)
       return;
   int closeStatus = CloseDealCandidateStatus(trans.deal);
   if(closeStatus < 0)
      return;
   if(closeStatus == 0 || !ProcessLiveDeal(trans.deal))
      QueuePendingLiveDeal(trans.deal);
  }

bool ProcessLiveDeal(ulong deal)
  {
   if(deal == 0)
      return(false);
   int closeStatus = CloseDealCandidateStatus(deal);
   if(closeStatus < 0)
      return(true);
   if(closeStatus == 0)
      return(false);
   if(EnableBridgeLeaderElection && !RefreshBridgeLeadership())
      return(false);

   string payload = "";
   string dedupeKey = "";
   if(!BuildClosedPositionPayload(deal, payload, dedupeKey, "mt5-desktop", ""))
      return(false);
   if(AlreadySent(dedupeKey))
      return(true);
   if(SendPayload(payload))
     {
      MarkSent(dedupeKey);
      return(true);
     }
   return(false);
  }

int CloseDealCandidateStatus(ulong deal)
  {
   if(deal == 0)
      return(-1);
   if(!HistoryDealSelect(deal))
      return(0);
   long entry = HistoryDealGetInteger(deal, DEAL_ENTRY);
   if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY || entry == DEAL_ENTRY_INOUT)
      return(1);
   return(-1);
  }

void QueuePendingLiveDeal(ulong deal)
  {
   if(LiveRetrySeconds <= 0 || deal == 0)
      return;
   for(int i = 0; i < ArraySize(pendingLiveDeals); i++)
     {
      if(pendingLiveDeals[i] == deal)
         return;
     }
   int size = ArraySize(pendingLiveDeals);
   ArrayResize(pendingLiveDeals, size + 1);
   ArrayResize(pendingLiveDealAddedAt, size + 1);
   pendingLiveDeals[size] = deal;
   pendingLiveDealAddedAt[size] = TimeLocal();
   PrintFormat("FX Edge Journal queued live deal %I64u for retry.", deal);
  }

void RetryPendingLiveDeals()
  {
   if(LiveRetrySeconds <= 0 || ArraySize(pendingLiveDeals) == 0)
      return;

   datetime now = TimeLocal();
   if(lastLiveRetryAt != 0 && now - lastLiveRetryAt < (int)MathMax(1, LiveRetryIntervalSeconds))
      return;
   lastLiveRetryAt = now;

   int kept = 0;
   for(int i = 0; i < ArraySize(pendingLiveDeals); i++)
     {
      ulong deal = pendingLiveDeals[i];
      datetime addedAt = pendingLiveDealAddedAt[i];
      if(now - addedAt > LiveRetrySeconds)
        {
         PrintFormat("FX Edge Journal stopped retrying live deal %I64u after %d seconds.", deal, LiveRetrySeconds);
         continue;
        }
      if(ProcessLiveDeal(deal))
         continue;

      pendingLiveDeals[kept] = deal;
      pendingLiveDealAddedAt[kept] = addedAt;
      kept++;
     }
   ArrayResize(pendingLiveDeals, kept);
   ArrayResize(pendingLiveDealAddedAt, kept);
  }

int ServerUtcOffsetMinutes()
  {
   datetime serverTime = TimeTradeServer();
   datetime gmtTime = TimeGMT();
   if(serverTime <= 0 || gmtTime <= 0)
      return(0);
   return((int)MathRound((double)(serverTime - gmtTime) / 60.0));
  }

bool BuildClosedPositionPayload(ulong exitDeal, string &payload, string &dedupeKey, string source, string historyRequestId)
  {
   if(BridgeToken == "" || WebhookUrl == "")
     {
      Print("FX Edge Journal bridge is not configured.");
      return(false);
     }

   if(!HistoryDealSelect(exitDeal))
      return(false);

   long exitEntry = HistoryDealGetInteger(exitDeal, DEAL_ENTRY);
   if(exitEntry != DEAL_ENTRY_OUT && exitEntry != DEAL_ENTRY_OUT_BY && exitEntry != DEAL_ENTRY_INOUT)
      return(false);

   ulong positionId = (ulong)HistoryDealGetInteger(exitDeal, DEAL_POSITION_ID);
   if(positionId == 0)
      return(false);

   if(!SendPartialCloses && IsPositionStillOpen(positionId))
      return(false);

   if(!SelectPositionHistory(positionId))
     {
      PrintFormat("Could not select history for position %I64u. Error %d", positionId, GetLastError());
      return(false);
     }

   string symbol = "";
   double entryValue = 0.0;
   double entryVolume = 0.0;
   double exitValue = 0.0;
   double exitVolume = 0.0;
   double profit = 0.0;
   double commission = 0.0;
   double swap = 0.0;
   datetime openTime = 0;
   datetime closeTime = 0;
   long entryType = -1;
   long exitType = HistoryDealGetInteger(exitDeal, DEAL_TYPE);
   long magic = HistoryDealGetInteger(exitDeal, DEAL_MAGIC);

   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
     {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;
      if((ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID) != positionId)
         continue;

      string dealSymbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      if(symbol == "" && dealSymbol != "")
         symbol = dealSymbol;

      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
      datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

      profit += HistoryDealGetDouble(ticket, DEAL_PROFIT);
      commission += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      swap += HistoryDealGetDouble(ticket, DEAL_SWAP);

      if(dealEntry == DEAL_ENTRY_IN || dealEntry == DEAL_ENTRY_INOUT)
        {
         entryValue += price * volume;
         entryVolume += volume;
         if(openTime == 0 || dealTime < openTime)
            openTime = dealTime;
         if(dealType == DEAL_TYPE_BUY || dealType == DEAL_TYPE_SELL)
            entryType = dealType;
        }

      if(dealEntry == DEAL_ENTRY_OUT || dealEntry == DEAL_ENTRY_OUT_BY || dealEntry == DEAL_ENTRY_INOUT)
        {
         exitValue += price * volume;
         exitVolume += volume;
         if(dealTime > closeTime)
            closeTime = dealTime;
        }
     }

   if(symbol == "" || entryVolume <= 0.0 || exitVolume <= 0.0)
      return(false);

   double stopLoss = HistoryDealGetDouble(exitDeal, DEAL_SL);
   double takeProfit = HistoryDealGetDouble(exitDeal, DEAL_TP);
   FindHistoryStops(positionId, symbol, openTime, closeTime, stopLoss, takeProfit);

   double entryPrice = entryValue / entryVolume;
   double exitPrice = exitValue / exitVolume;
   string direction = "Buy";
   if(entryType == DEAL_TYPE_SELL || (entryType < 0 && exitType == DEAL_TYPE_BUY))
      direction = "Sell";

   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string externalId = IntegerToString(login) + "-" + IntegerToString((long)positionId);
   dedupeKey = externalId + "-" + IntegerToString((long)exitDeal);
   int serverUtcOffsetMinutes = ServerUtcOffsetMinutes();

   payload = "{";
   payload += "\"external_id\":\"" + JsonEscape(dedupeKey) + "\",";
   payload += "\"broker_account\":\"" + JsonEscape(IntegerToString(login)) + "\",";
    payload += "\"broker_server\":\"" + JsonEscape(AccountInfoString(ACCOUNT_SERVER)) + "\",";
    payload += "\"broker_company\":\"" + JsonEscape(AccountInfoString(ACCOUNT_COMPANY)) + "\",";
    payload += "\"source\":\"" + JsonEscape(source) + "\",";
    payload += "\"bridge_device_id\":\"" + JsonEscape(BridgeDeviceIdentifier()) + "\",";
    payload += "\"bridge_device_label\":\"" + JsonEscape(BridgeDeviceDisplayLabel()) + "\",";
    payload += "\"server_utc_offset_minutes\":" + IntegerToString(serverUtcOffsetMinutes) + ",";
   payload += "\"symbol\":\"" + JsonEscape(symbol) + "\",";
   payload += "\"direction\":\"" + JsonEscape(direction) + "\",";
   payload += "\"position_id\":\"" + JsonEscape(IntegerToString((long)positionId)) + "\",";
   payload += "\"exit_ticket\":\"" + JsonEscape(IntegerToString((long)exitDeal)) + "\",";
   payload += "\"magic\":\"" + JsonEscape(IntegerToString(magic)) + "\",";
   if(historyRequestId != "")
      payload += "\"history_request_id\":\"" + JsonEscape(historyRequestId) + "\",";
   payload += "\"open_time\":" + IntegerToString((long)openTime) + ",";
   payload += "\"close_time\":" + IntegerToString((long)closeTime) + ",";
   payload += "\"lot_size\":" + JsonNumber(exitVolume, 2) + ",";
   payload += "\"entry_price\":" + JsonNumber(entryPrice, 8) + ",";
   payload += "\"exit_price\":" + JsonNumber(exitPrice, 8) + ",";
   payload += "\"stop_loss\":" + JsonNumber(stopLoss, 8) + ",";
   payload += "\"take_profit\":" + JsonNumber(takeProfit, 8) + ",";
   payload += "\"profit\":" + JsonNumber(profit, 2) + ",";
   payload += "\"commission\":" + JsonNumber(commission, 2) + ",";
   payload += "\"swap\":" + JsonNumber(swap, 2);
   payload += "}";

   return(true);
  }

bool SelectPositionHistory(ulong positionId)
  {
   if(HistorySelectByPosition((long)positionId))
      return(true);
   int days = (int)MathMax(1, HistoryLookbackDays);
   datetime fromTime = TimeCurrent() - days * 86400;
   return(HistorySelect(fromTime, TimeCurrent() + 60));
  }

bool IsPositionStillOpen(ulong positionId)
  {
   for(int i = 0; i < PositionsTotal(); i++)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;
      if(PositionSelectByTicket(ticket))
        {
         ulong identifier = (ulong)PositionGetInteger(POSITION_IDENTIFIER);
         if(identifier == positionId)
            return(true);
        }
     }
   return(false);
  }

void FindHistoryStops(ulong positionId,
                      string symbol,
                      datetime openTime,
                      datetime closeTime,
                      double &stopLoss,
                      double &takeProfit)
  {
   int days = (int)MathMax(1, HistoryLookbackDays);
   datetime fromTime = openTime > 0 ? openTime - 86400 : TimeCurrent() - days * 86400;
   datetime toTime = closeTime > 0 ? closeTime + 86400 : TimeCurrent() + 60;
   HistorySelect(fromTime, toTime);

   datetime latestStopTime = stopLoss > 0.0 && closeTime > 0 ? closeTime : 0;
   datetime latestTargetTime = takeProfit > 0.0 && closeTime > 0 ? closeTime : 0;

   int dealTotal = HistoryDealsTotal();
   for(int i = 0; i < dealTotal; i++)
     {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;
      if((ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID) != positionId)
         continue;

      string dealSymbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      if(symbol != "" && dealSymbol != "" && dealSymbol != symbol)
         continue;

      double sl = HistoryDealGetDouble(ticket, DEAL_SL);
      double tp = HistoryDealGetDouble(ticket, DEAL_TP);
      datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

      if(sl > 0.0 && dealTime >= latestStopTime)
        {
         stopLoss = sl;
         latestStopTime = dealTime;
        }
      if(tp > 0.0 && dealTime >= latestTargetTime)
        {
         takeProfit = tp;
         latestTargetTime = dealTime;
        }
     }

   int orderTotal = HistoryOrdersTotal();
   for(int i = 0; i < orderTotal; i++)
     {
      ulong ticket = HistoryOrderGetTicket(i);
      if(ticket == 0)
         continue;

      ulong orderPositionId = (ulong)HistoryOrderGetInteger(ticket, ORDER_POSITION_ID);
      ulong orderPositionById = (ulong)HistoryOrderGetInteger(ticket, ORDER_POSITION_BY_ID);
      string orderSymbol = HistoryOrderGetString(ticket, ORDER_SYMBOL);
      if(orderPositionId != positionId && orderPositionById != positionId)
         continue;
      if(symbol != "" && orderSymbol != "" && orderSymbol != symbol)
         continue;

      double sl = HistoryOrderGetDouble(ticket, ORDER_SL);
      double tp = HistoryOrderGetDouble(ticket, ORDER_TP);
      datetime orderTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_DONE);
      if(orderTime == 0)
         orderTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_SETUP);

      if(sl > 0.0)
        {
         if(orderTime >= latestStopTime)
           {
            stopLoss = sl;
            latestStopTime = orderTime;
           }
        }
      if(tp > 0.0)
        {
         if(orderTime >= latestTargetTime)
           {
            takeProfit = tp;
            latestTargetTime = orderTime;
           }
        }
     }
  }


bool UploadClosedHistoryPeriod(string startText, string endText, string historyRequestId)
  {
   int days = (int)MathMax(1, HistoryLookbackDays);
   datetime fromTime = ParseDateInput(startText, TimeCurrent() - days * 86400);
   datetime toTime = ParseDateInput(endText, TimeCurrent()) + 86399;
   if(toTime < fromTime)
     {
      Print("FX Edge Journal history sync skipped: end date is before start date.");
      return(false);
     }

   if(!HistorySelect(fromTime, toTime))
     {
      PrintFormat("FX Edge Journal history sync could not select history. Error %d", GetLastError());
      if(historyRequestId != "") CompleteHistoryRequest(historyRequestId, 0, "error", "HistorySelect failed");
      return(false);
     }

   ulong exitDeals[];
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
     {
       ulong deal = HistoryDealGetTicket(i);
       if(deal == 0)
          continue;
       long entry = HistoryDealGetInteger(deal, DEAL_ENTRY);
       if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY && entry != DEAL_ENTRY_INOUT)
          continue;

       int exitCount = ArraySize(exitDeals);
       ArrayResize(exitDeals, exitCount + 1);
       exitDeals[exitCount] = deal;
     }

   int sent = 0;
   for(int i = 0; i < ArraySize(exitDeals) && sent < MaxHistoryRecords; i++)
     {
       ulong deal = exitDeals[i];

       string payload = "";
       string dedupeKey = "";
       if(!BuildClosedPositionPayload(deal, payload, dedupeKey, "mt5-history", historyRequestId))
         continue;
      if(AlreadySent(dedupeKey))
         continue;
      if(SendPayload(payload))
        {
         MarkSent(dedupeKey);
         sent++;
        }
     }

   PrintFormat("FX Edge Journal history sync selected %d closed exit deals and sent %d.", ArraySize(exitDeals), sent);
   if(historyRequestId != "") CompleteHistoryRequest(historyRequestId, sent, "done", "");
   return(true);
  }

datetime ParseDateInput(string value, datetime fallback)
  {
   string text = value;
   StringTrimLeft(text);
   StringTrimRight(text);
   if(text == "") return(fallback);
   StringReplace(text, "-", ".");
   datetime parsed = StringToTime(text);
   return(parsed > 0 ? parsed : fallback);
  }

string BridgeDeviceIdentifier()
  {
   string configured = BridgeDeviceId;
   StringTrimLeft(configured);
   StringTrimRight(configured);
   if(configured != "")
      return(configured);

   string terminalDataPath = TerminalInfoString(TERMINAL_DATA_PATH);
   if(terminalDataPath != "")
      return(terminalDataPath);

   string terminalPath = TerminalInfoString(TERMINAL_PATH);
   if(terminalPath != "")
      return(terminalPath);

   return(IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN)) + "-" + AccountInfoString(ACCOUNT_SERVER));
  }

string BridgeDeviceDisplayLabel()
  {
   string label = BridgeDeviceLabel;
   StringTrimLeft(label);
   StringTrimRight(label);
   return(label == "" ? "MT5 desktop" : label);
  }

bool RefreshBridgeLeadership()
  {
   if(!EnableBridgeLeaderElection)
     {
      bridgeIsLeader = true;
      return(true);
     }

   string payload = "{";
   payload += "\"action\":\"bridge_heartbeat\",";
   payload += "\"device_id\":\"" + JsonEscape(BridgeDeviceIdentifier()) + "\",";
   payload += "\"device_label\":\"" + JsonEscape(BridgeDeviceDisplayLabel()) + "\",";
   payload += "\"broker_account\":\"" + JsonEscape(IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN))) + "\",";
   payload += "\"broker_server\":\"" + JsonEscape(AccountInfoString(ACCOUNT_SERVER)) + "\"";
   payload += "}";

   string response = "";
   lastBridgeHeartbeatAt = TimeLocal();
   if(!PostJson(payload, response))
      return(bridgeIsLeader);

   bool nextLeader = ExtractJsonBool(response, "leader", bridgeIsLeader);
   if(nextLeader != bridgeIsLeader)
     {
      Print(nextLeader
        ? "FX Edge Journal bridge became the active uploader."
        : "FX Edge Journal bridge is on standby; another terminal is active.");
     }
   bridgeIsLeader = nextLeader;
   return(bridgeIsLeader);
  }

void PollHistoryRequest()
  {
   string response = "";
   if(!PostJson("{\"action\":\"poll_history_request\"}", response))
      return;

   string requestId = ExtractJsonString(response, "id");
   string startDate = ExtractJsonString(response, "start_date");
   string endDate = ExtractJsonString(response, "end_date");
   if(requestId == "" || startDate == "" || endDate == "")
      return;

   Print("FX Edge Journal history request received: " + startDate + " to " + endDate);
   UploadClosedHistoryPeriod(startDate, endDate, requestId);
  }

void CompleteHistoryRequest(string requestId, int orderCount, string status, string errorMessage)
  {
   string payload = "{";
   payload += "\"action\":\"complete_history_request\",";
   payload += "\"request_id\":\"" + JsonEscape(requestId) + "\",";
   payload += "\"status\":\"" + JsonEscape(status) + "\",";
   payload += "\"order_count\":" + IntegerToString(orderCount) + ",";
   payload += "\"error_message\":\"" + JsonEscape(errorMessage) + "\"";
   payload += "}";
   string response = "";
   PostJson(payload, response);
  }

string ExtractJsonString(string json, string key)
  {
   string pattern = "\"" + key + "\":\"";
   int start = StringFind(json, pattern);
   if(start < 0) return("");
   start += StringLen(pattern);
   int finish = StringFind(json, "\"", start);
   if(finish < 0) return("");
   return(StringSubstr(json, start, finish - start));
  }

bool ExtractJsonBool(string json, string key, bool fallback)
  {
   string pattern = "\"" + key + "\":";
   int start = StringFind(json, pattern);
   if(start < 0)
      return(fallback);
   start += StringLen(pattern);
   string value = StringSubstr(json, start, 5);
   StringToLower(value);
   if(StringFind(value, "true") == 0)
      return(true);
   if(StringFind(value, "false") == 0)
      return(false);
   return(fallback);
  }

bool PostJson(string payload, string &body)
  {
   if(BridgeToken == "" || WebhookUrl == "")
     {
      Print("FX Edge Journal bridge is not configured.");
      return(false);
     }

   char data[];
   StringToCharArray(payload, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(ArraySize(data) > 0)
      ArrayResize(data, ArraySize(data) - 1);

   char response[];
   string responseHeaders = "";
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + BridgeToken + "\r\n";

   ResetLastError();
   int status = WebRequest("POST", WebhookUrl, headers, TimeoutMs, data, response, responseHeaders);
   body = CharArrayToString(response, 0, -1, CP_UTF8);

   if(status >= 200 && status < 300)
      return(true);

   int errorCode = GetLastError();
   PrintFormat("FX Edge Journal bridge failed. HTTP=%d, MT5 error=%d, body=%s", status, errorCode, body);
   if(status == -1)
      Print("Check Tools > Options > Expert Advisors > Allow WebRequest for https://lzaetartgfejsnwpiezc.supabase.co");
   return(false);
  }

bool SendPayload(string payload)
  {
   string body = "";
   bool ok = PostJson(payload, body);
   if(ok)
      Print("FX Edge Journal received closed position: " + body);
   return(ok);
  }

bool AlreadySent(string key)
  {
   for(int i = 0; i < ArraySize(sentKeys); i++)
     {
      if(sentKeys[i] == key)
         return(true);
     }
   return(false);
  }

void MarkSent(string key)
  {
   int size = ArraySize(sentKeys);
   ArrayResize(sentKeys, size + 1);
   sentKeys[size] = key;
   if(ArraySize(sentKeys) > 100)
     {
      for(int i = 1; i < ArraySize(sentKeys); i++)
         sentKeys[i - 1] = sentKeys[i];
      ArrayResize(sentKeys, 100);
     }
  }

string JsonNumber(double value, int digits)
  {
   return(DoubleToString(value, digits));
  }

string JsonEscape(string value)
  {
   StringReplace(value, "\\", "\\\\");
   StringReplace(value, "\"", "\\\"");
   StringReplace(value, "\r", "\\r");
   StringReplace(value, "\n", "\\n");
   StringReplace(value, "\t", "\\t");
   return(value);
  }
