const tg = window.Telegram?.WebApp;

function setActiveTab(tabId){
  document.querySelectorAll(".tab").forEach(b=>{
    b.classList.toggle("tab--active", b.dataset.tab === tabId);
  });
  document.querySelectorAll(".panel").forEach(p=>{
    p.classList.toggle("panel--active", p.id === tabId);
  });
}

async function loadData(){
  const res = await fetch("./data/setups.json", { cache: "no-store" });
  return await res.json();
}

function renderSetups(items){
  const list = document.getElementById("setupsList");
  list.innerHTML = "";

  items.forEach(s=>{
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

      ${s.invalidation ? `
      <div class="setup__block">
        <div class="setup__label">Инвалидация</div>
        <div class="setup__text">${escapeHtml(s.invalidation)}</div>
      </div>` : ""}

      ${s.risk ? `
      <div class="setup__block">
        <div class="setup__label">Риск-план</div>
        <div class="setup__text">${escapeHtml(s.risk)}</div>
      </div>` : ""}
    `;
    list.appendChild(el);
  });
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function applyTelegramTheme(){
  if(!tg) return;
  tg.ready();
  tg.expand();

  const t = tg.themeParams || {};
  // Подхват цветов Telegram (если есть)
  document.documentElement.style.setProperty("--bg", t.bg_color || "#0b0f1a");
  document.documentElement.style.setProperty("--text", t.text_color || "#e5e7eb");
  document.documentElement.style.setProperty("--accent", t.button_color || "#3390ec");
}

function fillProfile(){
  if(!tg) return;
  const u = tg.initDataUnsafe?.user;
  if(!u) return;

  document.getElementById("pName").textContent = [u.first_name, u.last_name].filter(Boolean).join(" ");
