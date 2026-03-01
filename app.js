(() => {
  "use strict";

  const API_BASE = "https://hidden-fog-c1f2craft-analytics-api.ashirkhanlogubekov-833.workers.dev";
  const AUTH_URL = API_BASE + "/pb/auth";

  const tg = window.Telegram?.WebApp;

  const log = (...a) => console.log("[APP]", ...a);

  function findRunButton() {
    // 1) если есть id — лучше всего:
    const byId =
      document.getElementById("btnRunAnalysis") ||
      document.getElementById("runAnalysis") ||
      document.getElementById("btnAnalyze");

    if (byId) return byId;

    // 2) ищем по тексту на кнопках
    const buttons = Array.from(document.querySelectorAll("button, a"));
    return buttons.find((el) => (el.textContent || "").trim().includes("Запустить анализ")) || null;
  }

  async function auth() {
    if (!tg?.initData) {
      return { ok: false, error: "NO_TELEGRAM", details: "Open inside Telegram" };
    }

    const payload = { initData: tg.initData };

    const r = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: false, error: "BAD_JSON", raw: text.slice(0, 200) }; }

    if (!r.ok) return { ok: false, error: "HTTP_" + r.status, details: data };
    return data;
  }

  function showDemoResult() {
    // Демка: чтобы кнопка “жила”
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const directions = ["UP ✅", "DOWN ✅", "WAIT ⏸️"];
    const conf = (Math.random() * 0.35 + 0.6).toFixed(2);

    const result = {
      signal: pick(directions),
      confidence: conf,
      ts: Date.now(),
    };

    log("ANALYSIS RESULT:", result);

    if (tg?.showPopup) {
      tg.showPopup({
        title: "ANALYSIS (demo)",
        message: `Signal: ${result.signal}\nConfidence: ${result.confidence}\nTS: ${result.ts}`,
        buttons: [{ type: "close" }],
      });
    } else {
      alert(`Signal: ${result.signal}\nConfidence: ${result.confidence}`);
    }
  }

  async function onRunAnalysisClick() {
    try {
      log("Run analysis clicked");

      const a = await auth();
      log("AUTH:", a);

      if (!a?.ok) {
        alert("Auth failed: " + (a?.error || "unknown"));
        return;
      }
      if (a?.flags?.registered !== 1) {
        alert("Нет доступа: зарегистрируйтесь и вернитесь.");
        return;
      }

      // ✅ Вот теперь действие гарантировано:
      showDemoResult();
    } catch (e) {
      console.error(e);
      alert("Ошибка: " + (e?.message || e));
    }
  }

  function boot() {
    try {
      tg?.ready?.();
      tg?.expand?.();
    } catch {}

    const btn = findRunButton();
    if (!btn) {
      log("Run button not found (no handler attached). Проверь текст/ID кнопки.");
      return;
    }

    // чтобы не навешивать повторно
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", onRunAnalysisClick);
    log("Bound handler to:", btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
