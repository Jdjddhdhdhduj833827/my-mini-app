// ====== Demo Trade Signal UI (stable) ======
const tg = window.Telegram?.WebApp;

const PAIRS = [
  { value: "EUR/USD", badge: "🇪🇺" },
  { value: "GBP/USD", badge: "🇬🇧" },
  { value: "USD/JPY", badge: "🇺🇸" },
  { value: "AUD/USD", badge: "🇦🇺" },
  { value: "USD/CAD", badge: "🇨🇦" },
];

const TFS = ["3m", "5m", "7m", "10m"];

const state = {
  pair: PAIRS[0].value,
  pairBadge: PAIRS[0].badge,
  tf: TFS[0],
  market: "OTC",
  timer: null,
  totalSec: 0,
  leftSec: 0,
};

function $(id){ return document.getElementById(id); }

function formatMMSS(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
}

function closeDrops(){
  $("pairDrop").classList.remove("open");
  $("tfDrop").classList.remove("open");
  $("backdrop").classList.add("hidden");
}

function openDrop(dropId){
  closeDrops();
  $(dropId).classList.add("open");
  $("backdrop").classList.remove("hidden");
}

function setPair(pairObj){
  state.pair = pairObj.value;
  state.pairBadge = pairObj.badge;

  $("pairValue").textContent = state.pair;
  $("pairBadge").textContent = state.pairBadge;
  closeDrops();
}

function setTf(tf){
  state.tf = tf;
  $("tfValue").textContent = state.tf;
  closeDrops();
}

function toggleMarket(){
  state.market = (state.market === "OTC") ? "Market" : "OTC";
  $("marketValue").textContent = state.market;
}

function buildDropdowns(){
  // pairs
  const pd = $("pairDrop");
  pd.innerHTML = "";
  PAIRS.forEach(p=>{
    const el = document.createElement("div");
    el.className = "dropItem";
    el.innerHTML = `<span>${p.badge} ${p.value}</span><span>→</span>`;
    el.onclick = ()=>setPair(p);
    pd.appendChild(el);
  });

  // tfs
  const td = $("tfDrop");
  td.innerHTML = "";
  TFS.forEach(tf=>{
    const el = document.createElement("div");
    el.className = "dropItem";
    el.innerHTML = `<span>${tf}</span><span>→</span>`;
    el.onclick = ()=>setTf(tf);
    td.appendChild(el);
  });
}

function stopTimer(){
  if(state.timer){
    clearInterval(state.timer);
    state.timer = null;
  }
}

function startTimer(totalSec){
  stopTimer();
  state.totalSec = totalSec;
  state.leftSec = totalSec;

  const bar = $("progressBar");
  const timerText = $("timerText");

  const tick = ()=>{
    const done = state.totalSec - state.leftSec;
    const pct = Math.max(0, Math.min(100, (done / state.totalSec) * 100));
    bar.style.width = pct.toFixed(2) + "%";

    timerText.textContent = `${formatMMSS(state.leftSec)} / ${formatMMSS(state.totalSec)}`;

    if(state.leftSec <= 0){
      stopTimer();
    } else {
      state.leftSec -= 1;
    }
  };

  tick();
  state.timer = setInterval(tick, 1000);
}

function pickDirection(){
  // демо-логика: чуть чаще "вверх", чтобы не выглядело случайно на 50/50
  return (Math.random() < 0.56) ? "UP" : "DOWN";
}

function nowPlusMinutes(min){
  const d = new Date(Date.now() + min*60*1000);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${hh}:${mm}`;
}

function tfToSeconds(tf){
  const n = parseInt(tf.replace("m",""), 10);
  return n * 60;
}

function genSignal(){
  // UI: показать панель результата
  $("resultPanel").classList.remove("hidden");

  // демо "точность" как диапазон
  const acc = 68 + Math.floor(Math.random()*18); // 68..85

  const dir = pickDirection();
  const until = nowPlusMinutes(parseInt(state.tf,10));

  $("rPair").textContent = state.pair + (state.market === "OTC" ? " OTC" : "");
  $("rTf").textContent = state.tf;
  $("rAcc").textContent = `${acc}%`;
  $("rUntil").textContent = until;

  const dirEl = $("rDir");
  const dot = dirEl.querySelector(".dirDot");
  const text = dirEl.querySelector(".dirText");

  if(dir === "UP"){
    dot.classList.remove("down");
    dot.classList.add("up");
    text.textContent = "Вверх";
  } else {
    dot.classList.remove("up");
    dot.classList.add("down");
    text.textContent = "Вниз";
  }

  // таймер
  startTimer(tfToSeconds(state.tf));

  // В Телеграме можно чуть усилить эффект
  if(tg){
    tg.HapticFeedback?.impactOccurred?.("medium");
  }
}

function resetSignal(){
  stopTimer();
  $("resultPanel").classList.add("hidden");
  $("progressBar").style.width = "0%";
  $("timerText").textContent = "00:00 / 00:00";
  if(tg){
    tg.HapticFeedback?.impactOccurred?.("light");
  }
}

function bindUI(){
  $("pairSelect").addEventListener("click", ()=>openDrop("pairDrop"));
  $("tfSelect").addEventListener("click", ()=>openDrop("tfDrop"));
  $("marketBtn").addEventListener("click", toggleMarket);

  $("backdrop").addEventListener("click", closeDrops);

  $("btnGenerate").addEventListener("click", genSignal);
  $("btnGenerate2").addEventListener("click", genSignal);
  $("btnReset").addEventListener("click", resetSignal);

  $("btnMenu").addEventListener("click", ()=>{
    alert("Меню: скоро добавим настройки (тема/язык/режим).");
  });
}

function initTelegram(){
  if(!tg) return;
  tg.ready();
  tg.expand();
  try{
    tg.setHeaderColor?.("#0a0d16");
    tg.setBackgroundColor?.("#05060a");
  }catch(_){}
}

document.addEventListener("DOMContentLoaded", ()=>{
  initTelegram();
  buildDropdowns();
  bindUI();

  // первичная подстановка
  $("pairValue").textContent = state.pair;
  $("pairBadge").textContent = state.pairBadge;
  $("tfValue").textContent = state.tf;
  $("marketValue").textContent = state.market;
});
