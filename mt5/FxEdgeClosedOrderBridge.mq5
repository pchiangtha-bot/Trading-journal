//+------------------------------------------------------------------+
//| FX Edge Journal - Closed Position Bridge                         |
//| Attach this EA to one chart in MT5 desktop.                       |
//+------------------------------------------------------------------+
#property strict
#property version   "1.00"
#property description "Sends fully closed MT5 positions to FX Edge Journal via Supabase Edge Function."

input string WebhookUrl = "https://lzaetartgfejsnwpiezc.supabase.co/functions/v1/mt5-closed-order";
input string BridgeToken = "";
input bool   SendPartialCloses = false;
input int    HistoryLookbackDays = 30;
input int    TimeoutMs = 7000;
input bool   UploadHistoryOnStart = false;
input string HistoryStartDate = "";
input string HistoryEndDate = "";
input int    MaxHistoryRecords = 300;
input bool   PollHistoryRequests = true;
input int    HistoryRequestPollSeconds = 60;

string sentKeys[];

int OnInit()
  {
   Print("FX Edge Journal bridge loaded.");
   Print("Allow this URL in MT5: Tools > Options > Expert Advisors > Allow WebRequest for listed URL: https://lzaetartgfejsnwpiezc.supabase.co");
   if(BridgeToken == "")
      Print("BridgeToken is empty. Generate a token inside FX Edge Journal, then paste it into this EA input.");
   if(PollHistoryRequests)
      EventSetTimer((int)MathMax(15, HistoryRequestPollSeconds));
   if(UploadHistoryOnStart)
      UploadClosedHistoryPeriod(HistoryStartDate, HistoryEndDate, "");
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

void OnTimer()
  {
   if(PollHistoryRequests)
      PollHistoryRequest();
  }

void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
  {
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD)
      return;
   if(trans.deal == 0)
      return;

   string payload = "";
   string dedupeKey = "";
   if(!BuildClosedPositionPayload(trans.deal, payload, dedupeKey, "mt5-desktop", ""))
      return;
   if(AlreadySent(dedupeKey))
      return;
   if(SendPayload(payload))
      MarkSent(dedupeKey);
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

   payload = "{";
   payload += "\"external_id\":\"" + JsonEscape(dedupeKey) + "\",";
   payload += "\"broker_account\":\"" + JsonEscape(IntegerToString(login)) + "\",";
   payload += "\"broker_server\":\"" + JsonEscape(AccountInfoString(ACCOUNT_SERVER)) + "\",";
   payload += "\"broker_company\":\"" + JsonEscape(AccountInfoString(ACCOUNT_COMPANY)) + "\",";
   payload += "\"source\":\"" + JsonEscape(source) + "\",";
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

   int sent = 0;
   int total = HistoryDealsTotal();
   for(int i = 0; i < total && sent < MaxHistoryRecords; i++)
     {
      ulong deal = HistoryDealGetTicket(i);
      if(deal == 0)
         continue;
      long entry = HistoryDealGetInteger(deal, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY && entry != DEAL_ENTRY_INOUT)
         continue;

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

   PrintFormat("FX Edge Journal history sync sent %d closed positions.", sent);
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
