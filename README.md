# FX Edge Journal

An offline-first FX trading journal for recording trades, reviewing performance, and turning the best repeating setups into written strategies.

## Run

Open `index.html` in a browser. The app stores account profiles, trades, strategies, custom pairs, and settings in browser `localStorage`.

## Cloud Sync Setup

The app can now use Supabase email/password login for realtime sync between iPhone and PC, while keeping local profiles available offline.

1. In Supabase, open SQL Editor.
2. Paste and run the contents of `supabase-schema.sql`.
3. In Authentication > Providers, keep Email enabled.
4. In Authentication > URL Configuration, add your GitHub Pages URL as the Site URL and Redirect URL.
5. Deploy the app again so `index.html`, `app.js`, `styles.css`, `sw.js`, and `supabase-schema.sql` are all updated.
6. Open the app, choose Cloud in the account dialog, then sign in or create a cloud account.
7. To upload an existing local profile, unlock that local profile first, sign in to Cloud, then use Migrate in the Cloud Sync panel.

Only the Supabase project URL and publishable key are used in the browser. Do not put a `service_role` key, database password, or broker password in this static app.

## MT5 Closed-Position Automation

This app includes a safe MT5 bridge for detecting closed positions. It does not trade for you and does not need your broker password. MT5 desktop sends closed-position details to a Supabase Edge Function, then the app shows a Detected Closed Positions inbox so you can review and record the trade.

1. Run the latest `supabase-schema.sql` in Supabase SQL Editor.
2. Deploy the Edge Function in `supabase/functions/mt5-closed-order/index.ts` with JWT verification disabled for this webhook.
3. Sign in to the app with Cloud email/password.
4. In the sidebar Cloud Sync panel, click Token under MT5 Bridge.
5. Keep the shown WebhookUrl and BridgeToken somewhere private. The token is only shown once.
6. In MT5 desktop, open Tools > Options > Expert Advisors and enable Allow WebRequest for listed URL.
7. Add this URL exactly: `https://lzaetartgfejsnwpiezc.supabase.co`
8. Copy `mt5/FxEdgeClosedOrderBridge.mq5` into your MT5 `MQL5/Experts` folder, compile it in MetaEditor, then attach it to one chart.
9. Paste the WebhookUrl and BridgeToken into the EA inputs.

When a position fully closes, the Journal page will show it in Detected Closed Positions. Click Record to load broker facts into the Trade Ticket, then type your own Session and Setup before saving.

With Supabase CLI, the deploy command is:

```powershell
supabase functions deploy mt5-closed-order --no-verify-jwt
```

## Use On iPhone

For the best iPhone experience, host this folder as a small website, open the URL in Safari, then use Share > Add to Home Screen.

Quick local test from your computer:

1. Start a web server in this folder, for example `python -m http.server 8080`.
2. Find your computer IP address with `ipconfig`.
3. On iPhone, connect to the same Wi-Fi and open `http://YOUR-PC-IP:8080`.
4. In Safari, tap Share, then Add to Home Screen.

A permanent setup should use an HTTPS host such as GitHub Pages, Netlify, or Vercel. Offline caching works only on supported secure web origins.

If the Home Screen app still shows an older version after you update the files, delete the old Home Screen icon, then clear Safari data for your site in Settings > Safari > Advanced > Website Data. Reopen the GitHub Pages URL in Safari, wait for the latest page to load, then add it to the Home Screen again.

## Included

- Trade ticket with pair, session, direction, setup, risk, entry, stop, target, exit, emotions, discipline, tags, mistakes, and notes
- Automatic actual RR from entry, stop, exit, and direction
- Automatic target RR from entry, stop, target, and direction
- MT5-style lot size calculation using lot size, contract size, and quote-to-USD conversion
- Pair picker for metals, major FX, and cross FX with automatic contract-per-lot values
- Custom pair creation for crypto or broker-specific symbols, with editable contract-per-lot values
- Editable commission per trade, auto-filled from a Pepperstone Razor-style USD `7.00` round-turn commission per lot by default
- Swap defaults to `0` and stays editable per trade
- Dashboard metrics: Net R, dollar P/L, win rate, profit factor, average R, drawdown, expectancy, and discipline
- Trade history filters
- Day, month, and year cumulative R curves with hover summaries
- Analytics period selector: all trades, today, this week, this month, last 7/30/90 days, year to date, and custom dates
- Additional analytics charts: period net P/L, pair net P/L, long-vs-short P/L, and R distribution
- Hover summaries on analytics charts with order count, net P/L or trade count, and a short readout
- iPhone-friendly analytics chart readouts: tap or drag charts to show the same short details without needing mouse hover
- Setup leaderboard, session edge, and mistake cost analysis
- Report-style analytics based on the MT/Pepperstone report structure: Summary, Profit & Loss, Long & Short, Symbols, and Risks
- Market tools with Pepperstone, TradingView, and MetaTrader 5 links
- Sidebar TradingView mini symbol chart, defaulting to Pepperstone XAU/USD, with changeable pair and range controls
- Sidebar daylight-saving status for New York, London, and Sydney session timing
- Local account profiles with password-gated sign in, account switching, and separated trades, strategies, custom pairs, and settings per account
- Supabase email/password cloud sync with local-profile migration and realtime updates across devices
- MT5 desktop closed-position bridge with review-before-record inbox

## Market Chart Notes

The live chart uses TradingView's external Mini Symbol Overview widget, so it needs internet access. App pairs are mapped to Pepperstone TradingView symbols such as `PEPPERSTONE:XAUUSD` and `PEPPERSTONE:EURUSD`. USDT crypto pairs use Binance symbols such as `BINANCE:ETHUSDT` because Pepperstone may not publish those USDT pairs on TradingView.
- Best trade profile and strategy builder
- JSON import/export and CSV export

## Calculation Notes

Actual RR = movement from entry to exit divided by movement from entry to stop.

Target RR = movement from entry to target divided by movement from entry to stop.

USD P/L = price movement x lot size x contract size x quote-to-USD rate.

For EUR/USD, GBP/USD, AUD/USD, and XAU/USD, quote-to-USD is `1`. For USD/JPY, the app can estimate using price. For cross pairs such as GBP/JPY, enter the quote-to-USD rate when you want exact dollar P/L.

## Account Notes

Accounts are local profiles for this browser/device. Passwords are stored as salted hashes when Web Crypto is available, but a static offline app cannot provide the same protection as a server-backed login system. Use the feature for separation and privacy on your device, not for high-security data protection.

Cloud accounts use Supabase Auth. The app stores one cloud journal per email account in `public.journal_profiles`, protected by Row Level Security so each signed-in user can read and write only their own journal row.
