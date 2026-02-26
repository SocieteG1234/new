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

const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const ROUTE = [
  [44.6, -63.6], [43.0, -55.0], [40.0, -45.0], [35.0, -35.0],
  [25.0, -25.0], [15.0, -20.0], [10.0, -15.0], [7.0, -10.0], [5.3, -4.0],
];

// Couleur exclusive au MV Abidjan Star — rouge pur, distinct de tous les autres
const ABIDJAN_COLOR = "#ff0000";
const ABIDJAN_SIZE = 18; // Plus grand que les autres (13)

const TYPES = {
  cargo:    { color: "#2ed573", label: "Cargo",     tailwind: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  tanker:   { color: "#ff4757", label: "Tanker",    tailwind: "text-red-400 bg-red-400/10 border-red-400/30" },
  passenger:{ color: "#1e90ff", label: "Passager",  tailwind: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  fishing:  { color: "#ffa502", label: "Peche",     tailwind: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  military: { color: "#a29bfe", label: "Militaire", tailwind: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
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
  { id:"p1", name:"Halifax", country:"Canada", flag:"🇨🇦", lat:44.6, lng:-63.6, type:"Commercial", traffic:"Eleve", berths:24, depth:"15m", status:"Operationnel" },
  { id:"p2", name:"Abidjan", country:"Cote d'Ivoire", flag:"🇨🇮", lat:5.3, lng:-4.0, type:"Commercial", traffic:"Tres eleve", berths:38, depth:"14m", status:"Operationnel" },
  { id:"p3", name:"Rotterdam", country:"Pays-Bas", flag:"🇳🇱", lat:51.9, lng:4.5, type:"Hub mondial", traffic:"Tres eleve", berths:120, depth:"24m", status:"Operationnel" },
  { id:"p4", name:"Le Havre", country:"France", flag:"🇫🇷", lat:49.5, lng:0.1, type:"Commercial", traffic:"Eleve", berths:67, depth:"17m", status:"Operationnel" },
  { id:"p5", name:"Dakar", country:"Senegal", flag:"🇸🇳", lat:14.7, lng:-17.4, type:"Regional", traffic:"Moyen", berths:18, depth:"11m", status:"Operationnel" },
  { id:"p6", name:"Lagos", country:"Nigeria", flag:"🇳🇬", lat:6.5, lng:3.4, type:"Commercial", traffic:"Eleve", berths:44, depth:"13m", status:"Operationnel" },
  { id:"p7", name:"Marseille", country:"France", flag:"🇫🇷", lat:43.3, lng:5.4, type:"Commercial", traffic:"Eleve", berths:55, depth:"16m", status:"Operationnel" },
  { id:"p8", name:"Hambourg", country:"Allemagne", flag:"🇩🇪", lat:53.5, lng:10.0, type:"Hub europeen", traffic:"Tres eleve", berths:96, depth:"18m", status:"Operationnel" },
  { id:"p9", name:"Barcelone", country:"Espagne", flag:"🇪🇸", lat:41.4, lng:2.2, type:"Commercial", traffic:"Eleve", berths:42, depth:"15m", status:"Operationnel" },
  { id:"p10", name:"Casablanca", country:"Maroc", flag:"🇲🇦", lat:33.6, lng:-7.6, type:"Regional", traffic:"Moyen", berths:28, depth:"12m", status:"Maintenance" },
];

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
const DEPARTURE_DATE = new Date("2026-03-31");
const ARRIVAL_DATE = new Date("2026-06-10");
const TOTAL_DURATION_MS = ARRIVAL_DATE - DEPARTURE_DATE;

function etaDate(progress) {
  const msLeft = (1 - progress) * TOTAL_DURATION_MS;
  const eta = new Date(ARRIVAL_DATE - msLeft + msLeft); // always arrival
  return ARRIVAL_DATE.toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}

function getProgressFromDates() {
  const now = new Date();
  if (now <= DEPARTURE_DATE) return 0;
  if (now >= ARRIVAL_DATE) return 0.9999;
  return Math.min((now - DEPARTURE_DATE) / TOTAL_DURATION_MS, 0.9999);
}

function getDaysLeft(progress) {
  const msLeft = (1 - progress) * TOTAL_DURATION_MS;
  return Math.max(0, Math.round(msLeft / (1000 * 60 * 60 * 24)));
}

function generateVessels() {
  const typeKeys = ["cargo","cargo","cargo","tanker","tanker","passenger","fishing","fishing","military"];
  const list = [];
  const [sLat, sLng] = posAlongRoute(0);
  list.push({
    id:"route-001", name:"MV Abidjan Star", type:"cargo",
    mmsi:"316001234", flag:"🇨🇦",
    lat:sLat, lng:sLng,
    speed:14.2, heading:headingAlongRoute(0),
    from:"Halifax, Canada", to:"Abidjan, Cote d'Ivoire",
    progress: getProgressFromDates(), status:"En route",
    dlat:0, dlng:0,
    cargo:"Equipements industriels",
    built:2019, length:"225m", grossTonnage:"42,500 GT",
  });
  for (let i = 0; i < 42; i++) {
    const r = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const destinations = ["Rotterdam","Marseille","Dakar","Lagos","Le Havre","Hambourg","Barcelone","Casablanca","Montreal","New York"];
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
      status:["En route","A l'ancre","En manoeuvre"][Math.floor(Math.random()*3)],
      progress:0,
      cargo:["Conteneurs","Petrole brut","GNL","Minerai","Produits chimiques","Vrac sec"][Math.floor(Math.random()*6)],
      built:2005+Math.floor(Math.random()*18),
      length:["180m","210m","250m","320m","145m"][Math.floor(Math.random()*5)],
      grossTonnage:["18,000 GT","32,500 GT","55,000 GT","78,000 GT","12,000 GT"][Math.floor(Math.random()*5)],
    });
  }
  return list;
}

// SVG navire — MV Abidjan Star reçoit un halo rouge pulsant + contour blanc
function shipSVG(heading, color, size, isAbidjan = false) {
  const s = size;
  const halo = isAbidjan
    ? `<circle r="${s*1.4}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
       <circle r="${s*1.9}" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.15"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s*2}" height="${s*2}" viewBox="${-s} ${-s} ${s*2} ${s*2}">
    ${halo}
    <g transform="rotate(${heading})">
      <polygon points="0,${-s*0.9} ${s*0.45},${s*0.7} 0,${s*0.4} ${-s*0.45},${s*0.7}"
        fill="${color}"
        stroke="${isAbidjan ? "#ffffff" : "rgba(0,0,0,0.35)"}"
        stroke-width="${isAbidjan ? 1.5 : 0.8}"
        opacity="0.97"/>
    </g>
  </svg>`;
}

function StatCard({ value, label, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1 bg-slate-900/60">
      <span className="font-mono text-lg font-bold" style={{ color, fontFamily:"'Share Tech Mono'" }}>{value}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

function VesselItem({ vessel, selected, onClick }) {
  const isAbidjan = vessel.id === "route-001";
  const cfg = TYPES[vessel.type];
  const dotColor = isAbidjan ? ABIDJAN_COLOR : cfg.color;
  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-white/5 transition-all
        ${selected ? (isAbidjan ? "bg-red-500/10" : "bg-cyan-400/10") : "hover:bg-white/5"}
        ${isAbidjan ? "border-l-2" : ""}`}
      style={isAbidjan ? { borderLeftColor: ABIDJAN_COLOR } : {}}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }}/>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold truncate ${isAbidjan ? "text-red-400" : ""}`}>{vessel.name}</div>
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">{cfg.label} {vessel.flag} {vessel.to}</div>
      </div>
      <div className="text-[12px] text-slate-400 flex-shrink-0">{vessel.speed} kn</div>
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

function StatusBadge({ status }) {
  const s = {
    "En route":"bg-emerald-400/10 text-emerald-400 border-emerald-400/25",
    "A l'ancre":"bg-orange-400/10 text-orange-400 border-orange-400/25",
    "En manoeuvre":"bg-blue-400/10 text-blue-400 border-blue-400/25",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s[status]||s["En manoeuvre"]}`}>{status}</span>;
}

// ─── EXPLORER ─────────────────────────────────────────────────────────────────
function ExplorerPage({ vessels, onSelectVessel, setActiveTab }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const filtered = vessels.filter(v => {
    const q = query.toLowerCase();
    return (!q || v.name.toLowerCase().includes(q) || v.mmsi.includes(q) || v.from.toLowerCase().includes(q) || v.to.toLowerCase().includes(q))
      && (typeFilter==="all" || v.type===typeFilter)
      && (statusFilter==="all" || v.status===statusFilter);
  }).sort((a,b) => sortBy==="speed"?b.speed-a.speed:sortBy==="type"?a.type.localeCompare(b.type):a.name.localeCompare(b.name));

  function pick(v) {
    if (selected?.id===v.id) { setSelected(null); setShowDetail(false); }
    else { setSelected(v); setShowDetail(true); }
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
      <div className="flex-shrink-0 px-4 py-3 border-b border-cyan-400/15 bg-slate-900/40">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-bold text-cyan-400" style={{ fontFamily:"'Rajdhani'" }}>Explorer</h2>
          <span className="ml-auto text-xs text-slate-500">{filtered.length}/{vessels.length} navires</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, MMSI..."
            className="min-w-28 flex-shrink-0 bg-slate-800/60 border border-cyan-400/20 rounded-lg text-sm text-slate-100 placeholder-slate-500 px-3 py-1.5 outline-none focus:border-cyan-400/50"/>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
            className="flex-shrink-0 bg-slate-800/60 border border-cyan-400/20 rounded-lg text-xs text-slate-300 px-2 py-1.5 outline-none">
            <option value="all">Tous types</option>
            {Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="flex-shrink-0 bg-slate-800/60 border border-cyan-400/20 rounded-lg text-xs text-slate-300 px-2 py-1.5 outline-none">
            <option value="all">Tous statuts</option>
            <option>En route</option><option>A l'ancre</option><option>En manoeuvre</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            className="flex-shrink-0 bg-slate-800/60 border border-cyan-400/20 rounded-lg text-xs text-slate-300 px-2 py-1.5 outline-none">
            <option value="name">Nom</option><option value="speed">Vitesse</option><option value="type">Type</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative">
        <div className={`flex-1 overflow-y-auto ${showDetail?"hidden md:block":""}`} style={{ scrollbarWidth:"thin" }}>
          {filtered.length===0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Aucun navire</div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-white/5">
                {filtered.map(v => {
                  const isAbidjan = v.id === "route-001";
                  const cfg = TYPES[v.type];
                  const dotColor = isAbidjan ? ABIDJAN_COLOR : cfg.color;
                  return (
                    <div key={v.id} onClick={()=>pick(v)}
                      className={`px-4 py-3 cursor-pointer ${selected?.id===v.id?(isAbidjan?"bg-red-500/8":"bg-cyan-400/8"):"hover:bg-white/4"}`}
                      style={isAbidjan ? { borderLeft:`2px solid ${ABIDJAN_COLOR}` } : {}}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}/>
                        <span className={`font-semibold text-sm flex-1 truncate ${isAbidjan ? "text-red-400" : "text-slate-100"}`}>{v.name}</span>
                        <span className="text-cyan-400 text-xs font-mono">{v.speed} kn</span>
                      </div>
                      <div className="flex items-center gap-2 pl-4 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cfg.tailwind}`}>{cfg.label}</span>
                        <span className="text-slate-500 text-xs">{v.flag}</span>
                        <StatusBadge status={v.status}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <table className="hidden md:table w-full text-sm">
                <thead className="sticky top-0 bg-slate-900/95 border-b border-cyan-400/15">
                  <tr>{["Navire","Type","Pavillon","De","Vers","Vitesse","Statut",""].map(h=>(
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map(v => {
                    const isAbidjan = v.id === "route-001";
                    const cfg = TYPES[v.type];
                    const dotColor = isAbidjan ? ABIDJAN_COLOR : cfg.color;
                    return (
                      <tr key={v.id} onClick={()=>pick(v)}
                        className={`border-b border-white/5 cursor-pointer ${selected?.id===v.id?(isAbidjan?"bg-red-500/8":"bg-cyan-400/8"):"hover:bg-white/4"}`}
                        style={isAbidjan ? { borderLeft:`2px solid ${ABIDJAN_COLOR}` } : {}}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}/>
                            <span className={`font-semibold ${isAbidjan ? "text-red-400" : "text-slate-100"}`}>{v.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 pl-4">{v.mmsi}</div>
                        </td>
                        <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full border ${cfg.tailwind}`}>{cfg.label}</span></td>
                        <td className="px-4 py-3">{v.flag}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{v.from}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{v.to}</td>
                        <td className="px-4 py-3 text-cyan-400 text-xs font-mono">{v.speed} kn</td>
                        <td className="px-4 py-3"><StatusBadge status={v.status}/></td>
                        <td className="px-4 py-3">
                          <button onClick={e=>{e.stopPropagation();onSelectVessel(v.id);setActiveTab("Carte Live");}}
                            className="text-[11px] text-cyan-400 bg-cyan-400/5 border border-cyan-400/20 px-2.5 py-1 rounded whitespace-nowrap hover:bg-cyan-400/15">
                            Carte
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {selected && (
          <div className={`bg-slate-900/98 border-l border-cyan-400/15 overflow-y-auto md:w-72 md:flex-shrink-0
            ${showDetail?"absolute inset-0 z-10 md:relative md:inset-auto":""}`}
            style={{ scrollbarWidth:"thin" }}>
            <div className="sticky top-0 bg-slate-900/98 px-4 py-3 border-b border-cyan-400/15 flex items-center gap-2">
              <button onClick={()=>{setSelected(null);setShowDetail(false);}} className="md:hidden text-slate-400 text-sm">← Retour</button>
              <h3 className={`font-bold flex-1 truncate text-sm ${selected.id==="route-001" ? "text-red-400" : "text-slate-100"}`}>{selected.name}</h3>
              <button onClick={()=>{setSelected(null);setShowDetail(false);}} className="hidden md:block text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            <div className="p-4 grid gap-4">
              <InfoRow label="MMSI" value={selected.mmsi}/>
              <InfoRow label="Pavillon" value={selected.flag}/>
              <InfoRow label="Type" value={TYPES[selected.type].label}/>
              <InfoRow label="Statut" value={selected.status}/>
              <InfoRow label="Vitesse" value={`${selected.speed} kn`} highlight/>
              <InfoRow label="Cap" value={`${Math.round(selected.heading)}`}/>
              <InfoRow label="Position" value={`${selected.lat.toFixed(3)}, ${selected.lng.toFixed(3)}`}/>
              <InfoRow label="Depart" value={selected.from} gold/>
              <InfoRow label="Destination" value={selected.to} gold/>
              <InfoRow label="Cargaison" value={selected.cargo||"N/A"}/>
              <InfoRow label="Construit" value={selected.built||"N/A"}/>
              <InfoRow label="Longueur" value={selected.length||"N/A"}/>
              {selected.id==="route-001" && (
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Progression</div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" style={{ width:`${Math.round(selected.progress*100)}%` }}/>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    <span className="text-red-400 font-bold">{Math.round(selected.progress*100)}%</span>
                    {" · "}Départ: <span className="text-slate-300">31 mars 2026</span>
                    {" · "}ETA: <span className="text-red-400">10 juin 2026</span>
                    {" · "}<span className="text-slate-400">J-{getDaysLeft(selected.progress)} restants</span>
                  </div>
                </div>
              )}
              <button onClick={()=>{onSelectVessel(selected.id);setActiveTab("Carte Live");}}
                className="w-full text-sm text-cyan-400 bg-cyan-400/8 hover:bg-cyan-400/15 border border-cyan-400/25 py-2 rounded-lg">
                Suivre sur la carte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FLOTTE ───────────────────────────────────────────────────────────────────
function FlottePage({ vessels }) {
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("all");

  const filtered = filter==="all" ? vessels : vessels.filter(v=>v.type===filter);
  const enRoute = vessels.filter(v=>v.status==="En route").length;
  const ancre = vessels.filter(v=>v.status==="A l'ancre").length;
  const avgSpeed = (vessels.reduce((s,v)=>s+v.speed,0)/vessels.length).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950" style={{ scrollbarWidth:"thin" }}>
      <div className="px-4 py-5 max-w-7xl mx-auto">
        <h2 className="text-base font-bold text-emerald-400 mb-4" style={{ fontFamily:"'Rajdhani'" }}>Flotte</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label:"Total", value:vessels.length, color:"#00d4ff", icon:"🚢" },
            { label:"En route", value:enRoute, color:"#2ed573", icon:"⚡" },
            { label:"A l'ancre", value:ancre, color:"#ffa502", icon:"⚓" },
            { label:"Vit. moy.", value:`${avgSpeed} kn`, color:"#a29bfe", icon:"💨" },
          ].map(k=>(
            <div key={k.label} className="bg-slate-900/60 border border-cyan-400/10 rounded-xl p-3">
              <div className="text-xl mb-1">{k.icon}</div>
              <div className="text-xl font-bold" style={{ color:k.color, fontFamily:"'Share Tech Mono'" }}>{k.value}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">{k.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth:"none" }}>
          {[{key:"all",cfg:{color:"#00d4ff",label:"Tous"},count:vessels.length},...Object.entries(TYPES).map(([k,c])=>({key:k,cfg:c,count:vessels.filter(v=>v.type===k).length}))].map(({key,cfg,count})=>(
            <button key={key} onClick={()=>setFilter(key)}
              className="flex-shrink-0 rounded-xl px-3 py-2 border text-center transition-all"
              style={{ borderColor:filter===key?cfg.color:"rgba(255,255,255,0.08)", background:filter===key?cfg.color+"22":"rgba(15,23,42,0.4)" }}>
              <div className="text-base font-bold" style={{ color:cfg.color, fontFamily:"'Share Tech Mono'" }}>{count}</div>
              <div className="text-[10px] text-slate-400 whitespace-nowrap">{cfg.label}</div>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400">{filtered.length} navires</span>
          <div className="flex gap-2">
            {["grid","list"].map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-3 py-1.5 rounded text-xs border transition-all ${view===v?"bg-cyan-400/15 text-cyan-400 border-cyan-400/25":"text-slate-400 border-white/10"}`}>
                {v==="grid"?"Grille":"Liste"}
              </button>
            ))}
          </div>
        </div>
        {view==="grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(v => {
              const isAbidjan = v.id === "route-001";
              const cfg = TYPES[v.type];
              return (
                <div key={v.id}
                  className="bg-slate-900/50 border rounded-xl p-4 hover:bg-slate-800/50 transition-all"
                  style={{ borderColor: isAbidjan ? `${ABIDJAN_COLOR}55` : "rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className={`font-bold text-sm truncate mb-1 ${isAbidjan ? "text-red-400" : "text-slate-100"}`}>{v.name}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cfg.tailwind}`}>{cfg.label}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg">{v.flag}</div>
                      <div className="text-[10px] text-slate-500">{v.mmsi.slice(-6)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-500 mb-0.5">Vitesse</div>
                      <div className="text-cyan-400 font-mono font-bold">{v.speed} kn</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-500 mb-0.5">Statut</div>
                      <div className={`font-semibold text-[11px] ${v.status==="En route"?"text-emerald-400":v.status==="A l'ancre"?"text-orange-400":"text-blue-400"}`}>{v.status}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 col-span-2">
                      <div className="text-slate-500 mb-0.5">Route</div>
                      <div className="text-slate-300 truncate text-[11px]">{v.from} → {v.to}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {view==="list" && (
          <div className="bg-slate-900/40 border border-cyan-400/10 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth:"480px" }}>
              <thead className="bg-slate-900/80 border-b border-cyan-400/15">
                <tr>{["Navire","Type","Pavillon","Route","Vitesse","Statut"].map(h=>(
                  <th key={h} className="text-left px-3 py-3 text-[10px] text-slate-400 uppercase tracking-widest">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const isAbidjan = v.id === "route-001";
                  const cfg = TYPES[v.type];
                  const dotColor = isAbidjan ? ABIDJAN_COLOR : cfg.color;
                  return (
                    <tr key={v.id} className="border-b border-white/5 hover:bg-white/4"
                      style={isAbidjan ? { borderLeft:`2px solid ${ABIDJAN_COLOR}` } : {}}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}/>
                          <span className={`font-semibold text-xs truncate max-w-28 ${isAbidjan ? "text-red-400" : "text-slate-100"}`}>{v.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3"><span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cfg.tailwind}`}>{cfg.label}</span></td>
                      <td className="px-3 py-3">{v.flag}</td>
                      <td className="px-3 py-3 text-slate-400 text-xs max-w-32"><div className="truncate">{v.from} → {v.to}</div></td>
                      <td className="px-3 py-3 text-cyan-400 text-xs font-mono">{v.speed} kn</td>
                      <td className="px-3 py-3"><StatusBadge status={v.status}/></td>
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

// ─── PORTS ────────────────────────────────────────────────────────────────────
function PortsPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const filtered = PORTS.filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())||p.country.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950" style={{ scrollbarWidth:"thin" }}>
      <div className="px-4 py-5 max-w-7xl mx-auto">
        <h2 className="text-base font-bold text-violet-400 mb-4" style={{ fontFamily:"'Rajdhani'" }}>Ports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label:"Ports", value:PORTS.length, color:"#a29bfe", icon:"🏛️" },
            { label:"Operationnels", value:PORTS.filter(p=>p.status==="Operationnel").length, color:"#2ed573", icon:"✅" },
            { label:"Postes", value:PORTS.reduce((s,p)=>s+p.berths,0), color:"#00d4ff", icon:"⚓" },
            { label:"Continents", value:"3", color:"#ffd700", icon:"🌍" },
          ].map(k=>(
            <div key={k.label} className="bg-slate-900/60 border border-cyan-400/10 rounded-xl p-3">
              <div className="text-xl mb-1">{k.icon}</div>
              <div className="text-xl font-bold" style={{ color:k.color, fontFamily:"'Share Tech Mono'" }}>{k.value}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">{k.label}</div>
            </div>
          ))}
        </div>
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chercher un port..."
            className="w-full bg-slate-800/60 border border-violet-400/20 rounded-lg text-sm text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2 outline-none focus:border-violet-400/60"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(port=>(
            <div key={port.id} onClick={()=>setSelected(selected?.id===port.id?null:port)}
              className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer hover:bg-slate-800/50 transition-all ${selected?.id===port.id?"border-violet-400/50":"border-white/8"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xl">{port.flag}</span>
                    <h3 className="font-bold text-slate-100 text-sm">{port.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">{port.country}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${port.status==="Operationnel"?"text-emerald-400 bg-emerald-400/10 border-emerald-400/25":"text-orange-400 bg-orange-400/10 border-orange-400/25"}`}>
                  {port.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 rounded-lg p-2"><div className="text-slate-500 mb-0.5">Type</div><div className="text-violet-400 font-semibold">{port.type}</div></div>
                <div className="bg-slate-800/50 rounded-lg p-2"><div className="text-slate-500 mb-0.5">Trafic</div><div className="text-slate-300">{port.traffic}</div></div>
                <div className="bg-slate-800/50 rounded-lg p-2"><div className="text-slate-500 mb-0.5">Postes</div><div className="text-cyan-400 font-mono font-bold">{port.berths}</div></div>
                <div className="bg-slate-800/50 rounded-lg p-2"><div className="text-slate-500 mb-0.5">Tirant</div><div className="text-slate-300">{port.depth}</div></div>
              </div>
              {selected?.id===port.id && (
                <div className="mt-3 pt-3 border-t border-white/8">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Coordonnees</div>
                  <div className="text-xs text-cyan-400 font-mono">{port.lat.toFixed(4)}, {port.lng.toFixed(4)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MarineTracker() {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const [vessels, setVessels] = useState(() => generateVessels());
  const [selectedId, setSelectedId] = useState("route-001");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [coords, setCoords] = useState("");
  const [activeTab, setActiveTab] = useState("Carte Live");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selected = vessels.find(v=>v.id===selectedId);

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  useLeaflet((L) => {
    if (leafletMapRef.current) return;
    const map = L.map(mapRef.current, { center:[25,-25], zoom:3, zoomControl:false });
    L.control.zoom({ position:"topright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"OSM", maxZoom:18 }).addTo(map);
    map.on("mousemove", e => {
      const la=e.latlng.lat, lo=e.latlng.lng;
      setCoords(`${Math.abs(la).toFixed(3)}${la>=0?"N":"S"} ${Math.abs(lo).toFixed(3)}${lo>=0?"E":"W"}`);
    });
    // Tracé de route en rouge pour MV Abidjan Star
    L.polyline(ROUTE, { color: ABIDJAN_COLOR, weight:2.5, opacity:0.55, dashArray:"8,6" }).addTo(map);
    const pi = c => L.divIcon({ html:`<div style="width:10px;height:10px;background:${c};border:2px solid #fff;border-radius:2px;transform:rotate(45deg)"></div>`, className:"", iconSize:[10,10], iconAnchor:[5,5] });
    L.marker([44.6,-63.6],{icon:pi("#00d4ff")}).addTo(map).bindTooltip("Halifax",{direction:"top"});
    L.marker([5.3,-4.0],{icon:pi("#ffd700")}).addTo(map).bindTooltip("Abidjan",{direction:"top"});
    leafletMapRef.current = map;
    setVessels(prev => { prev.forEach(v => addMarker(L,map,v)); return prev; });
    setTimeout(() => map.flyTo([25,-30], 3, { duration:2 }), 600);
  });

  function addMarker(L, map, v) {
    const isAbidjan = v.id === "route-001";
    const color = isAbidjan ? ABIDJAN_COLOR : TYPES[v.type].color;
    const size = isAbidjan ? ABIDJAN_SIZE : 13;
    const icon = L.divIcon({
      html: shipSVG(v.heading, color, size, isAbidjan),
      className: "cursor-pointer",
      iconSize: [size*2, size*2],
      iconAnchor: [size, size]
    });
    const m = L.marker([v.lat,v.lng],{icon}).addTo(map);
    m.on("click", ()=>setSelectedId(v.id));
    markersRef.current[v.id] = m;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setVessels(prev => {
        const L=window.L;
        return prev.map(v => {
          let u={...v};
          if (v.id==="route-001") {
            u.progress=Math.min(v.progress+1/(71*24*3600),0.9999);
            const [lat,lng]=posAlongRoute(u.progress);
            u.lat=lat; u.lng=lng; u.heading=headingAlongRoute(u.progress);
            u.status="En route"; // Statut forcé permanent
          } else {
            u.lat+=v.dlat; u.lng+=v.dlng;
            u.heading=(v.heading+(Math.random()-0.5)*2+360)%360;
            if(u.lat>65||u.lat<-10) u.dlat=-v.dlat;
            if(u.lng>40||u.lng<-80) u.dlng=-v.dlng;
          }
          if(L && markersRef.current[v.id]) {
            markersRef.current[v.id].setLatLng([u.lat,u.lng]);
            const isAbidjan = v.id === "route-001";
            const color = isAbidjan ? ABIDJAN_COLOR : TYPES[u.type].color;
            const size = isAbidjan ? ABIDJAN_SIZE : 13;
            markersRef.current[v.id].setIcon(L.divIcon({
              html: shipSVG(u.heading, color, size, isAbidjan),
              className: "cursor-pointer",
              iconSize: [size*2, size*2],
              iconAnchor: [size, size]
            }));
          }
          return u;
        });
      });
    }, 1000);
    return ()=>clearInterval(interval);
  }, []);

  useEffect(() => { setTimeout(()=>leafletMapRef.current?.invalidateSize(),310); }, [sidebarOpen]);
  useEffect(() => { if(activeTab==="Carte Live") setTimeout(()=>leafletMapRef.current?.invalidateSize(),50); }, [activeTab]);

  const centerOnSelected = useCallback(() => {
    if(!selected||!leafletMapRef.current) return;
    leafletMapRef.current.flyTo([selected.lat,selected.lng],6,{duration:1.2});
  }, [selected]);

  const searchResults = search.trim() ? vessels.filter(v=>v.name.toLowerCase().includes(search.toLowerCase())).slice(0,6) : [];

  function selectFromSearch(v) {
    setSelectedId(v.id); setSearch(v.name); setShowResults(false);
    leafletMapRef.current?.flyTo([v.lat,v.lng],7,{duration:1.5});
    setActiveTab("Carte Live");
  }

  const cargoCount=vessels.filter(v=>v.type==="cargo").length;
  const tankerCount=vessels.filter(v=>v.type==="tanker").length;
  const otherCount=vessels.filter(v=>!["cargo","tanker"].includes(v.type)).length;

  const TABS = ["Carte Live","Explorer","Flotte","Ports"];
  const TCOLORS = { "Carte Live":"text-cyan-400 bg-cyan-400/10", "Explorer":"text-emerald-400 bg-emerald-400/10", "Flotte":"text-blue-400 bg-blue-400/10", "Ports":"text-violet-400 bg-violet-400/10" };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden" style={{ fontFamily:"'Exo 2',sans-serif" }}>

      <header className="flex-shrink-0 flex items-center gap-2 px-3 bg-slate-900 border-b border-cyan-400/20 z-50" style={{height:"52px"}}>
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold flex-shrink-0" style={{ fontFamily:"'Rajdhani'", fontSize:"18px" }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M4 22 L8 14 L12 17 L16 8 L20 17 L24 14 L28 22 Z" stroke="#00d4ff" strokeWidth="2" fill="none"/>
            <path d="M2 24 L30 24" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
            <circle cx="16" cy="8" r="2" fill="#00ff9d"/>
          </svg>
          <span className="hidden sm:inline">OceanTrack</span>
        </div>
        <nav className="hidden md:flex gap-1 ml-2">
          {TABS.map(n=>(
            <button key={n} onClick={()=>setActiveTab(n)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${activeTab===n?TCOLORS[n]:"text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>
              {n}
            </button>
          ))}
        </nav>
        <div className="md:hidden relative ml-1">
          <button onClick={()=>setMobileMenuOpen(o=>!o)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
            {activeTab} <span className="text-slate-500 text-[10px]">▾</span>
          </button>
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-cyan-400/20 rounded-lg z-50 shadow-xl overflow-hidden" style={{minWidth:"140px"}}>
              {TABS.map(n=>(
                <button key={n} onClick={()=>{setActiveTab(n);setMobileMenuOpen(false);}}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b border-white/5 last:border-0 transition-all ${activeTab===n?TCOLORS[n]:"text-slate-300 hover:bg-white/5"}`}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 ml-1 text-emerald-400 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>EN DIRECT
        </div>
        <div className="ml-auto relative" onBlur={()=>setTimeout(()=>setShowResults(false),150)}>
          <div className="relative flex items-center">
            <svg className="absolute left-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e=>{setSearch(e.target.value);setShowResults(true);}} onFocus={()=>setShowResults(true)}
              placeholder="Navire..." className="bg-white/5 border border-cyan-400/20 rounded-md text-xs text-slate-100 placeholder-slate-500 pl-7 pr-2 py-1.5 outline-none focus:border-cyan-400/50 transition-all w-24 focus:w-40 sm:w-36 sm:focus:w-52"/>
          </div>
          {showResults && searchResults.length>0 && (
            <div className="absolute top-full mt-1 right-0 w-52 bg-slate-900 border border-cyan-400/20 rounded-lg z-50 shadow-xl overflow-hidden">
              {searchResults.map(v=>{
                const isAbidjan = v.id === "route-001";
                const dotColor = isAbidjan ? ABIDJAN_COLOR : TYPES[v.type].color;
                return (
                  <div key={v.id} onMouseDown={()=>selectFromSearch(v)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-cyan-400/10 cursor-pointer border-b border-white/5 last:border-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}/>
                    <span className={`flex-1 truncate text-xs ${isAbidjan ? "text-red-400" : ""}`}>{v.name}</span>
                    <span className="text-slate-500 text-[10px]">{TYPES[v.type].label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`flex flex-1 overflow-hidden ${activeTab==="Carte Live"?"":"hidden"}`}>
          <div className="flex-1 relative z-10">
            <div ref={mapRef} className="w-full h-full" style={{ filter:"hue-rotate(195deg) saturate(0.8) brightness(0.88)" }}/>
            {coords && <div className="hidden sm:block absolute top-3 left-3 z-40 bg-slate-950/90 border border-cyan-400/20 rounded-md px-2.5 py-1 text-xs text-slate-400 pointer-events-none" style={{ fontFamily:"'Share Tech Mono'" }}>{coords}</div>}

            {/* Légende avec MV Abidjan Star en tête */}
            <div className="absolute bottom-8 left-2 z-40 bg-slate-950/90 border border-cyan-400/20 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/10">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ABIDJAN_COLOR }}/>
                <span className="text-[10px] text-red-400 font-bold hidden sm:inline">MV Abidjan Star</span>
              </div>
              {Object.entries(TYPES).map(([,cfg])=>(
                <div key={cfg.label} className="flex items-center gap-1.5 mb-1 last:mb-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:cfg.color }}/>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{cfg.label}</span>
                </div>
              ))}
            </div>

            <button onClick={()=>setSidebarOpen(o=>!o)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-slate-900 border border-r-0 border-cyan-400/20 rounded-l-lg w-6 h-12 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 text-xs">
              {sidebarOpen?"❯":"❮"}
            </button>
          </div>

          {/* Sidebar */}
          <div className={`bg-slate-950/98 border-l border-cyan-400/20 flex flex-col z-30 flex-shrink-0 overflow-hidden transition-all duration-300
            ${sidebarOpen?"opacity-100":"w-0 opacity-0 pointer-events-none"}
            ${sidebarOpen?"absolute inset-0 md:relative md:inset-auto w-full md:w-80":""}`}>

            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-400/15">
              <h3 className="font-bold text-cyan-400 text-sm uppercase tracking-widest" style={{ fontFamily:"'Rajdhani'" }}>Trafic</h3>
              <div className="flex items-center gap-2">
                <span className="bg-cyan-400/10 text-cyan-400 text-[11px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/25">{vessels.length}</span>
                <button onClick={()=>setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-200">✕</button>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-cyan-400/15 border-b border-cyan-400/15">
              <StatCard value={cargoCount} label="Cargo" color="#2ed573"/>
              <StatCard value={tankerCount} label="Tanker" color="#ff4757"/>
              <StatCard value={otherCount} label="Autres" color="#a29bfe"/>
            </div>

            {selected && (
              <div className="border-b border-cyan-400/15">
                <div className={`px-4 pt-3 pb-2 ${selected.id==="route-001" ? "bg-gradient-to-br from-red-600/10 to-transparent" : "bg-gradient-to-br from-cyan-400/5 to-transparent"}`}>
                  <h2 className={`font-bold text-sm truncate mb-1 ${selected.id==="route-001" ? "text-red-400" : ""}`} style={{ fontFamily:"'Rajdhani'" }}>{selected.name}</h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${TYPES[selected.type].tailwind}`}>{TYPES[selected.type].label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4 py-3">
                  <InfoRow label="MMSI" value={selected.mmsi}/>
                  <InfoRow label="Pavillon" value={selected.flag}/>
                  <InfoRow label="Vitesse" value={`${selected.speed} kn`} highlight/>
                  <InfoRow label="Cap" value={`${Math.round(selected.heading)}`}/>
                  <InfoRow label="Statut" value={selected.status}/>
                  <InfoRow label="Position" value={`${selected.lat.toFixed(2)}, ${selected.lng.toFixed(2)}`}/>
                  <InfoRow label="Depart" value={selected.from} gold/>
                  <InfoRow label="Dest." value={selected.to} gold/>
                </div>
                {selected.id==="route-001" && (
                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                      <span>Progression</span>
                      <span className="text-red-400 font-bold">{Math.round(selected.progress*100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400 transition-all duration-1000" style={{ width:`${Math.round(selected.progress*100)}%` }}/>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Halifax · 31 mars</span><span>10 juin · Abidjan</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">ETA: <span className="text-red-400">10 juin 2026</span> · <span className="text-slate-300">J-{getDaysLeft(selected.progress)} restants</span></div>
                  </div>
                )}
                <div className="flex gap-2 px-4 pb-3">
                  <button onClick={()=>setSelectedId(null)} className="text-xs text-slate-400 hover:text-red-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded">✕</button>
                  <button onClick={centerOnSelected} className="text-xs text-cyan-400 bg-cyan-400/8 hover:bg-cyan-400/15 border border-cyan-400/25 px-3 py-1.5 rounded">Centrer</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:"thin" }}>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-4 py-2">Navires</div>
              {vessels.map(v=><VesselItem key={v.id} vessel={v} selected={selectedId===v.id} onClick={()=>setSelectedId(v.id)}/>)}
            </div>
          </div>
        </div>

        {activeTab==="Explorer" && <ExplorerPage vessels={vessels} onSelectVessel={setSelectedId} setActiveTab={setActiveTab}/>}
        {activeTab==="Flotte" && <FlottePage vessels={vessels}/>}
        {activeTab==="Ports" && <PortsPage/>}
      </div>

      <style>{`
        .leaflet-tile { filter:none !important; }
        .leaflet-popup-content-wrapper { background:#0d1f3c !important; border:1px solid rgba(0,212,255,0.2) !important; color:#e0f0ff !important; }
        .leaflet-popup-tip { background:#0d1f3c !important; }
        select option { background:#1e293b; color:#e2e8f0; }
        @media (max-width:767px) { .leaflet-control-zoom { display:none !important; } }
      `}</style>
    </div>
  );
}