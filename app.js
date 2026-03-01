console.log("APP.JS VERSION =", "v_debug_001");
/* app.js — FULL REWRITE (stable)
   ✅ ЛОГИКА КАК ТЫ ПРОСИЛ:
   1) Вход в интерфейс (Gate) — проверяем ТОЛЬКО регистрацию.
      - не зарегистрирован -> показываем Reg Notify + остаёмся на Gate
      - зарегистрирован -> сразу пускаем в App (без депозитных окон)
   2) ДЕПОЗИТНЫЙ Notify появляется ТОЛЬКО при попытке анализа (Run/Long/Short).
   3) Анти-спам уведомлений:
      - одно и то же уведомление НЕ показывается заново при повторных нажатиях
      - отдельно ключи на reg/deposit
   4) VPN/Network:
      - если API не отвечает/ошибка сети -> показываем подсказку про VPN (без бесконечного спама)
   5) assets/timeframes грузим из assets.json (fallback на дефолт)
*/

(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const CONFIG = {
    API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
    REG_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    DEPOSIT_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    ASSETS_JSON: "./assets.json",
    AUTH_TIMEOUT_MS: 9000,
    DEBUG: false,
  };

  // =========================
  // Telegram
  // =========================
  const tg = window.Telegram?.WebApp || null;
  try { tg?.expand?.(); } catch {}

  // =========================
  // DOM helpers
  // =========================
  const $ = (id) => document.getElementById(id);
   console.log("[BOOT] btnGetAccess exists?", !!document.getElementById("btnGetAccess"));
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");

  function safeText(el, v){ if (el) el.textContent = String(v ?? ""); }

  // =========================
  // DOM refs
  // =========================
  const gate = $("gate");
  const app = $("app");

  const btnOpenReg = $("btnOpenReg");
  const btnGetAccess = $("btnGetAccess");
   if (!btnGetAccess) {
  console.warn("[UI] btnGetAccess not found in DOM");
} else {
  btnGetAccess.addEventListener("click", () => {
    console.log("[CLICK] Get access clicked");
  });
}
  const gateStatusText = $("gateStatusText");
  const gateMeter = $("gateMeter");
  const pillVipGate = $("pillVipGate");

  const btnLangGate = $("btnLangGate");
  const btnLangApp = $("btnLangApp");
  const pillVipTop = $("pillVipTop");

  const btnCheckStatus = $("btnCheckStatus");
  const btnReset = $("btnReset");
  const btnAnalyze = $("btnAnalyze");
  const btnLong = $("btnLong");
  const btnShort = $("btnShort");

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
  const vipBadge = $("vipBadge");

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

  const softLock = $("softLock");

  // =========================
  // State
  // =========================
  let LANG = "ru";

  // notify modes: "reg" | "deposit" | "info"
  let NOTIFY_MODE = "info";
  let LAST_NOTIFY_KEY = ""; // anti-spam key

  // auth state
  let AUTH = {
    ok: false,
    telegram_id: "",
    access: false,
    vip: false,
    flags: { registered: 0, dep_count: 0, approved: 0 },
    error: "",
  };

  // assets/timeframes
  let ASSETS = {
    Forex: ["EUR/USD","GBP/USD","USD/JPY","USD/CHF"],
    Crypto: ["BTC/USD","ETH/USD"],
    Stocks: ["AAPL","TSLA"],
    Commodities: ["Gold","Oil"],
  };
  let TIMEFRAMES = ["15s","30s","1m"];

  // UI state
  let APP_ENTERED = false;

  // =========================
  // i18n
  // =========================
  const I18N = {
    ru: {
      gate_sub: "Premium terminal • Smart assistant",
      gate_title: "Доступ к терминалу",
      gate_text_main: "Чтобы открыть интерфейс, подтвердите статус аккаунта.",
      gate_step1_t: "Регистрация",
      gate_step1_d: "Создайте новый аккаунт через кнопку ниже.",
      gate_step2_t: "Проверка статуса",
      gate_step2_d: "Вернитесь и нажмите «Получить доступ».",
      gate_step3_t: "Доступ",
      gate_step3_d: "После подтверждения откроются модули интерфейса.",
      gate_btn_reg: "Открыть регистрацию",
      gate_btn_access: "Получить доступ",
      gate_status: "Статус:",
      gate_status_na: "не проверен",
      gate_legal: "Demo UI. Not financial advice.",
      gate_meter: "SECURITY • initData required",

      app_sub: "Premium UI Terminal",
      hero_title: "Terminal Overview",
      hero_sub: "Smart mode • Premium UI",
      hero_mode: "MODE: SMART",

      cc_title: "CONTROL CENTER",
      cc_btn_check: "Проверить",
      cc_btn_reset: "Сброс",
      cc_hint: "Нажмите «Запустить анализ» — получите демо-сигнал.",
      cc_btn_analyze: "Запустить анализ",

      chart_title: "MARKET VISUAL",
      chart_quality: "Quality: —",
      chart_conf: "Conf: —",
      chart_scan: "Сканирование…",

      sig_label: "СИГНАЛ",
      sig_window: "окно:",
      sig_until: "до",
      confirm_label: "ПОДТВЕРЖДЕНИЕ",
      mini_hint: "Mini chart • demo render",

      m_acc: "Точность",
      m_vol: "Волатильность",
      m_mom: "Импульс",
      m_liq: "Ликвидность",

      assets_title: "Выбор актива",
      tf_title: "Выбор таймфрейма",
      lang_title: "Язык интерфейса",

      footnote: "Проверка статуса выполняется на сервере через Telegram initData.",
      notify_btn_ok: "Понятно",

      st_need_tg: "Откройте внутри Telegram",
      st_need_tg_d: "Мини-приложение работает только внутри Telegram.",
      st_checked: "проверено",

      st_reg_required: "Сначала создайте аккаунт",
      st_reg_required_d: "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь сюда.",

      st_deposit_required: "Требуется депозит",
      st_deposit_required_d: "Чтобы запустить анализ, внесите депозит и попробуйте снова.",

      st_vpn_title: "Сервис недоступен",
      st_vpn_desc: "Сервер не отвечает. Включите VPN и нажмите «Получить доступ» ещё раз.",

      btn_open_reg: "Открыть регистрацию",
      btn_open_deposit: "Открыть пополнение",
      btn_try_again: "Повторить",
    },

    en: {
      gate_sub: "Premium terminal • Smart assistant",
      gate_title: "Terminal access",
      gate_text_main: "Confirm your account status to open the UI.",
      gate_step1_t: "Registration",
      gate_step1_d: "Create a new account using the button below.",
      gate_step2_t: "Status check",
      gate_step2_d: "Come back and tap “Get access”.",
      gate_step3_t: "Access",
      gate_step3_d: "After confirmation, UI modules become available.",
      gate_btn_reg: "Open registration",
      gate_btn_access: "Get access",
      gate_status: "Status:",
      gate_status_na: "not checked",
      gate_legal: "Demo UI. Not financial advice.",
      gate_meter: "SECURITY • initData required",

      app_sub: "Premium UI Terminal",
      hero_title: "Terminal Overview",
      hero_sub: "Smart mode • Premium UI",
      hero_mode: "MODE: SMART",

      cc_title: "CONTROL CENTER",
      cc_btn_check: "Check",
      cc_btn_reset: "Reset",
      cc_hint: "Tap “Run analysis” to get a demo signal.",
      cc_btn_analyze: "Run analysis",

      chart_title: "MARKET VISUAL",
      chart_quality: "Quality: —",
      chart_conf: "Conf: —",
      chart_scan: "Scanning…",

      sig_label: "SIGNAL",
      sig_window: "window:",
      sig_until: "until",
      confirm_label: "CONFIRMATION",
      mini_hint: "Mini chart • demo render",

      m_acc: "Accuracy",
      m_vol: "Volatility",
      m_mom: "Momentum",
      m_liq: "Liquidity",

      assets_title: "Select asset",
      tf_title: "Select timeframe",
      lang_title: "Language",

      footnote: "Status is verified on server using Telegram initData.",
      notify_btn_ok: "Got it",

      st_need_tg: "Open inside Telegram",
      st_need_tg_d: "This mini app works only inside Telegram.",
      st_checked: "checked",

      st_reg_required: "Create an account first",
      st_reg_required_d: "Tap “Open registration”, create an account, then come back.",

      st_deposit_required: "Deposit required",
      st_deposit_required_d: "To run analysis, make a deposit and try again.",

      st_vpn_title: "Service unavailable",
      st_vpn_desc: "Server is not responding. Turn on VPN and tap “Get access” again.",

      btn_open_reg: "Open registration",
      btn_open_deposit: "Open deposit",
      btn_try_again: "Try again",
    }
  };

  const t = (key) => (I18N[LANG] && I18N[LANG][key]) ? I18N[LANG][key] : key;

  function applyI18n(){
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i]").forEach(el => {
      const k = el.getAttribute("data-i");
      el.textContent = t(k);
    });
  }

  // =========================
  // Gate status
  // =========================
  function setGateStatus(text, meterPct){
    safeText(gateStatusText, text);
    if (gateMeter && typeof meterPct === "number") gateMeter.style.width = `${meterPct}%`;
  }

  // =========================
  // URL open
  // =========================
  function openURL(url){
    if (!url) return;
    try{
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    }catch{
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  // =========================
  // Soft lock (we mostly keep OFF per your request)
  // =========================
  function setLocked(isLocked){
    if (isLocked) show(softLock);
    else hide(softLock);

    // мы НЕ блокируем весь app депозитом (по твоему требованию),
    // но если когда-то понадобится — здесь готово:
    // btnAnalyze.disabled = isLocked;
    // btnLong.disabled = isLocked;
    // btnShort.disabled = isLocked;
  }

  // =========================
  // Notify (anti-spam)
  // =========================
  function showNotify({ mode="info", title="", text="", primaryLabel="", primaryAction=null, key="" }){
    if (!notify) return;

    NOTIFY_MODE = mode;

    const k = key || `${mode}:${title}:${text}`;
    // если уже показано то же самое — не повторяем
    if (!notify.classList.contains("hidden") && LAST_NOTIFY_KEY === k) return;
    LAST_NOTIFY_KEY = k;

    safeText(notifyTitle, title);
    safeText(notifyText, text);

    // primary button
    if (btnNotifyPrimary && notifyPrimaryLabel){
      safeText(notifyPrimaryLabel, primaryLabel || "OK");

      // снимаем старый обработчик
      btnNotifyPrimary.onclick = null;
      btnNotifyPrimary.onclick = () => {
        try { primaryAction && primaryAction(); } catch {}
      };
    }

    show(notify);
  }

  function hideNotify(){
    if (!notify) return;
    hide(notify);
  }

  // =========================
  // AUTH (robust + VPN hint)
  // =========================
  async function authRequest(){
    const initData = tg?.initData || "";
    if (!initData) return { ok:false, error:"no_initData" };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.AUTH_TIMEOUT_MS);

    try{
      const resp = await fetch(CONFIG.API_BASE + "/pb/auth", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ initData }),
        cache: "no-store",
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!resp.ok){
        return { ok:false, error:"api_error", status: resp.status };
      }

      const data = await resp.json().catch(()=> ({}));
      return data;

    }catch(e){
      clearTimeout(timer);
      return { ok:false, error:"network_fail" };
    }
  }

  function normalizeAuth(data){
    const flags = data?.flags || {};
    return {
      ok: !!data?.ok,
      telegram_id: String(data?.telegram_id || ""),
      access: !!data?.access,
      vip: !!data?.vip,
      flags: {
        registered: Number(flags.registered ?? 0),
        dep_count: Number(flags.dep_count ?? 0),
        approved: Number(flags.approved ?? 0),
      },
      error: String(data?.error || data?.message || data?.reason || ""),
    };
  }

  // =========================
  // Assets loader
  // =========================
  async function loadAssetsJson(){
    try{
      const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
      if (!r.ok) throw new Error("assets.json not ok");
      const j = await r.json();

      if (j?.categories && typeof j.categories === "object") ASSETS = j.categories;
      if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
    }catch{
      // fallback already in ASSETS/TIMEFRAMES
    }
  }

  // =========================
  // Modals
  // =========================
  function openModal(modal){
    show(backdrop);
    show(modal);
  }
  function closeModal(modal){
    hide(modal);
    hide(backdrop);
  }

  // =========================
  // Language modal
  // =========================
  function openLangModal(){
    if (!langList) return;

    langList.innerHTML = "";
    const items = [
      { id:"ru", label:"Русский" },
      { id:"en", label:"English" },
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
  // Assets/TF modals
  // =========================
  function openAssets(){
    if (!assetTabs || !assetList || !assetSearch) return;

    assetTabs.innerHTML = "";
    assetList.innerHTML = "";
    assetSearch.value = "";

    const cats = Object.keys(ASSETS || {});
    let activeCat = cats[0] || "Forex";

    const render = () => {
      assetList.innerHTML = "";
      const q = assetSearch.value.trim().toLowerCase();

      const list = (ASSETS[activeCat] || [])
        .filter(x => !q || String(x).toLowerCase().includes(q));

      list.forEach(sym => {
        const row = document.createElement("div");
        row.className = "item";
        row.innerHTML = `<div>${sym}</div><div>${activeCat}</div>`;
        row.addEventListener("click", () => {
          safeText(assetValue, sym);
          closeModal(assetsModal);
          drawChartDemo();
        });
        assetList.appendChild(row);
      });
    };

    cats.forEach(cat => {
      const tab = document.createElement("button");
      tab.className = "chipBtn";
      tab.type = "button";
      tab.textContent = cat;
      tab.addEventListener("click", () => {
        activeCat = cat;
        render();
      });
      assetTabs.appendChild(tab);
    });

    // важный фикс: не вешаем бесконечно listener при каждом открытии
    assetSearch.oninput = render;

    render();
    openModal(assetsModal);
  }

  function openTF(){
    if (!tfList) return;

    tfList.innerHTML = "";
    (TIMEFRAMES || []).forEach(tf => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `<div>${tf}</div><div>Timeframe</div>`;
      row.addEventListener("click", () => {
        safeText(tfValue, tf);
        closeModal(tfModal);
      });
      tfList.appendChild(row);
    });

    openModal(tfModal);
  }

  // =========================
  // Market toggle
  // =========================
  function toggleMarket(){
    if (!marketValue) return;
    marketValue.textContent = (marketValue.textContent === "OTC") ? "Market" : "OTC";
    drawChartDemo();
  }

  // =========================
  // UI: signal
  // =========================
  function setSignal(text, isUp){
    safeText(dirText, text);

    if (isUp) {
      safeText(dirArrow, "↗");
      dirArrow?.classList.remove("down");
      dirText?.classList.remove("down");
      dirArrow?.classList.add("up");
      dirText?.classList.add("up");
    } else {
      safeText(dirArrow, "↘");
      dirArrow?.classList.remove("up");
      dirText?.classList.remove("up");
      dirArrow?.classList.add("down");
      dirText?.classList.add("down");
    }
  }

  // =========================
  // Charts demo
  // =========================
  function drawChartDemo(bias = 0){
    if (!chart) return;
    const ctx = chart.getContext("2d");
    const w = chart.width;
    const h = chart.height;

    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(0,0,w,h);

    // grid
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    const step = 46;
    for (let x=0; x<w; x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y=0; y<h; y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.globalAlpha = 1;

    // candles
    const candles = 48;
    const cw = Math.floor(w / candles);
    let price = h * 0.55;

    for (let i=0; i<candles; i++){
      const drift = (Math.random() - 0.5) * 18 + bias * 2.2;
      const open = price;
      const close = price + drift;
      const high = Math.max(open, close) + (Math.random()*10);
      const low  = Math.min(open, close) - (Math.random()*10);
      price = close;

      const x = i * cw + 12;
      const bodyTop = Math.min(open, close);
      const bodyBot = Math.max(open, close);
      const up = close >= open;

      ctx.strokeStyle = "rgba(255,255,255,.26)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + cw/2, high);
      ctx.lineTo(x + cw/2, low);
      ctx.stroke();

      ctx.fillStyle = up ? "rgba(119,243,178,.26)" : "rgba(255,90,110,.22)";
      ctx.strokeStyle = up ? "rgba(119,243,178,.48)" : "rgba(255,90,110,.42)";
      ctx.lineWidth = 2;

      ctx.fillRect(x, bodyTop, Math.max(8, cw-18), Math.max(6, bodyBot-bodyTop));
      ctx.strokeRect(x, bodyTop, Math.max(8, cw-18), Math.max(6, bodyBot-bodyTop));
    }

    const grd = ctx.createLinearGradient(0,0,0,h);
    grd.addColorStop(0, "rgba(124,92,255,.14)");
    grd.addColorStop(0.45, "rgba(0,178,255,.08)");
    grd.addColorStop(1, "rgba(245,211,138,.06)");
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);
  }

  function drawMiniChartDemo(bias = 0){
    if (!signalChart) return;
    const ctx = signalChart.getContext("2d");
    const w = signalChart.width;
    const h = signalChart.height;

    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(0,0,w,h);

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    for (let x=0; x<w; x+=52){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y=0; y<h; y+=44){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.globalAlpha = 1;

    let y = h*0.6;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,.70)";
    ctx.beginPath();
    for (let i=0; i<32; i++){
      const x = (i/31) * (w-24) + 12;
      y += (Math.random()-0.5)*10 + bias*1.3;
      if (i===0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.globalAlpha = 0.30;
    ctx.lineWidth = 10;
    ctx.strokeStyle = bias >= 0 ? "rgba(119,243,178,.26)" : "rgba(255,90,110,.22)";
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // =========================
  // Gate / App transitions
  // =========================
  function enterApp(){
    APP_ENTERED = true;
    hide(gate);
    show(app);

    const sid = AUTH.telegram_id ? AUTH.telegram_id.slice(-6) : "—";
    safeText(chipSession, "SESSION: " + sid);
    safeText(chipAccess, "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING"));

    if (AUTH.vip) { show(pillVipTop); show(vipBadge); }
    else { hide(pillVipTop); hide(vipBadge); }

    // ВАЖНО: никаких депозит-уведомлений при входе
    hideNotify();
    setLocked(false);

    // initial charts
    drawChartDemo();
    drawMiniChartDemo();
  }

  async function gateCheckAndProceed(){
    setGateStatus(t("gate_status_na"), 18);

    // Must be inside TG to have initData
    if (!tg?.initData) {
      setGateStatus(t("st_need_tg"), 22);
      showNotify({
        mode: "reg",
        title: t("st_need_tg"),
        text: t("st_need_tg_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
        key: "need_tg",
      });
      return;
    }

    setGateStatus("…", 32);

   const raw = await authRequest();
console.log("AUTH_RAW_GATE", raw);

const data = normalizeAuth(raw);
console.log("AUTH_NORM_GATE", data);

AUTH = data;

    if (!data.ok){
      // VPN / Network hint
      setGateStatus("network", 22);
      showNotify({
        mode: "info",
        title: t("st_vpn_title"),
        text: t("st_vpn_desc"),
        primaryLabel: t("btn_try_again"),
        primaryAction: () => gateCheckAndProceed(),
        key: "vpn_hint_gate",
      });
      return;
    }

    // VIP badge on gate
    if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);

    // ONLY registration gate
    if (!AUTH.flags.registered) {
      setGateStatus(t("st_reg_required"), 24);
      showNotify({
        mode: "reg",
        title: t("st_reg_required"),
        text: t("st_reg_required_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
        key: "need_reg_gate",
      });
      return;
    }

    setGateStatus(t("st_checked"), 62);
    enterApp();
  }

  async function refreshAuthSilent(){
    // silent refresh for "Check" button (no deposit popups)
    if (!tg?.initData) {
      showNotify({
        mode: "info",
        title: t("st_need_tg"),
        text: t("st_need_tg_d"),
        primaryLabel: t("btn_try_again"),
        primaryAction: () => {},
        key: "need_tg_app",
      });
      return;
    }

   const raw = await authRequest();
console.log("AUTH_RAW_APP", raw);

const data = normalizeAuth(raw);
console.log("AUTH_NORM_APP", data);

if (data.ok) AUTH = data;

    safeText(chipAccess, "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING"));

    if (AUTH.vip) { show(pillVipTop); show(vipBadge); }
    else { hide(pillVipTop); hide(vipBadge); }

    // if lost registration -> back to gate
    if (!AUTH.flags.registered) {
      APP_ENTERED = false;
      hide(app); show(gate);
      setGateStatus(t("st_reg_required"), 24);
      showNotify({
        mode: "reg",
        title: t("st_reg_required"),
        text: t("st_reg_required_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
        key: "need_reg_back",
      });
    }
  }

  // =========================
  // Analysis (deposit ONLY here)
  // =========================
  async function runAnalysis(direction /* "long" | "short" */){
    // if no registration somehow -> route to gate
    if (!AUTH.flags.registered) {
      showNotify({
        mode: "reg",
        title: t("st_reg_required"),
        text: t("st_reg_required_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
        key: "need_reg_on_analyze",
      });
      return;
    }

    // deposit check ONLY on analysis
    if (AUTH.flags.dep_count < 1) {
      showNotify({
        mode: "deposit",
        title: t("st_deposit_required"),
        text: t("st_deposit_required_d"),
        primaryLabel: t("btn_open_deposit"),
        primaryAction: () => openURL(CONFIG.DEPOSIT_URL),
        key: "need_deposit_on_analyze",
      });
      return;
    }

    // run demo analysis
    const dur = 650 + Math.floor(Math.random() * 900);

    show(chartOverlay);
    if (overlayFill) overlayFill.style.width = "0%";

    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(100, Math.floor(((Date.now() - start) / dur) * 100));
      if (overlayFill) overlayFill.style.width = p + "%";
      if (p >= 100) clearInterval(tick);
    }, 60);

    await new Promise(r => setTimeout(r, dur));
    hide(chartOverlay);

    const isLong = direction === "long";
    setSignal(isLong ? "LONG-TREND" : "SHORT-TREND", isLong);

    const quality = 72 + Math.floor(Math.random() * 18);
    const conf = 60 + Math.floor(Math.random() * 30);

    safeText(chipQuality, `Quality: ${quality}`);
    safeText(chipConf, `Conf: ${conf}`);

    safeText(rAcc, `${quality}%`);
    safeText(volFactor, ["Low","Mid","High"][Math.floor(Math.random()*3)]);
    safeText(momFactor, ["Soft","Stable","Strong"][Math.floor(Math.random()*3)]);
    safeText(liqFactor, ["Thin","Normal","Deep"][Math.floor(Math.random()*3)]);

    const now = new Date();
    const until = new Date(now.getTime() + 30*1000);
    safeText(rWindow, tfValue?.textContent || "30s");
    safeText(rUntil, `${String(until.getHours()).padStart(2,"0")}:${String(until.getMinutes()).padStart(2,"0")}`);

    drawChartDemo(isLong ? 1 : -1);
    drawMiniChartDemo(isLong ? 1 : -1);
  }

  // =========================
  // Reset
  // =========================
  function doReset(){
    safeText(chipQuality, t("chart_quality"));
    safeText(chipConf, t("chart_conf"));
    safeText(rAcc, "—%");
    safeText(volFactor, "—");
    safeText(momFactor, "—");
    safeText(liqFactor, "—");
    setSignal("LONG-TREND", true);
    drawChartDemo();
    drawMiniChartDemo();
  }

  // =========================
  // Events binding (safe)
  // =========================
  function bindEvents(){
    btnOpenReg?.addEventListener("click", () => openURL(CONFIG.REG_URL));
    btnGetAccess?.addEventListener("click", () => gateCheckAndProceed());

    btnLangGate?.addEventListener("click", openLangModal);
    btnLangApp?.addEventListener("click", openLangModal);

    btnNotifyClose?.addEventListener("click", () => hideNotify());

    btnCheckStatus?.addEventListener("click", refreshAuthSilent);
    btnReset?.addEventListener("click", doReset);

    btnAnalyze?.addEventListener("click", () => runAnalysis("long"));
    btnLong?.addEventListener("click", () => runAnalysis("long"));
    btnShort?.addEventListener("click", () => runAnalysis("short"));

    assetBtn?.addEventListener("click", openAssets);
    tfBtn?.addEventListener("click", openTF);
    marketBtn?.addEventListener("click", toggleMarket);

    backdrop?.addEventListener("click", () => {
      closeModal(assetsModal);
      closeModal(tfModal);
      closeModal(langModal);
    });

    closeAssets?.addEventListener("click", () => closeModal(assetsModal));
    closeTf?.addEventListener("click", () => closeModal(tfModal));
    closeLang?.addEventListener("click", () => closeModal(langModal));
  }

  // =========================
  // Boot
  // =========================
  async function boot(){
    // IMPORTANT UI SAFETY: start with ONLY gate visible
    show(gate);
    hide(app);

    LANG = localStorage.getItem("lang") || "ru";
    applyI18n();

    await loadAssetsJson();

    setGateStatus(t("gate_status_na"), 14);
    setSignal("LONG-TREND", true);

    // quick VIP badge attempt (silent, no popups)
    if (tg?.initData) {
      authRequest()
       .then(raw => {
  console.log("AUTH_RAW_BOOT", raw);

  const data = normalizeAuth(raw);
  console.log("AUTH_NORM_BOOT", data);

  if (data.ok) {
    AUTH = data;
    ...
  }
})
        .catch(() => {});
    }

    drawChartDemo();
    drawMiniChartDemo();
  }

  bindEvents();
  boot();

 const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();

  console.log("[TG] exists?", !!window.Telegram?.WebApp);
  console.log("[TG] initData length =", window.Telegram?.WebApp?.initData?.length || 0);
}
