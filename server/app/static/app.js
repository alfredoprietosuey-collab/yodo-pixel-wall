function renderPixelMaps() {
  const maps = document.querySelectorAll(".pixel_map");
  maps.forEach((el) => {
    const raw = el.getAttribute("data-filled") || "0";
    const nTiles = 20 * 12; // 240
    el.innerHTML = "";

    const val = Number(raw);
    let fillCount = 0;
    if (Number.isFinite(val)) {
      if (val <= 100) fillCount = Math.round((val / 100) * nTiles);
      else fillCount = Math.min(nTiles, Math.floor(val));
    }

    for (let i = 0; i < nTiles; i++) {
      const d = document.createElement("div");
      d.className = "pixel" + (i < fillCount ? " filled" : "");
      if (i === Math.floor(nTiles * 0.82) && i < fillCount) d.className += " oasis";
      el.appendChild(d);
    }
  });
}

async function handleCheckin() {
  const btn = document.getElementById("btn-checkin");
  if (!btn || btn.disabled) return;

  btn.disabled = true;
  btn.textContent = "Regando…";

  const res = await fetch("/api/checkin", { method: "POST", credentials: "include" });
  const j = await res.json();

  if (j?.ok) setTimeout(() => window.location.reload(), 250);
  else {
    btn.disabled = false;
    btn.textContent = "Regar hoy";
    alert("No se pudo hacer check-in.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderPixelMaps();
  document.getElementById("btn-checkin")?.addEventListener("click", handleCheckin);
});
