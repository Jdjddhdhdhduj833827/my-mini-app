console.log("APP.JS EXECUTED ✅", Date.now());

(() => {
  "use strict";

  // =========================
  // CONFIG (меняешь только это)
  // =========================
  const CONFIG = {
    API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
    AUTH_PATH: "/pb/auth",
    HEALTH_PATH: "/health",
    REG_URL:
      "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    DEPOSIT_URL:
      "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    DEBUG_POPUPS: true,
  };

  // =========================
  // Telegram WebApp
  // =========================
  const tg = window.Telegram?.WebApp || null;

  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");
  const safeText = (el, v) => {
    if (el) el.textContent = String(v ?? "");
  };

  const dbg = (...args) => console.log(...args);

  function popup(title, obj) {
    if (!CONFIG.DEBUG_POPUPS) return;
    const msg = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    try {
      if (tg?.showPopup) {
        tg.showPopup({
          title,
          message: msg.slice(0, 3500),
          buttons: [{ type: "close" }],
        });
      } else {
        // fallback
        console.log("[POPUP]", title, msg);
      }
    } catch (e) {
      console.log("[POPUP_FAIL]", title, e);
    }
  }

  function openURL(url) {
    if (!url) return;
    try {
      // Telegram way
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  // =========================
  // UI refs
  // =========================
  let gate, app, btnOpenReg, btnGetAccess, gateStatusText, gateMeter;
  let notify, notifyTitle, notifyText, btnNotifyPrimary, notifyPrimaryLabel, btnNotifyClose;

  function setGateStatus(text, pct) {
    safeText(gateStatusText, text);
    if (gateMeter && typeof pct === "number") gateMeter.style.width = pct + "%";
  }

  function showNotify({ title, text, primaryLabel, primaryAction }) {
    // notify optional
    if (!notify) {
      // fallback: обычный alert
      alert(`${title}\n\n${text}`);
      try { primaryAction?.(); } catch {}
      return;
    }

    safeText(notifyTitle, title);
    safeText(notifyText, text);
    safeText(notifyPrimaryLabel, primaryLabel || "OK");

    if (btnNotifyPrimary) {
      btnNotifyPrimary.onclick = null;
      btnNotifyPrimary.onclick = () => {
        try { primaryAction?.(); } catch {}
      };
    }

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

  // =========================
  // Network: safe fetch JSON
  // =========================
  async function fetchJson(url, options = {}) {
    const resp = await fetch(url, {
      mode: "cors",
      credentials: "omit", // ✅ критично для WebView
      cache: "no-store",
      ...options,
      headers: {
        "Accept": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await resp.text().catch(() => "");
    let data = null;
    try { data = text ? JSON.parse(text) : null; }
    catch { data = { ok: false, error: "bad_json", raw: text.slice(0, 200) }; }

    return { ok: resp.ok, status: resp.status, data };
  }

  // =========================
  // Diagnostics
  // =========================
  async function healthCheck() {
    try {
      const { ok, status, data } = await fetchJson(CONFIG.API_BASE + CONFIG.HEALTH_PATH, {
        method: "GET",
      });
      return { ok, status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { ok: false, error: "network_fail", details: String(e?.message || e) } };
    }
  }

  // =========================
  // Auth (железо-бетон)
  // =========================
  async function authRequest() {
    const initData = tg?.initData || "";
    const telegram_id = tg?.initDataUnsafe?.user?.id;

    // если не Telegram-среда
    if (!tg || !initData || !telegram_id) {
      return {
        ok: false,
        error: "not_in_telegram",
        details: {
          has_tg: !!tg,
          initData_len: initData?.length || 0,
          telegram_id: telegram_id || null,
        },
      };
    }

    // отправляем сразу telegram_id + initData
    try {
      const { ok, status, data } = await fetchJson(CONFIG.API_BASE + CONFIG.AUTH_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id, initData }),
      });

      if (!ok) {
        return { ok: false, error: "http_" + status, details: data };
      }

      return data || { ok: false, error: "empty_response" };
    } catch (e) {
      return { ok: false, error: "network_fail", details: String(e?.message || e) };
    }
  }

  function normalizeAuth(raw) {
    const flags = raw?.flags || {};
    return {
      ok: !!raw?.ok,
      telegram_id: String(raw?.telegram_id || ""),
      access: !!raw?.access,
      vip: !!raw?.vip,
      flags: {
        registered: Number(flags.registered ?? 0),
        dep_count: Number(flags.dep_count ?? 0),
        approved: Number(flags.approved ?? 0),
      },
      error: String(raw?.error || raw?.message || raw?.reason || ""),
      _raw: raw,
    };
  }

  // =========================
  // Main gate flow
  // =========================
  async function gateCheckAndProceed() {
    setGateStatus("checking…", 25);

    // 1) environment check
    if (!tg || !tg.initDataUnsafe?.user?.id || !tg.initData) {
      setGateStatus("open inside Telegram", 18);
      popup("ENV", {
        has_tg: !!tg,
        initData_len: tg?.initData?.length || 0,
        user: tg?.initDataUnsafe?.user || null,
      });

      showNotify({
        title: "Открой внутри Telegram",
        text: "Это мини-приложение работает только внутри Telegram WebApp (через кнопку/бота).",
        primaryLabel: "Открыть регистрацию",
        primaryAction: () => openURL(CONFIG.REG_URL),
      });
      return;
    }

    // 2) optional health check (быстро даст понять жив ли worker)
    const hc = await healthCheck();
    popup("HEALTH", hc);

    // 3) auth
    setGateStatus("auth…", 40);
    const raw = await authRequest();
    popup("AUTH_RAW", raw);

    const AUTH = normalizeAuth(raw);
    popup("AUTH_NORM", AUTH);

    if (!AUTH.ok) {
      setGateStatus("network", 20);
      showNotify({
        title: "Ошибка сети / API",
        text:
          "Worker не ответил корректно. Проверь:\n" +
          "• URL API_BASE\n• CORS/OPTIONS в Worker\n• что открыто именно внутри Telegram\n\n" +
          "Детали: " + (AUTH.error || "unknown"),
        primaryLabel: "Повторить",
        primaryAction: () => gateCheckAndProceed(),
      });
      return;
    }

    if (!AUTH.flags.registered) {
      setGateStatus("need register", 30);
      showNotify({
        title: "Сначала регистрация",
        text: "Создай аккаунт по кнопке ниже, затем вернись и нажми «Получить доступ».",
        primaryLabel: "Открыть регистрацию",
        primaryAction: () => openURL(CONFIG.REG_URL),
      });
      return;
    }

    // (если захочешь — можно требовать депозит/approve)
    // if (!AUTH.flags.dep_count) { ... }

    setGateStatus("ok", 85);
    enterApp();
  }

  // =========================
  // Boot
  // =========================
  function start() {
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

    // basic HTML check
    if (!gate || !app || !btnOpenReg || !btnGetAccess) {
      console.error(
        "[BOOT] Missing required DOM ids. Need: gate, app, btnOpenReg, btnGetAccess (+ gateStatusText/gateMeter optional)"
      );
      alert("Ошибка верстки: нет нужных элементов (gate/app/btnOpenReg/btnGetAccess).");
      return;
    }

    // Telegram ready
    try { tg?.ready?.(); tg?.expand?.(); } catch {}

    // init UI
    show(gate);
    hide(app);
    hideNotify();
    setGateStatus("not checked", 10);

    // events
    btnOpenReg.addEventListener("click", () => openURL(CONFIG.REG_URL));
    btnGetAccess.addEventListener("click", () => gateCheckAndProceed());
    btnNotifyClose?.addEventListener("click", hideNotify);

    // Можно включить авто-проверку при загрузке:
    // gateCheckAndProceed();

    dbg("[BOOT] tg?", !!tg, "initData len:", tg?.initData?.length || 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
