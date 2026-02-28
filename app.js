/* app.js
   ИДЕАЛЬНАЯ ЛОГИКА GATE (как вы хотели):
   1) НЕ registered -> всегда notify "Нужна регистрация" (кнопка -> REG_URL), lock=false, остаёмся на gate
   2) registered, но dep_count < 1 -> всегда notify "Нужен депозит" (кнопка -> DEPOSIT_URL), lock=true, остаёмся на gate
   3) registered и dep_count >= 1 -> пускаем в app, notify скрыт, lock=false

   Плюс:
   - assets/timeframes грузим из assets.json (fallback на дефолт)
   - любая попытка "Получить доступ" всегда проверяет сервер
*/

const CONFIG = {
  API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
  REG_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",

  // ВАЖНО: сюда должен быть реальный линк на пополнение (не регистрация).
  // Если оставить как регистрацию — dep_count так и будет 0 и тебя никогда не пустит.
  DEPOSIT_URL: "https://u3.shortink.io/deposit?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy",

  ASSETS_JSON: "./assets.json",
};

const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

// Gate/App roots
const gate = $("gate");
const app = $("app");

// Gate elements
const btnOpenReg = $("btnOpenReg");
const btnGetAccess = $("btnGetAccess");
const gateStatusText = $("gateStatusText");
const gateMeter = $("gateMeter");
const pillVipGate = $("pillVipGate");
const gateDebug = $("gateDebug");

// Top/app UI
const btnLangGate = $("btnLangGate");
const btnLangApp = $("btnLangApp");
const pillVipTop = $("pillVipTop");

const btnCheckStatus = $("btnCheckStatus");
const btnReset = $("btnReset");
const btnAnalyze = $("btnAnalyze");
const btnLong = $("btnLong");
const btnShort = $("btnShort");

// Selectors
const assetBtn = $("assetBtn");
const tfBtn = $("tfBtn");
const marketBtn = $("marketBtn");

const assetValue = $("assetValue");
const tfValue = $("tfValue");
const marketValue = $("marketValue");

// Chips / metrics
const chipSession = $("chipSession");
const chipAccess = $("chipAccess");

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

// Charts
const chart = $("chart");
const chartOverlay = $("chartOverlay");
const overlayFill = $("overlayFill");
const signalChart = $("signalChart");

// Modals
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

// Notify
const notify = $("notify");
const notifyTitle = $("notifyTitle");
const notifyText = $("notifyText");
const btnNotifyPrimary = $("btnNotifyPrimary");
const notifyPrimaryLabel = $("notifyPrimaryLabel");
const btnNotifyClose = $("btnNotifyClose");

// Soft lock overlay
const softLock = $("softLock");

// ---------- State ----------
let LANG = "ru";
let NOTIFY_MODE = "reg"; // "reg" | "deposit"
let AUTH = {
  ok: false,
  telegram_id: "",
  access: false,
  vip: false,
  flags: { registered: 0, dep_count: 0, approved: 0 },
};

let ASSETS = {
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF"],
  Crypto: ["BTC/USD", "ETH/USD"],
  Stocks: ["AAPL", "TSLA"],
  Commodities: ["Gold", "Oil"],
};

let TIMEFRAMES = ["15s", "30s", "1m"];

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
    vpn_hint: "Для корректной работы сервера рекомендуется отключить VPN.",
    gate_legal: "Demo UI. Not financial advice.",
    gate_meter: "SECURITY • initData required",

    chart_quality: "Quality: —",
    chart_conf: "Conf: —",

    notify_btn_ok: "Понятно",

    st_need_tg: "Откройте внутри Telegram",
    st_need_tg_d: "Мини-приложение работает только внутри Telegram.",
    st_checked: "проверено",

    st_reg_required: "Сначала создайте аккаунт",
    st_reg_required_d:
      "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь сюда.",
    st_deposit_required: "Требуется депозит",
    st_deposit_required_d:
      "Чтобы открыть интерфейс, внесите депозит и снова нажмите «Получить доступ».",

    btn_open_reg: "Открыть регистрацию",
    btn_open_deposit: "Открыть пополнение",
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
    vpn_hint: "Disable VPN for stable server connection.",
    gate_legal: "Demo UI. Not financial advice.",
    gate_meter: "SECURITY • initData required",

    chart_quality: "Quality: —",
    chart_conf: "Conf: —",

    notify_btn_ok: "Got it",

    st_need_tg: "Open inside Telegram",
    st_need_tg_d: "This mini app works only inside Telegram.",
    st_checked: "checked",

    st_reg_required: "Create an account first",
    st_reg_required_d:
      "Tap “Open registration”, create an account, then come back.",
    st_deposit_required: "Deposit required",
    st_deposit_required_d:
      "To unlock the UI, make a deposit and tap “Get access” again.",

    btn_open_reg: "Open registration",
    btn_open_deposit: "Open deposit",
  },
};

function t(key) {
  return I18N[LANG]?.[key] ?? key;
}

function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i]").forEach((el) => {
    const k = el.getAttribute("data-i");
    el.textContent = t(k);
  });
}

// ---------- UI helpers ----------
function show(el) {
  el?.classList.remove("hidden");
}
function hide(el) {
  el?.classList.add("hidden");
}

function setGateStatus(text, meterPct) {
  if (gateStatusText) gateStatusText.textContent = text;
  if (gateMeter && typeof meterPct === "number")
    gateMeter.style.width = `${meterPct}%`;
}

function openURL(url) {
  if (!url) return;
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank");
}

// ---------- AUTH ----------
async function auth() {
  const initData = tg?.initData || "";
  if (!initData) return { ok: false, error: "no initData" };

  let resp;
  try {
    resp = await fetch(CONFIG.API_BASE + "/pb/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, error: "network_error" };
  }

  let data = {};
  try {
    data = await resp.json();
  } catch (e) {
    data = {};
  }

  if (!resp.ok) {
    return { ok: false, error: "http_" + resp.status, ...data };
  }

  return data;
}

function normalizeAuth(data) {
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
  };
}

// ---------- Smart Notify ----------
function setLocked(isLocked) {
  if (isLocked) show(softLock);
  else hide(softLock);

  [btnAnalyze, btnLong, btnShort].forEach((b) => {
    if (!b) return;
    b.disabled = isLocked;
    b.style.opacity = isLocked ? ".55" : "";
  });
}

function premiumNotify(mode, title, text, opts = { lock: false }) {
  NOTIFY_MODE = mode;

  if (notifyTitle) notifyTitle.textContent = title ?? "";
  if (notifyText) notifyText.textContent = text ?? "";

  if (notifyPrimaryLabel) {
    notifyPrimaryLabel.textContent =
      mode === "reg" ? t("btn_open_reg") : t("btn_open_deposit");
  }

  show(notify);
  setLocked(!!opts.lock);
}

// ---------- Gate flow (ГЛАВНОЕ) ----------
async function gateCheckAndProceed() {
  setGateStatus(t("gate_status_na"), 18);

  // не в Telegram -> всегда показываем
  if (!tg?.initData) {
    setGateStatus(t("st_need_tg"), 22);
    premiumNotify("reg", t("st_need_tg"), t("st_need_tg_d"), { lock: false });
    return;
  }

  setGateStatus("…", 32);

  const raw = await auth();
  AUTH = normalizeAuth(raw);

  if (gateDebug) gateDebug.textContent = "AUTH: " + JSON.stringify(AUTH);

  if (!AUTH.ok) {
    setGateStatus("server error", 22);
    premiumNotify(
      "reg",
      LANG === "ru" ? "Ошибка сервера" : "Server error",
      LANG === "ru"
        ? "Повторите попытку через несколько секунд. Если включен VPN — отключите."
        : "Try again in a few seconds. If VPN is enabled — disable it.",
      { lock: false }
    );
    return;
  }

  if (AUTH.vip) show(pillVipGate);
  else hide(pillVipGate);

  // 1) НЕ зарегистрирован -> ВСЕГДА окно регистрации
  if (!AUTH.flags.registered) {
    setGateStatus(t("st_reg_required"), 24);
    premiumNotify("reg", t("st_reg_required"), t("st_reg_required_d"), {
      lock: false,
    });
    return;
  }

  // 2) зарегистрирован, но депозита нет -> ВСЕГДА окно депозита + lock
  if (AUTH.flags.dep_count < 1) {
    setGateStatus(t("st_deposit_required"), 28);
    premiumNotify("deposit", t("st_deposit_required"), t("st_deposit_required_d"), {
      lock: true,
    });
    return;
  }

  // 3) всё ок -> пускаем
  setGateStatus(t("st_checked"), 62);
  hide(notify);
  setLocked(false);
  enterApp();
}

async function refreshAuthAndEnforce() {
  // Кнопка "Проверить" делает ту же проверку, что и "Получить доступ"
  await gateCheckAndProceed();
}

// ---------- Enter app ----------
function enterApp() {
  hide(gate);
  show(app);

  if (chipSession)
    chipSession.textContent =
      "SESSION: " + (AUTH.telegram_id ? AUTH.telegram_id.slice(-6) : "—");
  if (chipAccess)
    chipAccess.textContent = "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING");

  if (AUTH.vip) {
    show(pillVipTop);
    show(vipBadge);
  } else {
    hide(pillVipTop);
    hide(vipBadge);
  }

  // без дополнительных “внутренних” проверок — всё уже проверено в gate
  drawChartDemo();
  drawMiniChartDemo();
}

// ---------- Assets loader (assets.json) ----------
async function loadAssetsJson() {
  try {
    const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
    if (!r.ok) throw new Error("assets.json not ok");
    const j = await r.json();
    if (j?.categories) ASSETS = j.categories;
    if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
  } catch (e) {
    // fallback на дефолт
  }
}

// ---------- Modals ----------
function openModal(modal) {
  show(backdrop);
  show(modal);
}
function closeModal(modal) {
  hide(modal);
  hide(backdrop);
}

// ---------- Language ----------
function openLangModal() {
  if (!langList) return;

  langList.innerHTML = "";
  const items = [
    { id: "ru", label: "Русский" },
    { id: "en", label: "English" },
  ];

  items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<div>${it.label}</div><div>${it.id.toUpperCase()}</div>`;
    row.addEventListener("click", () => {
      LANG = it.id;
      localStorage.setItem("lang", LANG);
      applyI18n();

      // обновим подпись notify кнопки (если открыто)
      if (notify && !notify.classList.contains("hidden")) {
        if (notifyPrimaryLabel) {
          notifyPrimaryLabel.textContent =
            NOTIFY_MODE === "reg" ? t("btn_open_reg") : t("btn_open_deposit");
        }
      }

      closeModal(langModal);
    });
    langList.appendChild(row);
  });

  openModal(langModal);
}

// ---------- Assets/TF UI ----------
function openAssets() {
  if (!assetTabs || !assetList || !assetSearch) return;

  assetTabs.innerHTML = "";
  assetList.innerHTML = "";
  assetSearch.value = "";

  const cats = Object.keys(ASSETS);
  let activeCat = cats[0] || "Forex";

  const render = () => {
    assetList.innerHTML = "";
    const q = assetSearch.value.trim().toLowerCase();

    (ASSETS[activeCat] || [])
      .filter((x) => !q || x.toLowerCase().includes(q))
      .forEach((sym) => {
        const row = document.createElement("div");
        row.className = "item";
        row.innerHTML = `<div>${sym}</div><div>${activeCat}</div>`;
        row.addEventListener("click", () => {
          if (assetValue) assetValue.textContent = sym;
          closeModal(assetsModal);
          drawChartDemo();
        });
        assetList.appendChild(row);
      });
  };

  cats.forEach((cat) => {
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

function openTF() {
  if (!tfList) return;

  tfList.innerHTML = "";
  TIMEFRAMES.forEach((tf) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<div>${tf}</div><div>Timeframe</div>`;
    row.addEventListener("click", () => {
      if (tfValue) tfValue.textContent = tf;
      closeModal(tfModal);
    });
    tfList.appendChild(row);
  });

  openModal(tfModal);
}

// ---------- Market toggle ----------
function toggleMarket() {
  if (!marketValue) return;
  marketValue.textContent = marketValue.textContent === "OTC" ? "Market" : "OTC";
  drawChartDemo();
}

// ---------- Analysis (demo) ----------
async function runAnalysis(direction /* "long" | "short" */) {
  // защита: если вдруг как-то оказался в app без депозита
  if (AUTH.flags.dep_count < 1) {
    premiumNotify("deposit", t("st_deposit_required"), t("st_deposit_required_d"), {
      lock: true,
    });
    return;
  }

  const dur = 600 + Math.floor(Math.random() * 1000);

  show(chartOverlay);
  if (overlayFill) overlayFill.style.width = "0%";

  const start = Date.now();
  const tick = setInterval(() => {
    const p = Math.min(100, Math.floor(((Date.now() - start) / dur) * 100));
    if (overlayFill) overlayFill.style.width = p + "%";
    if (p >= 100) clearInterval(tick);
  }, 60);

  await new Promise((r) => setTimeout(r, dur));
  hide(chartOverlay);

  const isLong = direction === "long";
  setSignal(isLong ? "LONG-TREND" : "SHORT-TREND", isLong);

  const quality = 72 + Math.floor(Math.random() * 18);
  const conf = 60 + Math.floor(Math.random() * 30);

  if (chipQuality) chipQuality.textContent = `Quality: ${quality}`;
  if (chipConf) chipConf.textContent = `Conf: ${conf}`;

  if (rAcc) rAcc.textContent = `${quality}%`;
  if (volFactor) volFactor.textContent = ["Low", "Mid", "High"][Math.floor(Math.random() * 3)];
  if (momFactor) momFactor.textContent = ["Soft", "Stable", "Strong"][Math.floor(Math.random() * 3)];
  if (liqFactor) liqFactor.textContent = ["Thin", "Normal", "Deep"][Math.floor(Math.random() * 3)];

  const now = new Date();
  const until = new Date(now.getTime() + 30 * 1000);
  if (rWindow) rWindow.textContent = tfValue?.textContent || "30s";
  if (rUntil)
    rUntil.textContent = `${String(until.getHours()).padStart(2, "0")}:${String(
      until.getMinutes()
    ).padStart(2, "0")}`;

  drawChartDemo(isLong ? 1 : -1);
  drawMiniChartDemo(isLong ? 1 : -1);
}

function setSignal(text, isUp) {
  if (dirText) dirText.textContent = text;

  if (!dirArrow || !dirText) return;

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
function drawChartDemo(bias = 0) {
  if (!chart) return;
  const ctx = chart.getContext("2d");
  const w = chart.width;
  const h = chart.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  const step = 46;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const candles = 48;
  const cw = Math.floor(w / candles);
  let price = h * 0.55;

  for (let i = 0; i < candles; i++) {
    const drift = (Math.random() - 0.5) * 18 + bias * 2.2;
    const open = price;
    const close = price + drift;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    price = close;

    const x = i * cw + 12;
    const bodyTop = Math.min(open, close);
    const bodyBot = Math.max(open, close);
    const up = close >= open;

    ctx.strokeStyle = "rgba(255,255,255,.26)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + cw / 2, high);
    ctx.lineTo(x + cw / 2, low);
    ctx.stroke();

    ctx.fillStyle = up ? "rgba(119,243,178,.26)" : "rgba(255,90,110,.22)";
    ctx.strokeStyle = up ? "rgba(119,243,178,.48)" : "rgba(255,90,110,.42)";
    ctx.lineWidth = 2;

    ctx.fillRect(x, bodyTop, Math.max(8, cw - 18), Math.max(6, bodyBot - bodyTop));
    ctx.strokeRect(x, bodyTop, Math.max(8, cw - 18), Math.max(6, bodyBot - bodyTop));
  }

  const grd = ctx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, "rgba(124,92,255,.14)");
  grd.addColorStop(0.45, "rgba(0,178,255,.08)");
  grd.addColorStop(1, "rgba(245,211,138,.06)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
}

function drawMiniChartDemo(bias = 0) {
  if (!signalChart) return;
  const ctx = signalChart.getContext("2d");
  const w = signalChart.width;
  const h = signalChart.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  let y = h * 0.6;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,.70)";
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const x = (i / 31) * (w - 24) + 12;
    y += (Math.random() - 0.5) * 10 + bias * 1.3;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.globalAlpha = 0.30;
  ctx.lineWidth = 10;
  ctx.strokeStyle =
    bias >= 0 ? "rgba(119,243,178,.26)" : "rgba(255,90,110,.22)";
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ---------- Events (все безопасно с проверками) ----------
btnOpenReg?.addEventListener("click", () => openURL(CONFIG.REG_URL));
btnGetAccess?.addEventListener("click", gateCheckAndProceed);

btnLangGate?.addEventListener("click", openLangModal);
btnLangApp?.addEventListener("click", openLangModal);

btnNotifyPrimary?.addEventListener("click", () => {
  if (NOTIFY_MODE === "reg") openURL(CONFIG.REG_URL);
  else openURL(CONFIG.DEPOSIT_URL);
});

btnNotifyClose?.addEventListener("click", () => {
  hide(notify);
  // если зарегистрирован и депозита нет — lock оставляем
  if (AUTH.flags.registered && AUTH.flags.dep_count < 1) setLocked(true);
  else setLocked(false);
});

btnCheckStatus?.addEventListener("click", refreshAuthAndEnforce);

btnReset?.addEventListener("click", () => {
  if (chipQuality) chipQuality.textContent = t("chart_quality");
  if (chipConf) chipConf.textContent = t("chart_conf");
  if (rAcc) rAcc.textContent = "—%";
  if (volFactor) volFactor.textContent = "—";
  if (momFactor) momFactor.textContent = "—";
  if (liqFactor) liqFactor.textContent = "—";
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
(async function boot() {
  LANG = localStorage.getItem("lang") || "ru";
  applyI18n();

  await loadAssetsJson();

  setGateStatus(t("gate_status_na"), 14);
  setSignal("LONG-TREND", true);

  // небольшой VIP индикатор (не пускаем/не блокируем на boot)
  if (tg?.initData) {
    auth()
      .then((d) => {
        const tmp = normalizeAuth(d);
        if (tmp.ok) AUTH = tmp;
        if (AUTH.vip) show(pillVipGate);
        else hide(pillVipGate);
        if (gateDebug) gateDebug.textContent = "AUTH: " + JSON.stringify(AUTH);
      })
      .catch(() => {});
  }

  drawChartDemo();
  drawMiniChartDemo();
})();
