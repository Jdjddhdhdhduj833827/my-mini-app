(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const CONFIG = {
    REG_URL: "https://example.com/register",
    DEPOSIT_URL: "https://example.com/deposit",
    REPORT_URL: "https://example.com/report",
    ASSETS_JSON: "./assets.json",
    DEBUG: true,
  };

  const tg = window.Telegram?.WebApp || null;
  try { tg?.ready?.(); tg?.expand?.(); } catch {}

  const log = (...a) => CONFIG.DEBUG && console.log("[APP]", ...a);

  // =========================
  // DOM
  // =========================
  const $ = (id) => document.getElementById(id);

  const gate = $("gate");
  const app = $("app");

  const btnOpenReg = $("btnOpenReg");
  const btnGetAccess = $("btnGetAccess");
  const gateStatusText = $("gateStatusText");

  const btnLangGate = $("btnLangGate");
  const btnLangApp = $("btnLangApp");
  const btnMenu = $("btnMenu");

  const btnCheckStatus = $("btnCheckStatus");
  const btnReset = $("btnReset");
  const btnAnalyze = $("btnAnalyze");

  const assetBtn = $("assetBtn");
  const tfBtn = $("tfBtn");
  const marketBtn = $("marketBtn");

  const assetValue = $("assetValue");
  const tfValue = $("tfValue");
  const marketValue = $("marketValue");

  const chipSession = $("chipSession");
  const chipAccess = $("chipAccess");

  const chart = $("chart");
  const chartOverlay = $("chartOverlay");
  const overlayFill = $("overlayFill");

  const chipQuality = $("chipQuality");
  const chipConf = $("chipConf");

  const dirArrow = $("dirArrow");
  const dirText = $("dirText");
  const rWindow = $("rWindow");
  const rUntil = $("rUntil");
  const rAcc = $("rAcc");
  const volFactor = $("volFactor");
  const momFactor = $("momFactor");
  const liqFactor = $("liqFactor");

  const signalChart = $("signalChart");

  const assetsModal = $("assetsModal");
  const assetList = $("assetList");
  const assetSearch = $("assetSearch");
  const assetTabs = $("assetTabs");
  const closeAssets = $("closeAssets");

  const tfModal = $("tfModal");
  const tfList = $("tfList");
  const closeTf = $("closeTf");

  const langModal = $("langModal");
  const langList = $("langList");
  const closeLang = $("closeLang");

  const backdrop = $("backdrop");

  const notify = $("notify");
  const notifyTitle = $("notifyTitle");
  const notifyText = $("notifyText");
  const btnNotifyPrimary = $("btnNotifyPrimary");
  const notifyPrimaryLabel = $("notifyPrimaryLabel");
  const btnNotifyClose = $("btnNotifyClose");

  // =========================
  // STATE
  // =========================
  let LANG = localStorage.getItem("lang") || "ru";

  let ASSETS = {
    Forex: ["EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","NZD/USD","EUR/JPY","GBP/JPY"],
    Crypto: ["BTC/USD","ETH/USD","SOL/USD","XRP/USD"],
    Stocks: ["AAPL","TSLA","NVDA","MSFT"],
    Commodities: ["Gold","Oil","Brent","Natural Gas"],
    Indices: ["S&P 500","NASDAQ 100","DAX 40"]
  };

  let TIMEFRAMES = ["5s","10s","15s","30s","1m","3m","5m","30m","1h","3h","6h"];

  const TF_SECONDS = {
    "5s":5,"10s":10,"15s":15,"30s":30,
    "1m":60,"3m":180,"5m":300,"30m":1800,
    "1h":3600,"3h":10800,"6h":21600
  };

  // Chart engine
  let candleSeries = [];
  let lastTickTs = 0;
  let liveTimer = null;
  let rafId = null;

  // crosshair
  let cross = { on:false, x:0, y:0 };

  // countdown
  let countdownInterval = null;
  let countdownRemaining = 30;

  // =========================
  // i18n
  // =========================
  const I18N = {
    ru: {
      gate_sub: "Premium terminal • Smart assistant",
      gate_title: "Доступ к терминалу",
      gate_text_main: "Нажмите «Получить доступ» — терминал откроется.",
      gate_step1_t: "Регистрация",
      gate_step1_d: "Кнопка ниже ведёт на регистрацию.",
      gate_step2_t: "Депозит",
      gate_step2_d: "Меню (⋯) откроет депозит/отчёт.",
      gate_step3_t: "Терминал",
      gate_step3_d: "Доступ открыт для любого пользователя.",
      gate_btn_reg: "Открыть регистрацию",
      gate_btn_access: "Получить доступ",
      gate_status: "Статус:",
      gate_status_ok: "готово",
      gate_legal: "Demo UI. Not financial advice.",
      gate_meter: "TERMINAL • realtime render",

      app_sub: "Premium UI Terminal",
      hero_title: "Terminal Overview",
      hero_sub: "Smart mode • Premium UI",
      hero_mode: "MODE: SMART",

      cc_title: "CONTROL CENTER",
      cc_btn_check: "Проверить",
      cc_btn_reset: "Сброс",
      cc_hint: "Нажмите «Запустить анализ» — получите сигнал.",
      cc_btn_analyze: "Запустить анализ",

      chart_title: "MARKET VISUAL",
      chart_quality: "Quality: —",
      chart_conf: "Conf: —",
      chart_scan: "Сканирование…",

      sig_label: "СИГНАЛ",
      sig_window: "окно:",
      sig_until: "до",
      confirm_label: "ПОДТВЕРЖДЕНИЕ",
      mini_hint: "Mini chart • render",

      m_acc: "Точность",
      m_vol: "Волатильность",
      m_mom: "Импульс",
      m_liq: "Ликвидность",

      assets_title: "Выбор актива",
      tf_title: "Выбор таймфрейма",
      lang_title: "Язык интерфейса",

      footnote: "Realtime render • UI terminal mode",
      notify_btn_ok: "Понятно"
    },

    en: {
      gate_sub: "Premium terminal • Smart assistant",
      gate_title: "Terminal access",
      gate_text_main: "Tap “Get access” to open terminal.",
      gate_step1_t: "Registration",
      gate_step1_d: "Button below opens registration.",
      gate_step2_t: "Deposit",
      gate_step2_d: "Menu (⋯) opens deposit/report.",
      gate_step3_t: "Terminal",
      gate_step3_d: "Access is open for any user.",
      gate_btn_reg: "Open registration",
      gate_btn_access: "Get access",
      gate_status: "Status:",
      gate_status_ok: "ready",
      gate_legal: "Demo UI. Not financial advice.",
      gate_meter: "TERMINAL • realtime render",

      app_sub: "Premium UI Terminal",
      hero_title: "Terminal Overview",
      hero_sub: "Smart mode • Premium UI",
      hero_mode: "MODE: SMART",

      cc_title: "CONTROL CENTER",
      cc_btn_check: "Check",
      cc_btn_reset: "Reset",
      cc_hint: "Tap “Run analysis” to get a signal.",
      cc_btn_analyze: "Run analysis",

      chart_title: "MARKET VISUAL",
      chart_quality: "Quality: —",
      chart_conf: "Conf: —",
      chart_scan: "Scanning…",

      sig_label: "SIGNAL",
      sig_window: "window:",
      sig_until: "until",
      confirm_label: "CONFIRMATION",
      mini_hint: "Mini chart • render",

      m_acc: "Accuracy",
      m_vol: "Volatility",
      m_mom: "Momentum",
      m_liq: "Liquidity",

      assets_title: "Select asset",
      tf_title: "Select timeframe",
      lang_title: "Language",

      footnote: "Realtime render • UI terminal mode",
      notify_btn_ok: "Got it"
    }
  };

  function t(key){ return (I18N[LANG] && I18N[LANG][key]) ? I18N[LANG][key] : key; }

  function applyI18n(){
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i]").forEach(el => {
      const k = el.getAttribute("data-i");
      el.textContent = t(k);
    });
  }

  // =========================
  // UI helpers
  // =========================
  function show(el){ el?.classList.remove("hidden"); }
  function hide(el){ el?.classList.add("hidden"); }

  function openURL(url){
    try {
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, "_blank");
    } catch {
      window.open(url, "_blank");
    }
  }

  function openModal(modal){
    show(backdrop); show(modal);
  }
  function closeModal(modal){
    hide(modal); hide(backdrop);
  }

  function notifyPopup(title, text, primaryLabel, primaryAction){
    notifyTitle.textContent = title;
    notifyText.textContent = text;
    notifyPrimaryLabel.textContent = primaryLabel;

    btnNotifyPrimary.onclick = () => primaryAction?.();
    show(notify);
  }

  // =========================
  // Assets loader
  // =========================
  async function loadAssetsJson(){
    try {
      const r = await fetch(CONFIG.ASSETS_JSON, { cache:"no-store" });
      if (!r.ok) throw new Error("assets.json fetch failed");
      const j = await r.json();
      if (j?.categories) ASSETS = j.categories;
      if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
    } catch (e) {
      log("assets.json fallback:", e?.message || e);
    }
  }

  // =========================
  // Session / Access
  // =========================
  function getSessionId(){
    // Telegram user id if exists, else random stable per browser
    const unsafeId = tg?.initDataUnsafe?.user?.id;
    if (unsafeId) return String(unsafeId);

    const k = "craft_session";
    let v = localStorage.getItem(k);
    if (!v){
      v = String(Math.floor(100000 + Math.random()*900000));
      localStorage.setItem(k, v);
    }
    return v;
  }

  function enterApp(){
    hide(gate);
    show(app);

    const sid = getSessionId();
    chipSession.textContent = "SESSION: " + sid.slice(-6);
    chipAccess.textContent = "ACCESS: OPEN";

    // start engines
    rebuildMarket("init");
    startLive();
  }

  // =========================
  // Modals: Language
  // =========================
  function openLangModal(){
    langList.innerHTML = "";
    const items = [
      { id:"ru", label:"Русский" },
      { id:"en", label:"English" }
    ];
    items.forEach(it => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `<div>${it.label}</div><div>${it.id.toUpperCase()}</div>`;
      row.addEventListener("click", () => {
        LANG = it.id;
        localStorage.setItem("lang", LANG);
        applyI18n();
        closeModal(langModal);
      });
      langList.appendChild(row);
    });
    openModal(langModal);
  }

  // =========================
  // Modals: Assets
  // =========================
  function openAssets(){
    assetTabs.innerHTML = "";
    assetList.innerHTML = "";
    assetSearch.value = "";

    const cats = Object.keys(ASSETS);
    let activeCat = cats[0] || "Forex";

    const render = () => {
      assetList.innerHTML = "";
      const q = assetSearch.value.trim().toLowerCase();
      (ASSETS[activeCat] || [])
        .filter(x => !q || x.toLowerCase().includes(q))
        .forEach(sym => {
          const row = document.createElement("div");
          row.className = "item";
          row.innerHTML = `<div>${sym}</div><div>${activeCat}</div>`;
          row.addEventListener("click", () => {
            assetValue.textContent = sym;
            closeModal(assetsModal);
            rebuildMarket("asset");
          });
          assetList.appendChild(row);
        });
    };

    cats.forEach(cat => {
      const tab = document.createElement("button");
      tab.className = "chipBtn";
      tab.type = "button";
      tab.textContent = cat;
      tab.addEventListener("click", () => { activeCat = cat; render(); });
      assetTabs.appendChild(tab);
    });

    assetSearch.oninput = render;
    render();
    openModal(assetsModal);
  }

  // =========================
  // Modals: TF
  // =========================
  function openTF(){
    tfList.innerHTML = "";
    TIMEFRAMES.forEach(tf => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `<div>${tf}</div><div>Timeframe</div>`;
      row.addEventListener("click", () => {
        tfValue.textContent = tf;
        closeModal(tfModal);
        rebuildMarket("tf");
      });
      tfList.appendChild(row);
    });
    openModal(tfModal);
  }

  // =========================
  // Market toggle
  // =========================
  function toggleMarket(){
    marketValue.textContent = (marketValue.textContent === "OTC") ? "Market" : "OTC";
    rebuildMarket("market");
  }

  // =========================
  // Random signal + countdown
  // =========================
  function setSignal(text, isUp){
    dirText.textContent = text;
    if (isUp) {
      dirArrow.textContent = "↗";
      dirArrow.classList.remove("down");
      dirText.classList.remove("down");
      dirArrow.classList.add("up");
      dirText.classList.add("up");
    } else {
      dirArrow.textContent = "↘";
      dirArrow.classList.remove("up");
      dirText.classList.remove("up");
      dirArrow.classList.add("down");
      dirText.classList.add("down");
    }
  }

  function startCountdown(tf){
    const secs = TF_SECONDS[tf] ?? 30;
    countdownRemaining = secs;

    if (countdownInterval) clearInterval(countdownInterval);
    const render = () => {
      const m = Math.floor(countdownRemaining / 60);
      const s = countdownRemaining % 60;
      rUntil.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    };

    render();
    countdownInterval = setInterval(() => {
      countdownRemaining--;
      render();
      if (countdownRemaining <= 0){
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  // =========================
  // “TradingView-like” chart engine (no libs)
  // =========================
  function hashSeed(str){
    let h = 2166136261;
    for (let i=0; i<str.length; i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0);
  }

  function mulberry32(a){
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeSeriesKey(){
    return `${assetValue.textContent}|${marketValue.textContent}|${tfValue.textContent}`;
  }

  function genInitialCandles(count=120){
    const key = makeSeriesKey();
    const rnd = mulberry32(hashSeed(key));

    const base = 1.0 + rnd()*2.0;  // just pseudo-scale
    let price = base;

    const series = [];
    for (let i=0; i<count; i++){
      const vol = 0.002 + rnd()*0.006;
      const drift = (rnd()-0.5) * vol;

      const open = price;
      const close = open * (1 + drift);

      const wick = vol * (0.6 + rnd()*1.6);
      const high = Math.max(open, close) * (1 + wick);
      const low  = Math.min(open, close) * (1 - wick);

      series.push({ open, high, low, close, t: Date.now() - (count-i)*1000 });
      price = close;
    }
    return series;
  }

  function rebuildMarket(reason){
    // reset crosshair and timers, rebuild candles and re-render
    cross.on = false;

    candleSeries = genInitialCandles(140);
    lastTickTs = Date.now();

    // reset metrics on param change
    chipQuality.textContent = t("chart_quality");
    chipConf.textContent = t("chart_conf");
    rAcc.textContent = "—%";
    volFactor.textContent = "—";
    momFactor.textContent = "—";
    liqFactor.textContent = "—";

    // update window label + reset timer label to TF
    rWindow.textContent = tfValue.textContent || "30s";
    startCountdown(tfValue.textContent || "30s");

    drawAll();
    log("rebuildMarket:", reason, makeSeriesKey());
  }

  function nextCandle(){
    // generate next candle based on last
    const key = makeSeriesKey();
    const rnd = mulberry32(hashSeed(key + "|" + String(Date.now()).slice(0,8)));

    const last = candleSeries[candleSeries.length - 1] || { close: 1.0 };
    const tf = tfValue.textContent || "30s";
    const tfSec = TF_SECONDS[tf] ?? 30;

    // volatility depends on tf
    const baseVol = Math.min(0.02, 0.002 + tfSec/6000);
    const vol = baseVol * (0.7 + rnd()*1.0);

    const open = last.close;
    const drift = (rnd()-0.5) * vol;
    const close = open * (1 + drift);

    const wick = vol * (0.6 + rnd()*1.8);
    const high = Math.max(open, close) * (1 + wick);
    const low  = Math.min(open, close) * (1 - wick);

    candleSeries.push({ open, high, low, close, t: Date.now() });
    if (candleSeries.length > 180) candleSeries.shift();
  }

  function startLive(){
    stopLive();

    // Add a new candle every ~1.1s for live feel (visual, not real market feed)
    liveTimer = setInterval(() => {
      nextCandle();
    }, 1100);

    const loop = () => {
      drawAll();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  function stopLive(){
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function drawAll(){
    drawMainChart();
    drawMiniChart();
  }

  function drawMainChart(){
    if (!chart) return;
    const ctx = chart.getContext("2d");
    const w = chart.width, h = chart.height;

    // background
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, "rgba(14,22,36,0.95)");
    g.addColorStop(1, "rgba(7,10,18,0.95)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // subtle “mountain” feel (procedural)
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "rgba(70,100,140,0.20)";
    ctx.beginPath();
    ctx.moveTo(0, h*0.55);
    for (let x=0; x<=w; x+=18){
      const y = h*0.55 + Math.sin((x/w)*6.2 + 1.3)*24 + Math.sin((x/w)*14.2)*10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // grid
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    const gx = 46, gy = 42;
    for (let x=0; x<w; x+=gx){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y=0; y<h; y+=gy){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.globalAlpha = 1;

    if (!candleSeries.length) return;

    // scale
    const visible = candleSeries.slice(-90);
    let min = Infinity, max = -Infinity;
    for (const c of visible){
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    const pad = (max-min)*0.08 || 1;
    min -= pad; max += pad;

    const toY = (p) => {
      const t = (p - min) / (max - min);
      return h - (t*h);
    };

    // right price axis labels (minimal)
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = "12px -apple-system, system-ui, Segoe UI, Roboto, Arial";
    const ticks = 5;
    for (let i=0;i<=ticks;i++){
      const p = min + (i/ticks)*(max-min);
      const y = toY(p);
      ctx.fillText(p.toFixed(5), w-88, y-4);
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "rgba(255,255,255,.25)";
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
      ctx.globalAlpha = 0.65;
    }
    ctx.globalAlpha = 1;

    // candles
    const n = visible.length;
    const cw = Math.max(6, Math.floor((w-20)/n));
    const startX = w - (n*cw) - 10;

    for (let i=0;i<n;i++){
      const c = visible[i];
      const x = startX + i*cw;

      const yO = toY(c.open);
      const yC = toY(c.close);
      const yH = toY(c.high);
      const yL = toY(c.low);

      const up = c.close >= c.open;

      // wick
      ctx.strokeStyle = "rgba(255,255,255,.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + cw*0.5, yH);
      ctx.lineTo(x + cw*0.5, yL);
      ctx.stroke();

      // body
      const bodyTop = Math.min(yO,yC);
      const bodyBot = Math.max(yO,yC);
      const bw = Math.max(5, cw-10);

      ctx.fillStyle = up ? "rgba(119,243,178,.22)" : "rgba(255,90,110,.18)";
      ctx.strokeStyle = up ? "rgba(119,243,178,.55)" : "rgba(255,90,110,.48)";
      ctx.lineWidth = 2;

      ctx.fillRect(x + (cw-bw)/2, bodyTop, bw, Math.max(6, bodyBot-bodyTop));
      ctx.strokeRect(x + (cw-bw)/2, bodyTop, bw, Math.max(6, bodyBot-bodyTop));
    }

    // last price marker
    const last = visible[visible.length-1];
    const lastY = toY(last.close);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(110,170,255,.20)";
    ctx.fillRect(w-120, lastY-14, 120, 28);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fillText(last.close.toFixed(5), w-110, lastY+5);

    // crosshair
    if (cross.on){
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "rgba(180,200,255,.55)";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(cross.x, 0); ctx.lineTo(cross.x, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, cross.y); ctx.lineTo(w, cross.y);
      ctx.stroke();

      // value at cross y
      const p = min + (1 - cross.y/h)*(max-min);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(w-120, cross.y-14, 120, 28);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.globalAlpha = 1;
      ctx.fillText(p.toFixed(5), w-110, cross.y+5);
    }
  }

  function drawMiniChart(){
    if (!signalChart) return;
    const ctx = signalChart.getContext("2d");
    const w = signalChart.width, h = signalChart.height;

    // background
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, "rgba(10,14,22,0.92)");
    g.addColorStop(1, "rgba(6,8,14,0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // grid
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    for (let x=0; x<w; x+=52){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y=0; y<h; y+=44){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.globalAlpha = 1;

    const visible = candleSeries.slice(-60);
    if (visible.length < 2) return;

    const closes = visible.map(c => c.close);
    let min = Math.min(...closes);
    let max = Math.max(...closes);
    const pad = (max-min)*0.10 || 1;
    min -= pad; max += pad;

    const toY = (p) => {
      const t = (p - min) / (max - min);
      return h - (t*h);
    };

    // glow line
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(140,180,255,.14)";
    ctx.beginPath();
    for (let i=0;i<closes.length;i++){
      const x = (i/(closes.length-1))*(w-20)+10;
      const y = toY(closes[i]);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();

    // main line
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(200,220,255,.88)";
    ctx.beginPath();
    for (let i=0;i<closes.length;i++){
      const x = (i/(closes.length-1))*(w-20)+10;
      const y = toY(closes[i]);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  // =========================
  // Analysis (ABSOLUTE RANDOM)
  // =========================
  async function runAnalysis(){
    const tf = tfValue.textContent || "30s";

    // overlay progress
    const dur = 550 + Math.floor(Math.random()*900);
    show(chartOverlay);
    overlayFill.style.width = "0%";

    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(100, Math.floor(((Date.now()-start)/dur)*100));
      overlayFill.style.width = p + "%";
      if (p >= 100) clearInterval(tick);
    }, 50);

    await new Promise(r => setTimeout(r, dur));
    hide(chartOverlay);

    // ABSOLUTE RANDOM direction
    const isLong = Math.random() < 0.5;
    setSignal(isLong ? "LONG-TREND" : "SHORT-TREND", isLong);

    // metrics
    const quality = 72 + Math.floor(Math.random() * 18);
    const conf = 60 + Math.floor(Math.random() * 30);

    chipQuality.textContent = `Quality: ${quality}`;
    chipConf.textContent = `Conf: ${conf}`;

    rAcc.textContent = `${quality}%`;
    volFactor.textContent = ["Low","Mid","High"][Math.floor(Math.random()*3)];
    momFactor.textContent = ["Soft","Stable","Strong"][Math.floor(Math.random()*3)];
    liqFactor.textContent = ["Thin","Normal","Deep"][Math.floor(Math.random()*3)];

    // window + countdown timer
    rWindow.textContent = tf;
    startCountdown(tf);

    // add a small bias to series (feels responsive to signal)
    // push few candles to reflect direction quickly
    for (let i=0;i<3;i++){
      const last = candleSeries[candleSeries.length-1];
      if (!last) break;
      const bias = isLong ? 1 : -1;
      const bump = 1 + bias * 0.0025;
      last.close *= bump;
      last.high = Math.max(last.high, last.close);
      last.low  = Math.min(last.low, last.close);
      nextCandle();
    }
  }

  // =========================
  // Menu (⋯) — работает
  // =========================
  function openMenu(){
    // Using notify as premium menu popup
    notifyPopup(
      "MENU",
      `Asset: ${assetValue.textContent}\nTF: ${tfValue.textContent}\nMarket: ${marketValue.textContent}`,
      "Open registration",
      () => openURL(CONFIG.REG_URL)
    );

    // add 2 extra actions via Telegram popup if available
    try {
      if (tg?.showPopup){
        tg.showPopup({
          title: "CRAFT MENU",
          message: "Choose action",
          buttons: [
            { id:"reg", type:"default", text:"Registration" },
            { id:"dep", type:"default", text:"Deposit" },
            { id:"rep", type:"default", text:"Report" },
            { type:"close" }
          ]
        }, (btnId) => {
          if (btnId === "reg") openURL(CONFIG.REG_URL);
          if (btnId === "dep") openURL(CONFIG.DEPOSIT_URL);
          if (btnId === "rep") openURL(CONFIG.REPORT_URL);
        });
        // close notify (avoid double)
        hide(notify);
        return;
      }
    } catch {}
  }

  // =========================
  // Crosshair interaction
  // =========================
  function bindCrosshair(){
    if (!chart) return;

    const rectOf = () => chart.getBoundingClientRect();

    const set = (clientX, clientY) => {
      const r = rectOf();
      const x = (clientX - r.left) * (chart.width / r.width);
      const y = (clientY - r.top)  * (chart.height / r.height);
      cross.on = true;
      cross.x = Math.max(0, Math.min(chart.width, x));
      cross.y = Math.max(0, Math.min(chart.height, y));
    };

    const off = () => { cross.on = false; };

    chart.addEventListener("mousemove", (e) => set(e.clientX, e.clientY));
    chart.addEventListener("mouseleave", off);

    chart.addEventListener("touchstart", (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      set(t.clientX, t.clientY);
    }, { passive:true });

    chart.addEventListener("touchmove", (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      set(t.clientX, t.clientY);
    }, { passive:true });

    chart.addEventListener("touchend", off, { passive:true });
  }

  // =========================
  // Events
  // =========================
  btnOpenReg.addEventListener("click", () => openURL(CONFIG.REG_URL));
  btnGetAccess.addEventListener("click", () => enterApp());

  btnLangGate.addEventListener("click", openLangModal);
  btnLangApp.addEventListener("click", openLangModal);

  btnMenu.addEventListener("click", openMenu);

  btnNotifyClose.addEventListener("click", () => hide(notify));

  btnCheckStatus.addEventListener("click", () => {
    // no auth gating (по твоему требованию)
    notifyPopup(
      "STATUS",
      "Terminal is running.\nRealtime render: ON",
      "Open report",
      () => openURL(CONFIG.REPORT_URL)
    );
  });

  btnReset.addEventListener("click", () => {
    chipQuality.textContent = t("chart_quality");
    chipConf.textContent = t("chart_conf");
    rAcc.textContent = "—%";
    volFactor.textContent = "—";
    momFactor.textContent = "—";
    liqFactor.textContent = "—";
    setSignal("LONG-TREND", true);
    rebuildMarket("reset");
  });

  // SINGLE button: ABSOLUTE RANDOM
  btnAnalyze.addEventListener("click", runAnalysis);

  assetBtn.addEventListener("click", openAssets);
  tfBtn.addEventListener("click", openTF);
  marketBtn.addEventListener("click", toggleMarket);

  backdrop.addEventListener("click", () => {
    closeModal(assetsModal);
    closeModal(tfModal);
    closeModal(langModal);
  });
  closeAssets.addEventListener("click", () => closeModal(assetsModal));
  closeTf.addEventListener("click", () => closeModal(tfModal));
  closeLang.addEventListener("click", () => closeModal(langModal));

  // =========================
  // Boot
  // =========================
  (async function boot(){
    applyI18n();

    // Load assets/timeframes
    await loadAssetsJson();

    // defaults
    if (!tfValue.textContent) tfValue.textContent = "30s";
    if (!assetValue.textContent) assetValue.textContent = "EUR/USD";
    if (!marketValue.textContent) marketValue.textContent = "OTC";

    setSignal("LONG-TREND", true);
    startCountdown(tfValue.textContent);

    // gate status
    if (gateStatusText) gateStatusText.textContent = t("gate_status_ok");

    // click safety crosshair
    bindCrosshair();

    // show gate first
    show(gate); hide(app);

    // if user opens directly inside TG, still fine
    // do nothing else until user taps “Get access”
  })();

})();
