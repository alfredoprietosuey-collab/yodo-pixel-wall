/**
 * Click por Agua — GH Pages V2
 *
 * ✅ Diseño más “brand”
 * ✅ Mapa del mundo pixel (canvas) que se “riega”
 * ✅ Streaks en localStorage (MVP)
 *
 * Para hacerlo “global real”:
 * - Pon API_BASE
 * - Implementa /api/status y /api/checkin en tu backend (con CORS para github.io)
 */

const API_BASE = "";          // Ej: "https://tudominio.com" (vacío = modo local)
const TZ = "Europe/Madrid";

const DROPS_PER_LITER = 10;
const WEEKLY_GOAL = 5000;
const MONTHLY_GOAL = 20000;

const TEAM = {
  id: "demo",
  name: "Team Demo (MarcaX)",
  claim: "Si llegamos a la meta, la marca financia agua (ejemplo).",
  goal: 50000
};

const WORLD_MAP_URL = "./assets/world.png";

const LS_KEY = "cpa_state_v2";

function defaultState(){
  return {
    lastCheckin: null,
    streak: 0,
    best: 0,
    monthlyDrops: {},
    weeklyCheckins: {},
    teamJoined: false,
    teamCheckins: 0
  };
}
function loadState(){
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function saveState(s){ localStorage.setItem(LS_KEY, JSON.stringify(s)); }
function el(id){ return document.getElementById(id); }
function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

// TZ date helpers
function getTodayISO(){
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" });
  return fmt.format(new Date());
}
function isoToUTCDate(iso){
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m-1, d));
}
function addDaysISO(iso, delta){
  const dt = isoToUTCDate(iso);
  dt.setUTCDate(dt.getUTCDate() + delta);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth()+1).padStart(2,"0");
  const d = String(dt.getUTCDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function monthKey(iso){ return iso.slice(0,7); }
function getWeekKey(iso){
  const d0 = isoToUTCDate(iso);
  const dow = (d0.getUTCDay() + 6) % 7; // Monday=0
  const monday = new Date(d0);
  monday.setUTCDate(d0.getUTCDate() - dow);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth()+1).padStart(2,"0");
  const d = String(monday.getUTCDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

// Seeded RNG (deterministic per week)
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// World map rendering
let landMeta = null; // { w,h,canvas,idx[] }
let worldReady = false;

function loadWorldImage(){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = WORLD_MAP_URL;
  });
}

function buildLandIndex(img, targetW=520){
  const scale = targetW / img.width;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0,0,w,h).data;

  const idx = [];
  for (let y=0; y<h; y++){
    for (let x=0; x<w; x++){
      const i = (y*w + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 10) continue;

      const isLand = (g > b + 15 && g > r - 25) || (r > 120 && g > 90 && b < 120);
      const isOcean = (b > g + 20 && b > r + 20);

      if (isLand && !isOcean) idx.push(y*w + x);
    }
  }
  return { w, h, canvas: c, idx };
}

function renderWorld(canvas, pct, seedStr){
  if (!worldReady || !landMeta) return;

  const ctx = canvas.getContext("2d");
  const base = landMeta.canvas;

  const cssW = canvas.clientWidth || 900;
  const cssH = Math.round(cssW * 0.5);

  const wantW = Math.round(cssW * devicePixelRatio);
  const wantH = Math.round(cssH * devicePixelRatio);
  if (canvas.width !== wantW || canvas.height !== wantH){
    canvas.width = wantW;
    canvas.height = wantH;
  }
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0,0,cssW,cssH);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.filter = "grayscale(1) contrast(1.05) brightness(0.78)";
  ctx.drawImage(base, 0, 0, cssW, cssH);
  ctx.filter = "none";
  ctx.restore();

  const p = clamp(pct, 0, 100);
  const total = landMeta.idx.length;
  let n = Math.floor((p/100) * total);
  if (p > 0 && n < 80) n = Math.min(total, 80);

  const seedFn = xmur3(seedStr);
  const rand = mulberry32(seedFn());
  const indices = landMeta.idx.slice();
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = indices[i]; indices[i] = indices[j]; indices[j] = t;
  }
  const chosen = new Set(indices.slice(0, n));

  const w = landMeta.w, h = landMeta.h;
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const octx = off.getContext("2d", { willReadFrequently: true });
  octx.imageSmoothingEnabled = false;
  octx.drawImage(base, 0, 0);

  const imgData = octx.getImageData(0,0,w,h);
  const d = imgData.data;

  for (let y=0; y<h; y++){
    for (let x=0; x<w; x++){
      const idx1 = y*w + x;
      const i = idx1 * 4;
      if (!chosen.has(idx1)){
        d[i+3] = 0;
      } else {
        d[i]   = Math.min(255, d[i]   * 0.95);
        d[i+1] = Math.min(255, d[i+1] * 1.15);
        d[i+2] = Math.min(255, d[i+2] * 1.00);
        d[i+3] = 220;
      }
    }
  }
  octx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(off, 0, 0, cssW, cssH);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.18;
  ctx.filter = "blur(6px)";
  ctx.drawImage(off, 0, 0, cssW, cssH);
  ctx.restore();

  ctx.save();
  const grd = ctx.createRadialGradient(cssW*0.5, cssH*0.55, cssH*0.1, cssW*0.5, cssH*0.55, cssW*0.75);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,cssW,cssH);
  ctx.restore();
}

// Local actions
function localCheckin(s){
  const today = getTodayISO();
  if (s.lastCheckin === today) return { created:false, s };

  const yesterday = addDaysISO(today, -1);
  if (s.lastCheckin === yesterday) s.streak = (s.streak || 0) + 1;
  else s.streak = 1;

  s.best = Math.max(s.best || 0, s.streak);
  s.lastCheckin = today;

  const mk = monthKey(today);
  s.monthlyDrops[mk] = (s.monthlyDrops[mk] || 0) + 1;

  const wk = getWeekKey(today);
  s.weeklyCheckins[wk] = (s.weeklyCheckins[wk] || 0) + 1;

  if (s.teamJoined) s.teamCheckins = (s.teamCheckins || 0) + 1;

  saveState(s);
  return { created:true, s };
}

function localJoin(s){
  s.teamJoined = true;
  saveState(s);
  return s;
}

function renderUI(s){
  const today = getTodayISO();
  el("today").textContent = today;

  const mk = monthKey(today);
  const drops_mtd = (s.monthlyDrops[mk] || 0);
  const liters_mtd = drops_mtd / DROPS_PER_LITER;

  const wk = getWeekKey(today);
  const weeklyCount = (s.weeklyCheckins[wk] || 0);
  const weeklyPct = WEEKLY_GOAL ? (weeklyCount / WEEKLY_GOAL) * 100 : 0;

  el("streak").textContent = s.streak || 0;
  el("best").textContent = s.best || 0;
  el("drops_mtd").textContent = drops_mtd;
  el("liters_mtd").textContent = liters_mtd.toFixed(1);

  el("dpl").textContent = DROPS_PER_LITER;
  el("dpl2").textContent = DROPS_PER_LITER;

  el("weekly_goal").textContent = WEEKLY_GOAL;
  el("monthly_goal").textContent = MONTHLY_GOAL;

  el("weekly_count").textContent = weeklyCount;
  el("weekly_badge").textContent = weeklyPct.toFixed(1) + "%";
  el("weekly_bar").style.width = clamp(weeklyPct,0,100) + "%";

  renderWorld(el("world_canvas"), weeklyPct, "week:" + wk);

  // Team
  el("team_name").textContent = TEAM.name;
  el("team_claim").textContent = TEAM.claim;
  el("team_goal").textContent = TEAM.goal;
  el("team_count").textContent = s.teamCheckins || 0;
  const teamPct = TEAM.goal ? ((s.teamCheckins || 0) / TEAM.goal) * 100 : 0;
  el("team_pct").textContent = teamPct.toFixed(1);
  el("team_bar").style.width = clamp(teamPct,0,100) + "%";

  el("share_link").value = window.location.origin + window.location.pathname + "#team";

  const already = (s.lastCheckin === today);
  el("btn-checkin").disabled = already;
  el("btn-text").textContent = already ? "Hoy ya regaste ✅" : "Regar hoy";
  if (already) el("checkin-note").textContent = "Hoy ya está. Vuelve mañana para mantener tu racha 🔥";

  el("btn-join").textContent = s.teamJoined ? "✅ En el Team" : "Unirme";
  el("btn-join").disabled = s.teamJoined;
}

async function init(){
  const img = await loadWorldImage();
  landMeta = buildLandIndex(img, 520);
  worldReady = true;

  let s = loadState() || defaultState();
  saveState(s);
  renderUI(s);

  window.addEventListener("resize", () => renderUI(loadState() || s));

  el("btn-share").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(el("share_link").value);
      el("btn-share").textContent = "¡Copiado!";
      setTimeout(()=> el("btn-share").textContent = "Copiar link", 1200);
    } catch { alert("No se pudo copiar el link."); }
  });

  el("btn-checkin").addEventListener("click", () => {
    const res = localCheckin(loadState() || defaultState());
    el("checkin-note").textContent = res.created ? "Hoy has aportado: 💧 +1 gota" : "Hoy ya habías hecho check‑in.";
    renderUI(res.s);
  });

  el("btn-join").addEventListener("click", () => {
    renderUI(localJoin(loadState() || defaultState()));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((e) => {
    console.error(e);
    // Still render without map
    let s = loadState() || defaultState();
    saveState(s);
    renderUI(s);
  });
});
