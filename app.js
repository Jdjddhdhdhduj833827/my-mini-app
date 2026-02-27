/* app.js — полностью заново (демо-интерфейс, не финсовет)
   Работает с твоим index.html (id: pairSelect/pairDrop, tfSelect/tfDrop, marketBtn, btnGenerate, btnGenerate2, btnReset, resultPanel, backdrop и т.д.)
   + поддержка таймфреймов: 10s / 15s / 30s / 1m / 3m / 5m / 7m / 10m
   + график (Lightweight Charts, если подключена библиотека)
   + анимация "анализа" перед выдачей сигнала
*/

(() => {
  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad2 = (n) => String(n).padStart(2, "0");

  function formatTimeHHMM(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function formatMMSS(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Telegram WebApp (опционально) ----------
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
    } catch {}
  }

  // ---------- data ----------
  const PAIRS = [
    { pair: "EUR/USD", badge: "🇪🇺🇺🇸" },
    { pair: "GBP/USD", badge: "🇬🇧🇺🇸" },
    { pair: "USD/JPY", badge: "🇺🇸🇯🇵" },
    { pair: "EUR/JPY", badge: "🇪🇺🇯🇵" },
    { pair: "AUD/USD", badge: "🇦🇺🇺🇸" },
    { pair: "USD/CHF", badge: "🇺🇸🇨🇭" },
    { pair: "BTC/USD", badge: "₿" },
    { pair: "ETH/USD", badge: "Ξ" },
  ];

  const TIMEFRAMES = [
    { label: "10s", seconds: 10 },
    { label: "15s", seconds: 15 },
    { label: "30s", seconds: 30 },
    { label: "1m", seconds: 60 },
    { label: "3m", seconds: 180 },
    { label: "5m", seconds: 300 },
    { label: "7m", seconds: 420 },
    { label: "10m", seconds: 600 },
  ];

  const MARKETS = ["OTC", "REAL"]; // кнопка marketBtn

  const state = {
    pair: "EUR/USD",
    pairBadge: "🇪🇺🇺🇸",
    tf: "3m",
    tfSec: 180,
    market: "OTC",
    // signal
    dir: "UP",
    acc: 76,
    until: "",
    // timers
    timerId: null,
    totalSec: 180,
    leftSec: 180,
    // analysis
    analyzing: false,
  };

  // ---------- elements ----------
  const pairSelect = $("pairSelect");
  const pairDrop = $("pairDrop");
  const pairValue = $("pairValue");
  const pairBadge = $("pairBadge");

  const tfSelect = $("tfSelect");
  const tfDrop = $("tfDrop");
  const tfValue = $("tfValue");

  const marketBtn = $("marketBtn");
  const marketValue = $("marketValue");

  const btnMenu = $("btnMenu");
  const btnGenerate = $("btnGenerate");
  const btnGenerate2 = $("btnGenerate2");
  const btnReset = $("btnReset");

  const hintText = $("hintText");
  const resultPanel = $("resultPanel");

  const rPair = $("rPair");
  const rTf = $("rTf");
  const rAcc = $("rAcc");
  const rDir = $("rDir");
  const rUntil = $("rUntil");

  const progressBar = $("progressBar");
  const timerText = $("timerText");

  const backdrop = $("backdrop");

  // ---------- dropdown rendering ----------
  function renderDropdown(container, items, activeValue, onPick) {
    container.innerHTML = items
      .map((it) => {
        const value = typeof it === "string" ? it : it.value ?? it.label ?? it.pair;
        const label = typeof it === "string" ? it : it.label ?? it.pair ?? it.value;
        const badge = typeof it === "string" ? "" : it.badge ? `<span class="badge">${escapeHtml(it.badge)}</span>` : "";
        const isActive = value === activeValue;
        return `
          <button class="dropItem ${isActive ? "active" : ""}" type="button" data-value="${escapeHtml(value)}">
            <span class="dropItem__left">
              ${badge}
              <span class="dropItem__text">${escapeHtml(label)}</span>
            </span>
            <span class="dropItem__right">${isActive ? "✓" : ""}</span>
          </button>
        `;
      })
      .join("");

    container.querySelectorAll("[data-value]").forEach((btn) => {
      btn.addEventListener("click", () => onPick(btn.getAttribute("data-value")));
    });
  }

  function openDropdown(drop) {
    closeAllDropdowns();
    drop.classList.add("open");
    showBackdrop(true);
  }

  function closeDropdown(drop) {
    drop.classList.remove("open");
  }

  function closeAllDropdowns() {
    closeDropdown(pairDrop);
    closeDropdown(tfDrop);
    showBackdrop(false);
  }

  function showBackdrop(on) {
    if (!backdrop) return;
    backdrop.classList.toggle("hidden", !on);
  }

  // backdrop click closes dropdowns
  if (backdrop) backdrop.addEventListener("click", closeAllDropdowns);

  // ---------- pair select ----------
  function setPair(pair) {
    const found = PAIRS.find((p) => p.pair === pair) || PAIRS[0];
    state.pair = found.pair;
    state.pairBadge = found.badge || "🌍";
    if (pairValue) pairValue.textContent = state.pair;
    if (pairBadge) pairBadge.textContent = state.pairBadge;

    // перерисовать график (если уже есть)
    renderChart(state.pair, state.market);
  }

  // ---------- timeframe select ----------
  function setTf(label) {
    const found = TIMEFRAMES.find((t) => t.label === label) || TIMEFRAMES[4];
    state.tf = found.label;
    state.tfSec = found.seconds;
    if (tfValue) tfValue.textContent = state.tf;
  }

  // ---------- market toggle ----------
  function toggleMarket() {
    const idx = MARKETS.indexOf(state.market);
    state.market = MARKETS[(idx + 1) % MARKETS.length];
    if (marketValue) marketValue.textContent = state.market;

    renderChart(state.pair, state.market);
  }

  // ---------- menu (пока просто закрывает всё) ----------
  if (btnMenu) btnMenu.addEventListener("click", () => closeAllDropdowns());

  // init dropdown contents
  function initControls() {
    setPair(state.pair);
    setTf(state.tf);
    if (marketValue) marketValue.textContent = state.market;

    renderDropdown(
      pairDrop,
      PAIRS.map((p) => ({ label: p.pair, value: p.pair, badge: p.badge })),
      state.pair,
      (val) => {
        setPair(val);
        closeAllDropdowns();
      }
    );

    renderDropdown(
      tfDrop,
      TIMEFRAMES.map((t) => ({ label: t.label, value: t.label })),
      state.tf,
      (val) => {
        setTf(val);
        closeAllDropdowns();
      }
    );

    if (pairSelect) {
      pairSelect.addEventListener("click", (e) => {
        e.preventDefault();
        openDropdown(pairDrop);
      });
    }

    if (tfSelect) {
      tfSelect.addEventListener("click", (e) => {
        e.preventDefault();
        openDropdown(tfDrop);
      });
    }

    if (marketBtn) {
      marketBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleMarket();
      });
    }
  }

  // ---------- signal generation ----------
  function randomAcc() {
    // “премиально” выглядит, когда точность не прыгает слишком сильно
    const base = 72 + Math.random() * 18; // 72..90
    return Math.round(base);
  }

  function randomDir() {
    return Math.random() > 0.5 ? "UP" : "DOWN";
  }

  function setSignalUI() {
    if (rPair) rPair.textContent = state.pair;
    if (rTf) rTf.textContent = state.tf;
    if (rAcc) rAcc.textContent = `${state.acc}%`;

    if (rDir) {
      const dot = rDir.querySelector(".dirDot");
      const text = rDir.querySelector(".dirText");
      if (dot) {
        dot.classList.toggle("up", state.dir === "UP");
        dot.classList.toggle("down", state.dir === "DOWN");
      }
      if (text) text.textContent = state.dir === "UP" ? "Вверх" : "Вниз";
    }

    if (rUntil) rUntil.textContent = state.until;
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer(totalSec) {
    stopTimer();

    state.totalSec = totalSec;
    state.leftSec = totalSec;

    const tick = () => {
      state.leftSec -= 0.1; // плавнее полоса
      if (state.leftSec <= 0) {
        state.leftSec = 0;
        stopTimer();
      }

      const p = state.totalSec > 0 ? (state.totalSec - state.leftSec) / state.totalSec : 1;
      const pct = clamp(p * 100, 0, 100);
      if (progressBar) progressBar.style.width = `${pct}%`;

      const leftInt = Math.ceil(state.leftSec);
      if (timerText) timerText.textContent = `${formatMMSS(leftInt)} / ${formatMMSS(state.totalSec)}`;
    };

    tick();
    state.timerId = setInterval(tick, 100);
  }

  function showResult(show) {
    if (!resultPanel) return;
    resultPanel.classList.toggle("hidden", !show);
  }

  function showHint(show) {
    if (!hintText) return;
    hintText.classList.toggle("hidden", !show);
  }

  // ---------- analysis overlay (создаем динамически) ----------
  let analyzeOverlay = null;
  function ensureAnalyzeOverlay() {
    if (analyzeOverlay) return analyzeOverlay;

    analyzeOverlay = document.createElement("div");
    analyzeOverlay.id = "analyzeOverlay";
    analyzeOverlay.className = "hidden";
    analyzeOverlay.innerHTML = `
      <div class="analyzeBox">
        <div class="anTitle">Анализ рынка</div>
        <div class="anSub">Сканируем ликвидность • волатильность • импульс</div>
        <div class="scanLine"></div>
        <div class="anSteps">
          <div class="step" data-step="1"><span class="dot"></span><span>Сбор данных</span></div>
          <div class="step" data-step="2"><span class="dot"></span><span>Фильтрация шума</span></div>
          <div class="step" data-step="3"><span class="dot"></span><span>Построение вероятности</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(analyzeOverlay);
    return analyzeOverlay;
  }

  function setAnalyzing(on) {
    const el = ensureAnalyzeOverlay();
    state.analyzing = on;
    el.classList.toggle("hidden", !on);

    // “затемнение” — это просто backdrop
    showBackdrop(on);

    // блокируем клики по контролам во время анализа
    document.body.classList.toggle("isAnalyzing", on);

    if (on) {
      // сброс подсветки шагов
      el.querySelectorAll(".step").forEach((s) => s.classList.remove("done", "active"));
      const steps = [...el.querySelectorAll(".step")];

      // красивая последовательность
      const seq = [0, 1, 2];
      seq.forEach((idx, i) => {
        setTimeout(() => {
          steps.forEach((s) => s.classList.remove("active"));
          steps[idx].classList.add("active");
          if (i > 0) steps[seq[i - 1]].classList.add("done");
          if (i === seq.length - 1) steps[idx].classList.add("done");
        }, i * 420);
      });
    }
  }

  async function generateSignal() {
    if (state.analyzing) return;

    // показать анализ ~1.4s
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1400));
    setAnalyzing(false);

    state.dir = randomDir();
    state.acc = randomAcc();

    const until = new Date(Date.now() + state.tfSec * 1000);
    state.until = formatTimeHHMM(until);

    setSignalUI();
    showHint(false);
    showResult(true);

    startTimer(state.tfSec);

    // обновить график под выбранную пару/рынок
    renderChart(state.pair, state.market);
  }

  function resetSignal() {
    stopTimer();
    showResult(false);
    showHint(true);

    if (progressBar) progressBar.style.width = "0%";
    if (timerText) timerText.textContent = `${formatMMSS(state.tfSec)} / ${formatMMSS(state.tfSec)}`;
  }

  // buttons
  if (btnGenerate) btnGenerate.addEventListener("click", generateSignal);
  if (btnGenerate2) btnGenerate2.addEventListener("click", generateSignal);
  if (btnReset) btnReset.addEventListener("click", resetSignal);

  // close dropdowns on Esc
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllDropdowns();
  });

  // ---------- chart (Lightweight Charts) ----------
  let chart = null;
  let candleSeries = null;

  function ensureChart() {
    if (chart) return true;
    const host = $("chart");
    if (!host) return false;

    if (!window.LightweightCharts) {
      // библиотека не подключена — не ломаем приложение
      host.innerHTML =
        `<div style="opacity:.75;font-size:12px;padding:12px;text-align:center;">
          График: подключи Lightweight Charts в index.html
        </div>`;
      return false;
    }

    // очистим контейнер
    host.innerHTML = "";

    chart = window.LightweightCharts.createChart(host, {
      layout: {
        background: { type: "solid", color: "transparent" },
        textColor: "rgba(255,255,255,0.82)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        vertLine: { color: "rgba(124,160,255,0.35)" },
        horzLine: { color: "rgba(124,160,255,0.35)" },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, pinch: true, mouseWheel: false },
    });

    candleSeries = chart.addCandlestickSeries({
      upColor: "rgba(64, 200, 120, 1)",
      downColor: "rgba(255, 90, 120, 1)",
      borderDownColor: "rgba(255, 90, 120, 1)",
      borderUpColor: "rgba(64, 200, 120, 1)",
      wickDownColor: "rgba(255, 90, 120, 1)",
      wickUpColor: "rgba(64, 200, 120, 1)",
    });

    // адаптация размера
    const ro = new ResizeObserver(() => {
      const rect = host.getBoundingClientRect();
      chart.applyOptions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    });
    ro.observe(host);

    return true;
  }

  function mockCandles() {
    // генерим “реалистичные” свечи (демо)
    const count = 60;
    const now = Math.floor(Date.now() / 1000);
    let t = now - count * 60;

    // разные базовые цены для разных пар
    const baseMap = {
      "EUR/USD": 1.085,
      "GBP/USD": 1.265,
      "USD/JPY": 148.2,
      "EUR/JPY": 161.0,
      "AUD/USD": 0.655,
      "USD/CHF": 0.895,
      "BTC/USD": 52000,
      "ETH/USD": 2800,
    };
    let price = baseMap[state.pair] ?? 1.08;

    const vol = state.market === "OTC" ? 1.3 : 1.0;
    const k = state.pair.includes("BTC") || state.pair.includes("ETH") ? 0.0035 : 0.0008;

    const data = [];
    for (let i = 0; i < count; i++) {
      const open = price;
      const delta = (Math.random() - 0.5) * k * vol;
      const close = open * (1 + delta);
      const high = Math.max(open, close) * (1 + Math.random() * k * 0.8);
      const low = Math.min(open, close) * (1 - Math.random() * k * 0.8);

      data.push({ time: t, open, high, low, close });
      t += 60;
      price = close;
    }
    return data;
  }

  function renderChart(pair, market) {
    const ok = ensureChart();
    const meta = $("chartMeta");
    if (meta) meta.textContent = `${pair} • ${market}`;

    if (!ok || !candleSeries) return;

    candleSeries.setData(mockCandles());
    chart.timeScale().fitContent();
  }

  // ---------- init ----------
  function boot() {
    initControls();

    // показать исходные состояния
    showHint(true);
    showResult(false);

    // чтобы таймер сразу выглядел аккуратно
    if (timerText) timerText.textContent = `${formatMMSS(state.tfSec)} / ${formatMMSS(state.tfSec)}`;
    if (progressBar) progressBar.style.width = "0%";

    // первый рендер графика, если контейнер есть
    renderChart(state.pair, state.market);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
