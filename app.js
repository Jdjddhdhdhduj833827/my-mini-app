/* app.js — CRAFT ANALYTICS (Terminal UI)
   Твои требования:
   - УБРАТЬ long/short кнопки под анализом (в HTML их уже нет)
   - 1 кнопка "Запустить анализ" -> абсолютный рандом LONG/SHORT
   - При КАЖДОМ анализе всплывает notify "Создайте аккаунт" (как на фото)
     - "Открыть регистрацию" -> REG_URL
     - "Понятно" -> запускает анализ
   - Графики: терминальный линейный стиль, разные при смене актива/таймфрейма/market
   - Mini chart: линейный, меняется при смене актива, текст "Mini chart • render"
   - Таймфреймы: 5s,10s,15s,30s,1m,3m,5m,30m,1h,3h,6h
   - Таймер обратного отсчёта рядом с сигналом на выбранный таймфрейм
   - Кнопка "..." кликабельна
   - Никаких серверных auth/депозит/регистрация чеков (чтобы не было network_fail)
*/

const CONFIG = {
  REG_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
  DEPOSIT_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
  ASSETS_JSON: "./assets.json"
};

const tg = window.Telegram?.WebApp || null;
try { tg?.ready?.(); tg?.expand?.(); } catch {}

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const gate = $("gate");
const app = $("app");

const btnOpenReg = $("btnOpenReg");
const btnGetAccess = $("btnGetAccess");
const gateStatusText = $("gateStatusText");
const gateMeter = $("gateMeter");

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
const rTimer = $("rTimer");

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

// ---------- State ----------
let LANG = "ru";

let ASSETS = {
  Forex: ["EUR/USD","GBP/USD","USD/JPY","USD/CHF"],
  Crypto: ["BTC/USD","ETH/USD"],
  Stocks: ["AAPL","TSLA"],
  Commodities: ["Gold","Oil"],
  Indices: ["S&P 500","NASDAQ 100"]
};

let TIMEFRAMES = ["5s","10s","15s","30s","1m","3m","5m","30m","1h","3h","6h"];

let seriesMain = [];
let seriesMini = [];

let countdown = {
  tmr: null,
  endMs: 0
};

// ---------- i18n ----------
const I18N = {
  ru: {
    gate_sub: "Premium terminal • Smart assistant",
    gate_title: "Доступ к терминалу",
    gate_text_main: "Чтобы открыть интерфейс, нажмите «Получить доступ».",
    gate_step1_t: "Регистрация",
    gate_step1_d: "Создайте аккаунт (по желанию) через кнопку ниже.",
    gate_step2_t: "Вход",
    gate_step2_d: "Нажмите «Получить доступ» — терминал откроется сразу.",
    gate_step3_t: "Анализ",
    gate_step3_d: "Сигнал выбирается случайно при каждом анализе.",
    gate_btn_reg: "Открыть регистрацию",
    gate_btn_access: "Получить доступ",
    gate_status: "Статус:",
    gate_status_na: "готов",
    gate_legal: "Demo UI. Not financial advice.",
    gate_meter: "UI • local render",

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
    sig_timer: "таймер",
    confirm_label: "ПОДТВЕРЖДЕНИЕ",
    mini_hint: "Mini chart • render",

    m_acc: "Точность",
    m_vol: "Волатильность",
    m_mom: "Импульс",
    m_liq: "Ликвидность",

    assets_title: "Выбор актива",
    tf_title: "Выбор таймфрейма",
    lang_title: "Язык интерфейса",

    footnote: "UI работает локально. Анализ — демонстрационный.",
    notify_btn_ok: "Понятно",

    popup_need_acc_title: "Сначала создайте аккаунт",
    popup_need_acc_text: "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь сюда.",
    btn_open_reg: "Открыть регистрацию"
  },

  en: {
    gate_sub: "Premium terminal • Smart assistant",
    gate_title: "Terminal access",
    gate_text_main: "Tap “Get access” to open the UI.",
    gate_step1_t: "Registration",
    gate_step1_d: "Create an account (optional) using the button below.",
    gate_step2_t: "Enter",
    gate_step2_d: "Tap “Get access” — the terminal opens instantly.",
    gate_step3_t: "Analysis",
    gate_step3_d: "Signal is chosen randomly on each analysis.",
    gate_btn_reg: "Open registration",
    gate_btn_access: "Get access",
    gate_status: "Status:",
    gate_status_na: "ready",
    gate_legal: "Demo UI. Not financial advice.",
    gate_meter: "UI • local render",

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
    sig_timer: "timer",
    confirm_label: "CONFIRMATION",
    mini_hint: "Mini chart • render",

    m_acc: "Accuracy",
    m_vol: "Volatility",
    m_mom: "Momentum",
    m_liq: "Liquidity",

    assets_title: "Select asset",
    tf_title: "Select timeframe",
    lang_title: "Language",

    footnote: "UI is local. Analysis is demo.",
    notify_btn_ok: "Got it",

    popup_need_acc_title: "Create an account first",
    popup_need_acc_text: "Tap “Open registration”, create an account, then come back.",
    btn_open_reg: "Open registration"
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
  try {
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, "_blank");
  } catch {
    window.open(url, "_blank");
  }
}

// ---------- Seeded RNG (чтобы графики "реально менялись" от выбранных параметров) ----------
function hashStr(s){
  let h = 2166136261;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed){
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// абсолютный рандом (не seeded) для сигнала
function trueRandBit(){
  // crypto если доступно
  try {
    const u = new Uint32Array(1);
    crypto.getRandomValues(u);
    return (u[0] & 1) ? 1 : 0;
  } catch {
    return Math.random() < 0.5 ? 0 : 1;
  }
}

// ---------- Data generators ----------
function genSeries(seedKey, n, amp=1){
  const rnd = mulberry32(hashStr(seedKey));
  const arr = new Array(n);
  let v = 0.55;
  let drift = (rnd()-0.5) * 0.03;

  for (let i=0;i<n;i++){
    drift += (rnd()-0.5)*0.02;
    drift *= 0.92;
    v += drift + (rnd()-0.5)*0.03;
    v = Math.max(0.12, Math.min(0.92, v));
    arr[i] = v * amp;
  }
  return arr;
}

function currentKey(){
  return `${assetValue.textContent}|${tfValue.textContent}|${marketValue.textContent}`;
}

// ---------- Charts render ----------
function drawGrid(ctx, w, h){
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;

  const gx = 52;
  const gy = 44;
  for (let x=0; x<=w; x+=gx){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y=0; y<=h; y+=gy){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }
  ctx.restore();
}

function drawMountainTint(ctx, w, h){
  // лёгкий "фон" под терминал (не картинка, а процедурный силуэт)
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = "rgba(0,178,255,.25)";
  ctx.beginPath();
  ctx.moveTo(0, h*0.80);
  ctx.lineTo(w*0.15, h*0.62);
  ctx.lineTo(w*0.28, h*0.72);
  ctx.lineTo(w*0.43, h*0.50);
  ctx.lineTo(w*0.58, h*0.68);
  ctx.lineTo(w*0.70, h*0.54);
  ctx.lineTo(w*0.86, h*0.70);
  ctx.lineTo(w, h*0.58);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLineSeries(canvas, series, opts){
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0,0,w,h);

  // base
  ctx.fillStyle = "rgba(0,0,0,.20)";
  ctx.fillRect(0,0,w,h);

  drawMountainTint(ctx, w, h);
  drawGrid(ctx, w, h);

  // map
  const padX = 14;
  const padY = 16;
  const x0 = padX, x1 = w - padX;
  const y0 = padY, y1 = h - padY;

  // normalize
  let mn = Infinity, mx = -Infinity;
  for (const v of series){ if (v<mn) mn=v; if (v>mx) mx=v; }
  const rng = Math.max(1e-6, mx-mn);

  const X = (i) => x0 + (i/(series.length-1))*(x1-x0);
  const Y = (v) => y1 - ((v-mn)/rng)*(y1-y0);

  const isUp = !!opts.isUp;

  // glow
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 8;
  ctx.globalAlpha = 0.20;
  ctx.strokeStyle = isUp ? "rgba(119,243,178,.65)" : "rgba(255,90,110,.65)";
  ctx.beginPath();
  for (let i=0;i<series.length;i++){
    const x = X(i), y = Y(series[i]);
    if (i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.restore();

  // main line
  ctx.save();
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.beginPath();
  for (let i=0;i<series.length;i++){
    const x = X(i), y = Y(series[i]);
    if (i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.restore();

  // fill
  ctx.save();
  const grd = ctx.createLinearGradient(0, y0, 0, y1);
  grd.addColorStop(0, isUp ? "rgba(119,243,178,.18)" : "rgba(255,90,110,.16)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(series[0]));
  for (let i=1;i<series.length;i++){
    ctx.lineTo(X(i), Y(series[i]));
  }
  ctx.lineTo(X(series.length-1), y1);
  ctx.lineTo(X(0), y1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // corner labels (терминальный вайб)
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = "12px ui-sans-serif, -apple-system, system-ui, Segoe UI, Roboto, Arial";
  ctx.fillText(`${assetValue.textContent} • ${marketValue.textContent}`, 14, 20);
  ctx.restore();
}

function refreshChartsVisual(isUpHint = true){
  const key = currentKey();

  // main = плотнее
  seriesMain = genSeries("MAIN|" + key, 92, 1);
  // mini = проще
  seriesMini = genSeries("MINI|" + key, 44, 1);

  drawLineSeries(chart, seriesMain, { isUp: isUpHint });
  drawLineSeries(signalChart, seriesMini, { isUp: isUpHint });
}

// ---------- Timer ----------
function tfToSeconds(tf){
  const s = String(tf || "").trim().toLowerCase();
  if (s.endsWith("s")) return parseInt(s,10) || 0;
  if (s.endsWith("m")) return (parseInt(s,10) || 0) * 60;
  if (s.endsWith("h")) return (parseInt(s,10) || 0) * 3600;
  return 30;
}
function fmtMMSS(totalSec){
  totalSec = Math.max(0, Math.floor(totalSec));
  const mm = Math.floor(totalSec/60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}
function stopCountdown(){
  if (countdown.tmr) clearInterval(countdown.tmr);
  countdown.tmr = null;
  countdown.endMs = 0;
  rTimer.textContent = "--:--";
}
function startCountdown(seconds){
  stopCountdown();
  const end = Date.now() + seconds*1000;
  countdown.endMs = end;
  countdown.tmr = setInterval(() => {
    const left = (countdown.endMs - Date.now())/1000;
    if (left <= 0){
      rTimer.textContent = "00:00";
      stopCountdown();
      return;
    }
    rTimer.textContent = fmtMMSS(left);
  }, 200);
  rTimer.textContent = fmtMMSS(seconds);
}

// ---------- Signal UI ----------
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

// ---------- Notify (как на фото) ----------
function showNeedAccountNotify(onOkRun){
  notifyTitle.textContent = t("popup_need_acc_title");
  notifyText.textContent = t("popup_need_acc_text");
  notifyPrimaryLabel.textContent = t("btn_open_reg");
  show(notify);

  // важно: каждый раз назначаем "одноразовый" запуск
  btnNotifyClose.onclick = () => {
    hide(notify);
    onOkRun?.();
  };
  btnNotifyPrimary.onclick = () => openURL(CONFIG.REG_URL);
}

// ---------- Assets loader ----------
async function loadAssetsJson(){
  try {
    const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
    if (!r.ok) throw new Error("assets.json not ok");
    const j = await r.json();
    if (j?.categories) ASSETS = j.categories;
    if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
  } catch {
    // fallback: оставляем дефолт
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
          // графики должны меняться при смене валют
          refreshChartsVisual(dirText.classList.contains("up"));
          stopCountdown();
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
      // смена таймфрейма -> новые графики
      refreshChartsVisual(dirText.classList.contains("up"));
      stopCountdown();
    });
    tfList.appendChild(row);
  });
  openModal(tfModal);
}

// ---------- Market toggle ----------
function toggleMarket(){
  marketValue.textContent = (marketValue.textContent === "OTC") ? "Market" : "OTC";
  refreshChartsVisual(dirText.classList.contains("up"));
  stopCountdown();
}

// ---------- Analysis flow ----------
async function runAnalysis(){
  // каждый раз показываем попап "нужен аккаунт" как ты хочешь
  showNeedAccountNotify(async () => {
    // после "Понятно" — анализ
    const dur = 650 + Math.floor(Math.random() * 950);

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

    // абсолютный рандом LONG/SHORT
    const isLong = trueRandBit() === 1;

    setSignal(isLong ? "LONG-TREND" : "SHORT-TREND", isLong);

    // метрики
    const quality = 72 + Math.floor(Math.random() * 18);
    const conf = 60 + Math.floor(Math.random() * 30);

    chipQuality.textContent = `Quality: ${quality}`;
    chipConf.textContent = `Conf: ${conf}`;

    rAcc.textContent = `${quality}%`;
    volFactor.textContent = ["Low","Mid","High"][Math.floor(Math.random()*3)];
    momFactor.textContent = ["Soft","Stable","Strong"][Math.floor(Math.random()*3)];
    liqFactor.textContent = ["Thin","Normal","Deep"][Math.floor(Math.random()*3)];

    // окно + until
    const sec = tfToSeconds(tfValue.textContent || "30s");
    const now = new Date();
    const until = new Date(Date.now() + sec*1000);

    rWindow.textContent = tfValue.textContent || "30s";
    rUntil.textContent = `${String(until.getHours()).padStart(2,"0")}:${String(until.getMinutes()).padStart(2,"0")}`;

    // таймер
    startCountdown(sec);

    // графики должны меняться под сигнал (вверх/вниз) и под параметры
    refreshChartsVisual(isLong);
  });
}

// ---------- Gate / Enter ----------
function enterApp(){
  hide(gate);
  show(app);

  const uid = tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "";
  chipSession.textContent = "SESSION: " + (uid ? uid.slice(-6) : "—");
  chipAccess.textContent = "ACCESS: OPEN";
}

// ---------- Menu ----------
function openMenu(){
  const msg = `CRAFT MENU\n\n• Asset: ${assetValue.textContent}\n• TF: ${tfValue.textContent}\n• Market: ${marketValue.textContent}\n\n(Это меню можно расширить дальше.)`;
  try {
    if (tg?.showPopup) {
      tg.showPopup({
        title: "MENU",
        message: msg.slice(0, 3500),
        buttons: [{ type: "close" }]
      });
      return;
    }
  } catch {}
  alert(msg);
}

// ---------- Events ----------
btnOpenReg.addEventListener("click", () => openURL(CONFIG.REG_URL));
btnGetAccess.addEventListener("click", () => {
  setGateStatus(t("gate_status_na"), 62);
  enterApp();
});

btnLangGate.addEventListener("click", openLangModal);
btnLangApp.addEventListener("click", openLangModal);

btnMenu.addEventListener("click", openMenu);

btnCheckStatus.addEventListener("click", () => {
  // без сервера: просто обновим UI и графики (чтобы кнопка работала)
  refreshChartsVisual(dirText.classList.contains("up"));
});

btnReset.addEventListener("click", () => {
  chipQuality.textContent = t("chart_quality");
  chipConf.textContent = t("chart_conf");
  rAcc.textContent = "—%";
  volFactor.textContent = "—";
  momFactor.textContent = "—";
  liqFactor.textContent = "—";
  setSignal("LONG-TREND", true);
  stopCountdown();
  refreshChartsVisual(true);
});

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

// ---------- Boot ----------
(async function boot(){
  LANG = localStorage.getItem("lang") || "ru";
  applyI18n();

  await loadAssetsJson();

  setGateStatus(t("gate_status_na"), 18);
  setSignal("LONG-TREND", true);

  refreshChartsVisual(true);

  // mini-app friendly
  try { tg?.expand?.(); } catch {}
})();
