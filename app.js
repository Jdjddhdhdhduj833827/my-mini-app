/* ============================================================
   LUXE TRADING TERMINAL • app.js (Telegram Mini App + Web)
   ------------------------------------------------------------
   ✅ Builds UI automatically into <body> (no fragile HTML)
   ✅ Gate + Registration link + Enter
   ✅ Premium Terminal: Dashboard / Watchlist / Risk / Journal / Alerts / Settings
   ✅ Command Palette (Ctrl/Cmd+K), hotkeys, toasts, haptics
   ✅ Export/Import state, offline storage, performance-safe animations
   ✅ Works in Telegram Mini App + normal browser fallback
   ------------------------------------------------------------
   IMPORTANT:
   - This is a demo "assistant terminal UI". Real quotes/signals require backend.
   ============================================================ */

(() => {
  'use strict';

  /* =========================
     0) CONFIG (EDIT THIS)
  ========================== */
  const REG_URL = 'https://EXAMPLE.com/register'; // <-- ВСТАВЬ СЮДА СВОЮ РЕФ/ССЫЛКУ РЕГИСТРАЦИИ
  const APP_NAME = 'CRAFT ANALYTICS';
  const APP_TAGLINE = 'Premium Trading Intelligence Terminal';
  const STORAGE_KEY = 'craft_terminal_v2';

  /* =========================
     1) TELEGRAM BRIDGE
  ========================== */
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  const isTelegram = !!tg;

  function tgReady() {
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
    } catch {}
  }

  function openLink(url) {
    if (!url) return;
    try {
      if (tg && tg.openLink) tg.openLink(url);
      else window.open(url, '_blank', 'noopener');
    } catch {
      window.location.href = url;
    }
  }

  function haptic(type = 'selection', style = 'medium') {
    if (!tg || !tg.HapticFeedback) return;
    try {
      if (type === 'selection') tg.HapticFeedback.selectionChanged();
      if (type === 'impact') tg.HapticFeedback.impactOccurred(style); // light|medium|heavy|rigid|soft
      if (type === 'notify') tg.HapticFeedback.notificationOccurred(style); // success|warning|error
    } catch {}
  }

  /* =========================
     2) HELPERS
  ========================== */
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pad2 = (n) => String(n).padStart(2, '0');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function safeJSONParse(s, fallback = null) {
    try { return JSON.parse(s); } catch { return fallback; }
  }

  function nowISO() { return new Date().toISOString(); }
  function nowHHMM() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  // stable demo randomness based on string seed
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* =========================
     3) STATE (offline-first)
  ========================== */
  const state = {
    registered: false,
    theme: 'dark', // dark|ink|light (visual presets)
    lang: 'ru',
    market: 'OTC',
    asset: 'EUR/USD',
    tf: '30s',

    watchlist: [
      { sym: 'EUR/USD', cat: 'FX' },
      { sym: 'BTC/USD', cat: 'CRYPTO' },
      { sym: 'Gold', cat: 'COM' },
    ],

    alerts: [
      // { id, sym, type: 'price', condition: 'above', value: 123.45, enabled: true }
    ],

    journal: [
      // { id, ts, sym, tf, dir, riskPct, notes, outcome }
    ],

    presets: [
      { id: 'p1', name: 'Scalp 30s', asset: 'EUR/USD', tf: '30s', market: 'OTC' },
      { id: 'p2', name: 'Swing 5m', asset: 'BTC/USD', tf: '5m', market: 'LIVE' },
    ],

    lastScan: null, // { ts, sym, tf, market, confidence, bias, factors }
  };

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = safeJSONParse(raw, null);
    if (!data) return;
    // soft-merge
    Object.assign(state, data);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* =========================
     4) TEXTS
  ========================== */
  const STR = {
    ru: {
      gateTitle: 'Доступ к терминалу',
      gateText:
        'Это премиальный демо-терминал. Для активации доступа откройте регистрацию по ссылке и вернитесь сюда.',
      openReg: 'Открыть регистрацию',
      iRegistered: 'Я зарегистрировался',
      enter: 'Открыть терминал',

      tabs: {
        dash: 'Обзор',
        watch: 'Watchlist',
        risk: 'Risk',
        journal: 'Journal',
        alerts: 'Alerts',
        settings: 'Настройки',
      },

      scan: 'Запустить скан',
      scanning: 'Сканирование микросигналов…',
      ready: 'Готово',
      reset: 'Сброс',
      export: 'Экспорт',
      import: 'Импорт',
      copy: 'Копировать',
      savePreset: 'Сохранить пресет',
      applyPreset: 'Применить',
      add: 'Добавить',
      remove: 'Удалить',
      enable: 'Вкл',
      disable: 'Выкл',
      ok: 'Ок',
      cancel: 'Отмена',

      toastCopied: 'Скопировано',
      toastExported: 'Экспорт готов',
      toastImported: 'Импорт выполнен',
      toastSaved: 'Сохранено',
      toastNeedCheck: 'Поставь галочку “Я зарегистрировался”',
    },
    en: {
      gateTitle: 'Access gate',
      gateText:
        'Premium demo terminal. Open registration link and return here to enter.',
      openReg: 'Open registration',
      iRegistered: "I'm registered",
      enter: 'Enter terminal',

      tabs: {
        dash: 'Dashboard',
        watch: 'Watchlist',
        risk: 'Risk',
        journal: 'Journal',
        alerts: 'Alerts',
        settings: 'Settings',
      },

      scan: 'Run scan',
      scanning: 'Scanning micro-signals…',
      ready: 'Ready',
      reset: 'Reset',
      export: 'Export',
      import: 'Import',
      copy: 'Copy',
      savePreset: 'Save preset',
      applyPreset: 'Apply',
      add: 'Add',
      remove: 'Remove',
      enable: 'On',
      disable: 'Off',
      ok: 'OK',
      cancel: 'Cancel',

      toastCopied: 'Copied',
      toastExported: 'Export ready',
      toastImported: 'Import done',
      toastSaved: 'Saved',
      toastNeedCheck: 'Check “I’m registered” first',
    },
  };

  function t(path) {
    const pack = STR[state.lang] || STR.ru;
    const parts = path.split('.');
    let cur = pack;
    for (const p of parts) cur = cur?.[p];
    return cur ?? path;
  }

  /* =========================
     5) CSS (premium, not “space”, but elite)
     - Injected to avoid fragile external file issues
  ========================== */
  function injectCSS() {
    const css = `
:root{
  --bg0:#070913;
  --bg1:#0A0D18;
  --panel:rgba(255,255,255,.06);
  --panel2:rgba(255,255,255,.08);
  --stroke:rgba(255,255,255,.10);
  --stroke2:rgba(255,255,255,.16);
  --txt:rgba(255,255,255,.92);
  --muted:rgba(255,255,255,.62);
  --muted2:rgba(255,255,255,.44);

  --acc:#7C5CFF;
  --acc2:#00B2FF;
  --good:#78FFB4;
  --bad:#FF5A6E;
  --warn:#FFCC66;

  --r:18px;
  --r2:14px;
  --r3:22px;

  --shadowH: 0 28px 90px rgba(0,0,0,.56);
  --shadow: 0 18px 60px rgba(0,0,0,.42);
  --shadowS: 0 12px 36px rgba(0,0,0,.28);

  --ease: cubic-bezier(.2,.9,.2,1);
  --font: ui-sans-serif, -apple-system, system-ui, Segoe UI, Roboto, Arial;
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  font-family:var(--font);
  color:var(--txt);
  background:
    radial-gradient(1200px 900px at 18% 8%, rgba(124,92,255,.12), transparent 60%),
    radial-gradient(900px 700px at 78% 22%, rgba(0,178,255,.10), transparent 55%),
    linear-gradient(180deg, var(--bg0), var(--bg1));
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}

a{ color:inherit; text-decoration:none; }
button{ font-family:inherit; }
*{ -webkit-tap-highlight-color: transparent; }

.bg{
  position:fixed; inset:0; z-index:-5; pointer-events:none;
}
.bg::before{
  content:"";
  position:absolute; inset:-30%;
  background:
    radial-gradient(circle at 28% 18%, rgba(124,92,255,.16), transparent 55%),
    radial-gradient(circle at 78% 22%, rgba(0,178,255,.10), transparent 58%),
    radial-gradient(circle at 50% 92%, rgba(120,255,180,.06), transparent 62%);
  filter: blur(60px) saturate(1.06);
  opacity:.95;
}
.bg::after{
  content:"";
  position:absolute; inset:0;
  opacity:.18;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 22px),
    repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 26px);
  mask-image: radial-gradient(circle at 50% 35%, rgba(0,0,0,1) 0 60%, rgba(0,0,0,0) 88%);
}

.wrap{
  min-height:100vh;
  display:flex;
  flex-direction:column;
}

.topbar{
  position:sticky; top:0; z-index:50;
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px;
  background: linear-gradient(180deg, rgba(7,9,19,.92), rgba(7,9,19,.18));
  backdrop-filter: blur(18px);
  border-bottom:1px solid rgba(255,255,255,.06);
}

.brand{
  display:flex; gap:10px; align-items:center;
}
.logo{
  width:42px; height:42px; border-radius:16px;
  display:grid; place-items:center;
  font-weight:1000; letter-spacing:.08em;
  background: linear-gradient(135deg, rgba(124,92,255,.98), rgba(0,178,255,.60));
  box-shadow: 0 20px 70px rgba(124,92,255,.22), 0 10px 38px rgba(0,178,255,.12);
  position:relative; overflow:hidden;
}
.logo::after{
  content:"";
  position:absolute; inset:-70%;
  background:linear-gradient(120deg, transparent 44%, rgba(255,255,255,.16), transparent 64%);
  transform:translateX(-70%) rotate(10deg);
  animation:sweep 3.0s linear infinite;
  pointer-events:none;
  opacity:.75;
}
@keyframes sweep{
  0%{ transform:translateX(-70%) rotate(10deg); }
  100%{ transform:translateX(70%) rotate(10deg); }
}
.brandText{ display:flex; flex-direction:column; line-height:1.1; }
.brandName{ font-weight:1000; letter-spacing:.14em; font-size:12px; text-transform:uppercase; }
.brandSub{ font-size:12px; color:var(--muted); margin-top:4px; }

.tbActions{ display:flex; gap:10px; }
.iconBtn{
  height:38px; min-width:38px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.06);
  color:var(--txt);
  cursor:pointer;
  box-shadow:0 10px 26px rgba(0,0,0,.22);
  transition: transform .12s var(--ease), background .16s ease, border-color .16s ease;
}
.iconBtn:hover{ background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.18); }
.iconBtn:active{ transform: translateY(1px) scale(.99); }

.main{
  padding:16px;
  display:grid;
  gap:14px;
  grid-template-columns: 1fr;
}

.panel{
  background: linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.055));
  border:1px solid var(--stroke);
  border-radius:var(--r3);
  padding:16px;
  box-shadow:var(--shadow);
  backdrop-filter: blur(18px);
  position:relative;
  overflow:hidden;
}
.panel::before{
  content:"";
  position:absolute; inset:0;
  pointer-events:none;
  opacity:.28;
  background:
    radial-gradient(circle at 12% -10%, rgba(124,92,255,.22), transparent 55%),
    radial-gradient(circle at 92% 18%, rgba(0,178,255,.14), transparent 60%);
}
.panelHead{
  display:flex; align-items:center; justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
}
.panelTitle{
  font-weight:1000;
  letter-spacing:.18em;
  font-size:12px;
  color:rgba(255,255,255,.86);
  text-transform:uppercase;
}
.badge{
  padding:7px 10px;
  border-radius:999px;
  font-weight:1000;
  letter-spacing:.18em;
  font-size:11px;
  background:linear-gradient(90deg, rgba(124,92,255,.18), rgba(0,178,255,.12));
  border:1px solid rgba(255,255,255,.14);
  color:rgba(255,255,255,.92);
}

.row{ display:flex; gap:10px; flex-wrap:wrap; }
.select{
  flex:1;
  min-width: 160px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:12px 12px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.11);
  background:rgba(255,255,255,.055);
  color:var(--txt);
  cursor:pointer;
  box-shadow: 0 10px 26px rgba(0,0,0,.22);
  transition: transform .12s var(--ease), background .18s var(--ease), border-color .18s var(--ease);
}
.select:hover{ background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.18); }
.select:active{ transform:translateY(1px) scale(.995); }
.selLeft{ display:flex; align-items:center; gap:10px; }
.selIcon{
  width:28px; height:28px; border-radius:12px;
  display:grid; place-items:center;
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.10);
}
.selValue{ font-weight:1000; letter-spacing:.04em; }
.chev{ color:var(--muted2); }

.actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
.btn{
  border-radius:18px;
  border:1px solid rgba(255,255,255,.12);
  padding:13px 14px;
  font-weight:1000;
  letter-spacing:.16em;
  color:rgba(255,255,255,.92);
  background:rgba(255,255,255,.06);
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  box-shadow: 0 16px 46px rgba(0,0,0,.30);
  transition: transform .12s var(--ease), background .18s var(--ease), border-color .18s var(--ease);
  user-select:none;
  opacity: 1 !important;
}
.btn:hover{ background:rgba(255,255,255,.085); border-color:rgba(255,255,255,.20); }
.btn:active{ transform: translateY(1px) scale(.995); }
.btnPrimary{
  background: linear-gradient(135deg, rgba(124,92,255,.96), rgba(0,178,255,.62));
  border-color: rgba(255,255,255,.16);
  box-shadow: 0 20px 70px rgba(124,92,255,.22), 0 10px 38px rgba(0,178,255,.12);
}
.btnWide{ width:100%; }

.tabs{
  display:flex;
  gap:8px;
  overflow:auto;
  -webkit-overflow-scrolling:touch;
  padding-bottom:6px;
  margin-bottom:10px;
}
.tab{
  padding:8px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.10);
  background:rgba(255,255,255,.06);
  color:var(--muted);
  font-weight:1000;
  letter-spacing:.12em;
  font-size:11px;
  cursor:pointer;
  white-space:nowrap;
  transition: background .18s var(--ease), border-color .18s var(--ease), transform .12s var(--ease);
}
.tab:hover{ background:rgba(255,255,255,.085); border-color:rgba(255,255,255,.16); }
.tab:active{ transform: translateY(1px) scale(.99); }
.tab.active{
  background:linear-gradient(135deg, rgba(124,92,255,.38), rgba(0,178,255,.14));
  color:rgba(255,255,255,.92);
  border-color:rgba(255,255,255,.18);
}

.grid{
  display:grid;
  grid-template-columns: 1fr;
  gap:10px;
}
.card{
  border:1px solid rgba(255,255,255,.10);
  background:rgba(255,255,255,.05);
  border-radius:16px;
  padding:10px 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,.22);
  position:relative;
  overflow:hidden;
}
.label{
  color:var(--muted2);
  font-size:12px;
  letter-spacing:.12em;
  font-weight:1000;
  text-transform:uppercase;
}
.value{
  font-weight:1000;
  letter-spacing:.10em;
  margin-top:6px;
}
.value.big{ font-size:18px; }

.sep{ height:1px; background:rgba(255,255,255,.08); margin:12px 0; }

.toastHost{
  position:fixed;
  left:0; right:0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
  z-index:9999;
  display:grid;
  place-items:center;
  pointer-events:none;
}
.toast{
  pointer-events:none;
  padding:10px 12px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.14);
  color:rgba(255,255,255,.92);
  font-weight:1000;
  letter-spacing:.08em;
  box-shadow:0 18px 44px rgba(0,0,0,.32);
  transform: translateY(8px) scale(.98);
  opacity:0;
  transition:opacity .18s ease, transform .18s ease;
}

.modalBackdrop{
  position:fixed; inset:0;
  background:rgba(0,0,0,.46);
  backdrop-filter: blur(12px);
  z-index:2000;
}
.modal{
  position:fixed;
  left:50%;
  top:50%;
  transform: translate(-50%,-50%);
  width:min(640px, calc(100% - 26px));
  max-height:min(78vh, 760px);
  overflow:hidden;
  border-radius:20px;
  border:1px solid rgba(255,255,255,.12);
  background:linear-gradient(180deg, rgba(255,255,255,.11), rgba(255,255,255,.06));
  box-shadow:var(--shadowH);
  z-index:2100;
  backdrop-filter: blur(18px);
}
.modalTop{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:12px 12px;
  border-bottom:1px solid rgba(255,255,255,.08);
}
.modalTitle{
  font-weight:1000;
  letter-spacing:.18em;
  font-size:12px;
  color:rgba(255,255,255,.86);
  text-transform:uppercase;
}
.search{
  width:calc(100% - 24px);
  margin:12px;
  padding:12px 12px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.10);
  background:rgba(0,0,0,.22);
  color:var(--txt);
  outline:none;
}
.search::placeholder{ color:rgba(255,255,255,.35); }
.list{
  padding:0 12px 14px;
  overflow:auto;
  max-height: calc(78vh - 140px);
  -webkit-overflow-scrolling: touch;
}
.item{
  width:100%;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:12px 12px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.05);
  margin-bottom:8px;
  cursor:pointer;
  transition: background .18s var(--ease), border-color .18s var(--ease), transform .12s var(--ease), box-shadow .2s var(--ease);
  box-shadow: 0 10px 24px rgba(0,0,0,.18);
}
.item:hover{ background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.14); box-shadow:0 14px 34px rgba(0,0,0,.26); }
.item:active{ transform: translateY(1px) scale(.995); }

.liLeft{ display:flex; flex-direction:column; gap:2px; text-align:left; }
.liName{ font-weight:1000; letter-spacing:.06em; }
.liSub{ color:var(--muted2); font-size:12px; letter-spacing:.12em; font-weight:1000; text-transform:uppercase; }
.liTag{ color:rgba(255,255,255,.72); font-weight:1000; letter-spacing:.12em; font-size:11px; }

.gate{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:22px;
}
.gateCard{
  width:min(680px, 100%);
  background: linear-gradient(180deg, rgba(255,255,255,.11), rgba(255,255,255,.06));
  border:1px solid rgba(255,255,255,.14);
  border-radius:24px;
  box-shadow:var(--shadowH);
  padding:22px;
  backdrop-filter: blur(18px);
  position:relative;
  overflow:hidden;
}
.gateCard h1{
  margin:12px 0 8px;
  font-size:22px;
  letter-spacing:.02em;
  text-align:center;
}
.gateCard p{
  margin:0 0 14px;
  color:var(--muted);
  line-height:1.6;
  text-align:center;
}
.checkRow{
  display:flex; gap:10px; align-items:center;
  color:var(--muted);
  user-select:none;
}
.checkRow input{ transform: scale(1.15); }

@media (min-width: 920px){
  .main{ grid-template-columns: 1.05fr .95fr; }
  .panel.span2{ grid-column: 1 / -1; }
  .grid.cols2{ grid-template-columns: repeat(2, 1fr); }
}
@media (prefers-reduced-motion: reduce){
  *{ animation:none !important; transition:none !important; }
}
    `.trim();

    const tag = document.createElement('style');
    tag.setAttribute('data-injected', 'craft-terminal');
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  /* =========================
     6) TOASTS
  ========================== */
  let toastHost = null;
  function ensureToastHost() {
    if (toastHost) return;
    toastHost = document.createElement('div');
    toastHost.className = 'toastHost';
    document.body.appendChild(toastHost);
  }
  function toast(msg, kind = 'info') {
    ensureToastHost();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;

    el.style.background =
      kind === 'ok'
        ? 'linear-gradient(135deg, rgba(120,255,180,.20), rgba(0,178,255,.10))'
        : kind === 'bad'
        ? 'linear-gradient(135deg, rgba(255,90,110,.22), rgba(124,92,255,.10))'
        : kind === 'warn'
        ? 'linear-gradient(135deg, rgba(255,204,102,.18), rgba(0,178,255,.08))'
        : 'linear-gradient(135deg, rgba(124,92,255,.16), rgba(0,178,255,.10))';

    toastHost.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px) scale(.98)';
      setTimeout(() => el.remove(), 220);
    }, 1400);
  }

  /* =========================
     7) MODAL SYSTEM
  ========================== */
  let backdropEl = null;
  let modalEl = null;

  function openModal({ title, bodyHTML, onMount }) {
    closeModal();

    backdropEl = document.createElement('div');
    backdropEl.className = 'modalBackdrop';
    backdropEl.addEventListener('click', closeModal);

    modalEl = document.createElement('section');
    modalEl.className = 'modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.innerHTML = `
      <div class="modalTop">
        <div class="modalTitle">${title}</div>
        <button class="iconBtn" id="mClose" aria-label="Close" type="button">✕</button>
      </div>
      ${bodyHTML}
    `;

    document.body.appendChild(backdropEl);
    document.body.appendChild(modalEl);

    $('#mClose', modalEl).addEventListener('click', closeModal);

    document.addEventListener('keydown', escClose, { once: true });
    function escClose(e) {
      if (e.key === 'Escape') closeModal();
      else document.addEventListener('keydown', escClose, { once: true });
    }

    onMount?.(modalEl);
    haptic('selection');
  }

  function closeModal() {
    backdropEl?.remove();
    modalEl?.remove();
    backdropEl = null;
    modalEl = null;
  }

  /* =========================
     8) UI BUILD (NO fragile HTML)
  ========================== */
  function buildRoot() {
    document.body.innerHTML = `
      <div class="bg" aria-hidden="true"></div>
      <div id="appRoot"></div>
    `;
  }

  function renderGate() {
    const root = $('#appRoot');
    root.innerHTML = `
      <section class="gate">
        <div class="gateCard">
          <div class="brand" style="justify-content:center; margin-bottom:10px;">
            <div class="logo">${APP_NAME.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</div>
            <div class="brandText">
              <div class="brandName">${APP_NAME}</div>
              <div class="brandSub">${APP_TAGLINE}</div>
            </div>
          </div>

          <h1>${t('gateTitle')}</h1>
          <p>${t('gateText')}</p>

          <div class="actions">
            <button class="btn btnPrimary btnWide" id="btnReg" type="button">↗ ${t('openReg')}</button>

            <label class="checkRow" style="margin-top:2px;">
              <input type="checkbox" id="chkReg" ${state.registered ? 'checked' : ''} />
              <span>${t('iRegistered')}</span>
            </label>

            <button class="btn btnWide" id="btnEnter" type="button" ${state.registered ? '' : 'disabled'}>
              ⟡ ${t('enter')}
            </button>
          </div>

          <div class="sep"></div>
          <div class="card">
            <div class="label">DISCLAIMER</div>
            <div class="value" style="font-weight:700; letter-spacing:.02em; color:rgba(255,255,255,.78);">
              Демо-интерфейс. Это не финансовая рекомендация. Реальные котировки/алерты требуют подключения данных.
            </div>
          </div>
        </div>
      </section>
    `;

    $('#btnReg').addEventListener('click', () => {
      haptic('impact', 'light');
      openLink(REG_URL);
    });

    const chk = $('#chkReg');
    const enter = $('#btnEnter');

    chk.addEventListener('change', () => {
      state.registered = chk.checked;
      enter.disabled = !state.registered;
      saveState();
      haptic('selection');
    });

    enter.addEventListener('click', () => {
      if (!state.registered) {
        toast(t('toastNeedCheck'), 'warn');
        haptic('notify', 'warning');
        return;
      }
      haptic('notify', 'success');
      renderTerminal();
    });
  }

  function renderTerminal() {
    const root = $('#appRoot');
    root.innerHTML = `
      <div class="wrap">
        <header class="topbar">
          <div class="brand">
            <div class="logo">${APP_NAME.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</div>
            <div class="brandText">
              <div class="brandName">${APP_NAME}</div>
              <div class="brandSub" id="subLine">${APP_TAGLINE}</div>
            </div>
          </div>
          <div class="tbActions">
            <button class="iconBtn" id="btnLang" type="button" title="Language">🌐</button>
            <button class="iconBtn" id="btnCmd" type="button" title="Command Palette">⌘</button>
            <button class="iconBtn" id="btnMore" type="button" title="Menu">⋯</button>
          </div>
        </header>

        <main class="main">
          <section class="panel span2">
            <div class="panelHead">
              <div class="panelTitle">CONTROL LAYER</div>
              <div class="badge" id="statusBadge">${t('ready').toUpperCase()} • ${nowHHMM()}</div>
            </div>

            <div class="tabs" id="tabs"></div>

            <div class="row">
              <button class="select" id="selAsset" type="button">
                <span class="selLeft">
                  <span class="selIcon">◎</span>
                  <span class="selValue" id="vAsset"></span>
                </span>
                <span class="chev">▾</span>
              </button>

              <button class="select" id="selTf" type="button" style="flex:0 0 auto; min-width:140px;">
                <span class="selLeft">
                  <span class="selIcon">⏱</span>
                  <span class="selValue" id="vTf"></span>
                </span>
                <span class="chev">▾</span>
              </button>

              <button class="select" id="selMarket" type="button" style="flex:0 0 auto; min-width:140px;">
                <span class="selLeft">
                  <span class="selIcon">🌐</span>
                  <span class="selValue" id="vMarket"></span>
                </span>
                <span class="chev">↺</span>
              </button>
            </div>

            <div class="actions">
              <button class="btn btnPrimary" id="btnScan" type="button">⟡ ${t('scan')}</button>
              <button class="btn" id="btnReset" type="button">⟲ ${t('reset')}</button>
              <button class="btn" id="btnExport" type="button">⇪ ${t('export')}</button>
              <button class="btn" id="btnImport" type="button">⤓ ${t('import')}</button>
            </div>
          </section>

          <section class="panel" id="panelLeft"></section>
          <section class="panel" id="panelRight"></section>
        </main>
      </div>
    `;

    // Tabs
    const tabs = [
      { key: 'dash', label: t('tabs.dash') },
      { key: 'watch', label: t('tabs.watch') },
      { key: 'risk', label: t('tabs.risk') },
      { key: 'journal', label: t('tabs.journal') },
      { key: 'alerts', label: t('tabs.alerts') },
      { key: 'settings', label: t('tabs.settings') },
    ];
    let activeTab = 'dash';

    function renderTabs() {
      const el = $('#tabs');
      el.innerHTML = tabs.map(x => `
        <button class="tab ${x.key === activeTab ? 'active' : ''}" data-tab="${x.key}" type="button">${x.label}</button>
      `).join('');
      $$('.tab', el).forEach(b => b.addEventListener('click', () => {
        activeTab = b.dataset.tab;
        haptic('selection');
        renderTabs();
        renderPanels();
      }));
    }

    function setControlsValues() {
      $('#vAsset').textContent = state.asset;
      $('#vTf').textContent = state.tf;
      $('#vMarket').textContent = state.market;
    }

    // Selectors
    $('#selMarket').addEventListener('click', () => {
      state.market = (state.market === 'OTC') ? 'LIVE' : 'OTC';
      saveState();
      setControlsValues();
      toast(`MARKET: ${state.market}`, 'ok');
      haptic('selection');
    });

    $('#selAsset').addEventListener('click', () => openAssetPicker());
    $('#selTf').addEventListener('click', () => openTfPicker());

    // Actions
    $('#btnScan').addEventListener('click', () => runScan());
    $('#btnReset').addEventListener('click', () => {
      state.lastScan = null;
      saveState();
      toast(t('reset'), 'ok');
      haptic('notify', 'success');
      renderPanels();
    });

    $('#btnExport').addEventListener('click', () => doExport());
    $('#btnImport').addEventListener('click', () => doImport());

    $('#btnLang').addEventListener('click', () => {
      state.lang = (state.lang === 'ru') ? 'en' : 'ru';
      saveState();
      haptic('notify', 'success');
      // re-render entire terminal with new strings
      renderTerminal();
    });

    $('#btnCmd').addEventListener('click', () => openCommandPalette(() => {
      renderPanels();
      setControlsValues();
    }));

    $('#btnMore').addEventListener('click', () => openQuickMenu());

    // Render
    renderTabs();
    setControlsValues();
    renderPanels();

    // Hotkeys: Ctrl/Cmd+K palette, R registration, S scan
    bindHotkeys(() => {
      renderPanels();
      setControlsValues();
    });
  }

  /* =========================
     9) PICKERS
  ========================== */
  const ASSET_DB = [
    { cat: 'FX', items: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'EUR/JPY', 'EUR/GBP'] },
    { cat: 'CRYPTO', items: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'BNB/USD'] },
    { cat: 'INDEX', items: ['S&P 500', 'NASDAQ', 'DAX', 'FTSE 100'] },
    { cat: 'COM', items: ['Gold', 'Silver', 'Oil (WTI)'] },
  ];
  const TF_DB = ['5s', '15s', '30s', '1m', '3m', '5m'];

  function openAssetPicker() {
    const tabsHTML = ASSET_DB.map((g, i) => `<button class="tab ${i === 0 ? 'active' : ''}" data-cat="${g.cat}" type="button">${g.cat}</button>`).join('');
    openModal({
      title: 'ASSET SELECTOR',
      bodyHTML: `
        <input class="search" id="q" placeholder="Search…" autocomplete="off" />
        <div class="tabs" id="cats">${tabsHTML}</div>
        <div class="list" id="list"></div>
      `,
      onMount: (m) => {
        let cat = ASSET_DB[0].cat;
        const q = $('#q', m);
        const cats = $('#cats', m);
        const list = $('#list', m);

        const render = () => {
          const query = (q.value || '').trim().toLowerCase();
          const group = ASSET_DB.find(x => x.cat === cat) || ASSET_DB[0];
          let items = group.items;
          if (query) items = items.filter(s => s.toLowerCase().includes(query));

          list.innerHTML = items.map(sym => `
            <button class="item" type="button" data-sym="${sym}">
              <span class="liLeft">
                <span class="liName">${sym}</span>
                <span class="liSub">${cat}</span>
              </span>
              <span class="liTag">SELECT</span>
            </button>
          `).join('');

          $$('.item', list).forEach(btn => btn.addEventListener('click', () => {
            state.asset = btn.dataset.sym;
            saveState();
            haptic('notify', 'success');
            closeModal();
            // update controls live
            const vAsset = $('#vAsset');
            if (vAsset) vAsset.textContent = state.asset;
          }));
        };

        q.addEventListener('input', render);
        $$('.tab', cats).forEach(b => b.addEventListener('click', () => {
          cat = b.dataset.cat;
          $$('.tab', cats).forEach(x => x.classList.toggle('active', x === b));
          haptic('selection');
          render();
        }));

        render();
      }
    });
  }

  function openTfPicker() {
    openModal({
      title: 'TIMEFRAME',
      bodyHTML: `
        <div class="list" id="list"></div>
      `,
      onMount: (m) => {
        const list = $('#list', m);
        list.innerHTML = TF_DB.map(tf => `
          <button class="item" type="button" data-tf="${tf}">
            <span class="liLeft">
              <span class="liName">${tf}</span>
              <span class="liSub">TIMEFRAME</span>
            </span>
            <span class="liTag">SELECT</span>
          </button>
        `).join('');

        $$('.item', list).forEach(btn => btn.addEventListener('click', () => {
          state.tf = btn.dataset.tf;
          saveState();
          haptic('notify', 'success');
          closeModal();
          const vTf = $('#vTf');
          if (vTf) vTf.textContent = state.tf;
        }));
      }
    });
  }

  /* =========================
     10) SCAN ENGINE (demo intelligence)
  ========================== */
  let scanning = false;

  function runScan() {
    if (scanning) return;
    scanning = true;

    const badge = $('#statusBadge');
    badge.textContent = `${t('scanning').toUpperCase()} • ${nowHHMM()}`;
    haptic('impact', 'medium');

    // seeded demo
    const seed = xmur3(`${state.asset}|${state.tf}|${state.market}|${new Date().toDateString()}`)();
    const rnd = mulberry32(seed);

    const steps = [
      'Collecting volatility profile…',
      'Detecting liquidity pockets…',
      'Computing momentum vectors…',
      'Measuring mean-reversion pressure…',
      'Assembling confidence matrix…'
    ];
    let i = 0;

    const tick = () => {
      i++;
      badge.textContent = `${steps[Math.min(i - 1, steps.length - 1)].toUpperCase()} • ${nowHHMM()}`;
      if (i < steps.length) {
        setTimeout(tick, 220 + rnd() * 160);
      } else {
        finish();
      }
    };

    const finish = () => {
      const biasUp = rnd() > 0.48;
      const confidence = Math.round(62 + rnd() * 34);
      const factors = {
        volatility: Math.round(40 + rnd() * 55),
        momentum: Math.round(35 + rnd() * 60),
        strength: Math.round(45 + rnd() * 50),
        liquidity: Math.round(50 + rnd() * 45),
        trapRisk: Math.round(18 + rnd() * 52),
      };

      state.lastScan = {
        ts: Date.now(),
        sym: state.asset,
        tf: state.tf,
        market: state.market,
        confidence,
        bias: biasUp ? 'UP' : 'DOWN',
        factors,
      };

      saveState();
      scanning = false;

      badge.textContent = `${t('ready').toUpperCase()} • ${nowHHMM()}`;
      toast('SCAN READY', 'ok');
      haptic('notify', 'success');
      renderPanels();
    };

    setTimeout(tick, 240);
  }

  /* =========================
     11) PANELS CONTENT (World-level UX structure)
  ========================== */
  function renderPanels() {
    const L = $('#panelLeft');
    const R = $('#panelRight');
    const activeTab = $('.tab.active')?.dataset?.tab || 'dash';

    // Left panel: context (always useful)
    L.innerHTML = leftPanelHTML(activeTab);

    // Right panel: actions & details
    R.innerHTML = rightPanelHTML(activeTab);

    // Bind per-tab events
    bindTabEvents(activeTab);
  }

  function leftPanelHTML(activeTab) {
    if (activeTab === 'watch') return watchlistLeft();
    if (activeTab === 'risk') return riskLeft();
    if (activeTab === 'journal') return journalLeft();
    if (activeTab === 'alerts') return alertsLeft();
    if (activeTab === 'settings') return settingsLeft();
    return dashboardLeft();
  }

  function rightPanelHTML(activeTab) {
    if (activeTab === 'watch') return watchlistRight();
    if (activeTab === 'risk') return riskRight();
    if (activeTab === 'journal') return journalRight();
    if (activeTab === 'alerts') return alertsRight();
    if (activeTab === 'settings') return settingsRight();
    return dashboardRight();
  }

  // DASHBOARD
  function dashboardLeft() {
    const s = state.lastScan;
    const scanCard = s ? `
      <div class="card">
        <div class="label">LAST SCAN</div>
        <div class="value big">${s.sym} • ${s.tf} • ${s.market}</div>
        <div class="sep"></div>
        <div class="grid cols2">
          <div class="card">
            <div class="label">BIAS</div>
            <div class="value big">${s.bias}</div>
          </div>
          <div class="card">
            <div class="label">CONFIDENCE</div>
            <div class="value big">${s.confidence}%</div>
          </div>
        </div>
        <div class="sep"></div>
        <div class="grid cols2">
          ${factorCard('VOLATILITY', s.factors.volatility)}
          ${factorCard('MOMENTUM', s.factors.momentum)}
          ${factorCard('STRENGTH', s.factors.strength)}
          ${factorCard('LIQUIDITY', s.factors.liquidity)}
        </div>
        <div class="sep"></div>
        ${factorCardWide('TRAP RISK', s.factors.trapRisk, 'warn')}
      </div>
    ` : `
      <div class="card">
        <div class="label">WELCOME</div>
        <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78)">
          Запусти скан — и терминал соберёт матрицу факторов. Это демо-интеллект: дальше подключим реальные данные/сервер.
        </div>
      </div>
    `;

    return `
      <div class="panelHead">
        <div class="panelTitle">EXEC SUMMARY</div>
        <div class="badge">ELITE MODE</div>
      </div>
      ${scanCard}
    `;
  }

  function dashboardRight() {
    return `
      <div class="panelHead">
        <div class="panelTitle">ASSISTANT LAYER</div>
        <div class="badge">PRO WORKFLOW</div>
      </div>

      <div class="card">
        <div class="label">SMART CHECKLIST</div>
        <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);line-height:1.55">
          1) Выбери актив / TF / рынок<br/>
          2) Запусти скан (матрица факторов)<br/>
          3) Рассчитай риск (Risk tab)<br/>
          4) Запиши сделку в Journal<br/>
          5) Поставь Alerts (позже подключим реальные триггеры)
        </div>
      </div>

      <div class="sep"></div>

      <div class="card">
        <div class="label">COMMANDS</div>
        <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);line-height:1.55">
          Ctrl/Cmd + K — Command Palette<br/>
          S — Run Scan<br/>
          R — Open Registration
        </div>
      </div>
    `;
  }

  // WATCHLIST
  function watchlistLeft() {
    return `
      <div class="panelHead">
        <div class="panelTitle">WATCHLIST</div>
        <div class="badge">${state.watchlist.length} ITEMS</div>
      </div>

      <div class="list" id="wlList" style="max-height:none; padding:0;">
        ${state.watchlist.map((w, idx) => `
          <button class="item" type="button" data-idx="${idx}">
            <span class="liLeft">
              <span class="liName">${w.sym}</span>
              <span class="liSub">${w.cat}</span>
            </span>
            <span class="liTag">OPEN</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function watchlistRight() {
    return `
      <div class="panelHead">
        <div class="panelTitle">WATCHLIST ACTIONS</div>
        <div class="badge">CURATION</div>
      </div>

      <div class="card">
        <div class="label">ADD SYMBOL</div>
        <div class="value" style="margin-top:10px;">
          <input class="search" id="wlSym" placeholder="Например: ETH/USD" style="margin:0;width:100%;" />
          <div class="row" style="margin-top:10px;">
            <button class="btn btnPrimary" id="wlAdd">＋ ${t('add')}</button>
            <button class="btn" id="wlUseCurrent">◎ USE CURRENT</button>
          </div>
        </div>
      </div>

      <div class="sep"></div>

      <div class="card">
        <div class="label">PRO TIP</div>
        <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);line-height:1.55">
          Watchlist — это “портфель внимания”. Держи 5–12 инструментов максимум. Всё остальное — шум.
        </div>
      </div>
    `;
  }

  // RISK
  function riskLeft() {
    return `
      <div class="panelHead">
        <div class="panelTitle">RISK MANAGER</div>
        <div class="badge">CAPITAL DISCIPLINE</div>
      </div>

      <div class="card">
        <div class="label">INPUTS</div>
        <div class="value" style="margin-top:10px;">
          <input class="search" id="rkBalance" placeholder="Balance ($) например 1000" style="margin:0;width:100%;" />
          <div style="height:10px"></div>
          <input class="search" id="rkRisk" placeholder="Risk % на сделку (например 1)" style="margin:0;width:100%;" />
          <div style="height:10px"></div>
          <input class="search" id="rkStop" placeholder="Stop (в пунктах/%) например 0.5" style="margin:0;width:100%;" />
          <div class="actions" style="margin-top:10px;">
            <button class="btn btnPrimary" id="rkCalc">⟡ CALC</button>
            <button class="btn" id="rkSave">★ ${t('savePreset')}</button>
          </div>
        </div>
      </div>

      <div class="sep"></div>

      <div class="grid cols2" id="rkOut">
        ${factorCard('POSITION', '--')}
        ${factorCard('RISK $', '--')}
        ${factorCard('MAX LOSS', '--')}
        ${factorCard('DISCIPLINE', 'ON')}
      </div>
    `;
  }

  function riskRight() {
    return `
      <div class="panelHead">
        <div class="panelTitle">RISK RULESET</div>
        <div class="badge">ELITE</div>
      </div>

      <div class="card">
        <div class="label">RULES</div>
        <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);line-height:1.55">
          • Риск на сделку: 0.5–2%<br/>
          • 3 убыточные подряд → пауза<br/>
          • Никогда не увеличивай риск “чтобы отыграться”<br/>
          • Журнал обязателен
        </div>
      </div>
    `;
  }

  // JOURNAL
  function journalLeft() {
    const items = [...state.journal].slice(-10).reverse();
    return `
      <div class="panelHead">
        <div class="panelTitle">JOURNAL</div>
        <div class="badge">${state.journal.length} TRADES</div>
      </div>

      <div class="list" id="jrList" style="max-height:none; padding:0;">
        ${items.length ? items.map(j => `
          <button class="item" type="button" data-id="${j.id}">
            <span class="liLeft">
              <span class="liName">${j.sym} • ${j.tf} • ${j.dir}</span>
              <span class="liSub">${new Date(j.ts).toLocaleString()}</span>
            </span>
            <span class="liTag">${j.outcome || 'OPEN'}</span>
          </button>
        `).join('') : `
          <div class="card">
            <div class="label">EMPTY</div>
            <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);">
              Добавь первую запись — так и строится проф уровень.
            </div>
          </div>
        `}
      </div>
    `;
  }

  function journalRight() {
    return `
      <div class="panelHead">
        <div class="panelTitle">NEW ENTRY</div>
        <div class="badge">DISCIPLINE</div>
      </div>

      <div class="card">
        <div class="label">TRADE</div>
        <div class="value" style="margin-top:10px;">
          <div class="row">
            <button class="select" id="jrUseCurrent" type="button" style="min-width:200px;">
              <span class="selLeft">
                <span class="selIcon">◎</span>
                <span class="selValue">Use current (${state.asset}, ${state.tf})</span>
              </span>
              <span class="chev">→</span>
            </button>
          </div>
          <div style="height:10px"></div>
          <input class="search" id="jrNotes" placeholder="Notes (why, setup, rule)..." style="margin:0;width:100%;" />
          <div style="height:10px"></div>
          <div class="row">
            <button class="btn btnPrimary" id="jrAddUp">＋ UP</button>
            <button class="btn btnPrimary" id="jrAddDown">＋ DOWN</button>
            <button class="btn" id="jrWin">WIN</button>
            <button class="btn" id="jrLoss">LOSS</button>
          </div>
        </div>
      </div>
    `;
  }

  // ALERTS
  function alertsLeft() {
    return `
      <div class="panelHead">
        <div class="panelTitle">ALERTS</div>
        <div class="badge">${state.alerts.length} RULES</div>
      </div>

      ${state.alerts.length ? `
        <div class="list" id="alList" style="max-height:none; padding:0;">
          ${state.alerts.map(a => `
            <div class="card" style="margin-bottom:10px;">
              <div class="label">${a.sym}</div>
              <div class="value">${a.condition.toUpperCase()} ${a.value}</div>
              <div class="actions">
                <button class="btn" data-act="toggle" data-id="${a.id}">
                  ${a.enabled ? t('disable') : t('enable')}
                </button>
                <button class="btn" data-act="remove" data-id="${a.id}">
                  ${t('remove')}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="card">
          <div class="label">EMPTY</div>
          <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);">
            Добавь правило. Позже подключим реальные котировки — и алерты станут настоящими.
          </div>
        </div>
      `}
    `;
  }

  function alertsRight() {
    return `
      <div class="panelHead">
        <div class="panelTitle">NEW ALERT</div>
        <div class="badge">AUTOMATION</div>
      </div>

      <div class="card">
        <div class="label">RULE</div>
        <div class="value" style="margin-top:10px;">
          <input class="search" id="alSym" placeholder="Symbol (например EUR/USD)" style="margin:0;width:100%;" />
          <div style="height:10px"></div>
          <div class="row">
            <button class="btn" id="alAbove">ABOVE</button>
            <button class="btn" id="alBelow">BELOW</button>
          </div>
          <div style="height:10px"></div>
          <input class="search" id="alVal" placeholder="Value (например 1.0890)" style="margin:0;width:100%;" />
          <div class="actions" style="margin-top:10px;">
            <button class="btn btnPrimary" id="alAdd">＋ ${t('add')}</button>
            <button class="btn" id="alUseCurrent">◎ USE CURRENT</button>
          </div>
        </div>
      </div>
    `;
  }

  // SETTINGS
  function settingsLeft() {
    return `
      <div class="panelHead">
        <div class="panelTitle">SETTINGS</div>
        <div class="badge">CONTROL</div>
      </div>

      <div class="card">
        <div class="label">PREFERENCES</div>
        <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);line-height:1.55">
          Language: <b>${state.lang.toUpperCase()}</b><br/>
          Theme: <b>${state.theme}</b><br/>
          Registered: <b>${state.registered ? 'YES' : 'NO'}</b>
        </div>
      </div>

      <div class="sep"></div>

      <div class="card">
        <div class="label">SECURITY NOTE</div>
        <div class="value" style="letter-spacing:.02em;font-weight:750;color:rgba(255,255,255,.78);line-height:1.55">
          На GitHub Pages это фронт. Если добавим “ум” (котировки/сигналы) — делаем сервер и проверку доступа.
        </div>
      </div>
    `;
  }

  function settingsRight() {
    return `
      <div class="panelHead">
        <div class="panelTitle">TOOLS</div>
        <div class="badge">ADMIN</div>
      </div>

      <div class="card">
        <div class="label">DATA</div>
        <div class="actions" style="margin-top:10px;">
          <button class="btn btnPrimary" id="stExport">⇪ ${t('export')}</button>
          <button class="btn" id="stImport">⤓ ${t('import')}</button>
          <button class="btn" id="stWipe">⟲ WIPE</button>
        </div>
      </div>

      <div class="sep"></div>

      <div class="card">
        <div class="label">REGISTRATION</div>
        <div class="actions" style="margin-top:10px;">
          <button class="btn btnPrimary" id="stReg">↗ ${t('openReg')}</button>
          <button class="btn" id="stBackGate">⟵ GATE</button>
        </div>
      </div>
    `;
  }

  /* =========================
     12) UI HELPERS (cards)
  ========================== */
  function factorCard(label, val) {
    return `
      <div class="card">
        <div class="label">${label}</div>
        <div class="value big">${val}%</div>
      </div>
    `.replace('%', (val === '--' ? '' : '%'));
  }
  function factorCardWide(label, val, tone = 'ok') {
    const color =
      tone === 'warn' ? 'rgba(255,204,102,.88)' :
      tone === 'bad' ? 'rgba(255,90,110,.88)' :
      'rgba(120,255,180,.88)';
    return `
      <div class="card">
        <div class="label">${label}</div>
        <div class="value big" style="color:${color}">${val}%</div>
      </div>
    `;
  }

  /* =========================
     13) TAB EVENTS
  ========================== */
  function bindTabEvents(tab) {
    if (tab === 'watch') {
      const add = $('#wlAdd');
      const useCur = $('#wlUseCurrent');
      const input = $('#wlSym');
      const wlList = $('#wlList');

      wlList?.querySelectorAll('.item')?.forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.idx);
          const item = state.watchlist[idx];
          state.asset = item.sym;
          saveState();
          $('#vAsset').textContent = state.asset;
          toast(`SET: ${item.sym}`, 'ok');
          haptic('notify', 'success');
        });
      });

      useCur?.addEventListener('click', () => {
        input.value = state.asset;
        haptic('selection');
      });

      add?.addEventListener('click', () => {
        const sym = (input.value || '').trim();
        if (!sym) return;
        state.watchlist.push({ sym, cat: guessCat(sym) });
        saveState();
        toast(t('toastSaved'), 'ok');
        haptic('notify', 'success');
        renderPanels();
      });
    }

    if (tab === 'risk') {
      const bal = $('#rkBalance');
      const risk = $('#rkRisk');
      const stop = $('#rkStop');
      const calc = $('#rkCalc');
      const save = $('#rkSave');
      const out = $('#rkOut');

      calc?.addEventListener('click', () => {
        const B = Number(bal.value);
        const R = Number(risk.value);
        const S = Number(stop.value);
        if (!B || !R || !S) {
          toast('Fill inputs', 'warn');
          haptic('notify', 'warning');
          return;
        }
        // simplistic risk math (demo): risk$ = B*(R/100). position = risk$/S
        const riskUsd = B * (R / 100);
        const position = riskUsd / S;

        out.innerHTML = `
          ${factorCard('POSITION', Math.round(position))}
          ${factorCard('RISK $', Math.round(riskUsd))}
          ${factorCard('MAX LOSS', Math.round(riskUsd))}
          <div class="card"><div class="label">DISCIPLINE</div><div class="value big" style="color:rgba(120,255,180,.9)">ON</div></div>
        `.replace('%', '');

        toast('CALCULATED', 'ok');
        haptic('notify', 'success');
      });

      save?.addEventListener('click', () => {
        const id = `p_${Math.random().toString(16).slice(2)}`;
        state.presets.push({ id, name: `Preset ${state.presets.length + 1}`, asset: state.asset, tf: state.tf, market: state.market });
        saveState();
        toast(t('toastSaved'), 'ok');
        haptic('notify', 'success');
      });
    }

    if (tab === 'journal') {
      const notes = $('#jrNotes');
      const addUp = $('#jrAddUp');
      const addDown = $('#jrAddDown');
      const win = $('#jrWin');
      const loss = $('#jrLoss');

      const addEntry = (dir) => {
        const id = `j_${Math.random().toString(16).slice(2)}`;
        state.journal.push({
          id,
          ts: Date.now(),
          sym: state.asset,
          tf: state.tf,
          dir,
          riskPct: 1,
          notes: (notes.value || '').trim(),
          outcome: 'OPEN',
        });
        saveState();
        notes.value = '';
        toast('JOURNAL ADDED', 'ok');
        haptic('notify', 'success');
        renderPanels();
      };

      addUp?.addEventListener('click', () => addEntry('UP'));
      addDown?.addEventListener('click', () => addEntry('DOWN'));

      win?.addEventListener('click', () => markLastOutcome('WIN'));
      loss?.addEventListener('click', () => markLastOutcome('LOSS'));
    }

    if (tab === 'alerts') {
      const sym = $('#alSym');
      const val = $('#alVal');
      const add = $('#alAdd');
      const useCur = $('#alUseCurrent');
      const above = $('#alAbove');
      const below = $('#alBelow');

      let condition = 'above';
      above?.addEventListener('click', () => { condition = 'above'; toast('ABOVE', 'ok'); });
      below?.addEventListener('click', () => { condition = 'below'; toast('BELOW', 'ok'); });

      useCur?.addEventListener('click', () => { sym.value = state.asset; haptic('selection'); });

      add?.addEventListener('click', () => {
        const s = (sym.value || '').trim();
        const v = Number(val.value);
        if (!s || !Number.isFinite(v)) {
          toast('Fill rule', 'warn');
          haptic('notify', 'warning');
          return;
        }
        state.alerts.push({ id: `a_${Math.random().toString(16).slice(2)}`, sym: s, type: 'price', condition, value: v, enabled: true });
        saveState();
        toast('ALERT ADDED', 'ok');
        haptic('notify', 'success');
        renderPanels();
      });

      // actions in left list
      $$('#panelLeft [data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const act = btn.dataset.act;
          const a = state.alerts.find(x => x.id === id);
          if (!a) return;
          if (act === 'toggle') a.enabled = !a.enabled;
          if (act === 'remove') state.alerts = state.alerts.filter(x => x.id !== id);
          saveState();
          toast(t('toastSaved'), 'ok');
          haptic('selection');
          renderPanels();
        });
      });
    }

    if (tab === 'settings') {
      $('#stExport')?.addEventListener('click', doExport);
      $('#stImport')?.addEventListener('click', doImport);

      $('#stWipe')?.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        toast('WIPED', 'warn');
        haptic('notify', 'warning');
        location.reload();
      });

      $('#stReg')?.addEventListener('click', () => openLink(REG_URL));

      $('#stBackGate')?.addEventListener('click', () => {
        state.registered = false;
        saveState();
        renderGate();
      });
    }
  }

  function markLastOutcome(outcome) {
    for (let i = state.journal.length - 1; i >= 0; i--) {
      if (state.journal[i].outcome === 'OPEN') {
        state.journal[i].outcome = outcome;
        saveState();
        toast(`MARKED: ${outcome}`, 'ok');
        haptic('notify', 'success');
        renderPanels();
        return;
      }
    }
    toast('NO OPEN TRADE', 'warn');
    haptic('notify', 'warning');
  }

  function guessCat(sym) {
    const s = sym.toUpperCase();
    if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL') || s.includes('XRP') || s.includes('BNB')) return 'CRYPTO';
    if (s.includes('/')) return 'FX';
    if (s.includes('GOLD') || s.includes('SILVER') || s.includes('OIL')) return 'COM';
    return 'OTHER';
  }

  /* =========================
     14) EXPORT / IMPORT
  ========================== */
  function doExport() {
    const payload = JSON.stringify(state, null, 2);
    // Copy to clipboard
    navigator.clipboard?.writeText(payload).then(() => {
      toast(t('toastExported'), 'ok');
      haptic('notify', 'success');
    }).catch(() => {
      // fallback modal
      openModal({
        title: 'EXPORT',
        bodyHTML: `<div class="list" style="max-height:none"><pre style="white-space:pre-wrap;word-break:break-word;padding:12px;margin:0;">${escapeHTML(payload)}</pre></div>`,
      });
    });
  }

  function doImport() {
    openModal({
      title: 'IMPORT',
      bodyHTML: `
        <input class="search" id="imp" placeholder="Paste JSON here…" autocomplete="off" />
        <div class="actions" style="padding:0 12px 14px;">
          <button class="btn btnPrimary" id="impGo">${t('import')}</button>
          <button class="btn" id="impCancel">${t('cancel')}</button>
        </div>
      `,
      onMount: (m) => {
        $('#impCancel', m).addEventListener('click', closeModal);
        $('#impGo', m).addEventListener('click', () => {
          const raw = $('#imp', m).value || '';
          const data = safeJSONParse(raw, null);
          if (!data) {
            toast('Invalid JSON', 'bad');
            haptic('notify', 'error');
            return;
          }
          Object.assign(state, data);
          saveState();
          closeModal();
          toast(t('toastImported'), 'ok');
          haptic('notify', 'success');
          renderTerminal();
        });
      }
    });
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  /* =========================
     15) COMMAND PALETTE + QUICK MENU
  ========================== */
  function openCommandPalette(onAfter) {
    const cmds = [
      { name: 'Run Scan', hint: 'Start demo scan', key: 'S', run: () => runScan() },
      { name: 'Open Registration', hint: 'Open REG URL', key: 'R', run: () => openLink(REG_URL) },
      { name: 'Toggle Market', hint: 'OTC ↔ LIVE', key: 'M', run: () => {
        state.market = (state.market === 'OTC') ? 'LIVE' : 'OTC';
        saveState();
        $('#vMarket').textContent = state.market;
        toast(`MARKET: ${state.market}`, 'ok');
      }},
      { name: 'Export', hint: 'Copy JSON', key: 'E', run: () => doExport() },
      { name: 'Import', hint: 'Paste JSON', key: 'I', run: () => doImport() },
      { name: 'Language', hint: 'RU ↔ EN', key: 'L', run: () => {
        state.lang = (state.lang === 'ru') ? 'en' : 'ru';
        saveState();
        renderTerminal();
      }},
    ];

    openModal({
      title: 'COMMAND PALETTE',
      bodyHTML: `
        <input class="search" id="q" placeholder="Search…" autocomplete="off" />
        <div class="list" id="list"></div>
      `,
      onMount: (m) => {
        const q = $('#q', m);
        const list = $('#list', m);

        const render = () => {
          const s = (q.value || '').trim().toLowerCase();
          const filtered = !s ? cmds : cmds.filter(c =>
            c.name.toLowerCase().includes(s) || c.hint.toLowerCase().includes(s) || c.key.toLowerCase().includes(s)
          );
          list.innerHTML = filtered.map(c => `
            <button class="item" type="button">
              <span class="liLeft">
                <span class="liName">${c.name}</span>
                <span class="liSub">${c.hint}</span>
              </span>
              <span class="liTag">${c.key}</span>
            </button>
          `).join('');

          $$('.item', list).forEach((btn, idx) => btn.addEventListener('click', () => {
            closeModal();
            filtered[idx].run();
            onAfter?.();
            haptic('notify', 'success');
          }));
        };

        q.addEventListener('input', render);
        render();
        setTimeout(() => q.focus(), 0);
      }
    });
  }

  function openQuickMenu() {
    openModal({
      title: 'QUICK MENU',
      bodyHTML: `
        <div class="list" id="list">
          ${menuItem('Open Registration', '↗', 'reg')}
          ${menuItem('Command Palette', '⌘', 'cmd')}
          ${menuItem('Export', '⇪', 'exp')}
          ${menuItem('Import', '⤓', 'imp')}
          ${menuItem('Back to Gate', '⟵', 'gate')}
        </div>
      `,
      onMount: (m) => {
        const list = $('#list', m);
        $$('.item', list).forEach(btn => btn.addEventListener('click', () => {
          const a = btn.dataset.act;
          closeModal();
          if (a === 'reg') openLink(REG_URL);
          if (a === 'cmd') openCommandPalette(() => {});
          if (a === 'exp') doExport();
          if (a === 'imp') doImport();
          if (a === 'gate') { state.registered = false; saveState(); renderGate(); }
          haptic('selection');
        }));
      }
    });
  }

  function menuItem(name, tag, act) {
    return `
      <button class="item" type="button" data-act="${act}">
        <span class="liLeft">
          <span class="liName">${name}</span>
          <span class="liSub">ACTION</span>
        </span>
        <span class="liTag">${tag}</span>
      </button>
    `;
  }

  /* =========================
     16) HOTKEYS
  ========================== */
  let hotkeysBound = false;
  function bindHotkeys(onAfter) {
    if (hotkeysBound) return;
    hotkeysBound = true;

    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();

      // Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && k === 'k') {
        e.preventDefault();
        openCommandPalette(onAfter);
        return;
      }

      // ignore when typing
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      if (k === 's') { runScan(); }
      if (k === 'r') { openLink(REG_URL); }
      if (k === 'm') {
        state.market = (state.market === 'OTC') ? 'LIVE' : 'OTC';
        saveState();
        const v = $('#vMarket');
        if (v) v.textContent = state.market;
        toast(`MARKET: ${state.market}`, 'ok');
      }
    });
  }

  /* =========================
     17) BOOT
  ========================== */
  function boot() {
    loadState();
    injectCSS();
    buildRoot();
    tgReady();

    // Default route
    if (state.registered) renderTerminal();
    else renderGate();

    // Telegram theme changes (optional)
    if (tg) {
      try {
        tg.onEvent('themeChanged', () => {});
      } catch {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
