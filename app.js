// app.js — IRONCLAD (Gate + Analyze demo) for Telegram Mini App
(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const CONFIG = {
    API_BASE: "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev",
    AUTH_PATH: "/pb/auth",

    // ВСТАВЬ СВОИ ССЫЛКИ (если уже есть — просто замени)
    REG_URL:
      "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    DEPOSIT_URL:
      "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",

    AUTH_TIMEOUT_MS: 12000,
    DEBUG: true,
  };

  const AUTH_URL = CONFIG.API_BASE + CONFIG.AUTH_PATH;
  const tg = window.Telegram?.WebApp || null;

  const log = (...a) => CONFIG.DEBUG && console.log("[APP]", ...a);
  const warn = (...a) => CONFIG.DEBUG && console.warn("[APP]", ...a);
  const error = (...a) => console.error("[APP]", ...a);

  // =========================
  // DOM helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");
  const safeText = (el, v) => { if (el) el.textContent = String(v ?? ""); };

  function popup(title, message) {
    const msg = String(message ?? "");
    log("POPUP:", title, msg);
    try {
      if (tg?.showPopup) {
        tg.showPopup({
          title: String(title).slice(0, 64),
          message: msg.slice(0, 3500),
          buttons: [{ type: "close" }],
        });
        return;
      }
    } catch {}
    alert(`${title}\n\n${msg}`);
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
  // Auth
  // =========================
  async function auth() {
    if (!tg?.initData) {
      return { ok: false, error: "NO_TELEGRAM", details: "Open inside Telegram" };
    }

    const payload = { initData: tg.initData };
    const ctrl = new AbortController();
    const tmr = setTimeout(() => ctrl.abort(), CONFIG.AUTH_TIMEOUT_MS);

    try {
      const r = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit",
        cache: "no-store",
        signal: ctrl.signal,
      });

      clearTimeout(tmr);

      const text = await r.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; }
      catch { data = { ok: false, error: "BAD_JSON", raw: text.slice(0, 200) }; }

      if (!r.ok) return { ok: false, error: "HTTP_" + r.status, details: data };
      return data;
    } catch (e) {
      clearTimeout(tmr);
      return { ok: false, error: "network_fail", details: String(e?.message || e) };
    }
  }

  // =========================
  // UI: Gate <-> App
  // =========================
  function enterApp(authData) {
    hide($("gate"));
    show($("app"));

    // Чипы вверху (если есть)
    const session = $("chipSession");
    const access = $("chipAccess");
    if (session) safeText(session, "SESSION: " + (authData?.telegram_id || "—"));
    if (access) safeText(access, "ACCESS: " + (authData?.access ? "OK" : "—"));

    // VIP
    const isVip = !!authData?.vip;
    if ($("pillVipTop")) isVip ? show($("pillVipTop")) : hide($("pillVipTop"));
    if ($("pillVipGate")) isVip ? show($("pillVipGate")) : hide($("pillVipGate"));
  }

  function stayOnGate(statusText, meterPct) {
    show($("gate"));
    hide($("app"));
    safeText($("gateStatusText"), statusText || "—");
    const meter = $("gateMeter");
    if (meter && typeof meterPct === "number") meter.style.width = `${meterPct}%`;
  }

  async function handleGetAccess() {
    // 1) Telegram check
    if (!tg?.initData) {
      stayOnGate("Откройте внутри Telegram", 22);
      popup("Откройте внутри Telegram", "Мини-приложение работает только внутри Telegram (нужен initData).");
      return;
    }

    stayOnGate("Проверка…", 32);

    // 2) auth
    const a = await auth();
    log("AUTH:", a);

    if (!a?.ok) {
      stayOnGate("Ошибка сети", 22);
      popup("AUTH ERROR", `${a?.error || "unknown"}\n${JSON.stringify(a?.details || {}, null, 2).slice(0, 2000)}`);
      return;
    }

    // 3) registered gate
    const registered = Number(a?.flags?.registered ?? 0) === 1;
    if (!registered) {
      stayOnGate("Сначала регистрация", 24);
      popup("Сначала регистрация", "Нажмите «Открыть регистрацию», создайте аккаунт и вернитесь.");
      return;
    }

    // 4) ok
    stayOnGate("Проверено", 62);
    enterApp(a);
  }

  // =========================
  // Analyze logic (demo, гарантированно работает)
  // =========================
  function demoResult() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const dir = pick(["LONG ✅", "SHORT ✅", "WAIT ⏸️"]);
    const conf = (Math.random() * 0.35 + 0.6).toFixed(2);
    return { dir, conf, ts: new Date().toLocaleTimeString() };
  }

  function elementBlockingClick(btn) {
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    const x = Math.floor(r.left + Math.min(20, r.width / 2));
    const y = Math.floor(r.top + Math.min(20, r.height / 2));
    const topEl = document.elementFromPoint(x, y);
    if (!topEl) return null;
    if (topEl === btn || btn.contains(topEl)) return null;
    return topEl;
  }

  async function onAnalyzeClick(e) {
    try {
      log("btnAnalyze clicked");
      const btn = e?.currentTarget || $("btnAnalyze");

      // Проверка перекрытия
      const blocker = elementBlockingClick(btn);
      if (blocker) {
        const info =
          `${blocker.tagName}` +
          `${blocker.id ? "#" + blocker.id : ""}` +
          `${blocker.className ? "." + String(blocker.className).replace(/\s+/g, ".") : ""}`;
        warn("Click blocked by:", blocker);
        popup(
          "Клик не доходит до кнопки",
          `Кнопку перекрывает элемент:\n${info}\n\n` +
          `Решение: скрыть overlay/backdrop/softLock или поставить этому слою pointer-events:none.`
        );
        return;
      }

      // auth (ещё раз, чтобы точно было действие и не зависело от прошлого)
      const a = await auth();
      log("AUTH:", a);

      if (!a?.ok) {
        popup("AUTH ERROR", `${a?.error || "unknown"}\n${JSON.stringify(a?.details || {}, null, 2).slice(0, 2000)}`);
        return;
      }

      if (Number(a?.flags?.registered ?? 0) !== 1) {
        popup("Нет доступа", "Пользователь не зарегистрирован. Открой регистрацию и вернись.");
        return;
      }

      // (если позже захочешь депозит-гейт — раскомментируешь)
      // if (Number(a?.flags?.dep_count ?? 0) <= 0) {
      //   popup("Требуется депозит", "Открой пополнение и попробуй снова.");
      //   openURL(CONFIG.DEPOSIT_URL);
      //   return;
      // }

      const r = demoResult();
      popup("ANALYSIS (demo)", `Signal: ${r.dir}\nConfidence: ${r.conf}\nTime: ${r.ts}`);
    } catch (ex) {
      error(ex);
      popup("JS ERROR", String(ex?.message || ex));
    }
  }

  // =========================
  // Bind helpers (железобетон)
  // =========================
  function bindOnce(id, event, handler) {
    const el = $(id);
    if (!el) return false;
    const key = `bound_${event}`;
    if (el.dataset[key] === "1") return true;
    el.dataset[key] = "1";
    el.addEventListener(event, handler);
    return true;
  }

  function bindAll() {
    // Gate buttons
    bindOnce("btnOpenReg", "click", () => openURL(CONFIG.REG_URL));
    bindOnce("btnGetAccess", "click", () => handleGetAccess());

    // App buttons
    bindOnce("btnAnalyze", "click", onAnalyzeClick);

    // Optional: “Проверить” в App — просто делает auth и показывает статус
    bindOnce("btnCheckStatus", "click", async () => {
      const a = await auth();
      if (!a?.ok) {
        popup("AUTH ERROR", `${a?.error || "unknown"}`);
        return;
      }
      popup("STATUS", JSON.stringify(a, null, 2));
    });

    // Optional: “Сброс” — возвращает на Gate
    bindOnce("btnReset", "click", () => {
      stayOnGate("не проверен", 14);
    });
  }

  function boot() {
    log("BOOT", Date.now());
    try { tg?.ready?.(); tg?.expand?.(); } catch {}

    // стартовый вид
    stayOnGate("не проверен", 14);

    // Привязки
    bindAll();

    // Если Telegram/WebView прогрузит DOM кусками — наблюдаем и довязываем
    const obs = new MutationObserver(() => bindAll());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
