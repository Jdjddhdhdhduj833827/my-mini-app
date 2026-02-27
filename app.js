const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
}

const tgId = tg?.initDataUnsafe?.user?.id;
console.log("TG ID:", tgId);
const API_BASE = "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev";
(() => {
  "use strict";

  /* =========================
     Ultra Helpers
  ========================== */
  const $ = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pad2 = (n) => String(n).padStart(2, "0");

  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt || { passive: true });
  const once = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, { ...(opt || {}), once: true });

  const now = () => performance.now();
  const raf = (fn) => requestAnimationFrame(fn);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* =========================
     Telegram WebApp (safe)
  ========================== */
  const tg = window.Telegram?.WebApp || null;
  try { tg?.ready(); tg?.expand(); } catch {}

  const haptic = (type = "light") => {
    try { tg?.HapticFeedback?.impactOccurred?.(type); } catch {}
  };

  // BackButton close modals
  const tgBackShow = () => { try { tg?.BackButton?.show?.(); } catch {} };
  const tgBackHide = () => { try { tg?.BackButton?.hide?.(); } catch {} };

  /* =========================
     Config
  ========================== */
 const REG_LINK = "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50";
  const MARKETS = ["OTC", "REAL"];

  const TIMEFRAMES = [
    { label: "10s", seconds: 10 },
    { label: "15s", seconds: 15 },
    { label: "30s", seconds: 30 },
    { label: "1m", seconds: 60 },
    { label: "3m", seconds: 180 },
    { label: "5m", seconds: 300 }
  ];

  const LANGS = [
    { code: "ru", name: "Русский" },
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "tr", name: "Türkçe" }
  ];

  const T = {
    ru: {
      gateTitle: "Доступ к интерфейсу",
      gateText:
        "CRAFT ANALYTICS — бесплатный интерфейс. Чтобы открыть доступ, зарегистрируйтесь по ссылке (ты вставишь её сам), затем вернитесь и нажмите “Открыть интерфейс”.",
      btnOpenLink: "Открыть ссылку регистрации",
      chkText: "Я зарегистрировался",
      btnEnter: "Открыть интерфейс",
      subTitle: "AI Market Scanner",
      hint: "Нажмите “Запустить анализ” — и получите результат.",
      reset: "Сброс",
      analyze: "Запустить анализ",
      systemReady: "SYSTEM READY",
      analyzing: "ANALYZING LIQUIDITY…",
      signalReady: "SIGNAL READY",
      overlay0: "Collecting market micro-signals…",
      overlay1: "Analyzing liquidity & momentum…",
      overlay2: "Building entry probability…",
      overlay3: "Final calibration & execution window…",
      untilWord: "до",
      modalAssets: "Выбор актива",
      modalTf: "Выбор таймфрейма",
      modalLang: "Язык интерфейса",
      searchPh: "Поиск…",
      favorites: "FAVORITES",
      recent: "RECENT",
      all: "ALL"
    },
    en: {
      gateTitle: "Access required",
      gateText:
        "CRAFT ANALYTICS is free. Open the registration link (you will add it), then return and press “Open interface”.",
      btnOpenLink: "Open registration link",
      chkText: "I registered",
      btnEnter: "Open interface",
      subTitle: "AI Market Scanner",
      hint: "Press “Start analysis” to generate a result.",
      reset: "Reset",
      analyze: "Start analysis",
      systemReady: "SYSTEM READY",
      analyzing: "ANALYZING LIQUIDITY…",
      signalReady: "SIGNAL READY",
      overlay0: "Collecting market micro-signals…",
      overlay1: "Analyzing liquidity & momentum…",
      overlay2: "Building entry probability…",
      overlay3: "Final calibration & execution window…",
      untilWord: "until",
      modalAssets: "Select asset",
      modalTf: "Select timeframe",
      modalLang: "Interface language",
      searchPh: "Search…",
      favorites: "FAVORITES",
      recent: "RECENT",
      all: "ALL"
    },
    es: {
      gateTitle: "Acceso requerido",
      gateText:
        "CRAFT ANALYTICS es gratis. Abre el enlace de registro (lo añadirás), vuelve y pulsa “Abrir interfaz”.",
      btnOpenLink: "Abrir enlace de registro",
      chkText: "Ya me registré",
      btnEnter: "Abrir interfaz",
      subTitle: "AI Market Scanner",
      hint: "Pulsa “Iniciar análisis” para generar resultado.",
      reset: "Reiniciar",
      analyze: "Iniciar análisis",
      systemReady: "SYSTEM READY",
      analyzing: "ANALYZING LIQUIDITY…",
      signalReady: "SIGNAL READY",
      overlay0: "Collecting market micro-signals…",
      overlay1: "Analyzing liquidity & momentum…",
      overlay2: "Building entry probability…",
      overlay3: "Final calibration & execution window…",
      untilWord: "hasta",
      modalAssets: "Seleccionar activo",
      modalTf: "Seleccionar marco temporal",
      modalLang: "Idioma",
      searchPh: "Buscar…",
      favorites: "FAVORITES",
      recent: "RECENT",
      all: "ALL"
    },
    tr: {
      gateTitle: "Erişim gerekli",
      gateText:
        "CRAFT ANALYTICS ücretsizdir. Kayıt bağlantısını aç (sen ekleyeceksin), geri dön ve “Arayüzü aç”a bas.",
      btnOpenLink: "Kayıt bağlantısını aç",
      chkText: "Kayıt oldum",
      btnEnter: "Arayüzü aç",
      subTitle: "AI Market Scanner",
      hint: "Sonuç için “Analizi başlat”a bas.",
      reset: "Sıfırla",
      analyze: "Analizi başlat",
      systemReady: "SYSTEM READY",
      analyzing: "ANALYZING LIQUIDITY…",
      signalReady: "SIGNAL READY",
      overlay0: "Collecting market micro-signals…",
      overlay1: "Analyzing liquidity & momentum…",
      overlay2: "Building entry probability…",
      overlay3: "Final calibration & execution window…",
      untilWord: "kadar",
      modalAssets: "Varlık seç",
      modalTf: "Zaman dilimi seç",
      modalLang: "Dil",
      searchPh: "Ara…",
      favorites: "FAVORITES",
      recent: "RECENT",
      all: "ALL"
    }
  };

  /* =========================
     State (persisted)
  ========================== */
  const store = {
    get(k, d=null){ try{ const v = localStorage.getItem(k); return v==null?d:v; }catch{ return d; } },
    set(k, v){ try{ localStorage.setItem(k, String(v)); }catch{} },
    del(k){ try{ localStorage.removeItem(k); }catch{} },
    jget(k, d=null){ try{ const v = localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } },
    jset(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
  };

  let lang = store.get("ca_lang", "ru");
  if (!T[lang]) lang = "ru";

  // auto-language from Telegram user (only if not set)
  try {
    const uLang = tg?.initDataUnsafe?.user?.language_code;
    if (!store.get("ca_lang", null) && uLang) {
      const pick = ["ru","en","es","tr"].includes(uLang) ? uLang : "en";
      lang = pick;
      store.set("ca_lang", lang);
    }
  } catch {}

  let selectedAsset = store.get("ca_asset", "EUR/USD");
  let selectedMarket = store.get("ca_market", "OTC");
  if (!MARKETS.includes(selectedMarket)) selectedMarket = "OTC";

  const tfSaved = store.get("ca_tf", "30s");
  let selectedTf = TIMEFRAMES.find(t => t.label === tfSaved) || TIMEFRAMES[2];

  let assets = [];
  let activeCategory = "all";
  let favorites = new Set(store.jget("ca_favs", []));
  let recent = store.jget("ca_recent", []);

  /* =========================
     Elements (safe, may be missing)
  ========================== */
  const gate = $("gate");
  const app = $("app");
  const btnOpenLink = $("btnOpenLink");
  const btnEnter = $("btnEnter");
  const chkRegistered = $("chkRegistered");

  const btnLang = $("btnLang");
  const btnMenu = $("btnMenu");

  const assetBtn = $("assetBtn");
  const assetValue = $("assetValue");
  const assetBadge = $("assetBadge");

  const tfBtn = $("tfBtn");
  const tfValue = $("tfValue");

  const marketBtn = $("marketBtn");
  const marketValue = $("marketValue");

  const btnAnalyze = $("btnAnalyze");
  const analyzeText = $("analyzeText");
  const btnReset = $("btnReset");

  const holoFill = $("holoFill");
  const holoText = $("holoText");
  const analyzingLine = $("analyzingLine");
  const analyzingText = $("analyzingText");

  const chartWrap = $("chartWrap");
  const canvas = $("chart");
  const ctx = canvas?.getContext?.("2d") || null;
  const chartOverlay = $("chartOverlay");
  const overlayFill = $("overlayFill");
  const overlayLine = $("overlayLine");

  const volFactor = $("volFactor");
  const momFactor = $("momFactor");
  const strFactor = $("strFactor");
  const liqFactor = $("liqFactor");

  const resultPanel = $("resultPanel");
  const rAsset = $("rAsset");
  const rTf = $("rTf");
  const rAcc = $("rAcc");
  const dirDot = $("dirDot");
  const dirText = $("dirText");
  const dirUntil = $("dirUntil");
  const rUntil = $("rUntil");
  const progressBar = $("progressBar");
  const timerText = $("timerText");

  const backdrop = $("backdrop");

  const assetsModal = $("assetsModal");
  const assetSearch = $("assetSearch");
  const assetTabs = $("assetTabs");
  const assetList = $("assetList");
  const closeAssets = $("closeAssets");

  const tfModal = $("tfModal");
  const tfList = $("tfList");
  const closeTf = $("closeTf");

  const langModal = $("langModal");
  const langList = $("langList");
  const closeLang = $("closeLang");

  const scanSfx = $("scanSfx");

  /* =========================
     Ultra UX: scroll lock + input focus
  ========================== */
  const lockScroll = (lock) => {
    const v = lock ? "hidden" : "";
    document.documentElement.style.overflow = v;
    document.body.style.overflow = v;
    document.body.style.touchAction = lock ? "none" : "";
  };

  const focusInput = (el) => {
    if (!el) return;
    raf(() => setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch { try { el.focus(); } catch {} }
      try { el.click(); } catch {}
    }, 60));
  };

  /* =========================
     Audio unlock (iOS)
  ========================== */
  let audioUnlocked = false;

  const unlockAudioOnce = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;

    try {
      if (scanSfx) {
        scanSfx.muted = true;
        scanSfx.currentTime = 0;
        scanSfx.play().catch(() => {});
        setTimeout(() => { try { scanSfx.pause(); scanSfx.muted = false; } catch {} }, 120);
      }
    } catch {}

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ac = new AC();
        ac.resume().catch(()=>{});
        setTimeout(() => ac.close().catch(()=>{}), 250);
      }
    } catch {}
  };

  ["click","touchstart"].forEach(ev => {
    window.addEventListener(ev, unlockAudioOnce, { once: true, passive: true });
  });

  /* =========================
     Telemetry-like premium terminal log (UI only)
  ========================== */
  let logBox = null;
  function ensureLogPanel(){
    if (logBox) return logBox;
    const host = qs(".panelChart") || chartWrap?.parentElement || document.body;
    logBox = qs("#aiLog");
    if (logBox) return logBox;

    logBox = document.createElement("div");
    logBox.id = "aiLog";
    logBox.style.marginTop = "10px";
    logBox.style.border = "1px solid rgba(255,255,255,.10)";
    logBox.style.background = "rgba(255,255,255,.05)";
    logBox.style.borderRadius = "16px";
    logBox.style.padding = "10px 12px";
    logBox.style.boxShadow = "0 12px 32px rgba(0,0,0,.22)";
    logBox.style.maxHeight = "140px";
    logBox.style.overflow = "auto";
    logBox.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    logBox.style.fontSize = "12px";
    logBox.style.color = "rgba(255,255,255,.82)";
    logBox.style.letterSpacing = ".04em";
    logBox.style.display = "none";

    const title = document.createElement("div");
    title.textContent = "AI TERMINAL";
    title.style.fontWeight = "900";
    title.style.letterSpacing = ".20em";
    title.style.opacity = ".85";
    title.style.marginBottom = "6px";

    const list = document.createElement("div");
    list.id = "aiLogList";
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "4px";

    logBox.appendChild(title);
    logBox.appendChild(list);
    host.appendChild(logBox);

    return logBox;
  }

  function logLine(text){
    const box = ensureLogPanel();
    const list = qs("#aiLogList", box);
    if (!list) return;

    box.style.display = "block";

    const row = document.createElement("div");
    const ts = new Date();
    row.textContent = `[${pad2(ts.getHours())}:${pad2(ts.getMinutes())}:${pad2(ts.getSeconds())}] ${text}`;
    row.style.opacity = "0.92";
    list.appendChild(row);

    // keep last 24
    while (list.children.length > 24) list.removeChild(list.firstChild);
    box.scrollTop = box.scrollHeight;
  }

  function clearLog(){
    const box = ensureLogPanel();
    const list = qs("#aiLogList", box);
    if (list) list.innerHTML = "";
    if (box) box.style.display = "none";
  }

  /* =========================
     Chart: Retina + smooth animation loop
  ========================== */
  let series = [];
  let chartTimer = null;
  let chartRAF = null;
  let chartW = 0, chartH = 0, dpr = 1;

  function rngSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function resizeCanvas(){
    if (!canvas || !ctx) return;
    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

    // Use CSS size, then scale backing store
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.floor(rect.width));
    const h = Math.max(160, Math.floor(rect.height));

    if (w === chartW && h === chartH) return;

    chartW = w; chartH = h;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawChart();
  }

  function ensureScanline(){
    if (!chartWrap) return;
    if (qs(".scanline", chartWrap)) return;
    const s = document.createElement("div");
    s.className = "scanline";
    chartWrap.appendChild(s);
  }

  function seedChart() {
    if (!ctx || !canvas) return;
    ensureScanline();

    const seed = rngSeed(selectedAsset + "|" + selectedMarket);
    let x = (seed % 1000) / 1000;

    series = [];
    let v = 100 + x * 8;

    for (let i = 0; i < 140; i++) {
      const n =
        Math.sin(i / 8 + x * 4) * 0.35 +
        Math.cos(i / 22) * 0.20 +
        ((seed % (i + 11)) / 5200 - 0.09);
      v += n;
      series.push(v);
    }

    // smooth incoming ticks
    if (chartTimer) clearInterval(chartTimer);
    chartTimer = setInterval(() => {
      const last = series[series.length - 1] || 100;
      const drift = (Math.random() - 0.5) * 0.55;
      const next = last + drift;
      series.push(next);
      if (series.length > 180) series.shift();
    }, 380);

    // draw loop
    if (chartRAF) cancelAnimationFrame(chartRAF);
    const loop = () => {
      drawChart();
      chartRAF = requestAnimationFrame(loop);
    };
    loop();
  }

  function drawChart() {
    if (!ctx || !canvas || !series.length) return;

    const w = chartW || canvas.getBoundingClientRect().width || 320;
    const h = chartH || canvas.getBoundingClientRect().height || 200;

    ctx.clearRect(0, 0, w, h);

    // background (premium)
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "rgba(124,92,255,0.14)");
    bg.addColorStop(1, "rgba(0,178,255,0.03)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const min = Math.min(...series);
    const max = Math.max(...series);
    const padX = 20;
    const padY = 16;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    // gradient line
    const grad = ctx.createLinearGradient(padX, 0, w - padX, 0);
    grad.addColorStop(0, "rgba(124,92,255,0.95)");
    grad.addColorStop(1, "rgba(0,178,255,0.82)");

    // glow pass
    ctx.save();
    ctx.shadowColor = "rgba(124,92,255,0.55)";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = grad;

    ctx.beginPath();
    for (let i = 0; i < series.length; i++) {
      const v = series[i];
      const x = padX + (i / (series.length - 1)) * plotW;
      const y = padY + (1 - (v - min) / (max - min + 1e-6)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // fill under curve
    const fill = ctx.createLinearGradient(0, padY, 0, h - padY);
    fill.addColorStop(0, "rgba(124,92,255,0.16)");
    fill.addColorStop(1, "rgba(0,178,255,0.01)");
    ctx.fillStyle = fill;

    ctx.beginPath();
    for (let i = 0; i < series.length; i++) {
      const v = series[i];
      const x = padX + (i / (series.length - 1)) * plotW;
      const y = padY + (1 - (v - min) / (max - min + 1e-6)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w - padX, h - padY);
    ctx.lineTo(padX, h - padY);
    ctx.closePath();
    ctx.fill();

    // last point highlight
    const lastV = series[series.length - 1];
    const lx = padX + plotW;
    const ly = padY + (1 - (lastV - min) / (max - min + 1e-6)) * plotH;

    ctx.save();
    ctx.shadowColor = "rgba(0,178,255,0.35)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(lx, ly, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* =========================
     Assets: load + virtualization for massive lists
  ========================== */
  function catLabel(cat){
    const map = { all:T[lang].all, forex:"FOREX", crypto:"CRYPTO", stocks:"STOCKS", indices:"INDICES", commodities:"COMMODITIES", otc:"OTC", favorites:T[lang].favorites, recent:T[lang].recent };
    return map[cat] || String(cat||"").toUpperCase();
  }
  function badgeForCategory(cat){
    if (cat === "crypto") return "₿";
    if (cat === "stocks") return "📈";
    if (cat === "indices") return "🧭";
    if (cat === "commodities") return "⛏";
    if (cat === "otc") return "🌙";
    return "🌍";
  }

  async function loadAssets(){
    try{
      const res = await fetch("./assets.json", { cache: "no-store" });
      if (!res.ok) throw new Error("assets.json missing");
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error("assets.json invalid");
      assets = data.map(a => ({
        symbol: String(a.symbol || a.pair || a.ticker || "").trim(),
        category: String(a.category || "all").trim().toLowerCase(),
        label: String(a.label || a.name || a.symbol || "").trim()
      })).filter(a => a.symbol);
      return;
    } catch {
      assets = [
        { symbol:"EUR/USD", category:"forex", label:"EUR/USD" },
        { symbol:"GBP/USD", category:"forex", label:"GBP/USD" },
        { symbol:"USD/JPY", category:"forex", label:"USD/JPY" },
        { symbol:"AUD/USD", category:"forex", label:"AUD/USD" },
        { symbol:"XAU/USD", category:"commodities", label:"Gold" },
        { symbol:"BTC/USDT", category:"crypto", label:"Bitcoin" },
        { symbol:"ETH/USDT", category:"crypto", label:"Ethereum" },
        { symbol:"AAPL", category:"stocks", label:"Apple" },
        { symbol:"TSLA", category:"stocks", label:"Tesla" },
        { symbol:"US500", category:"indices", label:"S&P 500" },
        { symbol:"EUR/USD OTC", category:"otc", label:"EUR/USD OTC" }
      ];
    }
  }

  function updateRecent(symbol){
    recent = recent.filter(x => x !== symbol);
    recent.unshift(symbol);
    recent = recent.slice(0, 10);
    store.jset("ca_recent", recent);
  }

  function toggleFavorite(symbol){
    if (favorites.has(symbol)) favorites.delete(symbol);
    else favorites.add(symbol);
    store.jset("ca_favs", Array.from(favorites));
  }

  function buildAssetTabs(){
    if (!assetTabs) return;

    const cats = new Set(assets.map(a => a.category));
    const ordered = ["favorites","recent","all",
      ...["forex","crypto","stocks","indices","commodities","otc"].filter(c=>cats.has(c)),
      ...Array.from(cats).filter(c => !["forex","crypto","stocks","indices","commodities","otc"].includes(c))
    ];

    assetTabs.innerHTML = "";
    ordered.forEach(c => {
      const b = document.createElement("button");
      b.className = "tab" + (c === activeCategory ? " active" : "");
      b.textContent = catLabel(c);
      b.addEventListener("click", () => {
        haptic("light");
        activeCategory = c;
        buildAssetTabs();
        renderAssetList(true);
      });
      assetTabs.appendChild(b);
    });
  }

  function getFilteredAssets(){
    const q = (assetSearch?.value || "").toLowerCase().trim();

    let base = assets.slice();

    if (activeCategory === "favorites") base = base.filter(a => favorites.has(a.symbol));
    else if (activeCategory === "recent") base = base.filter(a => recent.includes(a.symbol)).sort((a,b)=> recent.indexOf(a.symbol) - recent.indexOf(b.symbol));
    else if (activeCategory !== "all") base = base.filter(a => a.category === activeCategory);

    if (q){
      // lightweight fuzzy
      base = base.filter(a =>
        a.symbol.toLowerCase().includes(q) ||
        (a.label||"").toLowerCase().includes(q)
      );
    }

    return base;
  }

  // Virtualized render for performance
  let vState = { list: [], start: 0, end: 0, rowH: 56, buffer: 10 };
  function renderAssetList(resetScroll=false){
    if (!assetList) return;
    vState.list = getFilteredAssets();

    if (resetScroll) assetList.scrollTop = 0;

    // If list small: render all
    if (vState.list.length <= 120) {
      assetList.innerHTML = "";
      vState.list.forEach(a => assetList.appendChild(assetRow(a)));
      return;
    }

    // Virtual container
    assetList.innerHTML = "";
    const spacerTop = document.createElement("div");
    const spacerBot = document.createElement("div");
    spacerTop.style.height = "0px";
    spacerBot.style.height = `${vState.list.length * vState.rowH}px`;
    assetList.appendChild(spacerTop);
    assetList.appendChild(spacerBot);

    const renderWindow = () => {
      const scrollTop = assetList.scrollTop;
      const viewH = assetList.clientHeight;
      const first = Math.floor(scrollTop / vState.rowH);
      const start = clamp(first - vState.buffer, 0, vState.list.length);
      const visible = Math.ceil(viewH / vState.rowH) + vState.buffer * 2;
      const end = clamp(start + visible, 0, vState.list.length);

      if (start === vState.start && end === vState.end) return;
      vState.start = start; vState.end = end;

      // rebuild
      assetList.innerHTML = "";
      const top = document.createElement("div");
      top.style.height = `${start * vState.rowH}px`;

      const mid = document.createDocumentFragment();
      for (let i = start; i < end; i++) mid.appendChild(assetRow(vState.list[i]));

      const bot = document.createElement("div");
      bot.style.height = `${(vState.list.length - end) * vState.rowH}px`;

      assetList.appendChild(top);
      assetList.appendChild(mid);
      assetList.appendChild(bot);
    };

    renderWindow();
    assetList.onscroll = () => renderWindow();
  }

  function assetRow(a){
    const row = document.createElement("div");
    row.className = "item";

    const fav = favorites.has(a.symbol);
    row.innerHTML = `
      <div class="itemLeft">
        <div class="itemSym">${escapeHtml(a.symbol)}</div>
        <div class="itemCat">${escapeHtml(catLabel(a.category))}${a.label && a.label !== a.symbol ? " • " + escapeHtml(a.label) : ""}</div>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <button class="iconBtn" style="height:30px; min-width:30px; border-radius:12px;" aria-label="fav">${fav ? "★" : "☆"}</button>
        <div class="chev">→</div>
      </div>
    `;

    const favBtn = qs("button", row);
    favBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      haptic("light");
      toggleFavorite(a.symbol);
      // refresh single icon
      favBtn.textContent = favorites.has(a.symbol) ? "★" : "☆";
    });

    row.addEventListener("click", () => {
      haptic("medium");
      selectedAsset = a.symbol;
      store.set("ca_asset", selectedAsset);
      updateRecent(selectedAsset);

      if (assetValue) assetValue.textContent = selectedAsset;
      if (assetBadge) assetBadge.textContent = badgeForCategory(a.category);

      closeModal(assetsModal);
      seedChart();
    });

    return row;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  /* =========================
     Timeframes & Language lists
  ========================== */
  function renderTfList(){
    if (!tfList) return;
    tfList.innerHTML = "";
    TIMEFRAMES.forEach(t => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="itemLeft">
          <div class="itemSym">${escapeHtml(t.label)}</div>
          <div class="itemCat">${t.seconds} sec</div>
        </div>
        <div class="chev">→</div>
      `;
      row.addEventListener("click", () => {
        haptic("medium");
        selectedTf = t;
        store.set("ca_tf", t.label);
        if (tfValue) tfValue.textContent = t.label;
        closeModal(tfModal);
      });
      tfList.appendChild(row);
    });
  }

  function renderLangList(){
    if (!langList) return;
    langList.innerHTML = "";
    LANGS.forEach(l => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="itemLeft">
          <div class="itemSym">${escapeHtml(l.name)}</div>
          <div class="itemCat">${l.code.toUpperCase()}</div>
        </div>
        <div class="chev">→</div>
      `;
      row.addEventListener("click", () => {
        haptic("light");
        lang = l.code;
        store.set("ca_lang", lang);
        applyLang();
        closeModal(langModal);
      });
      langList.appendChild(row);
    });
  }

  /* =========================
     Theme sync with Telegram ThemeParams
     (makes it feel “native”)
  ========================== */
  function applyThemeFromTelegram(){
    try {
      const tp = tg?.themeParams;
      if (!tp) return;

      // Use Telegram accent if available
      const btn = tp.button_color || "#7C5CFF";
      const link = tp.link_color || "#00B2FF";
      document.documentElement.style.setProperty("--acc", btn);
      document.documentElement.style.setProperty("--acc2", link);
    } catch {}
  }

  /* =========================
     Language apply
  ========================== */
  function applyLang(){
    const tr = T[lang];

    // Gate (optional elements)
    $("gateTitle") && ($("gateTitle").textContent = tr.gateTitle);
    $("gateText") && ($("gateText").textContent = tr.gateText);
    $("btnOpenLinkText") && ($("btnOpenLinkText").textContent = tr.btnOpenLink);
    $("chkText") && ($("chkText").textContent = tr.chkText);
    $("btnEnterText") && ($("btnEnterText").textContent = tr.btnEnter);

    $("subTitle") && ($("subTitle").textContent = tr.subTitle);
    $("hintText") && ($("hintText").innerHTML = tr.hint.replace("“","<b>“").replace("”","”</b>"));
    $("resetText") && ($("resetText").textContent = tr.reset);

    if (analyzeText) analyzeText.textContent = tr.analyze;
    if (holoText) holoText.textContent = tr.systemReady;

    // Modal titles if exist
    $("assetsTitle") && ($("assetsTitle").textContent = tr.modalAssets);
    $("tfTitle") && ($("tfTitle").textContent = tr.modalTf);
    $("langTitle") && ($("langTitle").textContent = tr.modalLang);

    if (assetSearch) assetSearch.placeholder = tr.searchPh;

    buildAssetTabs();
    renderAssetList(true);
    renderTfList();
    renderLangList();
  }

  /* =========================
     Gate
  ========================== */
  function setGateVisible(show){
    if (!gate || !app) return;
    if (show){
      gate.classList.remove("hidden");
      app.classList.add("hidden");
    } else {
      gate.classList.add("hidden");
      app.classList.remove("hidden");
    }
  }

  const gateOk = store.get("ca_gate_ok", "0") === "1";
  setGateVisible(!gateOk);

  on(chkRegistered, "change", () => {
    if (!btnEnter) return;
    btnEnter.disabled = !chkRegistered.checked;
  });

on(btnOpenLink, "click", (e) => {
  e?.preventDefault?.();
  haptic("light");

  const tgId = tg?.initDataUnsafe?.user?.id;

  const finalLink = tgId
    ? REG_LINK + "&click_id=" + encodeURIComponent(String(tgId))
    : REG_LINK;

  try {
    if (tg?.openLink) {
      tg.openLink(finalLink);
    } else {
      window.open(finalLink, "_blank");
    }
  } catch {
    window.open(finalLink, "_blank");
  }
});

  on(btnEnter, "click", () => {
    if (!chkRegistered || !chkRegistered.checked) return;
    haptic("medium");
    store.set("ca_gate_ok", "1");
    setGateVisible(false);
  });

  /* =========================
     Modals
  ========================== */
  function anyModalOpen(){
    return (
      assetsModal && !assetsModal.classList.contains("hidden") ||
      tfModal && !tfModal.classList.contains("hidden") ||
      langModal && !langModal.classList.contains("hidden")
    );
  }

  function openModal(modal){
    if (!modal || !backdrop) return;
    lockScroll(true);
    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
    tgBackShow();
  }

  function closeModal(modal){
    if (!modal || !backdrop) return;
    modal.classList.add("hidden");

    if (!anyModalOpen()){
      backdrop.classList.add("hidden");
      lockScroll(false);
      tgBackHide();
    }
  }

  function closeAllModals(){
    assetsModal?.classList.add("hidden");
    tfModal?.classList.add("hidden");
    langModal?.classList.add("hidden");
    backdrop?.classList.add("hidden");
    lockScroll(false);
    tgBackHide();
  }

  on(backdrop, "click", closeAllModals);
  on(closeAssets, "click", () => closeModal(assetsModal));
  on(closeTf, "click", () => closeModal(tfModal));
  on(closeLang, "click", () => closeModal(langModal));

  try{
    tg?.BackButton?.onClick?.(() => {
      if (anyModalOpen()) closeAllModals();
    });
  } catch {}

  /* =========================
     Market toggle
  ========================== */
  function toggleMarket(){
    const idx = MARKETS.indexOf(selectedMarket);
    selectedMarket = MARKETS[(idx + 1) % MARKETS.length];
    store.set("ca_market", selectedMarket);
    if (marketValue) marketValue.textContent = selectedMarket;
    seedChart();
    haptic("light");
    logLine(`Market mode switched → ${selectedMarket}`);
  }

  /* =========================
     Scan UI + cinematic sequence
  ========================== */
  let dotsTimer = null;
  let timer = null;

  function setStatus(text, pct){
    if (holoText) holoText.textContent = text;
    if (holoFill) holoFill.style.width = `${clamp(pct, 0, 100)}%`;
  }

  function playScanSound(){
    try{
      if (scanSfx){
        scanSfx.muted = false;
        scanSfx.currentTime = 0;
        scanSfx.volume = 0.55;
        scanSfx.play().catch(()=>{});
      }
    } catch {}
  }

  function startScanUI(){
    const tr = T[lang];

    btnAnalyze?.classList.add("scanning","glowPulse");
    if (btnAnalyze) btnAnalyze.disabled = true;

    chartWrap?.classList.add("gridOn");
    if (chartOverlay) chartOverlay.classList.add("show");
    if (overlayFill) overlayFill.style.width = "10%";

    if (analyzingLine) analyzingLine.hidden = false;
    setStatus(tr.analyzing, 18);

    // terminal
    clearLog();
    logLine(`Boot → ${selectedAsset} (${selectedMarket})`);
    logLine(`Timeframe → ${selectedTf.label}`);
    logLine("Kernel → microstructure module loaded");
    logLine("Streams → liquidity, momentum, volatility");

    // animated dots (text)
    let dots = 0;
    const phases = [
      "Analyzing liquidity",
      "Detecting volatility",
      "Reading momentum",
      "Calibrating entry",
      "Risk window alignment"
    ];
    let p = 0;
    if (dotsTimer) clearInterval(dotsTimer);
    dotsTimer = setInterval(() => {
      dots = (dots + 1) % 4;
      if (dots === 0) p = (p + 1) % phases.length;
      if (analyzingText) analyzingText.textContent = phases[p] + ".".repeat(dots);
    }, 240);

    playScanSound();
    haptic("light");
  }

  function stopScanUI(){
    const tr = T[lang];

    btnAnalyze?.classList.remove("scanning","glowPulse");
    if (btnAnalyze) btnAnalyze.disabled = false;

    chartWrap?.classList.remove("gridOn");
    if (chartOverlay) chartOverlay.classList.remove("show");
    if (overlayFill) overlayFill.style.width = "0%";

    if (analyzingLine) analyzingLine.hidden = true;
    if (dotsTimer){ clearInterval(dotsTimer); dotsTimer = null; }

    setStatus(tr.signalReady, 100);
    logLine("Output → signal package generated");
    logLine("Status → READY");

    haptic("medium");
    setTimeout(() => setStatus(tr.systemReady, 0), 950);
  }

  function startTimer(totalSec){
    if (!progressBar || !timerText) return;
    if (timer) clearInterval(timer);

    const started = Date.now();
    const totalMs = totalSec * 1000;

    const tick = () => {
      const elapsed = Date.now() - started;
      const left = Math.max(0, totalMs - elapsed);
      const pct = clamp((elapsed / totalMs) * 100, 0, 100);

      progressBar.style.width = `${pct}%`;

      const mm = pad2(Math.floor(left / 60000));
      const ss = pad2(Math.floor((left % 60000) / 1000));

      const tmm = pad2(Math.floor(totalMs / 60000));
      const tss = pad2(Math.floor((totalMs % 60000) / 1000));

      timerText.textContent = `${mm}:${ss} / ${tmm}:${tss}`;

      if (left <= 0){ clearInterval(timer); timer = null; }
    };

    tick();
    timer = setInterval(tick, 180);
  }

  async function runAnalysis(){
    const tr = T[lang];
    startScanUI();

    // cinematic staged overlay + logs
    const stages = [
      { t: tr.overlay0, pct: 22, log: "Micro-signals → captured" },
      { t: tr.overlay1, pct: 48, log: "Liquidity map → constructed" },
      { t: tr.overlay2, pct: 72, log: "Probability → assembled" },
      { t: tr.overlay3, pct: 86, log: "Execution window → validated" }
    ];

    for (let i = 0; i < stages.length; i++){
      const s = stages[i];
      if (overlayLine) overlayLine.textContent = s.t;
      if (overlayFill) overlayFill.style.width = `${s.pct}%`;
      setStatus(tr.analyzing, s.pct);
      logLine(s.log);
      await sleep(320 + i * 120);
    }

    // Factors (UI, demo)
    const vol = Math.floor(20 + Math.random() * 80);
    const mom = Math.floor(20 + Math.random() * 80);
    const str = Math.floor(20 + Math.random() * 80);
    const liq = Math.floor(20 + Math.random() * 80);

    if (volFactor) volFactor.textContent = `${vol}%`;
    if (momFactor) momFactor.textContent = `${mom}%`;
    if (strFactor) strFactor.textContent = `${str}%`;
    if (liqFactor) liqFactor.textContent = `${liq}%`;

    const confidence = clamp(
      Math.floor((vol + mom + str + liq) / 4 + (Math.random() * 10 - 5)),
      52, 93
    );

    const up = Math.random() > 0.48;

    const until = new Date(Date.now() + selectedTf.seconds * 1000);
    const hh = pad2(until.getHours());
    const mm = pad2(until.getMinutes());

    if (rAsset) rAsset.textContent = selectedAsset;
    if (rTf) rTf.textContent = selectedTf.label;
    if (rAcc) rAcc.textContent = `${confidence}%`;

    if (dirDot){
      dirDot.classList.toggle("up", up);
      dirDot.classList.toggle("down", !up);
    }
    if (dirText) dirText.textContent = up ? "UP" : "DOWN";
    if (rUntil) rUntil.textContent = `${hh}:${mm}`;

    // set “until/до”
    if (dirUntil?.childNodes?.length){
      dirUntil.childNodes[0].textContent = tr.untilWord + " ";
    }

    if (resultPanel) resultPanel.classList.remove("hidden");
    startTimer(selectedTf.seconds);

    logLine(`Confidence → ${confidence}%`);
    logLine(`Direction → ${up ? "UP" : "DOWN"}`);
    logLine(`Expiry → ${selectedTf.label}`);

    stopScanUI();
  }

  function resetAll(){
    haptic("light");
    if (resultPanel) resultPanel.classList.add("hidden");

    if (volFactor) volFactor.textContent = "--";
    if (momFactor) momFactor.textContent = "--";
    if (strFactor) strFactor.textContent = "--";
    if (liqFactor) liqFactor.textContent = "--";

    if (progressBar) progressBar.style.width = "0%";
    if (timerText) timerText.textContent = "--:-- / --:--";

    if (timer){ clearInterval(timer); timer = null; }

    clearLog();
    seedChart();
  }

  /* =========================
     Wiring: Buttons + modals
  ========================== */
  on(assetBtn, "click", () => {
    haptic("light");
    activeCategory = "all";
    buildAssetTabs();
    if (assetSearch) assetSearch.value = "";
    renderAssetList(true);
    openModal(assetsModal);
    focusInput(assetSearch);
  });

  on(tfBtn, "click", () => {
    haptic("light");
    renderTfList();
    openModal(tfModal);
  });

  on(marketBtn, "click", toggleMarket);

  on(btnAnalyze, "click", () => {
    if (btnAnalyze?.disabled) return;
    runAnalysis();
  });

  on(btnReset, "click", resetAll);

  on(btnLang, "click", () => {
    haptic("light");
    renderLangList();
    openModal(langModal);
  });

  on(btnMenu, "click", () => {
    // safe “menu” action for now: quick reset
    resetAll();
  });

  on(assetSearch, "input", () => renderAssetList(false));

  /* =========================
     Init
  ========================== */
  async function init(){
    applyThemeFromTelegram();
    applyLang();

    // initial controls
    if (tfValue) tfValue.textContent = selectedTf.label;
    if (marketValue) marketValue.textContent = selectedMarket;
    if (assetValue) assetValue.textContent = selectedAsset;

    await loadAssets();

    // badge from asset category if found
    const found = assets.find(a => a.symbol === selectedAsset);
    if (assetBadge) assetBadge.textContent = badgeForCategory(found?.category || "all");

    buildAssetTabs();
    renderAssetList(true);
    renderTfList();
    renderLangList();

    // gate checkbox
    if (btnEnter && chkRegistered) btnEnter.disabled = !chkRegistered.checked;

    // chart + resize
    seedChart();
    resizeCanvas();
    window.addEventListener("resize", () => resizeCanvas(), { passive: true });

    // smoothness: prevent double-tap zoom on iOS (in webview can help)
    document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });

    // default status
    if (holoText) holoText.textContent = T[lang].systemReady;
    if (holoFill) holoFill.style.width = "0%";
  }

  init();
})();
