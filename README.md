# FX Edge Journal

An offline-first FX trading journal for recording trades, reviewing performance, and turning the best repeating setups into written strategies.

## Run

Open `index.html` in a browser. The app stores trades and strategies in browser `localStorage`.

## Use On iPhone

For the best iPhone experience, host this folder as a small website, open the URL in Safari, then use Share > Add to Home Screen.

Quick local test from your computer:

1. Start a web server in this folder, for example `python -m http.server 8080`.
2. Find your computer IP address with `ipconfig`.
3. On iPhone, connect to the same Wi-Fi and open `http://YOUR-PC-IP:8080`.
4. In Safari, tap Share, then Add to Home Screen.

A permanent setup should use an HTTPS host such as GitHub Pages, Netlify, or Vercel. Offline caching works only on supported secure web origins.

## Included

- Trade ticket with pair, session, direction, setup, risk, entry, stop, target, exit, emotions, discipline, tags, mistakes, and notes
- Automatic R-multiple calculation from entry, stop, exit, and direction, with manual R override
- Dashboard metrics: Net R, dollar P/L, win rate, profit factor, average R, drawdown, expectancy, and discipline
- Trade history filters
- Equity curve, setup leaderboard, session edge, and mistake cost analysis
- Best trade profile and strategy builder
- JSON import/export and CSV export
