/* app.js (новая стабильная версия)
   ЛОГИКА:
   A) GATE (вход):
      - если нет Telegram/initData -> показываем подсказку (и про VPN), остаёмся на gate
      - иначе -> auth -> если НЕ зарегистрирован -> окно "Регистрация"
      - если зарегистрирован -> пускаем в app (депозит НЕ проверяем)
   B) APP:
      - "Проверить" обновляет AUTH и UI (VIP/ACCESS), но НЕ показывает депозитных окон
      - депозитное окно показываем ТОЛЬКО при клике "Анализ / LONG / SHORT"
   C) Notify антиспам:
      - одно и то же сообщение не показывается повторно при повторных нажатиях
   D) VPN:
      - если API недоступен: пробуем альтернативные базы (CONFIG.API_BASES)
      - если всё упало: показываем в notify текст "включите VPN"
*/

const CONFIG = {
  // Можно указать несколько баз — будет авто-fallback
  // 1) основной
  // 2) резерв (через другой домен/воркер) — добавишь при необходимости
  API_BASES: [
    "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev"
    // "https://your-second-worker.example.workers.dev"
  ],
  REG_URL: "https://example.com/register",
  DEPOSIT_URL: "https://example.com/deposit",
  ASSETS_JSON: "./assets.json",
  FETCH_TIMEOUT_MS: 9000
};

const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const gate = $("gate");
const app = $("app");

const btnOpenReg = $("btnOpenReg");
const btnGetAccess = $("btnGetAccess");
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

// ---------- State ----------
let LANG = "ru";

// Антиспам notify
let LAST_NOTIFY_KEY = "";     // ключ последнего показа
let NOTIFY_MODE = "reg";      // "reg" | "deposit" | "info"

// auth
let AUTH = {
  ok: false,
  telegram_id: "",
  access: false,
  vip: false,
  flags: { registered: 0, dep_count: 0, approved: 0 },
};

// assets/timeframes
let ASSETS = {
  Forex: ["EUR/USD","GBP/USD","USD/JPY","USD/CHF"],
  Crypto: ["BTC/USD","ETH/USD"],
  Stocks: ["AAPL","TSLA"],
  Commodities: ["Gold","Oil"],
};
let TIMEFRAMES = ["15s","30s","1m"];

// Текущая рабочая API base (VPN/fallback)
let API_BASE = "";

// ---------- i18n ----------
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
    st_need_tg_d: "Мини-приложение работает только внутри Telegram. Если Telegram/доступ блокируется — включите VPN и попробуйте снова.",

    st_reg_required: "Сначала создайте аккаунт",
    st_reg_required_d: "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь в мини-приложение, затем нажмите «Получить доступ».",

    st_deposit_required: "Требуется депозит",
    st_deposit_required_d: "Чтобы запустить анализ, внесите депозит. После пополнения вернитесь и повторите запуск анализа.",

    st_api_down: "Нет соединения с сервером",
    st_api_down_d: "Сервер недоступен. Попробуйте включить VPN и нажать снова.",

    btn_open_reg: "Открыть регистрацию",
    btn_open_deposit: "Открыть пополнение",
    btn_retry: "Повторить"
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
    st_need_tg_d: "This mini app works only inside Telegram. If access is blocked, enable VPN and try again.",

    st_reg_required: "Create an account first",
    st_reg_required_d: "Tap “Open registration”, create an account, return to the mini app and tap “Get access”.",

    st_deposit_required: "Deposit required",
    st_deposit_required_d: "To run analysis, make a deposit. Then return and run analysis again.",

    st_api_down: "Server unavailable",
    st_api_down_d: "Server is unreachable. Try enabling VPN and retry.",

    btn_open_reg: "Open registration",
    btn_open_deposit: "Open deposit",
    btn_retry: "Retry"
  }
};

function t(key){
  return (I18N[LANG] && I18N[LANG][key]) ? I18N[LANG][key] : key;
}

function applyI18n(){
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i]").forEach(el => {
    const k = el.getAttribute("data-i");
    el.textContent = t(k);
  });
  // обновим динамические подписи notify, если открыт
  if (!notify.classList.contains("hidden")) {
    if (NOTIFY_MODE === "reg") notifyPrimaryLabel.textContent = t("btn_open_reg");
    if (NOTIFY_MODE === "deposit") notifyPrimaryLabel.textContent = t("btn_open_deposit");
  }
}

// ---------- UI helpers ----------
function show(el){ el?.classList.remove("hidden"); }
function hide(el){ el?.classList.add("hidden"); }

function setGateStatus(text, meterPct){
  if (gateStatusText) gateStatusText.textContent = text;
  if (gateMeter && typeof meterPct === "number") gateMeter.style.width = `${meterPct}%`;
}

function openURL(url){
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank");
}

// Мягкая блокировка (используем только когда notify открыт, чтобы не было мискликов)
function setLocked(isLocked){
  if (isLocked) show(softLock);
  else hide(softLock);
}

// ---------- Helpers: parse URL param ----------
function getQueryParam(name){
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

// ---------- Network helpers ----------
function withTimeout(promise, ms){
  const ac = new AbortController();
  const tmr = setTimeout(() => ac.abort(), ms);
  const wrapped = (async () => {
    try {
      const res = await promise(ac.signal);
      return res;
    } finally {
      clearTimeout(tmr);
    }
  })();
  return wrapped;
}

async function fetchJson(url, options = {}, timeoutMs = CONFIG.FETCH_TIMEOUT_MS){
  return withTimeout(async (signal) => {
    const resp = await fetch(url, { ...options, signal });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, data };
  }, timeoutMs);
}

// ---------- AUTH ----------
function normalizeAuth(data){
  const flags = data?.flags || {};
  const toNum = (v) => {
    if (v === true) return 1;
    if (v === false) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    ok: !!data?.ok,
    telegram_id: String(data?.telegram_id || ""),
    access: !!data?.access,
    vip: !!data?.vip,
    flags: {
      registered: toNum(flags.registered),
      dep_count: toNum(flags.dep_count),
      approved: toNum(flags.approved),
    }
  };
}

function getInitData(){
  return tg?.initData || "";
}

async function authRequest(){
  const initData = getInitData();
  if (!initData) return { ok:false, error:"no_initData" };

  // приоритет: ?api=... -> localStorage -> список CONFIG.API_BASES
  const forced = getQueryParam("api");
  if (forced) {
    localStorage.setItem("api_base", forced);
  }
  const saved = localStorage.getItem("api_base");

  const bases = [];
  if (saved) bases.push(saved);
  CONFIG.API_BASES.forEach(b => { if (!bases.includes(b)) bases.push(b); });

  // пробуем базы по очереди
  for (const base of bases) {
    const url = base.replace(/\/$/, "") + "/pb/auth";
    try {
      const res = await fetchJson(url, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ initData })
      });

      if (res.ok && res.data) {
        API_BASE = base;
        localStorage.setItem("api_base", base);
        return { ok:true, data: res.data, base };
      }
    } catch (e) {
      // пробуем следующую
    }
  }

  return { ok:false, error:"api_down" };
}

async function refreshAuth(){
  const r = await authRequest();
  if (!r.ok) return { ok:false, error:r.error };
  const a = normalizeAuth(r.data);
  if (a.ok) AUTH = a;
  return { ok:a.ok, auth:a };
}

// ---------- Notify (anti-spam) ----------
function showNotify({ mode, title, text, primaryLabel, primaryAction, key, lock = true }){
  // антиспам: если уже показано это же — не повторяем
  if (key && key === LAST_NOTIFY_KEY && !notify.classList.contains("hidden")) {
    return;
  }

  LAST_NOTIFY_KEY = key || `${mode}:${title}:${text}`;
  NOTIFY_MODE = mode;

  notifyTitle.textContent = title;
  notifyText.textContent = text;

  // primary button label
  notifyPrimaryLabel.textContent = primaryLabel || (
    mode === "deposit" ? t("btn_open_deposit") :
    mode === "reg" ? t("btn_open_reg") :
    t("btn_retry")
  );

  // навесим обработчик (заменим безопасно)
  btnNotifyPrimary.onclick = () => {
    if (typeof primaryAction === "function") primaryAction();
  };

  show(notify);
  setLocked(!!lock);
}

function closeNotify(){
  hide(notify);
  setLocked(false);
  // LAST_NOTIFY_KEY НЕ сбрасываем — чтобы не спамило при повторном клике в ту же секунду
}

// ---------- Gate flow ----------
async function gateCheckAndProceed(){
  LAST_NOTIFY_KEY = ""; // на gate можно сбросить, чтобы новые статусы показывались
  setGateStatus(t("gate_status_na"), 18);

  // must be inside Telegram
  if (!getInitData()) {
    setGateStatus(t("st_need_tg"), 22);
    showNotify({
      mode: "reg",
      title: t("st_need_tg"),
      text: t("st_need_tg_d"),
      primaryLabel: t("btn_retry"),
      primaryAction: () => gateCheckAndProceed(),
      key: "need_tg",
      lock: true
    });
    return;
  }

  setGateStatus("…", 32);

  const r = await refreshAuth();
  if (!r.ok) {
    setGateStatus(t("st_api_down"), 22);
    showNotify({
      mode: "info",
      title: t("st_api_down"),
      text: t("st_api_down_d"),
      primaryLabel: t("btn_retry"),
      primaryAction: () => gateCheckAndProceed(),
      key: "api_down_gate",
      lock: true
    });
    return;
  }

  if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);

  // ВХОД: проверяем ТОЛЬКО регистрацию
  if (!AUTH.flags.registered) {
    setGateStatus(t("st_reg_required"), 24);
    showNotify({
      mode: "reg",
      title: t("st_reg_required"),
      text: t("st_reg_required_d"),
      primaryLabel: t("btn_open_reg"),
      primaryAction: () => openURL(CONFIG.REG_URL),
      key: "need_reg_gate",
      lock: true
    });
    return;
  }

  // зарегистрирован -> пускаем в app
  setGateStatus("OK", 62);
  closeNotify();
  enterApp();
}

function enterApp(){
  hide(gate);
  show(app);

  chipSession.textContent = "SESSION: " + (AUTH.telegram_id ? AUTH.telegram_id.slice(-6) : "—");
  chipAccess.textContent = "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING");

  if (AUTH.vip) show(pillVipTop); else hide(pillVipTop);
  if (AUTH.vip) show(vipBadge); else hide(vipBadge);

  // ВАЖНО: НЕ показываем депозитные окна на входе
  // Но обновим auth тихо (без notify), чтобы UI был свежий
  setTimeout(async () => {
    await refreshAuthSilent();
  }, 350);

  drawChartDemo();
  drawMiniChartDemo();
}

async function refreshAuthSilent(){
  if (!getInitData()) return;
  const r = await refreshAuth();
  if (!r.ok) return;

  chipAccess.textContent = "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING");
  if (AUTH.vip) { show(pillVipTop); show(vipBadge); show(pillVipGate); }
  else { hide(pillVipTop); hide(vipBadge); hide(pillVipGate); }

  // если сервер внезапно “сбросил” registered -> возвращаем на gate
  if (!AUTH.flags.registered) {
    hide(app); show(gate);
    setGateStatus(t("st_reg_required"), 24);
    showNotify({
      mode: "reg",
      title: t("st_reg_required"),
      text: t("st_reg_required_d"),
      primaryLabel: t("btn_open_reg"),
      primaryAction: () => openURL(CONFIG.REG_URL),
      key: "need_reg_back",
      lock: true
    });
  }
}

// Кнопка "Проверить" в app: обновляет статус, но НЕ депозитные окна
async function onCheckStatus(){
  await refreshAuthSilent();
}

// ---------- Assets loader ----------
async function loadAssetsJson(){
  try {
    const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
    if (!r.ok) throw new Error("assets.json not ok");
    const j = await r.json();
    if (j?.categories) ASSETS = j.categories;
    if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
  } catch (e) {
    // fallback оставляем дефолт
  }
}

// ---------- Modals ----------
function openModal(modal){
  show(backdrop);
  show(modal);
}
function closeModal(modal){
  hide(modal);
  hide(backdrop);
}

// ---------- Language ----------
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

// ---------- Assets/TF UI ----------
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

  assetSearch.oninput = render;
  render();
  openModal(assetsModal);
}

function openTF(){
  tfList.innerHTML = "";
  TIMEFRAMES.forEach(tf => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<div>${tf}</div><div>Timeframe</div>`;
    row.addEventListener("click", () => {
      tfValue.textContent = tf;
      closeModal(tfModal);
    });
    tfList.appendChild(row);
  });
  openModal(tfModal);
}

// ---------- Market toggle ----------
function toggleMarket(){
  marketValue.textContent = (marketValue.textContent === "OTC") ? "Market" : "OTC";
  drawChartDemo();
}

// ---------- Analysis (demo) ----------
async function runAnalysis(direction /* "long" | "short" */){
  // Перед анализом — тихо обновим auth, чтобы dep_count был актуальным
  await refreshAuthSilent();

  // Депозит проверяем ТОЛЬКО тут
  if (AUTH.flags.dep_count < 1) {
    showNotify({
      mode: "deposit",
      title: t("st_deposit_required"),
      text: t("st_deposit_required_d"),
      primaryLabel: t("btn_open_deposit"),
      primaryAction: () => openURL(CONFIG.DEPOSIT_URL),
      key: "need_deposit_analysis",
      lock: true
    });
    return;
  }

  // если notify был открыт — закрываем
  if (!notify.classList.contains("hidden")) closeNotify();

  const dur = 600 + Math.floor(Math.random() * 1000);

  show(chartOverlay);
  overlayFill.style.width = "0%";

  const start = Date.now();
  const tick = setInterval(() => {
    const p = Math.min(100, Math.floor(((Date.now() - start) / dur) * 100));
    overlayFill.style.width = p + "%";
    if (p >= 100) clearInterval(tick);
  }, 60);

  await new Promise(r => setTimeout(r, dur));
  hide(chartOverlay);

  const isLong = direction === "long";
  setSignal(isLong ? "LONG-TREND" : "SHORT-TREND", isLong);

  const quality = 72 + Math.floor(Math.random() * 18);
  const conf = 60 + Math.floor(Math.random() * 30);

  chipQuality.textContent = `Quality: ${quality}`;
  chipConf.textContent = `Conf: ${conf}`;

  rAcc.textContent = `${quality}%`;
  volFactor.textContent = ["Low","Mid","High"][Math.floor(Math.random()*3)];
  momFactor.textContent = ["Soft","Stable","Strong"][Math.floor(Math.random()*3)];
  liqFactor.textContent = ["Thin","Normal","Deep"][Math.floor(Math.random()*3)];

  const now = new Date();
  const until = new Date(now.getTime() + 30*1000);
  rWindow.textContent = tfValue.textContent || "30s";
  rUntil.textContent = `${String(until.getHours()).padStart(2,"0")}:${String(until.getMinutes()).padStart(2,"0")}`;

  drawChartDemo(isLong ? 1 : -1);
  drawMiniChartDemo(isLong ? 1 : -1);
}

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

// ---------- Demo charts ----------
function drawChartDemo(bias = 0){
  if (!chart) return;
  const ctx = chart.getContext("2d");
  const w = chart.width;
  const h = chart.height;

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0,0,w,h);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  const step = 46;
  for (let x=0; x<w; x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y=0; y<h; y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  ctx.globalAlpha = 1;

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

// ---------- Events ----------
btnOpenReg.addEventListener("click", () => openURL(CONFIG.REG_URL));
btnGetAccess.addEventListener("click", gateCheckAndProceed);

btnLangGate.addEventListener("click", openLangModal);
btnLangApp.addEventListener("click", openLangModal);

btnNotifyClose.addEventListener("click", closeNotify);

btnCheckStatus.addEventListener("click", onCheckStatus);

btnReset.addEventListener("click", () => {
  chipQuality.textContent = t("chart_quality");
  chipConf.textContent = t("chart_conf");
  rAcc.textContent = "—%";
  volFactor.textContent = "—";
  momFactor.textContent = "—";
  liqFactor.textContent = "—";
  setSignal("LONG-TREND", true);
  drawChartDemo();
  drawMiniChartDemo();
});

btnAnalyze.addEventListener("click", () => runAnalysis("long"));
btnLong.addEventListener("click", () => runAnalysis("long"));
btnShort.addEventListener("click", () => runAnalysis("short"));

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

// ---------- Boot ----------
(async function boot(){
  LANG = localStorage.getItem("lang") || "ru";
  applyI18n();

  await loadAssetsJson();

  setGateStatus(t("gate_status_na"), 14);
  setSignal("LONG-TREND", true);

  // VIP метка — тихо, без редиректов/окон
  if (getInitData()) {
    refreshAuthSilent().catch(()=>{});
  }

  drawChartDemo();
  drawMiniChartDemo();
})();
