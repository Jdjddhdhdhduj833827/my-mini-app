console.log("APP.JS EXECUTED ✅", Date.now());
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
    AUTH_TIMEOUT_MS: 12000,
    DEBUG: true,
  };

  // =========================
  // Telegram
  // =========================
  const tg = window.Telegram?.WebApp || null;

  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");
  const safeText = (el, v) => { if (el) el.textContent = String(v ?? ""); };

  function dbg(...args) {
    if (CONFIG.DEBUG) console.log(...args);
  }

  function popup(title, obj) {
    const msg = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    dbg("[POPUP]", title, msg);
    try {
      if (tg?.showPopup) {
        tg.showPopup({
          title,
          message: msg.slice(0, 3500),
          buttons: [{ type: "close" }],
        });
      }
    } catch {}
  }

  function openURL(url) {
    if (!url) return;
    try {
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  // =========================
  // State
  // =========================
  let LANG = "ru";
  let AUTH = {
    ok: false,
    telegram_id: "",
    access: false,
    vip: false,
    flags: { registered: 0, dep_count: 0, approved: 0 },
    error: "",
  };

  let ASSETS = {
    Forex: ["EUR/USD","GBP/USD","USD/JPY","USD/CHF"],
    Crypto: ["BTC/USD","ETH/USD"],
    Stocks: ["AAPL","TSLA"],
    Commodities: ["Gold","Oil"],
  };
  let TIMEFRAMES = ["15s","30s","1m"];

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

      st_need_tg: "Откройте внутри Telegram",
      st_need_tg_d: "Мини-приложение работает только внутри Telegram.",

      st_vpn_title: "Сервис недоступен",
      st_vpn_desc: "API не отвечает (network/CORS). Проверь Worker (CORS/OPTIONS) или включи VPN и попробуй снова.",

      st_reg_required: "Сначала создайте аккаунт",
      st_reg_required_d: "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь сюда.",

      st_checked: "проверено",

      st_deposit_required: "Требуется депозит",
      st_deposit_required_d: "Чтобы запустить анализ, внесите депозит и попробуйте снова.",

      btn_open_reg: "Открыть регистрацию",
      btn_open_deposit: "Открыть пополнение",
      btn_try_again: "Повторить",
      notify_btn_ok: "Понятно",
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

      st_need_tg: "Open inside Telegram",
      st_need_tg_d: "This mini app works only inside Telegram.",

      st_vpn_title: "Service unavailable",
      st_vpn_desc: "API not responding (network/CORS). Check Worker (CORS/OPTIONS) or enable VPN and retry.",

      st_reg_required: "Create an account first",
      st_reg_required_d: "Tap “Open registration”, create an account, then come back.",

      st_checked: "checked",

      st_deposit_required: "Deposit required",
      st_deposit_required_d: "To run analysis, make a deposit and try again.",

      btn_open_reg: "Open registration",
      btn_open_deposit: "Open deposit",
      btn_try_again: "Try again",
      notify_btn_ok: "OK",
    }
  };

  const t = (key) => I18N[LANG]?.[key] ?? key;

  function applyI18n() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i]").forEach(el => {
      const k = el.getAttribute("data-i");
      el.textContent = t(k);
    });
  }

  // =========================
  // AUTH
  // =========================
  async function authRequest() {
    const initData = tg?.initData || "";
    if (!initData) return { ok: false, error: "no_initData" };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.AUTH_TIMEOUT_MS);

    try {
      const resp = await fetch(CONFIG.API_BASE + "/pb/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ initData }),
        cache: "no-store",
        signal: ctrl.signal,
        // mode: "cors" // (по умолчанию cors, можно оставить)
      });

      clearTimeout(timer);

      const text = await resp.text(); // читаем как текст чтобы поймать html/403
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = { ok:false, error:"bad_json", raw:text.slice(0,200) }; }

      if (!resp.ok) {
        return { ok: false, error: "http_" + resp.status, details: json };
      }

      return json;

    } catch (e) {
      clearTimeout(timer);
      return { ok: false, error: "network_fail", details: String(e?.message || e) };
    }
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
      error: String(data?.error || data?.message || data?.reason || ""),
    };
  }

  // =========================
  // Assets loader
  // =========================
  async function loadAssetsJson() {
    try {
      const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
      if (!r.ok) throw new Error("assets.json http_" + r.status);
      const j = await r.json();

      if (j?.categories && typeof j.categories === "object") ASSETS = j.categories;
      if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
    } catch (e) {
      dbg("[assets.json] fallback:", e?.message || e);
    }
  }

  // =========================
  // UI refs (будут заполнены после DOM ready)
  // =========================
  let gate, app, btnOpenReg, btnGetAccess, gateStatusText, gateMeter;
  let notify, notifyTitle, notifyText, btnNotifyPrimary, notifyPrimaryLabel, btnNotifyClose;

  function setGateStatus(text, pct) {
    safeText(gateStatusText, text);
    if (gateMeter && typeof pct === "number") gateMeter.style.width = pct + "%";
  }

  function showNotify({ title, text, primaryLabel, primaryAction }) {
    if (!notify) return;
    safeText(notifyTitle, title);
    safeText(notifyText, text);
    safeText(notifyPrimaryLabel, primaryLabel || t("notify_btn_ok"));

    btnNotifyPrimary.onclick = null;
    btnNotifyPrimary.onclick = () => { try { primaryAction?.(); } catch {} };

    show(notify);
  }

  function hideNotify() {
    hide(notify);
  }

  function enterApp() {
    hide(gate);
    show(app);
    hideNotify();
  }

  async function gateCheckAndProceed() {
    dbg("[TG] exists?", !!tg);
    dbg("[TG] initData length =", tg?.initData?.length || 0);

    if (!tg?.initData) {
      setGateStatus(t("st_need_tg"), 22);
      showNotify({
        title: t("st_need_tg"),
        text: t("st_need_tg_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
      });
      return;
    }

    setGateStatus("…", 32);

    const raw = await authRequest();
    popup("AUTH_RAW", raw);

    const data = normalizeAuth(raw);
    popup("AUTH_NORM", data);

    AUTH = data;

    if (!AUTH.ok) {
      setGateStatus("network", 22);
      showNotify({
        title: t("st_vpn_title"),
        text: t("st_vpn_desc"),
        primaryLabel: t("btn_try_again"),
        primaryAction: () => gateCheckAndProceed(),
      });
      return;
    }

    if (!AUTH.flags.registered) {
      setGateStatus(t("st_reg_required"), 24);
      showNotify({
        title: t("st_reg_required"),
        text: t("st_reg_required_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
      });
      return;
    }

    setGateStatus(t("st_checked"), 62);
    enterApp();
  }

  // =========================
  // Boot after DOM ready
  // =========================
  async function start() {
    // DOM refs
    gate = $("gate");
    app = $("app");
    btnOpenReg = $("btnOpenReg");
    btnGetAccess = $("btnGetAccess");
    gateStatusText = $("gateStatusText");
    gateMeter = $("gateMeter");

    notify = $("notify");
    notifyTitle = $("notifyTitle");
    notifyText = $("notifyText");
    btnNotifyPrimary = $("btnNotifyPrimary");
    notifyPrimaryLabel = $("notifyPrimaryLabel");
    btnNotifyClose = $("btnNotifyClose");

    // SAFETY CHECKS
    dbg("[BOOT] btnGetAccess exists?", !!btnGetAccess);
    if (!gate || !app || !btnOpenReg || !btnGetAccess) {
      console.error("[BOOT] Missing required DOM ids. Check HTML ids: gate, app, btnOpenReg, btnGetAccess");
      return;
    }

    // Telegram ready
    try { tg?.ready?.(); tg?.expand?.(); } catch {}

    // language
    LANG = localStorage.getItem("lang") || "ru";
    applyI18n();

    // init UI
    show(gate);
    hide(app);
    hideNotify();
    setGateStatus(t("gate_status_na"), 14);

    // load assets (не критично)
    await loadAssetsJson();

    // events
    btnOpenReg.addEventListener("click", () => openURL(CONFIG.REG_URL));
    btnGetAccess.addEventListener("click", () => gateCheckAndProceed());
    btnNotifyClose?.addEventListener("click", hideNotify);

    // (не авто-чекаем, только по кнопке)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

})();
