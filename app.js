/* app.js — STABLE BUILD (v_fix_002)
   - один tg, без SyntaxError
   - без "..." и без двойных объявлений
   - showPopup через tg.showPopup
   - btnGetAccess всегда вешается если id существует
*/

(() => {
  "use strict";

  alert("NEW APP VERSION LOADED");
  console.log("APP.JS VERSION =", "v_fix_002");

  // =========================
  // CONFIG
  // =========================
  const CONFIG = {
    API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
    REG_URL:
      "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    DEPOSIT_URL:
      "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    ASSETS_JSON: "./assets.json",
    AUTH_TIMEOUT_MS: 9000,
  };

  // =========================
  // Telegram
  // =========================
  const tg = window.Telegram?.WebApp || null;
  try {
    tg?.ready?.();
    tg?.expand?.();
  } catch {}

  console.log("[TG] exists?", !!tg);
  console.log("[TG] initData length =", tg?.initData?.length || 0);

  // =========================
  // DOM helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");
  const safeText = (el, v) => {
    if (el) el.textContent = String(v ?? "");
  };

  // =========================
  // DOM refs (Gate/App)
  // =========================
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
  const vipBadge = $("vipBadge");

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

  const softLock = $("softLock");

  console.log("[BOOT] btnGetAccess exists?", !!btnGetAccess);

  // =========================
  // State
  // =========================
  let LANG = "ru";
  let LAST_NOTIFY_KEY = "";

  let AUTH = {
    ok: false,
    telegram_id: "",
    access: false,
    vip: false,
    flags: { registered: 0, dep_count: 0, approved: 0 },
    error: "",
  };

  let ASSETS = {
    Forex: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF"],
    Crypto: ["BTC/USD", "ETH/USD"],
    Stocks: ["AAPL", "TSLA"],
    Commodities: ["Gold", "Oil"],
  };
  let TIMEFRAMES = ["15s", "30s", "1m"];

  // =========================
  // i18n
  // =========================
  const I18N = {
    ru: {
      gate_status_na: "не проверен",
      st_need_tg: "Откройте внутри Telegram",
      st_need_tg_d: "Мини-приложение работает только внутри Telegram.",
      st_checked: "проверено",

      st_reg_required: "Сначала создайте аккаунт",
      st_reg_required_d: "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь сюда.",

      st_deposit_required: "Требуется депозит",
      st_deposit_required_d: "Чтобы запустить анализ, внесите депозит и попробуйте снова.",

      st_vpn_title: "Сервис недоступен",
      st_vpn_desc: "Сервер не отвечает или блокируется. Попробуйте VPN и нажмите «Получить доступ» ещё раз.",

      btn_open_reg: "Открыть регистрацию",
      btn_open_deposit: "Открыть пополнение",
      btn_try_again: "Повторить",

      chart_quality: "Quality: —",
      chart_conf: "Conf: —",
    },
    en: {
      gate_status_na: "not checked",
      st_need_tg: "Open inside Telegram",
      st_need_tg_d: "This mini app works only inside Telegram.",
      st_checked: "checked",

      st_reg_required: "Create an account first",
      st_reg_required_d: "Tap “Open registration”, create an account, then come back.",

      st_deposit_required: "Deposit required",
      st_deposit_required_d: "To run analysis, make a deposit and try again.",

      st_vpn_title: "Service unavailable",
      st_vpn_desc: "Server not responding / blocked. Try VPN and tap “Get access” again.",

      btn_open_reg: "Open registration",
      btn_open_deposit: "Open deposit",
      btn_try_again: "Try again",

      chart_quality: "Quality: —",
      chart_conf: "Conf: —",
    },
  };

  const t = (key) => I18N[LANG]?.[key] ?? key;

  function applyI18n() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i]").forEach((el) => {
      const k = el.getAttribute("data-i");
      el.textContent = t(k);
    });
  }

  // =========================
  // Gate status
  // =========================
  function setGateStatus(text, meterPct) {
    safeText(gateStatusText, text);
    if (gateMeter && typeof meterPct === "number") gateMeter.style.width = `${meterPct}%`;
  }

  // =========================
  // Open URL
  // =========================
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
  // Soft lock
  // =========================
  function setLocked(isLocked) {
    if (!softLock) return;
    if (isLocked) show(softLock);
    else hide(softLock);
  }

  // =========================
  // Notify (anti-spam)
  // =========================
  function showNotify({ title = "", text = "", primaryLabel = "OK", primaryAction = null, key = "" }) {
    if (!notify) return;

    const k = key || `${title}:${text}:${primaryLabel}`;
    if (!notify.classList.contains("hidden") && LAST_NOTIFY_KEY === k) return;
    LAST_NOTIFY_KEY = k;

    safeText(notifyTitle, title);
    safeText(notifyText, text);

    if (btnNotifyPrimary && notifyPrimaryLabel) {
      safeText(notifyPrimaryLabel, primaryLabel);
      btnNotifyPrimary.onclick = null;
      btnNotifyPrimary.onclick = () => {
        try {
          primaryAction && primaryAction();
        } catch {}
      };
    }

    show(notify);
  }

  function hideNotify() {
    if (!notify) return;
    hide(notify);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
        cache: "no-store",
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!resp.ok) {
        return { ok: false, error: "api_error", status: resp.status };
      }

      const data = await resp.json().catch(() => ({}));
      return data;
    } catch (e) {
      clearTimeout(timer);
      return { ok: false, error: "network_fail" };
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

  function popupDump(title, obj) {
    const msg = JSON.stringify(obj, null, 2).slice(0, 3500);
    if (tg?.showPopup) {
      tg.showPopup({ title, message: msg, buttons: [{ type: "close" }] });
    } else {
      alert(title + "\n\n" + msg);
    }
  }

  // =========================
  // Assets loader
  // =========================
  async function loadAssetsJson() {
    try {
      const r = await fetch(CONFIG.ASSETS_JSON, { cache: "no-store" });
      if (!r.ok) throw new Error("assets.json not ok");
      const j = await r.json();

      if (j?.categories && typeof j.categories === "object") ASSETS = j.categories;
      if (Array.isArray(j?.timeframes)) TIMEFRAMES = j.timeframes;
    } catch {
      // fallback ok
    }
  }

  // =========================
  // Modals
  // =========================
  function openModal(modal) {
    show(backdrop);
    show(modal);
  }
  function closeModal(modal) {
    hide(modal);
    hide(backdrop);
  }

  function openLangModal() {
    if (!langList) return;

    langList.innerHTML = "";
    [
      { id: "ru", label: "Русский" },
      { id: "en", label: "English" },
    ].forEach((it) => {
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

  function openAssets() {
    if (!assetTabs || !assetList || !assetSearch) return;

    assetTabs.innerHTML = "";
    assetList.innerHTML = "";
    assetSearch.value = "";

    const cats = Object.keys(ASSETS || {});
    let activeCat = cats[0] || "Forex";

    const render = () => {
      assetList.innerHTML = "";
      const q = assetSearch.value.trim().toLowerCase();

      const list = (ASSETS[activeCat] || []).filter((x) => !q || String(x).toLowerCase().includes(q));

      list.forEach((sym) => {
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

    assetSearch.oninput = render;

    render();
    openModal(assetsModal);
  }

  function openTF() {
    if (!tfList) return;

    tfList.innerHTML = "";
    (TIMEFRAMES || []).forEach((tf) => {
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

  function toggleMarket() {
    if (!marketValue) return;
    marketValue.textContent = marketValue.textContent === "OTC" ? "Market" : "OTC";
    drawChartDemo();
  }

  // =========================
  // UI: signal
  // =========================
  function setSignal(text, isUp) {
    safeText(dirText, text);
    if (!dirArrow || !dirText) return;

    if (isUp) {
      safeText(dirArrow, "↗");
      dirArrow.classList.remove("down");
      dirText.classList.remove("down");
      dirArrow.classList.add("up");
      dirText.classList.add("up");
    } else {
      safeText(dirArrow, "↘");
      dirArrow.classList.remove("up");
      dirText.classList.remove("up");
      dirArrow.classList.add("down");
      dirText.classList.add("down");
    }
  }

  // =========================
  // Charts demo
  // =========================
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
  }

  // =========================
  // Gate/App transitions
  // =========================
  function enterApp() {
    hide(gate);
    show(app);

    const sid = AUTH.telegram_id ? AUTH.telegram_id.slice(-6) : "—";
    safeText(chipSession, "SESSION: " + sid);
    safeText(chipAccess, "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING"));

    if (AUTH.vip) {
      show(pillVipTop);
      show(vipBadge);
    } else {
      hide(pillVipTop);
      hide(vipBadge);
    }

    hideNotify();
    setLocked(false);

    drawChartDemo();
    drawMiniChartDemo();
  }

  async function gateCheckAndProceed() {
    console.log("[GATE] Get access clicked");
    setGateStatus(t("gate_status_na"), 18);

    if (!tg?.initData) {
      setGateStatus(t("st_need_tg"), 22);
      showNotify({
        title: t("st_need_tg"),
        text: t("st_need_tg_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
        key: "need_tg_gate",
      });
      return;
    }

    setGateStatus("…", 32);

    const raw = await authRequest();
    console.log("AUTH_RAW_GATE", raw);
    popupDump("AUTH_RAW", raw);

    const data = normalizeAuth(raw);
    console.log("AUTH_NORM_GATE", data);
    popupDump("AUTH_NORM", data);

    if (!data.ok) {
      setGateStatus("network", 22);
      showNotify({
        title: t("st_vpn_title"),
        text: t("st_vpn_desc"),
        primaryLabel: t("btn_try_again"),
        primaryAction: () => gateCheckAndProceed(),
        key: "vpn_hint_gate",
      });
      return;
    }

    AUTH = data;

    if (AUTH.vip) show(pillVipGate);
    else hide(pillVipGate);

    if (!AUTH.flags.registered) {
      setGateStatus(t("st_reg_required"), 24);
      showNotify({
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

  async function refreshAuthSilent() {
    if (!tg?.initData) return;

    const raw = await authRequest();
    console.log("AUTH_RAW_APP", raw);

    const data = normalizeAuth(raw);
    console.log("AUTH_NORM_APP", data);

    if (data.ok) AUTH = data;

    safeText(chipAccess, "ACCESS: " + (AUTH.access ? "OPEN" : "PENDING"));

    if (!AUTH.flags.registered) {
      hide(app);
      show(gate);
      setGateStatus(t("st_reg_required"), 24);
      showNotify({
        title: t("st_reg_required"),
        text: t("st_reg_required_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
        key: "need_reg_back",
      });
    }
  }

  async function runAnalysis(direction) {
    if (!AUTH.flags.registered) {
      showNotify({
        title: t("st_reg_required"),
        text: t("st_reg_required_d"),
        primaryLabel: t("btn_open_reg"),
        primaryAction: () => openURL(CONFIG.REG_URL),
        key: "need_reg_on_analyze",
      });
      return;
    }

    if (AUTH.flags.dep_count < 1) {
      showNotify({
        title: t("st_deposit_required"),
        text: t("st_deposit_required_d"),
        primaryLabel: t("btn_open_deposit"),
        primaryAction: () => openURL(CONFIG.DEPOSIT_URL),
        key: "need_deposit_on_analyze",
      });
      return;
    }

    const dur = 650 + Math.floor(Math.random() * 900);

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

    safeText(chipQuality, `Quality: ${quality}`);
    safeText(chipConf, `Conf: ${conf}`);

    safeText(rAcc, `${quality}%`);
    safeText(volFactor, ["Low", "Mid", "High"][Math.floor(Math.random() * 3)]);
    safeText(momFactor, ["Soft", "Stable", "Strong"][Math.floor(Math.random() * 3)]);
    safeText(liqFactor, ["Thin", "Normal", "Deep"][Math.floor(Math.random() * 3)]);

    const until = new Date(Date.now() + 30 * 1000);
    safeText(rWindow, tfValue?.textContent || "30s");
    safeText(rUntil, `${String(until.getHours()).padStart(2, "0")}:${String(until.getMinutes()).padStart(2, "0")}`);

    drawChartDemo(isLong ? 1 : -1);
    drawMiniChartDemo(isLong ? 1 : -1);
  }

  function doReset() {
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
  // Events
  // =========================
  function bindEvents() {
    btnOpenReg?.addEventListener("click", () => openURL(CONFIG.REG_URL));

    if (btnGetAccess) {
      btnGetAccess.addEventListener("click", gateCheckAndProceed);
    } else {
      console.warn("[UI] btnGetAccess not found. Проверь HTML id='btnGetAccess'");
    }

    btnLangGate?.addEventListener("click", openLangModal);
    btnLangApp?.addEventListener("click", openLangModal);

    btnNotifyClose?.addEventListener("click", hideNotify);

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
  async function boot() {
    show(gate);
    hide(app);

    LANG = localStorage.getItem("lang") || "ru";
    applyI18n();

    await loadAssetsJson();

    setGateStatus(t("gate_status_na"), 14);
    setSignal("LONG-TREND", true);

    drawChartDemo();
    drawMiniChartDemo();
  }

  bindEvents();
  boot();
})();
