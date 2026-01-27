/**
 * Click por Agua — GH Pages MVP (estático)
 *
 * - Por defecto guarda estado en localStorage (racha, gotas, etc).
 * - Para hacerlo “real” (global, multi-dispositivo, anti-trampa), conecta a tu backend:
 *   pon API_BASE y crea endpoints /api/status y /api/checkin.
 */

const API_BASE = "";          // Ej: "https://tudominio.com" (vacío = modo local)
const TZ = "Europe/Madrid";   // para que “el día” sea consistente

const DROPS_PER_LITER = 10;
const WEEKLY_GOAL = 5000;
const MONTHLY_GOAL = 20000;

const TEAM = {
  id: "demo",
  name: "Team Demo (MarcaX)",
  claim: "Si llegamos a la meta, la marca financia agua (ejemplo).",
  goal: 50000
};

const LS_KEY = "cpa_state_v1";

function el(id){ return document.getElementById(id); }

function getTodayISO() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" });
  return fmt.format(new Date()); // YYYY-MM-DD
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
  // week key = Monday date (demo). Backend debería calcular semana real.
  const d0 = isoToUTCDate(iso);
  const dow = (d0.getUTCDay() + 6) % 7; // Monday=0
  const monday = new Date(d0);
  monday.setUTCDate(d0.getUTCDate() - dow);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth()+1).padStart(2,"0");
  const d = String(monday.getUTCDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function saveState(s){ localStorage.setItem(LS_KEY, JSON.stringify(s)); }
function defaultState(){
  return {
    lastCheckin: null,
    streak: 0,
    best: 0,
    monthlyDrops: {},     // {YYYY-MM: drops}
    weeklyCheckins: {},   // {mondayISO: count}
    teamJoined: false,
    teamCheckins: 0
  };
}

function setProgress(barEl, pct){ barEl.style.width = `${clamp(pct,0,100)}%`; }

function renderPixelMap(container, pct){
  const nTiles = 240;
  const fill = Math.round((clamp(pct,0,100)/100)*nTiles);
  container.innerHTML = "";
  for (let i=0; i<nTiles; i++){
    const d = document.createElement("div");
    d.className = "pixel" + (i < fill ? " filled" : "");
    if (i === Math.floor(nTiles*0.82) && i < fill) d.className += " oasis";
    container.appendChild(d);
  }
}

function render(state){
  const today = getTodayISO();
  el("today").textContent = today;

  const mk = monthKey(today);
  const drops_mtd = (state.monthlyDrops[mk] || 0);
  const liters_mtd = drops_mtd / DROPS_PER_LITER;

  const wk = getWeekKey(today);
  const weekCount = (state.weeklyCheckins[wk] || 0);
  const weekPct = WEEKLY_GOAL ? Math.floor((weekCount / WEEKLY_GOAL) * 100) : 0;

  const teamPct = TEAM.goal ? Math.floor((state.teamCheckins / TEAM.goal) * 100) : 0;

  el("streak").textContent = state.streak;
  el("best").textContent = state.best;
  el("drops_mtd").textContent = drops_mtd;
  el("liters_mtd").textContent = liters_mtd.toFixed(1);

  el("dpl").textContent = DROPS_PER_LITER;
  el("dpl2").textContent = DROPS_PER_LITER;

  el("weekly_goal").textContent = WEEKLY_GOAL;
  el("monthly_goal").textContent = MONTHLY_GOAL;

  el("weekly_count").textContent = weekCount;
  el("weekly_pct").textContent = clamp(weekPct,0,100);
  setProgress(el("weekly_bar"), clamp(weekPct,0,100));
  renderPixelMap(el("weekly_map"), clamp(weekPct,0,100));

  el("team_name").textContent = TEAM.name;
  el("team_claim").textContent = TEAM.claim;
  el("team_goal").textContent = TEAM.goal;
  el("team_count").textContent = state.teamCheckins;
  el("team_pct").textContent = clamp(teamPct,0,100);
  setProgress(el("team_bar"), clamp(teamPct,0,100));

  el("share_link").value = window.location.origin + window.location.pathname + "#team";

  const already = (state.lastCheckin === today);
  el("btn-checkin").disabled = already;
  el("btn-checkin").textContent = already ? "Hoy ya regaste ✅" : "Regar hoy";

  el("btn-join").textContent = state.teamJoined ? "✅ En el Team" : "Unirme";
  el("btn-join").disabled = state.teamJoined;
}

function localCheckin(){
  const today = getTodayISO();
  const s = loadState() || defaultState();

  if (s.lastCheckin === today){
    return { created:false, state:s };
  }

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
  return { created:true, state:s };
}

function localJoin(){
  const s = loadState() || defaultState();
  s.teamJoined = true;
  saveState(s);
  return s;
}

async function init(){
  // Share button
  el("btn-share").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(el("share_link").value);
      el("btn-share").textContent = "¡Copiado!";
      setTimeout(()=> el("btn-share").textContent = "Copiar link", 1200);
    } catch {
      alert("No se pudo copiar el link.");
    }
  });

  if (!API_BASE){
    // Local mode
    const s = loadState() || defaultState();
    saveState(s);
    render(s);

    el("btn-checkin").addEventListener("click", () => {
      const res = localCheckin();
      el("checkin-note").textContent = res.created ? "Hoy has aportado: 💧 +1 gota" : "Hoy ya habías hecho check‑in.";
      render(res.state);
    });

    el("btn-join").addEventListener("click", () => {
      render(localJoin());
    });

    return;
  }

  // API mode placeholder: usa tu backend para /api/status y /api/checkin
  // (Dejo esto intencionalmente como “hook” para vuestra integración real.)
  const s = loadState() || defaultState();
  saveState(s);
  render(s);
  el("checkin-note").textContent = "API_BASE está configurado pero faltan endpoints. Usa modo local o integra /api/status.";
}

document.addEventListener("DOMContentLoaded", init);
