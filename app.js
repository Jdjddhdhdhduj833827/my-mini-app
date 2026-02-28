/* app.js — CRAFT ANALYTICS (fixed)
   ЛОГИКА (как ты попросил):
   A) Вход в интерфейс (app) требует ТОЛЬКО регистрации:
      - если registered=0 -> notify "Нужна регистрация" (кнопка REG_URL)
      - если registered=1 -> пускаем в app сразу (депозит НЕ трогаем)

   B) Депозит проверяем ТОЛЬКО при попытке анализа:
      - если dep_count < 1 -> notify "Нужен депозит" (кнопка DEPOSIT_URL)
      - если депозит есть -> запускаем демо-анализ

   C) Анти-спам:
      - одно и то же уведомление не всплывает бесконечно при каждом клике подряд
      - если уведомление уже открыто с тем же режимом — повторно не дергаем

   D) VPN hint — показываем в тексте статуса (и можно добавить отдельный блок в HTML, см. ниже)
*/

const CONFIG = {
  API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
  REG_URL: "https://example.com/register",   // <-- замени на свою
  DEPOSIT_URL: "https://example.com/deposit",// <-- замени на свою
  ASSETS_JSON: "./assets.json",
  NOTIFY_COOLDOWN_MS: 1200,
};

const tg = window.Telegram?.WebApp || null;
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
let NOTIFY_MODE = null; // "reg" | "deposit" | "need_tg"
let LAST_NOTIFY_KEY = "";
let LAST_NOTIFY_AT = 0;

let AUTH = {
  ok: false,
  telegram_id: "",
  access: false,
  vip: false,
  flags: { registered: 0, dep_count: 0, approved: 0 },
};

let ASSETS = {
  Forex: ["EUR/USD","GBP/USD","USD/JPY","USD/CHF"],
  Crypto: ["BTC/USD","ETH/USD"],
  Stocks: ["AAPL","TSLA"],
  Commodities: ["Gold","Oil"],
};

let TIMEFRAMES = ["15s","30s","1m"];

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

    // сообщения
    st_need_tg: "Откройте внутри Telegram",
    st_need_tg_d: "Мини-приложение работает только внутри Telegram.\n\nЕсли вы открыли ссылку в браузере — статус не определится.",
    st_reg_required: "Нужна регистрация",
    st_reg_required_d: "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь в мини-приложение.\n\nСовет: для корректной работы сервера лучше отключить VPN.",
    st_deposit_required: "Требуется депозит",
    st_deposit_required_d: "Чтобы получить сигнал, пополните депозит и снова нажмите «Запустить анализ».\n\nСовет: для корректной работы сервера лучше отключить VPN.",

    btn_open_reg: "Открыть регистрацию",
    btn_open_deposit: "Открыть пополнение",
    st_checked: "проверено",
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
    st_need_tg_d: "This mini app works only inside Telegram.\n\nIf you opened it in a browser — status cannot be verified.",
    st_reg_required: "Registration required",
    st_reg_required_d: "Tap “Open registration”, create an account, then come back.\n\nTip: disable VPN for stable server connection.",
    st_deposit_required: "Deposit required",
    st_deposit_required_d: "To get a signal, make a deposit, then tap “Run analysis” again.\n\nTip: disable VPN for stable server connection.",

    btn_open_reg: "Open registration",
    btn_open_deposit: "Open deposit",
    st_checked: "checked",
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
}

// ---------- helpers ----------
function show(el){ el?.classList.remove("hidden"); }
function hide(el){ el?.classList.add("hidden"); }

function setGateStatus(text, meterPct){
  if (gateStatusText) gateStatusText.textContent = text;
  if (gateMeter && typeof meterPct === "number") gateMeter.style.width = `${meterPct}%`;
}

function isInsideTelegram(){
  // Важно: tg может существовать, но initData пустой, если открыт не из WebApp-кнопки.
  const initData = tg?.initData || "";
  return !!initData && initData.length > 10;
}

function openURL(url){
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank");
}

// ---------- notify (anti-spam) ----------
function canShowNotify(key){
  const now = Date.now();
  if (notify && !notify.classList.contains("hidden") && key === LAST_NOTIFY_KEY) {
    // уже открыто это же — не дергаем
    return false;
  }
  if (key === LAST_NOTIFY_KEY && (now - LAST_NOTIFY_AT) < CONFIG.NOTIFY_COOLDOWN_MS) {
    return false;
  }
  LAST_NOTIFY_KEY = key;
  LAST_NOTIFY_AT = now;
  return true;
}

function premiumNotify(mode, title, text){
  const key = `${mode}:${title}`;
  if (!canShowNotify(key)) return;

  NOTIFY_MODE = mode;
  notifyTitle.textContent = title;
  notifyText.textContent = text;

  if (mode === "reg") notifyPrimaryLabel.textContent = t("btn_open_reg");
  else if (mode === "deposit") notifyPrimaryLabel.textContent = t("btn_open_deposit");
  else notifyPrimaryLabel.textContent = t("btn_open_reg");

  show(notify);
}

function closeNotify(){
  hide(notify);
  NOTIFY_MODE = null;
}

// ---------- AUTH ----------
async function auth(){
  const initData = tg?.initData || "";
  if (!initData) return { ok:false, error:"no initData" };

  const resp = await fetch(CONFIG.API_BASE + "/pb/auth", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ initData })
  });

  const data = await resp.json().catch(()=> ({}));
  return data;
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
    }
  };
}

// ---------- Gate flow (REG only) ----------
async function gateCheckAndProceed(){
  setGateStatus(t("gate_status_na"), 18);

  if (!isInsideTelegram()){
    setGateStatus(t("st_need_tg"), 22);
    premiumNotify("need_tg", t("st_need_tg"), t("st_need_tg_d"));
    return;
  }

  setGateStatus("…", 34);

  const data = normalizeAuth(await auth());
  if (data.ok) AUTH = data;

  if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);

  // 1) Требуем только регистрацию
  if (!AUTH.flags.registered){
    setGateStatus(t("st_reg_required"), 26);
    premiumNotify("reg", t("st_reg_required"), t("st_reg_required_d"));
    return;
  }

  // 2) зарегистрирован -> сразу в app (депозит НЕ проверяем тут)
  setGateStatus(t("st_checked"), 72);
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

  // обновим AUTH тихо (без депозит-уведомлений)
  setTimeout(() => refreshAuthSilent(), 350);

  drawChartDemo();
  drawMiniChartDemo();
}

async function refreshAuthSilent(){
  if (!isInsideTelegram()) return;
  const data = normalizeAuth(await auth());
  if (data.ok) AUTH = data;

  chipAccess.textContent = "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING");
  if (AUTH.vip) { show(pillVipTop); show(vipBadge); }
  else { hide(pillVipTop); hide(vipBadge); }

  // если вдруг сервер сказал "не зарегистрирован" — возвращаем на gate
  if (!AUTH.flags.registered){
    hide(app); show(gate);
    premiumNotify("reg", t("st_reg_required"), t("st_reg_required_d"));
  }
}

// ---------- Assets loader ----------
async function loadAssetsJson(){
  try {
    const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
    if (!r.ok) throw new Error("assets.json not ok");
    const j = await r.json();
    if (j?.categories) ASSETS = j.categories;
    if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
  } catch (e) {}
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
      // обновим подпись notify кнопки
      if (notify && !notify.classList.contains("hidden")) {
        if (NOTIFY_MODE === "deposit") notifyPrimaryLabel.textContent = t("btn_open_deposit");
        else notifyPrimaryLabel.textContent = t("btn_open_reg");
      }
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

  assetSearch.addEventListener("input", render);
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

// ---------- Deposit check only on analysis ----------
async function ensureAuthFresh(){
  // обновляем перед анализом, чтобы не ловить "зарегистрирован, но почему-то не..."
  if (!isInsideTelegram()) return false;
  const data = normalizeAuth(await auth());
  if (data.ok) AUTH = data;
  return true;
}

async function runAnalysis(direction /* "long" | "short" */){
  // если не в Telegram — сразу предупреждение
  if (!isInsideTelegram()){
    premiumNotify("need_tg", t("st_need_tg"), t("st_need_tg_d"));
    return;
  }

  await ensureAuthFresh();

  // если вдруг слетел registered — на gate
  if (!AUTH.flags.registered){
    hide(app); show(gate);
    premiumNotify("reg", t("st_reg_required"), t("st_reg_required_d"));
    return;
  }

  // ВАЖНО: депозит проверяем ТОЛЬКО тут
  if (AUTH.flags.dep_count < 1){
    premiumNotify("deposit", t("st_deposit_required"), t("st_deposit_required_d"));
    return;
  }

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
btnOpenReg?.addEventListener("click", () => openURL(CONFIG.REG_URL));
btnGetAccess?.addEventListener("click", gateCheckAndProceed);

btnLangGate?.addEventListener("click", openLangModal);
btnLangApp?.addEventListener("click", openLangModal);

btnNotifyPrimary?.addEventListener("click", () => {
  if (NOTIFY_MODE === "deposit") openURL(CONFIG.DEPOSIT_URL);
  else openURL(CONFIG.REG_URL);
});
btnNotifyClose?.addEventListener("click", closeNotify);

btnCheckStatus?.addEventListener("click", refreshAuthSilent);

btnReset?.addEventListener("click", () => {
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

// ---------- Boot ----------
(async function boot(){
  LANG = localStorage.getItem("lang") || "ru";
  applyI18n();

  await loadAssetsJson();

  setGateStatus(t("gate_status_na"), 14);
  setSignal("LONG-TREND", true);

  drawChartDemo();
  drawMiniChartDemo();

  // если открыто внутри TG — обновим VIP/registered тихо (без модалок)
  if (isInsideTelegram()){
    try {
      const data = normalizeAuth(await auth());
      if (data.ok) AUTH = data;
      if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);
    } catch(e){}
  }
})();
