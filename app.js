let instrumentsData = null;
let modelsData = null;

function $(id){
  return document.getElementById(id);
}

function show(screenId){
  const screens = ["screenInstrument","screenModel","screenPipeline","screenResult"];
  for(const s of screens){
    const el = $(s);
    if(!el) continue;
    el.classList.toggle("hidden", s !== screenId);
  }
}

async function loadJson(path){
  const res = await fetch(path, { cache: "no-store" });

  if(!res.ok){
    const txt = await res.text();
    throw new Error("HTTP " + res.status + " " + path + " :: " + txt.slice(0,200));
  }

  return await res.json();
}

function renderCategories(categories){
  const wrap = document.querySelector(".categories");
  if(!wrap) return;

  wrap.innerHTML = "";

  categories.forEach(cat=>{
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.textContent = cat.name;
    btn.onclick = ()=>{
      renderInstrumentList(cat.items);
    };
    wrap.appendChild(btn);
  });
}

function renderInstrumentList(items){
  const list = document.querySelector(".instrument-list");
  if(!list) return;

  list.innerHTML = "";

  items.forEach(item=>{
    const btn = document.createElement("button");
    btn.className = "instrument-btn";
    btn.textContent = item;
    btn.onclick = ()=>{
      show("screenModel");
    };
    list.appendChild(btn);
  });
}

function renderModels(){
  const wrap = document.querySelector(".model-list");
  if(!wrap) return;

  wrap.innerHTML = "";

  modelsData.models.forEach(model=>{
    const btn = document.createElement("button");
    btn.className = "model-btn";
    btn.textContent = model;
    btn.onclick = ()=>{
      show("screenPipeline");
    };
    wrap.appendChild(btn);
  });
}

function renderExpiry(){
  const wrap = document.querySelector(".expiry-list");
  if(!wrap) return;

  const times = ["S5","S15","S30","M1","M3","M5","M30","H1","H4"];

  wrap.innerHTML = "";

  times.forEach(t=>{
    const btn = document.createElement("button");
    btn.className = "expiry-btn";
    btn.textContent = t;
    btn.onclick = ()=>{
      show("screenResult");
    };
    wrap.appendChild(btn);
  });
}

async function boot(){

  instrumentsData = await loadJson("https://jdjddhdhdhduj833827.github.io/my-mini-app/data/instruments.json");
  modelsData = await loadJson("https://jdjddhdhdhduj833827.github.io/my-mini-app/data/models.json");

  renderCategories(instrumentsData.categories);
  renderModels();
  renderExpiry();

  show("screenInstrument");
}

document.addEventListener("DOMContentLoaded", ()=>{
  boot().catch(err=>{
    console.error(err);
    alert("Ошибка загрузки данных: " + err.message);
  });
});
