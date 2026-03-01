(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const API_BASE = "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev";
  // ВАЖНО: если сделаешь кастомный домен — просто поменяй API_BASE на него.
  const AUTH_URL = API_BASE + "/pb/auth";
  const HEALTH_URL = API_BASE + "/health";

  const DEBUG = true;
  const TIMEOUT_MS = 12000;
  const RETRIES = 2;

  const tg = window.Telegram?.WebApp || null;

  const log = (...a) => DEBUG && console.log("[APP]", ...a);

  const $ = (id) => document.getElementById(id);

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

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const ctrl = new AbortController();
    const tmr = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal, cache: "no-store" });
      clearTimeout(tmr);
      return res;
    } catch (e) {
      clearTimeout(tmr);
      throw e;
    }
  }

  async function fetchJsonRetry(url, options = {}, retries = RETRIES) {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      try {
        const r = await fetchWithTimeout(url, options);
        const text = await r.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; }
        catch { data = { ok: false, error: "BAD_JSON", raw: text.slice(0, 200) }; }

        if (!r.ok) return { ok: false, error: "HTTP_" + r.status, details: data };
        return data;
      } catch (e) {
        lastErr = e;
        if (i < retries) await sleep(400 * (i + 1));
      }
    }
    return { ok: false, error: "network_fail", details: String(lastErr?.message || lastErr) };
  }

  // =========================
  // QUICK HEALTH CHECK
  // =========================
  async function healthCheck() {
    const h = await fetchJsonRetry(HEALTH_URL, { method: "GET" }, 0);
    return h?.ok === true;
  }

  // =========================
  // AUTH
  // =========================
  async function auth() {
    if (!tg) {
      return { ok: false, error: "NO_TG_OBJECT", details: "Telegram.WebApp not found" };
    }
    if (!tg.initData) {
      return { ok: false, error: "NO_INITDATA", details: "Open inside Telegram mini app" };
    }

    // Берём telegram_id безопасно из initDataUnsafe (меньше шансов, чем парсить initData на бэке)
    const telegram_id = String(tg?.initDataUnsafe?.user?.id || "");
    const payload = telegram_id
      ? { telegram_id, initData: tg.initData }
      : { initData: tg.initData };

    return await fetchJsonRetry(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
    });
  }

  // =========================
  // DEMO ANALYSIS
  // =========================
  function demoResult() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const dir = pick(["LONG ✅", "SHORT ✅", "WAIT ⏸️"]);
    const conf = (Math.random() * 0.35 + 0.6).toFixed(2);
    return { dir, conf, ts: new Date().toLocaleTimeString() };
  }

  // =========================
  // CLICK HANDLER
  // =========================
  async function onAnalyzeClick() {
    try {
      log("btnAnalyze clicked");

      // 0) Health check — если домен не грузится в iOS Telegram, сразу объясняем
      const okHealth = await healthCheck();
      if (!okHealth) {
        popup(
          "NETWORK BLOCK",
          "iOS Telegram WebView не может загрузить ваш API домен.\n\n" +
          "Это не баг кода, это блок/недоступность сети (часто workers.dev).\n\n" +
          "РЕШЕНИЕ: подключить Worker к кастомному домену (api.yourdomain.com) или тестировать через VPN."
        );
        return;
      }

      // 1) Auth
      const a = await auth();
      log("AUTH:", a);

      if (!a?.ok) {
        popup("AUTH ERROR", `${a?.error || "unknown"}\n${String(a?.details || "")}`.slice(0, 2000));
        return;
      }

      if (Number(a?.flags?.registered ?? 0) !== 1) {
        popup("Нет доступа", "Пользователь не зарегистрирован (flags.registered != 1).");
        return;
      }

      // 2) Демо-результат (чтобы кнопка точно “жила”)
      const r = demoResult();
      popup("ANALYSIS (demo)", `Signal: ${r.dir}\nConfidence: ${r.conf}\nTime: ${r.ts}`);
    } catch (e) {
      popup("JS ERROR", String(e?.message || e));
    }
  }

  // =========================
  // BIND
  // =========================
  function bindAnalyzeButton() {
    const btn = $("btnAnalyze");
    if (!btn) return false;
    if (btn.dataset.bound === "1") return true;
    btn.dataset.bound = "1";
    btn.addEventListener("click", onAnalyzeClick);
    log("Bound #btnAnalyze ✅");
    return true;
  }

  function boot() {
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    if (bindAnalyzeButton()) return;

    const obs = new MutationObserver(() => {
      if (bindAnalyzeButton()) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
