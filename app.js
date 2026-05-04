const storageKeys = {
  trades: "fx-edge-journal.trades.v1",
  strategies: "fx-edge-journal.strategies.v1"
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

let trades = loadFromStorage(storageKeys.trades, []);
let strategies = loadFromStorage(storageKeys.strategies, []);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveTrades() {
  localStorage.setItem(storageKeys.trades, JSON.stringify(trades));
}

function saveStrategies() {
  localStorage.setItem(storageKeys.strategies, JSON.stringify(strategies));
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

function getOutcome(resultR) {
  if (resultR > 0.001) return "win";
  if (resultR < -0.001) return "loss";
  return "be";
}

function calculateResultR(direction, entry, stop, exit, manualR) {
  if (manualR !== "" && Number.isFinite(Number(manualR))) {
    return Number(manualR);
  }

  const entryPrice = Number(entry);
  const stopPrice = Number(stop);
  const exitPrice = Number(exit);

  if (![entryPrice, stopPrice, exitPrice].every(Number.isFinite)) return 0;

  const riskDistance = Math.abs(entryPrice - stopPrice);
  if (!riskDistance) return 0;

  const signedMove = direction === "Buy" ? exitPrice - entryPrice : entryPrice - exitPrice;
  return signedMove / riskDistance;
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

function analyze(list) {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const wins = sorted.filter((trade) => trade.resultR > 0);
  const losses = sorted.filter((trade) => trade.resultR < 0);
  const grossProfit = sum(wins, (trade) => trade.resultR);
  const grossLoss = Math.abs(sum(losses, (trade) => trade.resultR));
  const netR = sum(sorted, (trade) => trade.resultR);
  const netPl = sum(sorted, (trade) => toNumber(trade.risk) * trade.resultR);
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
  renderSummary(stats);
  renderFilters();
  renderTable();
  renderAnalytics(stats);
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
      <td><span class="badge ${outcome}">${formatR(trade.resultR)}</span></td>
      <td>${currencyFormatter.format(toNumber(trade.risk) * trade.resultR)}</td>
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

function renderAnalytics(stats) {
  $("#expectancyPill").textContent = `${formatR(stats.expectancy)} expectancy`;
  drawEquityChart(stats.equity);
  renderInsights(stats);
  renderLeaderboard("#setupLeaderboard", stats.setupStats, "setup");
  renderLeaderboard("#sessionBreakdown", stats.sessionStats, "session");
  renderLeaderboard("#mistakeBreakdown", stats.mistakeStats, "mistake");
  renderBestProfile(stats);
}

function drawEquityChart(equity) {
  const canvas = $("#equityChart");
  const context = canvas.getContext("2d");
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
  const values = [0, ...equity.map((point) => point.value)];

  if (values.length < 2) {
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
    return { x, y, value };
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
}

function drawChartFrame(context, width, height, padding) {
  context.strokeStyle = "#d9ded7";
  context.lineWidth = 1;
  context.strokeRect(padding.left, padding.top, width - padding.left - padding.right, height - padding.top - padding.bottom);
}

function renderInsights(stats) {
  const bestPair = stats.pairStats[0];
  const bestSession = stats.sessionStats[0];
  const worstMistake = [...stats.mistakeStats].sort((a, b) => a.netR - b.netR)[0];
  const disciplineLeak = trades.filter((trade) => toNumber(trade.discipline) < 60);
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
  const resultR = calculateResultR(
    direction,
    data.get("entry"),
    data.get("stop"),
    data.get("exit"),
    data.get("manualR")
  );

  return {
    id: data.get("id") || crypto.randomUUID(),
    date: data.get("date"),
    pair: String(data.get("pair") || "").trim().toUpperCase(),
    session: data.get("session"),
    direction,
    setup: String(data.get("setup") || "").trim(),
    entry: toNumber(data.get("entry")),
    stop: toNumber(data.get("stop")),
    target: toNumber(data.get("target")),
    exit: toNumber(data.get("exit")),
    risk: toNumber(data.get("risk")),
    resultR: Number(resultR.toFixed(2)),
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
  form.elements.id.value = trade.id;
  form.elements.date.value = trade.date;
  form.elements.pair.value = trade.pair;
  form.elements.session.value = trade.session;
  form.elements.setup.value = trade.setup;
  form.elements.entry.value = trade.entry || "";
  form.elements.stop.value = trade.stop || "";
  form.elements.target.value = trade.target || "";
  form.elements.exit.value = trade.exit || "";
  form.elements.risk.value = trade.risk || "";
  form.elements.manualR.value = trade.resultR;
  form.elements.mistake.value = trade.mistake || "None";
  form.elements.confidence.value = trade.confidence || 60;
  form.elements.discipline.value = trade.discipline || 70;
  form.elements.tags.value = (trade.tags || []).join(", ");
  form.elements.notes.value = trade.notes || "";
  setSegment("direction", trade.direction || "Buy");
  updateSliderOutputs();
  $("#saveTradeBtn").innerHTML = `${iconMarkup("save")} Update Trade`;
}

function resetTradeForm() {
  const form = $("#tradeForm");
  form.reset();
  form.elements.id.value = "";
  form.elements.date.value = new Date().toISOString().slice(0, 10);
  form.elements.confidence.value = 60;
  form.elements.discipline.value = 70;
  setSegment("direction", "Buy");
  updateSliderOutputs();
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
}

function updateSliderOutputs() {
  $("#confidenceOut").textContent = $("#tradeForm").elements.confidence.value;
  $("#disciplineOut").textContent = $("#tradeForm").elements.discipline.value;
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
    "risk",
    "resultR",
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
      trades = parsed.trades.map((trade) => ({
        ...trade,
        id: trade.id || crypto.randomUUID(),
        resultR: toNumber(trade.resultR),
        risk: toNumber(trade.risk)
      }));
      strategies = Array.isArray(parsed.strategies) ? parsed.strategies : strategies;
      saveTrades();
      saveStrategies();
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
      setSegment(root.dataset.field, button.dataset.value);
    });
  });

  $("#tradeForm").addEventListener("submit", (event) => {
    event.preventDefault();
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
      .map((trade) => ({ ...trade }));
    trades = [...trades, ...freshDemoTrades];
    saveTrades();
    render();
    showToast("Demo trades loaded.");
  });

  $("#exportJsonBtn").addEventListener("click", () => {
    const content = JSON.stringify({ trades, strategies, exportedAt: new Date().toISOString() }, null, 2);
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

  window.addEventListener("resize", () => renderAnalytics(analyze(trades)));
}

function bootstrap() {
  bindEvents();
  resetTradeForm();
  render();
  registerServiceWorker();
}

bootstrap();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // Some local file and non-secure hosts do not allow service workers.
  });
}
