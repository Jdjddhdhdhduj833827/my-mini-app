/* app.js — Gate logic FIX (UI-safe)
   ЛОГИКА:
   - Нажал "Получить доступ" → всегда делаем auth() и показываем правильное окно:
     1) registered=0 → notify REG (lock=false)
     2) registered=1 && dep_count<1 → notify DEPOSIT (lock=true)
     3) registered=1 && dep_count>=1 → enterApp()

   Визуал НЕ ломаем: никаких глобальных opacity, никаких изменений анимаций.
*/

const CONFIG = {
  API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
  REG_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
  DEPOSIT_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
  ASSETS_JSON: "./assets.json",
};

const tg = window.Telegram?.WebApp;
if (tg?.expand) tg.expand();

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

const gate = $("gate");
const app = $("app");

const btnOpenReg = $("btnOpenReg");
const btnGetAccess = $("btnGetAccess");

const gateStatusText = $("gateStatusText");
const gateMeter = $("gateMeter");
const gateDebug = $("gateDebug"); // optional

const pillVipGate = $("pillVipGate");

// notify modal
const notify = $("notify");
const notifyTitle = $("notifyTitle");
const notifyText = $("notifyText");
const btnNotifyPrimary = $("btnNotifyPrimary");
const notifyPrimaryLabel = $("notifyPrimaryLabel");
const btnNotifyClose = $("btnNotifyClose");

// soft lock
const softLock = $("softLock");

// app controls (могут быть null на gate-экране — не падаем)
const chipSession = $("chipSession");
const chipAccess = $("chipAccess");
const pillVipTop = $("pillVipTop");
const vipBadge = $("vipBadge");

const btnAnalyze = $("btnAnalyze");
const btnLong = $("btnLong");
const btnShort = $("btnShort");
const btnCheckStatus = $("btnCheckStatus");

const chart = $("chart");
const chartOverlay = $("chartOverlay");
const overlayFill = $("overlayFill");
const signalChart = $("signalChart");

const assetBtn = $("assetBtn");
const tfBtn = $("tfBtn");
const marketBtn = $("marketBtn");
const assetValue = $("assetValue");
const tfValue = $("tfValue");
const marketValue = $("marketValue");

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

const btnLangGate = $("btnLangGate");
const btnLangApp = $("btnLangApp");

// ---------- State ----------
let LANG = "ru";
let NOTIFY_MODE = "reg";

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
    gate_status: "Статус:",
    gate_status_na: "не проверен",
    gate_meter: "SECURITY • initData required",

    st_need_tg: "Откройте внутри Telegram",
    st_need_tg_d: "Мини-приложение работает только внутри Telegram.",

    st_reg_required: "Нужна регистрация",
    st_reg_required_d: "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь в мини-приложение.",

    st_deposit_required: "Нужен депозит",
    st_deposit_required_d: "Чтобы открыть интерфейс, внесите депозит и снова нажмите «Получить доступ».",

    btn_open_reg: "Открыть регистрацию",
    btn_open_deposit: "Открыть пополнение",
    notify_btn_ok: "Понятно",
  },
  en: {
    gate_status: "Status:",
    gate_status_na: "not checked",
    gate_meter: "SECURITY • initData required",

    st_need_tg: "Open inside Telegram",
    st_need_tg_d: "This mini app works only inside Telegram.",

    st_reg_required: "Registration required",
    st_reg_required_d: "Tap “Open registration”, create an account, then return to the mini app.",

    st_deposit_required: "Deposit required",
    st_deposit_required_d: "To unlock the UI, make a deposit and tap “Get access” again.",

    btn_open_reg: "Open registration",
    btn_open_deposit: "Open deposit",
    notify_btn_ok: "Got it",
  }
};

function t(key) {
  return I18N[LANG]?.[key] ?? key;
}

function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i]").forEach(el => {
    const k = el.getAttribute("data-i");
    el.textContent = t(k);
  });
  // если уже открыто окно — обновим кнопку
  if (notify && !notify.classList.contains("hidden")) {
    notifyPrimaryLabel.textContent = (NOTIFY_MODE === "reg") ? t("btn_open_reg") : t("btn_open_deposit");
  }
}

// ---------- helpers ----------
function show(el) { el && el.classList.remove("hidden"); }
function hide(el) { el && el.classList.add("hidden"); }

function setGateStatus(text, meterPct) {
  if (gateStatusText) gateStatusText.textContent = text;
  if (gateMeter && typeof meterPct === "number") gateMeter.style.width = `${meterPct}%`;
}

function openURL(url) {
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank");
}

// Визуал не портим: блокировку делаем только через softLock и disabled
function setLocked(locked) {
  if (locked) show(softLock); else hide(softLock);

  [btnAnalyze, btnLong, btnShort].forEach(b => {
    if (!b) return;
    b.disabled = !!locked;
  });
}

function premiumNotify(mode, title, text, opts = { lock: false }) {
  NOTIFY_MODE = mode;

  if (notifyTitle) notifyTitle.textContent = title;
  if (notifyText) notifyText.textContent = text;

  if (notifyPrimaryLabel) {
    notifyPrimaryLabel.textContent = (mode === "reg") ? t("btn_open_reg") : t("btn_open_deposit");
  }

  show(notify);
  setLocked(!!opts.lock);
}

// ---------- AUTH ----------
async function auth() {
  const initData = tg?.initData || "";
  if (!initData) return { ok: false, error: "no_initData" };

  const resp = await fetch(CONFIG.API_BASE + "/pb/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ initData }),
    cache: "no-store",
  });

  let data = {};
  try { data = await resp.json(); } catch (_) {}

  // если сервер вернул не-200, всё равно покажем, что пришло
  if (!resp.ok) return { ok: false, http: resp.status, data };

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
    }
  };
}

function renderDebug() {
  if (!gateDebug) return;
  gateDebug.textContent = "AUTH: " + JSON.stringify(AUTH, null, 0);
}

// ---------- Gate flow (КЛЮЧЕВОЕ) ----------
async function gateCheckAndProceed() {
  // ВСЕГДА показываем, что проверяем
  setGateStatus("…", 28);

  // 1) если не в Telegram — сразу окно
  if (!tg?.initData) {
    setGateStatus(t("st_need_tg"), 18);
    AUTH = normalizeAuth({ ok: false, flags: { registered: 0, dep_count: 0 } });
    renderDebug();
    premiumNotify("reg", t("st_need_tg"), t("st_need_tg_d"), { lock: false });
    return;
  }

  // 2) идём на сервер
  const raw = await auth();
  AUTH = normalizeAuth(raw?.data ? raw.data : raw);
  renderDebug();

  // VIP badge на gate
  if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);

  // Если сервер вообще не ок — покажем ошибку, но дадим регу как fallback
  if (!AUTH.ok) {
    setGateStatus("Ошибка проверки", 16);
    premiumNotify("reg", t("st_reg_required"), t("st_reg_required_d"), { lock: false });
    return;
  }

  // 3) Ветка 1: НЕ зарегистрирован — окно регистрации (ВСЕГДА)
  if (AUTH.flags.registered < 1) {
    setGateStatus(t("gate_status_na"), 18);
    premiumNotify("reg", t("st_reg_required"), t("st_reg_required_d"), { lock: false });
    return;
  }

  // 4) Ветка 2: зарегистрирован, но депозита нет — окно депозита
  if (AUTH.flags.dep_count < 1) {
    setGateStatus("Ожидается депозит", 22);
    premiumNotify("deposit", t("st_deposit_required"), t("st_deposit_required_d"), { lock: true });
    return;
  }

  // 5) Ветка 3: всё ок — впускаем
  setGateStatus("проверено", 62);
  enterApp();
}

function enterApp() {
  hide(gate);
  show(app);

  // верхние чипы (если есть)
  if (chipSession) chipSession.textContent = "SESSION: " + (AUTH.telegram_id ? AUTH.telegram_id.slice(-6) : "—");
  if (chipAccess) chipAccess.textContent = "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING");

  if (AUTH.vip) { show(pillVipTop); show(vipBadge); }
  else { hide(pillVipTop); hide(vipBadge); }

  hide(notify);
  setLocked(false);

  // Демо-рисовалки — если у тебя были
  drawChartDemoSafe();
  drawMiniChartDemoSafe();
}

// ---------- assets.json ----------
async function loadAssetsJson() {
  try {
    const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
    if (!r.ok) throw new Error("assets.json not ok");
    const j = await r.json();
    if (j?.categories) ASSETS = j.categories;
    if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
  } catch (_) {}
}

// ---------- Simple charts (safe wrappers) ----------
function drawChartDemoSafe() {
  try { if (chart) drawChartDemo(0); } catch (_) {}
}
function drawMiniChartDemoSafe() {
  try { if (signalChart) drawMiniChartDemo(0); } catch (_) {}
}

// Ниже оставь свои функции drawChartDemo / drawMiniChartDemo как были.
// Если у тебя их нет в этом файле — удали вызовы выше.

function drawChartDemo(bias = 0) {
  const ctx = chart.getContext("2d");
  const w = chart.width, h = chart.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0,0,w,h);
}

function drawMiniChartDemo(bias = 0) {
  const ctx = signalChart.getContext("2d");
  const w = signalChart.width, h = signalChart.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0,0,w,h);
}

// ---------- Language modal (минимально) ----------
function openLangModal() {
  if (!langList) return;
  langList.innerHTML = "";

  const items = [
    { id: "ru", label: "Русский" },
    { id: "en", label: "English" },
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

function openModal(modal) { show(backdrop); show(modal); }
function closeModal(modal) { hide(modal); hide(backdrop); }

// ---------- Events ----------
on(btnOpenReg, "click", () => openURL(CONFIG.REG_URL));

// ВАЖНО: "Получить доступ" → всегда gateCheckAndProceed()
on(btnGetAccess, "click", () => gateCheckAndProceed());

// кнопка в notify
on(btnNotifyPrimary, "click", () => {
  if (NOTIFY_MODE === "reg") openURL(CONFIG.REG_URL);
  else openURL(CONFIG.DEPOSIT_URL);
});

// Закрыть notify
on(btnNotifyClose, "click", () => {
  hide(notify);
  // если депозит нужен — оставим lock
  if (AUTH.flags.registered >= 1 && AUTH.flags.dep_count < 1) setLocked(true);
  else setLocked(false);
});

// внутри app: “Check status”
on(btnCheckStatus, "click", () => gateCheckAndProceed());

on(btnLangGate, "click", openLangModal);
on(btnLangApp, "click", openLangModal);

on(backdrop, "click", () => {
  closeModal(assetsModal);
  closeModal(tfModal);
  closeModal(langModal);
});
on(closeAssets, "click", () => closeModal(assetsModal));
on(closeTf, "click", () => closeModal(tfModal));
on(closeLang, "click", () => closeModal(langModal));

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", async () => {
  LANG = localStorage.getItem("lang") || "ru";
  applyI18n();

  await loadAssetsJson();

  // Стартовое состояние gate
  setGateStatus(t("gate_status_na"), 14);
  setLocked(false);
  hide(app);
  show(gate);

  // ничего автоматически не “пускаем” — только по кнопке "Получить доступ"
  // но можем показать VIP если initData есть
  if (tg?.initData) {
    try {
      const raw = await auth();
      AUTH = normalizeAuth(raw?.data ? raw.data : raw);
      if (AUTH.vip) show(pillVipGate); else hide(pillVipGate);
      renderDebug();
    } catch (_) {}
  }
});
