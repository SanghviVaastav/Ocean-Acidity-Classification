"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Summary {
  total_stations: number;
  critical: number;
  vulnerable: number;
  safe: number;
  avg_ph: number;
  min_ph: number;
  max_ph: number;
}

interface Health {
  status: string;
  version: string;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [historyCount, setHistoryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/api/health`).then((r) => r.json()),
      fetch(`${API}/api/summary`).then((r) => r.json()),
      fetch(`${API}/api/history?skip=0&limit=1`).then((r) => r.json()),
    ]).then(([h, s, hist]) => {
      if (h.status === "fulfilled") setHealth(h.value);
      if (s.status === "fulfilled") setSummary(s.value);
      if (hist.status === "fulfilled") setHistoryCount(hist.value.total ?? 0);
      setLoading(false);
    });
  }, []);

  const phColor = (ph: number) => {
    if (ph < 8.0) return "#ff1744";
    if (ph < 8.1) return "#ffd600";
    return "#00e676";
  };

  const tile = (label: string, value: string | number, color = "#b8d4e8", sub?: string) => (
    <div
      style={{
        background: "#071525",
        border: "1px solid #0d2035",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontSize: "0.55rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#3d6680" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.9rem", fontWeight: 700, color, fontFamily: "'Unbounded', sans-serif", lineHeight: 1.1 }}>
        {loading ? "—" : value}
      </div>
      {sub && <div style={{ fontSize: "0.6rem", color: "#3d6680" }}>{sub}</div>}
    </div>
  );

  const navCard = (href: string, emoji: string, title: string, desc: string, accent: string) => (
    <a
      href={href}
      style={{
        background: "#071525",
        border: `1px solid ${accent}33`,
        borderRadius: 14,
        padding: "24px 28px",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "all .18s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.border = `1px solid ${accent}88`;
        (e.currentTarget as HTMLElement).style.background = `${accent}0a`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.border = `1px solid ${accent}33`;
        (e.currentTarget as HTMLElement).style.background = "#071525";
      }}
    >
      <div style={{ fontSize: "2rem" }}>{emoji}</div>
      <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "0.85rem", fontWeight: 700, color: accent }}>
        {title}
      </div>
      <div style={{ fontSize: "0.67rem", color: "#4a6a80", lineHeight: 1.6 }}>{desc}</div>
      <div style={{ fontSize: "0.6rem", color: accent, marginTop: 4, letterSpacing: "0.1em" }}>OPEN →</div>
    </a>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050e1a",
        fontFamily: "'IBM Plex Mono', monospace",
        color: "#b8d4e8",
        padding: "36px 40px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Unbounded:wght@700;900&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .55s ease both; }
      `}</style>

      {/* ── HEADER ── */}
      <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
        <div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "2rem", fontWeight: 900, color: "#00d4ff", letterSpacing: "-0.01em" }}>
            Ocean<span style={{ color: "#b8d4e8" }}>Acid</span>
          </div>
          <div style={{ fontSize: "0.58rem", color: "#3d6680", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4 }}>
            Acidity Classification • Monitoring Dashboard
          </div>
        </div>

        {/* API Status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: health?.status === "ok" ? "rgba(0,230,118,.08)" : "rgba(255,23,68,.08)",
            border: `1px solid ${health?.status === "ok" ? "rgba(0,230,118,.3)" : "rgba(255,23,68,.3)"}`,
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: "0.62rem",
            color: health?.status === "ok" ? "#00e676" : "#ff1744",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              display: "inline-block",
              background: health?.status === "ok" ? "#00e676" : "#ff1744",
              animation: "pulse 1.5s infinite",
            }}
          />
          {health ? `API ${health.status.toUpperCase()} · v${health.version}` : "API OFFLINE"}
        </div>
      </div>

      {/* ── STAT TILES ── */}
      <div
        className="fade-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 36,
          animationDelay: ".08s",
        }}
      >
        {tile("Total Stations", summary?.total_stations ?? "—", "#00d4ff")}
        {tile("Critical", summary?.critical ?? "—", "#ff1744", "pH < 8.00")}
        {tile("Vulnerable", summary?.vulnerable ?? "—", "#ffd600", "8.00 ≤ pH < 8.10")}
        {tile("Safe", summary?.safe ?? "—", "#00e676", "pH ≥ 8.10")}
        {tile(
          "Avg pH",
          summary ? summary.avg_ph.toFixed(3) : "—",
          summary ? phColor(summary.avg_ph) : "#b8d4e8"
        )}
        {tile(
          "Predictions Logged",
          historyCount !== null ? historyCount.toLocaleString() : "—",
          "#a78bfa"
        )}
      </div>

      {/* ── pH RANGE BAR ── */}
      {summary && (
        <div
          className="fade-up"
          style={{
            background: "#071525",
            border: "1px solid #0d2035",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 36,
            animationDelay: ".14s",
          }}
        >
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#3d6680", marginBottom: 14 }}>
            pH Range Across All Stations
          </div>
          <div style={{ position: "relative", height: 10, background: "#0d2035", borderRadius: 99 }}>
            {/* gradient fill */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg, #ff1744 0%, #ffd600 35%, #00e676 100%)",
                opacity: 0.25,
              }}
            />
            {/* min marker */}
            {(() => {
              const range = 8.5 - 7.6;
              const minPct = ((summary.min_ph - 7.6) / range) * 100;
              const maxPct = ((summary.max_ph - 7.6) / range) * 100;
              return (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: `${minPct}%`,
                      top: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: phColor(summary.min_ph),
                      border: "2px solid #050e1a",
                      boxShadow: `0 0 8px ${phColor(summary.min_ph)}88`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${maxPct}%`,
                      top: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: phColor(summary.max_ph),
                      border: "2px solid #050e1a",
                      boxShadow: `0 0 8px ${phColor(summary.max_ph)}88`,
                    }}
                  />
                </>
              );
            })()}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.6rem", color: "#3d6680" }}>
            <span>Min: <span style={{ color: phColor(summary.min_ph), fontWeight: 700 }}>{summary.min_ph}</span></span>
            <span style={{ color: "#1a3a55" }}>7.6 ————————————— 8.5</span>
            <span>Max: <span style={{ color: phColor(summary.max_ph), fontWeight: 700 }}>{summary.max_ph}</span></span>
          </div>
        </div>
      )}

      {/* ── NAV CARDS ── */}
      <div
        className="fade-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          animationDelay: ".2s",
        }}
      >
        {navCard(
          "/predict",
          "🔬",
          "Run Prediction",
          "Enter 20 ocean sensor features for a single classification, or upload a CSV for bulk batch predictions.",
          "#00d4ff"
        )}
        {navCard(
          "/map",
          "🗺️",
          "Ocean Map",
          "Visualise real-time station statuses, acidity zones, and shipping route density on an interactive Leaflet map.",
          "#00e676"
        )}
        {navCard(
          "/history",
          "📋",
          "Prediction History",
          "Browse all past predictions stored in the database, paginated and colour-coded by acidity classification.",
          "#a78bfa"
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ marginTop: 48, borderTop: "1px solid #0d2035", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.58rem", color: "#1a3a55" }}>
          OceanAcid Classification System · XGBoost Model · FastAPI + Next.js
        </div>
        <div style={{ fontSize: "0.58rem", color: "#1a3a55" }}>
          pH thresholds: Critical &lt; 8.00 · Vulnerable 8.00–8.10 · Safe ≥ 8.10
        </div>
      </div>
    </div>
  );
}