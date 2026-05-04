const storageKeys = {
  trades: "fx-edge-journal.trades.v1",
  strategies: "fx-edge-journal.strategies.v1",
  customPairs: "fx-edge-journal.custom-pairs.v1",
  settings: "fx-edge-journal.settings.v1",
  accounts: "fx-edge-journal.accounts.v1",
  activeAccount: "fx-edge-journal.active-account.v1",
  legacyMigrated: "fx-edge-journal.legacy-migrated.v1"
};

const defaultPair = "XAU/USD";
const customPairValue = "__add_custom_pair__";
let equityPeriod = "day";
let equityChartState = { points: [] };
let barChartStates = {};
let analyticsRange = "all";
let analyticsCustomStart = "";
let analyticsCustomEnd = "";
let marketChartPair = defaultPair;
let marketChartInterval = "1D";
const marketChartRanges = ["1D", "5D", "1M", "3M", "12M"];

const contractSizeBySymbol = {
  "XAU/USD": 100,
  "XAG/USD": 5000,
  "BTC/USD": 1,
  "ETH/USD": 1
};

const defaultPairGroups = [
  {
    label: "Metals",
    pairs: [
      { symbol: "XAU/USD", label: "XAU/USD - Gold" },
      { symbol: "XAG/USD", label: "XAG/USD - Silver" }
    ]
  },
  {
    label: "Major FX",
    pairs: [
      { symbol: "EUR/USD", label: "EUR/USD" },
      { symbol: "GBP/USD", label: "GBP/USD" },
      { symbol: "USD/JPY", label: "USD/JPY" },
      { symbol: "AUD/USD", label: "AUD/USD" },
      { symbol: "USD/CAD", label: "USD/CAD" },
      { symbol: "USD/CHF", label: "USD/CHF" },
      { symbol: "NZD/USD", label: "NZD/USD" }
    ]
  },
  {
    label: "Cross FX",
    pairs: [
      { symbol: "EUR/JPY", label: "EUR/JPY" },
      { symbol: "GBP/JPY", label: "GBP/JPY" },
      { symbol: "AUD/JPY", label: "AUD/JPY" },
      { symbol: "CAD/JPY", label: "CAD/JPY" },
      { symbol: "CHF/JPY", label: "CHF/JPY" },
      { symbol: "NZD/JPY", label: "NZD/JPY" },
      { symbol: "EUR/GBP", label: "EUR/GBP" },
      { symbol: "EUR/AUD", label: "EUR/AUD" },
      { symbol: "EUR/CAD", label: "EUR/CAD" },
      { symbol: "EUR/CHF", label: "EUR/CHF" },
      { symbol: "GBP/AUD", label: "GBP/AUD" },
      { symbol: "GBP/CAD", label: "GBP/CAD" },
      { symbol: "GBP/CHF", label: "GBP/CHF" },
      { symbol: "AUD/CAD", label: "AUD/CAD" },
      { symbol: "AUD/NZD", label: "AUD/NZD" },
      { symbol: "NZD/CAD", label: "NZD/CAD" }
    ]
  }
];

const demoTrades = [
  {
    id: "demo-1",
    date: "2026-04-06",
    pair: "EUR/USD",
    session: "London",
    direction: "Buy",
    setup: "Liquidity sweep",
    entry: 1.0812,
    stop: 1.0782,
    target: 1.0872,
    exit: 1.0861,
    risk: 100,
    resultR: 1.63,
    mistake: "None",
    confidence: 74,
    discipline: 88,
    tags: ["trend", "sweep"],
    notes: "Waited for sweep and displacement before entry."
  },
  {
    id: "demo-2",
    date: "2026-04-08",
    pair: "GBP/USD",
    session: "London/New York",
    direction: "Sell",
    setup: "Break and retest",
    entry: 1.258,
    stop: 1.261,
    target: 1.2515,
    exit: 1.255,
    risk: 100,
    resultR: 1,
    mistake: "Early exit",
    confidence: 61,
    discipline: 68,
    tags: ["retest"],
    notes: "Closed before target after fast move."
  },
  {
    id: "demo-3",
    date: "2026-04-10",
    pair: "USD/JPY",
    session: "New York",
    direction: "Buy",
    setup: "Trend pullback",
    entry: 151.28,
    stop: 150.9,
    target: 152.04,
    exit: 150.9,
    risk: 100,
    resultR: -1,
    mistake: "Late entry",
    confidence: 46,
    discipline: 54,
    tags: ["trend"],
    notes: "Entry came after second push, stop was obvious."
  },
  {
    id: "demo-4",
    date: "2026-04-12",
    pair: "XAU/USD",
    session: "New York",
    direction: "Sell",
    setup: "News fade",
    entry: 2365,
    stop: 2375,
    target: 2338,
    exit: 2375,
    risk: 100,
    resultR: -1,
    mistake: "News surprise",
    confidence: 52,
    discipline: 44,
    tags: ["news"],
    notes: "Entered too close to high-impact news."
  },
  {
    id: "demo-5",
    date: "2026-04-15",
    pair: "EUR/USD",
    session: "London",
    direction: "Buy",
    setup: "Liquidity sweep",
    entry: 1.086,
    stop: 1.083,
    target: 1.092,
    exit: 1.092,
    risk: 100,
    resultR: 2,
    mistake: "None",
    confidence: 78,
    discipline: 92,
    tags: ["sweep", "a-plus"],
    notes: "Clean structure and strong follow through."
  },
  {
    id: "demo-6",
    date: "2026-04-17",
    pair: "AUD/USD",
    session: "Asia",
    direction: "Sell",
    setup: "Range rejection",
    entry: 0.646,
    stop: 0.648,
    target: 0.642,
    exit: 0.646,
    risk: 100,
    resultR: 0,
    mistake: "None",
    confidence: 58,
    discipline: 75,
    tags: ["range"],
    notes: "Moved to breakeven after weak momentum."
  },
  {
    id: "demo-7",
    date: "2026-04-21",
    pair: "GBP/JPY",
    session: "London",
    direction: "Buy",
    setup: "Trend pullback",
    entry: 191.2,
    stop: 190.7,
    target: 192.2,
    exit: 191.95,
    risk: 100,
    resultR: 1.5,
    mistake: "None",
    confidence: 70,
    discipline: 84,
    tags: ["trend", "pullback"],
    notes: "Good alignment across higher time frame."
  },
  {
    id: "demo-8",
    date: "2026-04-24",
    pair: "EUR/USD",
    session: "London",
    direction: "Sell",
    setup: "Liquidity sweep",
    entry: 1.073,
    stop: 1.076,
    target: 1.067,
    exit: 1.0745,
    risk: 100,
    resultR: -0.5,
    mistake: "Moved stop",
    confidence: 63,
    discipline: 40,
    tags: ["sweep"],
    notes: "Moved stop once, then closed manually."
  }
];

const defaultSettings = {
  startingBalance: 1000,
  commissionPerLot: 7
};

let accounts = loadFromStorage(storageKeys.accounts, []);
if (!Array.isArray(accounts)) accounts = [];
accounts = accounts.filter((account) => account?.id && account?.name && account?.salt && account?.passwordHash);
let activeAccount = null;
let customPairs = [];
let settings = { ...defaultSettings };
let trades = [];
let strategies = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

const rateFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6
});

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
}

function accountScopedKey(key, accountId = activeAccount?.id) {
  if (!accountId) return key;
  const suffix = key.replace("fx-edge-journal.", "");
  return `fx-edge-journal.account.${accountId}.${suffix}`;
}

function saveAccounts() {
  localStorage.setItem(storageKeys.accounts, JSON.stringify(accounts));
}

function loadAccountData() {
  const storedCustomPairs = loadFromStorage(accountScopedKey(storageKeys.customPairs), []);
  customPairs = Array.isArray(storedCustomPairs)
    ? storedCustomPairs
        .map((pair) => ({
          symbol: normalizePair(pair.symbol),
          contractSize: toNumber(pair.contractSize, 1)
        }))
        .filter((pair) => pair.symbol && pair.contractSize > 0)
    : [];

  settings = {
    ...defaultSettings,
    ...loadFromStorage(accountScopedKey(storageKeys.settings), {})
  };
  analyticsRange = settings.analyticsRange || "all";
  analyticsCustomStart = settings.analyticsCustomStart || "";
  analyticsCustomEnd = settings.analyticsCustomEnd || "";
  marketChartPair = settings.marketChartPair || defaultPair;
  marketChartInterval = settings.marketChartInterval || "1D";
  if (!marketChartRanges.includes(marketChartInterval)) marketChartInterval = "1D";

  const storedTrades = loadFromStorage(accountScopedKey(storageKeys.trades), []);
  if (Array.isArray(storedTrades)) {
    storedTrades.forEach((trade) => ensurePairAvailable(trade.pair, trade.contractSize));
  }
  trades = Array.isArray(storedTrades) ? storedTrades.map(withCalculatedTrade) : [];
  strategies = loadFromStorage(accountScopedKey(storageKeys.strategies), []);
  if (!Array.isArray(strategies)) strategies = [];
}

function resetAppData() {
  customPairs = [];
  settings = { ...defaultSettings };
  trades = [];
  strategies = [];
  analyticsRange = "all";
  analyticsCustomStart = "";
  analyticsCustomEnd = "";
  marketChartPair = defaultPair;
  marketChartInterval = "1D";
}

function hasLegacyData() {
  return [storageKeys.trades, storageKeys.strategies, storageKeys.customPairs, storageKeys.settings]
    .some((key) => Boolean(localStorage.getItem(key)));
}

function migrateLegacyDataToAccount(accountId) {
  if (!accountId || !hasLegacyData()) return;
  [storageKeys.trades, storageKeys.strategies, storageKeys.customPairs, storageKeys.settings].forEach((key) => {
    const legacy = localStorage.getItem(key);
    const scoped = accountScopedKey(key, accountId);
    if (legacy && !localStorage.getItem(scoped)) {
      localStorage.setItem(scoped, legacy);
    }
  });
  localStorage.setItem(storageKeys.legacyMigrated, accountId);
}

function saveTrades() {
  localStorage.setItem(accountScopedKey(storageKeys.trades), JSON.stringify(trades));
}

function saveStrategies() {
  localStorage.setItem(accountScopedKey(storageKeys.strategies), JSON.stringify(strategies));
}

function saveCustomPairs() {
  localStorage.setItem(accountScopedKey(storageKeys.customPairs), JSON.stringify(customPairs));
}

function saveSettings() {
  localStorage.setItem(accountScopedKey(storageKeys.settings), JSON.stringify(settings));
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fallbackHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function randomId(prefix = "acct") {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function randomSalt() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return bytesToHex(bytes);
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

async function hashPassword(password, salt, algorithm = "auto") {
  const value = `${salt}:${password}`;
  if (algorithm === "fallback") return fallbackHash(value);
  try {
    if (globalThis.crypto?.subtle && globalThis.TextEncoder) {
      const data = new TextEncoder().encode(value);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
      const hex = bytesToHex(new Uint8Array(digest));
      return algorithm === "legacy-sha256" ? hex : `sha256-${hex}`;
    }
  } catch (error) {
    // Local file origins can block Web Crypto in some browsers.
  }
  return fallbackHash(value);
}

async function hashPasswordForAccount(password, account) {
  const storedHash = String(account.passwordHash || "");
  if (storedHash.startsWith("fallback-")) return hashPassword(password, account.salt, "fallback");
  if (storedHash.startsWith("sha256-")) return hashPassword(password, account.salt, "sha256");
  return hashPassword(password, account.salt, "legacy-sha256");
}

function timingSafeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

function cleanAccountName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function accountById(id) {
  return accounts.find((account) => account.id === id);
}

function accountByName(name) {
  const normalized = cleanAccountName(name).toLowerCase();
  return accounts.find((account) => cleanAccountName(account.name).toLowerCase() === normalized);
}

function safeSessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    return "";
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    // Password entry still works for the current page when sessionStorage is blocked.
  }
}

function safeSessionRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    // Ignore blocked sessionStorage.
  }
}

function syncAccountUi() {
  const name = $("#activeAccountName");
  if (name) name.textContent = activeAccount ? activeAccount.name : "Locked";
  const logout = $("#logoutAccountBtn");
  if (logout) logout.disabled = !activeAccount;
}

function populateAccountSelect() {
  const select = $("#loginAccountSelect");
  if (!select) return;
  select.innerHTML = "";

  if (!accounts.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Create an account first";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  accounts.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = account.name;
    select.appendChild(option);
  });

  const selectedId = activeAccount?.id || safeSessionGet(storageKeys.activeAccount) || accounts[0].id;
  select.value = accountById(selectedId) ? selectedId : accounts[0].id;
}

function setAuthMode(mode = "login") {
  const resolved = mode === "login" && !accounts.length ? "create" : mode;
  $$(".auth-tabs .segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === resolved);
  });
  const loginForm = $("#loginForm");
  const createForm = $("#createAccountForm");
  if (loginForm) loginForm.classList.toggle("hidden", resolved !== "login");
  if (createForm) createForm.classList.toggle("hidden", resolved !== "create");
  const title = $("#authTitle");
  if (title) title.textContent = resolved === "create" ? "Create Account" : "Open Account";
}

function showAuthOverlay(mode = "login", locked = !activeAccount) {
  const overlay = $("#authOverlay");
  if (!overlay) return;
  populateAccountSelect();
  setAuthMode(mode);
  overlay.dataset.locked = locked ? "true" : "false";
  overlay.classList.remove("hidden");
  const close = $("#closeAuthBtn");
  if (close) close.hidden = locked;

  setTimeout(() => {
    const target = overlay.querySelector(".auth-form:not(.hidden) input, .auth-form:not(.hidden) select");
    if (target) target.focus();
  }, 0);
}

function hideAuthOverlay() {
  if (!activeAccount) return;
  const overlay = $("#authOverlay");
  if (overlay) overlay.classList.add("hidden");
}

function refreshAccountWorkspace() {
  renderPairOptions(defaultPair);
  renderMarketChartOptions(marketChartPair);
  syncMarketChartControls();
  resetTradeForm();
  resetStrategyForm();
  render();
  renderTradingViewWidget();
  syncAccountUi();
}

function setActiveAccount(account, message = "") {
  activeAccount = account;
  safeSessionSet(storageKeys.activeAccount, account.id);
  loadAccountData();
  refreshAccountWorkspace();
  hideAuthOverlay();
  if (message) showToast(message);
}

function lockAccount(showMessage = true) {
  activeAccount = null;
  safeSessionRemove(storageKeys.activeAccount);
  resetAppData();
  refreshAccountWorkspace();
  showAuthOverlay(accounts.length ? "login" : "create", true);
  if (showMessage) showToast("Account locked.");
}

function initAccountSession() {
  const account = accountById(safeSessionGet(storageKeys.activeAccount));
  if (account) {
    activeAccount = account;
    loadAccountData();
  } else {
    resetAppData();
  }
}

async function handleCreateAccount(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = cleanAccountName(form.elements.name.value);
  const password = form.elements.password.value;
  const confirmPassword = form.elements.confirm.value;

  if (name.length < 2) {
    showToast("Use a longer account name.");
    return;
  }

  if (accountByName(name)) {
    showToast("That account name already exists.");
    return;
  }

  if (password.length < 4) {
    showToast("Use at least 4 password characters.");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match.");
    return;
  }

  const wasFirstAccount = accounts.length === 0;
  const salt = randomSalt();
  const account = {
    id: randomId(),
    name,
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };

  accounts = [...accounts, account];
  saveAccounts();
  if (wasFirstAccount && hasLegacyData()) migrateLegacyDataToAccount(account.id);
  form.reset();
  setActiveAccount(account, `Account ${name} is ready.`);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const account = accountById(form.elements.accountId.value);
  if (!account) {
    showToast("Create an account first.");
    setAuthMode("create");
    return;
  }

  const hash = await hashPasswordForAccount(form.elements.password.value, account);
  if (!timingSafeEqual(hash, account.passwordHash)) {
    showToast("Password is not correct.");
    form.elements.password.value = "";
    form.elements.password.focus();
    return;
  }

  form.reset();
  setActiveAccount(account, `Signed in as ${account.name}.`);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatR(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe >= 0 ? "" : "-"}${numberFormatter.format(Math.abs(safe))}R`;
}

function formatPercent(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${numberFormatter.format(safe)}%`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function analyticsRangeBounds(range = analyticsRange) {
  const today = new Date();
  const todayKey = localDateKey(today);
  if (range === "today") return { start: todayKey, end: todayKey };
  if (range === "thisWeek") return { start: localDateKey(startOfWeek(today)), end: todayKey };
  if (range === "thisMonth") return { start: `${todayKey.slice(0, 7)}-01`, end: todayKey };
  if (range === "last7") return { start: localDateKey(addDays(today, -6)), end: todayKey };
  if (range === "last30") return { start: localDateKey(addDays(today, -29)), end: todayKey };
  if (range === "last90") return { start: localDateKey(addDays(today, -89)), end: todayKey };
  if (range === "ytd") return { start: `${today.getFullYear()}-01-01`, end: todayKey };
  if (range === "custom") return { start: analyticsCustomStart, end: analyticsCustomEnd };
  return { start: "", end: "" };
}

function analyticsRangeName(range = analyticsRange) {
  const names = {
    all: "All trades",
    today: "Today",
    thisWeek: "This week",
    thisMonth: "This month",
    last7: "Last 7 days",
    last30: "Last 30 days",
    last90: "Last 90 days",
    ytd: "Year to date",
    custom: "Custom dates"
  };
  return names[range] || names.all;
}

function getAnalyticsTrades() {
  const { start, end } = analyticsRangeBounds();
  return trades.filter((trade) => {
    const date = String(trade.date || "").slice(0, 10);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

function updateAnalyticsScope(list) {
  const scope = $("#analyticsScope");
  if (!scope) return;
  const { start, end } = analyticsRangeBounds();
  const dateText = start || end ? `${start || "Start"} to ${end || "Latest"}` : "Full history";
  const net = sum(list, tradePl);
  scope.textContent = `${analyticsRangeName()} | ${dateText} | ${list.length} orders | ${currencyFormatter.format(net)}`;
}

function updateAnalyticsFilterControls() {
  const select = $("#analyticsRangeSelect");
  if (!select) return;
  select.value = analyticsRange;
  $("#analyticsStartDate").value = analyticsCustomStart;
  $("#analyticsEndDate").value = analyticsCustomEnd;
  $$(".custom-date-control").forEach((control) => {
    control.classList.toggle("hidden", analyticsRange !== "custom");
  });
}

function saveAnalyticsRange() {
  settings.analyticsRange = analyticsRange;
  settings.analyticsCustomStart = analyticsCustomStart;
  settings.analyticsCustomEnd = analyticsCustomEnd;
  saveSettings();
}

function tradingViewSymbolFromPair(pair) {
  const normalized = normalizePair(pair || defaultPair);
  const { base, quote } = parsePair(normalized);
  if (!base || !quote) return "PEPPERSTONE:XAUUSD";

  if (quote === "USDT") return `BINANCE:${base}USDT`;
  return `PEPPERSTONE:${base}${quote}`;
}

function tradingViewSymbolPageUrl(symbol) {
  const [exchange = "PEPPERSTONE", ticker = "XAUUSD"] = String(symbol || "PEPPERSTONE:XAUUSD").split(":");
  return `https://www.tradingview.com/symbols/${encodeURIComponent(ticker)}/?exchange=${encodeURIComponent(exchange)}`;
}

function syncMarketChartOverlay(symbol) {
  const overlay = $("#marketChartOverlay");
  if (!overlay) return;
  overlay.href = tradingViewSymbolPageUrl(symbol);
  overlay.setAttribute("aria-label", `Open ${symbol} on TradingView`);
}

function saveMarketChartSettings() {
  settings.marketChartPair = marketChartPair;
  settings.marketChartInterval = marketChartInterval;
  saveSettings();
}

function renderTradingViewWidget() {
  const shell = $("#tradingViewWidgetShell");
  if (!shell) return;
  const symbol = tradingViewSymbolFromPair(marketChartPair);
  shell.innerHTML = '<div class="tradingview-widget-container__widget" id="tradingViewWidget"></div><a class="market-chart-overlay" id="marketChartOverlay" target="_blank" rel="noopener noreferrer"></a>';
  syncMarketChartOverlay(symbol);
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
  script.async = true;
  script.text = JSON.stringify({
    symbol,
    width: "100%",
    height: "100%",
    locale: "en",
    dateRange: marketChartInterval,
    colorTheme: "light",
    trendLineColor: "rgba(15, 118, 110, 1)",
    underLineColor: "rgba(15, 118, 110, 0.2)",
    underLineBottomColor: "rgba(15, 118, 110, 0)",
    isTransparent: true,
    autosize: true,
    largeChartUrl: tradingViewSymbolPageUrl(symbol),
    chartOnly: false,
    noTimeScale: false
  });
  shell.appendChild(script);
}

function syncMarketChartControls() {
  renderMarketChartOptions(marketChartPair);
  const pairSelect = $("#marketChartPairSelect");
  const intervalSelect = $("#marketChartInterval");
  if (pairSelect) pairSelect.value = normalizePair(marketChartPair);
  if (intervalSelect) intervalSelect.value = marketChartInterval;
}

function getOutcome(resultR) {
  if (resultR > 0.001) return "win";
  if (resultR < -0.001) return "loss";
  return "be";
}

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
}

function parsePair(pair) {
  const normalized = String(pair || "")
    .trim()
    .toUpperCase()
    .replace("-", "/");

  if (normalized.includes("/")) {
    const [base, quote] = normalized.split("/");
    return { base: base || "", quote: quote || "" };
  }

  if (normalized.length === 6) {
    return { base: normalized.slice(0, 3), quote: normalized.slice(3) };
  }

  return { base: normalized, quote: "" };
}

function normalizePair(pair) {
  const { base, quote } = parsePair(pair);
  return quote ? `${base}/${quote}` : base;
}

function defaultPairOption(symbol) {
  const normalized = normalizePair(symbol);
  return defaultPairGroups
    .flatMap((group) => group.pairs)
    .find((pair) => pair.symbol === normalized);
}

function customPairOption(symbol) {
  const normalized = normalizePair(symbol);
  return customPairs.find((pair) => pair.symbol === normalized);
}

function isCustomPair(symbol) {
  return Boolean(customPairOption(symbol));
}

function defaultContractSize(pair) {
  const normalized = normalizePair(pair);
  const custom = customPairOption(normalized);
  if (custom) return custom.contractSize;
  if (contractSizeBySymbol[normalized]) return contractSizeBySymbol[normalized];
  const { base } = parsePair(pair);
  if (base === "BTC" || base === "ETH") return 1;
  return 100000;
}

function defaultPipSize(pair) {
  const { base, quote } = parsePair(pair);
  if (quote === "JPY") return 0.01;
  if (base === "XAU" || base === "XAG") return 0.01;
  if (base === "BTC" || base === "ETH") return 1;
  return 0.0001;
}

function priceInputTemplate(pair) {
  const { base, quote } = parsePair(pair);
  if (base === "XAU") {
    return { step: "0.01", entry: "2365.00", stop: "2355.00", target: "2385.00", exit: "2378.00" };
  }
  if (base === "XAG") {
    return { step: "0.001", entry: "28.450", stop: "28.150", target: "29.050", exit: "28.850" };
  }
  if (quote === "JPY") {
    return { step: "0.001", entry: "151.280", stop: "150.900", target: "152.040", exit: "151.950" };
  }
  if (base === "BTC" || base === "ETH") {
    return { step: "0.01", entry: "65000.00", stop: "64200.00", target: "66800.00", exit: "66100.00" };
  }
  return { step: "0.00001", entry: "1.08450", stop: "1.08150", target: "1.09100", exit: "1.08900" };
}

function updatePriceInputTemplate(pair) {
  const form = $("#tradeForm");
  if (!form) return;
  const template = priceInputTemplate(pair);
  ["entry", "stop", "target", "exit"].forEach((name) => {
    form.elements[name].step = template.step;
    form.elements[name].placeholder = template[name];
  });
}

function renderPairOptions(selectedPair = defaultPair) {
  const select = $("#pairSelect");
  if (!select) return;
  const selected = normalizePair(selectedPair || defaultPair);
  select.innerHTML = "";

  defaultPairGroups.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    group.pairs.forEach((pair) => {
      const option = document.createElement("option");
      option.value = pair.symbol;
      option.textContent = pair.label;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });

  if (customPairs.length) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = "Custom";
    customPairs
      .slice()
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .forEach((pair) => {
        const option = document.createElement("option");
        option.value = pair.symbol;
        option.textContent = `${pair.symbol} - ${numberFormatter.format(pair.contractSize)} contract`;
        optgroup.appendChild(option);
      });
    select.appendChild(optgroup);
  }

  const customOption = document.createElement("option");
  customOption.value = customPairValue;
  customOption.textContent = "Add custom pair...";
  select.appendChild(customOption);

  select.value = [...select.options].some((option) => option.value === selected) ? selected : defaultPair;
}

function appendPairOptions(select, includeAddOption = false) {
  if (!select) return;
  select.innerHTML = "";
  defaultPairGroups.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    group.pairs.forEach((pair) => {
      const option = document.createElement("option");
      option.value = pair.symbol;
      option.textContent = pair.label;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });

  if (customPairs.length) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = "Custom";
    customPairs
      .slice()
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .forEach((pair) => {
        const option = document.createElement("option");
        option.value = pair.symbol;
        option.textContent = `${pair.symbol} - ${numberFormatter.format(pair.contractSize)} contract`;
        optgroup.appendChild(option);
      });
    select.appendChild(optgroup);
  }

  if (includeAddOption) {
    const customOption = document.createElement("option");
    customOption.value = customPairValue;
    customOption.textContent = "Add custom pair...";
    select.appendChild(customOption);
  }
}

function renderMarketChartOptions(selectedPair = marketChartPair) {
  const select = $("#marketChartPairSelect");
  if (!select) return;
  const selected = normalizePair(selectedPair || defaultPair);
  appendPairOptions(select);
  select.value = [...select.options].some((option) => option.value === selected) ? selected : defaultPair;
}

function showCustomPairRow(visible) {
  const row = $("#customPairRow");
  if (!row) return;
  row.classList.toggle("hidden", !visible);
}

function syncPairTicket(pair) {
  const form = $("#tradeForm");
  if (!form) return;
  if (pair === customPairValue) {
    showCustomPairRow(true);
    form.elements.contractSize.readOnly = false;
    form.elements.contractSize.value = "";
    updateTradePreview();
    return;
  }

  const normalizedPair = normalizePair(pair || defaultPair);
  showCustomPairRow(false);
  updatePriceInputTemplate(normalizedPair);
  form.elements.contractSize.value = defaultContractSize(normalizedPair);
  form.elements.contractSize.readOnly = !isCustomPair(normalizedPair);
  updateTradePreview();
}

function addCustomPairFromForm() {
  const form = $("#tradeForm");
  const symbol = normalizePair(form.elements.customPair.value);
  const contractSize = parseOptionalNumber(form.elements.customContractSize.value);

  if (!symbol || symbol === customPairValue || !symbol.includes("/")) {
    showToast("Enter a pair like BTC/USD or ETH/USDT.");
    return;
  }

  if (!contractSize || contractSize <= 0) {
    showToast("Enter the contract size for one lot.");
    return;
  }

  if (defaultPairOption(symbol)) {
    showToast("That pair is already in the default list.");
    renderPairOptions(symbol);
    form.elements.pair.value = symbol;
    syncPairTicket(symbol);
    return;
  }

  const existing = customPairOption(symbol);
  if (existing) existing.contractSize = contractSize;
  else customPairs.push({ symbol, contractSize });

  saveCustomPairs();
  renderPairOptions(symbol);
  renderMarketChartOptions(marketChartPair);
  form.elements.pair.value = symbol;
  form.elements.customPair.value = "";
  form.elements.customContractSize.value = "";
  syncPairTicket(symbol);
  showToast(`${symbol} added.`);
}

function ensurePairAvailable(symbol, contractSize) {
  const normalized = normalizePair(symbol);
  if (!normalized || defaultPairOption(normalized)) return;
  const existing = customPairOption(normalized);
  const parsedContract = parseOptionalNumber(contractSize);
  if (existing) {
    if (parsedContract && parsedContract > 0) {
      existing.contractSize = parsedContract;
      saveCustomPairs();
    }
    return;
  }
  customPairs.push({
    symbol: normalized,
    contractSize: parsedContract || defaultContractSize(normalized)
  });
  saveCustomPairs();
}

function saveSelectedCustomContract() {
  const form = $("#tradeForm");
  const symbol = normalizePair(form.elements.pair.value);
  const custom = customPairOption(symbol);
  if (!custom) return;
  const contractSize = parseOptionalNumber(form.elements.contractSize.value);
  if (!contractSize || contractSize <= 0) return;
  custom.contractSize = contractSize;
  saveCustomPairs();
  renderPairOptions(symbol);
  renderMarketChartOptions(marketChartPair);
  form.elements.pair.value = symbol;
}

function defaultCommissionAmount(lotSize, commissionPerLot) {
  const lots = Math.max(parseOptionalNumber(lotSize) ?? 0, 0);
  const rate = Math.max(parseOptionalNumber(commissionPerLot) ?? settings.commissionPerLot, 0);
  const amount = roundNumber(-(lots * rate), 2);
  return Object.is(amount, -0) ? 0 : amount;
}

function syncCommissionDefault(force = false) {
  const form = $("#tradeForm");
  if (!form) return;
  const commissionInput = form.elements.commission;
  const shouldAutoFill = force || commissionInput.dataset.manual !== "true" || commissionInput.value === "";
  if (!shouldAutoFill) return;
  commissionInput.value = defaultCommissionAmount(form.elements.lotSize.value, form.elements.commissionPerLot.value).toFixed(2);
  commissionInput.dataset.manual = "";
}

function autoQuoteToUsdRate(pair, referencePrice) {
  const { base, quote } = parsePair(pair);
  if (!quote || quote === "USD") return 1;
  if (base === "USD" && referencePrice > 0) return 1 / referencePrice;
  if (quote === "JPY") return 0.0067;
  return 1;
}

function signedMove(direction, entry, price) {
  if (!Number.isFinite(entry) || !Number.isFinite(price)) return 0;
  return direction === "Buy" ? price - entry : entry - price;
}

function calculateTradeNumbers(values) {
  const pair = values.pair || "";
  const direction = values.direction || "Buy";
  const entry = parseOptionalNumber(values.entry);
  const stop = parseOptionalNumber(values.stop);
  const target = parseOptionalNumber(values.target);
  const exit = parseOptionalNumber(values.exit);
  const manualR = parseOptionalNumber(values.manualR);
  const lotSize = parseOptionalNumber(values.lotSize) ?? 0;
  const contractSize = parseOptionalNumber(values.contractSize) ?? defaultContractSize(pair);
  const referencePrice = exit ?? target ?? entry ?? 0;
  const quoteToAccountInput = parseOptionalNumber(values.quoteToAccount);
  const quoteToAccountRate = quoteToAccountInput ?? autoQuoteToUsdRate(pair, referencePrice);
  const pipSize = defaultPipSize(pair);
  const riskDistance = entry !== null && stop !== null ? Math.abs(entry - stop) : 0;
  const exitMove = entry !== null && exit !== null ? signedMove(direction, entry, exit) : 0;
  const targetMove = entry !== null && target !== null ? signedMove(direction, entry, target) : 0;
  const riskAmount = riskDistance * contractSize * lotSize * quoteToAccountRate;
  const actualPl = exitMove * contractSize * lotSize * quoteToAccountRate;
  const targetPl = targetMove * contractSize * lotSize * quoteToAccountRate;
  const actualR = riskDistance ? exitMove / riskDistance : 0;
  const targetR = riskDistance ? targetMove / riskDistance : 0;
  const resultR = manualR ?? actualR;

  return {
    lotSize,
    contractSize,
    quoteToAccount: quoteToAccountInput,
    quoteToAccountRate,
    pipSize,
    riskAmount,
    actualPl,
    targetPl,
    actualR,
    targetR,
    resultR,
    stopPips: pipSize ? riskDistance / pipSize : 0,
    actualPips: pipSize ? exitMove / pipSize : 0,
    targetPips: pipSize ? targetMove / pipSize : 0
  };
}

function tradePl(trade) {
  return tradePricePl(trade) + tradeFees(trade);
}

function tradePricePl(trade) {
  if (Number.isFinite(Number(trade.actualPl))) return toNumber(trade.actualPl);
  return toNumber(trade.risk) * toNumber(trade.resultR);
}

function tradeRiskAmount(trade) {
  if (Number.isFinite(Number(trade.riskAmount))) return toNumber(trade.riskAmount);
  return toNumber(trade.risk);
}

function tradeFees(trade) {
  return toNumber(trade.commission) + toNumber(trade.swap);
}

function periodKey(dateValue, period) {
  const value = String(dateValue || "").slice(0, 10);
  if (!value) return "";
  if (period === "year") return value.slice(0, 4);
  if (period === "month") return value.slice(0, 7);
  return value;
}

function periodLabel(key, period) {
  if (!key) return "";
  if (period === "year") return key;
  if (period === "month") {
    const date = new Date(`${key}-01T00:00:00`);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return formatDate(key);
}

function equitySeriesForPeriod(list, period) {
  const buckets = new Map();
  [...list]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((trade) => {
      const key = periodKey(trade.date, period);
      if (!key) return;
      const existing = buckets.get(key) || { key, periodR: 0, count: 0 };
      existing.periodR += toNumber(trade.resultR);
      existing.count += 1;
      buckets.set(key, existing);
    });

  let running = 0;
  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((bucket) => {
      running += bucket.periodR;
      return {
        ...bucket,
        label: periodLabel(bucket.key, period),
        value: running
      };
    });
}

function withCalculatedTrade(trade) {
  const contractSize = defaultContractSize(trade.pair);
  const calc = calculateTradeNumbers({
    pair: trade.pair,
    direction: trade.direction,
    entry: trade.entry,
    stop: trade.stop,
    target: trade.target,
    exit: trade.exit,
    lotSize: trade.lotSize,
    contractSize,
    quoteToAccount: trade.quoteToAccount,
    manualR: trade.manualR
  });
  const hasEntryStop = calc.stopPips > 0;
  const hasLot = calc.lotSize > 0 && calc.contractSize > 0;
  const resultR = hasEntryStop ? roundNumber(calc.resultR, 2) : toNumber(trade.resultR);
  const next = {
    ...trade,
    resultR,
    actualR: roundNumber(calc.actualR, 2),
    targetR: roundNumber(calc.targetR, 2),
    stopPips: roundNumber(calc.stopPips, 1),
    actualPips: roundNumber(calc.actualPips, 1),
    targetPips: roundNumber(calc.targetPips, 1)
  };

  if (hasLot) {
    next.lotSize = calc.lotSize;
    next.contractSize = contractSize;
    next.quoteToAccountRate = roundNumber(calc.quoteToAccountRate, 6);
    next.risk = roundNumber(calc.riskAmount, 2);
    next.riskAmount = roundNumber(calc.riskAmount, 2);
    next.actualPl = roundNumber(calc.actualPl, 2);
    next.targetPl = roundNumber(calc.targetPl, 2);
  }

  return next;
}

function groupBy(list, keyGetter) {
  return list.reduce((groups, item) => {
    const key = keyGetter(item) || "Unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

function sum(list, getter) {
  return list.reduce((total, item) => total + getter(item), 0);
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + (value - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function analyze(list) {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const wins = sorted.filter((trade) => trade.resultR > 0);
  const losses = sorted.filter((trade) => trade.resultR < 0);
  const grossProfit = sum(wins, (trade) => trade.resultR);
  const grossLoss = Math.abs(sum(losses, (trade) => trade.resultR));
  const netR = sum(sorted, (trade) => trade.resultR);
  const netPl = sum(sorted, tradePl);
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const resolvedTrades = wins.length + losses.length;
  const winRate = resolvedTrades ? (wins.length / resolvedTrades) * 100 : 0;
  const lossRate = resolvedTrades ? losses.length / resolvedTrades : 0;
  const expectancy = resolvedTrades ? (winRate / 100) * avgWin - lossRate * avgLoss : 0;

  let running = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const equity = sorted.map((trade) => {
    running += trade.resultR;
    peak = Math.max(peak, running);
    maxDrawdown = Math.min(maxDrawdown, running - peak);
    return { date: trade.date, value: running };
  });

  const avgDiscipline = sorted.length ? sum(sorted, (trade) => toNumber(trade.discipline)) / sorted.length : 0;
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0;

  const setupStats = aggregateBy(sorted, "setup");
  const sessionStats = aggregateBy(sorted, "session");
  const pairStats = aggregateBy(sorted, "pair");
  const mistakeStats = aggregateBy(sorted.filter((trade) => trade.mistake && trade.mistake !== "None"), "mistake");
  const profileStats = aggregateBy(sorted, (trade) => `${trade.setup} | ${trade.pair} | ${trade.session}`);

  return {
    count: sorted.length,
    wins: wins.length,
    losses: losses.length,
    netR,
    netPl,
    grossProfit,
    grossLoss,
    winRate,
    avgR: sorted.length ? netR / sorted.length : 0,
    avgWin,
    avgLoss,
    expectancy,
    profitFactor,
    maxDrawdown,
    avgDiscipline,
    equity,
    setupStats,
    sessionStats,
    pairStats,
    mistakeStats,
    profileStats
  };
}

function aggregateBy(list, key) {
  const getter = typeof key === "function" ? key : (item) => item[key];
  return Object.entries(groupBy(list, getter))
    .map(([name, items]) => {
      const wins = items.filter((trade) => trade.resultR > 0);
      const losses = items.filter((trade) => trade.resultR < 0);
      const netR = sum(items, (trade) => trade.resultR);
      const grossProfit = sum(wins, (trade) => trade.resultR);
      const grossLoss = Math.abs(sum(losses, (trade) => trade.resultR));
      const resolved = wins.length + losses.length;
      return {
        name,
        count: items.length,
        netR,
        avgR: items.length ? netR / items.length : 0,
        winRate: resolved ? (wins.length / resolved) * 100 : 0,
        profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0,
        discipline: items.length ? sum(items, (trade) => toNumber(trade.discipline)) / items.length : 0,
        items
      };
    })
    .sort((a, b) => b.avgR - a.avgR || b.count - a.count);
}

function aggregateCashBy(list, key) {
  const getter = typeof key === "function" ? key : (item) => item[key];
  return Object.entries(groupBy(list, getter))
    .map(([name, items]) => {
      const values = items.map(tradePl);
      const wins = values.filter((value) => value > 0);
      const losses = values.filter((value) => value < 0);
      const grossProfit = sum(wins, (value) => value);
      const grossLoss = Math.abs(sum(losses, (value) => value));
      const netPl = sum(values, (value) => value);
      const resolved = wins.length + losses.length;
      return {
        name,
        count: items.length,
        netPl,
        grossProfit,
        grossLoss,
        fees: sum(items, tradeFees),
        profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0,
        winRate: resolved ? (wins.length / resolved) * 100 : 0,
        avgPl: items.length ? netPl / items.length : 0,
        items
      };
    })
    .sort((a, b) => b.netPl - a.netPl || b.count - a.count);
}

function consecutiveCashStats(list) {
  let currentWins = 0;
  let currentLosses = 0;
  let currentProfit = 0;
  let currentLoss = 0;
  const stats = {
    maxWins: 0,
    maxLosses: 0,
    maxConsecutiveProfit: 0,
    maxConsecutiveLoss: 0
  };

  list.forEach((trade) => {
    const value = tradePl(trade);
    if (value > 0) {
      currentWins += 1;
      currentLosses = 0;
      currentProfit += value;
      currentLoss = 0;
    } else if (value < 0) {
      currentLosses += 1;
      currentWins = 0;
      currentLoss += value;
      currentProfit = 0;
    } else {
      currentWins = 0;
      currentLosses = 0;
      currentProfit = 0;
      currentLoss = 0;
    }
    stats.maxWins = Math.max(stats.maxWins, currentWins);
    stats.maxLosses = Math.max(stats.maxLosses, currentLosses);
    stats.maxConsecutiveProfit = Math.max(stats.maxConsecutiveProfit, currentProfit);
    stats.maxConsecutiveLoss = Math.min(stats.maxConsecutiveLoss, currentLoss);
  });

  return stats;
}

function cashDrawdown(list, startingBalance) {
  let balance = startingBalance;
  let peak = startingBalance;
  let maxDrawdown = 0;
  list.forEach((trade) => {
    balance += tradePl(trade);
    peak = Math.max(peak, balance);
    maxDrawdown = Math.min(maxDrawdown, balance - peak);
  });
  return maxDrawdown;
}

function tradesPerWeek(list) {
  if (!list.length) return 0;
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(`${sorted[0].date}T00:00:00`);
  const last = new Date(`${sorted[sorted.length - 1].date}T00:00:00`);
  const days = Math.max((last - first) / 86400000 + 1, 1);
  return list.length / Math.max(days / 7, 1);
}

function buildReportStats(list) {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const startingBalance = Math.max(toNumber(settings.startingBalance, 1000), 0);
  const values = sorted.map(tradePl);
  const priceValues = sorted.map(tradePricePl);
  const rValues = sorted.map((trade) => toNumber(trade.resultR));
  const grossProfitCash = sum(priceValues.filter((value) => value > 0), (value) => value);
  const grossLossCash = Math.abs(sum(priceValues.filter((value) => value < 0), (value) => value));
  const netPl = sum(values, (value) => value);
  const fees = sum(sorted, tradeFees);
  const commissions = sum(sorted, (trade) => toNumber(trade.commission));
  const swaps = sum(sorted, (trade) => toNumber(trade.swap));
  const balance = startingBalance + netPl;
  const maxDrawdownCash = cashDrawdown(sorted, startingBalance);
  const bestTrade = sorted.reduce((best, trade) => tradePl(trade) > tradePl(best || trade) ? trade : best, sorted[0] || null);
  const worstTrade = sorted.reduce((worst, trade) => tradePl(trade) < tradePl(worst || trade) ? trade : worst, sorted[0] || null);
  const consecutive = consecutiveCashStats(sorted);

  return {
    startingBalance,
    balance,
    netPl,
    grossProfitCash,
    grossLossCash,
    fees,
    commissions,
    swaps,
    gain: startingBalance ? (netPl / startingBalance) * 100 : 0,
    profitFactorCash: grossLossCash ? grossProfitCash / grossLossCash : grossProfitCash ? Infinity : 0,
    sharpeRatio: standardDeviation(rValues) ? (sum(rValues, (value) => value) / rValues.length / standardDeviation(rValues)) * Math.sqrt(rValues.length) : 0,
    recoveryFactor: maxDrawdownCash ? netPl / Math.abs(maxDrawdownCash) : netPl > 0 ? Infinity : 0,
    maxDrawdownCash,
    maxDrawdownPercent: startingBalance ? (Math.abs(maxDrawdownCash) / startingBalance) * 100 : 0,
    tradesPerWeek: tradesPerWeek(sorted),
    averagePl: sorted.length ? netPl / sorted.length : 0,
    bestTrade,
    worstTrade,
    consecutive,
    directions: aggregateCashBy(sorted, "direction"),
    symbols: aggregateCashBy(sorted, "pair")
  };
}

function qualityScore(strategy) {
  const fields = ["name", "market", "trigger", "invalidation", "riskRule", "management", "reviewRule"];
  const complete = fields.filter((field) => String(strategy[field] || "").trim().length > 8).length;
  return Math.round((complete / fields.length) * 100);
}

function readinessScore(stats) {
  const sampleScore = Math.min(stats.count / 50, 1) * 30;
  const disciplineScore = (stats.avgDiscipline / 100) * 25;
  const expectancyScore = stats.expectancy > 0 ? Math.min(stats.expectancy / 0.5, 1) * 25 : 0;
  const drawdownScore = stats.maxDrawdown > -6 ? 20 : Math.max(0, 20 + stats.maxDrawdown);
  return Math.round(sampleScore + disciplineScore + expectancyScore + drawdownScore);
}

function render() {
  const stats = analyze(trades);
  const analyticsTrades = getAnalyticsTrades();
  renderSummary(stats);
  renderFilters();
  renderTable();
  renderAnalytics(analyze(analyticsTrades), analyticsTrades);
  renderStrategies();
}

function renderSummary(stats) {
  $("#netR").textContent = formatR(stats.netR);
  $("#netPl").textContent = currencyFormatter.format(stats.netPl);
  $("#winRate").textContent = formatPercent(stats.winRate);
  $("#tradeCount").textContent = `${stats.count} ${stats.count === 1 ? "trade" : "trades"}`;
  $("#profitFactor").textContent = stats.profitFactor === Infinity ? "Perfect" : numberFormatter.format(stats.profitFactor);
  $("#avgR").textContent = `${formatR(stats.avgR)} average`;
  $("#drawdown").textContent = formatR(stats.maxDrawdown);
  $("#bestSetup").textContent = stats.setupStats[0] ? `${stats.setupStats[0].name} leads` : "No setup yet";

  const score = readinessScore(stats);
  $("#trackScore").textContent = `${score}%`;
  $("#trackFill").style.width = `${score}%`;
  $("#trackTrades").textContent = stats.count;
  $("#trackDiscipline").textContent = formatPercent(stats.avgDiscipline);
  $("#trackExpectancy").textContent = formatR(stats.expectancy);
}

function renderFilters() {
  const setupFilter = $("#setupFilter");
  const selected = setupFilter.value;
  const setups = [...new Set(trades.map((trade) => trade.setup).filter(Boolean))].sort();
  setupFilter.innerHTML = '<option value="all">All setups</option>';
  setups.forEach((setup) => {
    const option = document.createElement("option");
    option.value = setup;
    option.textContent = setup;
    setupFilter.appendChild(option);
  });
  setupFilter.value = setups.includes(selected) ? selected : "all";
}

function filteredTrades() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const outcome = $("#outcomeFilter").value;
  const setup = $("#setupFilter").value;

  return trades
    .filter((trade) => {
      const haystack = [
        trade.pair,
        trade.session,
        trade.direction,
        trade.setup,
        trade.mistake,
        trade.notes,
        ...(trade.tags || [])
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesOutcome = outcome === "all" || getOutcome(trade.resultR) === outcome;
      const matchesSetup = setup === "all" || trade.setup === setup;
      return matchesQuery && matchesOutcome && matchesSetup;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderTable() {
  const table = $("#tradeTable");
  const list = filteredTrades();
  table.innerHTML = "";
  $("#emptyJournal").classList.toggle("visible", list.length === 0);

  list.forEach((trade) => {
    const outcome = getOutcome(trade.resultR);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(trade.date)}</td>
      <td><strong>${escapeHtml(trade.pair)}</strong><br><small>${escapeHtml(trade.session)}</small></td>
      <td>${escapeHtml(trade.direction)}</td>
      <td>${escapeHtml(trade.setup)}</td>
      <td><span class="badge ${outcome}">${formatR(trade.resultR)}</span><br><small>Target ${formatR(toNumber(trade.targetR))}</small></td>
      <td>${currencyFormatter.format(tradePl(trade))}</td>
      <td>${formatPercent(toNumber(trade.discipline))}</td>
      <td>
        <div class="row-actions">
          <button class="mini-button" title="Edit trade" aria-label="Edit trade" data-action="edit" data-id="${trade.id}">
            ${iconMarkup("edit")}
          </button>
          <button class="mini-button danger" title="Delete trade" aria-label="Delete trade" data-action="delete" data-id="${trade.id}">
            ${iconMarkup("trash")}
          </button>
        </div>
      </td>
    `;
    table.appendChild(row);
  });
}

function renderAnalytics(stats, sourceTrades = getAnalyticsTrades()) {
  updateAnalyticsScope(sourceTrades);
  const equitySeries = equitySeriesForPeriod(sourceTrades, equityPeriod);
  const periodLabelText = equityPeriod.charAt(0).toUpperCase() + equityPeriod.slice(1);
  $("#expectancyPill").textContent = `${periodLabelText} view, ${formatR(stats.expectancy)} expectancy`;
  drawEquityChart(equitySeries, equityPeriod);
  renderInsights(stats, sourceTrades);
  renderLeaderboard("#setupLeaderboard", stats.setupStats, "setup");
  renderLeaderboard("#sessionBreakdown", stats.sessionStats, "session");
  renderLeaderboard("#mistakeBreakdown", stats.mistakeStats, "mistake");
  renderBestProfile(stats);
  renderPerformanceCharts(sourceTrades);
  renderReportAnalysis(sourceTrades);
}

function drawEquityChart(equity, period = "day") {
  const canvas = $("#equityChart");
  const context = canvas.getContext("2d");
  hideEquityTooltip();
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(rect.width, 320);
  const height = 320;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  context.fillStyle = "#fffefb";
  context.fillRect(0, 0, width, height);

  const padding = { top: 24, right: 24, bottom: 34, left: 46 };
  const chartData = [
    { label: "Start", value: 0, periodR: 0, count: 0, key: "" },
    ...equity.map((point) => ({
      ...point,
      label: point.label || periodLabel(point.key, period)
    }))
  ];
  const values = chartData.map((point) => point.value);
  const labels = chartData.map((point) => point.label);

  if (values.length < 2) {
    equityChartState = { points: [] };
    hideEquityTooltip();
    context.fillStyle = "#69736f";
    context.font = "14px Segoe UI, sans-serif";
    context.fillText("No equity curve yet", padding.left, height / 2);
    drawChartFrame(context, width, height, padding);
    return;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);
  const yMin = minValue - range * 0.15;
  const yMax = maxValue + range * 0.15;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = values.map((value, index) => {
    const x = padding.left + (chartWidth * index) / (values.length - 1);
    const y = padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
    return { ...chartData[index], x, y, value };
  });

  drawChartFrame(context, width, height, padding);

  context.strokeStyle = "#d9ded7";
  context.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartHeight * i) / 4;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.lineTo(points[points.length - 1].x, height - padding.bottom);
  context.lineTo(points[0].x, height - padding.bottom);
  context.closePath();
  context.fillStyle = "rgba(15, 118, 110, 0.12)";
  context.fill();

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.strokeStyle = "#0f766e";
  context.lineWidth = 3;
  context.stroke();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 3, 0, Math.PI * 2);
    context.fillStyle = point.value >= 0 ? "#0f766e" : "#be123c";
    context.fill();
  });

  context.fillStyle = "#69736f";
  context.font = "12px Segoe UI, sans-serif";
  context.fillText(formatR(yMax), 10, padding.top + 4);
  context.fillText(formatR(yMin), 10, height - padding.bottom);
  drawChartLabels(context, points, labels, height);
  equityChartState = { points, period, width, height };
}

function drawChartFrame(context, width, height, padding) {
  context.strokeStyle = "#d9ded7";
  context.lineWidth = 1;
  context.strokeRect(padding.left, padding.top, width - padding.left - padding.right, height - padding.top - padding.bottom);
}

function drawChartLabels(context, points, labels, height) {
  if (!points.length) return;
  const indexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  context.fillStyle = "#69736f";
  context.font = "12px Segoe UI, sans-serif";
  indexes.forEach((index) => {
    const point = points[index];
    const label = labels[index] || "";
    context.textAlign = index === 0 ? "left" : index === points.length - 1 ? "right" : "center";
    context.fillText(label, point.x, height - 10);
  });
  context.textAlign = "left";
}

function cashSeriesForPeriod(list, period) {
  const buckets = new Map();
  [...list]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((trade) => {
      const key = periodKey(trade.date, period);
      if (!key) return;
      const existing = buckets.get(key) || { key, value: 0, count: 0 };
      existing.value += tradePl(trade);
      existing.count += 1;
      buckets.set(key, existing);
    });

  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((bucket) => ({
      ...bucket,
      label: periodLabel(bucket.key, period)
    }));
}

function rDistributionData(list) {
  const bins = [
    { label: "< -2R", min: -Infinity, max: -2, value: 0 },
    { label: "-2 to -1R", min: -2, max: -1, value: 0 },
    { label: "-1 to 0R", min: -1, max: 0, value: 0 },
    { label: "0R", min: 0, max: 0, value: 0 },
    { label: "0 to 1R", min: 0, max: 1, value: 0 },
    { label: "1 to 2R", min: 1, max: 2, value: 0 },
    { label: "> 2R", min: 2, max: Infinity, value: 0 }
  ];

  list.forEach((trade) => {
    const value = toNumber(trade.resultR);
    const bin = bins.find((item) => {
      if (item.min === 0 && item.max === 0) return Math.abs(value) < 0.001;
      return value >= item.min && value < item.max;
    });
    if (bin) bin.value += 1;
  });

  return bins.map(({ label, value }) => ({
    label,
    value,
    count: value,
    detail: `${numberFormatter.format(value)} orders landed in this R bucket`
  }));
}

function renderPerformanceCharts(sourceTrades = getAnalyticsTrades()) {
  const report = buildReportStats(sourceTrades);
  const periodData = cashSeriesForPeriod(sourceTrades, equityPeriod).map((item) => ({
    ...item,
    detail: `${item.count} orders in this ${equityPeriod}`
  }));
  const pairData = report.symbols.slice(0, 8).map((item) => ({
    label: item.name,
    value: item.netPl,
    count: item.count,
    detail: `${item.count} orders, ${formatPercent(item.winRate)} win, PF ${formatFactor(item.profitFactor)}`
  }));
  const directionData = report.directions.map((item) => ({
    label: item.name,
    value: item.netPl,
    count: item.count,
    detail: `${item.count} orders, ${formatPercent(item.winRate)} win, ${currencyFormatter.format(item.avgPl)} avg`
  }));

  drawBarChart("periodPlChart", periodData, {
    formatter: (value) => currencyFormatter.format(value),
    empty: "No period P/L yet",
    valueLabel: "Net P/L"
  });
  drawBarChart("pairPlChart", pairData, {
    formatter: (value) => currencyFormatter.format(value),
    empty: "No pair P/L yet",
    valueLabel: "Net P/L"
  });
  drawBarChart("directionPlChart", directionData, {
    formatter: (value) => currencyFormatter.format(value),
    empty: "No long/short P/L yet",
    valueLabel: "Net P/L"
  });
  drawBarChart("rDistributionChart", rDistributionData(sourceTrades), {
    formatter: (value) => `${numberFormatter.format(value)} trades`,
    colorMode: "count",
    empty: "No R distribution yet",
    valueLabel: "Orders"
  });
}

function drawBarChart(canvasId, data, options = {}) {
  const canvas = $(`#${canvasId}`);
  if (!canvas) return;
  hideBarChartTooltip();
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(rect.width, 320);
  const height = Number(canvas.getAttribute("height")) || 260;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffefb";
  context.fillRect(0, 0, width, height);

  const cleanData = data.filter((item) => item && item.label);
  if (!cleanData.length || cleanData.every((item) => toNumber(item.value) === 0)) {
    barChartStates[canvasId] = { bars: [], options };
    context.fillStyle = "#69736f";
    context.font = "14px Segoe UI, sans-serif";
    context.fillText(options.empty || "No data yet", 18, height / 2);
    return;
  }

  const padding = { top: 24, right: 18, bottom: 54, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = cleanData.map((item) => toNumber(item.value));
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(maxValue - minValue, 1);
  const baseline = padding.top + chartHeight - ((0 - minValue) / range) * chartHeight;
  const barGap = 8;
  const barWidth = Math.max((chartWidth - barGap * (cleanData.length - 1)) / cleanData.length, 8);
  const bars = [];

  context.strokeStyle = "#d9ded7";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, baseline);
  context.lineTo(width - padding.right, baseline);
  context.stroke();

  cleanData.forEach((item, index) => {
    const value = toNumber(item.value);
    const x = padding.left + index * (barWidth + barGap);
    const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
    const top = Math.min(y, baseline);
    const barHeight = Math.max(Math.abs(baseline - y), 2);
    const isCount = options.colorMode === "count";
    context.fillStyle = isCount ? "#2563eb" : value >= 0 ? "#0f766e" : "#be123c";
    context.fillRect(x, top, barWidth, barHeight);
    bars.push({
      x,
      y: top,
      width: barWidth,
      height: barHeight,
      label: item.label,
      value,
      count: item.count ?? item.value ?? 0,
      detail: item.detail || "",
      raw: item
    });

    context.fillStyle = "#1f2826";
    context.font = "11px Segoe UI, sans-serif";
    context.textAlign = "center";
    const valueText = options.formatter ? options.formatter(value) : numberFormatter.format(value);
    context.fillText(valueText, x + barWidth / 2, Math.max(top - 6, 12));

    context.fillStyle = "#69736f";
    const label = String(item.label).length > 10 ? `${String(item.label).slice(0, 9)}...` : String(item.label);
    context.fillText(label, x + barWidth / 2, height - 20);
  });

  context.textAlign = "left";
  barChartStates[canvasId] = { bars, options };
}

function handleBarChartPointerMove(event) {
  const canvas = event.currentTarget;
  const state = barChartStates[canvas.id];
  const tooltip = $("#barChartTooltip");
  if (!state || !state.bars.length || !tooltip) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const bar = state.bars.find((item) => {
    const withinX = x >= item.x - 4 && x <= item.x + item.width + 4;
    const withinY = y >= Math.min(item.y, item.y + item.height) - 18 && y <= Math.max(item.y, item.y + item.height) + 18;
    return withinX && withinY;
  });

  if (!bar) {
    hideBarChartTooltip();
    return;
  }

  const formatter = state.options.formatter || ((value) => numberFormatter.format(value));
  const valueText = formatter(bar.value);
  const conclusion =
    state.options.colorMode === "count"
      ? "Distribution bucket for reviewing outcome quality."
      : bar.value > 0
        ? "Positive contribution in the selected period."
        : bar.value < 0
          ? "Negative contribution; review entries, exits, and mistakes."
          : "Flat contribution.";

  tooltip.innerHTML = `
    <strong>${escapeHtml(bar.label)}</strong>
    <p>${escapeHtml(state.options.valueLabel || "Value")}: ${escapeHtml(valueText)}</p>
    <p>${escapeHtml(bar.detail || `${numberFormatter.format(bar.count)} orders`)}</p>
    <p>${escapeHtml(conclusion)}</p>
  `;
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
  tooltip.classList.add("visible");
}

function hideBarChartTooltip() {
  const tooltip = $("#barChartTooltip");
  if (tooltip) tooltip.classList.remove("visible");
}

function handleEquityPointerMove(event) {
  const canvas = $("#equityChart");
  const tooltip = $("#equityTooltip");
  if (!canvas || !tooltip || !equityChartState.points.length) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const nearest = equityChartState.points.reduce((best, point) => {
    const distance = Math.hypot(point.x - x, point.y - y);
    return distance < best.distance ? { point, distance } : best;
  }, { point: null, distance: Infinity });

  if (!nearest.point || nearest.distance > 32) {
    hideEquityTooltip();
    return;
  }

  const point = nearest.point;
  const periodR = toNumber(point.periodR);
  const conclusion =
    point.count === 0
      ? "Starting point before recorded trades."
      : periodR > 0
        ? "Positive period; execution added edge."
        : periodR < 0
          ? "Negative period; review mistakes and setup quality."
          : "Flat period; no net R change.";

  tooltip.innerHTML = `
    <strong>${escapeHtml(point.label)}</strong>
    <p>${point.count || 0} trades, ${formatR(periodR)} this ${equityChartState.period}.</p>
    <p>Cumulative ${formatR(point.value)}. ${escapeHtml(conclusion)}</p>
  `;

  const horizontalEdge = Math.min(110, rect.width / 2);
  const tooltipX = Math.min(Math.max(point.x, horizontalEdge), rect.width - horizontalEdge);
  const tooltipY = Math.max(point.y, 80);
  tooltip.style.left = `${tooltipX}px`;
  tooltip.style.top = `${tooltipY}px`;
  tooltip.classList.add("visible");
}

function hideEquityTooltip() {
  const tooltip = $("#equityTooltip");
  if (tooltip) tooltip.classList.remove("visible");
}

function renderInsights(stats, sourceTrades = getAnalyticsTrades()) {
  const bestPair = stats.pairStats[0];
  const bestSession = stats.sessionStats[0];
  const worstMistake = [...stats.mistakeStats].sort((a, b) => a.netR - b.netR)[0];
  const disciplineLeak = sourceTrades.filter((trade) => toNumber(trade.discipline) < 60);
  const ideas = [];

  ideas.push({
    title: stats.expectancy > 0 ? "Positive expectancy" : "Expectancy needs proof",
    body: `${formatR(stats.expectancy)} per resolved trade across ${stats.count} trades.`
  });

  ideas.push({
    title: bestPair ? `Strongest pair: ${bestPair.name}` : "Pair edge",
    body: bestPair ? `${formatR(bestPair.avgR)} average across ${bestPair.count} trades.` : "Record more trades to compare pairs."
  });

  ideas.push({
    title: bestSession ? `Best session: ${bestSession.name}` : "Session edge",
    body: bestSession ? `${formatPercent(bestSession.winRate)} win rate with ${formatR(bestSession.netR)} total.` : "Log sessions to find timing quality."
  });

  ideas.push({
    title: worstMistake ? `Costliest leak: ${worstMistake.name}` : "Execution leaks",
    body: worstMistake ? `${formatR(worstMistake.netR)} total impact. Make this a pre-trade checklist item.` : "No recurring mistake logged."
  });

  ideas.push({
    title: "Discipline floor",
    body: `${disciplineLeak.length} trades scored below 60. Keep risk smallest when discipline drops.`
  });

  $("#insightList").innerHTML = ideas
    .map((idea) => `<article class="insight-item"><strong>${escapeHtml(idea.title)}</strong><p>${escapeHtml(idea.body)}</p></article>`)
    .join("");
}

function renderLeaderboard(selector, stats, type) {
  const container = $(selector);
  if (!stats.length) {
    container.innerHTML = `<div class="empty-state visible">No ${type} data.</div>`;
    return;
  }

  const topAbs = Math.max(...stats.map((item) => Math.abs(item.netR)), 1);
  container.innerHTML = stats
    .slice(0, 6)
    .map((item) => {
      const width = Math.min((Math.abs(item.netR) / topAbs) * 100, 100);
      const color = item.netR >= 0 ? "#0f766e" : "#be123c";
      return `
        <article class="leader-row">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${item.count} trades, ${formatPercent(item.winRate)} win, ${formatR(item.avgR)} avg</p>
          </div>
          <div class="leader-meta">${formatR(item.netR)}</div>
          <div class="leader-track"><div class="leader-fill" style="width: ${width}%; background: ${color};"></div></div>
        </article>
      `;
    })
    .join("");
}

function formatFactor(value) {
  if (value === Infinity) return "Perfect";
  return numberFormatter.format(value || 0);
}

function renderMetricRows(selector, rows) {
  const container = $(selector);
  if (!container) return;
  container.innerHTML = rows
    .map((row) => `<div class="metric-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`)
    .join("");
}

function renderCashLeaderboard(selector, stats, emptyLabel) {
  const container = $(selector);
  if (!container) return;
  if (!stats.length) {
    container.innerHTML = `<div class="empty-state visible">No ${emptyLabel} data.</div>`;
    return;
  }

  const topAbs = Math.max(...stats.map((item) => Math.abs(item.netPl)), 1);
  container.innerHTML = stats
    .slice(0, 6)
    .map((item) => {
      const width = Math.min((Math.abs(item.netPl) / topAbs) * 100, 100);
      const color = item.netPl >= 0 ? "#0f766e" : "#be123c";
      return `
        <article class="leader-row">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${item.count} trades, ${formatPercent(item.winRate)} win, PF ${formatFactor(item.profitFactor)}</p>
          </div>
          <div class="leader-meta">${currencyFormatter.format(item.netPl)}</div>
          <div class="leader-track"><div class="leader-fill" style="width: ${width}%; background: ${color};"></div></div>
        </article>
      `;
    })
    .join("");
}

function renderReportAnalysis(sourceTrades = getAnalyticsTrades()) {
  const report = buildReportStats(sourceTrades);
  const input = $("#startingBalanceInput");
  if (input && document.activeElement !== input) input.value = report.startingBalance || "";

  renderMetricRows("#reportSummary", [
    { label: "Gain", value: formatPercent(report.gain) },
    { label: "Balance", value: currencyFormatter.format(report.balance) },
    { label: "Profit Factor", value: formatFactor(report.profitFactorCash) },
    { label: "Sharpe Ratio", value: numberFormatter.format(report.sharpeRatio) },
    { label: "Recovery Factor", value: formatFactor(report.recoveryFactor) },
    { label: "Trades / Week", value: numberFormatter.format(report.tradesPerWeek) }
  ]);

  renderMetricRows("#reportProfitLoss", [
    { label: "Net P/L", value: currencyFormatter.format(report.netPl) },
    { label: "Gross Profit", value: currencyFormatter.format(report.grossProfitCash) },
    { label: "Gross Loss", value: currencyFormatter.format(-report.grossLossCash) },
    { label: "Average P/L", value: currencyFormatter.format(report.averagePl) },
    { label: "Commissions", value: currencyFormatter.format(report.commissions) },
    { label: "Swaps", value: currencyFormatter.format(report.swaps) }
  ]);

  renderCashLeaderboard("#reportLongShort", report.directions, "direction");
  renderCashLeaderboard("#reportSymbols", report.symbols, "symbol");

  renderMetricRows("#reportRisks", [
    { label: "Best Trade", value: report.bestTrade ? currencyFormatter.format(tradePl(report.bestTrade)) : currencyFormatter.format(0) },
    { label: "Worst Trade", value: report.worstTrade ? currencyFormatter.format(tradePl(report.worstTrade)) : currencyFormatter.format(0) },
    { label: "Max Drawdown", value: `${currencyFormatter.format(report.maxDrawdownCash)} (${formatPercent(report.maxDrawdownPercent)})` },
    { label: "Max Consec. Wins", value: String(report.consecutive.maxWins) },
    { label: "Max Consec. Losses", value: String(report.consecutive.maxLosses) },
    { label: "Max Consec. Profit", value: currencyFormatter.format(report.consecutive.maxConsecutiveProfit) },
    { label: "Max Consec. Loss", value: currencyFormatter.format(report.consecutive.maxConsecutiveLoss) }
  ]);
}

function renderBestProfile(stats) {
  const eligible = stats.profileStats.filter((item) => item.count >= 2);
  const profile = (eligible.length ? eligible : stats.profileStats)[0];
  const container = $("#bestProfile");

  if (!profile) {
    container.dataset.setup = "";
    container.dataset.pair = "";
    container.dataset.session = "";
    container.innerHTML = `
      <article class="profile-item"><strong>Setup</strong><p>No profile yet</p></article>
      <article class="profile-item"><strong>Sample</strong><p>0 trades</p></article>
      <article class="profile-item"><strong>Average</strong><p>0.00R</p></article>
      <article class="profile-item"><strong>Discipline</strong><p>0%</p></article>
    `;
    return;
  }

  const [setup, pair, session] = profile.name.split(" | ");
  container.dataset.setup = setup || "";
  container.dataset.pair = pair || "";
  container.dataset.session = session || "";
  container.innerHTML = `
    <article class="profile-item"><strong>Setup</strong><p>${escapeHtml(setup || profile.name)}</p></article>
    <article class="profile-item"><strong>Pair</strong><p>${escapeHtml(pair || "Any")}</p></article>
    <article class="profile-item"><strong>Session</strong><p>${escapeHtml(session || "Any")}</p></article>
    <article class="profile-item"><strong>Average</strong><p>${formatR(profile.avgR)}</p></article>
    <article class="profile-item"><strong>Sample</strong><p>${profile.count} trades</p></article>
    <article class="profile-item"><strong>Discipline</strong><p>${formatPercent(profile.discipline)}</p></article>
  `;
}

function renderStrategies() {
  const container = $("#strategyList");
  if (!strategies.length) {
    container.innerHTML = '<div class="empty-state visible">No strategies saved.</div>';
    return;
  }

  container.innerHTML = strategies
    .map((strategy) => {
      const score = qualityScore(strategy);
      return `
        <article class="strategy-item">
          <header>
            <div>
              <strong>${escapeHtml(strategy.name)}</strong>
              <p>${escapeHtml(strategy.market || "Market condition not set")}</p>
            </div>
            <div class="strategy-actions">
              <button class="mini-button" title="Edit strategy" aria-label="Edit strategy" data-strategy-action="edit" data-id="${strategy.id}">${iconMarkup("edit")}</button>
              <button class="mini-button danger" title="Delete strategy" aria-label="Delete strategy" data-strategy-action="delete" data-id="${strategy.id}">${iconMarkup("trash")}</button>
            </div>
          </header>
          <div class="quality-meter">
            <span>Rule quality ${score}%</span>
            <div class="quality-bar"><div class="quality-fill" style="width:${score}%"></div></div>
          </div>
          <p><strong>Trigger</strong> ${escapeHtml(strategy.trigger || "No trigger")}</p>
          <p><strong>Risk</strong> ${escapeHtml(strategy.riskRule || "No risk rule")}</p>
        </article>
      `;
    })
    .join("");
}

function readTradeForm() {
  const form = $("#tradeForm");
  const data = new FormData(form);
  const direction = data.get("direction");
  const calc = calculateTradeNumbers({
    pair: data.get("pair"),
    direction,
    entry: data.get("entry"),
    stop: data.get("stop"),
    target: data.get("target"),
    exit: data.get("exit"),
    lotSize: data.get("lotSize"),
    contractSize: data.get("contractSize"),
    quoteToAccount: data.get("quoteToAccount"),
    manualR: data.get("manualR")
  });

  return {
    id: data.get("id") || crypto.randomUUID(),
    date: data.get("date"),
    pair: normalizePair(data.get("pair")),
    session: data.get("session"),
    direction,
    setup: String(data.get("setup") || "").trim(),
    entry: parseOptionalNumber(data.get("entry")) ?? 0,
    stop: parseOptionalNumber(data.get("stop")) ?? 0,
    target: parseOptionalNumber(data.get("target")) ?? 0,
    exit: parseOptionalNumber(data.get("exit")) ?? 0,
    lotSize: calc.lotSize,
    contractSize: calc.contractSize,
    quoteToAccount: calc.quoteToAccount ?? "",
    quoteToAccountRate: roundNumber(calc.quoteToAccountRate, 6),
    manualR: parseOptionalNumber(data.get("manualR")) ?? "",
    risk: roundNumber(calc.riskAmount, 2),
    riskAmount: roundNumber(calc.riskAmount, 2),
    actualPl: roundNumber(calc.actualPl, 2),
    targetPl: roundNumber(calc.targetPl, 2),
    resultR: roundNumber(calc.resultR, 2),
    actualR: roundNumber(calc.actualR, 2),
    targetR: roundNumber(calc.targetR, 2),
    stopPips: roundNumber(calc.stopPips, 1),
    actualPips: roundNumber(calc.actualPips, 1),
    targetPips: roundNumber(calc.targetPips, 1),
    commissionPerLot: parseOptionalNumber(data.get("commissionPerLot")) ?? settings.commissionPerLot,
    commission: parseOptionalNumber(data.get("commission")) ?? 0,
    swap: parseOptionalNumber(data.get("swap")) ?? 0,
    mistake: data.get("mistake"),
    confidence: toNumber(data.get("confidence")),
    discipline: toNumber(data.get("discipline")),
    tags: String(data.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: String(data.get("notes") || "").trim()
  };
}

function fillTradeForm(trade) {
  const form = $("#tradeForm");
  ensurePairAvailable(trade.pair, trade.contractSize);
  renderPairOptions(trade.pair);
  form.elements.id.value = trade.id;
  form.elements.date.value = trade.date;
  form.elements.pair.value = normalizePair(trade.pair);
  if (!form.elements.pair.value) form.elements.pair.value = defaultPair;
  syncPairTicket(form.elements.pair.value);
  form.elements.session.value = trade.session;
  form.elements.setup.value = trade.setup;
  form.elements.entry.value = trade.entry || "";
  form.elements.stop.value = trade.stop || "";
  form.elements.target.value = trade.target || "";
  form.elements.exit.value = trade.exit || "";
  form.elements.lotSize.value = trade.lotSize || "";
  form.elements.contractSize.value = defaultContractSize(form.elements.pair.value);
  form.elements.quoteToAccount.value = trade.quoteToAccount || "";
  form.elements.manualR.value = trade.manualR || "";
  form.elements.commissionPerLot.value = trade.commissionPerLot || settings.commissionPerLot;
  form.elements.commission.dataset.manual = trade.commission === undefined ? "" : "true";
  form.elements.commission.value = trade.commission || "";
  form.elements.swap.value = trade.swap || "";
  form.elements.mistake.value = trade.mistake || "None";
  form.elements.confidence.value = trade.confidence || 60;
  form.elements.discipline.value = trade.discipline || 70;
  form.elements.tags.value = (trade.tags || []).join(", ");
  form.elements.notes.value = trade.notes || "";
  setSegment("direction", trade.direction || "Buy");
  updateSliderOutputs();
  updateTradePreview();
  $("#saveTradeBtn").innerHTML = `${iconMarkup("save")} Update Trade`;
}

function resetTradeForm() {
  const form = $("#tradeForm");
  form.reset();
  form.elements.id.value = "";
  form.elements.date.value = new Date().toISOString().slice(0, 10);
  form.elements.pair.value = defaultPair;
  syncPairTicket(defaultPair);
  form.elements.commissionPerLot.value = settings.commissionPerLot;
  form.elements.commission.dataset.manual = "";
  form.elements.swap.value = 0;
  syncCommissionDefault(true);
  form.elements.confidence.value = 60;
  form.elements.discipline.value = 70;
  setSegment("direction", "Buy");
  updateSliderOutputs();
  updateTradePreview();
  $("#saveTradeBtn").innerHTML = `${iconMarkup("save")} Save Trade`;
}

function readStrategyForm() {
  const form = $("#strategyForm");
  const data = new FormData(form);
  return {
    id: data.get("id") || crypto.randomUUID(),
    name: String(data.get("name") || "").trim(),
    market: String(data.get("market") || "").trim(),
    trigger: String(data.get("trigger") || "").trim(),
    invalidation: String(data.get("invalidation") || "").trim(),
    riskRule: String(data.get("riskRule") || "").trim(),
    management: String(data.get("management") || "").trim(),
    reviewRule: String(data.get("reviewRule") || "").trim(),
    updatedAt: new Date().toISOString()
  };
}

function fillStrategyForm(strategy) {
  const form = $("#strategyForm");
  Object.entries(strategy).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
}

function resetStrategyForm() {
  $("#strategyForm").reset();
  $("#strategyForm").elements.id.value = "";
}

function setSegment(field, value) {
  const root = document.querySelector(`.segmented[data-field="${field}"]`);
  if (!root) return;
  root.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.value === value);
  });
  const input = document.querySelector(`input[name="${field}"]`);
  if (input) input.value = value;
  if (field === "direction") updateTradePreview();
}

function updateSliderOutputs() {
  $("#confidenceOut").textContent = $("#tradeForm").elements.confidence.value;
  $("#disciplineOut").textContent = $("#tradeForm").elements.discipline.value;
}

function updateTradePreview() {
  const form = $("#tradeForm");
  if (!form) return;
  syncCommissionDefault();

  const calc = calculateTradeNumbers({
    pair: form.elements.pair.value,
    direction: form.elements.direction.value,
    entry: form.elements.entry.value,
    stop: form.elements.stop.value,
    target: form.elements.target.value,
    exit: form.elements.exit.value,
    lotSize: form.elements.lotSize.value,
    contractSize: form.elements.contractSize.value,
    quoteToAccount: form.elements.quoteToAccount.value,
    manualR: form.elements.manualR.value
  });

  $("#previewActualR").textContent = formatR(calc.actualR);
  $("#previewTargetR").textContent = formatR(calc.targetR);
  $("#previewRisk").textContent = currencyFormatter.format(calc.riskAmount);
  $("#previewTargetPl").textContent = currencyFormatter.format(calc.targetPl);
  const fees = toNumber(form.elements.commission.value) + toNumber(form.elements.swap.value);
  $("#previewActualPl").textContent = currencyFormatter.format(calc.actualPl + fees);
  $("#previewPips").textContent = `${numberFormatter.format(calc.actualPips)} / ${numberFormatter.format(calc.targetPips)}`;

  const { base, quote } = parsePair(form.elements.pair.value);
  const quoteText = quote ? `${quote}->USD ${rateFormatter.format(calc.quoteToAccountRate)}` : "Quote->USD 1";
  const pairText = base && quote ? `${base}/${quote}` : "pair";
  $("#previewFormula").textContent =
    `${pairText}: ${numberFormatter.format(calc.lotSize)} lot x ${numberFormatter.format(calc.contractSize)} contract, ` +
    `${quoteText}. Stop ${numberFormatter.format(calc.stopPips)} pips, target ${numberFormatter.format(calc.targetPips)} pips, fees ${currencyFormatter.format(fees)}.`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const headers = [
    "date",
    "pair",
    "session",
    "direction",
    "setup",
    "entry",
    "stop",
    "target",
    "exit",
    "lotSize",
    "contractSize",
    "quoteToAccount",
    "quoteToAccountRate",
    "risk",
    "riskAmount",
    "actualPl",
    "targetPl",
    "resultR",
    "actualR",
    "targetR",
    "stopPips",
    "actualPips",
    "targetPips",
    "manualR",
    "commissionPerLot",
    "commission",
    "swap",
    "mistake",
    "confidence",
    "discipline",
    "tags",
    "notes"
  ];
  const rows = trades.map((trade) =>
    headers
      .map((header) => {
        const value = Array.isArray(trade[header]) ? trade[header].join("; ") : trade[header] ?? "";
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  downloadFile("fx-trades.csv", [headers.join(","), ...rows].join("\n"), "text/csv");
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.trades)) throw new Error("Invalid import file");
      if (Array.isArray(parsed.customPairs)) {
        parsed.customPairs.forEach((pair) => ensurePairAvailable(pair.symbol, pair.contractSize));
      }
      if (parsed.settings && typeof parsed.settings === "object") {
        Object.assign(settings, parsed.settings);
        saveSettings();
      }
      parsed.trades.forEach((trade) => ensurePairAvailable(trade.pair, trade.contractSize));
      trades = parsed.trades.map((trade) =>
        withCalculatedTrade({
          ...trade,
          id: trade.id || crypto.randomUUID(),
          resultR: toNumber(trade.resultR),
          risk: toNumber(trade.risk)
        })
      );
      strategies = Array.isArray(parsed.strategies) ? parsed.strategies : strategies;
      saveTrades();
      saveStrategies();
      renderPairOptions(defaultPair);
      renderMarketChartOptions(marketChartPair);
      render();
      showToast("Import complete.");
    } catch (error) {
      showToast("Import failed. Use a JSON export from this app.");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function iconMarkup(name) {
  const icons = {
    edit: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M9 11v6M15 11v6M6 6l1 15h10l1-15"/></svg>',
    save: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM7 21v-8h10v8M7 3v5h8"/></svg>'
  };
  return icons[name] || "";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function bindEvents() {
  const switchAccountButton = $("#switchAccountBtn");
  if (switchAccountButton) {
    switchAccountButton.addEventListener("click", () => {
      showAuthOverlay(accounts.length ? "login" : "create", false);
    });
  }

  const logoutAccountButton = $("#logoutAccountBtn");
  if (logoutAccountButton) logoutAccountButton.addEventListener("click", () => lockAccount());

  const closeAuthButton = $("#closeAuthBtn");
  if (closeAuthButton) closeAuthButton.addEventListener("click", hideAuthOverlay);

  $$(".auth-tabs .segment").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  const loginForm = $("#loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const createAccountForm = $("#createAccountForm");
  if (createAccountForm) createAccountForm.addEventListener("submit", handleCreateAccount);

  const authOverlay = $("#authOverlay");
  if (authOverlay) {
    authOverlay.addEventListener("pointerdown", (event) => {
      if (event.target === authOverlay && activeAccount) hideAuthOverlay();
    });
  }

  $$(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      $$(".view").forEach((view) => view.classList.remove("active"));
      $(`#${button.dataset.view}View`).classList.add("active");
      $("#viewTitle").textContent = button.textContent.trim();
      render();
    });
  });

  $$(".segmented").forEach((root) => {
    root.addEventListener("click", (event) => {
      const button = event.target.closest(".segment");
      if (!button) return;
      if (button.dataset.period) return;
      if (button.dataset.authMode) return;
      setSegment(root.dataset.field, button.dataset.value);
    });
  });

  $$(".chart-period .segment").forEach((button) => {
    button.addEventListener("click", () => {
      equityPeriod = button.dataset.period || "day";
      $$(".chart-period .segment").forEach((segment) => segment.classList.remove("active"));
      button.classList.add("active");
      const analyticsTrades = getAnalyticsTrades();
      renderAnalytics(analyze(analyticsTrades), analyticsTrades);
    });
  });

  $("#equityChart").addEventListener("pointermove", handleEquityPointerMove);
  $("#equityChart").addEventListener("pointerleave", hideEquityTooltip);
  ["periodPlChart", "pairPlChart", "directionPlChart", "rDistributionChart"].forEach((id) => {
    const canvas = $(`#${id}`);
    if (!canvas) return;
    canvas.addEventListener("pointermove", handleBarChartPointerMove);
    canvas.addEventListener("pointerleave", hideBarChartTooltip);
  });

  updateAnalyticsFilterControls();
  $("#analyticsRangeSelect").addEventListener("change", (event) => {
    analyticsRange = event.target.value || "all";
    saveAnalyticsRange();
    updateAnalyticsFilterControls();
    render();
  });
  $("#analyticsStartDate").addEventListener("input", (event) => {
    analyticsCustomStart = event.target.value;
    saveAnalyticsRange();
    render();
  });
  $("#analyticsEndDate").addEventListener("input", (event) => {
    analyticsCustomEnd = event.target.value;
    saveAnalyticsRange();
    render();
  });

  syncMarketChartControls();
  $("#marketChartPairSelect").addEventListener("change", (event) => {
    marketChartPair = normalizePair(event.target.value || defaultPair);
    saveMarketChartSettings();
    renderTradingViewWidget();
  });
  $("#marketChartInterval").addEventListener("change", (event) => {
    marketChartInterval = event.target.value || "1D";
    if (!marketChartRanges.includes(marketChartInterval)) marketChartInterval = "1D";
    saveMarketChartSettings();
    renderTradingViewWidget();
  });
  const reloadButton = $("#reloadMarketChartBtn");
  if (reloadButton) reloadButton.addEventListener("click", renderTradingViewWidget);

  $("#tradeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if ($("#tradeForm").elements.pair.value === customPairValue) {
      showToast("Add the custom pair before saving the trade.");
      return;
    }
    const trade = readTradeForm();
    const index = trades.findIndex((item) => item.id === trade.id);
    if (index >= 0) trades[index] = trade;
    else trades.push(trade);
    saveTrades();
    resetTradeForm();
    render();
    showToast("Trade saved.");
  });

  $("#strategyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const strategy = readStrategyForm();
    const index = strategies.findIndex((item) => item.id === strategy.id);
    if (index >= 0) strategies[index] = strategy;
    else strategies.push(strategy);
    saveStrategies();
    resetStrategyForm();
    renderStrategies();
    showToast("Strategy saved.");
  });

  $("#tradeTable").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const trade = trades.find((item) => item.id === button.dataset.id);
    if (!trade) return;

    if (button.dataset.action === "edit") {
      fillTradeForm(trade);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (button.dataset.action === "delete" && confirm("Delete this trade?")) {
      trades = trades.filter((item) => item.id !== trade.id);
      saveTrades();
      render();
      showToast("Trade deleted.");
    }
  });

  $("#strategyList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-strategy-action]");
    if (!button) return;
    const strategy = strategies.find((item) => item.id === button.dataset.id);
    if (!strategy) return;

    if (button.dataset.strategyAction === "edit") {
      fillStrategyForm(strategy);
    }

    if (button.dataset.strategyAction === "delete" && confirm("Delete this strategy?")) {
      strategies = strategies.filter((item) => item.id !== strategy.id);
      saveStrategies();
      renderStrategies();
      showToast("Strategy deleted.");
    }
  });

  ["searchInput", "outcomeFilter", "setupFilter"].forEach((id) => {
    $(`#${id}`).addEventListener("input", renderTable);
  });

  const form = $("#tradeForm");
  ["pair", "entry", "stop", "target", "exit", "lotSize", "quoteToAccount", "manualR", "commissionPerLot", "commission", "swap"].forEach((name) => {
    const handler = () => {
      if (name === "pair") {
        syncPairTicket(form.elements.pair.value);
        return;
      }
      if (name === "commission") {
        form.elements.commission.dataset.manual = "true";
      }
      if (name === "commissionPerLot") {
        settings.commissionPerLot = Math.max(toNumber(form.elements.commissionPerLot.value, 0), 0);
        saveSettings();
      }
      updateTradePreview();
    };
    form.elements[name].addEventListener("input", handler);
    form.elements[name].addEventListener("change", handler);
  });

  form.elements.contractSize.addEventListener("input", () => {
    saveSelectedCustomContract();
    updateTradePreview();
  });
  form.elements.contractSize.addEventListener("change", () => {
    saveSelectedCustomContract();
    updateTradePreview();
  });
  $("#addPairBtn").addEventListener("click", addCustomPairFromForm);

  $("#startingBalanceInput").addEventListener("input", (event) => {
    settings.startingBalance = toNumber(event.target.value, 0);
    saveSettings();
    renderReportAnalysis(getAnalyticsTrades());
  });

  $("#tradeForm").elements.confidence.addEventListener("input", updateSliderOutputs);
  $("#tradeForm").elements.discipline.addEventListener("input", updateSliderOutputs);
  $("#resetTradeBtn").addEventListener("click", resetTradeForm);
  $("#resetStrategyBtn").addEventListener("click", resetStrategyForm);

  $("#clearBtn").addEventListener("click", () => {
    if (!trades.length) return;
    if (confirm("Clear all trades?")) {
      trades = [];
      saveTrades();
      resetTradeForm();
      render();
      showToast("Trade journal cleared.");
    }
  });

  $("#demoBtn").addEventListener("click", () => {
    const existingIds = new Set(trades.map((trade) => trade.id));
    const freshDemoTrades = demoTrades
      .filter((trade) => !existingIds.has(trade.id))
      .map((trade) =>
        withCalculatedTrade({
          ...trade,
          lotSize: trade.lotSize || 0.1,
          contractSize: trade.contractSize || defaultContractSize(trade.pair)
        })
      );
    trades = [...trades, ...freshDemoTrades];
    saveTrades();
    render();
    showToast("Demo trades loaded.");
  });

  $("#exportJsonBtn").addEventListener("click", () => {
    const content = JSON.stringify({ trades, strategies, customPairs, settings, exportedAt: new Date().toISOString() }, null, 2);
    downloadFile("fx-edge-journal.json", content, "application/json");
  });

  $("#exportCsvBtn").addEventListener("click", exportCsv);
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importJson(file);
    event.target.value = "";
  });

  $("#useProfileBtn").addEventListener("click", () => {
    const profile = $("#bestProfile").dataset;
    if (!profile.setup) {
      showToast("Record trades before creating a profile strategy.");
      return;
    }
    const form = $("#strategyForm");
    form.elements.name.value = `${profile.session} ${profile.pair} ${profile.setup}`.trim();
    form.elements.market.value = `${profile.pair} during ${profile.session}`;
    form.elements.trigger.value = profile.setup;
    form.elements.reviewRule.value = "Compare execution with the best trade profile after every trade.";
    document.querySelector('[data-view="strategy"]').click();
    showToast("Profile copied into the strategy builder.");
  });

  window.addEventListener("resize", () => {
    const analyticsTrades = getAnalyticsTrades();
    renderAnalytics(analyze(analyticsTrades), analyticsTrades);
  });
}

function bootstrap() {
  initAccountSession();
  renderPairOptions(defaultPair);
  renderMarketChartOptions(marketChartPair);
  bindEvents();
  resetTradeForm();
  render();
  renderTradingViewWidget();
  syncAccountUi();
  if (!activeAccount) {
    showAuthOverlay(accounts.length ? "login" : "create", true);
  }
  registerServiceWorker();
}

bootstrap();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // Some local file and non-secure hosts do not allow service workers.
  });
}
