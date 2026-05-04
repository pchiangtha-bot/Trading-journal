# FX Edge Journal

An offline-first FX trading journal for recording trades, reviewing performance, and turning the best repeating setups into written strategies.

## Run

Open `index.html` in a browser. The app stores account profiles, trades, strategies, custom pairs, and settings in browser `localStorage`.

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
- Market tools with Pepperstone and TradingView links
- Sidebar TradingView mini symbol chart, defaulting to Pepperstone XAU/USD, with changeable pair and range controls
- Local account profiles with password-gated sign in, account switching, and separated trades, strategies, custom pairs, and settings per account

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
