(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const API_BASE = "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev";
  const AUTH_URL = API_BASE + "/pb/auth";
  const DEBUG = true;

  const tg = window.Telegram?.WebApp || null;

  const log = (...a) => DEBUG && console.log("[APP]", ...a);
  const warn = (...a) => DEBUG && console.warn("[APP]", ...a);
  const err = (...a) => console.error("[APP]", ...a);

  // =========================
  // DOM helpers
  // =========================
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

  // =========================
  // Auth
  // =========================
  async function auth() {
    if (!tg?.initData) {
      return { ok: false, error: "NO_TELEGRAM", details: "Open inside Telegram" };
    }

    const payload = { initData: tg.initData };
    const ctrl = new AbortController();
    const tmr = setTimeout(() => ctrl.abort(), 12000);

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
  // Demo analysis
  // =========================
  function demoResult() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const dir = pick(["LONG ✅", "SHORT ✅", "WAIT ⏸️"]);
    const conf = (Math.random() * 0.35 + 0.6).toFixed(2);
    return { dir, conf, ts: new Date().toLocaleTimeString() };
  }

  // =========================
  // Click-block detector (важно!)
  // =========================
  function elementBlockingClick(btn) {
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    const x = Math.floor(r.left + Math.min(20, r.width / 2));
    const y = Math.floor(r.top + Math.min(20, r.height / 2));
    const topEl = document.elementFromPoint(x, y);
    if (!topEl) return null;
    // Если верхний элемент не кнопка и не внутри кнопки — значит перекрытие
    if (topEl === btn || btn.contains(topEl)) return null;
    return topEl;
  }

  // =========================
  // Main click handler
  // =========================
  async function onAnalyzeClick(e) {
    try {
      log("btnAnalyze clicked");

      const btn = e?.currentTarget || $("btnAnalyze");

      // 1) проверяем, не перекрыта ли кнопка
      const blocker = elementBlockingClick(btn);
      if (blocker) {
        const info = `${blocker.tagName}${blocker.id ? "#" + blocker.id : ""}${blocker.className ? "." + String(blocker.className).replace(/\s+/g, ".") : ""}`;
        warn("Click blocked by:", blocker);
        popup("Клик не доходит до кнопки", `Кнопку перекрывает элемент:\n${info}\n\nРешение: временно скрыть/убрать overlay/backdrop/softLock или поставить ему pointer-events:none.`);
        return;
      }

      // 2) auth
      const a = await auth();
      log("AUTH:", a);

      if (!a?.ok) {
        popup("AUTH ERROR", `${a?.error || "unknown"}\n${JSON.stringify(a?.details || {}, null, 2).slice(0, 2000)}`);
        return;
      }

      // 3) доступ
      if (Number(a?.flags?.registered ?? 0) !== 1) {
        popup("Нет доступа", "Пользователь не зарегистрирован (flags.registered != 1).");
        return;
      }

      // 4) демо-результат (чтобы точно было действие)
      const r = demoResult();
      popup("ANALYSIS (demo)", `Signal: ${r.dir}\nConfidence: ${r.conf}\nTime: ${r.ts}`);

      // Если хочешь — сюда потом вставим реальный запрос на /analyze
    } catch (ex) {
      err(ex);
      popup("JS ERROR", String(ex?.message || ex));
    }
  }

  // =========================
  // Bind logic (reliable)
  // =========================
  function bindAnalyzeButton() {
    const btn = $("btnAnalyze");
    if (!btn) return false;

    // не навешивать повторно
    if (btn.dataset.bound === "1") return true;
    btn.dataset.bound = "1";

    btn.addEventListener("click", onAnalyzeClick, { passive: true });
    log("Handler bound to #btnAnalyze ✅", btn);
    return true;
  }

  function boot() {
    log("BOOT", Date.now());

    try { tg?.ready?.(); tg?.expand?.(); } catch {}

    // Сразу пробуем привязать
    if (bindAnalyzeButton()) return;

    // Если кнопки ещё нет (или появится позже) — наблюдаем DOM
    const obs = new MutationObserver(() => {
      if (bindAnalyzeButton()) {
        obs.disconnect();
      }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });
    log("btnAnalyze not found yet — observing DOM…");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
