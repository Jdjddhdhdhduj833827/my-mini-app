const tg = window.Telegram?.WebApp;

function setActiveTab(tabId) {
  document.querySelectorAll(".tab").forEach((b) => {
    b.classList.toggle("tab--active", b.dataset.tab === tabId);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("panel--active", p.id === tabId);
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadData() {
  // не кешируем, чтобы обновления json сразу подтягивались
  const res = await fetch("./data/setups.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Cannot load setups.json");
  return await res.json();
}

function renderSetups(items) {
  const list = document.getElementById("setupsList");
  list.innerHTML = "";

  (items || []).forEach((s) => {
    const el = document.createElement("div");
    el.className = "setup";
    el.innerHTML = `
      <div class="setup__head">
        <div class="setup__title">${escapeHtml(s.title || "Сетап")}</div>
        <div class="badge">${escapeHtml(s.asset || "—")} • ${escapeHtml(s.timeframe || "—")}</div>
      </div>
      <div class="setup__meta">${escapeHtml(s.bias || "Контекст не задан")}</div>

      <div class="setup__block">
        <div class="setup__label">Условия</div>
        <div class="setup__text">${escapeHtml(s.conditions || "")}</div>
      </div>

      ${
        s.invalidation
          ? `<div class="setup__block">
              <div class="setup__label">Инвалидация</div>
              <div class="setup__text">${escapeHtml(s.invalidation)}</div>
            </div>`
          : ""
      }

      ${
        s.risk
          ? `<div class="setup__block">
              <div class="setup__label">Риск-план</div>
              <div class="setup__text">${escapeHtml(s.risk)}</div>
            </div>`
          : ""
      }
    `;
    list.appendChild(el);
  });
}

function applyTelegramTheme() {
  if (!tg) return;
  tg.ready();
  tg.expand();

  const t = tg.themeParams || {};
  document.documentElement.style.setProperty("--bg", t.bg_color || "#0b0f1a");
  document.documentElement.style.setProperty("--text", t.text_color || "#e5e7eb");
  document.documentElement.style.setProperty("--accent", t.button_color || "#3390ec");
}

function fillProfile() {
  if (!tg) return;
  const u = tg.initDataUnsafe?.user;
  if (!u) return;

  const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
  document.getElementById("pName").textContent = name || "Пользователь";
  document.getElementById("pUser").textContent = u.username ? `@${u.username}` : `id: ${u.id}`;

  const letter = (u.first_name || u.username || "U").slice(0, 1).toUpperCase();
  document.getElementById("avatar").textContent = letter;
}

function setThemeMode(mode) {
  // mode: "dark" | "light"
  if (mode === "light") {
    document.documentElement.style.setProperty("--bg", "#ffffff");
    document.documentElement.style.setProperty("--card", "#f3f4f6");
    document.documentElement.style.setProperty("--text", "#0b1220");
    document.documentElement.style.setProperty("--muted", "#4b5563");
    document.documentElement.style.setProperty("--border", "rgba(0,0,0,.08)");
    document.documentElement.style.setProperty("--accent", "#3390ec");
  } else {
    document.documentElement.style.setProperty("--bg", "#0b0f1a");
    document.documentElement.style.setProperty("--card", "#111827");
    document.documentElement.style.setProperty("--text", "#e5e7eb");
    document.documentElement.style.setProperty("--muted", "#9ca3af");
    document.documentElement.style.setProperty("--border", "rgba(255,255,255,.08)");
    document.documentElement.style.setProperty("--accent", "#3390ec");
  }
  localStorage.setItem("themeMode", mode);
}

function initClicks() {
  // Табы
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
  });

  // Быстрые действия
  document.getElementById("goSetups")?.addEventListener("click", () => setActiveTab("setups"));
  document.getElementById("goMarket")?.addEventListener("click", () => setActiveTab("market"));

  // Переключатель темы (локальный)
  const btnTheme = document.getElementById("btnTheme");
  btnTheme?.addEventListener("click", () => {
    const cur = localStorage.getItem("themeMode") || "dark";
    setThemeMode(cur === "dark" ? "light" : "dark");
  });
}

async function boot() {
  // 1) клики должны работать даже если данные не загрузились
  initClicks();

  // 2) тема
  const saved = localStorage.getItem("themeMode");
  if (saved) setThemeMode(saved);
  applyTelegramTheme();

  // 3) профиль
  fillProfile();

  // 4) данные
  try {
    const data = await loadData();

    // статистика
    const setupsCount = (data.setups || []).length;
    document.getElementById("statSetups").textContent = String(setupsCount);
    document.getElementById("statUpdated").textContent = data.updated || "—";

    // обзор рынка
    const marketText = data.market?.text || "Обзор не задан.";
    document.getElementById("marketText").textContent = marketText;
    document.getElementById("marketTime").textContent = data.updated ? `обновлено: ${data.updated}` : "—";

    // сетапы
    renderSetups(data.setups || []);
  } catch (e) {
    // Если json/скрипт упал — покажем сообщение
    document.getElementById("statSetups").textContent = "—";
    document.getElementById("statUpdated").textContent = "—";
    document.getElementById("marketText").textContent =
      "Ошибка загрузки данных. Проверь файл data/setups.json и что он валидный JSON.";
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", boot);
