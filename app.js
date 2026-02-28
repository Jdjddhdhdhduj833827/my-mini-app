// ===== CONFIG =====
const REG_URL = "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50";

// ===== ELEMENTS =====
const gate = document.getElementById("gate");
const app = document.getElementById("app");

const btnOpenLink = document.getElementById("btnOpenLink");
const chkRegistered = document.getElementById("chkRegistered");
const btnEnter = document.getElementById("btnEnter");

const gateFill = document.getElementById("gateFill");
const gateStatus = document.getElementById("gateStatus");

const btnAnalyze = document.getElementById("btnAnalyze");
const btnReset = document.getElementById("btnReset");
const btnCopy = document.getElementById("btnCopy");

const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlayText");
const barFill = document.getElementById("barFill");

const chart = document.getElementById("chart");
const ctx = chart?.getContext("2d");

const miniFill = document.getElementById("miniFill");
const miniText = document.getElementById("miniText");

const mVol = document.getElementById("mVol");
const mMom = document.getElementById("mMom");
const mStr = document.getElementById("mStr");
const mLiq = document.getElementById("mLiq");

const resultPanel = document.getElementById("resultPanel");
const rAsset = document.getElementById("rAsset");
const rTf = document.getElementById("rTf");
const rAcc = document.getElementById("rAcc");
const dirDot = document.getElementById("dirDot");
const dirText = document.getElementById("dirText");
const rUntil = document.getElementById("rUntil");
const progFill = document.getElementById("progFill");
const timerText = document.getElementById("timerText");

const assetValue = document.getElementById("assetValue");
const tfValue = document.getElementById("tfValue");
const marketValue = document.getElementById("marketValue");

const scanSfx = document.getElementById("scanSfx");

// ===== Telegram init (safe) =====
let tg = null;
try {
  tg = window.Telegram?.WebApp || null;
  tg?.ready?.();
  tg?.expand?.();
} catch (_) {}

let HAPTICS = true;

function haptic(kind="impact", style="light"){
  try{
    if (!HAPTICS) return;
    tg?.HapticFeedback?.[kind]?.(style);
  }catch(_){}
}

function openLink(url){
  // Telegram mini app: openLink. Browser: window.open
  try{
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  }catch(_){
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// ===== Gate logic =====
if (btnOpenLink){
  btnOpenLink.addEventListener("click", () => {
    haptic("impact","medium");
    gateStatus.textContent = "OPENING LINK…";
    gateFill.style.width = "38%";
    openLink(REG_URL);
    setTimeout(()=>{
      gateStatus.textContent = "ACCESS CHECK";
      gateFill.style.width = chkRegistered?.checked ? "70%" : "18%";
    }, 650);
  });
}

if (chkRegistered && btnEnter){
  chkRegistered.addEventListener("change", () => {
    haptic("impact","light");
    btnEnter.disabled = !chkRegistered.checked;
    gateFill.style.width = chkRegistered.checked ? "70%" : "18%";
    gateStatus.textContent = chkRegistered.checked ? "READY TO ENTER" : "ACCESS CHECK";
  });
}

if (btnEnter){
  btnEnter.addEventListener("click", () => {
    haptic("impact","heavy");
    gate.classList.add("hidden");
    app.classList.remove("hidden");
  });
}

// ===== Chart render (simple but premium-looking) =====
function drawChart(points){
  if (!ctx) return;
  const w = chart.width, h = chart.height;

  // bg
  ctx.clearRect(0,0,w,h);
  const grad = ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,"rgba(124,92,255,0.18)");
  grad.addColorStop(1,"rgba(0,178,255,0.10)");
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0,0,w,h);

  // subtle glow
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(0,0,w,h);
  ctx.globalAlpha = 1;

  // grid
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  for(let y=40; y<h; y+=40){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }
  for(let x=60; x<w; x+=60){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // line
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.shadowColor = "rgba(124,92,255,0.6)";
  ctx.shadowBlur = 18;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = 30;
  const scaleY = (h - pad*2) / (max - min || 1);

  ctx.beginPath();
  points.forEach((p,i)=>{
    const x = (i/(points.length-1))*(w - pad*2) + pad;
    const y = h - ( (p-min)*scaleY + pad );
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  // fill under line
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.25;
  const fillGrad = ctx.createLinearGradient(0,0,0,h);
  fillGrad.addColorStop(0,"rgba(124,92,255,0.35)");
  fillGrad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = fillGrad;

  ctx.lineTo(w-pad, h-pad);
  ctx.lineTo(pad, h-pad);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function genPoints(n=64){
  let v = 100 + Math.random()*20;
  const arr = [];
  for(let i=0;i<n;i++){
    v += (Math.random()-0.48)*6;
    arr.push(v);
  }
  return arr;
}

let points = genPoints();
drawChart(points);

// ===== Analyze simulation =====
let running = false;

function setMini(state, pct){
  miniText.textContent = state;
  miniFill.style.width = `${pct}%`;
}

function setOverlay(on, text, pct){
  if (!overlay) return;
  overlay.classList.toggle("show", !!on);
  if (overlayText) overlayText.textContent = text || "";
  if (barFill) barFill.style.width = `${pct||0}%`;
}

function randInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }

async function runAnalyze(){
  if (running) return;
  running = true;
  haptic("impact","medium");

  try{ scanSfx?.play?.(); }catch(_){}

  setMini("SCANNING", 20);
  setOverlay(true, "Collecting micro-signals…", 12);

  const steps = [
    ["Reading liquidity map…", 22],
    ["Evaluating volatility clusters…", 38],
    ["Detecting momentum drift…", 56],
    ["Scoring confidence…", 74],
    ["Generating decision window…", 92],
  ];

  for (const [t,p] of steps){
    points = genPoints(64);
    drawChart(points);
    setOverlay(true, t, p);
    setMini("SCANNING", p);
    await new Promise(r=>setTimeout(r, 520));
  }

  // metrics
  const vol = randInt(18, 92);
  const mom = randInt(10, 95);
  const str = randInt(15, 98);
  const liq = randInt(20, 90);

  mVol.textContent = `${vol}%`;
  mMom.textContent = `${mom}%`;
  mStr.textContent = `${str}%`;
  mLiq.textContent = `${liq}%`;

  // result
  const acc = randInt(62, 94);
  const dirUp = Math.random() > 0.46;

  rAsset.textContent = assetValue?.textContent || "EUR/USD";
  rTf.textContent = tfValue?.textContent || "30s";
  rAcc.textContent = `${acc}%`;

  dirText.textContent = dirUp ? "UP" : "DOWN";
  dirDot.style.background = dirUp ? "rgba(120,255,180,1)" : "rgba(255,90,110,1)";
  dirDot.style.boxShadow = dirUp ? "0 0 18px rgba(120,255,180,.55)" : "0 0 18px rgba(255,90,110,.55)";

  const mm = randInt(0,59).toString().padStart(2,"0");
  const ss = randInt(0,59).toString().padStart(2,"0");
  rUntil.textContent = `${mm}:${ss}`;

  resultPanel.classList.remove("hidden");

  // progress “window”
  let pct = 0;
  const start = Date.now();
  const dur = 8000;

  const tick = () => {
    const t = Date.now() - start;
    pct = Math.min(100, (t/dur)*100);
    progFill.style.width = `${pct}%`;
    const left = Math.max(0, Math.ceil((dur - t)/1000));
    timerText.textContent = `${Math.floor(t/1000)}s / ${left}s`;
    if (pct < 100) requestAnimationFrame(tick);
    else {
      setMini("DONE", 100);
    }
  };
  requestAnimationFrame(tick);

  setOverlay(false, "", 0);
  setMini("DONE", 100);
  haptic("notification","success");
  running = false;
}

btnAnalyze?.addEventListener("click", runAnalyze);

btnReset?.addEventListener("click", () => {
  haptic("impact","light");
  resultPanel?.classList.add("hidden");
  progFill.style.width = "0%";
  timerText.textContent = "—:— / —:—";
  mVol.textContent = "—";
  mMom.textContent = "—";
  mStr.textContent = "—";
  mLiq.textContent = "—";
  points = genPoints();
  drawChart(points);
  setMini("IDLE", 0);
});

btnCopy?.addEventListener("click", async () => {
  haptic("impact","light");
  const text =
`CRAFT ANALYTICS
Asset: ${rAsset.textContent}
TF: ${rTf.textContent}
Confidence: ${rAcc.textContent}
Dir: ${dirText.textContent} until ${rUntil.textContent}`;
  try{
    await navigator.clipboard.writeText(text);
    setMini("COPIED", 100);
    haptic("notification","success");
    setTimeout(()=>setMini("IDLE",0), 900);
  }catch(_){
    setMini("COPY FAIL", 100);
    setTimeout(()=>setMini("IDLE",0), 900);
  }
});

// default mini status
setMini("IDLE", 0);
