/* =========================================================
   CRAFT ANALYTICS — app.js (FULL)
   - Gate -> Main
   - Real auth via /pb/auth (Telegram initData)
   - Deposit notify after entry (0.5s)
   - SoftLock blur if no deposit
   - Full i18n RU/EN (except LONG/SHORT, AI, Premium, VIP)
   - Premium chart demo + random scan duration
========================================================= */

const CONFIG = {
  API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
  // Эти ссылки ты потом заменишь на реальные:
  REG_URL: "https://example.com/register",     // куда ведёт кнопка "Открыть регистрацию"
  DEPOSIT_URL: "https://example.com/deposit",  // куда ведёт "Открыть пополнение"
};

// Telegram WebApp
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

const btnMenu = $("btnMenu");
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
const btnOpenDeposit = $("btnOpenDeposit");
const btnNotifyClose = $("btnNotifyClose");

const softLock = $("softLock");

// ---------- State ----------
let LANG = "ru"; // default RU
let AUTH = {
  ok: false,
  telegram_id: "",
  access: false,
  vip: false,
  flags: { registered: 0, dep_count: 0, approved: 0 },
};

// ---------- i18n ----------
const I18N = {
  ru: {
    gate_sub: "Premium terminal • Smart trading assistant",
    gate_title: "Доступ к торговому терминалу",
    gate_text_main: "Доступ открывается только для новых аккаунтов с внесённым депозитом.",
    gate_step1_t: "Регистрация",
    gate_step1_d: "Создайте новый аккаунт через кнопку ниже.",
    gate_step2_t: "Активация",
    gate_step2_d: "После регистрации нажмите «Получить доступ».",
    gate_step3_t: "Trading Environment",
    gate_step3_d: "AI-терминал открывает доступ к профессиональной торговой среде. После активации доступны все инструменты и аналитические модули системы.",
    gate_btn_reg: "Открыть регистрацию",
    gate_btn_access: "Получить доступ",
    gate_status: "Статус:",
    gate_status_na: "не проверен",
    gate_legal: "Premium AI-interface. Demo UI. Not a financial advice.",
    gate_meter: "SECURITY • initData required",

    app_sub: "Premium AI Trading Terminal",
    hero_title: "Terminal Overview",
    hero_sub: "Smart mode • Adaptive execution • Premium UI",
    hero_mode: "MODE: SMART",

    cc_title: "CONTROL CENTER",
    cc_btn_check: "Проверить",
    cc_btn_reset: "Сброс",
    cc_hint: "Нажмите «Запустить анализ» — получите сигнал и подтверждение на графике.",
    cc_btn_analyze: "Запустить анализ",

    chart_title: "MARKET VISUAL",
    chart_quality: "Quality: —",
    chart_conf: "Conf: —",
    chart_scan: "Сканирование рынка…",

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

    footnote: "Реальная проверка доступа/VIP выполняется на сервере через Telegram initData.",

    notify_btn_deposit: "Открыть пополнение",
    notify_btn_ok: "Понятно",

    // runtime texts
    st_need_tg: "Откройте внутри Telegram",
    st_need_tg_d: "Мини-приложение работает только внутри Telegram.",
    st_checked: "проверено",
    st_reg_required: "Сначала создайте аккаунт",
    st_reg_required_d: "Нажмите «Открыть регистрацию», создайте новый аккаунт и вернитесь сюда.",
    st_deposit_required: "Требуется депозит",
    st_deposit_required_d: "Активируйте аккаунт внесением депозита — после этого терминал откроется автоматически.",
    st_access_ok: "Доступ открыт",
    st_vip_ok: "VIP активен",
  },

  en: {
    gate_sub: "Premium terminal • Smart trading assistant",
    gate_title: "Terminal access",
    gate_text_main: "Access is available only for new accounts with a deposit.",
    gate_step1_t: "Registration",
    gate_step1_d: "Create a new account using the button below.",
    gate_step2_t: "Activation",
    gate_step2_d: "After registration, tap “Get access”.",
    gate_step3_t: "Trading Environment",
    gate_step3_d: "AI terminal unlocks a professional trading environment. After activation, all tools and analytics modules become available.",
    gate_btn_reg: "Open registration",
    gate_btn_access: "Get access",
    gate_status: "Status:",
    gate_status_na: "not checked",
    gate_legal: "Premium AI-interface. Demo UI. Not a financial advice.",
    gate_meter: "SECURITY • initData required",

    app_sub: "Premium AI Trading Terminal",
    hero_title: "Terminal Overview",
    hero_sub: "Smart mode • Adaptive execution • Premium UI",
    hero_mode: "MODE: SMART",

    cc_title: "CONTROL CENTER",
    cc_btn_check: "Check",
    cc_btn_reset: "Reset",
    cc_hint: "Tap “Run analysis” to generate a signal and on-chart confirmation.",
    cc_btn_analyze: "Run analysis",

    chart_title: "MARKET VISUAL",
    chart_quality: "Quality: —",
    chart_conf: "Conf: —",
    chart_scan: "Scanning market…",

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

    footnote: "Access/VIP is verified on server using Telegram initData.",

    notify_btn_deposit: "Open deposit",
    notify_btn_ok: "Got it",

    st_need_tg: "Open inside Telegram",
    st_need_tg_d: "This mini app works only inside Telegram.",
    st_checked: "checked",
    st_reg_required: "Create an account first",
    st_reg_required_d: "Tap “Open registration”, create a new account, then come back.",
    st_deposit_required: "Deposit required",
    st_deposit_required_d: "Activate your account with a deposit — the terminal unlocks automatically.",
    st_access_ok: "Access granted",
    st_vip_ok: "VIP active",
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

// ---------- UI helpers ----------
function show(el){ el?.classList.remove("hidden"); }
function hide(el){ el?.classList.add("hidden"); }

function setGateStatus(text, meterPct){
  if (gateStatusText) gateStatusText.textContent = text;
  if (gateMeter && typeof meterPct === "number") gateMeter.style.width = `${meterPct}%`;
}

function openURL(url){
  // Внутри Telegram лучше так
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank");
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

// ---------- Gate flow ----------
async function gateCheckAndProceed(){
  setGateStatus(t("gate_status_na"), 18);

  if (!tg?.initData) {
    setGateStatus(t("st_need_tg"), 22);
    premiumNotify(t("st_need_tg"), t("st_need_tg_d"), { lock: false });
    return;
  }

  setGateStatus("…", 32);

  const data = normalizeAuth(await auth());
  AUTH = data;

  // VIP badge visual
  if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);

  // 1) Если НЕ зарегистрирован — не пускаем в app, просим регу
  if (!AUTH.flags.registered) {
    setGateStatus(t("st_reg_required"), 24);
    premiumNotify(t("st_reg_required"), t("st_reg_required_d"), { lock:false });
    return;
  }

  // 2) Зарегистрирован -> переходим в app (как ты хотел).
  // Депозит проверим уже внутри и там же покажем уведомление через 0.5 сек.
  setGateStatus(t("st_checked"), 62);
  enterApp();
}

// ---------- Enter main app ----------
function enterApp(){
  hide(gate);
  show(app);

  // обновим чипы
  chipSession.textContent = "SESSION: " + (AUTH.telegram_id ? AUTH.telegram_id.slice(-6) : "—");
  chipAccess.textContent = "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING");

  if (AUTH.vip) show(pillVipTop); else hide(pillVipTop);
  if (AUTH.vip) show(vipBadge); else hide(vipBadge);

  // РЕАЛЬНАЯ проверка депозита/доступа — ещё раз (обязательно)
  setTimeout(async () => {
    await refreshAuthAndEnforce();
  }, 500);

  // Рендерим графики (премиум демо)
  drawChartDemo();
  drawMiniChartDemo();
}

// ---------- Enforce deposit gate inside main ----------
async function refreshAuthAndEnforce(){
  const data = normalizeAuth(await auth());
  if (data.ok) AUTH = data;

  chipAccess.textContent = "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING");

  if (AUTH.vip) { show(pillVipTop); show(vipBadge); }
  else { hide(pillVipTop); hide(vipBadge); }

  // Если нет депозита (dep_count < 1) — показываем премиальное уведомление + softLock
  if (AUTH.flags.dep_count < 1) {
    premiumNotify(
      t("st_deposit_required"),
      t("st_deposit_required_d"),
      { lock:true }
    );
    setLocked(true);
  } else {
    // депозит есть — снять лок и уведомления
    hide(notify);
    setLocked(false);
  }
}

function setLocked(isLocked){
  if (isLocked) show(softLock);
  else hide(softLock);

  // Блокируем ключевые действия, но UI остаётся видимым.
  btnAnalyze.disabled = isLocked;
  btnLong.disabled = isLocked;
  btnShort.disabled = isLocked;

  btnAnalyze.style.opacity = isLocked ? ".55" : "";
  btnLong.style.opacity = isLocked ? ".55" : "";
  btnShort.style.opacity = isLocked ? ".55" : "";
}

// ---------- Premium notify ----------
function premiumNotify(title, text, opts = { lock:false }){
  notifyTitle.textContent = title;
  notifyText.textContent = text;
  show(notify);

  // если lock=false — просто уведомление, интерфейс не блокируем
  if (!opts.lock) hide(softLock);
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
      closeModal(langModal);
    });
    langList.appendChild(row);
  });
  openModal(langModal);
}

// ---------- Assets / TF data (база) ----------
/*
  ВАЖНО: “абсолютно все активы Pocket Option” без их официального списка
  нельзя гарантировать с 1 раза. Поэтому сделано так:
  - структура категорий готова
  - список легко расширяется одним массивом
  - ты можешь прислать список/экспорт — и мы вставим полностью
*/
const ASSETS = {
  Forex: [
    "EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","NZD/USD",
    "EUR/GBP","EUR/JPY","GBP/JPY","EUR/CHF","AUD/JPY","CAD/JPY","CHF/JPY"
  ],
  Crypto: [
    "BTC/USD","ETH/USD","SOL/USD","XRP/USD","BNB/USD","DOGE/USD","ADA/USD"
  ],
  Stocks: [
    "AAPL","TSLA","AMZN","NVDA","MSFT","META","GOOGL"
  ],
  Commodities: [
    "Gold","Silver","Oil","Natural Gas"
  ],
};

const TIMEFRAMES = ["5s","15s","30s","1m","2m","5m"];

function openAssets(){
  assetTabs.innerHTML = "";
  assetList.innerHTML = "";
  assetSearch.value = "";

  const cats = Object.keys(ASSETS);
  let activeCat = cats[0];

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
          drawChartDemo(); // обновить демо-график под актив (визуально)
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

// ---------- ANALYSIS (random time + premium overlay) ----------
async function runAnalysis(direction /* "long" | "short" */){
  // если lock — ничего не делаем
  if (AUTH.flags.dep_count < 1) {
    premiumNotify(t("st_deposit_required"), t("st_deposit_required_d"), { lock:true });
    setLocked(true);
    return;
  }

  // random duration 0.6–1.6s
  const dur = 600 + Math.floor(Math.random() * 1000);

  show(chartOverlay);
  overlayFill.style.width = "0%";

  // pseudo progress
  const start = Date.now();
  const tick = setInterval(() => {
    const p = Math.min(100, Math.floor(((Date.now() - start) / dur) * 100));
    overlayFill.style.width = p + "%";
    if (p >= 100) clearInterval(tick);
  }, 60);

  await new Promise(r => setTimeout(r, dur));

  hide(chartOverlay);

  // generate “premium” result
  const isLong = direction === "long";
  setSignal(isLong ? "LONG-TREND" : "SHORT-TREND", isLong);

  const quality = 72 + Math.floor(Math.random() * 18); // 72-89
  const conf = 60 + Math.floor(Math.random() * 30);    // 60-89

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

  // update demo charts slightly
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

// ---------- Premium chart demo renderer ----------
function drawChartDemo(bias = 0){
  if (!chart) return;
  const ctx = chart.getContext("2d");
  const w = chart.width;
  const h = chart.height;

  // bg
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0,0,w,h);

  // subtle grid
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  const step = 46;
  for (let x=0; x<w; x+=step){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y=0; y<h; y+=step){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // generate candles
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

    // wick
    ctx.strokeStyle = "rgba(255,255,255,.26)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + cw/2, high);
    ctx.lineTo(x + cw/2, low);
    ctx.stroke();

    // body
    ctx.fillStyle = up ? "rgba(119,243,178,.26)" : "rgba(255,90,110,.22)";
    ctx.strokeStyle = up ? "rgba(119,243,178,.48)" : "rgba(255,90,110,.42)";
    ctx.lineWidth = 2;
    ctx.fillRect(x, bodyTop, Math.max(8, cw-18), Math.max(6, bodyBot-bodyTop));
    ctx.strokeRect(x, bodyTop, Math.max(8, cw-18), Math.max(6, bodyBot-bodyTop));
  }

  // premium top glow
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

  // small grid
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  for (let x=0; x<w; x+=52){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y=0; y<h; y+=44){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // line
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

  // glow
  ctx.globalAlpha = 0.30;
  ctx.lineWidth = 10;
  ctx.strokeStyle = bias >= 0 ? "rgba(119,243,178,.26)" : "rgba(255,90,110,.22)";
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ---------- Events ----------
btnOpenReg.addEventListener("click", () => openURL(CONFIG.REG_URL));

btnGetAccess.addEventListener("click", async () => {
  // “получить доступ” = делаем реальную проверку registered
  await gateCheckAndProceed();
});

btnLangGate.addEventListener("click", openLangModal);
btnLangApp.addEventListener("click", openLangModal);

btnOpenDeposit.addEventListener("click", () => openURL(CONFIG.DEPOSIT_URL));
btnNotifyClose.addEventListener("click", () => hide(notify));

btnCheckStatus.addEventListener("click", async () => {
  await refreshAuthAndEnforce();
});

btnReset.addEventListener("click", () => {
  // reset UI only (без влияния на доступ)
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

// modal close
backdrop.addEventListener("click", () => {
  closeModal(assetsModal);
  closeModal(tfModal);
  closeModal(langModal);
});
closeAssets.addEventListener("click", () => closeModal(assetsModal));
closeTf.addEventListener("click", () => closeModal(tfModal));
closeLang.addEventListener("click", () => closeModal(langModal));

// ---------- Boot ----------
(function boot(){
  LANG = localStorage.getItem("lang") || "ru";
  applyI18n();

  // начальные значения
  setGateStatus(t("gate_status_na"), 14);
  setSignal("LONG-TREND", true);

  // Пробуем “мягко” подтянуть статус заранее (не ломает gate)
  // Если нет initData — просто оставим gate.
  if (tg?.initData) {
    auth().then(d => {
      AUTH = normalizeAuth(d);
      if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);
    }).catch(()=>{});
  }

  drawChartDemo();
  drawMiniChartDemo();
})();
