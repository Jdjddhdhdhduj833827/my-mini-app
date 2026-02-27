(() => {
  const $ = (id) => document.getElementById(id);
const ASSETS = {
  forex: [
    "EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","NZD/USD",
    "EUR/GBP","EUR/JPY","EUR/CHF","EUR/AUD","EUR/CAD","EUR/NZD",
    "GBP/JPY","GBP/CHF","GBP/AUD","GBP/CAD","GBP/NZD",
    "AUD/JPY","AUD/CHF","AUD/CAD","AUD/NZD",
    "CHF/JPY","CAD/JPY","NZD/JPY",
    "USD/TRY","USD/ZAR","USD/MXN","USD/BRL","USD/SEK","USD/NOK"
  ],
  crypto: [
    "BTC/USDT","ETH/USDT","BNB/USDT","SOL/USDT","XRP/USDT","ADA/USDT",
    "DOGE/USDT","TRX/USDT","MATIC/USDT","LTC/USDT","DOT/USDT",
    "AVAX/USDT","LINK/USDT","ATOM/USDT","BCH/USDT","ETC/USDT"
  ],
  stocks: [
    "AAPL","MSFT","GOOGL","AMZN","TSLA","NVDA","META",
    "NFLX","AMD","INTC","BABA","DIS","V","MA","PYPL",
    "KO","PEP","NKE","WMT","XOM"
  ],
  commodities: [
    "XAU/USD","XAG/USD","WTI","BRENT","NATGAS","COPPER"
  ],
  indices: [
    "US500","US100","US30","GER40","UK100","JP225","FR40","SPAIN35"
  ],
  otc: [
    "EUR/USD OTC","GBP/USD OTC","USD/JPY OTC",
    "BTC/USDT OTC","ETH/USDT OTC"
  ]
};
  // -------- i18n --------
  const I18N = {
    ru: {
      tagline: "Premium Market Intelligence",
      gateTitle: "Открыть доступ к платформе",
      gateText: "Для доступа к инструментам анализа необходимо зарегистрироваться на платформе по ссылке. Это бесплатно. Депозит не требуется.",
      chip1: "График + уровни",
      chip2: "Market Factors",
      chip3: "Confidence-оценка",
      chip4: "Премиальный UI",
      registerBtn: "Зарегистрироваться",
      unlockBtn: "Открыть доступ",
      checkText: "Я перешёл по ссылке и завершил регистрацию",
      note: "Демо-режим интерфейса. Не является финансовой рекомендацией.",

      appSub: "Market Intelligence Dashboard",
      demo: "DEMO",
      params: "Параметры",
      asset: "Актив",
      tf: "Таймфрейм",
      market: "Режим",
      analyze: "Запустить анализ",
      reset: "Сброс",
      hint: "Демо-интерфейс: данные локальные, чтобы всё работало стабильно. Активы берутся из assets.json.",
      chart: "График",
      confidence: "Confidence",
      direction: "Направление",
      valid: "Действует до",
      result: "Результат",
      sub: "Нажми «Запустить анализ», чтобы получить результат.",
      disc: "Демо-режим интерфейса. Не является финансовым советом.",
      factors: "Market Factors",
      factorsHint: "AI-оценка состояния рынка",
      vol: "Volatility",
      trend: "Trend Strength",
      risk: "Risk",
      assetsTitle: "Assets",
      assetsFoot: "Список берётся из assets.json. Можно расширять без переписывания кода."
    },
    en: {
      tagline: "Premium Market Intelligence",
      gateTitle: "Unlock Platform Access",
      gateText: "To access analytics tools, register via the link. It's free. No deposit required.",
      chip1: "Chart + levels",
      chip2: "Market Factors",
      chip3: "Confidence score",
      chip4: "Premium UI",
      registerBtn: "Register",
      unlockBtn: "Unlock access",
      checkText: "I opened the link and completed registration",
      note: "Demo UI. Not financial advice.",

      appSub: "Market Intelligence Dashboard",
      demo: "DEMO",
      params: "Parameters",
      asset: "Asset",
      tf: "Timeframe",
      market: "Mode",
      analyze: "Run analysis",
      reset: "Reset",
      hint: "Demo UI: data is local for stability. Assets are loaded from assets.json.",
      chart: "Chart",
      confidence: "Confidence",
      direction: "Direction",
      valid: "Valid until",
      result: "Result",
      sub: "Press “Run analysis” to generate the output.",
      disc: "Demo UI. Not financial advice.",
      factors: "Market Factors",
      factorsHint: "AI market snapshot",
      vol: "Volatility",
      trend: "Trend Strength",
      risk: "Risk",
      assetsTitle: "Assets",
      assetsFoot: "The list is loaded from assets.json. You can extend it anytime."
    },
    es: {
      tagline: "Inteligencia de Mercado Premium",
      gateTitle: "Desbloquear acceso",
      gateText: "Para acceder a las herramientas, regístrate mediante el enlace. Es gratis. No se requiere depósito.",
      chip1: "Gráfico + niveles",
      chip2: "Market Factors",
      chip3: "Confianza",
      chip4: "UI premium",
      registerBtn: "Registrarse",
      unlockBtn: "Abrir acceso",
      checkText: "Abrí el enlace y completé el registro",
      note: "Interfaz demo. No es consejo financiero.",

      appSub: "Panel de Inteligencia",
      demo: "DEMO",
      params: "Parámetros",
      asset: "Activo",
      tf: "Marco temporal",
      market: "Modo",
      analyze: "Iniciar análisis",
      reset: "Reiniciar",
      hint: "Modo demo: datos locales. La lista de activos viene de assets.json.",
      chart: "Gráfico",
      confidence: "Confianza",
      direction: "Dirección",
      valid: "Válido hasta",
      result: "Resultado",
      sub: "Pulsa “Iniciar análisis” para generar el resultado.",
      disc: "Interfaz demo. No es consejo financiero.",
      factors: "Market Factors",
      factorsHint: "Resumen del mercado",
      vol: "Volatilidad",
      trend: "Fuerza de tendencia",
      risk: "Riesgo",
      assetsTitle: "Activos",
      assetsFoot: "La lista se carga desde assets.json. Puedes ampliarla cuando quieras."
    },
    de: {
      tagline: "Premium Markt-Intelligenz",
      gateTitle: "Zugang freischalten",
      gateText: "Für den Zugriff bitte über den Link registrieren. Kostenlos. Kein Deposit erforderlich.",
      chip1: "Chart + Levels",
      chip2: "Market Factors",
      chip3: "Confidence",
      chip4: "Premium UI",
      registerBtn: "Registrieren",
      unlockBtn: "Zugang öffnen",
      checkText: "Ich habe den Link geöffnet und mich registriert",
      note: "Demo-UI. Keine Finanzberatung.",

      appSub: "Market-Intelligence Dashboard",
      demo: "DEMO",
      params: "Parameter",
      asset: "Asset",
      tf: "Zeitrahmen",
      market: "Modus",
      analyze: "Analyse starten",
      reset: "Zurücksetzen",
      hint: "Demo UI: lokale Daten. Assets werden aus assets.json geladen.",
      chart: "Chart",
      confidence: "Confidence",
      direction: "Richtung",
      valid: "Gültig bis",
      result: "Ergebnis",
      sub: "Klicke „Analyse starten“, um das Ergebnis zu erzeugen.",
      disc: "Demo-UI. Keine Finanzberatung.",
      factors: "Market Factors",
      factorsHint: "Markt-Snapshot",
      vol: "Volatilität",
      trend: "Trendstärke",
      risk: "Risiko",
      assetsTitle: "Assets",
      assetsFoot: "Liste wird aus assets.json geladen. Du kannst sie jederzeit erweitern."
    }
  };

  function applyLang(lang){
    const dict = I18N[lang] || I18N.ru;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    localStorage.setItem("ca_lang", lang);
    const label = $("langLabel");
    if (label) label.textContent = lang.toUpperCase();
  }

  // -------- Gate --------
  const gate = $("gate");
  const app = $("app");
  const chkDone = $("chkDone");
  const btnUnlock = $("btnUnlock");
  const btnRegister = $("btnRegister");

  function setUnlockEnabled(on){ btnUnlock.disabled = !on; }

  chkDone?.addEventListener("change", () => setUnlockEnabled(!!chkDone.checked));
  btnRegister?.addEventListener("click", () => setTimeout(() => setUnlockEnabled(true), 600));

  btnUnlock?.addEventListener("click", () => {
    gate.hidden = true;
    app.hidden = false;
    ensureChart();
  });

  // -------- Language menu --------
  const langBtn = $("langBtn");
  const langMenu = $("langMenu");
  const openLang = $("openLang");

  function toggleLangMenu(){
    const isHidden = langMenu.hasAttribute("hidden");
    if (isHidden) langMenu.removeAttribute("hidden");
    else langMenu.setAttribute("hidden", "");
  }
  function closeLangMenu(){ langMenu.setAttribute("hidden", ""); }

  langBtn?.addEventListener("click", (e) => { e.stopPropagation(); toggleLangMenu(); });
  openLang?.addEventListener("click", (e) => { e.stopPropagation(); toggleLangMenu(); });
  langMenu?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (!btn) return;
    applyLang(btn.getAttribute("data-lang"));
    closeLangMenu();
    renderAssets(); // перерисуем категории/подписи
  });
  document.addEventListener("click", () => closeLangMenu());

  // -------- Assets (from assets.json) --------
  let ASSETS = [];
  let selectedAsset = { symbol: "EUR/USD", category: "forex", label: "EUR/USD" };

  const assetBtn = $("assetBtn");
  const assetValue = $("assetValue");

  const assetsModal = $("assetsModal");
  const btnAssets = $("btnAssets");
  const closeAssets = $("closeAssets");
  const assetSearch = $("assetSearch");
  const assetCategory = $("assetCategory");
  const assetList = $("assetList");

  function showModal(on){
    assetsModal.hidden = !on;
    if (on){
      assetSearch.value = "";
      assetCategory.value = "all";
      renderAssets();
      assetSearch.focus();
    }
  }

  btnAssets?.addEventListener("click", () => showModal(true));
  assetBtn?.addEventListener("click", () => showModal(true));
  closeAssets?.addEventListener("click", () => showModal(false));
  assetsModal?.addEventListener("click", (e) => {
    if (e.target === assetsModal) showModal(false);
  });

  assetSearch?.addEventListener("input", renderAssets);
  assetCategory?.addEventListener("change", renderAssets);

  async function loadAssets(){
    try{
      const res = await fetch("./assets.json", { cache: "no-store" });
      if (!res.ok) throw new Error("assets.json not found");
      const data = await res.json();
      ASSETS = Array.isArray(data) ? data : (data.assets || []);
    }catch(_e){
      // fallback (если assets.json забыли добавить)
      ASSETS = [
        {symbol:"EUR/USD", category:"forex", label:"EUR/USD"},
        {symbol:"GBP/USD", category:"forex", label:"GBP/USD"},
        {symbol:"USD/JPY", category:"forex", label:"USD/JPY"},
        {symbol:"BTC/USDT", category:"crypto", label:"BTC/USDT"},
        {symbol:"ETH/USDT", category:"crypto", label:"ETH/USDT"},
        {symbol:"AAPL", category:"stocks", label:"Apple"},
        {symbol:"SPX", category:"indices", label:"SP500"},
        {symbol:"XAUUSD", category:"commodities", label:"Gold"}
      ];
    }
  }

  function renderAssets(){
    if (!assetList) return;

    const q = (assetSearch?.value || "").trim().toLowerCase();
    const cat = assetCategory?.value || "all";

    const filtered = ASSETS.filter(a => {
      const inCat = (cat === "all") || (a.category === cat);
      if (!inCat) return false;
      if (!q) return true;
      const hay = `${a.symbol} ${a.label || ""}`.toLowerCase();
      return hay.includes(q);
    });

    assetList.innerHTML = filtered.slice(0, 300).map(a => `
      <div class="assetItem">
        <div>
          <div class="assetName">${escapeHtml(a.label || a.symbol)}</div>
          <div class="assetMeta">${escapeHtml(a.symbol)} • ${escapeHtml(a.category)}</div>
        </div>
        <button class="assetBtn" data-symbol="${escapeAttr(a.symbol)}">SELECT</button>
      </div>
    `).join("");

    assetList.querySelectorAll(".assetBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const sym = btn.getAttribute("data-symbol");
        const asset = ASSETS.find(x => x.symbol === sym);
        if (!asset) return;
        selectedAsset = asset;
        if (assetValue) assetValue.textContent = asset.symbol;
        if ($("pairOut")) $("pairOut").textContent = asset.symbol;
        updateMeta();
        showModal(false);
        // обновим график под новый актив (демо-данные)
        if (series){ series.setData(mockLinePoints(90)); chart.timeScale().fitContent(); }
      });
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }

  // -------- Chart --------
  const chartHost = $("chart");
  let chart = null;
  let series = null;

  function mockLinePoints(n=80){
    const now = Math.floor(Date.now()/1000);
    let price = 100 + Math.random()*10;
    const out = [];
    for (let i=n-1; i>=0; i--){
      const t = now - i*60;
      price += (Math.random()-0.5)*1.2;
      out.push({ time: t, value: +price.toFixed(4) });
    }
    return out;
  }

  function ensureChart(){
    if (!window.LightweightCharts || !chartHost) return;
    if (chart) return;

    chart = window.LightweightCharts.createChart(chartHost, {
      layout: {
        background: { type: "solid", color: "rgba(0,0,0,0)" },
        textColor: "rgba(255,255,255,.65)",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
        fontSize: 12
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.06)" },
        horzLines: { color: "rgba(255,255,255,.06)" }
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,.10)" },
      timeScale: { borderColor: "rgba(255,255,255,.10)" },
      crosshair: { mode: 0 },
      handleScroll: false,
      handleScale: false,
    });

    series = chart.addLineSeries({
      color: "rgba(124,92,255,.95)",
      lineWidth: 3,
      crosshairMarkerVisible: true,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    series.setData(mockLinePoints(90));
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: chartHost.clientWidth, height: chartHost.clientHeight });
    });
    ro.observe(chartHost);
  }

  // -------- Analysis + Premium factors --------
  const tfSelect = $("tfSelect");
  const marketSelect = $("marketSelect");
  const btnAnalyze = $("btnAnalyze");
  const btnReset = $("btnReset");

  const metaLine = $("metaLine");
  const conf = $("conf");
  const dir = $("dir");
  const until = $("until");

  const badge = $("badge");
  const pairOut = $("pairOut");
  const big = $("big");
  const sub = $("sub");

  const timerBg = $("timerBg");
  const timerText = $("timerText");

  const fVol = $("fVol"), fTrend = $("fTrend"), fRisk = $("fRisk");
  const mVol = $("mVol"), mTrend = $("mTrend"), mRisk = $("mRisk");

  let timerId = null;

  const pad2 = (n) => String(n).padStart(2,"0");
  function mmss(sec){
    sec = Math.max(0, Math.ceil(sec));
    const m = Math.floor(sec/60);
    const s = sec%60;
    return `${pad2(m)}:${pad2(s)}`;
  }

  function stopTimer(){
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function startTimer(seconds){
    stopTimer();
    const start = Date.now();
    const end = start + seconds*1000;

    const tick = () => {
      const now = Date.now();
      const left = (end - now)/1000;
      const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));

      if (timerBg) timerBg.style.width = `${pct}%`;
      if (timerText) timerText.textContent = `${mmss(left)} / ${mmss(seconds)}`;
      if (now >= end) stopTimer();
    };

    tick();
    timerId = setInterval(tick, 120);
  }

  function randomDir(){ return Math.random() > 0.5 ? "UP" : "DOWN"; }
  function formatUntil(sec){
    const d = new Date(Date.now() + sec*1000);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }

  function updateMeta(){
    const tfS = Number(tfSelect?.value || 60);
    const market = marketSelect?.value || "REAL";
    const tfText = tfS >= 60 ? `${tfS/60}m` : `${tfS}s`;

    if (metaLine) metaLine.textContent = `${selectedAsset.symbol} • ${market} • ${tfText}`;
    if (pairOut) pairOut.textContent = selectedAsset.symbol;
    if (badge) badge.textContent = market;
  }

  function setFactor(elV, elM, value){
    if (elV) elV.textContent = `${value}%`;
    if (elM) elM.style.width = `${value}%`;
  }

  function runAnalysis(){
  /* базовый glow на кнопке */
function runAnalysis(){

   const analyzeText = document.getElementById("analyzeText");

   btnAnalyze.classList.add("scanning");
   analyzeText.textContent = "AI SCANNING...";

   // дальше твоя логика
}

/* пульсирующий glow */

    const analyzeText = document.getElementById("analyzeText");

btnAnalyze.classList.add("scanning");
analyzeText.textContent = "AI SCANNING...";
btnAnalyze.disabled = true;
  .chartWrap{
  position:relative;
  overflow:hidden;
  border-radius:16px;
}

/* сетка скрыта по умолчанию */
.chartWrap::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:0;
  transition:opacity .25s ease;
  z-index:1; /* поверх графика, но ниже текста */
  background:
    repeating-linear-gradient(0deg,
      rgba(255,255,255,.06) 0px,
      rgba(255,255,255,.06) 1px,
      transparent 1px,
      transparent 18px
    ),
    repeating-linear-gradient(90deg,
      rgba(255,255,255,.05) 0px,
      rgba(255,255,255,.05) 1px,
      transparent 1px,
      transparent 22px
    );
  mix-blend-mode:screen;
}

/* включаем сетку только когда идет анализ */
.chartWrap.gridOn::before{
  opacity:.35;
}

/* чтобы текст/карточки были выше сетки */
.chartWrap > *{
  position:relative;
  z-index:2;
}
    ensureChart();
    updateMeta();

    const tfS = Number(tfSelect?.value || 60);
    const market = marketSelect?.value || "REAL";

    // AI scan animation on button
    btnAnalyze?.classList.add("isScanning");

    // pseudo premium analytics output
    const confidence = Math.floor(74 + Math.random()*18); // 74-92
    const d = randomDir();
    const untilStr = formatUntil(tfS);

    const vol = Math.floor(35 + Math.random()*55);
    const trend = Math.floor(30 + Math.random()*60);
    const risk = Math.floor(20 + Math.random()*70);

    // render after short "scan"
    setTimeout(() => {
      if (conf) conf.textContent = `${confidence}%`;
      if (dir) dir.textContent = d === "UP" ? "↑ UP" : "↓ DOWN";
      if (until) until.textContent = untilStr;

      if (big) big.textContent = d === "UP" ? "BULLISH SCENARIO" : "BEARISH SCENARIO";
      if (sub) sub.textContent = `${selectedAsset.symbol} • ${market} • Confidence ${confidence}% • Valid until ${untilStr}`;

      setFactor(fVol, mVol, vol);
      setFactor(fTrend, mTrend, trend);
      setFactor(fRisk, mRisk, risk);

      if (series){
        series.setData(mockLinePoints(90));
        chart.timeScale().fitContent();
      }

      startTimer(tfS);
     setTimeout(() => {
  btnAnalyze.classList.remove("scanning");
  analyzeText.textContent = "Запустить анализ";
  btnAnalyze.disabled = false;
}, 900);
      btnAnalyze?.classList.remove("isScanning");
    }, 650);
  }

  function resetAll(){
    stopTimer();
    if (timerBg) timerBg.style.width = "0%";
    if (timerText) timerText.textContent = "00:00 / 00:00";
    if (conf) conf.textContent = "—";
    if (dir) dir.textContent = "—";
    if (until) until.textContent = "—";
    if (big) big.textContent = "—";
    if (fVol) fVol.textContent = "—";
    if (fTrend) fTrend.textContent = "—";
    if (fRisk) fRisk.textContent = "—";
    if (mVol) mVol.style.width = "0%";
    if (mTrend) mTrend.style.width = "0%";
    if (mRisk) mRisk.style.width = "0%";

    const dict = I18N[localStorage.getItem("ca_lang") || "ru"] || I18N.ru;
    if (sub) sub.textContent = dict.sub;

    if (series){
      series.setData(mockLinePoints(90));
      chart.timeScale().fitContent();
    }
  }

  btnAnalyze?.addEventListener("click", runAnalysis);
  btnReset?.addEventListener("click", resetAll);

  // -------- Boot --------
  const saved = localStorage.getItem("ca_lang") || "ru";
  applyLang(saved);
  setUnlockEnabled(false);

  (async () => {
    await loadAssets();
    // default asset must exist
    const found = ASSETS.find(a => a.symbol === selectedAsset.symbol) || ASSETS[0];
    if (found) selectedAsset = found;
    if (assetValue) assetValue.textContent = selectedAsset.symbol;
    updateMeta();
  })();

})();
