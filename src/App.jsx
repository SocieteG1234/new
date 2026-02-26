import { useState, useEffect, useRef, useCallback } from "react";

// ─── LEAFLET via CDN ──────────────────────────────────────────────────────────
function useLeaflet(cb) {
  useEffect(() => {
    if (window.L) { cb(window.L); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => cb(window.L);
    document.head.appendChild(script);
  }, []);
}

// ─── FONTS ────────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ROUTE = [
  [44.6, -63.6], [43.0, -55.0], [40.0, -45.0], [35.0, -35.0],
  [25.0, -25.0], [15.0, -20.0], [10.0, -15.0], [7.0, -10.0], [5.3, -4.0],
];

const TYPES = {
  cargo:    { color: "#2ed573", label: "Cargo",         tailwind: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  tanker:   { color: "#ff4757", label: "Tanker",        tailwind: "text-red-400 bg-red-400/10 border-red-400/30" },
  passenger:{ color: "#1e90ff", label: "Passager",      tailwind: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  fishing:  { color: "#ffa502", label: "Pêche",         tailwind: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  military: { color: "#a29bfe", label: "Militaire",     tailwind: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
  special:  { color: "#ffd700", label: "Cargo Spécial", tailwind: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
};

const NAMES = ["Atlantic Pioneer","Sea Falcon","Nordic Star","Pacific Trader","Ocean Dream",
  "Baltic Sun","Mediterranean Spirit","Caribbean Breeze","Gulf Endeavour","Arctic Venture",
  "Victoria Maru","Horizon Quest","Coral Prince","Blue Marlin","Iron Hawk","Silver Wave",
  "Thunder Bay","Cape Agulhas","Grand Voyager","Sea Phoenix","Nordic Carrier","Baltic Trader",
  "Aegean Star","Black Sea Express","Gulf Pioneer","Amazon Spirit","Congo Trader",
  "Ivory Coast Runner","Sahara Wind","Benguela Current","North Sea Giant","Channel Trader",
  "Bay of Biscay","Canary Current","Guinea Gulf"];

const FLAGS = ["🇨🇦","🇫🇷","🇬🇧","🇩🇪","🇳🇱","🇳🇴","🇬🇷","🇵🇦","🇧🇸","🇸🇬",
  "🇨🇳","🇺🇸","🇮🇹","🇪🇸","🇧🇷","🇨🇮","🇩🇰","🇷🇺","🇹🇷","🇮🇳"];

const REGIONS = [
  { minLat:45, maxLat:55, minLng:-15, maxLng:5 },
  { minLat:35, maxLat:50, minLng:-40, maxLng:-10 },
  { minLat:10, maxLat:35, minLng:-30, maxLng:-5 },
  { minLat:-5, maxLat:15, minLng:-20, maxLng:5 },
  { minLat:25, maxLat:55, minLng:-10, maxLng:30 },
  { minLat:40, maxLat:60, minLng:-60, maxLng:-20 },
];

const PORTS = [
  { id:"p1", name:"Halifax", country:"Canada", flag:"🇨🇦", lat:44.6, lng:-63.6, type:"Commercial", traffic:"Élevé", berths:24, depth:"15m", status:"Opérationnel" },
  { id:"p2", name:"Abidjan", country:"Côte d'Ivoire", flag:"🇨🇮", lat:5.3, lng:-4.0, type:"Commercial", traffic:"Très élevé", berths:38, depth:"14m", status:"Opérationnel" },
  { id:"p3", name:"Rotterdam", country:"Pays-Bas", flag:"🇳🇱", lat:51.9, lng:4.5, type:"Hub mondial", traffic:"Très élevé", berths:120, depth:"24m", status:"Opérationnel" },
  { id:"p4", name:"Le Havre", country:"France", flag:"🇫🇷", lat:49.5, lng:0.1, type:"Commercial", traffic:"Élevé", berths:67, depth:"17m", status:"Opérationnel" },
  { id:"p5", name:"Dakar", country:"Sénégal", flag:"🇸🇳", lat:14.7, lng:-17.4, type:"Régional", traffic:"Moyen", berths:18, depth:"11m", status:"Opérationnel" },
  { id:"p6", name:"Lagos", country:"Nigeria", flag:"🇳🇬", lat:6.5, lng:3.4, type:"Commercial", traffic:"Élevé", berths:44, depth:"13m", status:"Opérationnel" },
  { id:"p7", name:"Marseille", country:"France", flag:"🇫🇷", lat:43.3, lng:5.4, type:"Commercial", traffic:"Élevé", berths:55, depth:"16m", status:"Opérationnel" },
  { id:"p8", name:"Hambourg", country:"Allemagne", flag:"🇩🇪", lat:53.5, lng:10.0, type:"Hub européen", traffic:"Très élevé", berths:96, depth:"18m", status:"Opérationnel" },
  { id:"p9", name:"Barcelone", country:"Espagne", flag:"🇪🇸", lat:41.4, lng:2.2, type:"Commercial", traffic:"Élevé", berths:42, depth:"15m", status:"Opérationnel" },
  { id:"p10", name:"Casablanca", country:"Maroc", flag:"🇲🇦", lat:33.6, lng:-7.6, type:"Régional", traffic:"Moyen", berths:28, depth:"12m", status:"Maintenance" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function posAlongRoute(progress) {
  const total = ROUTE.length - 1;
  const pos = Math.min(progress * total, total - 0.0001);
  const seg = Math.floor(pos);
  const frac = pos - seg;
  return [lerp(ROUTE[seg][0], ROUTE[seg+1][0], frac), lerp(ROUTE[seg][1], ROUTE[seg+1][1], frac)];
}
function headingAlongRoute(progress) {
  const total = ROUTE.length - 1;
  const pos = Math.min(progress * total, total - 0.0001);
  const seg = Math.floor(pos);
  const dy = ROUTE[seg+1][0] - ROUTE[seg][0];
  const dx = ROUTE[seg+1][1] - ROUTE[seg][1];
  return (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
}
function etaDate(progress) {
  const daysLeft = Math.round((1 - progress) * 15);
  const d = new Date();
  d.setDate(d.getDate() + daysLeft);
  return d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}

function generateVessels() {
  const typeKeys = ["cargo","cargo","cargo","tanker","tanker","passenger","fishing","fishing","military"];
  const list = [];
  const [sLat, sLng] = posAlongRoute(0.38);
  list.push({
    id:"special-001", name:"MV Abidjan Star", type:"special",
    mmsi:"316001234", flag:"🇨🇦",
    lat:sLat, lng:sLng,
    speed:14.2, heading:headingAlongRoute(0.38),
    from:"Halifax, Canada", to:"Abidjan, Côte d'Ivoire",
    progress:0.38, special:true, status:"En route",
    dlat:0, dlng:0,
    cargo:"Équipements industriels",
    built:2019, length:"225m", grossTonnage:"42,500 GT",
  });
  for (let i = 0; i < 42; i++) {
    const r = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const destinations = ["Rotterdam","Marseille","Dakar","Lagos","Le Havre","Hambourg","Barcelone","Casablanca","Montréal","New York"];
    list.push({
      id:"v"+i, name:NAMES[i % NAMES.length], type,
      mmsi:String(200000000 + Math.floor(Math.random()*99999999)),
      flag:FLAGS[Math.floor(Math.random()*FLAGS.length)],
      lat:r.minLat + Math.random()*(r.maxLat-r.minLat),
      lng:r.minLng + Math.random()*(r.maxLng-r.minLng),
      speed:+(5 + Math.random()*16).toFixed(1),
      heading:Math.random()*360,
      dlat:(Math.random()-0.5)*0.015,
      dlng:(Math.random()-0.5)*0.02,
      from:destinations[Math.floor(Math.random()*destinations.length)],
      to:destinations[Math.floor(Math.random()*destinations.length)],
      special:false,
      status:["En route","À l'ancre","En manœuvre"][Math.floor(Math.random()*3)],
      progress:0,
      cargo:["Conteneurs","Pétrole brut","GNL","Minerai","Produits chimiques","Vrac sec"][Math.floor(Math.random()*6)],
      built:2005+Math.floor(Math.random()*18),
      length:["180m","210m","250m","320m","145m"][Math.floor(Math.random()*5)],
      grossTonnage:["18,000 GT","32,500 GT","55,000 GT","78,000 GT","12,000 GT"][Math.floor(Math.random()*5)],
    });
  }
  return list;
}

function shipSVG(heading, color, size, special) {
  const s = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s*2}" height="${s*2}" viewBox="${-s} ${-s} ${s*2} ${s*2}">
    <g transform="rotate(${heading})">
      <polygon points="0,${-s*0.9} ${s*0.45},${s*0.7} 0,${s*0.4} ${-s*0.45},${s*0.7}" fill="${color}" stroke="${special?"#fff":"rgba(0,0,0,0.35)"}" stroke-width="${special?1.5:0.8}" opacity="0.95"/>
      ${special ? `<circle cx="0" cy="0" r="${s*0.35}" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.5"/>` : ""}
    </g>
  </svg>`;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function StatCard({ value, label, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1 bg-slate-900/60">
      <span className="font-mono text-lg font-bold" style={{ color, fontFamily:"'Share Tech Mono'" }}>{value}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

function VesselItem({ vessel, selected, onClick }) {
  const cfg = TYPES[vessel.type];
  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-white/5 transition-all duration-150
        ${selected ? "bg-cyan-400/10" : "hover:bg-white/5"}
        ${vessel.special ? "border-l-2 border-l-yellow-400" : ""}`}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:cfg.color }}/>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ fontFamily:"'Exo 2'" }}>{vessel.name}</div>
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">{cfg.label} · {vessel.flag} · {vessel.to}</div>
      </div>
      <div className="text-[12px] text-slate-400 flex-shrink-0" style={{ fontFamily:"'Share Tech Mono'" }}>{vessel.speed} kn</div>
    </div>
  );
}

function InfoRow({ label, value, highlight, gold }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-medium ${highlight?"text-cyan-400":gold?"text-yellow-400":"text-slate-200"}`}
        style={{ fontFamily:"'Share Tech Mono'" }}>{value}</span>
    </div>
  );
}

// ─── PAGE: EXPLORER ───────────────────────────────────────────────────────────
function ExplorerPage({ vessels, onSelectVessel, setActiveTab }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selected, setSelected] = useState(null);

  const filtered = vessels
    .filter(v => {
      const q = query.toLowerCase();
      const matchQ = !q || v.name.toLowerCase().includes(q) || v.mmsi.includes(q) || v.flag.includes(q) || v.from.toLowerCase().includes(q) || v.to.toLowerCase().includes(q);
      const matchT = typeFilter === "all" || v.type === typeFilter;
      const matchS = statusFilter === "all" || v.status === statusFilter;
      return matchQ && matchT && matchS;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "speed") return b.speed - a.speed;
      if (sortBy === "type") return a.type.localeCompare(b.type);
      return 0;
    });

  function handleSelect(v) {
    setSelected(selected?.id === v.id ? null : v);
  }

  function handleTrackOnMap(v) {
    onSelectVessel(v.id);
    setActiveTab("Carte Live");
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-cyan-400/15 bg-slate-900/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/25 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-cyan-400" style={{ fontFamily:"'Rajdhani', sans-serif" }}>Explorer les navires</h2>
          <span className="ml-auto text-sm text-slate-400" style={{ fontFamily:"'Share Tech Mono'" }}>{filtered.length} / {vessels.length} navires</span>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Nom, MMSI, port..."
              className="w-full bg-slate-800/60 border border-cyan-400/20 rounded-lg text-sm text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2 outline-none focus:border-cyan-400/60 transition-all"/>
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-800/60 border border-cyan-400/20 rounded-lg text-sm text-slate-300 px-3 py-2 outline-none focus:border-cyan-400/60">
            <option value="all">Tous types</option>
            {Object.entries(TYPES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800/60 border border-cyan-400/20 rounded-lg text-sm text-slate-300 px-3 py-2 outline-none focus:border-cyan-400/60">
            <option value="all">Tous statuts</option>
            <option value="En route">En route</option>
            <option value="À l'ancre">À l'ancre</option>
            <option value="En manœuvre">En manœuvre</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-slate-800/60 border border-cyan-400/20 rounded-lg text-sm text-slate-300 px-3 py-2 outline-none focus:border-cyan-400/60">
            <option value="name">Trier : Nom</option>
            <option value="speed">Trier : Vitesse</option>
            <option value="type">Trier : Type</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p className="text-sm">Aucun navire trouvé</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/95 border-b border-cyan-400/15">
                <tr>
                  {["Navire","Type","Pavillon","Départ","Destination","Vitesse","Statut",""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const cfg = TYPES[v.type];
                  const isSelected = selected?.id === v.id;
                  return (
                    <tr key={v.id} onClick={() => handleSelect(v)}
                      className={`border-b border-white/5 cursor-pointer transition-all
                        ${isSelected ? "bg-cyan-400/8" : "hover:bg-white/4"}
                        ${v.special ? "border-l-2 border-l-yellow-400" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:cfg.color }}/>
                          <span className="font-semibold text-slate-100" style={{ fontFamily:"'Exo 2'" }}>
                            {v.special && <span className="text-yellow-400 mr-1">★</span>}{v.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 pl-4" style={{ fontFamily:"'Share Tech Mono'" }}>{v.mmsi}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${cfg.tailwind}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{v.flag}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{v.from}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{v.to}</td>
                      <td className="px-4 py-3 text-cyan-400 font-mono text-xs">{v.speed} kn</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          v.status === "En route" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/25" :
                          v.status === "À l'ancre" ? "bg-orange-400/10 text-orange-400 border border-orange-400/25" :
                          "bg-blue-400/10 text-blue-400 border border-blue-400/25"}`}>{v.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); handleTrackOnMap(v); }}
                          className="text-[11px] text-cyan-400 hover:bg-cyan-400/15 bg-cyan-400/5 border border-cyan-400/20 px-2.5 py-1 rounded transition-all whitespace-nowrap">
                          ⊕ Carte
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 border-l border-cyan-400/15 overflow-y-auto scrollbar-thin bg-slate-900/30">
            <div className="p-4 border-b border-cyan-400/15 bg-gradient-to-br from-cyan-400/5 to-transparent">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-base text-slate-100" style={{ fontFamily:"'Rajdhani', sans-serif" }}>{selected.name}</h3>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 flex-shrink-0">✕</button>
              </div>
              {selected.special && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">★ Spécial</span>
              )}
            </div>
            <div className="p-4 grid grid-cols-1 gap-4">
              <InfoRow label="MMSI" value={selected.mmsi}/>
              <InfoRow label="Pavillon" value={selected.flag}/>
              <InfoRow label="Type" value={TYPES[selected.type].label}/>
              <InfoRow label="Statut" value={selected.status}/>
              <InfoRow label="Vitesse" value={`${selected.speed} kn`} highlight/>
              <InfoRow label="Cap" value={`${Math.round(selected.heading)}°`}/>
              <InfoRow label="Position" value={`${selected.lat.toFixed(3)}°, ${selected.lng.toFixed(3)}°`}/>
              <InfoRow label="Départ" value={selected.from} gold/>
              <InfoRow label="Destination" value={selected.to} gold/>
              <InfoRow label="Cargaison" value={selected.cargo || "N/A"}/>
              <InfoRow label="Construit" value={selected.built || "N/A"}/>
              <InfoRow label="Longueur" value={selected.length || "N/A"}/>
              <InfoRow label="Jauge brute" value={selected.grossTonnage || "N/A"}/>
              {selected.special && (
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Progression</div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      style={{ width:`${Math.round(selected.progress*100)}%` }}/>
                  </div>
                  <div className="text-xs text-cyan-400" style={{ fontFamily:"'Share Tech Mono'" }}>{Math.round(selected.progress*100)}% — ETA {etaDate(selected.progress)}</div>
                </div>
              )}
              <button onClick={() => handleTrackOnMap(selected)}
                className="w-full text-sm text-cyan-400 bg-cyan-400/8 hover:bg-cyan-400/15 border border-cyan-400/25 py-2 rounded-lg transition-all">
                ⊕ Suivre sur la carte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE: FLOTTE ─────────────────────────────────────────────────────────────
function FlottePage({ vessels }) {
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? vessels : vessels.filter(v => v.type === filter);

  const statsByType = Object.entries(TYPES).map(([key, cfg]) => ({
    key, cfg, count: vessels.filter(v => v.type === key).length,
  }));

  const enRoute = vessels.filter(v => v.status === "En route").length;
  const ancre = vessels.filter(v => v.status === "À l'ancre").length;
  const manoeuvre = vessels.filter(v => v.status === "En manœuvre").length;
  const avgSpeed = (vessels.reduce((s, v) => s + v.speed, 0) / vessels.length).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2">
              <path d="M3 17l4-8 4 4 4-6 4 4"/><path d="M3 20h18"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-emerald-400" style={{ fontFamily:"'Rajdhani', sans-serif" }}>Gestion de Flotte</h2>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label:"Total navires", value:vessels.length, color:"#00d4ff", icon:"🚢" },
            { label:"En route", value:enRoute, color:"#2ed573", icon:"⚡" },
            { label:"À l'ancre", value:ancre, color:"#ffa502", icon:"⚓" },
            { label:"Vitesse moy.", value:`${avgSpeed} kn`, color:"#a29bfe", icon:"💨" },
          ].map(k => (
            <div key={k.label} className="bg-slate-900/60 border border-cyan-400/10 rounded-xl p-4">
              <div className="text-2xl mb-1">{k.icon}</div>
              <div className="text-2xl font-bold" style={{ color:k.color, fontFamily:"'Share Tech Mono'" }}>{k.value}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Type breakdown */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {statsByType.map(({ key, cfg, count }) => (
            <button key={key} onClick={() => setFilter(filter === key ? "all" : key)}
              className={`rounded-xl p-3 border text-center transition-all ${
                filter === key ? "border-opacity-60 bg-opacity-20" : "border-white/8 bg-slate-900/40 hover:bg-slate-800/40"
              }`}
              style={{ borderColor: filter === key ? cfg.color : undefined, background: filter === key ? cfg.color+"22" : undefined }}>
              <div className="text-xl font-bold" style={{ color:cfg.color, fontFamily:"'Share Tech Mono'" }}>{count}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{cfg.label}</div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-400">{filtered.length} navires affichés</span>
          <div className="flex gap-2">
            <button onClick={() => setView("grid")}
              className={`px-3 py-1.5 rounded text-xs transition-all ${view==="grid" ? "bg-cyan-400/15 text-cyan-400 border border-cyan-400/25" : "text-slate-400 hover:text-slate-200 border border-white/10"}`}>
              ⊞ Grille
            </button>
            <button onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded text-xs transition-all ${view==="list" ? "bg-cyan-400/15 text-cyan-400 border border-cyan-400/25" : "text-slate-400 hover:text-slate-200 border border-white/10"}`}>
              ≡ Liste
            </button>
          </div>
        </div>

        {/* Grid view */}
        {view === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => {
              const cfg = TYPES[v.type];
              return (
                <div key={v.id} className={`bg-slate-900/50 border rounded-xl p-4 hover:bg-slate-800/50 transition-all cursor-pointer
                  ${v.special ? "border-yellow-400/40 shadow-lg shadow-yellow-400/5" : "border-white/8"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {v.special && <span className="text-yellow-400">★</span>}
                        <h3 className="font-bold text-slate-100 text-sm" style={{ fontFamily:"'Exo 2'" }}>{v.name}</h3>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.tailwind}`}>{cfg.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl">{v.flag}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily:"'Share Tech Mono'" }}>{v.mmsi}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-500 mb-0.5">Vitesse</div>
                      <div className="text-cyan-400 font-mono font-bold">{v.speed} kn</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-500 mb-0.5">Statut</div>
                      <div className={`font-semibold ${v.status==="En route"?"text-emerald-400":v.status==="À l'ancre"?"text-orange-400":"text-blue-400"}`}>{v.status}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 col-span-2">
                      <div className="text-slate-500 mb-0.5">Route</div>
                      <div className="text-slate-300 truncate">{v.from} → {v.to}</div>
                    </div>
                    {v.cargo && (
                      <div className="bg-slate-800/50 rounded-lg p-2 col-span-2">
                        <div className="text-slate-500 mb-0.5">Cargaison</div>
                        <div className="text-slate-300">{v.cargo}</div>
                      </div>
                    )}
                  </div>
                  {v.special && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Progression</span>
                        <span className="text-cyan-400">{Math.round(v.progress*100)}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                          style={{ width:`${Math.round(v.progress*100)}%` }}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <div className="bg-slate-900/40 border border-cyan-400/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 border-b border-cyan-400/15">
                <tr>
                  {["Navire","Type","Pavillon","Route","Vitesse","Cargaison","Statut"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const cfg = TYPES[v.type];
                  return (
                    <tr key={v.id} className={`border-b border-white/5 hover:bg-white/4 transition-all ${v.special?"border-l-2 border-l-yellow-400":""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background:cfg.color }}/>
                          <span className="font-semibold text-slate-100" style={{ fontFamily:"'Exo 2'" }}>
                            {v.special && <span className="text-yellow-400 mr-1">★</span>}{v.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full border ${cfg.tailwind}`}>{cfg.label}</span></td>
                      <td className="px-4 py-3 text-lg">{v.flag}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{v.from} → {v.to}</td>
                      <td className="px-4 py-3 text-cyan-400 font-mono text-xs">{v.speed} kn</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{v.cargo || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          v.status==="En route"?"bg-emerald-400/10 text-emerald-400 border border-emerald-400/25":
                          v.status==="À l'ancre"?"bg-orange-400/10 text-orange-400 border border-orange-400/25":
                          "bg-blue-400/10 text-blue-400 border border-blue-400/25"}`}>{v.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE: PORTS ──────────────────────────────────────────────────────────────
function PortsPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = PORTS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase())
  );

  const operational = PORTS.filter(p => p.status === "Opérationnel").length;
  const totalBerths = PORTS.reduce((s, p) => s + p.berths, 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-violet-400/10 border border-violet-400/25 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-violet-400" style={{ fontFamily:"'Rajdhani', sans-serif" }}>Réseau Portuaire</h2>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label:"Ports référencés", value:PORTS.length, color:"#a29bfe", icon:"🏛️" },
            { label:"Opérationnels", value:operational, color:"#2ed573", icon:"✅" },
            { label:"Total postes", value:totalBerths, color:"#00d4ff", icon:"⚓" },
            { label:"Zones couvertes", value:"3 continents", color:"#ffd700", icon:"🌍" },
          ].map(k => (
            <div key={k.label} className="bg-slate-900/60 border border-cyan-400/10 rounded-xl p-4">
              <div className="text-2xl mb-1">{k.icon}</div>
              <div className="text-2xl font-bold" style={{ color:k.color, fontFamily:"'Share Tech Mono'" }}>{k.value}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Chercher un port ou pays..."
            className="w-full bg-slate-800/60 border border-violet-400/20 rounded-lg text-sm text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2 outline-none focus:border-violet-400/60 transition-all"/>
        </div>

        {/* Port grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(port => (
            <div key={port.id} onClick={() => setSelected(selected?.id === port.id ? null : port)}
              className={`bg-slate-900/50 border rounded-xl p-5 cursor-pointer hover:bg-slate-800/50 transition-all
                ${selected?.id === port.id ? "border-violet-400/50 shadow-lg shadow-violet-400/5" : "border-white/8"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{port.flag}</span>
                    <h3 className="font-bold text-slate-100 text-base" style={{ fontFamily:"'Rajdhani', sans-serif" }}>{port.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">{port.country}</p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${
                  port.status === "Opérationnel"
                    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/25"
                    : "text-orange-400 bg-orange-400/10 border-orange-400/25"}`}>
                  {port.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <div className="text-slate-500 mb-0.5">Type</div>
                  <div className="text-violet-400 font-semibold">{port.type}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <div className="text-slate-500 mb-0.5">Trafic</div>
                  <div className="text-slate-300">{port.traffic}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <div className="text-slate-500 mb-0.5">Postes</div>
                  <div className="text-cyan-400 font-mono font-bold">{port.berths}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <div className="text-slate-500 mb-0.5">Tirant d'eau</div>
                  <div className="text-slate-300">{port.depth}</div>
                </div>
              </div>

              {selected?.id === port.id && (
                <div className="mt-3 pt-3 border-t border-white/8">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Coordonnées</div>
                  <div className="text-xs text-cyan-400 font-mono">{port.lat.toFixed(4)}°N, {Math.abs(port.lng).toFixed(4)}°{port.lng >= 0 ? "E" : "W"}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MarineTracker() {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const routeLineRef = useRef(null);
  const [vessels, setVessels] = useState(() => generateVessels());
  const [selectedId, setSelectedId] = useState("special-001");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [coords, setCoords] = useState("Hover pour coords");
  const [activeTab, setActiveTab] = useState("Carte Live");

  const selected = vessels.find(v => v.id === selectedId);

  // ── Init Leaflet ────────────────────────────────────────────────────────────
  useLeaflet((L) => {
    if (leafletMapRef.current) return;
    const map = L.map(mapRef.current, { center:[25,-25], zoom:4, zoomControl:false });
    L.control.zoom({ position:"topright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:"© OpenStreetMap", maxZoom:18,
    }).addTo(map);
    map.on("mousemove", e => {
      const la=e.latlng.lat, lo=e.latlng.lng;
      setCoords(`${Math.abs(la).toFixed(4)}°${la>=0?"N":"S"} ${Math.abs(lo).toFixed(4)}°${lo>=0?"E":"W"}`);
    });
    routeLineRef.current = L.polyline(ROUTE, { color:"#ffd700", weight:2, opacity:0.5, dashArray:"8, 6" }).addTo(map);
    const portIcon = (color) => L.divIcon({
      html:`<div style="width:10px;height:10px;background:${color};border:2px solid #fff;border-radius:2px;transform:rotate(45deg)"></div>`,
      className:"", iconSize:[10,10], iconAnchor:[5,5],
    });
    L.marker([44.6,-63.6], { icon:portIcon("#00d4ff") }).addTo(map).bindTooltip("🇨🇦 Halifax (Départ)", { direction:"top" });
    L.marker([5.3,-4.0], { icon:portIcon("#ffd700") }).addTo(map).bindTooltip("🇨🇮 Abidjan (Destination)", { direction:"top" });
    leafletMapRef.current = map;
    setVessels(prev => { prev.forEach(v => addMarker(L, map, v)); return prev; });
    setTimeout(() => map.flyTo([25,-30], 3, { duration:2 }), 600);
  });

  function addMarker(L, map, v) {
    const cfg = TYPES[v.type];
    const size = v.special ? 18 : 13;
    const icon = L.divIcon({
      html:shipSVG(v.heading, cfg.color, size, v.special),
      className:"cursor-pointer", iconSize:[size*2,size*2], iconAnchor:[size,size],
    });
    const m = L.marker([v.lat, v.lng], { icon }).addTo(map);
    m.on("click", () => setSelectedId(v.id));
    markersRef.current[v.id] = m;
  }

  // ── Animation ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setVessels(prev => {
        const L = window.L;
        return prev.map(v => {
          let u = { ...v };
          if (v.special) {
            u.progress = Math.min(v.progress + 1/(15*24*3600), 0.9999);
            const [lat,lng] = posAlongRoute(u.progress);
            u.lat=lat; u.lng=lng; u.heading=headingAlongRoute(u.progress);
          } else {
            u.lat+=v.dlat; u.lng+=v.dlng;
            u.heading=(v.heading+(Math.random()-0.5)*2+360)%360;
            if(u.lat>65||u.lat<-10) u.dlat=-v.dlat;
            if(u.lng>40||u.lng<-80) u.dlng=-v.dlng;
          }
          if(L && markersRef.current[v.id]) {
            markersRef.current[v.id].setLatLng([u.lat,u.lng]);
            const cfg=TYPES[u.type], size=u.special?18:13;
            markersRef.current[v.id].setIcon(L.divIcon({
              html:shipSVG(u.heading,cfg.color,size,u.special),
              className:"cursor-pointer", iconSize:[size*2,size*2], iconAnchor:[size,size],
            }));
          }
          return u;
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Sidebar resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => leafletMapRef.current?.invalidateSize(), 310);
  }, [sidebarOpen]);

  // ── Invalidate map when switching back to Carte Live ────────────────────────
  useEffect(() => {
    if (activeTab === "Carte Live") {
      setTimeout(() => leafletMapRef.current?.invalidateSize(), 50);
    }
  }, [activeTab]);

  const centerOnSelected = useCallback(() => {
    if (!selected || !leafletMapRef.current) return;
    leafletMapRef.current.flyTo([selected.lat, selected.lng], 6, { duration:1.2 });
  }, [selected]);

  const searchResults = search.trim()
    ? vessels.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  function selectFromSearch(v) {
    setSelectedId(v.id); setSearch(v.name); setShowResults(false);
    leafletMapRef.current?.flyTo([v.lat,v.lng], 7, { duration:1.5 });
  }

  const cargoCount = vessels.filter(v => v.type==="cargo"||v.type==="special").length;
  const tankerCount = vessels.filter(v => v.type==="tanker").length;
  const otherCount = vessels.filter(v => !["cargo","tanker","special"].includes(v.type)).length;

  const NAV_TABS = ["Carte Live","Explorer","Flotte","Ports"];
  const TAB_COLORS = { "Carte Live":"text-cyan-400 bg-cyan-400/10", "Explorer":"text-emerald-400 bg-emerald-400/10", "Flotte":"text-blue-400 bg-blue-400/10", "Ports":"text-violet-400 bg-violet-400/10" };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden"
      style={{ fontFamily:"'Exo 2', sans-serif" }}>

      {/* ── TOPBAR ── */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 bg-slate-900 border-b border-cyan-400/20 z-50" style={{height:"52px"}}>
        <div className="flex items-center gap-2 text-cyan-400 font-bold flex-shrink-0"
          style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"20px" }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M4 22 L8 14 L12 17 L16 8 L20 17 L24 14 L28 22 Z" stroke="#00d4ff" strokeWidth="2" fill="none"/>
            <path d="M2 24 L30 24" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
            <circle cx="16" cy="8" r="2" fill="#00ff9d"/>
          </svg>
          MarineTrack
        </div>

        <nav className="flex gap-1 ml-2">
          {NAV_TABS.map(n => (
            <button key={n} onClick={() => setActiveTab(n)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === n ? TAB_COLORS[n] : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}>
              {n}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-2 text-emerald-400 text-xs font-bold tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          EN DIRECT
        </div>

        <div className="ml-auto relative" onBlur={() => setTimeout(()=>setShowResults(false),150)}>
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search}
              onChange={e=>{ setSearch(e.target.value); setShowResults(true); }}
              onFocus={()=>setShowResults(true)}
              placeholder="Navire, port..."
              className="bg-white/5 border border-cyan-400/20 rounded-md text-sm text-slate-100 placeholder-slate-500 pl-8 pr-3 py-1.5 outline-none focus:border-cyan-400/60 focus:bg-cyan-400/5 transition-all w-52 focus:w-64"/>
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-slate-900 border border-cyan-400/20 rounded-lg z-50 overflow-hidden shadow-xl">
              {searchResults.map(v => (
                <div key={v.id} onMouseDown={()=>selectFromSearch(v)}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-cyan-400/10 cursor-pointer text-sm border-b border-white/5 last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:TYPES[v.type].color }}/>
                  <span className="flex-1 truncate">{v.name}</span>
                  <span className="text-slate-500 text-xs">{TYPES[v.type].label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* MAP — always rendered but hidden when not on Carte Live */}
        <div className={`flex flex-1 overflow-hidden ${activeTab === "Carte Live" ? "flex" : "hidden"}`}>
          <div className="flex-1 relative z-10">
            <div ref={mapRef} className="w-full h-full" style={{ filter:"hue-rotate(195deg) saturate(0.8) brightness(0.88)" }}/>
            <div className="absolute top-3 left-3 z-50 bg-slate-950/90 border border-cyan-400/20 rounded-md px-3 py-1.5 text-xs text-slate-400 pointer-events-none" style={{ fontFamily:"'Share Tech Mono'" }}>{coords}</div>
            <div className="absolute bottom-8 left-3 z-50 bg-slate-950/90 border border-cyan-400/20 rounded-lg p-3">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-2" style={{ fontFamily:"'Rajdhani', sans-serif" }}>Types</div>
              {Object.entries(TYPES).map(([key,cfg]) => (
                <div key={key} className="flex items-center gap-2 mb-1.5 last:mb-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:cfg.color }}/>
                  <span className="text-[11px] text-slate-400">{key==="special"?"★ "+cfg.label:cfg.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSidebarOpen(o=>!o)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-slate-900 border border-r-0 border-cyan-400/20 rounded-l-lg w-7 h-14 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-colors">
              {sidebarOpen ? "❯" : "❮"}
            </button>
          </div>

          {/* Sidebar */}
          <div className={`bg-slate-950/95 border-l border-cyan-400/20 flex flex-col z-20 flex-shrink-0 overflow-hidden transition-all duration-300 ${sidebarOpen?"w-80 opacity-100":"w-0 opacity-0 pointer-events-none"}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-400/15">
              <h3 className="font-bold text-cyan-400 tracking-widest text-sm uppercase" style={{ fontFamily:"'Rajdhani', sans-serif" }}>Trafic Maritime</h3>
              <span className="bg-cyan-400/10 text-cyan-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-cyan-400/25">{vessels.length} navires</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-cyan-400/15 border-b border-cyan-400/15">
              <StatCard value={cargoCount} label="Cargo" color="#2ed573"/>
              <StatCard value={tankerCount} label="Tanker" color="#ff4757"/>
              <StatCard value={otherCount} label="Autres" color="#a29bfe"/>
            </div>
            {selected && (
              <div className="border-b border-cyan-400/15">
                <div className="px-4 pt-3 pb-2 bg-gradient-to-br from-cyan-400/5 to-emerald-400/3">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-base flex-1 truncate" style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:"17px" }}>{selected.name}</h2>
                    {selected.special && <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">★ Spécial</span>}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${TYPES[selected.type].tailwind}`}>{TYPES[selected.type].label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4 py-3">
                  <InfoRow label="MMSI" value={selected.mmsi}/>
                  <InfoRow label="Pavillon" value={selected.flag}/>
                  <InfoRow label="Vitesse" value={`${selected.speed} kn`} highlight/>
                  <InfoRow label="Cap" value={`${Math.round(selected.heading)}°`}/>
                  <InfoRow label="Position" value={`${selected.lat.toFixed(3)}, ${selected.lng.toFixed(3)}`}/>
                  <InfoRow label="Statut" value={selected.status}/>
                  <InfoRow label="Départ" value={selected.from} gold/>
                  <InfoRow label="Destination" value={selected.to} gold/>
                </div>
                {selected.special && (
                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                      <span>Progression du trajet</span>
                      <span className="text-cyan-400 font-bold">{Math.round(selected.progress*100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000"
                        style={{ width:`${Math.round(selected.progress*100)}%` }}/>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">🇨🇦 <span className="text-slate-200 font-semibold">Halifax</span></span>
                      <span className="text-slate-400">🇨🇮 <span className="text-slate-200 font-semibold">Abidjan</span></span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                      ETA : <span className="text-cyan-400" style={{ fontFamily:"'Share Tech Mono'" }}>{etaDate(selected.progress)}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 px-4 pb-3">
                  <button onClick={() => setSelectedId(null)} className="text-xs text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-400/10 border border-white/10 px-3 py-1.5 rounded transition-all">✕ Fermer</button>
                  <button onClick={centerOnSelected} className="text-xs text-cyan-400 hover:bg-cyan-400/15 bg-cyan-400/8 border border-cyan-400/25 px-3 py-1.5 rounded transition-all">⊕ Centrer</button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-4 py-2">Navires à proximité</div>
              {vessels.map(v => (
                <VesselItem key={v.id} vessel={v} selected={selectedId===v.id} onClick={()=>setSelectedId(v.id)}/>
              ))}
            </div>
          </div>
        </div>

        {/* OTHER PAGES */}
        {activeTab === "Explorer" && (
          <ExplorerPage vessels={vessels} onSelectVessel={setSelectedId} setActiveTab={setActiveTab}/>
        )}
        {activeTab === "Flotte" && (
          <FlottePage vessels={vessels}/>
        )}
        {activeTab === "Ports" && (
          <PortsPage/>
        )}
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width:3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:rgba(0,212,255,0.2); border-radius:2px; }
        .leaflet-tile { filter:none !important; }
        .leaflet-popup-content-wrapper { background:#0d1f3c !important; border:1px solid rgba(0,212,255,0.2) !important; color:#e0f0ff !important; font-family:'Exo 2',sans-serif !important; }
        .leaflet-popup-tip { background:#0d1f3c !important; }
        select option { background:#1e293b; color:#e2e8f0; }
      `}</style>
    </div>
  );
}