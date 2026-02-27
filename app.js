// app.js
const $ = (id) => document.getElementById(id);

const state = {
  pair: "EUR/USD",
  pairBadge: "🌍",
  tf: "3m",
  market: "OTC",
  timer: null,
  totalSec: 0,
  leftSec: 0,
};

// Данные (можешь расширять)
const PAIRS = [
  { label: "EUR/USD", badge: "🇪🇺🇺🇸" },
  { label: "GBP/USD", badge: "🇬🇧🇺🇸" },
  { label: "USD/JPY", badge: "🇺🇸🇯🇵" },
  { label: "AUD/CAD", badge: "🇦🇺🇨🇦" },
  { label: "AUD/CAD OTC", badge: "🌙" },
  { label: "EUR/USD OTC", badge: "🌙" },
];

const TFS = ["1m", "3m", "5m", "7m", "10m"];

const els = {
  pairSelect: $("pairSelect"),
  pairDrop: $("pairDrop"),
  pairValue: $("pairValue"),
  pairBadge: $("pairBadge"),

  tfSelect: $("tfSelect"),
  tfDrop: $("tfDrop"),
  tfValue: $("tfValue"),

  marketBtn: $("marketBtn"),
  marketValue: $("marketValue"),

  backdrop: $("backdrop"),

  btnGenerate: $("btnGenerate"),
  btnGenerate2: $("btnGenerate2"),
  btnReset: $("btnReset"),

  resultPanel: $("resultPanel"),
  hintText: $("hintText"),

  rPair: $("rPair"),
  rTf: $("rTf"),
  rAcc: $("rAcc"),
  rUntil: $("rUntil"),
  rDir: $("rDir"),
  progressBar: $("progressBar"),
  timerText: $("timerText"),

  btnMenu: $("btnMenu"),
};

// ---------- Dropdown helpers ----------
let opened = null; // "pair" | "tf" | null

function openDropdown(which) {
  closeDropdown();

  opened = which;
  els.backdrop.classList.remove("hidden");
  els.backdrop.classList.add("show");

  if (which === "pair") {
    els.pairDrop.classList.add("open");
  }
  if (which === "tf") {
    els.tfDrop.classList.add("open");
  }
}

function closeDropdown() {
  opened = null;
  els.pairDrop.classList.remove("open");
  els.tfDrop.classList.remove("open");

  els.backdrop.classList.remove("show");
  // оставляем hidden (чтобы не мешал)
  els.backdrop.classList.add("hidden");
}

// ---------- Render dropdown lists ----------
function renderPairs() {
  els.pairDrop.innerHTML = PAIRS.map(
    (p) => `
    <div class="dropItem" data-pair="${p.label}" data-badge="${p.badge}">
      <span class="badge">${p.badge}</span>
      <span style="font-weight:800">${p.label}</span>
    </div>`
  ).join("");

  els.pairDrop.querySelectorAll(".dropItem").forEach((item) => {
    item.addEventListener("click", () => {
      state.pair = item.dataset.pair;
      state.pairBadge = item.dataset.badge || "🌍";
      els.pairValue.textContent = state.pair;
      els.pairBadge.textContent = state.pairBadge;
      closeDropdown();
    });
  });
}

function renderTfs() {
  els.tfDrop.innerHTML = TFS.map(
    (t) => `<div class="dropItem" data-tf="${t}"><span style="font-weight:800">${t}</span></div>`
  ).join("");

  els.tfDrop.querySelectorAll(".dropItem").forEach((item) => {
    item.addEventListener("click", () => {
      state.tf = item.dataset.tf;
      els.tfValue.textContent = state.tf;
      closeDropdown();
    });
  });
}

// ---------- Signal generation (UI demo) ----------
function tfToSeconds(tf) {
  // "3m" -> 180
  const m = parseInt(tf.replace("m", ""), 10);
  return (Number.isFinite(m) ? m : 3) * 60;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function startTimer() {
  stopTimer();
  state.totalSec = tfToSeconds(state.tf);
  state.leftSec = state.totalSec;

  const tick = () => {
    const done = state.totalSec - state.leftSec;
    const pct = Math.min(100, Math.max(0, (done / state.totalSec) * 100));
    els.progressBar.style.width = pct + "%";
    els.timerText.textContent = `${formatMMSS(state.leftSec)} / ${formatMMSS(state.totalSec)}`;

    if (state.leftSec <= 0) {
      stopTimer();
      return;
    }
    state.leftSec -= 1;
  };

  tick();
  state.timer = setInterval(tick, 1000);
}

function generateSignal() {
  closeDropdown();

  // Рандом демо-параметров
  const acc = Math.floor(70 + Math.random() * 16); // 70-85
  const dirUp = Math.random() > 0.5;

  // until time (локально)
  const now = new Date();
  const mins = tfToSeconds(state.tf) / 60;
  const until = new Date(now.getTime() + mins * 60 * 1000);
  const untilText = `${pad2(until.getHours())}:${pad2(until.getMinutes())}`;

  // UI fill
  els.rPair.textContent = state.pair;
  els.rTf.textContent = state.tf;
  els.rAcc.textContent = `${acc}%`;
  els.rUntil.textContent = untilText;

  // direction UI
  const dirText = dirUp ? "Вверх" : "Вниз";
  const dotClass = dirUp ? "dirDot up" : "dirDot down";
  els.rDir.innerHTML = `
    <span class="${dotClass}"></span>
    <span class="dirText">${dirText}</span>
    <span class="dirUntil">до <b id="rUntil">${untilText}</b></span>
  `;

  // show result
  els.resultPanel.classList.remove("hidden");
  startTimer();
}

function resetSignal() {
  closeDropdown();
  stopTimer();
  els.resultPanel.classList.add("hidden");
  els.progressBar.style.width = "0%";
}

// ---------- Bind UI ----------
function bindUI() {
  // открытие dropdown
  els.pairSelect.addEventListener("click", (e) => {
    e.preventDefault();
    openDropdown("pair");
  });

  els.tfSelect.addEventListener("click", (e) => {
    e.preventDefault();
    openDropdown("tf");
  });

  // рынок (простая смена)
  els.marketBtn.addEventListener("click", () => {
    state.market = state.market === "OTC" ? "REAL" : "OTC";
    els.marketValue.textContent = state.market;
    closeDropdown();
  });

  // backdrop закрывает
  els.backdrop.addEventListener("click", () => closeDropdown());

  // esc закрывает
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  // генерация
  els.btnGenerate.addEventListener("click", generateSignal);
  els.btnGenerate2.addEventListener("click", generateSignal);
  els.btnReset.addEventListener("click", resetSignal);

  // меню
  els.btnMenu.addEventListener("click", () => {
    alert("Настройки: скоро добавим (тема/язык/режим).");
  });
}

function boot() {
  // Telegram WebApp (если открыт в Telegram)
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  // initial render
  els.pairValue.textContent = state.pair;
  els.pairBadge.textContent = "🇪🇺🇺🇸";
  state.pairBadge = "🇪🇺🇺🇸";

  els.tfValue.textContent = state.tf;
  els.marketValue.textContent = state.market;

  renderPairs();
  renderTfs();
  bindUI();

  // backdrop изначально не должен блокировать клики
  els.backdrop.classList.add("hidden");
  els.backdrop.classList.remove("show");
}

document.addEventListener("DOMContentLoaded", boot);
