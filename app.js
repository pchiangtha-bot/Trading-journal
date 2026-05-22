const storageKeys = {
  trades: "fx-edge-journal.trades.v1",
  strategies: "fx-edge-journal.strategies.v1",
  customPairs: "fx-edge-journal.custom-pairs.v1",
  settings: "fx-edge-journal.settings.v1",
  accounts: "fx-edge-journal.accounts.v1",
  activeAccount: "fx-edge-journal.active-account.v1",
  legacyMigrated: "fx-edge-journal.legacy-migrated.v1",
  cloudClientId: "fx-edge-journal.cloud-client-id.v1",
  cloudSessionMode: "fx-edge-journal.cloud-session-mode.v1",
  mt5DesktopProtocolInstalled: "fx-edge-journal.mt5-desktop-protocol-installed.v1",
  dailyReviewEvidence: "fx-edge-journal.daily-review-evidence.v1",
  scrollPosition: "fx-edge-journal.scroll-position.v1"
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
let periodPlPeriod = "day";
let equityChartMetric = "r";
let equityChartState = { points: [], metric: "r" };
let barChartStates = {};
let chartTouchHideTimer = null;
let analyticsResizeTimer = null;
let analyticsRange = "all";
let analyticsCustomStart = "";
let analyticsCustomEnd = "";
let historyRange = "all";
let historyCustomStart = "";
let historyCustomEnd = "";
let setupPlaybookSearch = "";
let setupPlaybookStatus = "all";
let setupPlaybookType = "all";
let strategySearch = "";
let strategyQuality = "all";
let strategySetupType = "all";
let loginReturnView = "journal";
let marketChartPair = defaultPair;
let marketChartInterval = "1D";
let marketChartRenderKey = "";
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

const customChoiceValue = "__add_custom_choice__";
const defaultSetups = [
  "Liquidity sweep",
  "Break and retest",
  "Trend pullback",
  "Range rejection",
  "News fade",
  "H1 pullback reaction",
  "FVG reaction",
  "Bearish continuation",
  "Bullish reversal confirmation",
  "Liquidity sweep reversal",
  "Liquidity hunt",
  "London sweep",
  "New York continuation",
  "Retest entry",
  "H1 reversal bar"
];
const defaultSetupTypes = [
  "H1 Pullback Reaction",
  "Break and Retest",
  "Bearish Continuation",
  "Bullish Reversal Confirmation",
  "Liquidity Sweep Reversal",
  "FVG Reaction",
  "Range Rejection",
  "News Fade",
  "Custom / Other"
];
const setupTypeBySetup = {
  "Liquidity sweep": "Liquidity Sweep Reversal",
  "Liquidity sweep reversal": "Liquidity Sweep Reversal",
  "Liquidity hunt": "Liquidity Sweep Reversal",
  "London sweep": "Liquidity Sweep Reversal",
  "Break and retest": "Break and Retest",
  "Retest entry": "Break and Retest",
  "Trend pullback": "H1 Pullback Reaction",
  "H1 pullback reaction": "H1 Pullback Reaction",
  "FVG reaction": "FVG Reaction",
  "Bearish continuation": "Bearish Continuation",
  "Bullish reversal confirmation": "Bullish Reversal Confirmation",
  "Range rejection": "Range Rejection",
  "News fade": "News Fade",
  "H1 reversal bar": "Bullish Reversal Confirmation"
};
const setupTypeBlueprints = {
  "H1 Pullback Reaction": {
    description: "Reaction from a major H1 area such as fib, FVG, support/resistance, or liquidity.",
    valid: ["H1 context is clear", "Price reaches a logical retracement zone", "M15 supports the reaction"],
    invalid: ["Entry before price reaches the zone", "M5 bounce only", "SL is not beyond invalidation"],
    tags: ["H1 Pullback", "Fib Reaction", "FVG Reaction", "Rejection Entry"]
  },
  "Break and Retest": {
    description: "Continuation after price breaks meaningful structure, retests, then holds.",
    valid: ["Meaningful level breaks", "M15 closes beyond the level", "Retest holds with rejection"],
    invalid: ["No candle-close confirmation", "FOMO entry after an extended break", "Retest fails"],
    tags: ["Break Retest", "Structure Break", "Continuation"]
  },
  "Bearish Continuation": {
    description: "Sell setup from bearish structure, lower high rejection, then continuation lower.",
    valid: ["Bearish H1/M15 structure exists", "Lower high rejects", "Meaningful swing low breaks"],
    invalid: ["No swing low break", "Sell only because price feels heavy", "Instant reversal from failed buy"],
    tags: ["Bearish Continuation", "Lower High", "Swing Low Break", "Sell-Side Liquidity"]
  },
  "Bullish Reversal Confirmation": {
    description: "Buy setup after bearish pressure weakens and bullish structure confirms.",
    valid: ["Break above previous lower high", "M15 closes above structure", "Higher low or retest holds"],
    invalid: ["Bounce only", "M5 divergence only", "No break above previous lower high"],
    tags: ["Bullish Reversal", "Break of Lower High", "Higher Low", "Reversal Confirmation"]
  },
  "Liquidity Sweep Reversal": {
    description: "Price sweeps a meaningful high/low, rejects, then reclaims structure.",
    valid: ["Prior high/low is swept", "Rejection or displacement appears", "M15 reclaim confirms"],
    invalid: ["Sweep assumed before rejection", "No reclaim confirmation", "Late entry creates poor R:R"],
    tags: ["Liquidity Sweep", "Stop Hunt", "Reclaim", "Reversal Attempt"]
  },
  "FVG Reaction": {
    description: "Reaction from a fair value gap aligned with H1/M15 structure.",
    valid: ["FVG is visible on H1/M15", "FVG overlaps with structure or liquidity", "Rejection or displacement appears"],
    invalid: ["FVG is unclear", "Against stronger structure without confirmation", "Entry only because price touched the FVG"],
    tags: ["FVG Reaction", "Imbalance", "H1 FVG", "M15 FVG"]
  },
  "Range Rejection": {
    description: "Trade from a clear range edge after rejection confirms.",
    valid: ["Range boundaries are visible", "Entry is near an edge", "Target is toward the opposite side or liquidity"],
    invalid: ["Entry in the middle of the range", "No rejection", "News volatility breaks the range"],
    tags: ["Range Edge", "Rejection", "Mean Reversion"]
  },
  "News Fade": {
    description: "Post-news reaction only after volatility settles and structure confirms.",
    valid: ["News spike is over", "Reclaim or rejection confirms", "Risk is reduced for volatility"],
    invalid: ["Entry during the spike", "No confirmation", "Spread or slippage risk is too high"],
    tags: ["News Fade", "Volatility Reclaim", "Post-News Reaction"]
  },
  "Custom / Other": {
    description: "Custom setup that needs its own written conditions before it becomes a playbook.",
    valid: ["Define the exact trigger", "Define invalidation", "Define risk and review rule"],
    invalid: ["No written trigger", "Unclear SL/TP", "Emotion-led entry"],
    tags: ["Custom Setup"]
  }
};
const defaultPositiveTags = [
  "None",
  "Patient Hold",
  "Good Risk Control",
  "H1 Structure Respected",
  "M15 Confirmation",
  "Clean Setup",
  "Waited for Retest",
  "No Emotional Reversal",
  "Accepted SL",
  "Protected Profit",
  "Stopped After Plan"
];
const defaultMistakeTags = [
  "None",
  "Revenge Trade",
  "FOMO",
  "Overtrade",
  "Instant Reversal",
  "Early Exit",
  "Moved SL Emotionally",
  "M5 Noise Reaction",
  "No Clear Setup",
  "Chasing Entry",
  "No M15 Confirmation",
  "Ignored H1 Structure",
  "Continued After 2 Losses",
  "Continued After Good Profit",
  "Poor R:R",
  "Late Entry",
  "FOMO entry",
  "Moved stop",
  "Oversized risk",
  "Skipped plan",
  "News surprise"
];
const scoreDriverGroups = {
  setup: [
    { name: "scoreSetupH1", points: 20 },
    { name: "scoreSetupM15", points: 20 },
    { name: "scoreSetupZone", points: 20 },
    { name: "scoreSetupSl", points: 15 },
    { name: "scoreSetupTp", points: 15 },
    { name: "scoreSetupNoChase", points: 10 }
  ],
  confidence: [
    { name: "scoreConfidenceExplain", points: 20 },
    { name: "scoreConfidenceInvalidation", points: 20 },
    { name: "scoreConfidenceSlTp", points: 20 },
    { name: "scoreConfidenceEmotion", points: 20 },
    { name: "scoreConfidenceLimits", points: 20 }
  ],
  discipline: [
    { name: "scoreDisciplinePlan", points: 15 },
    { name: "scoreDisciplineRisk", points: 15 },
    { name: "scoreDisciplineSl", points: 15 },
    { name: "scoreDisciplineExit", points: 10 },
    { name: "scoreDisciplineNoEarlyExit", points: 10 },
    { name: "scoreDisciplineNoNoise", points: 10 },
    { name: "scoreDisciplineNoReverse", points: 15 },
    { name: "scoreDisciplineDailyLimit", points: 10 }
  ]
};
const scoreDriverNames = Object.values(scoreDriverGroups).flat().map((driver) => driver.name);
const disciplineCapsByMistake = {
  "No SL": 30,
  "Instant Reversal": 40,
  "Revenge Trade": 30,
  "Overtrade": 50,
  "Continued After 2 Losses": 40,
  "Continued After Good Profit": 50,
  "Moved SL Emotionally": 50,
  "Moved stop": 50,
  "M5 Noise Reaction": 50,
  "No Clear Setup": 40,
  "Ignored H1 Structure": 40,
  "No M15 Confirmation": 50,
  "Poor R:R": 60,
  "Early Exit": 70,
  "FOMO": 60,
  "FOMO entry": 60,
  "Chasing Entry": 55,
  "Skipped plan": 45,
  "Oversized risk": 55
};

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
  commissionPerLot: 7,
  themeMode: "system",
  periodPlPeriod: "day",
  historyRange: "all",
  historyCustomStart: "",
  historyCustomEnd: "",
  customSetups: [],
  customPositiveTags: [],
  customMistakeTags: [],
  checklistState: { date: "", checks: {} },
  dailyReviews: []
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
let mt5BridgeTokens = [];
let mt5InboxState = { kind: "idle", message: "" };
let mt5RealtimeHiddenKeys = new Set();
let pendingMt5OrderId = "";
let latestMt5BridgeSetup = "";
let mt5HistoryReviewRange = { active: false, start: "", end: "" };
let mt5LastFetchAt = "";
let mt5LastOrderAt = "";
let cloudSyncState = {
  label: "Local",
  detail: "Use email/password to sync this journal between iPhone and PC.",
  tone: "muted"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const systemThemeMedia = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;

function resolvedThemeMode(mode = settings.themeMode) {
  if (mode === "dark" || mode === "light") return mode;
  return systemThemeMedia?.matches ? "dark" : "light";
}

function applyThemePreference() {
  const mode = ["light", "dark", "system"].includes(settings.themeMode) ? settings.themeMode : "system";
  const resolved = resolvedThemeMode(mode);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeChoice = mode;
  document.documentElement.style.colorScheme = resolved;
  const meta = $("#themeColorMeta");
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#071513" : "#0f766e");
}

function updateThemeControl() {
  const select = $("#themeSelect");
  if (!select) return;
  select.value = ["light", "dark", "system"].includes(settings.themeMode) ? settings.themeMode : "system";
}

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

function normalizeSettingsLists() {
  settings.customSetups = Array.isArray(settings.customSetups) ? [...settings.customSetups] : [];
  settings.customPositiveTags = Array.isArray(settings.customPositiveTags) ? [...settings.customPositiveTags] : [];
  settings.customMistakeTags = Array.isArray(settings.customMistakeTags) ? [...settings.customMistakeTags] : [];
  settings.checklistState = normalizeChecklistState(settings.checklistState);
  settings.dailyReviews = normalizeDailyReviews(settings.dailyReviews);
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
  normalizeSettingsLists();
  analyticsRange = settings.analyticsRange || "all";
  analyticsCustomStart = settings.analyticsCustomStart || "";
  analyticsCustomEnd = settings.analyticsCustomEnd || "";
  periodPlPeriod = ["day", "month", "year"].includes(settings.periodPlPeriod) ? settings.periodPlPeriod : "day";
  historyRange = settings.historyRange || "all";
  historyCustomStart = settings.historyCustomStart || "";
  historyCustomEnd = settings.historyCustomEnd || "";
  marketChartPair = settings.marketChartPair || defaultPair;
  marketChartInterval = settings.marketChartInterval || "1D";
  if (!marketChartRanges.includes(marketChartInterval)) marketChartInterval = "1D";
  applyThemePreference();

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
  normalizeSettingsLists();
  trades = [];
  strategies = [];
  analyticsRange = "all";
  analyticsCustomStart = "";
  analyticsCustomEnd = "";
  periodPlPeriod = "day";
  historyRange = "all";
  historyCustomStart = "";
  historyCustomEnd = "";
  marketChartPair = defaultPair;
  marketChartInterval = "1D";
  applyThemePreference();
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

function cloudUserMetadata(user = cloudUser) {
  return {
    ...(user?.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {}),
    ...(user?.identities?.[0]?.identity_data && typeof user.identities[0].identity_data === "object" ? user.identities[0].identity_data : {})
  };
}

function cloudUserAvatar(user = cloudUser) {
  const meta = cloudUserMetadata(user);
  return String(meta.avatar_url || meta.picture || "").trim();
}

function cloudUserDisplayName(user = cloudUser) {
  const meta = cloudUserMetadata(user);
  const email = String(user?.email || "").trim();
  return String(meta.full_name || meta.name || meta.preferred_username || (email.includes("@") ? email.split("@")[0] : "") || "Cloud profile").trim();
}

function cloudUserProvider(user = cloudUser) {
  const provider = String(user?.app_metadata?.provider || user?.identities?.[0]?.provider || "").trim().toLowerCase();
  if (provider === "google") return "Google";
  if (provider === "email") return "Email";
  return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "Cloud";
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

function safeLocalGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    safeSessionSet(key, value);
  }
}

function safeLocalRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore blocked localStorage.
  }
}

function appScrollSnapshot() {
  return {
    view: currentWorkspaceView(),
    x: window.scrollX || 0,
    y: window.scrollY || 0,
    sidebarY: $(".sidebar-scroll-stack")?.scrollTop || 0,
    historyY: $(".trade-history-scroll")?.scrollTop || 0,
    savedAt: Date.now()
  };
}

function saveAppScrollPosition() {
  safeLocalSet(storageKeys.scrollPosition, JSON.stringify(appScrollSnapshot()));
}

function restoreAppScrollPosition() {
  const raw = safeLocalGet(storageKeys.scrollPosition);
  if (!raw) return;
  try {
    const snapshot = JSON.parse(raw);
    if (!snapshot || Date.now() - toNumber(snapshot.savedAt, 0) > 86400000) return;
    const restore = () => {
      const view = String(snapshot.view || "");
      const button = view && document.querySelector(`.nav-tab[data-view="${view}"]`);
      if (button && activeAccount && !$("#loginView")?.classList.contains("active")) {
        $$(".nav-tab").forEach((tab) => tab.classList.remove("active"));
        button.classList.add("active");
        $$(".view").forEach((item) => item.classList.remove("active"));
        $(`#${view}View`)?.classList.add("active");
        const title = $("#viewTitle");
        if (title) title.textContent = button.textContent.trim();
      }
      window.scrollTo(toNumber(snapshot.x, 0), toNumber(snapshot.y, 0));
      const sidebar = $(".sidebar-scroll-stack");
      if (sidebar) sidebar.scrollTop = toNumber(snapshot.sidebarY, 0);
      const history = $(".trade-history-scroll");
      if (history) history.scrollTop = toNumber(snapshot.historyY, 0);
    };
    window.requestAnimationFrame(restore);
    window.setTimeout(restore, 180);
    window.setTimeout(restore, 520);
  } catch (error) {
    safeLocalRemove(storageKeys.scrollPosition);
  }
}

function initAppScrollMemory() {
  let scrollSaveTimer = 0;
  const scheduleSave = () => {
    window.clearTimeout(scrollSaveTimer);
    scrollSaveTimer = window.setTimeout(saveAppScrollPosition, 160);
  };
  window.addEventListener("scroll", scheduleSave, { passive: true });
  $(".sidebar-scroll-stack")?.addEventListener("scroll", scheduleSave, { passive: true });
  $(".trade-history-scroll")?.addEventListener("scroll", scheduleSave, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveAppScrollPosition();
    if (document.visibilityState === "visible") window.setTimeout(restoreAppScrollPosition, 80);
  });
  window.addEventListener("pagehide", saveAppScrollPosition);
  window.addEventListener("pageshow", () => window.setTimeout(restoreAppScrollPosition, 80));
  window.addEventListener("focus", () => window.setTimeout(restoreAppScrollPosition, 80));
  window.setTimeout(restoreAppScrollPosition, 120);
}

function cloudProjectRef() {
  try {
    return new URL(supabaseConfig.url).hostname.split(".")[0] || "";
  } catch (error) {
    return "";
  }
}

function clearStoredCloudSession() {
  const projectRef = cloudProjectRef();
  const exactKeys = new Set(["supabase.auth.token"]);
  if (projectRef) {
    exactKeys.add(`sb-${projectRef}-auth-token`);
    exactKeys.add(`sb-${projectRef}-code-verifier`);
  }

  const clearStorage = (storage) => {
    if (!storage) return;
    try {
      const keys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key) continue;
        const isProjectKey = projectRef && key.startsWith(`sb-${projectRef}-`);
        const isAuthKey = key.startsWith("sb-") && (key.endsWith("-auth-token") || key.endsWith("-code-verifier"));
        if (exactKeys.has(key) || isProjectKey || (!projectRef && isAuthKey)) keys.push(key);
      }
      keys.forEach((key) => storage.removeItem(key));
    } catch (error) {
      exactKeys.forEach((key) => {
        try {
          storage.removeItem(key);
        } catch (removeError) {
          // Ignore blocked storage.
        }
      });
    }
  };

  clearStorage(localStorage);
  clearStorage(sessionStorage);
}

function activeAccountStoredId() {
  return safeSessionGet(storageKeys.activeAccount) || safeLocalGet(storageKeys.activeAccount);
}

function setActiveAccountStorage(accountId, keepSignedIn = true) {
  safeSessionRemove(storageKeys.activeAccount);
  safeLocalRemove(storageKeys.activeAccount);
  if (keepSignedIn) safeLocalSet(storageKeys.activeAccount, accountId);
  else safeSessionSet(storageKeys.activeAccount, accountId);
}

function clearActiveAccountStorage() {
  safeSessionRemove(storageKeys.activeAccount);
  safeLocalRemove(storageKeys.activeAccount);
}

function cloudSessionMode() {
  return safeLocalGet(storageKeys.cloudSessionMode) === "session" ? "session" : "local";
}

function setCloudSessionPersistenceMode(keepSignedIn = true) {
  safeLocalSet(storageKeys.cloudSessionMode, keepSignedIn ? "local" : "session");
}

function cloudSessionShouldPersist() {
  return cloudSessionMode() !== "session";
}

function createCloudAuthStorage() {
  return {
    getItem(key) {
      if (cloudSessionMode() === "session") return safeSessionGet(key);
      return safeLocalGet(key) || safeSessionGet(key);
    },
    setItem(key, value) {
      if (cloudSessionMode() === "session") {
        safeLocalRemove(key);
        safeSessionSet(key, value);
        return;
      }
      safeSessionRemove(key);
      safeLocalSet(key, value);
    },
    removeItem(key) {
      safeSessionRemove(key);
      safeLocalRemove(key);
    }
  };
}

function syncKeepSignedInControls() {
  $$('input[name="keepSignedIn"]').forEach((keep) => {
    if (!keep.dataset.touched) keep.checked = true;
  });
}

function keepSignedInFromTrigger(trigger) {
  const scope = trigger?.closest?.(".login-card, .auth-card, form") || document;
  const keepControl = scope.querySelector?.('input[name="keepSignedIn"]')
    || $("#cloudKeepSignedIn")
    || $("#overlayCloudKeepSignedIn");
  return !keepControl || keepControl.checked !== false;
}

function accountInitials(name = "") {
  const initials = String(name || "FX")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (initials || "FX").slice(0, 2);
}

function paintAccountAvatar(element, name, avatarUrl = "") {
  if (!element) return;
  const url = String(avatarUrl || "").trim();
  element.textContent = url ? "" : accountInitials(name);
  element.style.backgroundImage = url ? `url("${url.replace(/"/g, "%22")}")` : "";
  element.classList.toggle("has-image", Boolean(url));
}

function activeProfileAvatarUrl() {
  return activeAccount?.avatarUrl || (isActiveCloudProfile() ? cloudUserAvatar() : "");
}

function profileDeviceLabel() {
  const id = ensureCloudClientId();
  const shortId = String(id || "").split("-").filter(Boolean).pop()?.slice(0, 8) || "local";
  return `This browser · ${shortId}`;
}

function profileDataSnapshot(source = {}) {
  const sourceSettings = source.settings && typeof source.settings === "object" ? source.settings : settings;
  return {
    trades: Array.isArray(source.trades) ? source.trades.length : trades.length,
    strategies: Array.isArray(source.strategies) ? source.strategies.length : strategies.length,
    dailyReviews: Array.isArray(sourceSettings?.dailyReviews) ? sourceSettings.dailyReviews.length : 0,
    customPairs: Array.isArray(source.customPairs || source.custom_pairs) ? (source.customPairs || source.custom_pairs).length : customPairs.length,
    profileName: source.profileName || source.profile_name || activeAccount?.name || "Cloud profile"
  };
}

function profileSnapshotLine(snapshot) {
  return `${snapshot.trades} trades, ${snapshot.strategies} strategies, ${snapshot.dailyReviews} daily reviews, ${snapshot.customPairs} custom pairs`;
}

function isProfileManagementOpen() {
  return !$("#profileManagementModal")?.classList.contains("hidden");
}

function syncProfileManagementUi() {
  const modal = $("#profileManagementModal");
  if (!modal) return;
  const signedInCloud = Boolean(cloudUser);
  const activeCloudAccount = isCloudAccount(activeAccount);
  const activeCloud = isActiveCloudProfile();
  const signedInDifferentCloud = signedInCloud && activeCloudAccount && activeAccount.cloudUserId !== cloudUser.id;
  const profileName = activeAccount?.name || "Locked";
  const providerText = !activeAccount
    ? "No provider"
    : activeCloudAccount
      ? `${activeAccount.cloudProvider || cloudUserProvider()} cloud profile`
      : "Offline local profile";
  const emailText = activeAccount?.cloudEmail || cloudUser?.email || (activeAccount ? "Local profile" : "Not signed in");
  const syncText = activeCloud
    ? cloudSyncState.label
    : signedInDifferentCloud
      ? "Different cloud signed in"
      : activeCloudAccount
        ? "Reconnect cloud"
        : signedInCloud
          ? "Cloud signed in"
          : activeAccount
            ? "Local only"
            : "Locked";

  paintAccountAvatar($("#profileAvatarPreview"), profileName, activeProfileAvatarUrl());
  const name = $("#profileManageName");
  if (name) name.textContent = profileName;
  const meta = $("#profileManageMeta");
  if (meta) {
    meta.textContent = activeAccount
      ? `${providerText} · ${syncText}`
      : "Sign in to manage your profile.";
  }
  const input = $("#profileDisplayNameInput");
  if (input && document.activeElement !== input) input.value = activeAccount?.name || "";
  if (input) input.disabled = !activeAccount;
  const email = $("#profileEmailValue");
  if (email) email.textContent = emailText;
  const provider = $("#profileProviderValue");
  if (provider) provider.textContent = providerText;
  const sync = $("#profileSyncValue");
  if (sync) sync.textContent = syncText;
  const device = $("#profileDeviceValue");
  if (device) device.textContent = profileDeviceLabel();
  const snapshot = profileDataSnapshot();
  const tradeCount = $("#profileTradeCountValue");
  if (tradeCount) tradeCount.textContent = snapshot.trades;
  const strategyCount = $("#profileStrategyCountValue");
  if (strategyCount) strategyCount.textContent = snapshot.strategies;
  const dailyReviewCount = $("#profileDailyReviewCountValue");
  if (dailyReviewCount) dailyReviewCount.textContent = snapshot.dailyReviews;
  const pairCount = $("#profilePairCountValue");
  if (pairCount) pairCount.textContent = snapshot.customPairs;

  const saveButton = $("#profileNameForm button[type='submit']");
  if (saveButton) saveButton.disabled = !activeAccount;
  const syncButton = $("#profileSyncNowBtn");
  if (syncButton) syncButton.disabled = !activeCloud || !supabaseClient || !cloudUser;
  const openCloudButton = $("#profileOpenCloudBtn");
  if (openCloudButton) {
    const label = activeCloud
      ? "Cloud Profile Active"
      : signedInCloud
        ? "Use Cloud Profile"
        : "Sign in to Sync";
    openCloudButton.disabled = false;
    openCloudButton.innerHTML = `${iconMarkup("cloud")} ${label}`;
  }
  const cloudHelp = $("#profileCloudHelp");
  if (cloudHelp) {
    cloudHelp.textContent = activeCloud
      ? "Cloud Profile Active means this app is already using the synced journal for your signed-in account."
      : signedInDifferentCloud
        ? "A different cloud account is signed in. Use Cloud Profile to switch this device to that synced journal."
        : activeCloudAccount && !signedInCloud
          ? "This is a cloud profile, but the cloud session is not active. Sign in again to resume sync."
          : signedInCloud
            ? "Use Cloud Profile loads the synced journal for your signed-in account. Transfer To Cloud uploads the current local profile."
            : "Sign in to Sync connects this profile to your cloud journal.";
  }
  const migrateButton = $("#profileMigrateBtn");
  if (migrateButton) migrateButton.disabled = !signedInCloud || !activeAccount || activeCloud || activeCloudAccount;
  const exportJsonButton = $("#profileExportJsonBtn");
  if (exportJsonButton) exportJsonButton.disabled = !activeAccount;
  const importJsonButton = $("#profileImportJsonBtn");
  if (importJsonButton) importJsonButton.disabled = !activeAccount;
  const exportCsvButton = $("#profileExportCsvBtn");
  if (exportCsvButton) exportCsvButton.disabled = !activeAccount || !trades.length;
  const refreshBridgeTokensButton = $("#refreshBridgeTokensBtn");
  if (refreshBridgeTokensButton) refreshBridgeTokensButton.disabled = !signedInCloud || !supabaseClient;
  const signOutButton = $("#profileSignOutBtn");
  if (signOutButton) signOutButton.disabled = !activeAccount && !signedInCloud;
}

function syncAccountUi() {
  const name = $("#activeAccountName");
  if (name) name.textContent = activeAccount ? activeAccount.name : "Locked";
  const provider = $("#activeAccountProvider");
  if (provider) {
    provider.textContent = !activeAccount
      ? "No profile open"
      : isCloudAccount(activeAccount)
        ? isActiveCloudProfile()
          ? `${activeAccount.cloudProvider || cloudUserProvider()} cloud`
          : "Cloud profile"
        : "Local profile";
  }
  const avatar = $("#accountAvatar");
  paintAccountAvatar(avatar, activeAccount?.name || "FX", activeProfileAvatarUrl());
  const manage = $("#manageProfileBtn");
  if (manage) manage.disabled = !activeAccount;
  const logout = $("#logoutAccountBtn");
  if (logout) logout.disabled = !activeAccount;
  syncLoginCloseControl();
  syncCloudUi();
  syncProfileManagementUi();
}

function populateAccountSelect() {
  const selects = ["loginAccountSelect", "pageLoginAccountSelect"].map((id) => $(`#${id}`)).filter(Boolean);
  if (!selects.length) return;
  const localAccounts = accounts.filter(canLocalSignIn);

  selects.forEach((select) => {
    select.innerHTML = "";
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
      : activeAccountStoredId() || localAccounts[0].id;
    select.value = localAccounts.some((account) => account.id === selectedId) ? selectedId : localAccounts[0].id;
  });
}

function setLoginViewActive(mode = "cloud") {
  $$(".nav-tab").forEach((tab) => tab.classList.remove("active"));
  $$(".view").forEach((view) => view.classList.remove("active"));
  $("#loginView")?.classList.add("active");
  const title = $("#viewTitle");
  if (title) title.textContent = "Login";
  setAuthMode(mode);
  populateAccountSelect();
  syncKeepSignedInControls();
  $("#cloudCreatePanel")?.classList.add("hidden");
  $("#pageCreateAccountForm")?.classList.add("hidden");
}

function currentWorkspaceView() {
  const activeView = document.querySelector(".view.active:not(#loginView)");
  return activeView?.id ? activeView.id.replace(/View$/, "") : loginReturnView || "journal";
}

function syncLoginCloseControl() {
  const closeButton = $("#closeLoginPageBtn");
  if (!closeButton) return;
  const canClose = Boolean(activeAccount && document.body.dataset.authRequired !== "true");
  closeButton.classList.toggle("hidden", !canClose);
  closeButton.disabled = !canClose;
}

function showLoginPage(mode = "cloud", locked = !activeAccount) {
  const currentView = currentWorkspaceView();
  if (currentView !== "login") loginReturnView = currentView;
  setLoginViewActive(mode);
  document.body.dataset.authPage = "true";
  document.body.dataset.authRequired = locked ? "true" : "false";
  syncLoginCloseControl();
}

function showMainView(view = "journal") {
  const button = document.querySelector(`[data-view="${view}"]`) || document.querySelector('[data-view="journal"]');
  if (button) button.click();
  else {
    $$(".view").forEach((item) => item.classList.remove("active"));
    $("#journalView")?.classList.add("active");
    const title = $("#viewTitle");
    if (title) title.textContent = "Journal";
  }
  document.body.dataset.authPage = "false";
  document.body.dataset.authRequired = "false";
  syncLoginCloseControl();
}

function isMobileNavigationLayout() {
  return window.matchMedia?.("(max-width: 1180px)")?.matches || window.innerWidth <= 1180;
}

function mobileNavigationTarget(view = "journal") {
  if (view === "journal") return $("#tradeHistoryPanel") || $("#journalView");
  return $(`#${view}View`) || $(".workspace");
}

function scrollMobileNavigationTarget(view = "journal") {
  if (!isMobileNavigationLayout()) return;
  window.setTimeout(() => {
    const target = mobileNavigationTarget(view);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

function closeLoginPage() {
  if (!activeAccount) {
    showLoginPage("cloud", true);
    return;
  }
  showMainView(loginReturnView || "journal");
}

function ensureLoginPageLocalState() {
  const select = $("#pageLoginAccountSelect");
  if (!select) return;
  const localAccounts = accounts.filter(canLocalSignIn);
  if (!localAccounts.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Create a local profile first";
    select.innerHTML = "";
    select.appendChild(option);
    select.disabled = true;
  }
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
      ? "FX Edge Account"
      : resolved === "create"
        ? "Create Account"
        : "Open Account";
  }
  if (eyebrow) eyebrow.textContent = resolved === "cloud" ? "Synced account" : "Local profiles";
}

function showAuthOverlay(mode = "login", locked = !activeAccount) {
  showLoginPage(mode, locked);
  const overlay = $("#authOverlay");
  if (overlay) overlay.classList.add("hidden");
}

function hideAuthOverlay() {
  const overlay = $("#authOverlay");
  if (overlay) overlay.classList.add("hidden");
  if (!activeAccount) {
    showLoginPage("cloud", true);
    return;
  }
}

function bindTradeTicketScrollPerformance(modal) {
  const form = modal?.querySelector("#tradeForm");
  if (!modal || !form || form.dataset.scrollPerformanceBound === "true") return;
  let scrollEndTimer = 0;
  form.addEventListener("scroll", () => {
    modal.classList.add("is-scrolling");
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(() => {
      modal.classList.remove("is-scrolling");
    }, 180);
  }, { passive: true });
  form.dataset.scrollPerformanceBound = "true";
}

function openTradeTicketModal() {
  const modal = $("#tradeTicketModal");
  if (!modal) return;
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  bindTradeTicketScrollPerformance(modal);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  setTimeout(() => {
    const firstField = modal.querySelector("#tradeForm input:not([type='hidden']), #tradeForm select, #tradeForm textarea");
    if (firstField) firstField.focus();
  }, 0);
}

function closeTradeTicketModal() {
  const modal = $("#tradeTicketModal");
  if (!modal) return;
  modal.classList.remove("is-scrolling");
  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function openNewTradeTicket() {
  resetTradeForm();
  openTradeTicketModal();
}

function refreshAccountWorkspace() {
  renderPairOptions(defaultPair);
  renderTradeChoiceOptions();
  renderStrategySetupTypeOptions("Custom / Other");
  renderMarketChartOptions(marketChartPair);
  syncMarketChartControls();
  resetTradeForm();
  resetStrategyForm();
  render();
  renderTradingViewWidget();
  syncAccountUi();
}

function setActiveAccount(account, message = "", options = {}) {
  activeAccount = account;
  setActiveAccountStorage(account.id, options.keepSignedIn !== false);
  loadAccountData();
  refreshAccountWorkspace();
  hideAuthOverlay();
  showMainView("journal");
  if (message) showToast(message);
}

function lockAccount(showMessage = true) {
  activeAccount = null;
  clearActiveAccountStorage();
  resetAppData();
  refreshAccountWorkspace();
  showAuthOverlay("cloud", true);
  if (showMessage) showToast("Account locked.");
}

function initAccountSession() {
  const account = accountById(activeAccountStoredId());
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
  const keepSignedIn = form.id === "pageCreateAccountForm" ? $("#keepSignedIn")?.checked !== false : true;
  setActiveAccount(account, `Account ${name} is ready.`, { keepSignedIn });
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
  const keepSignedIn = form.id === "pageLoginForm" ? $("#keepSignedIn")?.checked !== false : true;
  setActiveAccount(account, `Signed in as ${account.name}.`, { keepSignedIn });
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

function cloudRedirectUrl() {
  if (window.location.protocol === "file:") return "";
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
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
    "MT5 Allow URL=https://lzaetartgfejsnwpiezc.supabase.co",
    "Use this token on one MT5 desktop/VPS bridge only.",
    "If another user signs in, they must generate their own bridge token."
  ].join("\n");
}

function withCloudTimeout(task, message = "Cloud request timed out. Check Supabase connection and try again.", timeoutMs = 45000) {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([Promise.resolve(task), timeout]).finally(() => clearTimeout(timerId));
}

function setMt5InboxState(kind = "idle", message = "", extra = {}) {
  mt5InboxState = { kind, message, ...extra };
  renderMt5Inbox();
  renderMt5BridgeStatus();
}

function formatNullableDateTime(value) {
  return value ? formatDateTime(value) : "Never";
}

function activeMt5BridgeTokens() {
  return mt5BridgeTokens.filter((token) => !token.revoked_at);
}

function latestMt5TokenUse() {
  return activeMt5BridgeTokens()
    .map((token) => token.last_used_at)
    .filter(Boolean)
    .sort()
    .pop() || "";
}

function mt5BridgeHealth() {
  if (!cloudUser) return { label: "Sign in", tone: "warning" };
  if (!supabaseClient) return { label: "Supabase off", tone: "error" };
  if (mt5InboxState.kind === "error") return { label: "Needs check", tone: "error" };
  const activeCount = activeMt5BridgeTokens().length;
  if (!activeCount) return { label: "Token needed", tone: "warning" };
  const lastUsed = latestMt5TokenUse();
  if (!lastUsed) return { label: "Waiting EA", tone: "warning" };
  const ageMinutes = (Date.now() - new Date(lastUsed).getTime()) / 60000;
  if (Number.isFinite(ageMinutes) && ageMinutes <= 15) return { label: "Live", tone: "ready" };
  return { label: "Standby", tone: "warning" };
}

function mt5InboxReviewMode() {
  return mt5InboxState.mode === "history" || mt5HistoryReviewRange.active;
}

function mt5HistoryRangeLabel() {
  return mt5HistoryReviewRange.start || mt5HistoryReviewRange.end
    ? `${mt5HistoryReviewRange.start || "Start"} to ${mt5HistoryReviewRange.end || "Latest"}`
    : "selected period";
}

function mt5InboxModeStatus() {
  if (!cloudUser) return { label: "Signed out", tone: "muted", detail: "Cloud sign in is required for MT5 automation." };
  if (mt5InboxState.kind === "error") return { label: "Needs check", tone: "error", detail: mt5InboxState.message || "MT5 refresh failed." };
  if (mt5InboxState.kind === "loading") {
    return mt5InboxReviewMode()
      ? { label: "Loading history", tone: "loading", detail: `Checking MT5 history for ${mt5HistoryRangeLabel()}.` }
      : { label: "Checking live", tone: "loading", detail: "Checking new closed positions from Supabase." };
  }
  return mt5InboxReviewMode()
    ? { label: "History review", tone: "history", detail: `Showing all MT5 orders found for ${mt5HistoryRangeLabel()}, including recorded, ignored, and deleted-from-journal orders.` }
    : { label: "Live scan", tone: "live", detail: "Showing only new closed positions. Recorded and ignored orders stay hidden until Display History is used." };
}

function renderMt5InboxModeBadge() {
  const badge = $("#mt5InboxModeBadge");
  if (!badge) return;
  const mode = mt5InboxModeStatus();
  badge.textContent = mode.label;
  badge.title = mode.detail;
  badge.className = `mt5-inbox-mode-badge ${mode.tone}`;
}

function renderMt5RefreshButton() {
  const button = $("#refreshMt5OrdersBtn");
  if (!button) return;
  const historyMode = mt5InboxReviewMode();
  button.innerHTML = `${iconMarkup("refresh")} ${historyMode ? "Back to live" : "Refresh"}`;
  button.title = historyMode
    ? "Return to live scan and hide recorded or ignored MT5 orders."
    : "Refresh new MT5 closed positions from Supabase.";
}

function renderMt5BridgeStatus() {
  const container = $("#mt5BridgeStatus");
  if (!container) return;
  const activeCount = activeMt5BridgeTokens().length;
  const health = mt5BridgeHealth();
  const mode = mt5InboxModeStatus();
  container.innerHTML = [
    { label: "Bridge", value: health.label, className: `health-${health.tone}` },
    { label: "Inbox", value: mode.label, className: `mode-${mode.tone}` },
    { label: "Active tokens", value: `${activeCount} active`, className: "" },
    { label: "Web refresh", value: formatNullableDateTime(mt5LastFetchAt), className: "" },
    { label: "EA heartbeat", value: formatNullableDateTime(latestMt5TokenUse()), className: "" },
    { label: "Last closed", value: formatNullableDateTime(mt5LastOrderAt), className: "" }
  ].map((item) => `
    <div class="mt5-bridge-status-item ${escapeHtml(item.className)}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join("");
}

function bridgeTokenActivity(token) {
  if (token?.revoked_at) return { label: "Revoked", className: "revoked" };
  if (!token?.last_used_at) return { label: "Waiting EA", className: "waiting" };
  const ageMinutes = (Date.now() - new Date(token.last_used_at).getTime()) / 60000;
  if (Number.isFinite(ageMinutes) && ageMinutes <= 15) return { label: "Live", className: "live" };
  if (Number.isFinite(ageMinutes) && ageMinutes <= 360) return { label: "Standby", className: "standby" };
  return { label: "Idle", className: "idle" };
}

function renderBridgeTokenManager() {
  const list = $("#bridgeTokenList");
  if (!list) return;
  if (!cloudUser) {
    mt5BridgeTokens = [];
    list.innerHTML = '<p class="profile-helper-text">Sign in to cloud to manage MT5 bridge tokens.</p>';
    renderMt5BridgeStatus();
    return;
  }

  if (!mt5BridgeTokens.length) {
    list.innerHTML = '<p class="profile-helper-text">No bridge tokens yet. Generate one token for each PC, phone, VPS, or relay that should send MT5 orders for this signed-in account.</p>';
    renderMt5BridgeStatus();
    return;
  }

  list.innerHTML = mt5BridgeTokens
    .map((token) => {
      const revoked = Boolean(token.revoked_at);
      const label = token.label || "MT5 bridge token";
      const created = formatNullableDateTime(token.created_at);
      const lastUsed = formatNullableDateTime(token.last_used_at);
      const activity = bridgeTokenActivity(token);
      return `
        <article class="bridge-token-card ${revoked ? "revoked" : ""}">
          <div>
            <strong>${escapeHtml(label)}</strong>
            <span>Created ${escapeHtml(created)} · Last used ${escapeHtml(lastUsed)}</span>
            <span class="bridge-token-status ${escapeHtml(activity.className)}">${escapeHtml(activity.label)}</span>
            <small class="bridge-token-help">Private to this cloud account. Revoke it if this device should stop sending orders.</small>
          </div>
          <button class="mini-button text-mini danger" type="button" data-token-action="revoke" data-id="${escapeHtml(token.id)}" ${revoked ? "disabled" : ""}>Revoke</button>
        </article>
      `;
    })
    .join("");
  renderMt5BridgeStatus();
}

async function fetchMt5BridgeTokens(options = {}) {
  const { silent = false } = options;
  if (!supabaseClient || !cloudUser) {
    mt5BridgeTokens = [];
    renderBridgeTokenManager();
    return;
  }
  try {
    const { data, error } = await withCloudTimeout(
      supabaseClient
        .from(mt5TokenTable)
        .select("id,label,created_at,last_used_at,revoked_at")
        .eq("user_id", cloudUser.id)
        .order("created_at", { ascending: false }),
      "Bridge token manager timed out. Check Supabase connection and try again."
    );
    if (error) throw error;
    mt5BridgeTokens = Array.isArray(data) ? data : [];
    renderBridgeTokenManager();
  } catch (error) {
    renderBridgeTokenManager();
    if (!silent) showToast(friendlyCloudError(error));
  }
}

async function revokeMt5BridgeToken(tokenId) {
  if (!supabaseClient || !cloudUser || !tokenId) return;
  const token = mt5BridgeTokens.find((item) => item.id === tokenId);
  const label = token?.label || "this MT5 bridge token";
  const ok = confirm(`Revoke ${label}? Any MT5 PC, phone, VPS, or relay using it will stop sending orders.`);
  if (!ok) return;
  const revokedAt = new Date().toISOString();
  const { error } = await supabaseClient
    .from(mt5TokenTable)
    .update({ revoked_at: revokedAt })
    .eq("user_id", cloudUser.id)
    .eq("id", tokenId);
  if (error) {
    showToast(friendlyCloudError(error));
    return;
  }
  mt5BridgeTokens = mt5BridgeTokens.map((item) => item.id === tokenId ? { ...item, revoked_at: revokedAt } : item);
  renderBridgeTokenManager();
  showToast("Bridge token revoked.");
}

function setCloudStatus(label, detail = "", tone = "muted") {
  cloudSyncState = { label, detail, tone };
  syncCloudUi();
}

function syncCloudUi() {
  const status = $("#cloudSyncStatus");
  const signedIn = Boolean(cloudUser);
  const activeCloudAccount = isCloudAccount(activeAccount);
  const hasCloudIdentity = signedIn || activeCloudAccount;
  const needsReconnect = activeCloudAccount && !signedIn;
  const effectiveStatus = needsReconnect
    ? { label: "Reconnect", tone: "pending" }
    : cloudSyncState;
  if (status) {
    status.textContent = effectiveStatus.label;
    status.className = `sync-badge ${effectiveStatus.tone || "muted"}`;
  }

  const note = $("#cloudNote");
  if (note) note.textContent = needsReconnect
    ? "Sign in again to reconnect this cloud profile."
    : cloudSyncState.detail || "Use email/password or Google to sync this journal between iPhone and PC.";

  const authButton = $("#openCloudAuthBtn");
  if (authButton) authButton.hidden = hasCloudIdentity;

  const sessionPanel = $("#cloudSessionPanel");
  if (sessionPanel) sessionPanel.classList.toggle("hidden", !hasCloudIdentity);

  const email = $("#cloudEmail");
  if (email) {
    email.textContent = signedIn
      ? `${cloudUserDisplayName()} · ${cloudUser.email || "Cloud account"}`
      : activeCloudAccount
        ? `${activeAccount.name || "Cloud profile"} · ${activeAccount.cloudEmail || "Cloud account"}`
        : "Not signed in";
  }

  const cloudStateLine = $("#cloudStateLine");
  if (cloudStateLine) {
    cloudStateLine.textContent = !hasCloudIdentity
      ? "Sign in to sync across devices."
      : isActiveCloudProfile()
        ? "Cloud profile active on this device."
        : needsReconnect
          ? "Cloud session expired. Use Manage Profile to sign in again."
          : activeCloudAccount
            ? "Cloud profile open. Manage Profile has the account actions."
          : "Signed in, local profile active. Use Manage Profile to switch or transfer.";
  }

  const manageCloudProfileButton = $("#cloudManageProfileBtn");
  if (manageCloudProfileButton) manageCloudProfileButton.disabled = !activeAccount && !signedIn;

  const bridgePanel = $("#mt5BridgePanel");
  if (bridgePanel) bridgePanel.classList.toggle("hidden", !signedIn);

  const output = $("#mt5BridgeOutput");
  if (output && latestMt5BridgeSetup) output.value = latestMt5BridgeSetup;

  renderMt5BridgeStatus();
  renderMt5Inbox();
  syncProfileManagementUi();
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
      detectSessionInUrl: true,
      storage: createCloudAuthStorage()
    }
  });
  setCloudStatus("Ready", "Sign in with email/password or Google to sync between devices.", "ready");
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
  const fallbackName = cloudUserDisplayName(user) || (email.includes("@") ? email.split("@")[0] : "Cloud profile");
  const avatarUrl = cloudUserAvatar(user);
  const provider = cloudUserProvider(user);
  let account = accountById(id);
  if (!account) {
    account = {
      id,
      name: fallbackName,
      cloudUserId: user.id,
      cloudEmail: email,
      cloudProvider: provider,
      avatarUrl,
      createdAt: new Date().toISOString()
    };
    accounts = [...accounts, account];
  } else {
    account.cloudUserId = user.id;
    account.cloudEmail = email;
    account.cloudProvider = provider;
    account.avatarUrl = avatarUrl;
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
  const snapshotSettings = cloneJson(settings, { ...defaultSettings });
  snapshotSettings.dailyReviewEvidence = normalizeDailyEvidenceStore(dailyEvidenceStore());
  return {
    profileName,
    trades: cloneJson(trades, []),
    strategies: cloneJson(strategies, []),
    customPairs: cloneJson(customPairs, []),
    settings: snapshotSettings
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
    const incomingSettings = row.settings && typeof row.settings === "object" ? { ...row.settings } : {};
    const incomingEvidence = normalizeDailyEvidenceStore(incomingSettings.dailyReviewEvidence);
    delete incomingSettings.dailyReviewEvidence;

    settings = {
      ...defaultSettings,
      ...incomingSettings
    };
    normalizeSettingsLists();
    analyticsRange = settings.analyticsRange || "all";
    analyticsCustomStart = settings.analyticsCustomStart || "";
    analyticsCustomEnd = settings.analyticsCustomEnd || "";
    periodPlPeriod = ["day", "month", "year"].includes(settings.periodPlPeriod) ? settings.periodPlPeriod : "day";
    historyRange = settings.historyRange || "all";
    historyCustomStart = settings.historyCustomStart || "";
    historyCustomEnd = settings.historyCustomEnd || "";
    marketChartPair = settings.marketChartPair || defaultPair;
    marketChartInterval = settings.marketChartInterval || "1D";
    if (!marketChartRanges.includes(marketChartInterval)) marketChartInterval = "1D";
    applyThemePreference();

    const incomingTrades = Array.isArray(row.trades) ? row.trades : [];
    incomingTrades.forEach((trade) => ensurePairAvailable(trade.pair, trade.contractSize));
    trades = incomingTrades.map((trade) =>
      withCalculatedTrade({
        ...trade,
        id: trade.id || randomId("trade")
      })
    );

    strategies = Array.isArray(row.strategies) ? row.strategies : [];
    const mergedEvidence = mergeDailyEvidenceStores(dailyEvidenceStore(), incomingEvidence);
    saveCustomPairs();
    saveSettings();
    saveTrades();
    saveStrategies();
    saveDailyEvidenceStore(mergedEvidence);
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
    "Cloud save timed out. Check internet/Supabase, then use Sync Now again."
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
          "Realtime listener paused, so use Sync Now or Refresh if live updates lag.",
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
  const label = `${isMobile ? "MT5 mobile relay" : "MT5 desktop"} · ${new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
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
  fetchMt5BridgeTokens({ silent: true }).catch(() => {});
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

function updateMt5LastOrderFromFetched(orders) {
  const latest = (orders || [])
    .map((order) => mt5OrderCorrectedDate(order, "closed") || new Date(order.closed_at || order.updated_at || order.created_at || ""))
    .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  if (latest) mt5LastOrderAt = latest.toISOString();
}

async function fetchMt5DetectedOrders(options = {}) {
  const { silent = false, historyReview = false, forceRealtime = false } = options;
  if (!supabaseClient || !cloudUser) {
    mt5DetectedOrders = [];
    renderMt5Inbox();
    renderMt5BridgeStatus();
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
    setMt5InboxState(
      "loading",
      reviewMode ? "Loading MT5 history from Supabase." : "Checking Supabase for new closed positions.",
      { mode: reviewMode ? "history" : "live" }
    );
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

  try {
    const previousCount = mt5DetectedOrders.length;
    const fetchedOrders = Array.isArray(data) ? data : [];
    mt5LastFetchAt = new Date().toISOString();
    updateMt5LastOrderFromFetched(fetchedOrders);
    renderMt5BridgeStatus();
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
        mode: "history",
        message: mt5DetectedOrders.length
          ? ""
          : "No MT5 orders found in that history period. Recorded, ignored, and deleted journal trades will appear here when MT5 has uploaded them."
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
      mode: "live",
      duplicateCount,
      message: duplicateCount
        ? duplicateCount + " detected MT5 " + (duplicateCount === 1 ? "order is" : "orders are") + " already in Trade History and hidden from live scan. Use Display History to review or ignore recorded orders."
        : "No new closed positions. Keep the MT5 bridge attached, then press Refresh after a position closes."
    };
    renderMt5Inbox();
    if (duplicateCount && !silent) {
      showToast(duplicateCount + " MT5 " + (duplicateCount === 1 ? "order is" : "orders are") + " already in Trade History and skipped.");
    } else if (mt5DetectedOrders.length > previousCount && !silent) {
      showToast("MT5 closed position detected.");
    }
  } catch (error) {
    setMt5InboxState("error", friendlyCloudError(error));
    if (!silent) showToast(friendlyCloudError(error));
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

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== "");
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
    setupType: "Custom / Other",
    setupScore: 70,
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
    positive: "None",
    positiveTags: [],
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
    mt5InboxState = {
      kind: "empty",
      mode: mt5InboxReviewMode() ? "history" : "live",
      message: status === "ignored"
        ? "Ignored order hidden from this inbox. Use Display History to see it again."
        : "No orders waiting."
    };
  }
  renderMt5Inbox();
}

async function ignoreAlreadyRecordedMt5Orders() {
  if (!supabaseClient || !cloudUser) return;
  const recordedOrders = mt5DetectedOrders.filter((order) => Boolean(order.alreadyRecorded || isMt5OrderAlreadyRecorded(order)));
  const ids = recordedOrders.map((order) => order.id).filter(Boolean);
  if (!ids.length) {
    showToast("No already recorded MT5 orders to ignore.");
    return;
  }

  const ok = confirm(`Hide ${ids.length} already-recorded MT5 ${ids.length === 1 ? "order" : "orders"} from this inbox? Display History can show them again later.`);
  if (!ok) return;

  recordedOrders.forEach(hideMt5OrderFromRealtime);
  const { error } = await supabaseClient
    .from(mt5OrderTable)
    .update({ status: "ignored", updated_at: new Date().toISOString() })
    .eq("user_id", cloudUser.id)
    .in("id", ids);

  if (error) {
    showToast(friendlyCloudError(error));
    return;
  }

  mt5DetectedOrders = mt5DetectedOrders.filter((order) => !ids.includes(order.id));
  if (!mt5DetectedOrders.length) {
    mt5InboxState = {
      kind: "empty",
      mode: mt5InboxReviewMode() ? "history" : "live",
      message: "Already recorded MT5 orders are hidden from this inbox. Use Display History to review the full period again."
    };
  }
  renderMt5Inbox();
  showToast("Ignored " + ids.length + " already recorded MT5 " + (ids.length === 1 ? "order." : "orders."));
}

async function ignoreVisibleMt5Orders() {
  if (!supabaseClient || !cloudUser) return;
  const ids = mt5DetectedOrders.map((order) => order.id).filter(Boolean);
  if (!ids.length) {
    showToast("No visible MT5 orders to ignore.");
    return;
  }
  const ok = confirm(`Ignore all ${ids.length} visible MT5 ${ids.length === 1 ? "order" : "orders"}? Use Display History to review them again later.`);
  if (!ok) return;

  mt5DetectedOrders.forEach(hideMt5OrderFromRealtime);
  const { error } = await supabaseClient
    .from(mt5OrderTable)
    .update({ status: "ignored", updated_at: new Date().toISOString() })
    .eq("user_id", cloudUser.id)
    .in("id", ids);

  if (error) {
    showToast(friendlyCloudError(error));
    return;
  }

  mt5DetectedOrders = [];
  mt5InboxState = {
    kind: "empty",
    mode: mt5InboxReviewMode() ? "history" : "live",
    message: "Ignored visible MT5 orders are hidden from this inbox. Use Display History to review the full period again."
  };
  renderMt5Inbox();
  showToast(`Ignored ${ids.length} visible MT5 ${ids.length === 1 ? "order." : "orders."}`);
}

function mt5OrderInboxStatus(order) {
  const alreadyRecorded = Boolean(order.alreadyRecorded || isMt5OrderAlreadyRecorded(order));
  const status = String(order.status || "new").toLowerCase();
  if (alreadyRecorded) {
    return {
      label: "Already in journal",
      className: "recorded",
      disableRecord: true,
      recordText: "In Journal",
      hint: "This MT5 order already matches a Trade History record."
    };
  }
  if (status === "recorded") {
    return {
      label: "Deleted / record again",
      className: "missing",
      disableRecord: false,
      recordText: "Record again",
      hint: "MT5 says this was recorded before, but it is not in Trade History now."
    };
  }
  if (status === "ignored") {
    return {
      label: "Ignored in live",
      className: "ignored",
      disableRecord: false,
      recordText: "Record again",
      hint: "This order is hidden from live scan but can still be recorded from Display History."
    };
  }
  return {
    label: "New",
    className: "new",
    disableRecord: false,
    recordText: "Record",
    hint: "New closed position waiting for review."
  };
}

function renderMt5InboxSummary() {
  if (!mt5DetectedOrders.length) return "";
  const reviewMode = mt5InboxReviewMode();
  const alreadyRecordedCount = mt5DetectedOrders.filter((order) => Boolean(order.alreadyRecorded || isMt5OrderAlreadyRecorded(order))).length;
  const recordAgainCount = mt5DetectedOrders.filter((order) => {
    const status = String(order.status || "new").toLowerCase();
    return !Boolean(order.alreadyRecorded || isMt5OrderAlreadyRecorded(order)) && (status === "recorded" || status === "ignored");
  }).length;
  const rangeText = mt5HistoryRangeLabel();
  const duplicateNote = mt5InboxState.duplicateCount
    ? ` ${mt5InboxState.duplicateCount} already-recorded ${mt5InboxState.duplicateCount === 1 ? "order was" : "orders were"} hidden from live scan.`
    : "";
  const title = reviewMode ? "History review" : "Live scan";
  const copy = reviewMode
    ? `Showing MT5 history for ${rangeText}, including recorded and ignored orders. If a journal trade was deleted, use Record again here.`
    : `Showing new MT5 closed positions only.${duplicateNote} Recorded and ignored orders stay hidden until Display History is used.`;
  const stats = [
    `${mt5DetectedOrders.length} shown`,
    alreadyRecordedCount ? `${alreadyRecordedCount} already recorded` : "",
    recordAgainCount ? `${recordAgainCount} record again` : ""
  ].filter(Boolean).join(" · ");
  return `
    <div class="mt5-inbox-summary ${reviewMode ? "history" : "live"}">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(copy)}</p>
      </div>
      <span>${escapeHtml(stats)}</span>
    </div>
  `;
}

function mt5InboxEmptyStateCopy() {
  if (!cloudUser) {
    return {
      title: "Cloud sign in required",
      message: "Sign in before MT5 can send closed positions to this profile.",
      hints: ["Open the account panel, then sign in with email or Google."]
    };
  }
  if (!activeMt5BridgeTokens().length) {
    return {
      title: "Bridge token needed",
      message: "Create a PC or Mobile token before MT5 can send closed positions.",
      hints: ["Generate one token for each PC, phone, VPS, or relay.", "After creating a PC token, paste it into the MT5 EA inputs."]
    };
  }
  if (mt5InboxState.kind === "error") {
    return {
      title: "Could not refresh MT5 orders",
      message: mt5InboxState.message || "Supabase or the MT5 bridge could not be reached.",
      hints: ["Check internet/Supabase, then press Refresh.", "For MT5 desktop, confirm Tools > Options > Expert Advisors allows the Supabase URL."]
    };
  }
  if (mt5InboxState.kind === "loading") {
    return {
      title: "Checking MT5 orders",
      message: mt5InboxState.message || "Loading MT5 orders from Supabase.",
      hints: []
    };
  }
  if (mt5HistoryReviewRange.active || mt5InboxState.mode === "history") {
    return {
      title: "No history orders found",
      message: mt5InboxState.message || "No MT5 orders matched this display-history period.",
      hints: ["Confirm the From/To dates include the close time.", "Display History shows recorded, ignored, and deleted-from-journal orders when MT5 has uploaded them.", "Keep the MT5 PC bridge online if the history request is still pending."]
    };
  }
  return {
    title: "No orders waiting",
    message: mt5InboxState.message || "Closed MT5 positions will appear here before you record them.",
    hints: ["Live scan hides already-recorded and ignored orders.", "Use Display History to review recorded, ignored, or deleted journal trades again.", "Each user must generate their own private bridge token."]
  };
}

function mt5InboxHintsMarkup(hints) {
  if (!hints?.length) return "";
  return `<div class="mt5-inbox-hints">${hints.map((hint) => `<span>${escapeHtml(hint)}</span>`).join("")}</div>`;
}

function renderMt5Inbox() {
  const panel = $("#mt5InboxPanel");
  const list = $("#mt5InboxList");
  if (!panel || !list) return;
  renderMt5InboxModeBadge();
  renderMt5RefreshButton();
  const ignoreAllButton = $("#ignoreAllMt5OrdersBtn");
  const ignoreRecordedButton = $("#ignoreRecordedMt5OrdersBtn");
  const hasOrders = Boolean(mt5DetectedOrders.length);
  const recordedCount = mt5DetectedOrders.filter((order) => Boolean(order.alreadyRecorded || isMt5OrderAlreadyRecorded(order))).length;
  const showPanel = Boolean(cloudUser);
  panel.classList.toggle("hidden", !showPanel);
  if (ignoreAllButton) {
    ignoreAllButton.classList.toggle("hidden", !showPanel || !hasOrders);
    ignoreAllButton.disabled = !hasOrders;
    ignoreAllButton.innerHTML = `${iconMarkup("trash")} ${hasOrders ? `Ignore all (${mt5DetectedOrders.length})` : "Ignore all"}`;
  }
  if (ignoreRecordedButton) {
    ignoreRecordedButton.classList.toggle("hidden", !showPanel || recordedCount === 0);
    ignoreRecordedButton.disabled = recordedCount === 0;
    ignoreRecordedButton.innerHTML = `${iconMarkup("trash")} ${recordedCount ? `Ignore recorded (${recordedCount})` : "Ignore recorded"}`;
  }
  if (!showPanel) {
    list.innerHTML = "";
    return;
  }

  if (!hasOrders) {
    const tone = mt5InboxState.kind === "error" ? "error" : mt5InboxState.kind === "loading" ? "loading" : "empty";
    const emptyCopy = mt5InboxEmptyStateCopy();
    list.innerHTML = [
      '<div class="mt5-inbox-state ' + escapeHtml(tone) + '">',
      '<strong>' + escapeHtml(emptyCopy.title) + '</strong>',
      '<p>' + escapeHtml(emptyCopy.message) + '</p>',
      mt5InboxHintsMarkup(emptyCopy.hints),
      '</div>'
    ].join("");
    return;
  }

  list.innerHTML = [
    renderMt5InboxSummary(),
    ...mt5DetectedOrders
    .map((order) => {
      const direction = String(order.direction || "Buy").toLowerCase() === "sell" ? "Sell" : "Buy";
      const source = mt5OrderSource(order);
      const reviewMode = mt5InboxReviewMode();
      const pl = parseOptionalNumber(order.profit);
      const commission = parseOptionalNumber(order.commission) ?? 0;
      const swap = parseOptionalNumber(order.swap) ?? 0;
      const stopLoss = parseOptionalNumber(order.stop_loss);
      const takeProfit = parseOptionalNumber(order.take_profit);
      const stopText = stopLoss && stopLoss > 0 ? rateFormatter.format(stopLoss) : "Not sent";
      const targetText = takeProfit && takeProfit > 0 ? rateFormatter.format(takeProfit) : "Not sent";
      const inboxStatus = mt5OrderInboxStatus(order);
      return `
        <article class="mt5-order-card">
          <div>
            <strong>${escapeHtml(normalizeBrokerSymbol(order.symbol))}
              <span class="mt5-pill ${direction.toLowerCase()}">${escapeHtml(direction)}</span>
              <span class="mt5-mode-pill ${reviewMode ? "history" : "live"}">${reviewMode ? "History" : "Live"}</span>
              <span class="mt5-source-pill ${escapeHtml(mt5SourceClass(source))}">${escapeHtml(source)}</span>
              <span class="mt5-review-pill ${escapeHtml(inboxStatus.className)}" title="${escapeHtml(inboxStatus.hint)}">${escapeHtml(inboxStatus.label)}</span>
            </strong>
            <p>Open ${escapeHtml(mt5OrderDisplayDateTime(order, "open"))} | Close ${escapeHtml(mt5OrderDisplayDateTime(order, "closed"))} | ${numberFormatter.format(toNumber(order.lot_size))} lot</p>
            <p>Entry ${rateFormatter.format(toNumber(order.entry_price))} -> Exit ${rateFormatter.format(toNumber(order.exit_price))}</p>
            <p>${pl === null ? "P/L pending" : currencyFormatter.format(pl)} | Stop ${escapeHtml(stopText)} | Target ${escapeHtml(targetText)} | Commission ${currencyFormatter.format(commission)} | Swap ${currencyFormatter.format(swap)}</p>
          </div>
          <div class="mt5-order-actions">
            ${inboxStatus.disableRecord ? '<span class="mt5-recorded-flag">Already recorded</span>' : ""}
            <button class="mini-button text-mini" type="button" data-mt5-action="record" data-id="${escapeHtml(order.id)}" ${inboxStatus.disableRecord ? "disabled" : ""}>${escapeHtml(inboxStatus.recordText)}</button>
            <button class="mini-button text-mini danger" type="button" data-mt5-action="ignore" data-id="${escapeHtml(order.id)}">Ignore</button>
          </div>
        </article>
      `;
    })
  ].join("");
}

async function openCloudProfile(options = {}) {
  const { silent = false, keepSignedIn = cloudSessionShouldPersist() } = options;
  if (!cloudUser) {
    showAuthOverlay("cloud", false);
    return;
  }
  const account = ensureCloudAccount(cloudUser);
  setActiveAccount(account, silent ? "" : "Cloud profile opened.", { keepSignedIn });
  subscribeCloudProfile();
  subscribeMt5Orders();
  try {
    await fetchCloudProfile({ apply: true, createIfMissing: true, silent });
    await fetchMt5DetectedOrders({ silent: true });
  } catch (error) {
    showToast(friendlyCloudError(error));
  }
}

async function fetchCloudTransferTargetSnapshot() {
  if (!supabaseClient || !cloudUser) return null;
  const { data, error } = await withCloudTimeout(
    supabaseClient
      .from(cloudProfileTable)
      .select("profile_name,trades,strategies,custom_pairs,settings,updated_at")
      .eq("user_id", cloudUser.id)
      .maybeSingle(),
    "Cloud transfer check timed out. Try again when the connection is stable."
  );
  if (error) throw error;
  return data ? profileDataSnapshot(data) : null;
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

  const snapshot = currentJournalSnapshot(activeAccount.name);
  const localSummary = profileDataSnapshot(snapshot);
  let cloudSummary = null;
  try {
    setCloudStatus("Checking", "Checking existing cloud journal before transfer.", "pending");
    cloudSummary = await fetchCloudTransferTargetSnapshot();
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    showToast(friendlyCloudError(error));
    return;
  }

  const targetLine = cloudSummary
    ? `${cloudSummary.profileName}: ${profileSnapshotLine(cloudSummary)}`
    : "No cloud journal exists yet for this account.";
  const confirmation = prompt(
    [
      `Transfer local data to ${cloudUser.email || "this cloud account"}?`,
      "",
      `Local source: ${localSummary.profileName}: ${profileSnapshotLine(localSummary)}`,
      `Cloud target now: ${targetLine}`,
      "",
      "This will replace the cloud journal for this signed-in account.",
      'Type "TRANSFER" to continue.'
    ].join("\n")
  );
  if (confirmation !== "TRANSFER") {
    setCloudStatus("Ready", "Transfer cancelled. No cloud data was changed.", "ready");
    showToast("Transfer cancelled.");
    return;
  }

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
    const activeCloudAccount = isCloudAccount(activeAccount);
    if (cloudSubscription) {
      supabaseClient.removeChannel(cloudSubscription);
      cloudSubscription = null;
    }
    if (mt5OrderSubscription) {
      supabaseClient.removeChannel(mt5OrderSubscription);
      mt5OrderSubscription = null;
    }
    mt5DetectedOrders = [];
    mt5BridgeTokens = [];
    setCloudStatus(
      activeCloudAccount ? "Reconnect" : "Ready",
      activeCloudAccount
        ? "Sign in again to reconnect this cloud profile."
        : "Sign in with email/password or Google to sync between devices.",
      activeCloudAccount ? "pending" : "ready"
    );
    renderMt5Inbox();
    renderBridgeTokenManager();
    return;
  }

  ensureCloudAccount(cloudUser);
  subscribeCloudProfile();
  subscribeMt5Orders();
  fetchMt5BridgeTokens({ silent: true }).catch(() => {});
  fetchMt5DetectedOrders({ silent: true }).catch(() => {});
  const keepSignedIn = options.keepSignedIn ?? cloudSessionShouldPersist();
  if (!activeAccount || (isCloudAccount(activeAccount) && activeAccount.cloudUserId === cloudUser.id)) {
    await openCloudProfile({ silent: options.source === "init", keepSignedIn });
    return;
  }

  setCloudStatus("Ready", "Cloud signed in. Use Manage Profile to switch profiles or transfer local data.", "ready");
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
    const keepControl = form.elements.namedItem("keepSignedIn");
    const keepSignedIn = !keepControl || keepControl.checked !== false;
    setCloudSessionPersistenceMode(keepSignedIn);
    setCloudStatus("Signing in", "Checking Supabase email/password.", "pending");
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    form.elements.password.value = "";
    await handleCloudSessionChange(data.session, { source: "signIn", keepSignedIn });
    hideAuthOverlay();
    showToast(isActiveCloudProfile() ? "Cloud sync active." : "Cloud signed in. Migrate or open cloud when ready.");
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    showToast(friendlyCloudError(error));
  }
}

async function handleCloudGoogleSignIn(event) {
  if (!supabaseClient) {
    showToast("Cloud sync is not loaded yet.");
    return;
  }
  const redirectTo = cloudRedirectUrl();
  if (!redirectTo) {
    showToast("Google login needs the app opened through http://127.0.0.1, localhost, or GitHub Pages.");
    return;
  }
  try {
    const keepSignedIn = keepSignedInFromTrigger(event?.currentTarget);
    setCloudSessionPersistenceMode(keepSignedIn);
    setCloudStatus("Google", "Redirecting to Google sign-in. Gmail access is not requested.", "pending");
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "openid email profile",
        queryParams: {
          prompt: "select_account"
        }
      }
    });
    if (error) throw error;
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    showToast(friendlyCloudError(error));
  }
}

async function handleCloudSignUp(event) {
  event.preventDefault();
  const form = event.currentTarget.closest("form");
  if (!supabaseClient || !form) {
    showToast("Cloud sync is not loaded yet.");
    return;
  }

  try {
    const { email, password } = cloudAuthValues(form);
    if (form.elements.confirm && form.elements.confirm.value !== password) {
      showToast("Passwords do not match.");
      form.elements.confirm.focus();
      return;
    }
    setCloudSessionPersistenceMode(true);
    setCloudStatus("Creating", "Creating your FX Edge account.", "pending");
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: cloudRedirectUrl() || window.location.href.split("#")[0]
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
  let signOutError = null;
  try {
    await supabaseClient.auth.signOut({ scope: "local" });
  } catch (error) {
    signOutError = error;
  }
  clearStoredCloudSession();
  setCloudSessionPersistenceMode(true);
  await handleCloudSessionChange(null);
  if (wasCloudProfile) lockAccount(false);
  setCloudStatus("Ready", "Signed out of cloud. Local profiles still work offline.", "ready");
  showToast(signOutError ? "Signed out locally. Supabase revoke can retry when online." : "Cloud signed out.");
}

async function handleAccountLogout() {
  const shouldSignOutCloud = Boolean(supabaseClient && cloudUser);
  let signOutError = null;
  try {
    if (shouldSignOutCloud) {
      await supabaseClient.auth.signOut({ scope: "local" });
    }
  } catch (error) {
    signOutError = error;
  }

  try {
    if (shouldSignOutCloud) {
      clearStoredCloudSession();
      setCloudSessionPersistenceMode(true);
      await handleCloudSessionChange(null);
    }
    lockAccount(false);
    setCloudStatus("Ready", "Signed out. Choose Google, email, or a local profile to continue.", "ready");
    showToast(signOutError ? "Signed out locally. Supabase revoke can retry when online." : shouldSignOutCloud ? "Signed out of this device." : "Account locked.");
  } catch (error) {
    setCloudStatus("Error", friendlyCloudError(error), "error");
    showToast(friendlyCloudError(error));
  }
}

function openProfileManagement() {
  if (!activeAccount) {
    if (cloudUser) {
      openCloudProfile();
      return;
    }
    showAuthOverlay("cloud", true);
    return;
  }
  syncProfileManagementUi();
  renderBridgeTokenManager();
  $("#profileManagementModal")?.classList.remove("hidden");
  document.body.classList.add("modal-open");
  $("#profileDisplayNameInput")?.focus();
  if (cloudUser) fetchMt5BridgeTokens({ silent: true }).catch(() => {});
}

function closeProfileManagement() {
  $("#profileManagementModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function handleProfileNameSubmit(event) {
  event.preventDefault();
  if (!activeAccount) {
    showAuthOverlay("cloud", true);
    return;
  }
  const form = event.currentTarget;
  const name = cleanAccountName(form.elements.displayName.value);
  if (name.length < 2) {
    showToast("Use at least 2 characters for the profile name.");
    form.elements.displayName.focus();
    return;
  }

  activeAccount.name = name;
  const storedAccount = accountById(activeAccount.id);
  if (storedAccount) storedAccount.name = name;
  saveAccounts();
  syncAccountUi();

  if (isActiveCloudProfile()) {
    try {
      await upsertCloudSnapshot(currentJournalSnapshot(name), "profile");
    } catch (error) {
      showToast(friendlyCloudError(error));
      return;
    }
  }

  syncProfileManagementUi();
  showToast("Profile name saved.");
}

async function syncProfileNow() {
  if (!isActiveCloudProfile() || !supabaseClient || !cloudUser) {
    showToast("Open your cloud profile before syncing.");
    return;
  }
  try {
    showToast("Syncing this device with your cloud profile...");
    await upsertCloudSnapshot(currentJournalSnapshot(), "manual");
    await fetchCloudProfile({ apply: true, createIfMissing: true, silent: true });
    await fetchMt5DetectedOrders({ silent: true });
    syncProfileManagementUi();
    showToast("Profile synced.");
  } catch (error) {
    showToast(friendlyCloudError(error));
  }
}

async function handleProfileOpenCloudClick() {
  if (isActiveCloudProfile()) {
    showToast("Cloud Profile Active: this device is already using your synced cloud journal.");
    return;
  }
  if (!cloudUser) {
    showToast("Sign in with email or Google to open your cloud profile.");
    showAuthOverlay("cloud", false);
    return;
  }
  showToast("Opening latest cloud profile...");
  await openCloudProfile();
  syncProfileManagementUi();
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

function startOfQuarter(date) {
  const next = new Date(date);
  const quarterMonth = Math.floor(next.getMonth() / 3) * 3;
  next.setMonth(quarterMonth, 1);
  return next;
}

function historyRangeBounds(range = historyRange) {
  const today = new Date();
  const todayKey = localDateKey(today);
  if (range === "today") return { start: todayKey, end: todayKey };
  if (range === "yesterday") {
    const yesterday = localDateKey(addDays(today, -1));
    return { start: yesterday, end: yesterday };
  }
  if (range === "thisWeek") return { start: localDateKey(startOfWeek(today)), end: todayKey };
  if (range === "last7") return { start: localDateKey(addDays(today, -6)), end: todayKey };
  if (range === "thisMonth") return { start: `${todayKey.slice(0, 7)}-01`, end: todayKey };
  if (range === "last30") return { start: localDateKey(addDays(today, -29)), end: todayKey };
  if (range === "thisQuarter") return { start: localDateKey(startOfQuarter(today)), end: todayKey };
  if (range === "thisYear") return { start: `${today.getFullYear()}-01-01`, end: todayKey };
  if (range === "custom") return { start: historyCustomStart, end: historyCustomEnd };
  return { start: "", end: "" };
}

function updateHistoryFilterControls() {
  const select = $("#historyPeriodFilter");
  const startInput = $("#historyStartFilter");
  const endInput = $("#historyEndFilter");
  if (!select || !startInput || !endInput) return;
  select.value = historyRange || "all";
  const { start, end } = historyRangeBounds();
  startInput.value = start || "";
  endInput.value = end || "";
}

function saveHistoryFilterSettings() {
  settings.historyRange = historyRange;
  settings.historyCustomStart = historyCustomStart;
  settings.historyCustomEnd = historyCustomEnd;
  saveSettings();
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

function updatePeriodPlPeriodControls() {
  $$(".period-pl-period .segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.periodPlPeriod === periodPlPeriod);
  });
}

function savePeriodPlPeriod() {
  settings.periodPlPeriod = periodPlPeriod;
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

function renderTradingViewWidget(force = false) {
  const shell = $("#tradingViewWidgetShell");
  if (!shell) return;
  const symbol = tradingViewSymbolFromPair(marketChartPair);
  const renderKey = `${symbol}|${marketChartInterval}|light`;
  if (!force && marketChartRenderKey === renderKey && shell.querySelector("iframe, script")) {
    syncMarketChartOverlay(symbol);
    return;
  }
  marketChartRenderKey = renderKey;
  shell.classList.add("is-loading");
  shell.innerHTML = '<div class="tradingview-widget-container__widget" id="tradingViewWidget"></div><a class="market-chart-overlay" id="marketChartOverlay" target="_blank" rel="noopener noreferrer"></a>';
  syncMarketChartOverlay(symbol);
  const loadingObserver = new MutationObserver(() => {
    const iframe = shell.querySelector("iframe");
    if (!iframe) return;
    iframe.addEventListener("load", () => shell.classList.remove("is-loading"), { once: true });
    window.setTimeout(() => shell.classList.remove("is-loading"), 2800);
    loadingObserver.disconnect();
  });
  loadingObserver.observe(shell, { childList: true, subtree: true });
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
  window.setTimeout(() => shell.classList.remove("is-loading"), 5200);
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

function uniqueChoices(defaults = [], custom = []) {
  const seen = new Set();
  return [...defaults, ...(Array.isArray(custom) ? custom : [])]
    .map((choice) => String(choice || "").trim())
    .filter((choice) => {
      if (!choice) return false;
      const key = choice.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function appendTradeChoiceOptions(select, defaults, custom, selectedValue, options = {}) {
  if (!select) return;
  const { placeholder = "", addLabel = "Add custom..." } = options;
  const selected = String(selectedValue || "").trim();
  const choices = uniqueChoices(defaults, custom);
  if (selected && !choices.some((choice) => choice.toLowerCase() === selected.toLowerCase()) && selected !== customChoiceValue) {
    choices.push(selected);
  }

  select.innerHTML = "";
  if (placeholder) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.appendChild(option);
  }

  choices.forEach((choice) => {
    const option = document.createElement("option");
    option.value = choice;
    option.textContent = choice;
    select.appendChild(option);
  });

  const addOption = document.createElement("option");
  addOption.value = customChoiceValue;
  addOption.textContent = addLabel;
  select.appendChild(addOption);
  select.value = [...select.options].some((option) => option.value === selected) ? selected : "";
}

function appendSetupTypeOptions(selectedValue = "", select = $("#setupTypeSelect")) {
  if (!select) return;
  const selected = String(selectedValue || "").trim();
  select.innerHTML = "";
  defaultSetupTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    select.appendChild(option);
  });
  select.value = defaultSetupTypes.includes(selected) ? selected : "Custom / Other";
}

function renderStrategySetupTypeOptions(selectedValue = "") {
  const form = $("#strategyForm");
  if (!form) return;
  appendSetupTypeOptions(selectedValue || form.elements.setupType?.value, form.elements.setupType);
}

function renderTradeChoiceOptions(selected = {}) {
  const form = $("#tradeForm");
  if (!form) return;
  appendTradeChoiceOptions(form.elements.setup, defaultSetups, settings.customSetups, selected.setup ?? form.elements.setup.value, {
    placeholder: "Select setup",
    addLabel: "Add custom setup..."
  });
  appendTradeChoiceOptions(form.elements.positive, defaultPositiveTags, settings.customPositiveTags, selected.positive ?? form.elements.positive.value, {
    addLabel: "Add custom positive..."
  });
  appendTradeChoiceOptions(form.elements.mistake, defaultMistakeTags, settings.customMistakeTags, selected.mistake ?? form.elements.mistake.value, {
    addLabel: "Add custom mistake..."
  });
  appendSetupTypeOptions(selected.setupType ?? form.elements.setupType.value);
}

function addCustomTradeChoice(fieldName) {
  const config = {
    setup: { settingsKey: "customSetups", label: "setup" },
    positive: { settingsKey: "customPositiveTags", label: "positive behavior" },
    mistake: { settingsKey: "customMistakeTags", label: "mistake" }
  }[fieldName];
  const form = $("#tradeForm");
  if (!config || !form) return;
  const currentValue = form.elements[fieldName].dataset.previousValue || "";
  const value = String(prompt(`Add custom ${config.label}`, "") || "").trim();
  if (!value) {
    renderTradeChoiceOptions({ [fieldName]: currentValue });
    return;
  }
  if (!Array.isArray(settings[config.settingsKey])) settings[config.settingsKey] = [];
  const exists = uniqueChoices([], settings[config.settingsKey]).some((choice) => choice.toLowerCase() === value.toLowerCase())
    || uniqueChoices(
      fieldName === "setup" ? defaultSetups : fieldName === "positive" ? defaultPositiveTags : defaultMistakeTags,
      []
    ).some((choice) => choice.toLowerCase() === value.toLowerCase());
  if (!exists) settings[config.settingsKey].push(value);
  saveSettings();
  renderTradeChoiceOptions({ [fieldName]: value });
  form.elements[fieldName].value = value;
  form.elements[fieldName].dataset.previousValue = value;
  if (fieldName === "setup") syncSetupTypeFromSetup();
  if (fieldName === "mistake") applyScoreEngine();
  showToast(`${value} added.`);
}

function setupTypeForSetup(setup) {
  const normalized = String(setup || "").trim().toLowerCase();
  if (!normalized) return "Custom / Other";
  const match = Object.entries(setupTypeBySetup).find(([name]) => name.toLowerCase() === normalized);
  return match ? match[1] : "Custom / Other";
}

function syncSetupTypeFromSetup() {
  const form = $("#tradeForm");
  if (!form) return;
  form.elements.setupType.value = setupTypeForSetup(form.elements.setup.value);
}

function scoreFromChecks(checks = {}, group = []) {
  return group.reduce((total, driver) => total + (checks[driver.name] ? driver.points : 0), 0);
}

function disciplineCapForMistake(mistake) {
  const selected = String(mistake || "None").trim();
  if (!selected || selected === "None") return 100;
  const direct = disciplineCapsByMistake[selected];
  if (direct) return direct;
  const match = Object.entries(disciplineCapsByMistake).find(([name]) => name.toLowerCase() === selected.toLowerCase());
  return match ? match[1] : 100;
}

function calculateScoreEngine(checks = {}, mistake = "None") {
  const setup = scoreFromChecks(checks, scoreDriverGroups.setup);
  const confidence = scoreFromChecks(checks, scoreDriverGroups.confidence);
  const rawDiscipline = scoreFromChecks(checks, scoreDriverGroups.discipline);
  const disciplineCap = disciplineCapForMistake(mistake);
  const discipline = Math.min(rawDiscipline, disciplineCap);
  return { setup, confidence, discipline, rawDiscipline, disciplineCap };
}

function scoreChecksFromForm() {
  const form = $("#tradeForm");
  if (!form) return {};
  return scoreDriverNames.reduce((checks, name) => {
    checks[name] = Boolean(form.elements[name]?.checked);
    return checks;
  }, {});
}

function setScoreChecks(checks = {}) {
  const form = $("#tradeForm");
  if (!form) return;
  scoreDriverNames.forEach((name) => {
    if (form.elements[name]) form.elements[name].checked = Boolean(checks[name]);
  });
}

function scoreChecksFromScore(group, score) {
  let remaining = Math.max(toNumber(score), 0);
  return group.reduce((checks, driver) => {
    checks[driver.name] = remaining >= driver.points;
    if (checks[driver.name]) remaining -= driver.points;
    return checks;
  }, {});
}

function defaultScoreChecks() {
  return {
    scoreSetupH1: false,
    scoreSetupM15: false,
    scoreSetupZone: false,
    scoreSetupSl: false,
    scoreSetupTp: false,
    scoreSetupNoChase: false,
    scoreConfidenceExplain: false,
    scoreConfidenceInvalidation: false,
    scoreConfidenceSlTp: false,
    scoreConfidenceEmotion: true,
    scoreConfidenceLimits: true,
    scoreDisciplinePlan: false,
    scoreDisciplineRisk: false,
    scoreDisciplineSl: true,
    scoreDisciplineExit: false,
    scoreDisciplineNoEarlyExit: true,
    scoreDisciplineNoNoise: true,
    scoreDisciplineNoReverse: true,
    scoreDisciplineDailyLimit: true
  };
}

function normalizeChecklistState(value) {
  const today = localDateKey();
  const state = value && typeof value === "object" ? value : {};
  const checks = state.date === today && state.checks && typeof state.checks === "object" ? state.checks : {};
  return {
    date: today,
    checks: { ...checks }
  };
}

function normalizeDailyReview(review = {}) {
  const date = String(review.date || "").slice(0, 10) || localDateKey();
  const fields = [
    "startingBalance",
    "endingBalance",
    "tradesTaken",
    "winLoss",
    "netPl",
    "screenshots",
    "followedPlan",
    "reversedEmotionally",
    "closedEarly",
    "movedSl",
    "overtraded",
    "biggestEmotion",
    "bestBehavior",
    "worstBehavior",
    "mainLesson",
    "ruleForTomorrow"
  ];
  const normalized = { date, updatedAt: review.updatedAt || new Date().toISOString() };
  fields.forEach((field) => {
    normalized[field] = String(review[field] ?? "").trim();
  });
  normalized.followedPlan = normalized.followedPlan || "Yes";
  normalized.reversedEmotionally = normalized.reversedEmotionally || "No";
  normalized.closedEarly = normalized.closedEarly || "No";
  normalized.movedSl = normalized.movedSl || "No";
  normalized.overtraded = normalized.overtraded || "No";
  return normalized;
}

function normalizeDailyReviews(value) {
  const reviews = Array.isArray(value) ? value : [];
  const byDate = new Map();
  reviews.forEach((review) => {
    const normalized = normalizeDailyReview(review);
    byDate.set(normalized.date, normalized);
  });
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function dailyEvidenceStore() {
  const store = loadFromStorage(accountScopedKey(storageKeys.dailyReviewEvidence), {});
  return store && typeof store === "object" && !Array.isArray(store) ? store : {};
}

function normalizeDailyEvidenceStore(store = {}) {
  if (!store || typeof store !== "object" || Array.isArray(store)) return {};
  return Object.entries(store).reduce((next, [date, items]) => {
    const key = String(date || "").slice(0, 10);
    if (!key || !Array.isArray(items)) return next;
    const normalizedItems = items
      .map(normalizeDailyEvidenceItem)
      .filter((item) => item.dataUrl.startsWith("data:image/"))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 2);
    if (normalizedItems.length) next[key] = normalizedItems;
    return next;
  }, {});
}

function mergeDailyEvidenceStores(...stores) {
  const merged = {};
  stores.forEach((store) => {
    const normalized = normalizeDailyEvidenceStore(store);
    Object.entries(normalized).forEach(([date, items]) => {
      const map = new Map((merged[date] || []).map((item) => [item.id || item.dataUrl, item]));
      items.forEach((item) => {
        const key = item.id || item.dataUrl;
        const existing = map.get(key);
        if (!existing || String(item.createdAt || "").localeCompare(String(existing.createdAt || "")) > 0) {
          map.set(key, item);
        }
      });
      merged[date] = [...map.values()]
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .slice(0, 2);
    });
  });
  return merged;
}

function saveDailyEvidenceStore(store) {
  try {
    localStorage.setItem(accountScopedKey(storageKeys.dailyReviewEvidence), JSON.stringify(normalizeDailyEvidenceStore(store)));
    queueCloudSave("evidence");
    return true;
  } catch (error) {
    showToast("Screenshot storage is full. Remove an old screenshot or use a smaller image.");
    return false;
  }
}

function normalizeDailyEvidenceItem(item = {}) {
  return {
    id: String(item.id || randomId("evidence")),
    name: String(item.name || "Chart screenshot").slice(0, 120),
    type: String(item.type || "image/webp"),
    dataUrl: String(item.dataUrl || ""),
    width: Math.max(toNumber(item.width, 0), 0),
    height: Math.max(toNumber(item.height, 0), 0),
    size: Math.max(toNumber(item.size, 0), 0),
    originalSize: Math.max(toNumber(item.originalSize, 0), 0),
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function dailyEvidenceForDate(date = localDateKey()) {
  const key = String(date || "").slice(0, 10) || localDateKey();
  const items = dailyEvidenceStore()[key];
  return Array.isArray(items)
    ? items.map(normalizeDailyEvidenceItem).filter((item) => item.dataUrl.startsWith("data:image/")).slice(0, 2)
    : [];
}

function currentDailyReviewDate() {
  return $("#dailyReviewDate")?.value || localDateKey();
}

function dataUrlByteSize(dataUrl = "") {
  const encoded = String(dataUrl).split(",")[1] || "";
  return Math.round((encoded.length * 3) / 4);
}

function compactBytes(value) {
  const bytes = Math.max(toNumber(value, 0), 0);
  if (bytes >= 1048576) return `${numberFormatter.format(bytes / 1048576)} MB`;
  if (bytes >= 1024) return `${numberFormatter.format(bytes / 1024)} KB`;
  return `${numberFormatter.format(bytes)} B`;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not load image."));
      image.onload = () => resolve(image);
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function compressDailyEvidenceImage(file) {
  const image = await readImageFile(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const width = Math.max(Math.round((image.naturalWidth || image.width) * scale), 1);
  const height = Math.max(Math.round((image.naturalHeight || image.height) * scale), 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  let dataUrl = canvas.toDataURL("image/webp", 0.78);
  let type = "image/webp";
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    type = "image/jpeg";
  }
  return normalizeDailyEvidenceItem({
    id: randomId("evidence"),
    name: file.name || "Chart screenshot",
    type,
    dataUrl,
    width,
    height,
    size: dataUrlByteSize(dataUrl),
    originalSize: file.size || 0,
    createdAt: new Date().toISOString()
  });
}

function renderDailyEvidencePreview(date = currentDailyReviewDate()) {
  const container = $("#dailyEvidencePreview");
  if (!container) return;
  const items = dailyEvidenceForDate(date);
  if (!items.length) {
    container.innerHTML = '<div class="chart-evidence-empty">No screenshots uploaded yet.</div>';
    return;
  }
  container.innerHTML = items
    .map((item) => `
      <article class="chart-evidence-card">
        <button class="chart-evidence-open" type="button" data-evidence-action="open" data-id="${escapeHtml(item.id)}">
          <img src="${escapeHtml(item.dataUrl)}" alt="${escapeHtml(item.name)}">
        </button>
        <div class="chart-evidence-meta">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(`${item.width}x${item.height} · ${compactBytes(item.size)}`)}</span>
        </div>
        <button class="mini-button text-mini danger" type="button" data-evidence-action="remove" data-id="${escapeHtml(item.id)}">Remove</button>
      </article>
    `)
    .join("");
}

async function addDailyEvidenceFiles(fileList) {
  const date = currentDailyReviewDate();
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    showToast("Choose an image screenshot to upload.");
    return;
  }
  const store = dailyEvidenceStore();
  const existing = dailyEvidenceForDate(date);
  const slots = Math.max(2 - existing.length, 0);
  if (!slots) {
    showToast("Daily Review supports 2 screenshots per day.");
    return;
  }
  const selected = files.slice(0, slots);
  try {
    const compressed = [];
    for (const file of selected) {
      compressed.push(await compressDailyEvidenceImage(file));
    }
    store[date] = [...existing, ...compressed].slice(0, 2);
    if (saveDailyEvidenceStore(store)) {
      renderDailyEvidencePreview(date);
      showToast(`Added ${compressed.length} screenshot${compressed.length === 1 ? "" : "s"}.`);
    }
  } catch (error) {
    showToast("Could not process that screenshot.");
  }
}

function removeDailyEvidence(id) {
  const date = currentDailyReviewDate();
  const store = dailyEvidenceStore();
  const next = dailyEvidenceForDate(date).filter((item) => item.id !== id);
  if (next.length) store[date] = next;
  else delete store[date];
  if (saveDailyEvidenceStore(store)) {
    renderDailyEvidencePreview(date);
    showToast("Screenshot removed.");
  }
}

function openEvidencePreview(id) {
  const item = dailyEvidenceForDate(currentDailyReviewDate()).find((evidence) => evidence.id === id);
  if (!item) return;
  const modal = $("#evidencePreviewModal");
  const image = $("#evidencePreviewImage");
  const meta = $("#evidencePreviewMeta");
  if (!modal || !image) return;
  image.src = item.dataUrl;
  image.alt = item.name;
  if (meta) meta.textContent = `${item.name} · ${item.width}x${item.height} · ${compactBytes(item.size)}`;
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeEvidencePreview() {
  const modal = $("#evidencePreviewModal");
  const image = $("#evidencePreviewImage");
  if (image) image.removeAttribute("src");
  modal?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function inferScoreChecksFromTrade(trade = {}) {
  if (trade.scoreChecks && typeof trade.scoreChecks === "object") {
    return { ...defaultScoreChecks(), ...trade.scoreChecks };
  }

  return {
    ...defaultScoreChecks(),
    ...scoreChecksFromScore(scoreDriverGroups.setup, trade.setupScore ?? 0),
    ...scoreChecksFromScore(scoreDriverGroups.confidence, trade.confidence ?? 0),
    ...scoreChecksFromScore(scoreDriverGroups.discipline, trade.discipline ?? 0)
  };
}

function normalizeScorePercent(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return clamp(Math.round(toNumber(value, fallback)), 0, 100);
}

function normalizeTradeChoice(value, fallback = "None") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeTradeReviewFields(trade = {}) {
  const setup = String(trade.setup || "").trim();
  const setupType = String(trade.setupType || "").trim() || setupTypeForSetup(setup);
  const existingPositiveTags = uniqueChoices([], Array.isArray(trade.positiveTags) ? trade.positiveTags : []);
  const positive = normalizeTradeChoice(trade.positive || existingPositiveTags[0], "None");
  const positiveTags = positive === "None" ? existingPositiveTags.filter((tag) => tag !== "None") : uniqueChoices([positive], existingPositiveTags);
  const mistake = normalizeTradeChoice(trade.mistake, "None");
  const hasScoreChecks = trade.scoreChecks && typeof trade.scoreChecks === "object";
  const storedSetupScore = normalizeScorePercent(trade.setupScore, 70);
  const storedConfidence = normalizeScorePercent(trade.confidence, 60);
  const storedDiscipline = normalizeScorePercent(trade.discipline, 70);
  const scoreChecks = hasScoreChecks
    ? inferScoreChecksFromTrade(trade)
    : {
        ...defaultScoreChecks(),
        ...scoreChecksFromScore(scoreDriverGroups.setup, storedSetupScore),
        ...scoreChecksFromScore(scoreDriverGroups.confidence, storedConfidence),
        ...scoreChecksFromScore(scoreDriverGroups.discipline, storedDiscipline)
      };
  const calculated = calculateScoreEngine(scoreChecks, mistake);

  return {
    ...trade,
    setup,
    setupType,
    setupScore: calculated.setup,
    scoreChecks,
    positive,
    positiveTags,
    mistake,
    confidence: calculated.confidence,
    discipline: calculated.discipline
  };
}

function applyScoreEngine() {
  const form = $("#tradeForm");
  if (!form) return;
  const scores = calculateScoreEngine(scoreChecksFromForm(), form.elements.mistake.value);
  form.elements.setupScore.value = scores.setup;
  form.elements.confidence.value = scores.confidence;
  form.elements.discipline.value = scores.discipline;
  const note = $("#scoreEngineNote");
  if (note) {
    note.textContent = scores.disciplineCap < scores.rawDiscipline
      ? `Discipline capped at ${scores.disciplineCap}% by ${form.elements.mistake.value}.`
      : "Scores update from rule drivers.";
  }
  updateSliderOutputs();
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

function balanceSeriesForPeriod(list, period) {
  const buckets = new Map();
  [...list]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((trade) => {
      const key = periodKey(trade.date, period);
      if (!key) return;
      const existing = buckets.get(key) || { key, periodPl: 0, count: 0 };
      existing.periodPl += tradePl(trade);
      existing.count += 1;
      buckets.set(key, existing);
    });

  let running = Math.max(toNumber(settings.startingBalance, 1000), 0);
  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((bucket) => {
      running += bucket.periodPl;
      return {
        ...bucket,
        label: periodLabel(bucket.key, period),
        value: running
      };
    });
}

function withCalculatedTrade(trade) {
  const normalizedTrade = normalizeTradeReviewFields(trade);
  const contractSize = defaultContractSize(normalizedTrade.pair);
  const calc = calculateTradeNumbers({
    pair: normalizedTrade.pair,
    direction: normalizedTrade.direction,
    entry: normalizedTrade.entry,
    stop: normalizedTrade.stop,
    target: normalizedTrade.target,
    exit: normalizedTrade.exit,
    lotSize: normalizedTrade.lotSize,
    contractSize,
    quoteToAccount: normalizedTrade.quoteToAccount,
    manualR: normalizedTrade.manualR
  });
  const hasEntryStop = calc.stopPips > 0;
  const hasLot = calc.lotSize > 0 && calc.contractSize > 0;
  const resultR = hasEntryStop ? roundNumber(calc.resultR, 2) : toNumber(normalizedTrade.resultR);
  const next = {
    ...normalizedTrade,
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
  const fields = ["name", "setupType", "market", "trigger", "invalidation", "riskRule", "management", "reviewRule"];
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

function scoreValue(trade, key, fallback = 0) {
  const value = Number(trade?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function dailyDisciplineReport(list = trades) {
  const today = localDateKey();
  const todayTrades = list.filter((trade) => String(trade.date || "").slice(0, 10) === today);
  const count = todayTrades.length;
  const reviewSaved = Boolean(dailyReviewByDate(today));
  const mistakes = todayTrades.map((trade) => trade.mistake).filter((mistake) => mistake && mistake !== "None");
  const majorMistakes = mistakes.filter((mistake) =>
    ["Revenge Trade", "Instant Reversal", "Overtrade", "Continued After 2 Losses", "Moved SL Emotionally", "No Clear Setup", "Ignored H1 Structure"].includes(mistake)
  );
  const avgDiscipline = count ? sum(todayTrades, (trade) => scoreValue(trade, "discipline", 70)) / count : 100;
  const weakSetupCount = todayTrades.filter((trade) => scoreValue(trade, "setupScore", 70) < 70).length;
  const lowConfidenceCount = todayTrades.filter((trade) => scoreValue(trade, "confidence", 60) < 60).length;
  const missingReviewCount = todayTrades.filter((trade) => !String(trade.notes || "").trim()).length;
  const lossCount = todayTrades.filter((trade) => toNumber(trade.resultR) < 0).length;
  const goodProfit = sum(todayTrades, (trade) => tradePl(trade)) > Math.max(toNumber(settings.startingBalance, 1000) * 0.02, 20);

  if (!count) {
    return {
      grade: "A",
      tone: "a",
      title: "Flat discipline",
      lines: ["0 trades today", reviewSaved ? "Daily review saved." : "No rule breaks recorded.", "Being flat is a professional position."]
    };
  }

  let grade = "A";
  if (majorMistakes.length || avgDiscipline < 40 || count > 5) grade = "F";
  else if (count > 3 || avgDiscipline < 55 || mistakes.includes("Continued After 2 Losses")) grade = "D";
  else if (count > 2 || avgDiscipline < 70 || weakSetupCount || lowConfidenceCount) grade = "C";
  else if (avgDiscipline < 85 || mistakes.length || missingReviewCount || !reviewSaved) grade = "B";

  const title = {
    A: goodProfit ? "Protect the day" : "Professional execution",
    B: "Good control",
    C: "Mixed discipline",
    D: "Rule pressure",
    F: "Stop and reset"
  }[grade];

  return {
    grade,
    tone: grade.toLowerCase(),
    title,
    lines: [
      `${count} ${count === 1 ? "trade" : "trades"} today, ${formatPercent(avgDiscipline)} discipline.`,
      `${lossCount} ${lossCount === 1 ? "loss" : "losses"}, ${mistakes.length} mistake ${mistakes.length === 1 ? "tag" : "tags"}.`,
      majorMistakes.length
        ? `Major rule break: ${majorMistakes[0]}.`
        : !reviewSaved
          ? "Save the daily review to complete journal discipline."
          : weakSetupCount || lowConfidenceCount
            ? "Review setup and confidence before the next entry."
            : "Keep the same process for the next decision."
    ]
  };
}

function render() {
  const stats = analyze(trades);
  const analyticsTrades = getAnalyticsTrades();
  updateThemeControl();
  renderSummary(stats);
  renderFilters();
  renderTable();
  renderAnalytics(analyze(analyticsTrades), analyticsTrades);
  renderStrategies();
  renderMt5Inbox();
  renderChecklistRules();
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
  updateHistoryFilterControls();
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

function checklistInputs() {
  return $$("[data-rule-group] input[type='checkbox'][data-rule-key]");
}

function checklistInputId(input) {
  const group = input.closest("[data-rule-group]")?.dataset.ruleGroup || "";
  return `${group}.${input.dataset.ruleKey || ""}`;
}

function ensureTodayChecklistState() {
  settings.checklistState = normalizeChecklistState(settings.checklistState);
  return settings.checklistState;
}

function checkedCountForGroup(group) {
  const inputs = $$(`[data-rule-group="${group}"] input[type='checkbox'][data-rule-key]`);
  const checked = inputs.filter((input) => input.checked).length;
  return { checked, total: inputs.length };
}

function setDashboardCard(cardId, tone = "") {
  const card = $(`#${cardId}`)?.closest("article");
  if (!card) return;
  card.classList.toggle("warning", tone === "warning");
  card.classList.toggle("complete", tone === "complete");
}

const autoNoTradeRuleLabels = {
  setupWeak: "Setup score below 60 found in today's journal.",
  confidenceWeak: "Confidence below 60 found in today's journal.",
  emotionDamaged: "Emotional mistake tag found today.",
  instantReversal: "Opposite-direction reversal or instant reversal tag found today.",
  dailyTradeLimit: "Two or more trades already recorded today.",
  twoLosses: "Two losses already recorded today.",
  goodProfitDone: "Good profit day detected; protect the day.",
  noiseOnly: "M1/M5 noise reaction logged today.",
  feelingOnly: "Entry reason shows feeling, FOMO, chasing, or no clear setup.",
  slUnclear: "SL rule issue logged today.",
  tpUnclear: "TP, R:R, or early-exit issue logged today."
};

function tradesForDate(date) {
  const key = String(date || "").slice(0, 10);
  return trades.filter((trade) => String(trade.date || "").slice(0, 10) === key);
}

function topFrequencyValue(values = []) {
  const counts = new Map();
  values
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "None")
    .forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }))[0] || null;
}

function tradeTagsForReview(trade, key) {
  const values = [];
  if (trade?.[key]) values.push(trade[key]);
  if (key === "positive" && Array.isArray(trade?.positiveTags)) values.push(...trade.positiveTags);
  return values
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "None");
}

function hasReviewTag(values = [], targets = []) {
  const targetSet = new Set(targets.map((target) => String(target).toLowerCase()));
  return values.some((value) => targetSet.has(String(value).toLowerCase()));
}

function hasOppositeReversalWithinMinutes(dayTrades = [], minutes = 30) {
  const timedTrades = dayTrades
    .map((trade) => ({
      direction: String(trade.direction || "").toLowerCase(),
      time: tradeOpenTime(trade)
    }))
    .filter((trade) => ["buy", "sell"].includes(trade.direction) && trade.time)
    .map((trade) => {
      const [hours, mins] = trade.time.split(":").map(Number);
      return { ...trade, minuteOfDay: hours * 60 + mins };
    })
    .sort((a, b) => a.minuteOfDay - b.minuteOfDay);

  return timedTrades.some((trade, index) => {
    const previous = timedTrades[index - 1];
    if (!previous) return false;
    return trade.direction !== previous.direction && trade.minuteOfDay - previous.minuteOfDay <= minutes;
  });
}

function todayNoTradeSignals(date = localDateKey()) {
  const dayTrades = tradesForDate(date);
  const mistakes = dayTrades.flatMap((trade) => tradeTagsForReview(trade, "mistake"));
  const netPl = sum(dayTrades, (trade) => tradePl(trade));
  const signals = {};

  if (dayTrades.some((trade) => scoreValue(trade, "setupScore", 70) < 60)) signals.setupWeak = autoNoTradeRuleLabels.setupWeak;
  if (dayTrades.some((trade) => scoreValue(trade, "confidence", 60) < 60)) signals.confidenceWeak = autoNoTradeRuleLabels.confidenceWeak;
  if (hasReviewTag(mistakes, ["Revenge Trade", "FOMO", "Overtrade", "Instant Reversal", "Continued After 2 Losses", "Continued After Good Profit"])) {
    signals.emotionDamaged = autoNoTradeRuleLabels.emotionDamaged;
  }
  if (hasReviewTag(mistakes, ["Instant Reversal"]) || hasOppositeReversalWithinMinutes(dayTrades)) {
    signals.instantReversal = autoNoTradeRuleLabels.instantReversal;
  }
  if (dayTrades.length >= 2) signals.dailyTradeLimit = autoNoTradeRuleLabels.dailyTradeLimit;
  if (dayTrades.filter((trade) => toNumber(trade.resultR) < 0).length >= 2) signals.twoLosses = autoNoTradeRuleLabels.twoLosses;
  if (netPl > Math.max(toNumber(settings.startingBalance, 1000) * 0.02, 20)) signals.goodProfitDone = autoNoTradeRuleLabels.goodProfitDone;
  if (hasReviewTag(mistakes, ["M5 Noise Reaction"])) signals.noiseOnly = autoNoTradeRuleLabels.noiseOnly;
  if (hasReviewTag(mistakes, ["No Clear Setup", "Chasing Entry", "FOMO"])) signals.feelingOnly = autoNoTradeRuleLabels.feelingOnly;
  if (hasReviewTag(mistakes, ["Moved SL Emotionally"])) signals.slUnclear = autoNoTradeRuleLabels.slUnclear;
  if (hasReviewTag(mistakes, ["Poor R:R", "Early Exit"])) signals.tpUnclear = autoNoTradeRuleLabels.tpUnclear;

  return signals;
}

function renderAutoNoTradeSignals(signals = {}) {
  const container = $("#autoNoTradeSignals");
  if (!container) return;
  const entries = Object.entries(signals);
  container.innerHTML = entries
    .map(([key, label]) => `
      <article>
        <strong>${escapeHtml(key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()))}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `)
    .join("");
}

function renderChecklistDashboard() {
  const noTrade = checkedCountForGroup("noTrade");
  const preEntry = checkedCountForGroup("preEntry");
  const postTrade = checkedCountForGroup("postTrade");
  const todayReview = dailyReviewByDate(localDateKey());
  const autoSignalCount = Object.keys(todayNoTradeSignals()).length;

  $("#noTradeProgress").textContent = `${noTrade.checked} / ${noTrade.total}`;
  $("#noTradeStatus").textContent = autoSignalCount
    ? `${autoSignalCount} auto warning${autoSignalCount === 1 ? "" : "s"} from journal`
    : noTrade.checked
      ? "Stand down until cleared"
      : "Clear to evaluate";
  setDashboardCard("noTradeProgress", noTrade.checked ? "warning" : "complete");

  $("#preEntryProgress").textContent = `${preEntry.checked} / ${preEntry.total}`;
  $("#preEntryStatus").textContent = preEntry.total && preEntry.checked === preEntry.total ? "Entry plan complete" : "Plan not complete";
  setDashboardCard("preEntryProgress", preEntry.total && preEntry.checked === preEntry.total ? "complete" : "");

  $("#postTradeProgress").textContent = `${postTrade.checked} / ${postTrade.total}`;
  $("#postTradeStatus").textContent = postTrade.total && postTrade.checked === postTrade.total ? "Review complete" : "Review pending";
  setDashboardCard("postTradeProgress", postTrade.total && postTrade.checked === postTrade.total ? "complete" : "");

  $("#dailyReviewProgress").textContent = todayReview ? "Saved" : "Not saved";
  $("#dailyReviewStatus").textContent = todayReview ? `Updated ${formatDate(todayReview.date)}` : "Record today before closing platform";
  setDashboardCard("dailyReviewProgress", todayReview ? "complete" : "");
}

function dailyReviewByDate(date) {
  const key = String(date || "").slice(0, 10);
  return settings.dailyReviews.find((review) => review.date === key) || null;
}

function ruleForTomorrowFromSignals(signals = {}, topMistake = null) {
  if (signals.twoLosses) return "After 2 losses, stop trading and only review screenshots.";
  if (signals.dailyTradeLimit) return "Maximum 2 trades unless the next setup is A+ and fully checked.";
  if (signals.emotionDamaged) return "No entry after FOMO, revenge, or frustration until a full reset is complete.";
  if (signals.instantReversal) return "No opposite-direction reversal within 30 minutes without H1 and M15 confirmation.";
  if (signals.setupWeak) return "Skip every setup below 60 setup score.";
  if (signals.confidenceWeak) return "Do not enter unless confidence drivers are clearly explained before the trade.";
  if (signals.goodProfitDone) return "After a good profit day, protect profit and trade smaller or stop.";
  if (signals.noiseOnly) return "Ignore M1/M5 noise unless it aligns with the higher-timeframe plan.";
  if (signals.tpUnclear) return "No trade without clean TP and acceptable R:R.";
  if (signals.slUnclear) return "No trade without a logical SL location.";
  if (topMistake) return `Remove ${topMistake.name} from tomorrow's execution.`;
  return "Repeat the highest-quality setup only.";
}

function dailyReviewDefaults(date = localDateKey()) {
  const dayTrades = tradesForDate(date);
  const wins = dayTrades.filter((trade) => toNumber(trade.resultR) > 0).length;
  const losses = dayTrades.filter((trade) => toNumber(trade.resultR) < 0).length;
  const flat = Math.max(dayTrades.length - wins - losses, 0);
  const netPl = roundNumber(sum(dayTrades, (trade) => toNumber(trade.actualPl)), 2);
  const startingBalance = toNumber(settings.startingBalance, 1000);
  const mistakes = dayTrades.flatMap((trade) => tradeTagsForReview(trade, "mistake"));
  const positives = dayTrades.flatMap((trade) => tradeTagsForReview(trade, "positive"));
  const topMistake = topFrequencyValue(mistakes);
  const topPositive = topFrequencyValue(positives);
  const signals = todayNoTradeSignals(date);
  const signalList = Object.values(signals);
  const majorRuleIssue = hasReviewTag(mistakes, [
    "Revenge Trade",
    "FOMO",
    "Overtrade",
    "Instant Reversal",
    "Moved SL Emotionally",
    "Continued After 2 Losses",
    "Continued After Good Profit",
    "No Clear Setup"
  ]);

  return normalizeDailyReview({
    date,
    startingBalance: startingBalance ? String(startingBalance) : "",
    endingBalance: dayTrades.length ? String(roundNumber(startingBalance + netPl, 2)) : "",
    tradesTaken: dayTrades.length ? String(dayTrades.length) : "",
    winLoss: dayTrades.length ? `${wins}W / ${losses}L${flat ? ` / ${flat}BE` : ""}` : "",
    netPl: dayTrades.length ? currencyFormatter.format(netPl) : "",
    followedPlan: majorRuleIssue ? "No" : signalList.length ? "Partially" : "Yes",
    reversedEmotionally: hasReviewTag(mistakes, ["Instant Reversal", "Revenge Trade"]) ? "Yes" : "No",
    closedEarly: hasReviewTag(mistakes, ["Early Exit"]) ? "Yes" : "No",
    movedSl: hasReviewTag(mistakes, ["Moved SL Emotionally"]) ? "Yes" : "No",
    overtraded: dayTrades.length > 2 || hasReviewTag(mistakes, ["Overtrade"]) ? "Yes" : "No",
    biggestEmotion: topMistake?.name || (signalList.length ? "Rule pressure" : "Calm"),
    bestBehavior: topPositive?.name || (dayTrades.length ? "Journal completed and risk reviewed" : "Stayed flat"),
    worstBehavior: topMistake?.name || signalList[0] || "None recorded",
    mainLesson: signalList[0] || (dayTrades.length ? "Process stayed clean; keep executing the same plan." : "No trade can be a valid trading decision."),
    ruleForTomorrow: ruleForTomorrowFromSignals(signals, topMistake)
  });
}

function fillDailyReviewForm(date = localDateKey()) {
  const form = $("#dailyReviewForm");
  if (!form) return;
  const review = dailyReviewByDate(date) || dailyReviewDefaults(date);
  Object.entries(review).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  renderDailyEvidencePreview(review.date);
}

function selectedDailyReviewLoadMessage(date = currentDailyReviewDate()) {
  return dailyReviewByDate(date) ? "Saved daily review loaded." : "No saved review for this date. Journal defaults loaded.";
}

function fillDailyReviewFromJournal(date = localDateKey()) {
  const form = $("#dailyReviewForm");
  if (!form) return;
  const review = dailyReviewDefaults(date);
  Object.entries(review).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  renderDailyEvidencePreview(review.date);
  renderChecklistDashboard();
}

function readDailyReviewForm() {
  const form = $("#dailyReviewForm");
  const data = new FormData(form);
  return normalizeDailyReview({
    date: data.get("date") || localDateKey(),
    startingBalance: data.get("startingBalance"),
    endingBalance: data.get("endingBalance"),
    tradesTaken: data.get("tradesTaken"),
    winLoss: data.get("winLoss"),
    netPl: data.get("netPl"),
    screenshots: data.get("screenshots"),
    followedPlan: data.get("followedPlan"),
    reversedEmotionally: data.get("reversedEmotionally"),
    closedEarly: data.get("closedEarly"),
    movedSl: data.get("movedSl"),
    overtraded: data.get("overtraded"),
    biggestEmotion: data.get("biggestEmotion"),
    bestBehavior: data.get("bestBehavior"),
    worstBehavior: data.get("worstBehavior"),
    mainLesson: data.get("mainLesson"),
    ruleForTomorrow: data.get("ruleForTomorrow"),
    updatedAt: new Date().toISOString()
  });
}

function renderDailyReviewHistory() {
  const container = $("#dailyReviewHistory");
  if (!container) return;
  const reviews = normalizeDailyReviews(settings.dailyReviews).slice(0, 10);
  if (!reviews.length) {
    container.innerHTML = '<p class="rule-copy">No daily reviews saved yet.</p>';
    return;
  }
  container.innerHTML = reviews
    .map((review) => {
      const evidenceCount = dailyEvidenceForDate(review.date).length;
      return `
      <article class="daily-review-item">
        <div>
          <div class="daily-review-date-row">
            <strong>${escapeHtml(formatDate(review.date))}</strong>
            <span>${escapeHtml(review.updatedAt ? `Updated ${new Date(review.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Saved")}</span>
          </div>
          <p>${escapeHtml(review.tradesTaken || "0")} trades · ${escapeHtml(review.winLoss || "No W/L noted")} · ${escapeHtml(review.netPl || "$0.00")}</p>
          <p class="daily-review-rule">${escapeHtml(review.ruleForTomorrow || "No rule for tomorrow recorded.")}</p>
          <div class="daily-review-tags">
            <span>${escapeHtml(review.followedPlan || "Plan not scored")}</span>
            <span>${escapeHtml(review.biggestEmotion || "Emotion not noted")}</span>
            ${evidenceCount ? `<span>${escapeHtml(`${evidenceCount} screenshot${evidenceCount === 1 ? "" : "s"}`)}</span>` : ""}
          </div>
        </div>
        <div class="daily-review-item-actions">
          <button class="mini-button text-mini" type="button" data-daily-review-action="load" data-daily-review-date="${escapeHtml(review.date)}">Edit</button>
          <button class="mini-button text-mini danger" type="button" data-daily-review-action="delete" data-daily-review-date="${escapeHtml(review.date)}">Delete</button>
        </div>
      </article>
    `;
    })
    .join("");
}

function loadDailyReviewForEdit(date) {
  const key = String(date || "").slice(0, 10);
  if (!key) return;
  fillDailyReviewForm(key);
  const form = $("#dailyReviewForm");
  form?.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast(selectedDailyReviewLoadMessage(key));
}

function deleteDailyReview(date) {
  const key = String(date || "").slice(0, 10);
  if (!key) return;
  if (!window.confirm(`Delete the daily review for ${formatDate(key)}? Chart screenshots for this date will stay available.`)) return;
  const before = settings.dailyReviews.length;
  settings.dailyReviews = normalizeDailyReviews(settings.dailyReviews).filter((review) => review.date !== key);
  if (settings.dailyReviews.length === before) return;
  saveSettings();
  if (currentDailyReviewDate() === key) fillDailyReviewForm(key);
  renderDailyReviewHistory();
  renderChecklistDashboard();
  showToast("Daily review deleted. Screenshots for this date are kept unless removed from Chart Evidence.");
}

function previousDateKey(date = localDateKey()) {
  const parsed = new Date(`${String(date || localDateKey()).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() - 1);
  return parsed.toISOString().slice(0, 10);
}

function previousDailyReviewBefore(date = localDateKey()) {
  const selected = String(date || localDateKey()).slice(0, 10);
  const exactPrevious = dailyReviewByDate(previousDateKey(selected));
  if (exactPrevious) return exactPrevious;
  return normalizeDailyReviews(settings.dailyReviews).find((review) => review.date < selected) || null;
}

function copyPreviousDailyRule() {
  const form = $("#dailyReviewForm");
  if (!form) return;
  const selected = currentDailyReviewDate();
  const previousReview = previousDailyReviewBefore(selected);
  if (!previousReview?.ruleForTomorrow) {
    showToast("No previous rule found to copy.");
    return;
  }
  form.elements.ruleForTomorrow.value = previousReview.ruleForTomorrow;
  showToast(`Copied rule from ${formatDate(previousReview.date)}.`);
}

function renderChecklistRules() {
  if (!$("#checklistView")) return;
  const state = ensureTodayChecklistState();
  const autoSignals = todayNoTradeSignals();
  checklistInputs().forEach((input) => {
    const group = input.closest("[data-rule-group]")?.dataset.ruleGroup || "";
    const ruleKey = input.dataset.ruleKey || "";
    const autoTriggered = group === "noTrade" && Boolean(autoSignals[ruleKey]);
    input.checked = Boolean(state.checks[checklistInputId(input)]) || autoTriggered;
    input.dataset.autoTriggered = autoTriggered ? "true" : "";
    input.title = autoTriggered ? autoSignals[ruleKey] : "";
    input.closest(".check-card")?.classList.toggle("auto-triggered", autoTriggered);
  });
  renderAutoNoTradeSignals(autoSignals);
  fillDailyReviewForm($("#dailyReviewDate")?.value || localDateKey());
  renderDailyReviewHistory();
  renderChecklistDashboard();
}

function updateChecklistInput(input) {
  const state = ensureTodayChecklistState();
  if (input.dataset.autoTriggered === "true" && !input.checked) {
    input.checked = true;
    showToast("Auto rule is active from today's journal.");
  }
  state.checks[checklistInputId(input)] = input.checked;
  saveSettings();
  renderChecklistDashboard();
}

function saveDailyReviewFromForm() {
  const review = readDailyReviewForm();
  const index = settings.dailyReviews.findIndex((item) => item.date === review.date);
  if (index >= 0) settings.dailyReviews[index] = review;
  else settings.dailyReviews.push(review);
  settings.dailyReviews = normalizeDailyReviews(settings.dailyReviews);
  saveSettings();
  renderDailyEvidencePreview(review.date);
  renderDailyReviewHistory();
  renderChecklistDashboard();
  showToast("Daily review saved.");
}

function exportDailyReviewsCsv() {
  const reviews = normalizeDailyReviews(settings.dailyReviews);
  if (!reviews.length) {
    showToast("Save a daily review before exporting.");
    return;
  }
  const range = dailyReviewExportRange();
  const visibleReviews = filterDailyReviewsForExport(reviews, range);
  if (!visibleReviews.length) {
    showToast("No daily reviews match that CSV period.");
    return;
  }
  const headers = [
    "date",
    "startingBalance",
    "endingBalance",
    "tradesTaken",
    "winLoss",
    "netPl",
    "screenshots",
    "chartEvidenceCount",
    "followedPlan",
    "reversedEmotionally",
    "closedEarly",
    "movedSl",
    "overtraded",
    "biggestEmotion",
    "bestBehavior",
    "worstBehavior",
    "mainLesson",
    "ruleForTomorrow",
    "updatedAt"
  ];
  const rows = visibleReviews.map((review) =>
    headers.map((header) => {
      const value = header === "chartEvidenceCount" ? dailyEvidenceForDate(review.date).length : review[header];
      return `"${String(value ?? "").replace(/"/g, '""')}"`;
    }).join(",")
  );
  downloadFile(dailyReviewExportFilename(range), [headers.join(","), ...rows].join("\n"), "text/csv");
  showToast(`Exported ${visibleReviews.length} daily ${visibleReviews.length === 1 ? "review" : "reviews"}.`);
}

function dailyReviewExportRange() {
  const period = $("#dailyReviewExportPeriod")?.value || "all";
  const today = new Date();
  const todayKey = localDateKey(today);
  if (period === "today") return { period, start: todayKey, end: todayKey };
  if (period === "thisWeek") return { period, start: localDateKey(startOfWeek(today)), end: todayKey };
  if (period === "thisMonth") return { period, start: `${todayKey.slice(0, 7)}-01`, end: todayKey };
  if (period === "thisYear") return { period, start: `${today.getFullYear()}-01-01`, end: todayKey };
  if (period === "last30") return { period, start: localDateKey(addDays(today, -29)), end: todayKey };
  if (period === "custom") {
    return {
      period,
      start: $("#dailyReviewExportStart")?.value || "",
      end: $("#dailyReviewExportEnd")?.value || ""
    };
  }
  return { period: "all", start: "", end: "" };
}

function filterDailyReviewsForExport(reviews, range) {
  return reviews.filter((review) => {
    const date = String(review.date || "").slice(0, 10);
    if (!date) return false;
    if (range.start && date < range.start) return false;
    if (range.end && date > range.end) return false;
    return true;
  });
}

function dailyReviewExportFilename(range) {
  const label = range.start || range.end ? `${range.start || "start"}-to-${range.end || "latest"}` : "all";
  return `fx-daily-reviews-${label}.csv`.replace(/[^a-z0-9._-]+/gi, "-");
}

function updateDailyReviewExportControls() {
  const range = dailyReviewExportRange();
  const isCustom = range.period === "custom";
  $$(".daily-review-export-custom").forEach((control) => control.classList.toggle("hidden", !isCustom));
  if (!isCustom) {
    const startInput = $("#dailyReviewExportStart");
    const endInput = $("#dailyReviewExportEnd");
    if (startInput) startInput.value = range.start || "";
    if (endInput) endInput.value = range.end || "";
  }
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
  const historyStart = $("#historyStartFilter")?.value || "";
  const historyEnd = $("#historyEndFilter")?.value || "";

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
      const matchesStart = !historyStart || trade.date >= historyStart;
      const matchesEnd = !historyEnd || trade.date <= historyEnd;
      return matchesQuery && matchesOutcome && matchesSetup && matchesStart && matchesEnd;
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
  const equitySeries = equityChartMetric === "balance"
    ? balanceSeriesForPeriod(sourceTrades, equityPeriod)
    : equitySeriesForPeriod(sourceTrades, equityPeriod);
  const periodLabelText = equityPeriod.charAt(0).toUpperCase() + equityPeriod.slice(1);
  const chartTitle = $("#chart-title");
  if (chartTitle) chartTitle.textContent = equityChartMetric === "balance" ? "Equity Balance Curve" : "Cumulative R Curve";
  if (equityChartMetric === "balance") {
    const startingBalance = Math.max(toNumber(settings.startingBalance, 1000), 0);
    const endingBalance = equitySeries[equitySeries.length - 1]?.value ?? startingBalance;
    $("#expectancyPill").textContent = `${periodLabelText} view, ${currencyFormatter.format(endingBalance)} balance`;
  } else {
    $("#expectancyPill").textContent = `${periodLabelText} view, ${formatR(stats.expectancy)} expectancy`;
  }
  drawEquityChart(equitySeries, equityPeriod, equityChartMetric);
  renderInsights(stats, sourceTrades);
  renderDailyDisciplineGrade();
  renderDevelopmentAnalytics(sourceTrades);
  renderLeaderboard("#setupLeaderboard", stats.setupStats, "setup");
  renderLeaderboard("#sessionBreakdown", stats.sessionStats, "session");
  renderLeaderboard("#mistakeBreakdown", stats.mistakeStats, "mistake");
  renderBestProfile(stats);
  renderPerformanceCharts(sourceTrades);
  renderReportAnalysis(sourceTrades);
}

function renderDailyDisciplineGrade() {
  const container = $("#dailyDisciplineGrade");
  if (!container) return;
  const report = dailyDisciplineReport(trades);
  container.className = `discipline-grade-card grade-${report.tone}`;
  container.innerHTML = `
    <div class="grade-mark">${escapeHtml(report.grade)}</div>
    <div>
      <strong>${escapeHtml(report.title)}</strong>
      ${report.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
    </div>
  `;
}

function averageScoreForList(list, key, fallback = 0) {
  return list.length ? sum(list, (trade) => scoreValue(trade, key, fallback)) / list.length : 0;
}

function scoreTone(value, good = 70, caution = 55) {
  if (value >= good) return "positive";
  if (value >= caution) return "caution";
  return "negative";
}

function scoreSummaryLabel(key) {
  return {
    setupScore: "Setup quality",
    confidence: "Confidence",
    discipline: "Discipline",
    alignment: "Aligned trades"
  }[key] || key;
}

function setupTypeForTrade(trade) {
  return String(trade.setupType || setupTypeBySetup[trade.setup] || "Custom / Other").trim() || "Custom / Other";
}

function scoreStatsForItems(name, items) {
  const wins = items.filter((trade) => toNumber(trade.resultR) > 0).length;
  const losses = items.filter((trade) => toNumber(trade.resultR) < 0).length;
  const resolved = wins + losses;
  const netR = sum(items, (trade) => toNumber(trade.resultR));
  return {
    name,
    count: items.length,
    netR,
    avgR: items.length ? netR / items.length : 0,
    winRate: resolved ? (wins / resolved) * 100 : 0,
    avgSetup: averageScoreForList(items, "setupScore", 70),
    avgConfidence: averageScoreForList(items, "confidence", 60),
    avgDiscipline: averageScoreForList(items, "discipline", 70),
    items
  };
}

function setupTypeAnalytics(list) {
  return Object.entries(groupBy(list, setupTypeForTrade))
    .map(([name, items]) => scoreStatsForItems(name, items))
    .sort((a, b) => b.avgR - a.avgR || b.count - a.count);
}

function executionBucketForTrade(trade) {
  const setupOk = scoreValue(trade, "setupScore", 70) >= 70;
  const confidenceOk = scoreValue(trade, "confidence", 60) >= 60;
  const disciplineOk = scoreValue(trade, "discipline", 70) >= 70;
  if (setupOk && confidenceOk && disciplineOk) return "Full alignment";
  if (setupOk && confidenceOk && !disciplineOk) return "Execution leak";
  if (setupOk && !confidenceOk && disciplineOk) return "Low-conviction control";
  if (!setupOk && disciplineOk) return "Disciplined weak setup";
  return "High-risk behavior";
}

function executionMatrixAnalytics(list) {
  const order = ["Full alignment", "Execution leak", "Low-conviction control", "Disciplined weak setup", "High-risk behavior"];
  return Object.entries(groupBy(list, executionBucketForTrade))
    .map(([name, items]) => scoreStatsForItems(name, items))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

function positiveBehaviorAnalytics(list) {
  const groups = {};
  list.forEach((trade) => {
    tradeTagsForReview(trade, "positive").forEach((tag) => {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(trade);
    });
  });
  return Object.entries(groups)
    .map(([name, items]) => scoreStatsForItems(name, items))
    .sort((a, b) => b.avgR - a.avgR || b.count - a.count);
}

function renderScoreSnapshot(list) {
  const container = $("#scoreSnapshot");
  if (!container) return;
  const count = list.length;
  const avgSetup = averageScoreForList(list, "setupScore", 70);
  const avgConfidence = averageScoreForList(list, "confidence", 60);
  const avgDiscipline = averageScoreForList(list, "discipline", 70);
  const alignedCount = list.filter((trade) =>
    scoreValue(trade, "setupScore", 70) >= 70 &&
    scoreValue(trade, "confidence", 60) >= 60 &&
    scoreValue(trade, "discipline", 70) >= 70
  ).length;
  const alignment = count ? (alignedCount / count) * 100 : 0;
  const rows = [
    { key: "setupScore", value: avgSetup, note: count ? "Entry idea quality" : "Record trades to score setup quality" },
    { key: "confidence", value: avgConfidence, note: count ? "Pre-entry conviction" : "Confidence appears after scored trades" },
    { key: "discipline", value: avgDiscipline, note: count ? "Execution rule control" : "Discipline appears after scored trades" },
    { key: "alignment", value: alignment, note: `${alignedCount}/${count} trades met score gates` }
  ];

  container.innerHTML = rows
    .map((row) => {
      const value = Math.max(0, Math.min(row.value || 0, 100));
      const tone = scoreTone(value, row.key === "alignment" ? 55 : 70, row.key === "alignment" ? 35 : 55);
      return `
        <article class="score-snapshot-card score-${tone}">
          <span>${escapeHtml(scoreSummaryLabel(row.key))}</span>
          <strong>${formatPercent(value)}</strong>
          <div class="score-meter"><div style="width: ${value}%;"></div></div>
          <p>${escapeHtml(row.note)}</p>
        </article>
      `;
    })
    .join("");
}

function renderScoreLeaderboard(selector, rows, emptyLabel, options = {}) {
  const container = $(selector);
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state visible">No ${escapeHtml(emptyLabel)} data.</div>`;
    return;
  }

  const topAbs = Math.max(...rows.map((row) => Math.abs(row.netR)), 1);
  container.innerHTML = rows
    .slice(0, options.limit || 5)
    .map((row) => {
      const width = Math.min((Math.abs(row.netR) / topAbs) * 100, 100);
      const tone = row.netR >= 0 ? "positive" : "negative";
      const details = options.details
        ? options.details(row)
        : `${row.count} trades, ${formatPercent(row.winRate)} win, ${formatR(row.avgR)} avg`;
      return `
        <article class="score-row score-${tone}">
          <header>
            <strong>${escapeHtml(row.name)}</strong>
            <span>${formatR(row.netR)}</span>
          </header>
          <p>${escapeHtml(details)}</p>
          <div class="leader-track"><div class="leader-fill" style="width: ${width}%;"></div></div>
        </article>
      `;
    })
    .join("");
}

function renderDevelopmentAnalytics(sourceTrades = getAnalyticsTrades()) {
  renderScoreSnapshot(sourceTrades);
  renderScoreLeaderboard("#setupTypeEdge", setupTypeAnalytics(sourceTrades), "setup type", {
    details: (row) => `${row.count} trades, setup ${formatPercent(row.avgSetup)}, discipline ${formatPercent(row.avgDiscipline)}, ${formatR(row.avgR)} avg`
  });
  renderScoreLeaderboard("#executionMatrix", executionMatrixAnalytics(sourceTrades), "execution matrix", {
    details: (row) => `${row.count} trades, confidence ${formatPercent(row.avgConfidence)}, discipline ${formatPercent(row.avgDiscipline)}, ${formatR(row.avgR)} avg`
  });
  renderScoreLeaderboard("#positiveBreakdown", positiveBehaviorAnalytics(sourceTrades), "positive behavior", {
    details: (row) => `${row.count} tags, ${formatPercent(row.winRate)} win, discipline ${formatPercent(row.avgDiscipline)}`
  });
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
  const measuredWidth = rect.width || canvas.clientWidth || wrapRect?.width || 0;
  const width = measuredWidth > 0 ? measuredWidth : fallbackWidth;
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

const chartToneClasses = ["tone-positive", "tone-negative", "tone-count"];

function setChartTone(element, tone = "") {
  if (!element) return;
  chartToneClasses.forEach((className) => element.classList.remove(className));
  if (tone) element.classList.add(`tone-${tone}`);
}

function chartToneForValue(value, options = {}) {
  if (options.colorMode === "count") return "count";
  const numericValue = toNumber(value);
  if (numericValue < 0) return "negative";
  if (numericValue > 0) return "positive";
  return "";
}

function equityToneForPoint(point) {
  const periodValue = equityChartState.metric === "balance" ? point.periodPl : point.periodR;
  return chartToneForValue(periodValue);
}

function setChartReadout(chartId, title, lines = [], tone = "") {
  const readout = $(`#${chartId}Readout`);
  if (!readout) return;
  setChartTone(readout, tone);
  readout.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    ${lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}
  `;
}

function resetChartReadout(chartId, message) {
  const readout = $(`#${chartId}Readout`);
  if (readout) {
    setChartTone(readout);
    readout.textContent = message;
  }
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

function cssVar(name, fallback = "") {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function chartPalette() {
  return {
    bg: cssVar("--chart-canvas-bg", "#fffefb"),
    grid: cssVar("--chart-grid", "#d9ded7"),
    text: cssVar("--muted", "#69736f"),
    ink: cssVar("--ink", "#1f2826"),
    teal: cssVar("--teal", "#0f766e"),
    red: cssVar("--red", "#be123c"),
    blue: cssVar("--blue", "#2563eb"),
    fill: cssVar("--chart-fill", "rgba(15, 118, 110, 0.12)"),
    redFill: cssVar("--chart-negative-fill", "rgba(190, 18, 60, 0.12)"),
    labelOutline: cssVar("--chart-label-outline", "rgba(255, 255, 255, 0.92)"),
    labelShadow: cssVar("--chart-label-shadow", "rgba(31, 40, 38, 0.2)")
  };
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
  context.lineWidth = options.outlineWidth ?? 4;
  const palette = chartPalette();
  context.strokeStyle = options.outline || palette.labelOutline;
  context.shadowColor = options.shadowColor || palette.labelShadow;
  context.shadowBlur = options.shadowBlur ?? 4;
  context.shadowOffsetY = options.shadowOffsetY ?? 1;
  context.strokeText(label, safeX, y);
  context.fillStyle = options.color || palette.ink;
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
  const palette = chartPalette();
  drawModernValueLabel(context, text, x, y, {
    color: options.color || palette.ink,
    outline: options.outline || palette.labelOutline,
    outlineWidth: options.outlineWidth || 4,
    shadowBlur: options.shadowBlur || 1.5,
    shadowColor: options.shadowColor || palette.labelShadow,
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

function formatEquityChartValue(value, metric = "r") {
  return metric === "balance" ? currencyFormatter.format(value) : formatR(value);
}

function renderEquityDomLabels(canvas, points, labels, dimensions) {
  const layer = ensureChartLabelLayer(canvas);
  if (!layer) return;
  const { width, height, padding, yMax, yMin, compact, metric = "r" } = dimensions;
  const scale = chartPixelScales(canvas, width, height);
  const scaledX = (value) => value * scale.x;
  const scaledY = (value) => value * scale.y;
  const xMax = canvas.clientWidth - 20;

  const yMid = (yMax + yMin) / 2;
  appendChartLabel(layer, formatEquityChartValue(yMax, metric), clamp(scaledX(padding.left), 20, xMax), scaledY(padding.top + 4), "axis edge-left");
  appendChartLabel(layer, formatEquityChartValue(yMid, metric), clamp(scaledX(padding.left), 20, xMax), scaledY((height - padding.bottom + padding.top) / 2), "axis edge-left muted-axis");
  appendChartLabel(layer, formatEquityChartValue(yMin, metric), clamp(scaledX(padding.left), 20, xMax), scaledY(height - padding.bottom + 2), "axis edge-left");

  const indexes = compact
    ? [...new Set([0, points.length - 1])]
    : [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  indexes.forEach((index) => {
    const point = points[index];
    const text = compact ? compactChartLabel(labels[index]) : labels[index] || "";
    const edgeClass = index === 0 ? "edge-left" : index === points.length - 1 ? "edge-right" : "";
    appendChartLabel(layer, text, clamp(scaledX(point.x), 16, canvas.clientWidth - 16), scaledY(height - 14), `axis ${edgeClass}`.trim());
  });
}

function chartLabelIndexes(count, compact, mode = "") {
  if (count <= 0) return [];
  if (mode === "three" || compact || count > 8) {
    return [...new Set([0, Math.floor((count - 1) / 2), count - 1])];
  }
  return Array.from({ length: count }, (_, index) => index);
}

function renderBarDomLabels(canvas, bars, options, dimensions) {
  const layer = ensureChartLabelLayer(canvas);
  if (!layer) return;
  const { width, height, padding, compact, type = "bar" } = dimensions;
  const scale = chartPixelScales(canvas, width, height);
  const maxX = canvas.clientWidth - 20;
  const labelIndexes = new Set(chartLabelIndexes(bars.length, compact, options.xLabelMode));
  const valueIndexes = new Set(options.xLabelMode === "three" ? chartLabelIndexes(bars.length, compact, "three") : bars.map((_, index) => index));
  const shouldShowValues = !compact || bars.length <= 8 || options.xLabelMode === "three";
  const centerAxisLabels = type === "bar";

  bars.forEach((bar, index) => {
    const centerX = bar.centerX ?? (bar.x + bar.width / 2);
    const x = clamp(centerX * scale.x, 16, canvas.clientWidth - 16);
    const value = toNumber(bar.value);
    const isCount = options.colorMode === "count";

    if (value !== 0 && shouldShowValues && valueIndexes.has(index)) {
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

    if (labelIndexes.has(index)) {
      const text = compact ? compactChartLabel(bar.label) : String(bar.label).length > 10 ? `${String(bar.label).slice(0, 9)}...` : String(bar.label);
      const edgeClass = centerAxisLabels ? "" : index === 0 ? "edge-left" : index === bars.length - 1 ? "edge-right" : "";
      appendChartLabel(layer, text, x, (height - 30) * scale.y, `axis ${edgeClass}`.trim());
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
    setChartReadout(canvas.id, defaultBar.label, summary.lines, chartToneForValue(defaultBar.value, options));
  }
}

function installEquityHitZones(canvas, points) {
  const layer = ensureChartHitLayer(canvas);
  if (!layer) return;
  points.forEach((point) => {
    const size = 56;
    const zone = point.zone || {
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
    setChartReadout("equityChart", lastPoint.label, summary.lines, equityToneForPoint(lastPoint));
  }
}

function drawEquityChart(equity, period = "day", metric = "r") {
  const canvas = $("#equityChart");
  const context = canvas.getContext("2d");
  hideEquityTooltip();
  resetChartReadout("equityChart", metric === "balance" ? "Tap or drag the curve to see balance details." : "Tap or drag the curve to see period details.");
  const { width, height, dpr } = getCanvasDisplaySize(canvas, 320);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  const palette = chartPalette();

  context.fillStyle = palette.bg;
  context.fillRect(0, 0, width, height);

  const compact = isCompactChart(width);
  const padding = compact
    ? { top: 42, right: 52, bottom: 72, left: 44 }
    : { top: 38, right: 74, bottom: 62, left: 60 };
  const startingBalance = Math.max(toNumber(settings.startingBalance, 1000), 0);
  const chartData = [
    { label: "Start", value: metric === "balance" ? startingBalance : 0, periodR: 0, periodPl: 0, count: 0, key: "" },
    ...equity.map((point) => ({
      ...point,
      label: point.label || periodLabel(point.key, period)
    }))
  ];
  const values = chartData.map((point) => point.value);
  const labels = chartData.map((point) => point.label);

  if (values.length < 2) {
    equityChartState = { points: [], metric };
    clearChartHitLayer("equityChart");
    clearChartLabelLayer("equityChart");
    hideEquityTooltip();
    context.fillStyle = palette.text;
    context.font = "14px Segoe UI, sans-serif";
    context.fillText(metric === "balance" ? "No balance curve yet" : "No equity curve yet", padding.left, height / 2);
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

  points.forEach((point, index) => {
    const prev = points[index - 1];
    const next = points[index + 1];
    const slotLeft = index === 0 ? padding.left : (prev.x + point.x) / 2;
    const slotRight = index === points.length - 1 ? width - padding.right : (point.x + next.x) / 2;
    point.slotLeft = slotLeft;
    point.slotRight = slotRight;
    point.zone = {
      left: Math.max(slotLeft, 0),
      top: Math.max(padding.top - 20, 0),
      width: Math.max(slotRight - slotLeft, 44),
      height: chartHeight + padding.bottom + 18
    };
  });

  drawChartFrame(context, width, height, padding);

  context.save();
  context.globalAlpha = 0.62;
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartHeight * i) / 4;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }
  context.restore();

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.lineTo(points[points.length - 1].x, height - padding.bottom);
  context.lineTo(points[0].x, height - padding.bottom);
  context.closePath();
  context.fillStyle = palette.fill;
  context.fill();

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.strokeStyle = palette.teal;
  context.lineWidth = compact ? 4 : 3;
  context.stroke();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, compact ? 5 : 3, 0, Math.PI * 2);
    context.fillStyle = point.value >= 0 ? palette.teal : palette.red;
    context.fill();
  });

  equityChartState = { points, period, metric, width, height };
  renderEquityDomLabels(canvas, points, labels, { width, height, padding, yMax, yMin, compact, metric });
  installEquityHitZones(canvas, points);
}

function drawChartFrame(context, width, height, padding) {
  context.save();
  context.globalAlpha = 0.7;
  context.strokeStyle = chartPalette().grid;
  context.lineWidth = 1;
  context.strokeRect(padding.left, padding.top, width - padding.left - padding.right, height - padding.top - padding.bottom);
  context.restore();
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
  updatePeriodPlPeriodControls();
  const report = buildReportStats(sourceTrades);
  const periodData = cashSeriesForPeriod(sourceTrades, periodPlPeriod).map((item) => ({
    ...item,
    detail: `${item.count} ${item.count === 1 ? "order" : "orders"} in this ${periodPlPeriod}`
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

  drawCurveChart("periodPlChart", periodData, {
    formatter: (value) => currencyFormatter.format(value),
    empty: "No period P/L yet",
    valueLabel: "Net P/L",
    xLabelMode: "three",
    prompt: "Tap or drag the curve to see period P/L details."
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

function drawCurveChart(canvasId, data, options = {}) {
  const canvas = $(`#${canvasId}`);
  if (!canvas) return;
  hideBarChartTooltip();
  resetChartReadout(canvasId, options.prompt || "Tap or drag the curve to see chart details.");
  const context = canvas.getContext("2d");
  const { width, height, dpr } = getCanvasDisplaySize(canvas, 320);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  const palette = chartPalette();
  context.fillStyle = palette.bg;
  context.fillRect(0, 0, width, height);

  const cleanData = data.filter((item) => item && item.label);
  if (!cleanData.length || cleanData.every((item) => toNumber(item.value) === 0)) {
    barChartStates[canvasId] = { bars: [], options };
    clearChartHitLayer(canvasId);
    clearChartLabelLayer(canvasId);
    resetChartReadout(canvasId, options.empty || "No data yet");
    context.fillStyle = palette.text;
    context.font = "700 15px Segoe UI, sans-serif";
    context.fillText(options.empty || "No data yet", 18, height / 2);
    drawChartFrame(context, width, height, { top: 48, right: 40, bottom: 62, left: 48 });
    return;
  }

  const compact = isCompactChart(width);
  const padding = compact
    ? { top: 52, right: 46, bottom: 102, left: 46 }
    : { top: 48, right: 66, bottom: 82, left: 68 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = cleanData.map((item) => toNumber(item.value));
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(maxValue - minValue, 1);
  const yMin = minValue - range * 0.12;
  const yMax = maxValue + range * 0.12;
  const yRange = Math.max(yMax - yMin, 1);
  const xForIndex = (index) => cleanData.length === 1
    ? padding.left + chartWidth / 2
    : padding.left + (chartWidth * index) / (cleanData.length - 1);
  const yForValue = (value) => padding.top + chartHeight - ((value - yMin) / yRange) * chartHeight;
  const baseline = yForValue(0);

  drawChartFrame(context, width, height, padding);

  context.save();
  context.globalAlpha = 0.62;
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight * index) / 4;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }
  context.restore();

  context.beginPath();
  context.moveTo(padding.left, baseline);
  context.lineTo(width - padding.right, baseline);
  context.stroke();

  const points = cleanData.map((item, index) => ({
    x: xForIndex(index),
    y: yForValue(toNumber(item.value)),
    label: item.label,
    value: toNumber(item.value),
    count: item.count ?? 0,
    detail: item.detail || "",
    raw: item,
    index
  }));

  const curveSegments = [];
  const splitAtZero = (start, end) => {
    const ratio = (0 - start.value) / (end.value - start.value);
    return {
      x: start.x + (end.x - start.x) * ratio,
      y: baseline,
      value: 0,
      label: "",
      count: 0,
      detail: "",
      raw: null,
      index: start.index
    };
  };

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (start.value * end.value < 0) {
      const zeroPoint = splitAtZero(start, end);
      curveSegments.push({ start, end: zeroPoint, negative: start.value < 0 });
      curveSegments.push({ start: zeroPoint, end, negative: end.value < 0 });
    } else {
      curveSegments.push({ start, end, negative: start.value < 0 || end.value < 0 });
    }
  }

  curveSegments.forEach((segment) => {
    context.beginPath();
    context.moveTo(segment.start.x, baseline);
    context.lineTo(segment.start.x, segment.start.y);
    context.lineTo(segment.end.x, segment.end.y);
    context.lineTo(segment.end.x, baseline);
    context.closePath();
    context.fillStyle = segment.negative ? palette.redFill : palette.fill;
    context.fill();
  });

  context.lineWidth = compact ? 4 : 3;
  curveSegments.forEach((segment) => {
    context.beginPath();
    context.moveTo(segment.start.x, segment.start.y);
    context.lineTo(segment.end.x, segment.end.y);
    context.strokeStyle = segment.negative ? palette.red : palette.teal;
    context.stroke();
  });

  const bars = points.map((point, index) => {
    const prev = points[index - 1];
    const next = points[index + 1];
    const slotLeft = cleanData.length === 1
      ? padding.left
      : index === 0
        ? padding.left
        : (prev.x + point.x) / 2;
    const slotRight = cleanData.length === 1
      ? width - padding.right
      : index === points.length - 1
        ? width - padding.right
        : (point.x + next.x) / 2;
    return {
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      label: point.label,
      value: point.value,
      count: point.count,
      detail: point.detail,
      centerX: point.x,
      slotLeft,
      slotRight,
      baseline,
      zone: {
        left: Math.max(slotLeft, 0),
        top: Math.max(padding.top - 18, 0),
        width: Math.max(slotRight - slotLeft, 44),
        height: chartHeight + padding.bottom + 14
      },
      raw: point.raw
    };
  });

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, compact ? 5 : 4, 0, Math.PI * 2);
    context.fillStyle = point.value >= 0 ? palette.teal : palette.red;
    context.fill();
  });

  barChartStates[canvasId] = { bars, options, type: "curve" };
  renderBarDomLabels(canvas, bars, options, { width, height, padding, compact, type: "curve" });
  installBarHitZones(canvas, bars, options);
}

function drawBarChart(canvasId, data, options = {}) {
  const canvas = $(`#${canvasId}`);
  if (!canvas) return;
  hideBarChartTooltip();
  resetChartReadout(canvasId, options.prompt || "Tap a bar to see chart details.");
  const context = canvas.getContext("2d");
  const { width, height, dpr } = getCanvasDisplaySize(canvas, 320);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  const palette = chartPalette();
  context.fillStyle = palette.bg;
  context.fillRect(0, 0, width, height);

  const cleanData = data.filter((item) => item && item.label);
  if (!cleanData.length || cleanData.every((item) => toNumber(item.value) === 0)) {
    barChartStates[canvasId] = { bars: [], options };
    clearChartHitLayer(canvasId);
    clearChartLabelLayer(canvasId);
    resetChartReadout(canvasId, options.empty || "No data yet");
    context.fillStyle = palette.text;
    context.font = "700 15px Segoe UI, sans-serif";
    context.fillText(options.empty || "No data yet", 18, height / 2);
    drawChartFrame(context, width, height, { top: 48, right: 40, bottom: 62, left: 48 });
    return;
  }

  const compact = isCompactChart(width);
  const padding = compact
    ? { top: 56, right: 40, bottom: 104, left: 44 }
    : { top: 50, right: 60, bottom: 84, left: 68 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = cleanData.map((item) => toNumber(item.value));
  const rawMinValue = Math.min(0, ...values);
  const rawMaxValue = Math.max(0, ...values);
  const rawRange = Math.max(rawMaxValue - rawMinValue, 1);
  const minValue = rawMinValue - rawRange * 0.14;
  const maxValue = rawMaxValue + rawRange * 0.14;
  const range = Math.max(maxValue - minValue, 1);
  const baseline = padding.top + chartHeight - ((0 - minValue) / range) * chartHeight;
  const slotWidth = chartWidth / cleanData.length;
  const barWidth = Math.max(Math.min(slotWidth * 0.54, compact ? 54 : 68), Math.min(slotWidth * 0.7, 9));
  const bars = [];

  drawChartFrame(context, width, height, padding);

  context.save();
  context.globalAlpha = 0.62;
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight * index) / 4;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }
  context.restore();

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
    context.fillStyle = isCount ? palette.blue : value >= 0 ? palette.teal : palette.red;
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
      centerX: x + barWidth / 2,
      slotLeft,
      slotRight: slotLeft + slotWidth,
      baseline,
      raw: item
    });

    context.textAlign = "center";
  });

  context.textAlign = "left";
  barChartStates[canvasId] = { bars, options, type: "bar" };
  renderBarDomLabels(canvas, bars, options, { width, height, padding, compact, type: "bar" });
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
  const tone = chartToneForValue(bar.value, state.options);
  setChartReadout(canvas.id, bar.label, summary.lines, tone);

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
  setChartTone(tooltip, tone);
  positionFloatingTooltip(tooltip, clientX, clientY);
  tooltip.classList.add("visible");
  if (persist) scheduleTouchTooltipHide();
}

function findBarFromPoint(state, x, y) {
  const slotMatch = state.bars.find((item) => {
    if (!Number.isFinite(item.slotLeft) || !Number.isFinite(item.slotRight)) return false;
    const zone = item.zone;
    const yMin = zone ? zone.top : 0;
    const yMax = zone ? zone.top + zone.height : Number.POSITIVE_INFINITY;
    return x >= item.slotLeft && x <= item.slotRight && y >= yMin && y <= yMax;
  });
  if (slotMatch) return slotMatch;

  const rectMatch = state.bars.find((item) => {
    const left = Math.min(item.x, item.x + item.width) - 10;
    const right = Math.max(item.x, item.x + item.width) + 10;
    const top = Math.min(item.y, item.baseline ?? item.y) - 18;
    const bottom = Math.max(item.y + item.height, item.baseline ?? item.y) + 18;
    return x >= left && x <= right && y >= top && y <= bottom;
  });
  if (rectMatch) return rectMatch;

  return state.bars.reduce((best, item) => {
    const centerX = item.centerX ?? (item.x + item.width / 2);
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
  if (tooltip) {
    tooltip.classList.remove("visible");
    setChartTone(tooltip);
  }
}

function handleBarChartPointerLeave(event) {
  if (isTouchLikeEvent(event) || pointerStillInsideChart(event)) return;
  hideBarChartTooltip();
}

function equitySummary(point) {
  if (equityChartState.metric === "balance") {
    const periodPl = toNumber(point.periodPl);
    const conclusion =
      point.count === 0
        ? "Starting balance before recorded trades."
        : periodPl > 0
          ? "Balance grew during this period."
          : periodPl < 0
            ? "Balance declined during this period."
            : "Balance stayed flat during this period.";
    return {
      conclusion,
      lines: [
        `${point.count || 0} trades, ${currencyFormatter.format(periodPl)} this ${equityChartState.period}`,
        `Balance ${currencyFormatter.format(point.value)}`,
        conclusion
      ]
    };
  }

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
  const tone = equityToneForPoint(point);
  setChartReadout("equityChart", point.label, summary.lines, tone);

  if (!tooltip || isCoarseChartInput({ type: persist ? "touch" : "mouse", pointerType: persist ? "touch" : "mouse" })) {
    hideEquityTooltip();
    return;
  }

  tooltip.innerHTML = `
    <strong>${escapeHtml(point.label)}</strong>
    <p>${escapeHtml(summary.lines[0])}</p>
    <p>${escapeHtml(summary.lines[1])}. ${escapeHtml(summary.conclusion)}</p>
  `;
  setChartTone(tooltip, tone);
  positionChartTooltip(tooltip, canvas, point.x, point.y);
  tooltip.classList.add("visible");
  if (persist) scheduleTouchTooltipHide();
}

function findEquityPointFromPoint(state, x, y) {
  const slotMatch = state.points.find((point) => {
    if (!Number.isFinite(point.slotLeft) || !Number.isFinite(point.slotRight)) return false;
    const zone = point.zone;
    const yMin = zone ? zone.top : 0;
    const yMax = zone ? zone.top + zone.height : Number.POSITIVE_INFINITY;
    return x >= point.slotLeft && x <= point.slotRight && y >= yMin && y <= yMax;
  });
  if (slotMatch) return slotMatch;

  return state.points.reduce((best, point) => {
    const distance = Math.abs(point.x - x);
    return distance < best.distance ? { point, distance } : best;
  }, { point: null, distance: Infinity }).point;
}

function handleEquityPointerMove(event) {
  const canvas = $("#equityChart");
  if (!canvas || !equityChartState.points.length) return;

  const eventPoint = eventClientPoint(event);
  if (!Number.isFinite(eventPoint.clientX) || !Number.isFinite(eventPoint.clientY)) return;
  const rect = canvas.getBoundingClientRect();
  const x = eventPoint.clientX - rect.left;
  const y = eventPoint.clientY - rect.top;
  const nearest = findEquityPointFromPoint(equityChartState, x, y);

  const touchLike = isTouchLikeEvent(event);
  if (!nearest) {
    if (!touchLike) hideEquityTooltip();
    return;
  }

  showEquityDetail(nearest, eventPoint.clientX, eventPoint.clientY, touchLike);
}

function hideEquityTooltip() {
  const tooltip = $("#equityTooltip");
  if (tooltip) {
    tooltip.classList.remove("visible");
    setChartTone(tooltip);
  }
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
      const color = item.netR >= 0 ? cssVar("--teal", "#0f766e") : cssVar("--red", "#be123c");
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
      const color = item.netPl >= 0 ? cssVar("--teal", "#0f766e") : cssVar("--red", "#be123c");
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
    container.classList.add("compact-profile-grid");
    container.innerHTML = `
      <article class="profile-item profile-primary"><strong>Setup</strong><p>No profile yet</p><small>Record at least two trades to build a best profile.</small></article>
      <article class="profile-item profile-metric"><strong>Sample</strong><p>0 trades</p></article>
      <article class="profile-item profile-metric"><strong>Average</strong><p>0.00R</p></article>
      <article class="profile-item profile-metric"><strong>Discipline</strong><p>0%</p></article>
    `;
    return;
  }

  const [setup, pair, session] = profile.name.split(" | ");
  container.dataset.setup = setup || "";
  container.dataset.pair = pair || "";
  container.dataset.session = session || "";
  container.classList.add("compact-profile-grid");
  container.innerHTML = `
    <article class="profile-item profile-primary">
      <strong>Setup</strong>
      <p>${escapeHtml(setup || profile.name)}</p>
      <small>${escapeHtml(pair || "Any pair")} · ${escapeHtml(session || "Any session")}</small>
    </article>
    <article class="profile-item profile-metric"><strong>Average</strong><p>${formatR(profile.avgR)}</p></article>
    <article class="profile-item profile-metric"><strong>Sample</strong><p>${profile.count} trades</p></article>
    <article class="profile-item profile-metric"><strong>Discipline</strong><p>${formatPercent(profile.discipline)}</p></article>
  `;
}

function setupTypeMeta(type) {
  return setupTypeBlueprints[type] || setupTypeBlueprints["Custom / Other"];
}

function averageScore(items, key, fallback = 0) {
  return items.length ? sum(items, (trade) => scoreValue(trade, key, fallback)) / items.length : 0;
}

function setupProfileStatus(profile) {
  if (!profile.count) return { label: "No sample", tone: "neutral" };
  if (profile.count < 5) return { label: "Needs sample", tone: "sample" };
  if (profile.avgR > 0 && profile.discipline >= 70 && profile.setupScore >= 70) return { label: "Proven edge", tone: "edge" };
  if (profile.avgR > 0) return { label: "Promising", tone: "sample" };
  if (profile.discipline < 60 || profile.mistakeCost < 0) return { label: "Rule leak", tone: "leak" };
  return { label: "Needs refinement", tone: "neutral" };
}

function setupProfileFromTrades(setup, items = []) {
  const name = String(setup || "Unknown Setup").trim() || "Unknown Setup";
  const wins = items.filter((trade) => toNumber(trade.resultR) > 0);
  const losses = items.filter((trade) => toNumber(trade.resultR) < 0);
  const resolved = wins.length + losses.length;
  const netR = sum(items, (trade) => toNumber(trade.resultR));
  const mistakes = items.flatMap((trade) => tradeTagsForReview(trade, "mistake"));
  const setupType = topFrequencyValue(items.map((trade) => trade.setupType || setupTypeForSetup(name)))?.name || setupTypeForSetup(name);
  const profile = {
    name,
    setupType,
    count: items.length,
    netR,
    avgR: items.length ? netR / items.length : 0,
    winRate: resolved ? (wins.length / resolved) * 100 : 0,
    discipline: averageScore(items, "discipline", 70),
    confidence: averageScore(items, "confidence", 60),
    setupScore: averageScore(items, "setupScore", 70),
    mistakeCost: sum(items.filter((trade) => trade.mistake && trade.mistake !== "None"), tradePl),
    topMistake: topFrequencyValue(mistakes)?.name || "None",
    topPair: topFrequencyValue(items.map((trade) => trade.pair))?.name || "Any",
    topSession: topFrequencyValue(items.map((trade) => trade.session))?.name || "Any"
  };
  profile.status = setupProfileStatus(profile);
  return profile;
}

function setupProfileStats(list = trades) {
  return Object.entries(groupBy(list.filter((trade) => String(trade.setup || "").trim()), (trade) => trade.setup))
    .map(([setup, items]) => setupProfileFromTrades(setup, items))
    .sort((a, b) => b.count - a.count || b.avgR - a.avgR || a.name.localeCompare(b.name));
}

function existingStrategyForSetup(setup) {
  const normalized = String(setup || "").trim().toLowerCase();
  if (!normalized) return null;
  return strategies.find((strategy) => String(strategy.linkedSetup || strategy.name || "").trim().toLowerCase() === normalized) || null;
}

function strategyDraftForSetupProfile(profile) {
  const setup = String(profile?.name || "").trim();
  const setupType = profile?.setupType || setupTypeForSetup(setup);
  const meta = setupTypeMeta(setupType);
  const existing = existingStrategyForSetup(setup);
  const conditionParts = [
    meta.description,
    profile?.count ? `${profile.topPair} / ${profile.topSession} has ${profile.count} recorded samples.` : "Add samples before trusting this setup."
  ];

  return {
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    linkedSetup: setup,
    setupType,
    name: existing?.name || `${setup} Playbook`,
    market: existing?.market || conditionParts.join(" "),
    trigger: existing?.trigger || meta.valid.join("; "),
    invalidation: existing?.invalidation || meta.invalid.join("; "),
    riskRule: existing?.riskRule || "Setup score 70+, confidence 60+, no-trade filters clear, SL beyond invalidation, and target R:R at least 1:1.5.",
    management: existing?.management || "Manage toward the next structure or liquidity target. Do not move SL emotionally.",
    reviewRule: existing?.reviewRule || `After every ${setup} trade, review setup score, confidence, discipline, mistake tag, and whether the setup followed ${setupType}.`,
    sampleSize: profile?.count || 0,
    winRate: roundNumber(profile?.winRate || 0, 2),
    avgR: roundNumber(profile?.avgR || 0, 2),
    netR: roundNumber(profile?.netR || 0, 2),
    avgDiscipline: roundNumber(profile?.discipline || 0, 2),
    avgConfidence: roundNumber(profile?.confidence || 0, 2),
    avgSetupScore: roundNumber(profile?.setupScore || 0, 2),
    mistakeCost: roundNumber(profile?.mistakeCost || 0, 2),
    profileStatus: profile?.status?.label || "No sample",
    updatedAt: new Date().toISOString()
  };
}

function setupProfileMatchesFilters(profile) {
  const query = setupPlaybookSearch.trim().toLowerCase();
  const haystack = [
    profile.name,
    profile.setupType,
    profile.status.label,
    profile.topMistake,
    profile.topPair,
    profile.topSession
  ].join(" ").toLowerCase();
  const matchesSearch = !query || haystack.includes(query);
  const matchesStatus = setupPlaybookStatus === "all" || profile.status.label === setupPlaybookStatus;
  const matchesType = setupPlaybookType === "all" || profile.setupType === setupPlaybookType;
  return matchesSearch && matchesStatus && matchesType;
}

function renderSetupPlaybook() {
  const container = $("#setupPlaybookList");
  if (!container) return;
  const allProfiles = setupProfileStats();
  const profiles = allProfiles.filter(setupProfileMatchesFilters);
  if (!allProfiles.length) {
    container.innerHTML = '<div class="empty-state visible">Record trades to build setup profiles.</div>';
    return;
  }
  if (!profiles.length) {
    container.innerHTML = '<div class="empty-state visible">No setup profiles match these filters.</div>';
    return;
  }

  container.innerHTML = profiles
    .map((profile) => {
      const linked = Boolean(existingStrategyForSetup(profile.name));
      return `
        <article class="setup-profile-card">
          <header>
            <div>
              <strong>${escapeHtml(profile.name)}</strong>
              <p>${escapeHtml(profile.setupType)}</p>
            </div>
            <span class="status-pill setup-status ${escapeHtml(profile.status.tone)}">${escapeHtml(profile.status.label)}</span>
          </header>
          <div class="setup-profile-stats">
            <span><small>Sample</small><strong>${profile.count}</strong></span>
            <span><small>Net R</small><strong>${formatR(profile.netR)}</strong></span>
            <span><small>Win</small><strong>${formatPercent(profile.winRate)}</strong></span>
            <span><small>Avg R</small><strong>${formatR(profile.avgR)}</strong></span>
            <span><small>Discipline</small><strong>${formatPercent(profile.discipline)}</strong></span>
            <span><small>Confidence</small><strong>${formatPercent(profile.confidence)}</strong></span>
          </div>
          <p class="setup-profile-note">Mistake cost ${currencyFormatter.format(profile.mistakeCost)}. Main leak: ${escapeHtml(profile.topMistake)}.</p>
          <button class="tool-button compact" type="button" data-setup-action="strategy" data-setup="${escapeHtml(profile.name)}">
            ${linked ? "Update Strategy" : "Create Strategy"}
          </button>
        </article>
      `;
    })
    .join("");
}

function strategyQualityTier(strategy) {
  const score = qualityScore(strategy);
  if (score >= 85) return "complete";
  if (score >= 65) return "solid";
  return "draft";
}

function strategyMatchesFilters(strategy) {
  const query = strategySearch.trim().toLowerCase();
  const haystack = [
    strategy.name,
    strategy.linkedSetup,
    strategy.setupType,
    strategy.market,
    strategy.trigger,
    strategy.invalidation,
    strategy.riskRule,
    strategy.management,
    strategy.reviewRule,
    strategy.profileStatus
  ].join(" ").toLowerCase();
  const matchesSearch = !query || haystack.includes(query);
  const matchesQuality = strategyQuality === "all"
    || strategyQualityTier(strategy) === strategyQuality
    || (strategyQuality === "linked" && Boolean(strategy.linkedSetup));
  const matchesType = strategySetupType === "all" || (strategy.setupType || "Custom / Other") === strategySetupType;
  return matchesSearch && matchesQuality && matchesType;
}

function renderStrategies() {
  renderSetupPlaybook();
  const container = $("#strategyList");
  if (!strategies.length) {
    container.innerHTML = '<div class="empty-state visible">No strategies saved.</div>';
    return;
  }

  const visibleStrategies = strategies.filter(strategyMatchesFilters);
  if (!visibleStrategies.length) {
    container.innerHTML = '<div class="empty-state visible">No saved strategies match these filters.</div>';
    return;
  }

  container.innerHTML = visibleStrategies
    .map((strategy) => {
      const score = qualityScore(strategy);
      return `
        <article class="strategy-item">
          <header>
            <div>
              <strong>${escapeHtml(strategy.name)}</strong>
              <p>${escapeHtml(strategy.linkedSetup || "Manual strategy")} · ${escapeHtml(strategy.setupType || "Custom / Other")}</p>
            </div>
            <div class="strategy-actions">
              ${strategy.linkedSetup ? `<button class="mini-button text-mini sync-button" title="Update from setup profile" aria-label="Update from setup profile" data-strategy-action="refresh" data-id="${strategy.id}">Sync</button>` : ""}
              <button class="mini-button" title="Edit strategy" aria-label="Edit strategy" data-strategy-action="edit" data-id="${strategy.id}">${iconMarkup("edit")}</button>
              <button class="mini-button danger" title="Delete strategy" aria-label="Delete strategy" data-strategy-action="delete" data-id="${strategy.id}">${iconMarkup("trash")}</button>
            </div>
          </header>
          <div class="quality-meter">
            <span>Rule quality ${score}%</span>
            <div class="quality-bar"><div class="quality-fill" style="width:${score}%"></div></div>
          </div>
          <div class="strategy-stat-row">
            <span>${Number(strategy.sampleSize || 0)} samples</span>
            <span>${formatR(toNumber(strategy.avgR))} avg</span>
            <span>${formatPercent(toNumber(strategy.avgDiscipline))} discipline</span>
          </div>
          <p class="strategy-market">${escapeHtml(strategy.market || "Market condition not set")}</p>
          <p><strong>Trigger</strong> ${escapeHtml(strategy.trigger || "No trigger")}</p>
          <p><strong>Risk</strong> ${escapeHtml(strategy.riskRule || "No risk rule")}</p>
        </article>
      `;
    })
    .join("");
}

function createOrUpdateStrategyFromSetup(setup) {
  if (!String(setup || "").trim()) {
    showToast("Select a setup before creating a strategy.");
    return;
  }
  const profile = setupProfileFromTrades(setup, trades.filter((trade) => String(trade.setup || "").trim() === setup));
  const draft = strategyDraftForSetupProfile(profile);
  const index = strategies.findIndex((strategy) => strategy.id === draft.id || String(strategy.linkedSetup || "").toLowerCase() === setup.toLowerCase());
  if (index >= 0) strategies[index] = draft;
  else strategies.push(draft);
  saveStrategies();
  fillStrategyForm(draft);
  renderStrategies();
  showToast(`${setup} strategy ${index >= 0 ? "updated" : "created"}.`);
}

function openCurrentSetupInStrategyBuilder() {
  const form = $("#tradeForm");
  const setup = String(form?.elements.setup.value || "").trim();
  if (!setup) {
    showToast("Select a setup before opening Strategy Lab.");
    return;
  }
  const profile = setupProfileFromTrades(setup, trades.filter((trade) => String(trade.setup || "").trim() === setup));
  const draft = strategyDraftForSetupProfile(profile);
  document.querySelector('[data-view="strategy"]')?.click();
  fillStrategyForm(draft);
  closeTradeTicketModal();
  showToast(`${setup} loaded into Strategy Builder.`);
}

function readTradeForm() {
  const form = $("#tradeForm");
  const data = new FormData(form);
  const direction = data.get("direction");
  const scoreChecks = scoreChecksFromForm();
  const scores = calculateScoreEngine(scoreChecks, data.get("mistake"));
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
    setupType: String(data.get("setupType") || "").trim(),
    setupScore: scores.setup,
    scoreChecks,
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
    positive: data.get("positive") || "None",
    positiveTags: data.get("positive") && data.get("positive") !== "None" ? [data.get("positive")] : [],
    mistake: data.get("mistake"),
    confidence: scores.confidence,
    discipline: scores.discipline,
    tags: String(data.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: String(data.get("notes") || "").trim()
  };
}

function scrollTradeTicketIntoView() {
  openTradeTicketModal();
}

function fillTradeForm(trade) {
  const normalizedTrade = normalizeTradeReviewFields(trade);
  const form = $("#tradeForm");
  ensurePairAvailable(normalizedTrade.pair, normalizedTrade.contractSize);
  renderPairOptions(normalizedTrade.pair);
  renderTradeChoiceOptions({
    setup: normalizedTrade.setup || "",
    setupType: normalizedTrade.setupType || "",
    positive: normalizedTrade.positive || normalizedTrade.positiveTags?.[0] || "None",
    mistake: normalizedTrade.mistake || "None"
  });
  form.elements.id.value = normalizedTrade.id;
  form.elements.date.value = normalizedTrade.date;
  form.elements.openTime.value = tradeOpenTime(normalizedTrade);
  form.elements.pair.value = normalizePair(normalizedTrade.pair);
  if (!form.elements.pair.value) form.elements.pair.value = defaultPair;
  syncPairTicket(form.elements.pair.value);
  const inferredSession = normalizedTrade.session || inferSessionFromTradeDateTime(normalizedTrade.date, tradeOpenTime(normalizedTrade));
  form.elements.session.value = inferredSession;
  form.elements.session.dataset.auto = normalizedTrade.sessionAuto || (!normalizedTrade.session && inferredSession) ? "true" : "";
  form.elements.setup.value = normalizedTrade.setup || "";
  form.elements.setupType.value = normalizedTrade.setupType || setupTypeForSetup(normalizedTrade.setup);
  form.elements.setupScore.value = normalizeScorePercent(normalizedTrade.setupScore, 70);
  form.elements.entry.value = normalizedTrade.entry ?? "";
  form.elements.stop.value = normalizedTrade.stop ?? "";
  form.elements.target.value = normalizedTrade.target ?? "";
  form.elements.exit.value = normalizedTrade.exit ?? "";
  form.elements.lotSize.value = normalizedTrade.lotSize ?? "";
  form.elements.contractSize.value = defaultContractSize(form.elements.pair.value);
  form.elements.quoteToAccount.value = normalizedTrade.quoteToAccount ?? "";
  form.elements.manualR.value = normalizedTrade.manualR ?? "";
  form.elements.commissionPerLot.value = normalizedTrade.commissionPerLot ?? settings.commissionPerLot;
  form.elements.commission.dataset.manual = normalizedTrade.commission === undefined ? "" : "true";
  form.elements.commission.value = normalizedTrade.commission ?? "";
  form.elements.swap.value = normalizedTrade.swap ?? "";
  form.elements.positive.value = normalizedTrade.positive || normalizedTrade.positiveTags?.[0] || "None";
  form.elements.mistake.value = normalizedTrade.mistake || "None";
  form.elements.confidence.value = normalizeScorePercent(normalizedTrade.confidence, 60);
  form.elements.discipline.value = normalizeScorePercent(normalizedTrade.discipline, 70);
  setScoreChecks(normalizedTrade.scoreChecks);
  form.elements.tags.value = (normalizedTrade.tags || []).join(", ");
  form.elements.notes.value = normalizedTrade.notes || "";
  setSegment("direction", normalizedTrade.direction || "Buy");
  applyScoreEngine();
  updateTradePreview();
  $("#saveTradeBtn").innerHTML = `${iconMarkup("save")} Update Trade`;
}

function resetTradeForm() {
  const form = $("#tradeForm");
  pendingMt5OrderId = "";
  form.reset();
  renderTradeChoiceOptions({
    setup: "",
    setupType: "Custom / Other",
    positive: "None",
    mistake: "None"
  });
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
  form.elements.setupScore.value = 70;
  form.elements.positive.value = "None";
  form.elements.mistake.value = "None";
  form.elements.confidence.value = 60;
  form.elements.discipline.value = 70;
  setScoreChecks(defaultScoreChecks());
  setSegment("direction", "Buy");
  applyScoreEngine();
  updateTradePreview();
  $("#saveTradeBtn").innerHTML = `${iconMarkup("save")} Save Trade`;
}

function readStrategyForm() {
  const form = $("#strategyForm");
  const data = new FormData(form);
  return {
    id: data.get("id") || crypto.randomUUID(),
    name: String(data.get("name") || "").trim(),
    linkedSetup: String(data.get("linkedSetup") || "").trim(),
    setupType: String(data.get("setupType") || "").trim() || "Custom / Other",
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
  renderStrategySetupTypeOptions(strategy.setupType || "Custom / Other");
  Object.entries(strategy).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
}

function resetStrategyForm() {
  $("#strategyForm").reset();
  $("#strategyForm").elements.id.value = "";
  renderStrategySetupTypeOptions("Custom / Other");
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
  $("#setupScoreOut").textContent = $("#tradeForm").elements.setupScore.value;
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

function tradeCsvContent(list) {
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
    "setupType",
    "setupScore",
    "scoreChecks",
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
    "positive",
    "positiveTags",
    "mistake",
    "confidence",
    "discipline",
    "tags",
    "notes"
  ];
  const rows = list.map((trade) =>
    headers
      .map((header) => {
        const rawValue = trade[header];
        const value = Array.isArray(rawValue) ? rawValue.join("; ") : rawValue && typeof rawValue === "object" ? JSON.stringify(rawValue) : rawValue ?? "";
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function exportJsonBackup() {
  const content = JSON.stringify({
    profileName: activeAccount?.name || "FX Edge Journal",
    trades,
    strategies,
    customPairs,
    settings,
    dailyReviewEvidence: dailyEvidenceStore(),
    exportedAt: new Date().toISOString()
  }, null, 2);
  downloadFile("fx-edge-journal.json", content, "application/json");
  showToast("Backup JSON exported.");
}

function exportCsv() {
  downloadFile("fx-trades.csv", tradeCsvContent(trades), "text/csv");
}

function exportFilteredCsv() {
  const list = filteredTrades();
  if (!list.length) {
    showToast("No trades match the current filters.");
    return;
  }

  const start = $("#historyStartFilter")?.value || "all";
  const end = $("#historyEndFilter")?.value || "all";
  const filename = `fx-trades-view-${start}-to-${end}.csv`.replace(/[^a-z0-9._-]+/gi, "-");
  downloadFile(filename, tradeCsvContent(list), "text/csv");
  showToast(`Exported ${list.length} filtered ${list.length === 1 ? "trade" : "trades"}.`);
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
        const importedSettings = { ...parsed.settings };
        const importedEvidence = importedSettings.dailyReviewEvidence || parsed.dailyReviewEvidence;
        delete importedSettings.dailyReviewEvidence;
        Object.assign(settings, importedSettings);
        normalizeSettingsLists();
        saveSettings();
        if (importedEvidence) saveDailyEvidenceStore(mergeDailyEvidenceStores(dailyEvidenceStore(), importedEvidence));
      }
      if (parsed.dailyReviewEvidence && !parsed.settings?.dailyReviewEvidence) {
        saveDailyEvidenceStore(mergeDailyEvidenceStores(dailyEvidenceStore(), parsed.dailyReviewEvidence));
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
      if (activeAccount && parsed.profileName) {
        activeAccount.name = cleanAccountName(parsed.profileName) || activeAccount.name;
        const storedAccount = accountById(activeAccount.id);
        if (storedAccount) storedAccount.name = activeAccount.name;
        saveAccounts();
      }
      saveTrades();
      saveStrategies();
      renderPairOptions(defaultPair);
      renderMarketChartOptions(marketChartPair);
      render();
      syncAccountUi();
      if (isActiveCloudProfile()) queueCloudSave("import");
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
    save: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM7 21v-8h10v8M7 3v5h8"/></svg>',
    cloud: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    refresh: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 0 15 6.7M21 20v-6h-6M21 12A9 9 0 0 0 6 5.3M3 4v6h6"/></svg>'
  };
  return icons[name] || "";
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function mt5AppLaunchTarget() {
  const userAgent = navigator.userAgent || "";
  if (/Windows/i.test(userAgent)) return "fxedge-mt5://open";
  if (/Android/i.test(userAgent)) {
    return "intent://open#Intent;scheme=metatrader5;package=net.metaquotes.metatrader5;end";
  }
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "metatrader5://";
  return "metatrader5://";
}

function mt5DesktopSetupCommand() {
  return 'windows\\install-fxedge-mt5-protocol.bat';
}

function isMt5DesktopProtocolInstalled() {
  return localStorage.getItem(storageKeys.mt5DesktopProtocolInstalled) === "true";
}

function setMt5DesktopProtocolInstalled(installed) {
  localStorage.setItem(storageKeys.mt5DesktopProtocolInstalled, installed ? "true" : "false");
}

function populateMt5DesktopSetupModal() {
  const command = $("#mt5DesktopSetupCommand");
  if (command) command.value = mt5DesktopSetupCommand();
}

function openMt5DesktopSetup() {
  populateMt5DesktopSetupModal();
  const modal = $("#mt5DesktopSetupModal");
  if (!modal) return;
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeMt5DesktopSetup() {
  $("#mt5DesktopSetupModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function markMt5DesktopSetupInstalled() {
  setMt5DesktopProtocolInstalled(true);
  closeMt5DesktopSetup();
  showToast("MT5 desktop setup marked installed. Click the MT5 icon again to open MT5.");
}

function copyMt5DesktopSetupCommand() {
  const command = mt5DesktopSetupCommand();
  navigator.clipboard?.writeText(command)
    .then(() => showToast("MT5 desktop setup command copied."))
    .catch(() => {
      const field = $("#mt5DesktopSetupCommand");
      field?.select();
      showToast("Copy blocked. Select and copy the command manually.");
    });
}

function openMt5Application(event) {
  event.preventDefault();
  const launchUrl = mt5AppLaunchTarget();
  const userAgent = navigator.userAgent || "";
  if (/Windows/i.test(userAgent)) {
    if (!isMt5DesktopProtocolInstalled()) {
      openMt5DesktopSetup();
      return;
    }
    showToast("Opening MT5 desktop. If nothing happens, run the FX Edge MT5 protocol setup once.");
  } else {
    showToast("Opening MetaTrader 5.");
  }
  window.location.href = launchUrl;
}

function bindEvents() {
  const manageProfileButton = $("#manageProfileBtn");
  if (manageProfileButton) manageProfileButton.addEventListener("click", openProfileManagement);

  const logoutAccountButton = $("#logoutAccountBtn");
  if (logoutAccountButton) logoutAccountButton.addEventListener("click", handleAccountLogout);

  const closeProfileButton = $("#closeProfileManagementBtn");
  if (closeProfileButton) closeProfileButton.addEventListener("click", closeProfileManagement);

  const profileModal = $("#profileManagementModal");
  if (profileModal) {
    profileModal.addEventListener("click", (event) => {
      if (event.target === profileModal) closeProfileManagement();
    });
  }

  const profileNameForm = $("#profileNameForm");
  if (profileNameForm) profileNameForm.addEventListener("submit", handleProfileNameSubmit);

  const profileSyncButton = $("#profileSyncNowBtn");
  if (profileSyncButton) profileSyncButton.addEventListener("click", syncProfileNow);

  const profileOpenCloudButton = $("#profileOpenCloudBtn");
  if (profileOpenCloudButton) profileOpenCloudButton.addEventListener("click", handleProfileOpenCloudClick);

  const profileMigrateButton = $("#profileMigrateBtn");
  if (profileMigrateButton) {
    profileMigrateButton.addEventListener("click", () => {
      showToast("Checking cloud target before transfer...");
      migrateActiveAccountToCloud();
    });
  }

  const profileExportJsonButton = $("#profileExportJsonBtn");
  if (profileExportJsonButton) profileExportJsonButton.addEventListener("click", exportJsonBackup);

  const profileImportJsonButton = $("#profileImportJsonBtn");
  if (profileImportJsonButton) {
    profileImportJsonButton.addEventListener("click", () => {
      showToast("Choose a JSON backup file to import.");
      $("#importFile")?.click();
    });
  }

  const profileExportCsvButton = $("#profileExportCsvBtn");
  if (profileExportCsvButton) profileExportCsvButton.addEventListener("click", exportFilteredCsv);

  const profileSignOutButton = $("#profileSignOutBtn");
  if (profileSignOutButton) {
    profileSignOutButton.addEventListener("click", async () => {
      await handleAccountLogout();
      closeProfileManagement();
    });
  }

  const refreshBridgeTokensButton = $("#refreshBridgeTokensBtn");
  if (refreshBridgeTokensButton) refreshBridgeTokensButton.addEventListener("click", () => fetchMt5BridgeTokens());

  const bridgeTokenList = $("#bridgeTokenList");
  if (bridgeTokenList) {
    bridgeTokenList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-token-action]");
      if (!button) return;
      if (button.dataset.tokenAction === "revoke") revokeMt5BridgeToken(button.dataset.id);
    });
  }

  const closeAuthButton = $("#closeAuthBtn");
  if (closeAuthButton) closeAuthButton.addEventListener("click", hideAuthOverlay);

  const closeLoginPageButton = $("#closeLoginPageBtn");
  if (closeLoginPageButton) closeLoginPageButton.addEventListener("click", closeLoginPage);

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

  const googleSignInButton = $("#googleSignInBtn");
  if (googleSignInButton) googleSignInButton.addEventListener("click", handleCloudGoogleSignIn);

  const pageLoginForm = $("#pageLoginForm");
  if (pageLoginForm) pageLoginForm.addEventListener("submit", handleLogin);

  const pageCreateAccountForm = $("#pageCreateAccountForm");
  if (pageCreateAccountForm) pageCreateAccountForm.addEventListener("submit", handleCreateAccount);

  const loginCloudAuthForm = $("#loginCloudAuthForm");
  if (loginCloudAuthForm) loginCloudAuthForm.addEventListener("submit", handleCloudSignIn);

  const loginCloudCreateForm = $("#loginCloudCreateForm");
  if (loginCloudCreateForm) loginCloudCreateForm.addEventListener("submit", handleCloudSignUp);

  const showCloudCreateButton = $("#showCloudCreateBtn");
  if (showCloudCreateButton) {
    showCloudCreateButton.addEventListener("click", () => {
      const panel = $("#cloudCreatePanel");
      if (!panel) return;
      panel.classList.remove("hidden");
      panel.querySelector("input")?.focus();
    });
  }

  const hideCloudCreateButton = $("#hideCloudCreateBtn");
  if (hideCloudCreateButton) {
    hideCloudCreateButton.addEventListener("click", () => {
      const panel = $("#cloudCreatePanel");
      panel?.classList.add("hidden");
      $("#loginCloudCreateForm")?.reset();
    });
  }

  const loginGoogleSignInButton = $("#loginGoogleSignInBtn");
  if (loginGoogleSignInButton) loginGoogleSignInButton.addEventListener("click", handleCloudGoogleSignIn);

  const showLocalCreateButton = $("#showLocalCreateBtn");
  if (showLocalCreateButton) {
    showLocalCreateButton.addEventListener("click", () => {
      const form = $("#pageCreateAccountForm");
      if (!form) return;
      form.classList.remove("hidden");
      form.elements.name?.focus();
    });
  }

  const hideLocalCreateButton = $("#hideLocalCreateBtn");
  if (hideLocalCreateButton) {
    hideLocalCreateButton.addEventListener("click", () => {
      const form = $("#pageCreateAccountForm");
      form?.reset();
      form?.classList.add("hidden");
    });
  }

  $$('input[name="keepSignedIn"]').forEach((keepSignedInControl) => {
    keepSignedInControl.addEventListener("change", () => {
      keepSignedInControl.dataset.touched = "true";
    });
  });

  const openCloudAuthButton = $("#openCloudAuthBtn");
  if (openCloudAuthButton) {
    openCloudAuthButton.addEventListener("click", () => {
      if (cloudUser || isCloudAccount(activeAccount)) {
        openProfileManagement();
        return;
      }
      showAuthOverlay("cloud", false);
    });
  }

  const cloudManageProfileButton = $("#cloudManageProfileBtn");
  if (cloudManageProfileButton) cloudManageProfileButton.addEventListener("click", openProfileManagement);

  const openMt5AppLink = $("#openMt5AppLink");
  if (openMt5AppLink) openMt5AppLink.addEventListener("click", openMt5Application);

  const openMt5DesktopSetupButton = $("#openMt5DesktopSetupBtn");
  if (openMt5DesktopSetupButton) openMt5DesktopSetupButton.addEventListener("click", openMt5DesktopSetup);

  const closeMt5DesktopSetupButton = $("#closeMt5DesktopSetupBtn");
  if (closeMt5DesktopSetupButton) closeMt5DesktopSetupButton.addEventListener("click", closeMt5DesktopSetup);

  const mt5DesktopSetupModal = $("#mt5DesktopSetupModal");
  if (mt5DesktopSetupModal) {
    mt5DesktopSetupModal.addEventListener("click", (event) => {
      if (event.target === mt5DesktopSetupModal) closeMt5DesktopSetup();
    });
  }

  const copyMt5DesktopSetupCommandButton = $("#copyMt5DesktopSetupCommandBtn");
  if (copyMt5DesktopSetupCommandButton) copyMt5DesktopSetupCommandButton.addEventListener("click", copyMt5DesktopSetupCommand);

  const mt5DesktopSetupInstalledButton = $("#mt5DesktopSetupInstalledBtn");
  if (mt5DesktopSetupInstalledButton) mt5DesktopSetupInstalledButton.addEventListener("click", markMt5DesktopSetupInstalled);

  const themeSelect = $("#themeSelect");
  if (themeSelect) {
    themeSelect.addEventListener("change", (event) => {
      settings.themeMode = ["light", "dark", "system"].includes(event.target.value) ? event.target.value : "system";
      applyThemePreference();
      saveSettings();
      rerenderAnalyticsSoon(80);
    });
  }
  if (systemThemeMedia) {
    const handleSystemThemeChange = () => {
      if ((settings.themeMode || "system") === "system") {
        applyThemePreference();
        rerenderAnalyticsSoon(80);
      }
    };
    if (systemThemeMedia.addEventListener) systemThemeMedia.addEventListener("change", handleSystemThemeChange);
    else if (systemThemeMedia.addListener) systemThemeMedia.addListener(handleSystemThemeChange);
  }

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

  const ignoreRecordedMt5OrdersButton = $("#ignoreRecordedMt5OrdersBtn");
  if (ignoreRecordedMt5OrdersButton) ignoreRecordedMt5OrdersButton.addEventListener("click", ignoreAlreadyRecordedMt5Orders);

  const ignoreAllMt5OrdersButton = $("#ignoreAllMt5OrdersBtn");
  if (ignoreAllMt5OrdersButton) ignoreAllMt5OrdersButton.addEventListener("click", ignoreVisibleMt5Orders);

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

  const tradeTicketModal = $("#tradeTicketModal");
  if (tradeTicketModal) {
    tradeTicketModal.addEventListener("pointerdown", (event) => {
      if (event.target === tradeTicketModal) closeTradeTicketModal();
    });
  }
  const closeTradeTicketButton = $("#closeTradeTicketBtn");
  if (closeTradeTicketButton) closeTradeTicketButton.addEventListener("click", closeTradeTicketModal);
  const newTradeButton = $("#newTradeBtn");
  if (newTradeButton) newTradeButton.addEventListener("click", openNewTradeTicket);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!$("#tradeTicketModal")?.classList.contains("hidden")) {
      closeTradeTicketModal();
      return;
    }
    if (document.body.dataset.authPage === "true" && activeAccount && document.body.dataset.authRequired !== "true") {
      closeLoginPage();
    }
  });

  $$(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      if (!activeAccount) {
        showLoginPage("cloud", true);
        return;
      }
      $$(".nav-tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      $$(".view").forEach((view) => view.classList.remove("active"));
      $(`#${button.dataset.view}View`).classList.add("active");
      $("#viewTitle").textContent = button.textContent.trim();
      render();
      if (button.dataset.view === "analytics") rerenderAnalyticsSoon(60);
      scrollMobileNavigationTarget(button.dataset.view);
      window.setTimeout(saveAppScrollPosition, 120);
    });
  });

  $$(".segmented").forEach((root) => {
    root.addEventListener("click", (event) => {
      const button = event.target.closest(".segment");
      if (!button) return;
      if (button.dataset.period) return;
      if (button.dataset.equityMetric) return;
      if (button.dataset.authMode) return;
      setSegment(root.dataset.field, button.dataset.value);
    });
  });

  $$(".chart-metric .segment").forEach((button) => {
    button.addEventListener("click", () => {
      equityChartMetric = button.dataset.equityMetric === "balance" ? "balance" : "r";
      $$(".chart-metric .segment").forEach((segment) => segment.classList.remove("active"));
      button.classList.add("active");
      rerenderAnalyticsSoon(0);
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

  $$(".period-pl-period .segment").forEach((button) => {
    button.addEventListener("click", () => {
      periodPlPeriod = ["day", "month", "year"].includes(button.dataset.periodPlPeriod) ? button.dataset.periodPlPeriod : "day";
      savePeriodPlPeriod();
      updatePeriodPlPeriodControls();
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
    renderTradingViewWidget(true);
  });
  $("#marketChartInterval").addEventListener("change", (event) => {
    marketChartInterval = event.target.value || "1D";
    if (!marketChartRanges.includes(marketChartInterval)) marketChartInterval = "1D";
    saveMarketChartSettings();
    renderTradingViewWidget(true);
  });
  const reloadButton = $("#reloadMarketChartBtn");
  if (reloadButton) reloadButton.addEventListener("click", () => renderTradingViewWidget(true));

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
    closeTradeTicketModal();
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

  const setupPlaybookList = $("#setupPlaybookList");
  if (setupPlaybookList) {
    setupPlaybookList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-setup-action='strategy']");
      if (!button) return;
      createOrUpdateStrategyFromSetup(button.dataset.setup || "");
    });
  }

  const setupSearchInput = $("#setupPlaybookSearch");
  if (setupSearchInput) {
    setupSearchInput.addEventListener("input", (event) => {
      setupPlaybookSearch = event.target.value || "";
      renderSetupPlaybook();
    });
  }

  const setupStatusFilter = $("#setupPlaybookStatus");
  if (setupStatusFilter) {
    setupStatusFilter.addEventListener("change", (event) => {
      setupPlaybookStatus = event.target.value || "all";
      renderSetupPlaybook();
    });
  }

  const setupTypeFilter = $("#setupPlaybookType");
  if (setupTypeFilter) {
    setupTypeFilter.addEventListener("change", (event) => {
      setupPlaybookType = event.target.value || "all";
      renderSetupPlaybook();
    });
  }

  const strategySearchInput = $("#strategySearch");
  if (strategySearchInput) {
    strategySearchInput.addEventListener("input", (event) => {
      strategySearch = event.target.value || "";
      renderStrategies();
    });
  }

  const strategyQualityFilter = $("#strategyQualityFilter");
  if (strategyQualityFilter) {
    strategyQualityFilter.addEventListener("change", (event) => {
      strategyQuality = event.target.value || "all";
      renderStrategies();
    });
  }

  const strategySetupTypeFilter = $("#strategySetupTypeFilter");
  if (strategySetupTypeFilter) {
    strategySetupType = strategySetupTypeFilter.value || "all";
    strategySetupTypeFilter.addEventListener("change", (event) => {
      strategySetupType = event.target.value || "all";
      renderStrategies();
    });
  }

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

    if (button.dataset.strategyAction === "refresh") {
      createOrUpdateStrategyFromSetup(strategy.linkedSetup || strategy.name);
      return;
    }

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

  const openSetupStrategyButton = $("#openSetupStrategyBtn");
  if (openSetupStrategyButton) openSetupStrategyButton.addEventListener("click", openCurrentSetupInStrategyBuilder);

  const historyPeriodFilter = $("#historyPeriodFilter");
  if (historyPeriodFilter) {
    historyPeriodFilter.addEventListener("change", (event) => {
      historyRange = event.target.value || "all";
      if (historyRange === "custom") {
        historyCustomStart = $("#historyStartFilter")?.value || "";
        historyCustomEnd = $("#historyEndFilter")?.value || "";
      }
      updateHistoryFilterControls();
      saveHistoryFilterSettings();
      renderTable();
    });
  }

  ["historyStartFilter", "historyEndFilter"].forEach((id) => {
    const input = $(`#${id}`);
    if (!input) return;
    input.addEventListener("input", () => {
      historyRange = "custom";
      historyCustomStart = $("#historyStartFilter")?.value || "";
      historyCustomEnd = $("#historyEndFilter")?.value || "";
      saveHistoryFilterSettings();
      updateHistoryFilterControls();
      renderTable();
    });
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
  ["setup", "positive", "mistake"].forEach((name) => {
    const select = form.elements[name];
    if (!select) return;
    select.dataset.previousValue = select.value;
    select.addEventListener("focus", () => {
      select.dataset.previousValue = select.value;
    });
    select.addEventListener("change", () => {
      if (select.value === customChoiceValue) {
        addCustomTradeChoice(name);
        return;
      }
      select.dataset.previousValue = select.value;
      if (name === "setup") syncSetupTypeFromSetup();
      if (name === "mistake") applyScoreEngine();
    });
  });
  scoreDriverNames.forEach((name) => {
    if (!form.elements[name]) return;
    form.elements[name].addEventListener("change", applyScoreEngine);
  });

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

  $("#tradeForm").elements.setupScore.addEventListener("input", applyScoreEngine);
  $("#tradeForm").elements.confidence.addEventListener("input", applyScoreEngine);
  $("#tradeForm").elements.discipline.addEventListener("input", applyScoreEngine);
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

  $("#exportJsonBtn").addEventListener("click", exportJsonBackup);

  $("#exportCsvBtn").addEventListener("click", exportCsv);
  const exportFilteredCsvButton = $("#exportFilteredCsvBtn");
  if (exportFilteredCsvButton) exportFilteredCsvButton.addEventListener("click", exportFilteredCsv);
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importJson(file);
    event.target.value = "";
  });

  const checklistView = $("#checklistView");
  if (checklistView) {
    checklistView.addEventListener("change", (event) => {
      const input = event.target.closest("[data-rule-group] input[type='checkbox'][data-rule-key]");
      if (input) updateChecklistInput(input);
    });
  }

  const dailyReviewForm = $("#dailyReviewForm");
  if (dailyReviewForm) {
    dailyReviewForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveDailyReviewFromForm();
    });
  }

  const dailyReviewDate = $("#dailyReviewDate");
  if (dailyReviewDate) {
    dailyReviewDate.addEventListener("change", (event) => {
      const selectedDate = event.target.value || localDateKey();
      fillDailyReviewForm(selectedDate);
      renderChecklistDashboard();
      showToast(selectedDailyReviewLoadMessage(selectedDate));
    });
  }

  const resetDailyReviewButton = $("#resetDailyReviewBtn");
  if (resetDailyReviewButton) {
    resetDailyReviewButton.addEventListener("click", () => {
      fillDailyReviewForm($("#dailyReviewDate")?.value || localDateKey());
      showToast("Daily review form reset.");
    });
  }

  const refreshDailyReviewButton = $("#refreshDailyReviewBtn");
  if (refreshDailyReviewButton) {
    refreshDailyReviewButton.addEventListener("click", () => {
      fillDailyReviewFromJournal($("#dailyReviewDate")?.value || localDateKey());
      showToast("Daily review refreshed from journal.");
    });
  }

  const copyPreviousDailyRuleButton = $("#copyPreviousDailyRuleBtn");
  if (copyPreviousDailyRuleButton) {
    copyPreviousDailyRuleButton.addEventListener("click", copyPreviousDailyRule);
  }

  const exportDailyReviewsButton = $("#exportDailyReviewsBtn");
  if (exportDailyReviewsButton) {
    exportDailyReviewsButton.addEventListener("click", exportDailyReviewsCsv);
  }
  const dailyReviewExportPeriod = $("#dailyReviewExportPeriod");
  if (dailyReviewExportPeriod) {
    dailyReviewExportPeriod.addEventListener("change", updateDailyReviewExportControls);
    updateDailyReviewExportControls();
  }
  ["dailyReviewExportStart", "dailyReviewExportEnd"].forEach((id) => {
    const input = $(`#${id}`);
    if (!input) return;
    input.addEventListener("input", () => {
      const period = $("#dailyReviewExportPeriod");
      if (period) period.value = "custom";
      updateDailyReviewExportControls();
    });
  });

  const addDailyEvidenceButton = $("#addDailyEvidenceBtn");
  const dailyEvidenceInput = $("#dailyEvidenceInput");
  if (addDailyEvidenceButton && dailyEvidenceInput) {
    addDailyEvidenceButton.addEventListener("click", () => dailyEvidenceInput.click());
    dailyEvidenceInput.addEventListener("change", (event) => {
      addDailyEvidenceFiles(event.target.files);
      event.target.value = "";
    });
  }

  const dailyEvidencePreview = $("#dailyEvidencePreview");
  if (dailyEvidencePreview) {
    dailyEvidencePreview.addEventListener("click", (event) => {
      const button = event.target.closest("[data-evidence-action]");
      if (!button) return;
      if (button.dataset.evidenceAction === "remove") removeDailyEvidence(button.dataset.id);
      if (button.dataset.evidenceAction === "open") openEvidencePreview(button.dataset.id);
    });
  }

  $("#closeEvidencePreviewBtn")?.addEventListener("click", closeEvidencePreview);
  $("#evidencePreviewModal")?.addEventListener("click", (event) => {
    if (event.target.id === "evidencePreviewModal") closeEvidencePreview();
  });

  const dailyReviewHistory = $("#dailyReviewHistory");
  if (dailyReviewHistory) {
    dailyReviewHistory.addEventListener("click", (event) => {
      const button = event.target.closest("[data-daily-review-action][data-daily-review-date]");
      if (!button) return;
      if (button.dataset.dailyReviewAction === "load") loadDailyReviewForEdit(button.dataset.dailyReviewDate);
      if (button.dataset.dailyReviewAction === "delete") deleteDailyReview(button.dataset.dailyReviewDate);
    });
  }

  $("#useProfileBtn").addEventListener("click", () => {
    const profile = $("#bestProfile").dataset;
    if (!profile.setup) {
      showToast("Record trades before creating a profile strategy.");
      return;
    }
    const setupProfile = setupProfileFromTrades(
      profile.setup,
      trades.filter((trade) => trade.setup === profile.setup && trade.pair === profile.pair && trade.session === profile.session)
    );
    fillStrategyForm({
      ...strategyDraftForSetupProfile(setupProfile),
      name: `${profile.session} ${profile.pair} ${profile.setup}`.trim(),
      market: `${profile.pair} during ${profile.session}`,
      trigger: profile.setup,
      reviewRule: "Compare execution with the best trade profile after every trade."
    });
    document.querySelector('[data-view="strategy"]').click();
    showToast("Profile copied into the strategy builder.");
  });

  window.addEventListener("resize", () => rerenderAnalyticsSoon());
  window.addEventListener("orientationchange", () => rerenderAnalyticsSoon(320));
}

function bootstrap() {
  initSupabaseClient();
  initAccountSession();
  applyThemePreference();
  renderPairOptions(defaultPair);
  renderTradeChoiceOptions();
  renderMarketChartOptions(marketChartPair);
  bindEvents();
  resetTradeForm();
  render();
  renderTradingViewWidget();
  syncAccountUi();
  renderDstWidget();
  setInterval(renderDstWidget, 60000);
  initAppScrollMemory();
  if (!activeAccount) {
    showAuthOverlay("cloud", true);
  }
  registerServiceWorker();
  initCloudSession();
}

bootstrap();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").then((registration) => {
    registration.update();
  }).catch(() => {
    // Some local file and non-secure hosts do not allow service workers.
  });
}
