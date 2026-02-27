(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) { try { tg.ready(); tg.expand(); } catch {} }

  const $ = (id) => document.getElementById(id);
  const pad2 = (n) => String(n).padStart(2, "0");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ===== DATA =====
  const PAIRS = [
    { value: "EUR/USD", badge: "🇪🇺🇺🇸" },
    { value: "GBP/USD", badge: "🇬🇧🇺🇸" },
    { value: "USD/JPY", badge: "🇺🇸🇯🇵" },
    { value: "EUR/JPY", badge: "🇪🇺🇯🇵" },
    { value: "AUD/USD", badge: "🇦🇺🇺🇸" },
    { value: "USD/CHF", badge: "🇺🇸🇨🇭" },
    { value: "BTC/USD", badge: "₿" },
    { value: "ETH/USD", badge: "Ξ" },
  ];

  const TFS = [
    { label: "10s", sec: 10 },
    { label: "15s", sec: 15 },
    { label: "30s", sec: 30 },
    { label: "1m",  sec: 60 },
    { label: "3m",  sec: 180 },
    { label: "5m",  sec: 300 },
    { label: "7m",  sec: 420 },
    { label: "10m", sec: 600 },
  ];

  const state = {
    pair: PAIRS[0].value,
    badge: PAIRS[0].badge,
    tf: TFS[0].label,
    tfSec: TFS[0].sec,
    market: "OTC",
    timer: null,
    total: 0,
    left: 0,
  };

  // ===== ELEMENTS =====
  const pairSelect = $("pairSelect");
  const pairDrop = $("pairDrop");
  const pairValue = $("pairValue");
  const pairBadge = $("pairBadge");

  const tfSelect = $("tfSelect");
  const tfDrop = $("tfDrop");
  const tfValue = $("tfValue");

  const marketBtn = $("marketBtn");
  const marketValue = $("marketValue");

  const btnGenerate = $("btnGenerate");
  const btnGenerate2 = $("btnGenerate2");
  const btnReset = $("btnReset");

  const hintText = $("hintText");
  const resultPanel = $("resultPanel");

  const rPair = $("rPair");
  const rTf = $("rTf");
  const rAcc = $("rAcc");
  const rDir = $("rDir");
  const rUntil = $("rUntil");

  const progressBar = $("progressBar");
  const timerText = $("timerText");

  const chartMeta = $("chartMeta");
  const chartHost = $("chart");

  const backdrop = $("backdrop");
  const analyzeOverlay = $("analyzeOverlay");
  const anSub = $("anSub");

  // ===== DROPDOWNS =====
  function showBackdrop(on){
    backdrop?.classList.toggle("hidden", !on);
  }

  function closeDrops(){
    pairDrop?.classList.remove("open");
    tfDrop?.classList.remove("open");
    showBackdrop(false);
  }

  function openDrop(drop){
    closeDrops();
    drop.classList.add("open");
    showBackdrop(true);
  }

  backdrop?.addEventListener("click", closeDrops);

  function renderPairs(){
    pairDrop.innerHTML = "";
    PAIRS.forEach(p => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dropItem";
      b.textContent = `${p.badge} ${p.value}`;
      b.addEventListener("click", (e) => {
        e.preventDefault();
        state.pair = p.value;
        state.badge = p.badge;
        pairValue.textContent = state.pair;
        pairBadge.textContent = state.badge;
        closeDrops();
        renderChart();
      });
      pairDrop.appendChild(b);
    });
  }

  function renderTfs(){
    tfDrop.innerHTML = "";
    TFS.forEach(t => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dropItem";
      b.textContent = t.label;
      b.addEventListener("click", (e) => {
        e.preventDefault();
        state.tf = t.label;
        state.tfSec = t.sec;
        tfValue.textContent = state.tf;
        closeDrops();
      });
      tfDrop.appendChild(b);
    });
  }

  pairSelect?.addEventListener("click", (e)=>{ e.preventDefault(); openDrop(pairDrop); });
  tfSelect?.addEventListener("click", (e)=>{ e.preventDefault(); openDrop(tfDrop); });

  // ===== MARKET =====
  marketBtn?.addEventListener("click", () => {
    state.market = (state.market === "OTC") ? "REAL" : "OTC";
    marketValue.textContent = state.market;
    renderChart();
  });

  // ===== TIMER =====
  function mmss(sec){
    sec = Math.max(0, Math.ceil(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }

  function stopTimer(){
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }

  function startTimer(totalSec){
    stopTimer();
    state.total = totalSec;
    state.left = totalSec;

    const tick = () => {
      state.left -= 0.1;
      if (state.left <= 0) { state.left = 0; stopTimer(); }

      const pct = state.total ? ((state.total - state.left) / state.total) * 100 : 100;
      if (progressBar) progressBar.style.width = `${clamp(pct,0,100)}%`;
      if (timerText) timerText.textContent = `${mmss(state.left)} / ${mmss(state.total)}`;
    };

    tick();
    state.timer = setInterval(tick, 100);
  }

  // ===== ANALYZE OVERLAY =====
  function setAnalyze(on, text){
    if (!analyzeOverlay) return;
    if (text && anSub) anSub.textContent = text;
    analyzeOverlay.classList.toggle("hidden", !on);
  }

  // ===== SIGNAL UI =====
  function pickDir(){
    return Math.random() < 0.52 ? "UP" : "DOWN";
  }

  function acc(){
    return Math.floor(72 + Math.random() * 16); // 72..87
  }

  function untilTime(sec){
    const d = new Date(Date.now() + sec * 1000);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function showResult(show){
    resultPanel?.classList.toggle("hidden", !show);
    hintText?.classList.toggle("hidden", show);
  }

  function applyResult(dir){
    rPair.textContent = state.pair;
    rTf.textContent = state.tf;
    rAcc.textContent = `${acc()}%`;
    rUntil.textContent = untilTime(state.tfSec);

    const dot = rDir.querySelector(".dirDot");
    const text = rDir.querySelector(".dirText");

    if (dir === "UP") {
      dot.classList.remove("down"); dot.classList.add("up");
      text.textContent = "Вверх";
    } else {
      dot.classList.remove("up"); dot.classList.add("down");
      text.textContent = "Вниз";
    }
  }

  // ===== CHART =====
  let chart = null;
  let series = null;

  function mockCandles(count = 70){
    const now = Math.floor(Date.now()/1000);
    let t = now - count * 60;

    const base = {
      "EUR/USD": 1.085,
      "GBP/USD": 1.265,
      "USD/JPY": 148.2,
      "EUR/JPY": 161.0,
      "AUD/USD": 0.655,
      "USD/CHF": 0.895,
      "BTC/USD": 52000,
      "ETH/USD": 2800,
    }[state.pair] ?? 1.08;

    let price = base;
    const crypto = state.pair.includes("BTC") || state.pair.includes("ETH");
    const k = crypto ? 0.004 : 0.001;
    const vol = (state.market === "OTC") ? 1.25 : 1.0;

    const data = [];
    for (let i=0;i<count;i++){
      const open = price;
      const delta = (Math.random()-0.5) * k * vol;
      const close = open * (1 + delta);
      const high = Math.max(open, close) * (1 + Math.random()*k*0.7);
      const low  = Math.min(open, close) * (1 - Math.random()*k*0.7);
      data.push({ time: t, open, high, low, close });
      t += 60;
      price = close;
    }
    return data;
  }

  function ensureChart(){
    if (!chartHost) return false;
    if (!window.LightweightCharts) return false;
    if (chart) return true;

    chart = window.LightweightCharts.createChart(chartHost, {
      layout: { background: { type:"solid", color:"transparent" }, textColor:"rgba(255,255,255,.82)" },
      grid: { vertLines:{ color:"rgba(255,255,255,.06)" }, horzLines:{ color:"rgba(255,255,255,.06)" } },
      rightPriceScale: { borderColor:"rgba(255,255,255,.10)" },
      timeScale: { borderColor:"rgba(255,255,255,.10)", timeVisible:true, secondsVisible:true },
      crosshair: { mode: 1 }
    });

    
    series = chart.addLineSeries({
  color: "#5aa2ff",      // цвет линии
  lineWidth: 2,
  crosshairMarkerVisible: true,
  lastValueVisible: true,
  priceLineVisible: true
});

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: chartHost.clientWidth, height: chartHost.clientHeight });
    });
    ro.observe(chartHost);

    return true;
  }

  function renderChart(){
    if (chartMeta) chartMeta.textContent = `${state.pair} • ${state.market}`;

    if (!ensureChart()) {
      // если CDN недоступен — просто покажем текст
      if (chartHost) chartHost.innerHTML = `<div style="padding:12px;font-size:12px;opacity:.7;text-align:center">
        График недоступен (CDN). Открой в Telegram или поменяем на локальный файл.
      </div>`;
      return;
    }

    const candles = mockCandles(70);

const lineData = candles.map(c => ({
  time: c.time,
  value: c.close
}));

series.setData(lineData);
    chart.timeScale().fitContent();
  }

  // ===== GENERATE =====
  async function generate(){
    closeDrops();

    showResult(true);
    setAnalyze(true, "Сканируем волатильность и импульсы…");
    await new Promise(r => setTimeout(r, 1100));
    setAnalyze(false);

    const dir = pickDir();
    applyResult(dir);
    startTimer(state.tfSec);
    renderChart();

    tg?.HapticFeedback?.impactOccurred?.("medium");
  }

  btnGenerate?.addEventListener("click", generate);
  btnGenerate2?.addEventListener("click", generate);

  btnReset?.addEventListener("click", () => {
    closeDrops();
    stopTimer();
    showResult(false);
    if (progressBar) progressBar.style.width = "0%";
    if (timerText) timerText.textContent = "00:00 / 00:00";
  });

  // ===== BOOT =====
  function boot(){
    // initial UI
    pairValue.textContent = state.pair;
    pairBadge.textContent = state.badge;
    tfValue.textContent = state.tf;
    marketValue.textContent = state.market;

    renderPairs();
    renderTfs();

    showResult(false);
    closeDrops();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
