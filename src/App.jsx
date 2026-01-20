import { useMemo, useState } from "react";
import "./App.css";

function formatNumber(n) {
  return new Intl.NumberFormat("es-ES").format(n);
}

function makeTiles(count, soldCount) {
  const soldSet = new Set();
  while (soldSet.size < soldCount) {
    soldSet.add(Math.floor(Math.random() * count));
  }

  return Array.from({ length: count }, (_, i) => {
    const sold = soldSet.has(i);

    const colors = ["#0EA5E9", "#38BDF8", "#0284C7", "#1E293B", "#334155"];
    const color = sold ? colors[i % colors.length] : "#0B1220";

    const label = sold
      ? ["@maria 💧", "DANI", "🐳", "YODO", "LUCIA", "MARC"][i % 6]
      : "";

    return { id: i + 1, sold, color, label };
  });
}

export default function App() {
  const TOTAL_PIXELS = 1000000;
  const GRID_SIZE = 50; // 50x50 = 2500 tiles demo
  const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

  const [soldTiles] = useState(387); // demo
  const litersPerEuro = 20; // demo
  const litersFromPixels = soldTiles * litersPerEuro;

  const tiles = useMemo(() => makeTiles(TOTAL_TILES, soldTiles), [soldTiles]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <div className="brand">yodo</div>
          <div className="title">Water Pixel Wall</div>
          <div className="subtitle">
            Own a pixel. Fund clean water.
          </div>
        </div>

        <div className="stats">
          <div className="statCard">
            <div className="statLabel">Pixels sold</div>
            <div className="statValue">{formatNumber(soldTiles)}</div>
            <div className="statHint">
              of {formatNumber(TOTAL_PIXELS)} available
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">Liters funded</div>
            <div className="statValue">{formatNumber(litersFromPixels)} L</div>
            <div className="statHint">from the wall</div>
          </div>

          <button className="cta" onClick={() => alert("Checkout soon 💧")}>
            Buy 1€
          </button>
        </div>
      </header>

      <main className="main">
        <div className="wallWrap">
          <div className="wallTitle">The Wall</div>
          <div className="wall">
            {tiles.map((t) => (
              <div
                key={t.id}
                className={`tile ${t.sold ? "sold" : "empty"}`}
                style={{ background: t.color }}
                title={t.sold ? `${t.label} · +${litersPerEuro}L` : "Available"}
              >
                <span className="tileLabel">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="panelTitle">What you get</div>
            <p className="panelText">
              <b>1€</b> = 1 permanent pixel + <b>≈{litersPerEuro}L</b> funded.
            </p>
            <p className="panelText small">
              * Liters are an estimate. We’ll adjust it with real project costs.
            </p>
          </div>

          <div className="panel">
            <div className="panelTitle">Coming soon</div>
            <ul className="list">
              <li>Your pixel with name + color</li>
              <li>Shareable certificate</li>
              <li>Stripe checkout</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} yodo</span>
      </footer>
    </div>
  );
}
