const storageKeys = {
  trades: "fx-edge-journal.trades.v1",
  strategies: "fx-edge-journal.strategies.v1",
  customPairs: "fx-edge-journal.custom-pairs.v1",
  settings: "fx-edge-journal.settings.v1",
  accounts: "fx-edge-journal.accounts.v1",
  activeAccount: "fx-edge-journal.active-account.v1",
  legacyMigrated: "fx-edge-journal.legacy-migrated.v1",
  cloudClientId: "fx-edge-journal.cloud-client-id.v1"
};

const defaultPair = "XAU/USD";
const customPairValue = "__add_custom_pair__";
const supabaseConfig = {
  url: "https://lzaetartgfejsnwpiezc.supabase.co",
  publishableKey: "sb_publishable_bfsaovSh71BLeqp7CNQw8Q_Jkg3U4N3"
};
const cloudProfileTable = "journal_profiles";
const mt5TokenTable = "mt5_bridge_tokens";
const mt5OrderTable = "mt5_detected_orders";
const mt5HistoryRequestTable = "mt5_history_requests";
let equityPeriod = "day";
let equityChartState = { points: [] };
let barChartStates = {};
let chartTouchHideTimer = null;
let analyticsResizeTimer = null;
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
accounts = accounts.filter((account) => account?.id && account?.name && (canLocalSignIn(account) || account?.cloudUserId));
let activeAccount = null;
let customPairs = [];
let settings = { ...defaultSettings };
let trades = [];
let tradeSort = { key: "datetime", direction: "desc" };
let strategies = [];
let supabaseClient = null;
let cloudSession = null;
let cloudUser = null;
let cloudSubscription = null;
let mt5OrderSubscription = null;
let cloudSaveTimer = null;
let isApplyingCloudSnapshot = false;
let cloudClientId = "";
let mt5DetectedOrders = [];
let mt5InboxState = { kind: "idle", message: "" };
let mt5RealtimeHiddenKeys = new Set();
let pendingMt5OrderId = "";
let latestMt5BridgeSetup = "";
let mt5HistoryReviewRange = { active: false, start: "", end: "" };
let cloudSyncState = {
  label: "Local",
  detail: "Use email/password to sync this journal between iPhone and PC.",
  tone: "muted"
};

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
  queueCloudSave("trades");
}

function saveStrategies() {
  localStorage.setItem(accountScopedKey(storageKeys.strategies), JSON.stringify(strategies));
  queueCloudSave("strategies");
}

function saveCustomPairs() {
  localStorage.setItem(accountScopedKey(storageKeys.customPairs), JSON.stringify(customPairs));
  queueCloudSave("pairs");
}

function saveSettings() {
  localStorage.setItem(accountScopedKey(storageKeys.settings), JSON.stringify(settings));
  queueCloudSave("settings");
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

function canLocalSignIn(account) {
  return Boolean(account?.salt && account?.passwordHash);
}

function isCloudAccount(account) {
  return Boolean(account?.cloudUserId);
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
  syncCloudUi();
}

function populateAccountSelect() {
  const select = $("#loginAccountSelect");
  if (!select) return;
  select.innerHTML = "";
  const localAccounts = accounts.filter(canLocalSignIn);

  if (!localAccounts.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Create a local profile first";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  localAccounts.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = account.name;
    select.appendChild(option);
  });

  const selectedId = canLocalSignIn(activeAccount)
    ? activeAccount.id
    : safeSessionGet(storageKeys.activeAccount) || localAccounts[0].id;
  select.value = localAccounts.some((account) => account.id === selectedId) ? selectedId : localAccounts[0].id;
}

function setAuthMode(mode = "login") {
  const localAccounts = accounts.filter(canLocalSignIn);
  const resolved = mode === "login" && !localAccounts.length ? (supabaseClient ? "cloud" : "create") : mode;
  $$(".auth-tabs .segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === resolved);
  });
  const cloudForm = $("#cloudAuthForm");
  const loginForm = $("#loginForm");
  const createForm = $("#createAccountForm");
  if (cloudForm) cloudForm.classList.toggle("hidden", resolved !== "cloud");
  if (loginForm) loginForm.classList.toggle("hidden", resolved !== "login");
  if (createForm) createForm.classList.toggle("hidden", resolved !== "create");
  const title = $("#authTitle");
  const eyebrow = $("#authEyebrow");
  if (title) {
    title.textContent = resolved === "cloud"
      ? "Cloud Sync"
      : resolved === "create"
        ? "Create Account"
        : "Open Account";
  }
  if (eyebrow) eyebrow.textContent = resolved === "cloud" ? "Supabase account" : "Local profiles";
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
  showAuthOverlay(accounts.some(canLocalSignIn) ? "login" : "cloud", true);
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
  if (!account || !canLocalSignIn(account)) {
    showToast("Create a local profile first.");
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

function ensureCloudClientId() {
  if (cloudClientId) return cloudClientId;
  cloudClientId = localStorage.getItem(storageKeys.cloudClientId);
  if (!cloudClientId) {
    cloudClientId = randomId("cloud-client");
    localStorage.setItem(storageKeys.cloudClientId, cloudClientId);
  }
  return cloudClientId;
}

function isActiveCloudProfile() {
  return Boolean(activeAccount?.cloudUserId && cloudUser?.id && activeAccount.cloudUserId === cloudUser.id);
}

function friendlyCloudError(error) {
  const message = String(error?.message || error || "Cloud sync failed.");
  const lower = message.toLowerCase();
  if (
    error?.code === "42P01"
    || lower.includes("relation")
    || lower.includes(cloudProfileTable)
    || lower.includes(mt5TokenTable)
    || lower.includes(mt5OrderTable)
  ) {
    return "Run supabase-schema.sql in Supabase SQL Editor first.";
  }
  if (lower.includes("invalid login credentials")) return "Email or password is not correct.";
  if (lower.includes("fetch")) return "Supabase is unreachable. Check internet and the project URL.";
  return message;
}

async function sha256Hex(value) {
  const text = String(value || "");
  if (globalThis.crypto?.subtle && globalThis.TextEncoder) {
    const data = new TextEncoder().encode(text);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(digest));
  }
  return fallbackHash(text);
}

function randomToken(prefix = "fxej") {
  const cryptoApi = globalThis.crypto;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let body = "";
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(36);
    cryptoApi.getRandomValues(bytes);
    body = Array.from(bytes).map((byte) => alphabet[byte % alphabet.length]).join("");
  } else {
    body = `${Date.now()}${Math.random()}`.replace(/\D/g, "").padEnd(36, "0").slice(0, 36);
  }
  return `${prefix}_${body}`;
}

function mt5WebhookUrl() {
  return `${supabaseConfig.url.replace(/\/$/, "")}/functions/v1/mt5-closed-order`;
}

function mt5MobilePayloadTemplate() {
  return JSON.stringify({
    source: "mt5-mobile",
    client_platform: "ios-or-android",
    external_id: "account-position-closeTicket",
    broker_account: "12345678",
    broker_server: "Broker-Live",
    symbol: "XAUUSD",
    direction: "Buy",
    open_time: "2026-05-06T09:20:00+07:00",
    close_time: "2026-05-06T10:05:00+07:00",
    lot_size: 0.1,
    entry_price: 2320.15,
    exit_price: 2328.4,
    stop_loss: 2314.0,
    take_profit: 2332.0,
    profit: 82.5,
    commission: -0.7,
    swap: 0
  }, null, 2);
}

function mt5BridgeSetupText(token, source = "desktop") {
  if (source === "mobile") {
    return [
      `WebhookUrl=${mt5WebhookUrl()}`,
      `BridgeToken=${token}`,
      `Authorization=Bearer ${token}`,
      "Content-Type=application/json",
      "MobileEngine=iOS Shortcuts or Android HTTP Request",
      "RealtimeTarget=Detected Closed Positions inbox",
      "JSON payload:",
      mt5MobilePayloadTemplate()
    ].join("\n");
  }

  return [
    `WebhookUrl=${mt5WebhookUrl()}`,
    `BridgeToken=${token}`,
    "MT5 Allow URL=https://lzaetartgfejsnwpiezc.supabase.co"
  ].join("\n");
}

function withCloudTimeout(task, message = "Cloud request timed out. Check Supabase connection and try again.", timeoutMs = 45000) {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([Promise.resolve(task), timeout]).finally(() => clearTimeout(timerId));
}

function setMt5InboxState(kind = "idle", message = "") {
  mt5InboxState = { kind, message };
  renderMt5Inbox();
}

function setCloudStatus(label, detail = "", tone = "muted") {
  cloudSyncState = { label, detail, tone };
  syncCloudUi();
}

function syncCloudUi() {
  const status = $("#cloudSyncStatus");
  if (status) {
    status.textContent = cloudSyncState.label;
    status.className = `sync-badge ${cloudSyncState.tone || "muted"}`;
  }

  const note = $("#cloudNote");
  if (note) note.textContent = cloudSyncState.detail || "Use email/password to sync this journal between iPhone and PC.";

  const signedIn = Boolean(cloudUser);
  const authButton = $("#openCloudAuthBtn");
  if (authButton) authButton.hidden = signedIn;

  const sessionPanel = $("#cloudSessionPanel");
  if (sessionPanel) sessionPanel.classList.toggle("hidden", !signedIn);

  const email = $("#cloudEmail");
  if (email) email.textContent = signedIn ? cloudUser.email || "Cloud account" : "Not signed in";

  const openButton = $("#openCloudProfileBtn");
  if (openButton) openButton.disabled = !signedIn || isActiveCloudProfile();

  const migrateButton = $("#migrateCloudBtn");
  if (migrateButton) migrateButton.disabled = !signedIn || !activeAccount || isActiveCloudProfile();

  const syncButton = $("#syncNowBtn");
  if (syncButton) syncButton.disabled = !signedIn || !isActiveCloudProfile();

  const signOutButton = $("#cloudSignOutBtn");
  if (signOutButton) signOutButton.disabled = !signedIn;

  const bridgePanel = $("#mt5BridgePanel");
  if (bridgePanel) bridgePanel.classList.toggle("hidden", !signedIn);

  const output = $("#mt5BridgeOutput");
  if (output && latestMt5BridgeSetup) output.value = latestMt5BridgeSetup;

  renderMt5Inbox();
}

function initSupabaseClient() {
  ensureCloudClientId();
  if (!supabaseConfig.url || !supabaseConfig.publishableKey || !globalThis.supabase?.createClient) {
    setCloudStatus("Local", "Cloud library is not loaded. Local profiles still work offline.", "muted");
    return false;
  }

  supabaseClient = globalThis.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  setCloudStatus("Ready", "Sign in with email/password to sync between devices.", "ready");
  return true;
}

async function initCloudSession() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    await handleCloudSessionChange(data.session, { source: "init" });
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      handleCloudSessionChange(session, { source: _event });
    });
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
  }
}

function ensureCloudAccount(user) {
  const id = `cloud-${user.id}`;
  const email = user.email || "cloud-user";
  const fallbackName = email.includes("@") ? email.split("@")[0] : "Cloud profile";
  let account = accountById(id);
  if (!account) {
    account = {
      id,
      name: fallbackName,
      cloudUserId: user.id,
      cloudEmail: email,
      createdAt: new Date().toISOString()
    };
    accounts = [...accounts, account];
  } else {
    account.cloudUserId = user.id;
    account.cloudEmail = email;
    if (!account.name) account.name = fallbackName;
  }
  saveAccounts();
  return account;
}

function cloneJson(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch (error) {
    return fallback;
  }
}

function currentJournalSnapshot(profileName = activeAccount?.name || "Cloud profile") {
  return {
    profileName,
    trades: cloneJson(trades, []),
    strategies: cloneJson(strategies, []),
    customPairs: cloneJson(customPairs, []),
    settings: cloneJson(settings, { ...defaultSettings })
  };
}

function normalizeCloudPairs(pairs) {
  return Array.isArray(pairs)
    ? pairs
        .map((pair) => ({
          symbol: normalizePair(pair.symbol),
          contractSize: toNumber(pair.contractSize, 1)
        }))
        .filter((pair) => pair.symbol && pair.contractSize > 0)
    : [];
}

function applyCloudProfileRow(row, message = "") {
  if (!row) return;
  isApplyingCloudSnapshot = true;
  try {
    if (isActiveCloudProfile() && row.profile_name) {
      activeAccount.name = row.profile_name;
      const storedAccount = accountById(activeAccount.id);
      if (storedAccount) storedAccount.name = row.profile_name;
      saveAccounts();
    }

    customPairs = normalizeCloudPairs(row.custom_pairs);
    settings = {
      ...defaultSettings,
      ...(row.settings && typeof row.settings === "object" ? row.settings : {})
    };
    analyticsRange = settings.analyticsRange || "all";
    analyticsCustomStart = settings.analyticsCustomStart || "";
    analyticsCustomEnd = settings.analyticsCustomEnd || "";
    marketChartPair = settings.marketChartPair || defaultPair;
    marketChartInterval = settings.marketChartInterval || "1D";
    if (!marketChartRanges.includes(marketChartInterval)) marketChartInterval = "1D";

    const incomingTrades = Array.isArray(row.trades) ? row.trades : [];
    incomingTrades.forEach((trade) => ensurePairAvailable(trade.pair, trade.contractSize));
    trades = incomingTrades.map((trade) =>
      withCalculatedTrade({
        ...trade,
        id: trade.id || randomId("trade")
      })
    );

    strategies = Array.isArray(row.strategies) ? row.strategies : [];
    saveCustomPairs();
    saveSettings();
    saveTrades();
    saveStrategies();
  } finally {
    isApplyingCloudSnapshot = false;
  }

  refreshAccountWorkspace();
  if (message) showToast(message);
}

function cloudPayloadFromSnapshot(snapshot) {
  return {
    user_id: cloudUser.id,
    profile_name: snapshot.profileName || activeAccount?.name || "Cloud profile",
    trades: snapshot.trades || [],
    strategies: snapshot.strategies || [],
    custom_pairs: snapshot.customPairs || [],
    settings: snapshot.settings || {},
    updated_at: new Date().toISOString(),
    client_id: ensureCloudClientId()
  };
}

async function upsertCloudSnapshot(snapshot = currentJournalSnapshot(), reason = "save") {
  if (!supabaseClient || !cloudUser) return false;
  setCloudStatus("Syncing", reason === "migration" ? "Uploading local profile to cloud." : "Saving latest journal to cloud.", "pending");
  const { error } = await withCloudTimeout(
    supabaseClient
      .from(cloudProfileTable)
      .upsert(cloudPayloadFromSnapshot(snapshot), { onConflict: "user_id" }),
    "Cloud save timed out. Check internet/Supabase, then press Email Sync again."
  );

  if (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    throw error;
  }

  setCloudStatus("Synced", `Last saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`, "success");
  return true;
}

function queueCloudSave(reason = "save") {
  if (isApplyingCloudSnapshot || !isActiveCloudProfile() || !supabaseClient || !cloudUser) return;
  clearTimeout(cloudSaveTimer);
  setCloudStatus("Queued", "Saving your latest edit to cloud.", "pending");
  cloudSaveTimer = setTimeout(() => {
    upsertCloudSnapshot(currentJournalSnapshot(), reason).catch((error) => {
      setCloudStatus("Error", friendlyCloudError(error), "error");
    });
  }, 650);
}

async function fetchCloudProfile(options = {}) {
  const { apply = true, createIfMissing = true, silent = false } = options;
  if (!supabaseClient || !cloudUser) return null;
  if (!silent) setCloudStatus("Syncing", "Loading latest cloud journal.", "pending");

  const { data, error } = await withCloudTimeout(
    supabaseClient
      .from(cloudProfileTable)
      .select("*")
      .eq("user_id", cloudUser.id)
      .maybeSingle(),
    "Cloud load timed out. Check internet/Supabase, then try again."
  );

  if (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    throw error;
  }

  if (data) {
    if (apply && isActiveCloudProfile()) applyCloudProfileRow(data);
    setCloudStatus("Synced", "Cloud journal is up to date on this device.", "success");
    return data;
  }

  if (createIfMissing && isActiveCloudProfile()) {
    await upsertCloudSnapshot(currentJournalSnapshot(activeAccount.name), "initial");
  } else {
    setCloudStatus("Ready", "No cloud journal found yet. Migrate a local profile or open cloud.", "ready");
  }
  return null;
}

function subscribeCloudProfile() {
  if (!supabaseClient || !cloudUser) return;
  if (cloudSubscription) supabaseClient.removeChannel(cloudSubscription);
  cloudSubscription = supabaseClient
    .channel(`journal-profile-${cloudUser.id}-${ensureCloudClientId()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: cloudProfileTable,
        filter: `user_id=eq.${cloudUser.id}`
      },
      (payload) => {
        const row = payload.new;
        if (!row || row.client_id === cloudClientId) return;
        if (isActiveCloudProfile()) {
          applyCloudProfileRow(row, "Cloud update received from another device.");
          setCloudStatus("Synced", "Updated from another device.", "success");
        } else {
          setCloudStatus("Updated", "Cloud has new data. Open Cloud to view it.", "pending");
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED" && isActiveCloudProfile()) {
        setCloudStatus("Live", "Realtime sync is listening for iPhone and PC changes.", "success");
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        const activeCloud = isActiveCloudProfile();
        setCloudStatus(
          activeCloud ? "Synced" : "Ready",
          "Email Sync is available. Realtime listener paused, so use Email Sync or Refresh if live updates lag.",
          activeCloud ? "success" : "ready"
        );
      }
    });
}

function mt5HistoryDateDefaults() {
  const end = localDateKey(new Date());
  const start = localDateKey(addDays(new Date(), -6));
  return { start, end };
}

function syncMt5HistoryControls() {
  const startInput = $("#mt5HistoryStart");
  const endInput = $("#mt5HistoryEnd");
  if (!startInput || !endInput) return;
  const defaults = mt5HistoryDateDefaults();
  if (!startInput.value) startInput.value = defaults.start;
  if (!endInput.value) endInput.value = defaults.end;
}

function mt5HistoryRangeFromControls() {
  syncMt5HistoryControls();
  return {
    start: $("#mt5HistoryStart")?.value || "",
    end: $("#mt5HistoryEnd")?.value || ""
  };
}

function mt5HistoryDateBounds(range = mt5HistoryReviewRange) {
  if (!range.start || !range.end) return { startIso: "", endIso: "" };
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T23:59:59.999`);
  return {
    startIso: Number.isNaN(start.getTime()) ? "" : start.toISOString(),
    endIso: Number.isNaN(end.getTime()) ? "" : end.toISOString()
  };
}

async function createMt5HistoryRequest() {
  if (!supabaseClient || !cloudUser) {
    showAuthOverlay("cloud", false);
    return;
  }

  const { start: startDate, end: endDate } = mt5HistoryRangeFromControls();
  if (!startDate || !endDate) {
    showToast("Choose the MT5 history start and end dates.");
    return;
  }
  if (startDate > endDate) {
    showToast("History start date must be before end date.");
    return;
  }

  mt5HistoryReviewRange = { active: true, start: startDate, end: endDate };

  const { error } = await supabaseClient.from(mt5HistoryRequestTable).insert({
    user_id: cloudUser.id,
    start_date: startDate,
    end_date: endDate,
    requested_by: ensureCloudClientId(),
    status: "pending"
  });

  if (error) {
    showToast(friendlyCloudError(error));
    return;
  }

  latestMt5BridgeSetup = [
    `HistoryRequest=${startDate} to ${endDate}`,
    "Status=Pending until MT5 PC or Oracle relay is online",
    "Required EA input: PollHistoryRequests=true",
    "Open MT5 desktop bridge, or keep the Oracle relay running."
  ].join("\n");
  const output = $("#mt5BridgeOutput");
  if (output) output.value = latestMt5BridgeSetup;
  await fetchMt5DetectedOrders({ historyReview: true });
  showToast("History display activated. MT5 bridge will upload missing orders when online.");
}

async function generateMt5BridgeToken(source = "desktop") {
  if (!supabaseClient || !cloudUser) {
    showAuthOverlay("cloud", false);
    return;
  }

  const isMobile = source === "mobile";
  const token = randomToken(isMobile ? "fxej_mt5_mobile" : "fxej_mt5");
  const tokenHash = await sha256Hex(token);
  const label = `${isMobile ? "MT5 mobile relay" : "MT5 desktop"} ${new Date().toLocaleDateString()}`;
  const { error } = await supabaseClient.from(mt5TokenTable).insert({
    user_id: cloudUser.id,
    token_hash: tokenHash,
    label
  });

  if (error) {
    showToast(friendlyCloudError(error));
    return;
  }

  latestMt5BridgeSetup = mt5BridgeSetupText(token, source);
  const output = $("#mt5BridgeOutput");
  if (output) {
    output.value = latestMt5BridgeSetup;
    output.focus();
    output.select();
  }
  showToast(isMobile ? "MT5 mobile relay token created. Save it now; it is shown once." : "MT5 bridge token created. Save it now; it is shown once.");
}

function copyMt5BridgeSetup() {
  const output = $("#mt5BridgeOutput");
  if (!output || !output.value.trim()) {
    showToast("Generate an MT5 token first.");
    return;
  }
  output.focus();
  output.select();
  navigator.clipboard?.writeText(output.value)
    .then(() => showToast("MT5 setup copied."))
    .catch(() => showToast("Selected setup text is ready to copy."));
}

function subscribeMt5Orders() {
  if (!supabaseClient || !cloudUser) return;
  if (mt5OrderSubscription) supabaseClient.removeChannel(mt5OrderSubscription);
  mt5OrderSubscription = supabaseClient
    .channel(`mt5-orders-${cloudUser.id}-${ensureCloudClientId()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: mt5OrderTable,
        filter: `user_id=eq.${cloudUser.id}`
      },
      () => {
        if (!mt5HistoryReviewRange.active) fetchMt5DetectedOrders({ silent: true, forceRealtime: true }).catch(() => {});
      }
    )
    .subscribe(() => {});
}

async function fetchMt5DetectedOrders(options = {}) {
  const { silent = false, historyReview = false, forceRealtime = false } = options;
  if (!supabaseClient || !cloudUser) {
    mt5DetectedOrders = [];
    renderMt5Inbox();
    return;
  }

  const reviewMode = !forceRealtime && Boolean(historyReview || mt5HistoryReviewRange.active);
  let query = supabaseClient
    .from(mt5OrderTable)
    .select("*")
    .eq("user_id", cloudUser.id)
    .order("closed_at", { ascending: false })
    .limit(reviewMode ? 200 : 40);

  if (reviewMode) {
    const { startIso, endIso } = mt5HistoryDateBounds();
    query = query.in("status", ["new", "recorded", "ignored"]);
    if (startIso) query = query.gte("closed_at", new Date(new Date(startIso).getTime() - 36 * 60 * 60000).toISOString());
    if (endIso) query = query.lte("closed_at", new Date(new Date(endIso).getTime() + 36 * 60 * 60000).toISOString());
  } else {
    query = query.eq("status", "new");
  }

  if (!silent) {
    setMt5InboxState("loading", reviewMode ? "Loading MT5 history from Supabase." : "Checking Supabase for new closed positions.");
  }

  let response;
  try {
    response = await withCloudTimeout(
      query,
      "MT5 detected-order refresh timed out. Check Supabase connection and bridge status.",
      reviewMode ? 45000 : 30000
    );
  } catch (error) {
    setMt5InboxState("error", friendlyCloudError(error));
    if (!silent) showToast(friendlyCloudError(error));
    return;
  }

  const { data, error } = response;
  if (error) {
    setMt5InboxState("error", friendlyCloudError(error));
    if (!silent) showToast(friendlyCloudError(error));
    return;
  }

  const previousCount = mt5DetectedOrders.length;
  const fetchedOrders = Array.isArray(data) ? data : [];
  if (reviewMode) {
    const reviewOrders = fetchedOrders.filter((order) => {
      const orderDate = orderDateKeyForHistoryReview(order);
      return (!mt5HistoryReviewRange.start || orderDate >= mt5HistoryReviewRange.start)
        && (!mt5HistoryReviewRange.end || orderDate <= mt5HistoryReviewRange.end);
    });
    mt5DetectedOrders = reviewOrders.map((order) => ({
      ...order,
      alreadyRecorded: isMt5OrderAlreadyRecorded(order)
    }));
    mt5InboxState = {
      kind: mt5DetectedOrders.length ? "ready" : "empty",
      message: mt5DetectedOrders.length ? "" : "No MT5 orders found in that history period."
    };
    renderMt5Inbox();
    if (!silent) showToast("History display loaded " + mt5DetectedOrders.length + " " + (mt5DetectedOrders.length === 1 ? "order" : "orders") + ".");
    return;
  }

  const realtimeOrders = fetchedOrders.filter((order) => !mt5OrderHasAnyKey(order, mt5RealtimeHiddenKeys));
  const { visibleOrders, duplicateCount } = await skipRecordedMt5Orders(realtimeOrders, { silent });
  mt5DetectedOrders = visibleOrders;
  mt5InboxState = {
    kind: mt5DetectedOrders.length ? "ready" : "empty",
    message: duplicateCount
      ? duplicateCount + " detected MT5 " + (duplicateCount === 1 ? "order is" : "orders are") + " already in Trade History."
      : "No new closed positions. Keep the MT5 bridge attached, then press Refresh after a position closes."
  };
  renderMt5Inbox();
  if (duplicateCount && !silent) {
    showToast(`${duplicateCount} MT5 ${duplicateCount === 1 ? "order is" : "orders are"} already in Trade History and skipped.`);
  } else if (mt5DetectedOrders.length > previousCount && !silent) {
    showToast("MT5 closed position detected.");
  }
}

function mt5OrderById(id) {
  return mt5DetectedOrders.find((order) => order.id === id);
}

function formatDateTime(value) {
  if (!value) return "No time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function mt5RawTimestampSeconds(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric > 100000000000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
}

function mt5ServerDateFromRaw(value, offsetMinutes = 0) {
  const seconds = mt5RawTimestampSeconds(value);
  return seconds === null ? null : new Date((seconds - offsetMinutes * 60) * 1000);
}

function mt5OrderSourceOffsetMinutes(order) {
  if (mt5OrderSource(order) === "History") return 0;
  const raw = mt5OrderRaw(order);
  const explicitOffset = parseOptionalNumber(firstValue(
    raw.server_utc_offset_minutes,
    raw.mt5_server_utc_offset_minutes,
    raw.broker_utc_offset_minutes,
    raw.server_timezone_offset_minutes
  ));
  return Number.isFinite(explicitOffset) ? explicitOffset : 180;
}

function mt5OrderStoredDate(order, kind = "closed") {
  const storedValue = kind === "open" ? order?.opened_at : order?.closed_at;
  const isHistory = mt5OrderSource(order) === "History";
  if (isHistory && storedValue) {
    const storedDate = new Date(storedValue);
    if (!Number.isNaN(storedDate.getTime())) return storedDate;
  }

  const rawDate = mt5ServerDateFromRaw(mt5OrderRawTime(order, kind), mt5OrderSourceOffsetMinutes(order));
  if (rawDate) return rawDate;

  if (storedValue) {
    const storedDate = new Date(storedValue);
    if (!Number.isNaN(storedDate.getTime())) {
      return isHistory ? storedDate : new Date(storedDate.getTime() - mt5OrderSourceOffsetMinutes(order) * 60000);
    }
  }
  return null;
}

function mt5OrderCorrectedDate(order, kind = "closed") {
  return mt5OrderStoredDate(order, kind);
}

function mt5DateKeyFromDate(date) {
  return date ? localDateKey(date) : "";
}

function mt5TimeKeyFromDate(date) {
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatMt5CorrectedDateTime(order, kind = "closed") {
  const date = mt5OrderCorrectedDate(order, kind);
  if (!date) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function mt5OrderRawTime(order, kind = "closed") {
  const raw = mt5OrderRaw(order);
  return kind === "open"
    ? firstValue(raw.open_time, raw.opened_at)
    : firstValue(raw.close_time, raw.closed_at, raw.time);
}

function mt5OrderBrokerDateKey(order, kind = "closed") {
  return mt5DateKeyFromDate(mt5OrderCorrectedDate(order, kind));
}

function mt5OrderBrokerTimeKey(order, kind = "closed") {
  return mt5TimeKeyFromDate(mt5OrderCorrectedDate(order, kind));
}

function mt5OrderDisplayDateTime(order, kind = "closed") {
  const correctedTime = formatMt5CorrectedDateTime(order, kind);
  return correctedTime ? `${correctedTime} MT5` : formatDateTime(kind === "open" ? order.opened_at : order.closed_at);
}

function dateKeyFromTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : localDateKey(date);
}

function orderDateKeyForHistoryReview(order) {
  return mt5OrderBrokerDateKey(order, "closed") || dateKeyFromTimestamp(order.closed_at);
}

function normalizeBrokerSymbol(symbol) {
  const raw = String(symbol || "").toUpperCase().trim();
  const compact = raw.replace(/[^A-Z0-9]/g, "");
  const quotes = ["USDT", "USD", "JPY", "EUR", "GBP", "AUD", "CAD", "CHF", "NZD"];
  const bases = ["XAU", "XAG", "BTC", "ETH", "EUR", "GBP", "AUD", "USD", "CAD", "CHF", "NZD"];

  for (const base of bases) {
    for (const quote of quotes) {
      const joined = `${base}${quote}`;
      if (compact === joined || compact.startsWith(joined)) return `${base}/${quote}`;
    }
  }

  return normalizePair(raw);
}

function mt5OrderRaw(order) {
  return order?.raw && typeof order.raw === "object" ? order.raw : {};
}

function cleanMt5Key(value) {
  return String(value ?? "").trim();
}

function uniqueMt5Keys(values) {
  return [...new Set(values.map(cleanMt5Key).filter(Boolean))];
}

function mt5OrderExternalKeys(order) {
  const raw = mt5OrderRaw(order);
  return uniqueMt5Keys([
    order?.external_id,
    raw.external_id,
    order?.position_id,
    raw.position_id,
    order?.order_id,
    raw.order_id,
    order?.ticket,
    raw.ticket,
    raw.exit_ticket,
    raw.deal_ticket,
    raw.close_ticket,
    raw.closed_ticket
  ]);
}

function tradeMt5ExternalKeys(trade) {
  return uniqueMt5Keys([
    trade?.mt5ExternalId,
    trade?.mt5_external_id,
    trade?.externalId,
    trade?.external_id,
    trade?.mt5PositionId,
    trade?.mt5_position_id,
    trade?.positionId,
    trade?.position_id,
    trade?.mt5DealId,
    trade?.mt5_deal_id,
    trade?.dealTicket,
    trade?.deal_ticket,
    trade?.ticket
  ]);
}

function tradeNotesMentionMt5Keys(trade, keys) {
  const notes = String(trade?.notes || "").toLowerCase();
  return keys.some((key) => key.length >= 4 && notes.includes(key.toLowerCase()));
}

function mt5OrderHasAnyKey(order, keySet) {
  if (!keySet || !keySet.size) return false;
  return mt5OrderExternalKeys(order).some((key) => keySet.has(key.toLowerCase()));
}

function hideMt5OrderFromRealtime(order) {
  mt5OrderExternalKeys(order).forEach((key) => mt5RealtimeHiddenKeys.add(key.toLowerCase()));
}

function isMt5OrderAlreadyRecorded(order) {
  const orderKeys = mt5OrderExternalKeys(order);
  if (!orderKeys.length) return false;
  const orderKeySet = new Set(orderKeys.map((key) => key.toLowerCase()));
  return trades.some((trade) => {
    const tradeKeys = tradeMt5ExternalKeys(trade).map((key) => key.toLowerCase());
    return tradeKeys.some((key) => orderKeySet.has(key)) || tradeNotesMentionMt5Keys(trade, orderKeys);
  });
}

async function skipRecordedMt5Orders(orders, options = {}) {
  const { silent = false } = options;
  const duplicateIds = [];
  const visibleOrders = [];

  orders.forEach((order) => {
    if (isMt5OrderAlreadyRecorded(order)) duplicateIds.push(order.id);
    else visibleOrders.push(order);
  });

  const cleanIds = duplicateIds.filter(Boolean);
  if (cleanIds.length && supabaseClient && cloudUser) {
    const { error } = await supabaseClient
      .from(mt5OrderTable)
      .update({ status: "recorded", updated_at: new Date().toISOString() })
      .eq("user_id", cloudUser.id)
      .in("id", cleanIds);
    if (error && !silent) showToast(friendlyCloudError(error));
  }

  return { visibleOrders, duplicateCount: cleanIds.length };
}

function mt5OrderSource(order) {
  const raw = mt5OrderRaw(order);
  const platform = String(raw.client_platform || raw.platform || raw.mobile_engine || raw.source || "").toLowerCase();
  if (platform.includes("history")) return "History";
  if (platform.includes("ios-or-android")) return "Mobile";
  if (platform.includes("iphone") || platform.includes("ipad") || platform.includes("ios")) return "iOS";
  if (platform.includes("android")) return "Android";
  if (platform.includes("mobile")) return "Mobile";
  return "PC";
}

function mt5SourceClass(source) {
  return String(source || "pc").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function mt5OrderToTrade(order) {
  const pair = normalizeBrokerSymbol(order.symbol);
  const raw = mt5OrderRaw(order);
  const source = mt5OrderSource(order);
  ensurePairAvailable(pair, order.contract_size);
  const closedAt = order.closed_at ? new Date(order.closed_at) : new Date();
  const openedAt = order.opened_at ? new Date(order.opened_at) : closedAt;
  const validClosedAt = !Number.isNaN(closedAt.getTime());
  const validOpenedAt = !Number.isNaN(openedAt.getTime());
  const brokerOpenDate = mt5OrderBrokerDateKey(order, "open");
  const brokerOpenTime = mt5OrderBrokerTimeKey(order, "open");
  const commission = parseOptionalNumber(order.commission) ?? 0;
  const swap = parseOptionalNumber(order.swap) ?? 0;
  const lotSize = parseOptionalNumber(order.lot_size) ?? 0;
  const entry = parseOptionalNumber(order.entry_price) ?? 0;
  const exit = parseOptionalNumber(order.exit_price) ?? 0;
  const stop = parseOptionalNumber(order.stop_loss) ?? 0;
  const target = parseOptionalNumber(order.take_profit) ?? 0;
  const direction = String(order.direction || "Buy").toLowerCase() === "sell" ? "Sell" : "Buy";
  const calc = calculateTradeNumbers({
    pair,
    direction,
    entry,
    stop,
    target,
    exit,
    lotSize,
    contractSize: defaultContractSize(pair)
  });

  const tradeDate = brokerOpenDate || (validOpenedAt ? localDateKey(openedAt) : validClosedAt ? localDateKey(closedAt) : localDateKey());
  const tradeOpenTimeValue = brokerOpenTime || (validOpenedAt ? localTimeKey(openedAt) : "");
  const autoSession = inferSessionFromTradeDateTime(tradeDate, tradeOpenTimeValue);

  return {
    id: randomId("trade"),
    date: tradeDate,
    openTime: tradeOpenTimeValue,
    mt5ExternalId: cleanMt5Key(order.external_id),
    mt5PositionId: cleanMt5Key(order.position_id || raw.position_id || raw.order_id || raw.ticket),
    mt5DealId: cleanMt5Key(raw.exit_ticket || raw.deal_ticket || raw.close_ticket || raw.closed_ticket),
    mt5BrokerAccount: cleanMt5Key(order.broker_account),
    mt5BrokerServer: cleanMt5Key(order.broker_server),
    mt5Source: source,
    pair,
    session: autoSession,
    sessionAuto: Boolean(autoSession),
    direction,
    setup: "",
    entry,
    stop,
    target,
    exit,
    lotSize,
    contractSize: calc.contractSize,
    quoteToAccount: calc.quoteToAccount ?? "",
    quoteToAccountRate: roundNumber(calc.quoteToAccountRate, 6),
    manualR: "",
    risk: roundNumber(calc.riskAmount, 2),
    riskAmount: roundNumber(calc.riskAmount, 2),
    actualPl: parseOptionalNumber(order.profit) ?? roundNumber(calc.actualPl, 2),
    targetPl: roundNumber(calc.targetPl, 2),
    resultR: roundNumber(calc.resultR, 2),
    actualR: roundNumber(calc.actualR, 2),
    targetR: roundNumber(calc.targetR, 2),
    stopPips: roundNumber(calc.stopPips, 1),
    actualPips: roundNumber(calc.actualPips, 1),
    targetPips: roundNumber(calc.targetPips, 1),
    commissionPerLot: settings.commissionPerLot,
    commission,
    swap,
    mistake: "None",
    confidence: 60,
    discipline: 70,
    tags: ["mt5", "auto-detected"],
    notes: [
      `Imported from MT5 closed position ${order.external_id || order.position_id || ""}.`.trim(),
      `Source: MT5 ${source}.`,
      autoSession ? `Session auto-filled from opening time: ${autoSession}.` : "Session left blank because opening time was unavailable.",
      "Setup left blank for manual review.",
      order.broker_account ? `Broker account: ${order.broker_account}.` : "",
      Number.isFinite(parseOptionalNumber(order.profit)) ? `MT5 net profit before journal fees: ${currencyFormatter.format(parseOptionalNumber(order.profit))}.` : ""
    ].filter(Boolean).join("\n")
  };
}

function prefillTradeFromMt5Order(orderId) {
  const order = mt5OrderById(orderId);
  if (!order) return;
  if (isMt5OrderAlreadyRecorded(order)) {
    markMt5OrderStatus(order.id, "recorded");
    showToast("This MT5 order is already in Trade History, so it was skipped.");
    return;
  }
  const trade = mt5OrderToTrade(order);
  pendingMt5OrderId = order.id;
  fillTradeForm(trade);
  scrollTradeTicketIntoView();
  showToast("MT5 position loaded into the trade ticket.");
}

async function markMt5OrderStatus(orderId, status = "recorded") {
  if (!supabaseClient || !cloudUser || !orderId) return;
  const order = mt5OrderById(orderId);
  if (status === "ignored" && order) hideMt5OrderFromRealtime(order);
  const { error } = await supabaseClient
    .from(mt5OrderTable)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("user_id", cloudUser.id);

  if (error) {
    showToast(friendlyCloudError(error));
    return;
  }

  mt5DetectedOrders = mt5DetectedOrders.filter((order) => order.id !== orderId);
  if (!mt5DetectedOrders.length && mt5InboxState.kind === "ready") {
    mt5InboxState = { kind: "empty", message: status === "ignored" ? "Ignored order hidden. Use Display History to see it again." : "No orders waiting." };
  }
  renderMt5Inbox();
}

function renderMt5Inbox() {
  const panel = $("#mt5InboxPanel");
  const list = $("#mt5InboxList");
  if (!panel || !list) return;
  const hasOrders = Boolean(mt5DetectedOrders.length);
  const showPanel = Boolean(cloudUser && (hasOrders || mt5InboxState.kind !== "idle"));
  panel.classList.toggle("hidden", !showPanel);
  if (!showPanel) {
    list.innerHTML = "";
    return;
  }

  if (!hasOrders) {
    const tone = mt5InboxState.kind === "error" ? "error" : mt5InboxState.kind === "loading" ? "loading" : "empty";
    const title = mt5InboxState.kind === "error" ? "Could not refresh MT5 orders" : mt5InboxState.kind === "loading" ? "Checking MT5 orders" : "No orders waiting";
    const message = mt5InboxState.message || "Closed MT5 positions will appear here before you record them.";
    list.innerHTML = [
      '<div class="mt5-inbox-state ' + escapeHtml(tone) + '">',
      '<strong>' + escapeHtml(title) + '</strong>',
      '<p>' + escapeHtml(message) + '</p>',
      '</div>'
    ].join("");
    return;
  }

  list.innerHTML = mt5DetectedOrders
    .map((order) => {
      const direction = String(order.direction || "Buy").toLowerCase() === "sell" ? "Sell" : "Buy";
      const source = mt5OrderSource(order);
      const pl = parseOptionalNumber(order.profit);
      const commission = parseOptionalNumber(order.commission) ?? 0;
      const swap = parseOptionalNumber(order.swap) ?? 0;
      const stopLoss = parseOptionalNumber(order.stop_loss);
      const takeProfit = parseOptionalNumber(order.take_profit);
      const stopText = stopLoss && stopLoss > 0 ? rateFormatter.format(stopLoss) : "Not sent";
      const targetText = takeProfit && takeProfit > 0 ? rateFormatter.format(takeProfit) : "Not sent";
      const alreadyRecorded = Boolean(order.alreadyRecorded || isMt5OrderAlreadyRecorded(order));
      return `
        <article class="mt5-order-card">
          <div>
            <strong>${escapeHtml(normalizeBrokerSymbol(order.symbol))}
              <span class="mt5-pill ${direction.toLowerCase()}">${escapeHtml(direction)}</span>
              <span class="mt5-source-pill ${escapeHtml(mt5SourceClass(source))}">${escapeHtml(source)}</span>
            </strong>
            <p>${escapeHtml(mt5OrderDisplayDateTime(order, "closed"))} | ${numberFormatter.format(toNumber(order.lot_size))} lot | Entry ${rateFormatter.format(toNumber(order.entry_price))} -> Exit ${rateFormatter.format(toNumber(order.exit_price))}</p>
            <p>${pl === null ? "P/L pending" : currencyFormatter.format(pl)} | Stop ${escapeHtml(stopText)} | Target ${escapeHtml(targetText)} | Commission ${currencyFormatter.format(commission)} | Swap ${currencyFormatter.format(swap)}</p>
          </div>
          <div class="mt5-order-actions">
            ${alreadyRecorded ? '<span class="mt5-recorded-flag">Already recorded</span>' : ""}
            <button class="mini-button text-mini" type="button" data-mt5-action="record" data-id="${escapeHtml(order.id)}" ${alreadyRecorded ? "disabled" : ""}>${alreadyRecorded ? "Recorded" : "Record"}</button>
            <button class="mini-button text-mini danger" type="button" data-mt5-action="ignore" data-id="${escapeHtml(order.id)}">Ignore</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function openCloudProfile(options = {}) {
  const { silent = false } = options;
  if (!cloudUser) {
    showAuthOverlay("cloud", false);
    return;
  }
  const account = ensureCloudAccount(cloudUser);
  setActiveAccount(account, silent ? "" : "Cloud profile opened.");
  subscribeCloudProfile();
  subscribeMt5Orders();
  try {
    await fetchCloudProfile({ apply: true, createIfMissing: true, silent });
    await fetchMt5DetectedOrders({ silent: true });
  } catch (error) {
    showToast(friendlyCloudError(error));
  }
}

async function migrateActiveAccountToCloud() {
  if (!cloudUser) {
    showAuthOverlay("cloud", false);
    return;
  }
  if (!activeAccount) {
    showToast("Open a local profile before migrating.");
    return;
  }
  if (isActiveCloudProfile()) {
    showToast("This profile is already using cloud sync.");
    return;
  }

  const ok = confirm("Upload this local profile to your Supabase cloud journal? This replaces the current cloud journal for this email.");
  if (!ok) return;

  const snapshot = currentJournalSnapshot(activeAccount.name);
  try {
    await upsertCloudSnapshot(snapshot, "migration");
    const account = ensureCloudAccount(cloudUser);
    setActiveAccount(account, "Local profile migrated to cloud.");
    applyCloudProfileRow({
      profile_name: snapshot.profileName,
      trades: snapshot.trades,
      strategies: snapshot.strategies,
      custom_pairs: snapshot.customPairs,
      settings: snapshot.settings,
      client_id: ensureCloudClientId()
    });
    subscribeCloudProfile();
  } catch (error) {
    showToast(friendlyCloudError(error));
  }
}

async function handleCloudSessionChange(session, options = {}) {
  cloudSession = session || null;
  cloudUser = cloudSession?.user || null;
  if (!cloudUser) {
    if (cloudSubscription) {
      supabaseClient.removeChannel(cloudSubscription);
      cloudSubscription = null;
    }
    if (mt5OrderSubscription) {
      supabaseClient.removeChannel(mt5OrderSubscription);
      mt5OrderSubscription = null;
    }
    mt5DetectedOrders = [];
    setCloudStatus("Ready", "Sign in with email/password to sync between devices.", "ready");
    renderMt5Inbox();
    return;
  }

  ensureCloudAccount(cloudUser);
  subscribeCloudProfile();
  subscribeMt5Orders();
  fetchMt5DetectedOrders({ silent: true }).catch(() => {});
  if (!activeAccount || (isCloudAccount(activeAccount) && activeAccount.cloudUserId === cloudUser.id)) {
    await openCloudProfile({ silent: options.source === "init" });
    return;
  }

  setCloudStatus("Ready", "Cloud signed in. Migrate Local to upload this profile, or Open to use cloud data.", "ready");
  syncCloudUi();
}

function cloudAuthValues(form) {
  const email = String(form.elements.email.value || "").trim().toLowerCase();
  const password = form.elements.password.value;
  if (!email || !email.includes("@")) throw new Error("Enter your email address.");
  if (password.length < 6) throw new Error("Use at least 6 password characters for cloud login.");
  return { email, password };
}

async function handleCloudSignIn(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!supabaseClient) {
    showToast("Cloud sync is not loaded yet.");
    return;
  }

  try {
    const { email, password } = cloudAuthValues(form);
    setCloudStatus("Signing in", "Checking Supabase email/password.", "pending");
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    form.elements.password.value = "";
    await handleCloudSessionChange(data.session, { source: "signIn" });
    hideAuthOverlay();
    showToast(isActiveCloudProfile() ? "Cloud sync active." : "Cloud signed in. Migrate or open cloud when ready.");
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    showToast(friendlyCloudError(error));
  }
}

async function handleCloudSignUp(event) {
  const form = event.currentTarget.closest("form");
  if (!supabaseClient || !form) {
    showToast("Cloud sync is not loaded yet.");
    return;
  }

  try {
    const { email, password } = cloudAuthValues(form);
    setCloudStatus("Creating", "Creating Supabase email/password account.", "pending");
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.href.split("#")[0]
      }
    });
    if (error) throw error;
    form.elements.password.value = "";
    if (data.session) {
      await handleCloudSessionChange(data.session, { source: "signUp" });
      hideAuthOverlay();
      showToast("Cloud account created.");
      return;
    }
    setCloudStatus("Confirm", "Check your email, confirm the account, then sign in here.", "pending");
    showToast("Check your email to confirm, then sign in.");
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    showToast(friendlyCloudError(error));
  }
}

async function handleCloudSignOut() {
  if (!supabaseClient || !cloudUser) return;
  const wasCloudProfile = isActiveCloudProfile();
  try {
    await supabaseClient.auth.signOut();
    if (wasCloudProfile) lockAccount(false);
    setCloudStatus("Ready", "Signed out of cloud. Local profiles still work offline.", "ready");
    showToast("Cloud signed out.");
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    showToast(friendlyCloudError(error));
  }
}

function timeInZone(timeZone, date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  } catch (error) {
    return "--:--";
  }
}

function timeZoneOffsetMinutes(timeZone, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "2-digit"
    }).formatToParts(date);
    const zone = parts.find((part) => part.type === "timeZoneName")?.value || "";
    if (zone === "GMT" || zone === "UTC") return 0;
    const match = zone.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!match) return null;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2] || 0);
    const minutes = Number(match[3] || 0);
    return sign * (hours * 60 + minutes);
  } catch (error) {
    return null;
  }
}

function daylightSavingStatus(timeZone, date = new Date()) {
  const year = date.getFullYear();
  const current = timeZoneOffsetMinutes(timeZone, date);
  const january = timeZoneOffsetMinutes(timeZone, new Date(Date.UTC(year, 0, 1, 12)));
  const july = timeZoneOffsetMinutes(timeZone, new Date(Date.UTC(year, 6, 1, 12)));
  if (current === null || january === null || july === null || january === july) {
    return { active: false, label: "No DST" };
  }
  const dstOffset = Math.max(january, july);
  return { active: current === dstOffset, label: current === dstOffset ? "DST On" : "DST Off" };
}

function minutesFromZonedTime(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null;
  } catch (error) {
    return null;
  }
}

function minutesInsideWindow(minutes, startMinutes, endMinutes) {
  if (minutes === null) return false;
  return startMinutes <= endMinutes
    ? minutes >= startMinutes && minutes < endMinutes
    : minutes >= startMinutes || minutes < endMinutes;
}

function marketWindowActive(date, timeZone, startHour = 8, endHour = 17) {
  return minutesInsideWindow(minutesFromZonedTime(date, timeZone), startHour * 60, endHour * 60);
}

function dateFromTradeDateTime(dateKey, timeKey) {
  const dateText = String(dateKey || "").slice(0, 10);
  const timeText = normalizeTimeValue(timeKey);
  if (!dateText || !timeText) return null;
  const date = new Date(`${dateText}T${timeText}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inferSessionFromDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const london = marketWindowActive(date, "Europe/London");
  const newYork = marketWindowActive(date, "America/New_York");
  const asia = marketWindowActive(date, "Asia/Tokyo") || marketWindowActive(date, "Australia/Sydney");
  if (london && newYork) return "London/New York";
  if (newYork) return "New York";
  if (london) return "London";
  if (asia) return "Asia";
  return "";
}

function inferSessionFromTradeDateTime(dateKey, timeKey) {
  return inferSessionFromDate(dateFromTradeDateTime(dateKey, timeKey));
}

function syncSessionFromOpenTime(force = false) {
  const form = $("#tradeForm");
  if (!form) return "";
  const sessionInput = form.elements.session;
  const inferred = inferSessionFromTradeDateTime(form.elements.date.value, form.elements.openTime.value);
  if (!inferred) return "";
  if (force || !sessionInput.value || sessionInput.dataset.auto === "true") {
    sessionInput.value = inferred;
    sessionInput.dataset.auto = "true";
  }
  return inferred;
}

function renderDstWidget() {
  const list = $("#dstList");
  const clock = $("#dstLocalClock");
  if (!list || !clock) return;
  const now = new Date();
  clock.textContent = timeInZone("Asia/Bangkok", now);
  const markets = [
    { name: "New York", zone: "America/New_York" },
    { name: "London", zone: "Europe/London" },
    { name: "Sydney", zone: "Australia/Sydney" }
  ];

  list.innerHTML = markets
    .map((market) => {
      const status = daylightSavingStatus(market.zone, now);
      return `
        <div class="dst-row">
          <div>
            <strong>${escapeHtml(market.name)}</strong>
            <span>${escapeHtml(timeInZone(market.zone, now))}</span>
          </div>
          <span class="dst-badge ${status.active ? "active" : ""}">${escapeHtml(status.label)}</span>
        </div>
      `;
    })
    .join("");
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

function localTimeKey(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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
  renderMt5Inbox();
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

function normalizeTimeValue(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hours = Math.min(Math.max(Number(match[1]), 0), 23);
  const minutes = Math.min(Math.max(Number(match[2]), 0), 59);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function tradeOpenTime(trade) {
  return normalizeTimeValue(trade.openTime ?? trade.open_time ?? trade.openedTime ?? trade.opened_time ?? trade.time);
}

function tradeDateTimeKey(trade) {
  const date = String(trade.date || "").slice(0, 10);
  return `${date}T${tradeOpenTime(trade) || "00:00"}`;
}

function compareTradeText(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
}

function compareTradesByKey(a, b, key) {
  if (key === "datetime") return compareTradeText(tradeDateTimeKey(a), tradeDateTimeKey(b));
  if (key === "pair") return compareTradeText(a.pair, b.pair);
  if (key === "direction") return compareTradeText(a.direction, b.direction);
  if (key === "setup") return compareTradeText(a.setup, b.setup);
  if (key === "r") return toNumber(a.resultR) - toNumber(b.resultR);
  if (key === "pl") return tradePl(a) - tradePl(b);
  if (key === "discipline") return toNumber(a.discipline) - toNumber(b.discipline);
  return 0;
}

function sortTradesForTable(list) {
  const direction = tradeSort.direction === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const primary = compareTradesByKey(a, b, tradeSort.key);
    if (primary !== 0) return primary * direction;
    const fallback = compareTradesByKey(a, b, "datetime");
    if (fallback !== 0) return fallback * -1;
    return compareTradeText(b.id, a.id);
  });
}

function syncTradeSortHeaders() {
  $$("[data-sort-key]").forEach((button) => {
    const active = button.dataset.sortKey === tradeSort.key;
    button.classList.toggle("active", active);
    button.dataset.sortIndicator = active ? (tradeSort.direction === "asc" ? "^" : "v") : "";
    button.setAttribute("aria-sort", active ? (tradeSort.direction === "asc" ? "ascending" : "descending") : "none");
    button.title = active ? `Sorted ${tradeSort.direction === "asc" ? "oldest/lowest first" : "newest/highest first"}` : "Sort this column";
  });
}

function filteredTrades() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const outcome = $("#outcomeFilter").value;
  const setup = $("#setupFilter").value;

  return sortTradesForTable(
    trades.filter((trade) => {
      const haystack = [
        trade.date,
        tradeOpenTime(trade),
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
  );
}

function renderTable() {
  const table = $("#tradeTable");
  const list = filteredTrades();
  syncTradeSortHeaders();
  table.innerHTML = "";
  $("#emptyJournal").classList.toggle("visible", list.length === 0);

  list.forEach((trade) => {
    const outcome = getOutcome(trade.resultR);
    const openTime = tradeOpenTime(trade);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="trade-date-cell">${formatDate(trade.date)}${openTime ? `<br><small>${escapeHtml(openTime)}</small>` : ""}</td>
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

function rerenderAnalyticsSoon(delay = 120) {
  clearTimeout(analyticsResizeTimer);
  analyticsResizeTimer = setTimeout(() => {
    const analyticsTrades = getAnalyticsTrades();
    renderAnalytics(analyze(analyticsTrades), analyticsTrades);
  }, delay);
}

function getCanvasDisplaySize(canvas, fallbackHeight) {
  const rect = canvas.getBoundingClientRect();
  const wrapRect = canvas.closest(".chart-wrap")?.getBoundingClientRect();
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const fallbackWidth = Math.min(Math.max(viewportWidth - 48, 280), 760);
  const cssHeight = parseFloat(getComputedStyle(canvas).height);
  const width = Math.max(rect.width || 0, wrapRect?.width || 0, fallbackWidth);
  const height = Math.max(cssHeight || fallbackHeight, fallbackHeight * 0.85);
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  return { width, height, dpr };
}

function eventClientPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  return {
    clientX: touch?.clientX ?? event.clientX,
    clientY: touch?.clientY ?? event.clientY
  };
}

function isTouchLikeEvent(event) {
  return event.pointerType === "touch" || event.type.startsWith("touch");
}

function isCoarseChartInput(event) {
  return event?.pointerType === "touch" || event?.type?.startsWith("touch") || window.matchMedia?.("(pointer: coarse)")?.matches;
}

function setChartReadout(chartId, title, lines = []) {
  const readout = $(`#${chartId}Readout`);
  if (!readout) return;
  readout.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    ${lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}
  `;
}

function resetChartReadout(chartId, message) {
  const readout = $(`#${chartId}Readout`);
  if (readout) readout.textContent = message;
}

function scheduleTouchTooltipHide() {
  clearTimeout(chartTouchHideTimer);
  chartTouchHideTimer = setTimeout(() => {
    hideEquityTooltip();
    hideBarChartTooltip();
  }, 3600);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function positionFloatingTooltip(tooltip, clientX, clientY) {
  tooltip.style.transform = "none";
  const width = tooltip.offsetWidth || 280;
  const height = tooltip.offsetHeight || 120;
  const left = clamp(clientX + 12, 12, Math.max(window.innerWidth - width - 12, 12));
  const preferredTop = clientY - height - 12;
  const top = preferredTop > 12
    ? preferredTop
    : clamp(clientY + 12, 12, Math.max(window.innerHeight - height - 12, 12));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function positionChartTooltip(tooltip, canvas, x, y) {
  const wrap = canvas.closest(".chart-wrap");
  if (!wrap) return;
  tooltip.style.transform = "none";
  const width = tooltip.offsetWidth || 240;
  const height = tooltip.offsetHeight || 110;
  const canvasLeft = canvas.offsetLeft;
  const canvasTop = canvas.offsetTop;
  const maxLeft = Math.max(wrap.clientWidth - width - 8, 8);
  const left = clamp(canvasLeft + x + 10, 8, maxLeft);
  const preferredTop = canvasTop + y - height - 10;
  const maxTop = Math.max(canvasTop + canvas.clientHeight - height - 8, 8);
  const top = preferredTop > 8 ? preferredTop : clamp(canvasTop + y + 10, 8, maxTop);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function isCompactChart(width = window.innerWidth) {
  return width < 560;
}

function compactChartLabel(label) {
  const text = String(label || "");
  const bucketLabels = {
    "< -2R": "<-2",
    "-2 to -1R": "-2/-1",
    "-1 to 0R": "-1/0",
    "0R": "0",
    "0 to 1R": "0/1",
    "1 to 2R": "1/2",
    "> 2R": ">2"
  };
  if (bucketLabels[text]) return bucketLabels[text];
  const dateMatch = text.match(/^([A-Z][a-z]{2})\s+(\d{1,2}),/);
  if (dateMatch) return `${dateMatch[1]} ${dateMatch[2]}`;
  if (text.includes("/")) return text.replace("/", "");
  return text.length > 9 ? `${text.slice(0, 8)}...` : text;
}

function drawCanvasLabel(context, text, x, y, options = {}) {
  const label = String(text || "");
  if (!label) return;
  const previousAlign = context.textAlign;
  const paddingX = options.paddingX ?? 5;
  const paddingY = options.paddingY ?? 3;
  const metrics = context.measureText(label);
  const width = metrics.width + paddingX * 2;
  const height = options.height ?? 20;
  const left = clamp(x - width / 2, options.minLeft ?? 0, options.maxLeft ?? Number.POSITIVE_INFINITY);
  const top = y - height + 4;
  context.fillStyle = options.background || "rgba(253, 252, 248, 0.86)";
  context.fillRect(left, top, width, height);
  context.fillStyle = options.color || "#1f2826";
  context.textAlign = "center";
  context.fillText(label, left + width / 2, y);
  context.textAlign = previousAlign;
}

function drawModernValueLabel(context, text, x, y, options = {}) {
  const label = String(text || "");
  if (!label) return;
  const previousAlign = context.textAlign;
  const previousBaseline = context.textBaseline;
  const previousLineWidth = context.lineWidth;
  const previousStroke = context.strokeStyle;
  const previousFill = context.fillStyle;
  const previousShadowColor = context.shadowColor;
  const previousShadowBlur = context.shadowBlur;
  const previousShadowOffsetY = context.shadowOffsetY;

  const metrics = context.measureText(label);
  const minX = options.minX ?? metrics.width / 2 + 4;
  const maxX = options.maxX ?? Number.POSITIVE_INFINITY;
  const safeX = clamp(x, minX, maxX);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = options.outlineWidth ?? 6;
  context.strokeStyle = options.outline || "rgba(255, 255, 255, 0.9)";
  context.shadowColor = options.shadowColor || "rgba(31, 40, 38, 0.26)";
  context.shadowBlur = options.shadowBlur ?? 6;
  context.shadowOffsetY = options.shadowOffsetY ?? 1.5;
  context.strokeText(label, safeX, y);
  context.fillStyle = options.color || "#1f2826";
  context.fillText(label, safeX, y);

  context.textAlign = previousAlign;
  context.textBaseline = previousBaseline;
  context.lineWidth = previousLineWidth;
  context.strokeStyle = previousStroke;
  context.fillStyle = previousFill;
  context.shadowColor = previousShadowColor;
  context.shadowBlur = previousShadowBlur;
  context.shadowOffsetY = previousShadowOffsetY;
}

function drawAxisText(context, text, x, y, options = {}) {
  drawModernValueLabel(context, text, x, y, {
    color: options.color || "#1f2826",
    outline: options.outline || "rgba(255, 255, 255, 0.96)",
    outlineWidth: options.outlineWidth || 5,
    shadowBlur: options.shadowBlur || 2,
    shadowColor: options.shadowColor || "rgba(31, 40, 38, 0.14)",
    minX: options.minX,
    maxX: options.maxX
  });
}

function ensureChartHitLayer(canvas) {
  const wrap = canvas.closest(".chart-wrap");
  if (!wrap) return null;
  let layer = wrap.querySelector(`.chart-hit-layer[data-chart="${canvas.id}"]`);
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "chart-hit-layer";
    layer.dataset.chart = canvas.id;
    canvas.insertAdjacentElement("afterend", layer);
  }

  layer.innerHTML = "";
  layer.style.left = `${canvas.offsetLeft}px`;
  layer.style.top = `${canvas.offsetTop}px`;
  layer.style.width = `${canvas.clientWidth}px`;
  layer.style.height = `${canvas.clientHeight}px`;
  return layer;
}

function clearChartHitLayer(chartId) {
  const canvas = $(`#${chartId}`);
  const layer = canvas?.closest(".chart-wrap")?.querySelector(`.chart-hit-layer[data-chart="${chartId}"]`);
  if (layer) layer.innerHTML = "";
}

function ensureChartLabelLayer(canvas) {
  const wrap = canvas.closest(".chart-wrap");
  if (!wrap) return null;
  let layer = wrap.querySelector(`.chart-label-layer[data-chart="${canvas.id}"]`);
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "chart-label-layer";
    layer.dataset.chart = canvas.id;
    canvas.insertAdjacentElement("afterend", layer);
  }

  layer.innerHTML = "";
  layer.style.left = `${canvas.offsetLeft}px`;
  layer.style.top = `${canvas.offsetTop}px`;
  layer.style.width = `${canvas.clientWidth}px`;
  layer.style.height = `${canvas.clientHeight}px`;
  return layer;
}

function clearChartLabelLayer(chartId) {
  const canvas = $(`#${chartId}`);
  const layer = canvas?.closest(".chart-wrap")?.querySelector(`.chart-label-layer[data-chart="${chartId}"]`);
  if (layer) layer.innerHTML = "";
}

function chartPixelScales(canvas, width, height) {
  return {
    x: canvas.clientWidth / Math.max(width, 1),
    y: canvas.clientHeight / Math.max(height, 1)
  };
}

function appendChartLabel(layer, text, x, y, className = "") {
  if (!layer || !text) return;
  const label = document.createElement("span");
  label.className = `chart-dom-label ${className}`.trim();
  label.textContent = text;
  label.style.left = `${x}px`;
  label.style.top = `${y}px`;
  layer.appendChild(label);
}

function renderEquityDomLabels(canvas, points, labels, dimensions) {
  const layer = ensureChartLabelLayer(canvas);
  if (!layer) return;
  const { width, height, padding, yMax, yMin, compact } = dimensions;
  const scale = chartPixelScales(canvas, width, height);
  const scaledX = (value) => value * scale.x;
  const scaledY = (value) => value * scale.y;
  const xMax = canvas.clientWidth - 20;

  appendChartLabel(layer, formatR(yMax), clamp(scaledX(padding.left), 20, xMax), scaledY(padding.top + 4), "axis");
  appendChartLabel(layer, formatR(yMin), clamp(scaledX(padding.left), 20, xMax), scaledY(height - padding.bottom + 2), "axis");

  const indexes = compact
    ? [...new Set([0, points.length - 1])]
    : [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  indexes.forEach((index) => {
    const point = points[index];
    const text = compact ? compactChartLabel(labels[index]) : labels[index] || "";
    appendChartLabel(layer, text, clamp(scaledX(point.x), 24, xMax), scaledY(height - 14), "axis");
  });
}

function renderBarDomLabels(canvas, bars, options, dimensions) {
  const layer = ensureChartLabelLayer(canvas);
  if (!layer) return;
  const { width, height, padding, compact } = dimensions;
  const scale = chartPixelScales(canvas, width, height);
  const maxX = canvas.clientWidth - 20;
  const shouldShowAll = !compact || bars.length <= 8;

  bars.forEach((bar, index) => {
    const x = clamp((bar.x + bar.width / 2) * scale.x, 20, maxX);
    const value = toNumber(bar.value);
    const isCount = options.colorMode === "count";

    if (value !== 0 && shouldShowAll) {
      const valueText = options.formatter ? options.formatter(value) : numberFormatter.format(value);
      const rawValueY = value >= 0
        ? Math.max(bar.y - 12, 22)
        : Math.min(bar.y + 20, height - padding.bottom - 8);
      const insideBar = value < 0 && rawValueY >= bar.y && rawValueY <= bar.y + bar.height;
      const valueClass = [
        "value",
        isCount ? "count" : value >= 0 ? "positive" : "negative",
        insideBar ? "inside-bar" : ""
      ].filter(Boolean).join(" ");
      appendChartLabel(layer, valueText, x, rawValueY * scale.y, valueClass);
    }

    if (shouldShowAll) {
      const text = compact ? compactChartLabel(bar.label) : String(bar.label).length > 10 ? `${String(bar.label).slice(0, 9)}...` : String(bar.label);
      appendChartLabel(layer, text, x, (height - 30) * scale.y, "axis");
    }
  });
}

function makeHitButton(label, zone, onPick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chart-hit-zone";
  button.setAttribute("aria-label", label);
  button.style.left = `${zone.left}px`;
  button.style.top = `${zone.top}px`;
  button.style.width = `${zone.width}px`;
  button.style.height = `${zone.height}px`;
  const pick = (event) => {
    event.preventDefault();
    const point = eventClientPoint(event);
    onPick(point, event);
  };
  button.addEventListener("pointerenter", pick);
  button.addEventListener("pointermove", pick);
  button.addEventListener("pointerdown", pick);
  button.addEventListener("click", pick);
  button.addEventListener("focus", (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPick({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }, event);
  });
  return button;
}

function installBarHitZones(canvas, bars, options) {
  const layer = ensureChartHitLayer(canvas);
  if (!layer) return;
  bars.forEach((bar) => {
    const zone = bar.zone || {
      left: Math.max(bar.x - 16, 0),
      top: Math.max(bar.y - 24, 0),
      width: Math.max(bar.width + 32, 44),
      height: Math.max(bar.height + 48, 44)
    };
    const button = makeHitButton(`Show ${bar.label} chart details`, zone, (point, event) => {
      showBarDetail(canvas, bar, point.clientX, point.clientY, isTouchLikeEvent(event));
    });
    layer.appendChild(button);
  });

  const defaultBar = bars.reduce((best, bar) => (Math.abs(bar.value) > Math.abs(best?.value || 0) ? bar : best), bars[0] || null);
  if (defaultBar) {
    const summary = barSummary(defaultBar, options);
    setChartReadout(canvas.id, defaultBar.label, summary.lines);
  }
}

function installEquityHitZones(canvas, points) {
  const layer = ensureChartHitLayer(canvas);
  if (!layer) return;
  points.forEach((point) => {
    const size = 56;
    const zone = {
      left: Math.max(point.x - size / 2, 0),
      top: Math.max(point.y - size / 2, 0),
      width: size,
      height: size
    };
    const button = makeHitButton(`Show ${point.label} curve details`, zone, (eventPoint, event) => {
      showEquityDetail(point, eventPoint.clientX, eventPoint.clientY, isTouchLikeEvent(event));
    });
    layer.appendChild(button);
  });

  const lastPoint = points[points.length - 1];
  if (lastPoint) {
    const summary = equitySummary(lastPoint);
    setChartReadout("equityChart", lastPoint.label, summary.lines);
  }
}

function drawEquityChart(equity, period = "day") {
  const canvas = $("#equityChart");
  const context = canvas.getContext("2d");
  hideEquityTooltip();
  resetChartReadout("equityChart", "Tap or drag the curve to see period details.");
  const { width, height, dpr } = getCanvasDisplaySize(canvas, 320);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  context.fillStyle = "#fffefb";
  context.fillRect(0, 0, width, height);

  const compact = isCompactChart(width);
  const padding = compact
    ? { top: 30, right: 16, bottom: 50, left: 36 }
    : { top: 24, right: 24, bottom: 34, left: 46 };
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
    clearChartHitLayer("equityChart");
    clearChartLabelLayer("equityChart");
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
  context.lineWidth = compact ? 4 : 3;
  context.stroke();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, compact ? 5 : 3, 0, Math.PI * 2);
    context.fillStyle = point.value >= 0 ? "#0f766e" : "#be123c";
    context.fill();
  });

  equityChartState = { points, period, width, height };
  renderEquityDomLabels(canvas, points, labels, { width, height, padding, yMax, yMin, compact });
  installEquityHitZones(canvas, points);
}

function drawChartFrame(context, width, height, padding) {
  context.strokeStyle = "#d9ded7";
  context.lineWidth = 1;
  context.strokeRect(padding.left, padding.top, width - padding.left - padding.right, height - padding.top - padding.bottom);
}

function drawChartLabels(context, points, labels, height, width = 320) {
  if (!points.length) return;
  const compact = isCompactChart(width);
  const indexes = compact
    ? [...new Set([0, points.length - 1])]
    : [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  context.font = compact ? "800 13px Segoe UI, sans-serif" : "700 12px Segoe UI, sans-serif";
  indexes.forEach((index) => {
    const point = points[index];
    const label = compact ? compactChartLabel(labels[index]) : labels[index] || "";
    context.textAlign = index === 0 ? "left" : index === points.length - 1 ? "right" : "center";
    drawAxisText(context, label, point.x, height - 13, {
      minX: 18,
      maxX: width - 18,
      outlineWidth: compact ? 6 : 5
    });
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
    valueLabel: "Net P/L",
    prompt: "Tap a bar to see period P/L details."
  });
  drawBarChart("pairPlChart", pairData, {
    formatter: (value) => currencyFormatter.format(value),
    empty: "No pair P/L yet",
    valueLabel: "Net P/L",
    prompt: "Tap a bar to see pair performance details."
  });
  drawBarChart("directionPlChart", directionData, {
    formatter: (value) => currencyFormatter.format(value),
    empty: "No long/short P/L yet",
    valueLabel: "Net P/L",
    prompt: "Tap a bar to compare buy and sell performance."
  });
  drawBarChart("rDistributionChart", rDistributionData(sourceTrades), {
    formatter: (value) => `${numberFormatter.format(value)} trades`,
    colorMode: "count",
    empty: "No R distribution yet",
    valueLabel: "Orders",
    prompt: "Tap a bar to inspect the R bucket."
  });
}

function drawBarChart(canvasId, data, options = {}) {
  const canvas = $(`#${canvasId}`);
  if (!canvas) return;
  hideBarChartTooltip();
  resetChartReadout(canvasId, options.prompt || "Tap a bar to see chart details.");
  const context = canvas.getContext("2d");
  const fallbackHeight = Number(canvas.getAttribute("height")) || 260;
  const { width, height, dpr } = getCanvasDisplaySize(canvas, fallbackHeight);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffefb";
  context.fillRect(0, 0, width, height);

  const cleanData = data.filter((item) => item && item.label);
  if (!cleanData.length || cleanData.every((item) => toNumber(item.value) === 0)) {
    barChartStates[canvasId] = { bars: [], options };
    clearChartHitLayer(canvasId);
    clearChartLabelLayer(canvasId);
    resetChartReadout(canvasId, options.empty || "No data yet");
    context.fillStyle = "#69736f";
    context.font = "700 15px Segoe UI, sans-serif";
    context.fillText(options.empty || "No data yet", 18, height / 2);
    return;
  }

  const compact = isCompactChart(width);
  const padding = compact
    ? { top: 42, right: 12, bottom: 84, left: 34 }
    : { top: 24, right: 18, bottom: 54, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = cleanData.map((item) => toNumber(item.value));
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(maxValue - minValue, 1);
  const baseline = padding.top + chartHeight - ((0 - minValue) / range) * chartHeight;
  const slotWidth = chartWidth / cleanData.length;
  const barWidth = Math.max(Math.min(slotWidth * 0.68, compact ? 72 : 92), Math.min(slotWidth * 0.82, 10));
  const bars = [];

  context.strokeStyle = "#d9ded7";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, baseline);
  context.lineTo(width - padding.right, baseline);
  context.stroke();

  cleanData.forEach((item, index) => {
    const value = toNumber(item.value);
    const slotLeft = padding.left + index * slotWidth;
    const x = slotLeft + (slotWidth - barWidth) / 2;
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
      zone: {
        left: Math.max(slotLeft, 0),
        top: Math.max(padding.top - 18, 0),
        width: Math.max(slotWidth, 44),
        height: chartHeight + padding.bottom + 14
      },
      raw: item
    });

    context.textAlign = "center";
  });

  context.textAlign = "left";
  barChartStates[canvasId] = { bars, options };
  renderBarDomLabels(canvas, bars, options, { width, height, padding, compact });
  installBarHitZones(canvas, bars, options);
}

function barSummary(bar, options = {}) {
  const formatter = options.formatter || ((value) => numberFormatter.format(value));
  const valueText = formatter(bar.value);
  const conclusion =
    options.colorMode === "count"
      ? "Distribution bucket for reviewing outcome quality."
      : bar.value > 0
        ? "Positive contribution in the selected period."
        : bar.value < 0
          ? "Negative contribution; review entries, exits, and mistakes."
          : "Flat contribution.";
  return {
    valueText,
    conclusion,
    lines: [
      `${options.valueLabel || "Value"}: ${valueText}`,
      bar.detail || `${numberFormatter.format(bar.count)} orders`,
      conclusion
    ]
  };
}

function showBarDetail(canvas, bar, clientX, clientY, persist = false) {
  const state = barChartStates[canvas.id];
  const tooltip = $("#barChartTooltip");
  if (!state) return;
  const summary = barSummary(bar, state.options);
  setChartReadout(canvas.id, bar.label, summary.lines);

  if (!tooltip || isCoarseChartInput({ type: persist ? "touch" : "mouse", pointerType: persist ? "touch" : "mouse" })) {
    hideBarChartTooltip();
    return;
  }

  tooltip.innerHTML = `
    <strong>${escapeHtml(bar.label)}</strong>
    <p>${escapeHtml(summary.lines[0])}</p>
    <p>${escapeHtml(summary.lines[1])}</p>
    <p>${escapeHtml(summary.conclusion)}</p>
  `;
  positionFloatingTooltip(tooltip, clientX, clientY);
  tooltip.classList.add("visible");
  if (persist) scheduleTouchTooltipHide();
}

function findBarFromPoint(state, x, y) {
  const zoneMatch = state.bars.find((item) => {
    const zone = item.zone;
    if (!zone) return false;
    return x >= zone.left && x <= zone.left + zone.width && y >= zone.top && y <= zone.top + zone.height;
  });
  if (zoneMatch) return zoneMatch;

  return state.bars.reduce((best, item) => {
    const centerX = item.x + item.width / 2;
    const distance = Math.abs(centerX - x);
    return distance < best.distance ? { bar: item, distance } : best;
  }, { bar: null, distance: Infinity }).bar;
}

function pointerStillInsideChart(event) {
  const related = event.relatedTarget;
  if (!(related instanceof Node)) return false;
  return Boolean(event.currentTarget.closest(".chart-wrap")?.contains(related));
}

function handleBarChartPointerMove(event) {
  const canvas = event.currentTarget;
  const state = barChartStates[canvas.id];
  if (!state || !state.bars.length) return;

  const point = eventClientPoint(event);
  if (!Number.isFinite(point.clientX) || !Number.isFinite(point.clientY)) return;
  const rect = canvas.getBoundingClientRect();
  const x = point.clientX - rect.left;
  const y = point.clientY - rect.top;
  const bar = findBarFromPoint(state, x, y);

  if (!bar) {
    if (!isTouchLikeEvent(event)) hideBarChartTooltip();
    return;
  }

  showBarDetail(canvas, bar, point.clientX, point.clientY, isTouchLikeEvent(event));
}

function hideBarChartTooltip() {
  const tooltip = $("#barChartTooltip");
  if (tooltip) tooltip.classList.remove("visible");
}

function handleBarChartPointerLeave(event) {
  if (isTouchLikeEvent(event) || pointerStillInsideChart(event)) return;
  hideBarChartTooltip();
}

function equitySummary(point) {
  const periodR = toNumber(point.periodR);
  const conclusion =
    point.count === 0
      ? "Starting point before recorded trades."
      : periodR > 0
        ? "Positive period; execution added edge."
        : periodR < 0
          ? "Negative period; review mistakes and setup quality."
          : "Flat period; no net R change.";
  return {
    conclusion,
    lines: [
      `${point.count || 0} trades, ${formatR(periodR)} this ${equityChartState.period}`,
      `Cumulative ${formatR(point.value)}`,
      conclusion
    ]
  };
}

function showEquityDetail(point, clientX, clientY, persist = false) {
  const canvas = $("#equityChart");
  const tooltip = $("#equityTooltip");
  if (!canvas) return;
  const summary = equitySummary(point);
  setChartReadout("equityChart", point.label, summary.lines);

  if (!tooltip || isCoarseChartInput({ type: persist ? "touch" : "mouse", pointerType: persist ? "touch" : "mouse" })) {
    hideEquityTooltip();
    return;
  }

  tooltip.innerHTML = `
    <strong>${escapeHtml(point.label)}</strong>
    <p>${escapeHtml(summary.lines[0])}</p>
    <p>${escapeHtml(summary.lines[1])}. ${escapeHtml(summary.conclusion)}</p>
  `;
  positionChartTooltip(tooltip, canvas, point.x, point.y);
  tooltip.classList.add("visible");
  if (persist) scheduleTouchTooltipHide();
}

function handleEquityPointerMove(event) {
  const canvas = $("#equityChart");
  if (!canvas || !equityChartState.points.length) return;

  const eventPoint = eventClientPoint(event);
  if (!Number.isFinite(eventPoint.clientX) || !Number.isFinite(eventPoint.clientY)) return;
  const rect = canvas.getBoundingClientRect();
  const x = eventPoint.clientX - rect.left;
  const y = eventPoint.clientY - rect.top;
  const nearest = equityChartState.points.reduce((best, point) => {
    const distance = Math.hypot(point.x - x, point.y - y);
    return distance < best.distance ? { point, distance } : best;
  }, { point: null, distance: Infinity });

  const touchLike = isTouchLikeEvent(event);
  if (!nearest.point || (!touchLike && nearest.distance > 44)) {
    if (!touchLike) hideEquityTooltip();
    return;
  }

  showEquityDetail(nearest.point, eventPoint.clientX, eventPoint.clientY, touchLike);
}

function hideEquityTooltip() {
  const tooltip = $("#equityTooltip");
  if (tooltip) tooltip.classList.remove("visible");
}

function handleEquityPointerLeave(event) {
  if (isTouchLikeEvent(event) || pointerStillInsideChart(event)) return;
  hideEquityTooltip();
}

function bindChartInteractions(canvas, moveHandler, leaveHandler) {
  if (!canvas) return;
  canvas.addEventListener("pointermove", moveHandler);
  canvas.addEventListener("pointerdown", moveHandler);
  canvas.addEventListener("click", moveHandler);
  const wrap = canvas.closest(".chart-wrap");
  if (wrap && !wrap.dataset.hoverBound) {
    wrap.dataset.hoverBound = "true";
    wrap.addEventListener("pointerleave", leaveHandler);
  }

  if (!window.PointerEvent) {
    canvas.addEventListener("touchstart", moveHandler, { passive: true });
    canvas.addEventListener("touchmove", moveHandler, { passive: true });
  }
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
    openTime: normalizeTimeValue(data.get("openTime")),
    pair: normalizePair(data.get("pair")),
    session: data.get("session"),
    sessionAuto: form.elements.session.dataset.auto === "true",
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

function scrollTradeTicketIntoView() {
  const ticketPanel = $("#tradeForm")?.closest(".panel");
  if (!ticketPanel) return;
  const rect = ticketPanel.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const comfortableTop = 16;
  const comfortableBottom = Math.max(viewportHeight - 40, comfortableTop);
  const alreadyComfortable = rect.top >= comfortableTop && rect.top <= comfortableBottom && rect.bottom > 120;
  if (alreadyComfortable) return;
  ticketPanel.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
}

function fillTradeForm(trade) {
  const form = $("#tradeForm");
  ensurePairAvailable(trade.pair, trade.contractSize);
  renderPairOptions(trade.pair);
  form.elements.id.value = trade.id;
  form.elements.date.value = trade.date;
  form.elements.openTime.value = tradeOpenTime(trade);
  form.elements.pair.value = normalizePair(trade.pair);
  if (!form.elements.pair.value) form.elements.pair.value = defaultPair;
  syncPairTicket(form.elements.pair.value);
  const inferredSession = trade.session || inferSessionFromTradeDateTime(trade.date, tradeOpenTime(trade));
  form.elements.session.value = inferredSession;
  form.elements.session.dataset.auto = trade.sessionAuto || (!trade.session && inferredSession) ? "true" : "";
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
  pendingMt5OrderId = "";
  form.reset();
  form.elements.id.value = "";
  form.elements.date.value = localDateKey();
  form.elements.openTime.value = "";
  form.elements.session.dataset.auto = "";
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
    "openTime",
    "mt5ExternalId",
    "mt5PositionId",
    "mt5DealId",
    "mt5BrokerAccount",
    "mt5BrokerServer",
    "mt5Source",
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
      showAuthOverlay(accounts.some(canLocalSignIn) ? "login" : "cloud", false);
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

  const cloudAuthForm = $("#cloudAuthForm");
  if (cloudAuthForm) cloudAuthForm.addEventListener("submit", handleCloudSignIn);

  const cloudSignUpButton = $("#cloudSignUpBtn");
  if (cloudSignUpButton) cloudSignUpButton.addEventListener("click", handleCloudSignUp);

  const openCloudAuthButton = $("#openCloudAuthBtn");
  if (openCloudAuthButton) openCloudAuthButton.addEventListener("click", () => showAuthOverlay("cloud", false));

  const openCloudProfileButton = $("#openCloudProfileBtn");
  if (openCloudProfileButton) openCloudProfileButton.addEventListener("click", () => openCloudProfile());

  const migrateCloudButton = $("#migrateCloudBtn");
  if (migrateCloudButton) migrateCloudButton.addEventListener("click", migrateActiveAccountToCloud);

  const syncNowButton = $("#syncNowBtn");
  if (syncNowButton) {
    syncNowButton.addEventListener("click", () => {
      upsertCloudSnapshot(currentJournalSnapshot(), "manual").then(() => fetchMt5DetectedOrders({ silent: true })).catch((error) => showToast(friendlyCloudError(error)));
    });
  }

  const cloudSignOutButton = $("#cloudSignOutBtn");
  if (cloudSignOutButton) cloudSignOutButton.addEventListener("click", handleCloudSignOut);

  const generateMt5TokenButton = $("#generateMt5TokenBtn");
  if (generateMt5TokenButton) generateMt5TokenButton.addEventListener("click", () => generateMt5BridgeToken("desktop"));

  const generateMt5MobileTokenButton = $("#generateMt5MobileTokenBtn");
  if (generateMt5MobileTokenButton) generateMt5MobileTokenButton.addEventListener("click", () => generateMt5BridgeToken("mobile"));

  const generateMt5HistoryButton = $("#generateMt5HistoryTokenBtn");
  if (generateMt5HistoryButton) generateMt5HistoryButton.addEventListener("click", createMt5HistoryRequest);

  const copyMt5BridgeButton = $("#copyMt5BridgeBtn");
  if (copyMt5BridgeButton) copyMt5BridgeButton.addEventListener("click", copyMt5BridgeSetup);

  const refreshMt5OrdersButton = $("#refreshMt5OrdersBtn");
  if (refreshMt5OrdersButton) {
    refreshMt5OrdersButton.addEventListener("click", () => {
      mt5HistoryReviewRange = { ...mt5HistoryReviewRange, active: false };
      fetchMt5DetectedOrders();
    });
  }

  const mt5InboxList = $("#mt5InboxList");
  if (mt5InboxList) {
    mt5InboxList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mt5-action]");
      if (!button) return;
      if (button.dataset.mt5Action === "record") prefillTradeFromMt5Order(button.dataset.id);
      if (button.dataset.mt5Action === "ignore") markMt5OrderStatus(button.dataset.id, "ignored");
    });
  }

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
      if (button.dataset.view === "analytics") rerenderAnalyticsSoon(60);
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
      rerenderAnalyticsSoon(0);
    });
  });

  bindChartInteractions($("#equityChart"), handleEquityPointerMove, handleEquityPointerLeave);
  ["periodPlChart", "pairPlChart", "directionPlChart", "rDistributionChart"].forEach((id) => {
    const canvas = $(`#${id}`);
    if (!canvas) return;
    bindChartInteractions(canvas, handleBarChartPointerMove, handleBarChartPointerLeave);
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
    if (pendingMt5OrderId) {
      markMt5OrderStatus(pendingMt5OrderId, "recorded");
      pendingMt5OrderId = "";
    }
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
      scrollTradeTicketIntoView();
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

  $$("[data-sort-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sortKey || "datetime";
      if (tradeSort.key === key) {
        tradeSort.direction = tradeSort.direction === "asc" ? "desc" : "asc";
      } else {
        tradeSort = { key, direction: key === "datetime" ? "desc" : "asc" };
      }
      renderTable();
    });
  });

  const form = $("#tradeForm");
  ["date", "openTime"].forEach((name) => {
    const handler = () => syncSessionFromOpenTime();
    form.elements[name].addEventListener("input", handler);
    form.elements[name].addEventListener("change", handler);
  });
  form.elements.session.addEventListener("change", () => {
    form.elements.session.dataset.auto = "";
  });
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

  window.addEventListener("resize", () => rerenderAnalyticsSoon());
  window.addEventListener("orientationchange", () => rerenderAnalyticsSoon(320));
}

function bootstrap() {
  initSupabaseClient();
  initAccountSession();
  renderPairOptions(defaultPair);
  renderMarketChartOptions(marketChartPair);
  bindEvents();
  resetTradeForm();
  render();
  renderTradingViewWidget();
  syncAccountUi();
  renderDstWidget();
  setInterval(renderDstWidget, 60000);
  if (!activeAccount) {
    showAuthOverlay(accounts.some(canLocalSignIn) ? "login" : "cloud", true);
  }
  registerServiceWorker();
  initCloudSession();
}

bootstrap();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  navigator.serviceWorker.register("./sw.js").then((registration) => {
    registration.update();
  }).catch(() => {
    // Some local file and non-secure hosts do not allow service workers.
  });
}
