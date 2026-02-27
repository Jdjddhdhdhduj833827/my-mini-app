/* Market Pulse — полностью рабочая логика (dropdown + график + таймер) */

const tg = window.Telegram?.WebApp;
try{
  tg?.ready();
  tg?.expand();
} catch(e){}

/* ---------- ДАННЫЕ ---------- */
const PAIRS = [
  { name: "EUR/USD", badge: "🇪🇺🇺🇸" },
  { name: "GBP/USD", badge: "🇬🇧🇺🇸" },
  { name: "USD/JPY", badge: "🇺🇸🇯🇵" },
  { name: "USD/CHF", badge: "🇺🇸🇨🇭" },
  { name: "AUD/USD", badge: "🇦🇺🇺🇸" },
  { name: "USD/CAD", badge: "🇺🇸🇨🇦" },
  { name: "NZD/USD", badge: "🇳🇿🇺🇸" },
  { name: "EUR/GBP", badge: "🇪🇺🇬🇧" },
  { name: "EUR/JPY", badge: "🇪🇺🇯🇵" },
  { name: "GBP/JPY", badge: "🇬🇧🇯🇵" }
];

const TIMEFRAMES = [
  { label: "10s", seconds: 10 },
  { label: "15s", seconds: 15 },
  { label: "30s", seconds: 30 },
  { label: "1m",  seconds: 60 },
  { label: "3m",  seconds: 180 },
  { label: "5m",  seconds: 300 },
  { label: "10m", seconds: 600 }
];

const state = {
  pair: PAIRS[0].name,
  pairBadge: PAIRS[0].badge,
  tf: TIMEFRAMES[0].label,
  tfSeconds: TIMEFRAMES[0].seconds,
  market: "OTC"
};

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);

const pairSelect = $("pairSelect");
const pairDrop   = $("pairDrop");
const pairValue  = $("pairValue");
const pairBadge  = $("pairBadge");

const tfSelect = $("tfSelect");
const tfDrop   = $("tfDrop");
const tfValue  = $("tfValue");

const marketBtn   = $("marketBtn");
const marketValue = $("marketValue");

const backdrop = $("backdrop");

const btnGenerate  = $("btnGenerate");
const btnGenerate2 = $("btnGenerate2");
const btnReset     = $("btnReset");

const resultPanel  = $("resultPanel");

const rPair  = $("rPair");
const rTf    = $("rTf");
const rAcc   = $("rAcc");
const dirDot = $("dirDot");
const dirText= $("dirText");
const rUntil = $("rUntil");
const progressBar = $("progressBar");
const timerText   = $("timerText");

const chartMeta = $("chartMeta");
const chartBox  = $("chartBox");
const analyzeOverlay = $("analyzeOverlay");

/* ---------- DROPDOWNS ---------- */
function closeAllDropdowns(){
  pairDrop.classList.remove("open");
  tfDrop.classList.remove("open");
  backdrop.classList.add("hidden");
}

function toggleDropdown(drop){
  const isOpen = drop.classList.contains("open");
  closeAllDropdowns();
  if(!isOpen){
    drop.classList.add("open");
    backdrop.classList.remove("hidden");
  }
}

function buildDropdown(dropEl, items, onPick){
  dropEl.innerHTML = "";
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "dropItem";
    div.innerHTML = `
      <div class="dropItem__left">
        <span class="badge">${item.badge ?? "⏱"}</span>
        <div class="dropItem__name">${item.name ?? item.label}</div>
      </div>
      <div class="dropItem__meta">${item.meta ?? ""}</div>
    `;
    div.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPick(item);
      closeAllDropdowns();
    });
    dropEl.appendChild(div);
  });
}

buildDropdown(pairDrop, PAIRS.map(p => ({ name: p.name, badge: p.badge })), (p) => {
  state.pair = p.name;
  state.pairBadge = p.badge;
  pairValue.textContent = state.pair;
  pairBadge.textContent = state.pairBadge;
  renderChart();
});

buildDropdown(tfDrop, TIMEFRAMES.map(t => ({ label: t.label, meta: `${t.seconds}s` })), (t) => {
  const found = TIMEFRAMES.find(x => x.label === t.label);
  state.tf = found.label;
  state.tfSeconds = found.seconds;
  tfValue.textContent = state.tf;
});

pairSelect.addEventListener("click", (e) => { e.stopPropagation(); toggleDropdown(pairDrop); });
tfSelect.addEventListener("click",   (e) => { e.stopPropagation(); toggleDropdown(tfDrop); });

backdrop.addEventListener("click", closeAllDropdowns);
document.addEventListener("click", closeAllDropdowns);

/* Market toggle (OTC / REAL) */
marketBtn.addEventListener("click", (e) => {
  e.preventDefault();
  state.market = (state.market === "OTC") ? "REAL" : "OTC";
  marketValue.textContent = state.market;
  renderChart();
});

/* ---------- CHART (100% рабочий, без iframe) ---------- */
let chart, candleSeries;

function ensureChart(){
  if(chart) return;

  // гарантируем, что контейнер видимый и с высотой
  if(!chartBox) return;

  chart = LightweightCharts.createChart(chartBox, {
    autoSize: true,
    layout: { background: { type: "solid", color: "transparent" }, textColor: "rgba(255,255,255,.85)" },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, secondsVisible: true },
    grid: {
      vertLines: { color: "rgba(255,255,255,.06)" },
      horzLines: { color: "rgba(255,255,255,.06)" }
    },
    crosshair: { mode: 0 }
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: "#2ecc71",
    downColor: "#e74c3c",
    wickUpColor: "#2ecc71",
    wickDownColor: "#e74c3c",
    borderVisible: false
  });

  // resize для Telegram/браузера
  const ro = new ResizeObserver(() => {
    try{ chart?.applyOptions({}); } catch(e){}
  });
  ro.observe(chartBox);
}

function seedFromText(text){
  // простой стабильный seed из строки
  let h = 2166136261;
  for(let i=0;i<text.length;i++){
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function rng(seed){
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Генерация свечей “как рынок”, зависит от пары/рынка => выглядит по-разному
function makeCandles(pair, market){
  const seed = seedFromText(pair + "|" + market);
  const random = rng(seed);

  const now = Math.floor(Date.now()/1000);
  const bars = [];
  const count = 80;

  let t = now - count * 15; // шаг 15 секунд
  let price = 1 + random()*0.8;

  const volatility = market === "OTC" ? 0.010 : 0.006;

  for(let i=0;i<count;i++){
    const open = price;
    const drift = (random() - 0.5) * volatility;
    const close = open + drift;

    const w = volatility * (0.7 + random()*0.8);
    const high = Math.max(open, close) + random()*w;
    const low  = Math.min(open, close) - random()*w;

    bars.push({
      time: t,
      open: round(open),
      high: round(high),
      low:  round(low),
      close:round(close)
    });

    t += 15;
    price = close;
  }
  return bars;
}

function round(x){
  return Math.round(x * 100000) / 100000;
}

function renderChart(){
  ensureChart();
  if(!candleSeries) return;

  if(chartMeta) chartMeta.textContent = `${state.pair} • ${state.market}`;
  candleSeries.setData(makeCandles(state.pair, state.market));
}

/* ---------- ANALYSIS / TIMER ---------- */
let timerInt = null;
let endAtMs = 0;
let totalMs = 0;

function fmt(sec){
  const s = Math.max(0, sec|0);
  const mm = String(Math.floor(s/60)).padStart(2,"0");
  const ss = String(s%60).padStart(2,"0");
  return `${mm}:${ss}`;
}

function setDirection(isUp){
  if(isUp){
    dirDot.classList.remove("down");
    dirText.textContent = "Вверх";
  } else {
    dirDot.classList.add("down");
    dirText.textContent = "Вниз";
  }
}

function setUntilFromNow(seconds){
  const d = new Date(Date.now() + seconds*1000);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  rUntil.textContent = `${hh}:${mm}:${ss}`;
}

function startTimer(seconds){
  if(timerInt) clearInterval(timerInt);

  totalMs = seconds * 1000;
  endAtMs = Date.now() + totalMs;

  const tick = () => {
    const leftMs = endAtMs - Date.now();
    const leftSec = Math.ceil(leftMs / 1000);

    const done = leftMs <= 0;
    const progress = done ? 100 : ( (1 - leftMs/totalMs) * 100 );

    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    timerText.textContent = `${fmt(leftSec)} / ${fmt(seconds)}`;

    if(done){
      clearInterval(timerInt);
      timerInt = null;
    }
  };

  tick();
  timerInt = setInterval(tick, 250);
}

function runAnalysis(){
  // показать панель
  resultPanel.classList.remove("hidden");

  // обновить поля
  rPair.textContent = state.pair;
  rTf.textContent = state.tf;

  // анимация анализа
  analyzeOverlay.classList.remove("hidden");

  // график обновляем сразу (под оверлеем красиво)
  renderChart();

  // имитация “анализа”
  setTimeout(() => {
    const acc = 70 + Math.floor(Math.random()*16); // 70-85
    rAcc.textContent = `${acc}%`;

    const isUp = Math.random() > 0.5;
    setDirection(isUp);

    setUntilFromNow(state.tfSeconds);
    startTimer(state.tfSeconds);

    analyzeOverlay.classList.add("hidden");
  }, 1100);
}

function resetAll(){
  if(timerInt) clearInterval(timerInt);
  timerInt = null;
  progressBar.style.width = "0%";
  timerText.textContent = "00:00 / 00:00";
  rAcc.textContent = "—%";
  dirText.textContent = "—";
  rUntil.textContent = "—";
  resultPanel.classList.add("hidden");
}

/* ---------- BUTTONS ---------- */
btnGenerate.addEventListener("click", (e) => { e.preventDefault(); runAnalysis(); });
btnGenerate2.addEventListener("click", (e) => { e.preventDefault(); runAnalysis(); });
btnReset.addEventListener("click", (e) => { e.preventDefault(); resetAll(); });

/* ---------- INIT ---------- */
pairValue.textContent = state.pair;
pairBadge.textContent = state.pairBadge;
tfValue.textContent = state.tf;
marketValue.textContent = state.market;

// если результат уже открыт — график должен быть готов
renderChart();
