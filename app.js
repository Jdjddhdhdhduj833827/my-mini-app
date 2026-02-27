const tg = window.Telegram?.WebApp;

const state = {
  category: "fx",
  query: "",
  instrument: null, // {symbol, market}
  model: null,      // {id, name}
  expiry: null,     // "S15" etc
  running: false,
  timer: null
};

function $(id){ return document.getElementById(id); }

function show(screenId){
  const screens = ["screenInstrument","screenModel","screenPipeline","screenResult"];
  for(const s of screens){
    $(s).classList.toggle("hidden", s !== screenId);
  }
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function loadJson(path){
  const res = await fetch(path, { cache: "no-store" });

  if(!res.ok){
    const txt = await res.text();
    throw new Error("HTTP " + res.status + " " + path + " :: " + txt.slice(0,200));
  }

  return await res.json();
}

function applyTelegram(){
  if(!tg) return;
  tg.ready();
  tg.expand();

  const t = tg.themeParams || {};
  // если телега светлая — оставим наш тёмный терминал, но акцент возьмём от кнопки телеги
  if(t.button_color){
    document.documentElement.style.setProperty("--accent", t.button_color);
  }
}

function renderCategories(cats){
  const row = $("categoryRow");
  row.innerHTML = "";

  cats.forEach(c=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pill" + (c.id === state.category ? " active":"");
    b.textContent = c.name;

    const handler = (e)=>{
      e.preventDefault();
      state.category = c.id;
      renderCategories(cats);
      refreshInstrumentList();
    };

    b.addEventListener("pointerup", handler, { passive: false });
    b.addEventListener("touchend", handler, { passive: false });
    b.addEventListener("click", handler);

    row.appendChild(b);
  });
}

let instrumentsData = null;
let modelsData = null;

function matches(item){
  if(item.cat !== state.category) return false;
  if(!state.query) return true;
  const q = state.query.toLowerCase();
  return item.symbol.toLowerCase().includes(q) || (item.market||"").toLowerCase().includes(q);
}

function refreshInstrumentList(){
  const list = $("instrumentList");
  list.innerHTML = "";
  const items = instrumentsData.items.filter(matches);

  items.forEach(it=>{
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <div class="item__title">${escapeHtml(it.symbol)}</div>
        <div class="item__sub">${escapeHtml(it.market)}</div>
      </div>
      <div class="badge">выбрать</div>
    `;
    el.addEventListener("click", ()=>{
      state.instrument = { symbol: it.symbol, market: it.market };
      $("chosenInstrumentLine").textContent = `${it.symbol} • ${it.market}`;
      show("screenModel");
    });
    list.appendChild(el);
  });

  if(items.length === 0){
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.style.padding = "10px 2px";
    empty.textContent = "Ничего не найдено по фильтру.";
    list.appendChild(empty);
  }
}

function renderModels(){
  const box = $("modelSelect");
  box.innerHTML = "";
  modelsData.models.forEach(m=>{
    const el = document.createElement("div");
    el.className = "opt" + (state.model?.id === m.id ? " active":"");
    el.innerHTML = `
      <div>
        <div class="opt__name">${escapeHtml(m.name)}</div>
        <div class="opt__desc">${escapeHtml(m.desc)}</div>
      </div>
      <div class="badge">выбрать</div>
    `;
    el.addEventListener("click", ()=>{
      state.model = { id: m.id, name: m.name };
      renderModels();
    });
    box.appendChild(el);
  });
}

function renderExpiry(){
  const grid = $("expiryGrid");
  const values = ["S5","S15","S30","M1","M3","M5","M30","H1","H4"];
  grid.innerHTML = "";
  values.forEach(v=>{
    const b = document.createElement("button");
    b.className = "chip" + (state.expiry === v ? " active":"");
    b.textContent = v;
    b.addEventListener("click", ()=>{
      state.expiry = v;
      renderExpiry();
    });
    grid.appendChild(b);
  });
}

function resetAll(){
  state.query = "";
  state.instrument = null;
  state.model = null;
  state.expiry = null;
  state.running = false;
  if(state.timer) clearInterval(state.timer);
  state.timer = null;

  $("searchInput").value = "";
  $("progFill").style.width = "0%";
  $("progText").textContent = "0% • подготовка";
  document.querySelectorAll(".pipeitem").forEach(x=>x.classList.remove("done"));

  show("screenInstrument");
  refreshInstrumentList();
  renderModels();
  renderExpiry();
}

function hashSeed(str){
  // простая стабильная “псевдо-рандомизация”
  let h = 2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function prng(seed){
  // mulberry32
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function computeResult(){
  const now = new Date();
  const timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}-${now.getUTCHours()}-${Math.floor(now.getUTCMinutes()/2)}`;
  const seed = hashSeed(`${state.instrument.symbol}|${state.instrument.market}|${state.model.id}|${state.expiry}|${timeKey}`);
  const rnd = prng(seed);

  const dir = rnd() > 0.5 ? "DOWN" : "UP";

  // Уверенность (55–86)
  let conf = Math.round(55 + rnd()*31);

  // “Сила”
  const strength = conf >= 78 ? "High" : (conf >= 66 ? "Medium" : "Low");

  // “точность (оценка)” (50–75) — подпишем как оценку
  const acc = Math.round(50 + rnd()*25);

  // “объём”
  const vol = rnd() > 0.66 ? "High" : (rnd() > 0.33 ? "Medium" : "Low");

  // действует до
  const until = new Date(now.getTime() + expiryToMs(state.expiry));
  const untilStr = until.toLocaleTimeString("ru-RU", { hour:"2-digit", minute:"2-digit" });

  return {
    dir, conf, strength, acc, vol,
    pair: state.instrument.symbol,
    market: state.instrument.market,
    expiry: state.expiry,
    until: untilStr
  };
}

function expiryToMs(exp){
  const map = {
    "S5": 5e3, "S15": 15e3, "S30": 30e3,
    "M1": 60e3, "M3": 180e3, "M5": 300e3,
    "M30": 1800e3, "H1": 3600e3, "H4": 14400e3
  };
  return map[exp] ?? 60000;
}

function runPipeline(){
  if(!state.instrument || !state.model || !state.expiry){
    alert("Выбери инструмент, модель и экспирацию.");
    return;
  }
  state.running = true;

  $("pipelineModelLine").textContent = `Модель: ${state.model.name}`;
  show("screenPipeline");

  const steps = [
    {key:"ta", label:"Технический анализ"},
    {key:"patterns", label:"Паттерны"},
    {key:"math", label:"Расчёты"},
    {key:"assemble", label:"Сборка"}
  ];

  let idx = 0;
  let progress = 0;

  document.querySelectorAll(".pipeitem").forEach(x=>x.classList.remove("done"));
  $("progFill").style.width = "0%";
  $("progText").textContent = "0% • подготовка";

  const totalTicks = 40; // ~4 секунды
  let tick = 0;

  if(state.timer) clearInterval(state.timer);

  state.timer = setInterval(()=>{
    tick++;
    progress = Math.min(100, Math.round((tick/totalTicks)*100));
    $("progFill").style.width = `${progress}%`;

    // отмечаем шаги
    const stepBreaks = [25, 50, 75, 100];
    for(let s=0;s<stepBreaks.length;s++){
      if(progress >= stepBreaks[s]){
        document.querySelector(`.pipeitem[data-step="${steps[s].key}"]`)?.classList.add("done");
        idx = s;
      }
    }
    $("progText").textContent = `${progress}% • ${steps[Math.min(idx, steps.length-1)].label}`;

    if(progress >= 100){
      clearInterval(state.timer);
      state.timer = null;
      state.running = false;
      renderResult(computeResult());
    }
  }, 100);
}

function renderResult(r){
  $("resultModelLine").textContent = `Модель: ${state.model.name}`;

  const hero = $("signalHero");
  hero.classList.remove("up","down");
  hero.classList.add(r.dir === "UP" ? "up":"down");

  $("signalIcon").textContent = r.dir === "UP" ? "↑" : "↓";
  $("signalDir").textContent = r.dir;

  $("statMarket").textContent = r.market;
  $("statConf").textContent = `${r.conf}%`;
  $("statExpiry").textContent = r.expiry;
  $("statStrength").textContent = r.strength;
  $("statPair").textContent = r.pair;
  $("statUntil").textContent = r.until;

  $("statAcc").textContent = `${r.acc}%`;
  $("statVol").textContent = r.vol;

  show("screenResult");
}

function bindUI(){
  $("searchInput").addEventListener("input", (e)=>{
    state.query = e.target.value.trim();
    refreshInstrumentList();
  });

  $("btnBackToInstrument").addEventListener("click", ()=>{
    show("screenInstrument");
  });

  $("btnRun").addEventListener("click", runPipeline);

  $("btnCancel").addEventListener("click", ()=>{
    if(state.timer) clearInterval(state.timer);
    state.timer = null;
    state.running = false;
    show("screenModel");
  });

  $("btnRepeat").addEventListener("click", ()=>{
    // повторяем пайплайн с теми же параметрами
    runPipeline();
  });

  $("btnReset1").addEventListener("click", resetAll);
  $("btnReset2").addEventListener("click", resetAll);

  $("btnMenu").addEventListener("click", ()=>{
    alert("Настройки: скоро добавим (тема/язык/режим).");
  });
}

async function boot(){
  applyTelegram();

  instrumentsData = await loadJson("https://jdjddhdhdhduj833827.github.io/my-mini-app/data/instruments.json");
modelsData = await loadJson("https://jdjddhdhdhduj833827.github.io/my-mini-app/data/models.json");

  renderCategories(instrumentsData.categories);
  refreshInstrumentList();
  renderModels();
  renderExpiry();

  bindUI();
  show("screenInstrument");
}

document.addEventListener("DOMContentLoaded", ()=>{
  boot().catch(err=>{
    console.error(err);
    alert("Ошибка загрузки данных. Проверь файлы data/instruments.json и data/models.json");
  });
});
