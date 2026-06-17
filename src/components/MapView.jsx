import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_PLACES } from "../data/places";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MORANDI = {
  text: "#4A4541",
  textLight: "#8A8580",
  accent: "#9B8E82",
  accentSoft: "#C4B9AE",
  sage: "#A3AE9E",
  dustyRose: "#C4A9A0",
  warm: "#BFA58A",
  slate: "#8E9CA5",
  border: "#D5D0CA",
  card: "#F2EFEB",
  white: "#FAFAF8",
  bg: "#E8E4DF",
};

const CAT_META = {
  "景點":       { color: MORANDI.sage,      label: "景點",       emoji: "🏛️" },
  "餐廳":       { color: MORANDI.dustyRose,  label: "餐廳",       emoji: "🍽️" },
  "咖啡 · 甜點": { color: MORANDI.warm,      label: "咖啡 · 甜點", emoji: "☕" },
  "甜點 · 酒吧": { color: MORANDI.slate,     label: "甜點 · 酒吧", emoji: "🍸" },
  "其他":        { color: MORANDI.accent,    label: "其他",        emoji: "📍" },
};

const CUSTOM_COLOR = MORANDI.dustyRose;

function catColor(cat) {
  return CAT_META[cat]?.color ?? MORANDI.accent;
}

function makePinIcon(color, small = false) {
  const w = small ? 22 : 28, h = small ? 29 : 36;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 36">
    <ellipse cx="14" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.15)"/>
    <path d="M14 1 C6.3 1 1 7.2 1 14.2 C1 24 14 34 14 34 C14 34 27 24 27 14.2 C27 7.2 21.7 1 14 1Z"
      fill="${color}" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="5" fill="rgba(255,255,255,0.85)"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -(h + 2)],
  });
}

const ICONS = Object.fromEntries(
  Object.entries(CAT_META).map(([cat, meta]) => [cat, makePinIcon(meta.color)])
);
const DEFAULT_ICON = makePinIcon(MORANDI.accent);
const CUSTOM_ICON  = makePinIcon(CUSTOM_COLOR, true);

const CITY_CENTERS = {
  vienna:   [48.2084, 16.3735],
  prague:   [50.0872, 14.4207],
  budapest: [47.4962, 19.0396],
};

// Nominatim viewbox: left,top,right,bottom (min_lon,max_lat,max_lon,min_lat)
const CITY_BBOX = {
  vienna:   "16.18,48.33,16.58,48.10",
  prague:   "14.22,50.18,14.71,49.97",
  budapest: "18.92,47.62,19.33,47.35",
};

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

// Search bar component — lives outside MapContainer to avoid Leaflet DOM conflicts
function NominatimSearch({ activeCity, onAddPlace }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(null);
  const dropRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const bbox = CITY_BBOX[activeCity];
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&viewbox=${bbox}&bounded=1&email=beatricechanx@gmail.com&accept-language=zh-TW,zh-HK,zh,en`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, activeCity]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset when city changes
  useEffect(() => { setQuery(""); setResults([]); setAdded(null); }, [activeCity]);

  const handleAdd = (r) => {
    onAddPlace(activeCity, {
      id: Date.now(),
      name: r.display_name.split(",")[0],
      note: r.display_name.split(",").slice(1, 3).join(",").trim(),
      cat: "其他",
      mapLat: parseFloat(r.lat),
      mapLng: parseFloat(r.lon),
    });
    setAdded(r.display_name.split(",")[0]);
    setQuery("");
    setResults([]);
    setTimeout(() => setAdded(null), 2500);
  };

  return (
    <div style={{ background: MORANDI.card, padding: "10px 14px", borderBottom: `1px solid ${MORANDI.border}` }}>
      <div ref={dropRef} style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`搜尋地點加 Pin…`}
              style={{
                width: "100%",
                padding: "7px 30px 7px 10px",
                border: `1px solid ${MORANDI.border}`,
                borderRadius: 8,
                fontSize: 12,
                background: MORANDI.white,
                color: MORANDI.text,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {loading && (
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: MORANDI.textLight }}>…</span>
            )}
          </div>
        </div>

        {added && (
          <div style={{ marginTop: 6, fontSize: 11, color: MORANDI.accent, fontStyle: "italic" }}>
            ✓ 已加入：{added}
          </div>
        )}

        {results.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: MORANDI.white, border: `1px solid ${MORANDI.border}`,
            borderRadius: 10, zIndex: 9999,
            boxShadow: "0 6px 20px rgba(74,69,65,0.14)", overflow: "hidden",
          }}>
            {results.map((r, i) => {
              const name = r.display_name.split(",")[0];
              const sub = r.display_name.split(",").slice(1, 3).join(", ").trim();
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 12px",
                    borderBottom: i < results.length - 1 ? `1px solid ${MORANDI.border}` : "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = MORANDI.card}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onMouseDown={e => { e.preventDefault(); handleAdd(r); }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>📍</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: MORANDI.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                    {sub && <div style={{ fontSize: 10, color: MORANDI.textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
                  </div>
                  <button
                    style={{ flexShrink: 0, padding: "3px 10px", background: MORANDI.accent, color: MORANDI.white, border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer" }}
                    onMouseDown={e => { e.preventDefault(); handleAdd(r); }}
                  >
                    加入
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapView({ activeCity, customPlaces, onAddPlace }) {
  const center = CITY_CENTERS[activeCity] ?? CITY_CENTERS.vienna;

  const cityPlaces = MAP_PLACES.filter(p => p.city === activeCity);
  const allCats = [...new Set(cityPlaces.map(p => p.cat))];

  const [activeCats, setActiveCats] = useState(new Set(allCats));

  useEffect(() => {
    const cats = MAP_PLACES.filter(p => p.city === activeCity).map(p => p.cat);
    setActiveCats(new Set(cats));
  }, [activeCity]);

  const toggleCat = (cat) => {
    setActiveCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const visiblePlaces = cityPlaces.filter(p => activeCats.has(p.cat));

  // Custom places for this city that have map coordinates
  const cityCustom = (customPlaces?.[activeCity] ?? []).filter(p => p.mapLat && p.mapLng);

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${MORANDI.border}`, boxShadow: "0 4px 16px rgba(74,69,65,0.08)", marginBottom: 24 }}>

      {/* Nominatim search */}
      {onAddPlace && (
        <NominatimSearch activeCity={activeCity} onAddPlace={onAddPlace} />
      )}

      {/* Category filter bar */}
      <div style={{ background: MORANDI.card, padding: "10px 14px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${MORANDI.border}` }}>
        {allCats.map(cat => {
          const meta = CAT_META[cat] ?? { color: MORANDI.accent, emoji: "📍" };
          const count = cityPlaces.filter(p => p.cat === cat).length;
          const active = activeCats.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                border: `1.5px solid ${active ? meta.color : MORANDI.border}`,
                background: active ? meta.color + "22" : "transparent",
                color: active ? MORANDI.text : MORANDI.textLight,
                fontSize: 11, fontWeight: active ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? meta.color : MORANDI.border, display: "inline-block", flexShrink: 0 }} />
              {meta.emoji} {cat}
              <span style={{ fontSize: 9, background: active ? meta.color + "33" : MORANDI.border, color: MORANDI.textLight, padding: "1px 5px", borderRadius: 8, marginLeft: 1 }}>
                {count}
              </span>
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 10, color: MORANDI.textLight, alignSelf: "center" }}>
          {visiblePlaces.length + cityCustom.length} spots
        </span>
      </div>

      {/* Map */}
      <div style={{ height: 400, position: "relative" }}>
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          <FlyTo center={center} />

          {visiblePlaces.map((place, i) => (
            <Marker
              key={`preset-${place.city}-${i}`}
              position={[place.lat, place.lng]}
              icon={ICONS[place.cat] ?? DEFAULT_ICON}
            >
              <Popup className="morandi-popup" closeButton={false}>
                <div style={{ fontFamily: "-apple-system, 'Noto Sans TC', sans-serif", color: MORANDI.text, minWidth: 170, maxWidth: 210 }}>
                  <span style={{ fontSize: 9, background: catColor(place.cat) + "22", color: catColor(place.cat), padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, display: "inline-block", marginBottom: 7, border: `1px solid ${catColor(place.cat)}44` }}>
                    {CAT_META[place.cat]?.emoji} {place.cat}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 2 }}>{place.name}</div>
                  {place.nameZh && <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 5 }}>{place.nameZh}</div>}
                  {place.note && (
                    <div style={{ fontSize: 10, color: MORANDI.textLight, borderTop: `1px solid ${MORANDI.border}`, paddingTop: 5, marginTop: 5, fontStyle: "italic", lineHeight: 1.5 }}>
                      {place.note}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Custom place markers */}
          {cityCustom.map((place, i) => (
            <Marker
              key={`custom-${place.id ?? i}`}
              position={[place.mapLat, place.mapLng]}
              icon={CUSTOM_ICON}
            >
              <Popup className="morandi-popup" closeButton={false}>
                <div style={{ fontFamily: "-apple-system, 'Noto Sans TC', sans-serif", color: MORANDI.text, minWidth: 160, maxWidth: 210 }}>
                  <span style={{ fontSize: 9, background: CUSTOM_COLOR + "22", color: CUSTOM_COLOR, padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, display: "inline-block", marginBottom: 7, border: `1px solid ${CUSTOM_COLOR}44` }}>
                    ✨ {place.cat ?? "My List"}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 2 }}>{place.name}</div>
                  {place.note && (
                    <div style={{ fontSize: 10, color: MORANDI.textLight, borderTop: `1px solid ${MORANDI.border}`, paddingTop: 5, marginTop: 5, fontStyle: "italic", lineHeight: 1.5 }}>
                      {place.note}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div style={{ background: MORANDI.card, borderTop: `1px solid ${MORANDI.border}`, padding: "8px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
        {Object.entries(CAT_META).map(([cat, meta]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, display: "inline-block" }} />
            <span style={{ fontSize: 10, color: MORANDI.textLight }}>{meta.label}</span>
          </div>
        ))}
        {cityCustom.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: CUSTOM_COLOR, display: "inline-block" }} />
            <span style={{ fontSize: 10, color: MORANDI.textLight }}>我的清單</span>
          </div>
        )}
      </div>

      <style>{`
        .morandi-popup .leaflet-popup-content-wrapper {
          background: ${MORANDI.white};
          border: 1px solid ${MORANDI.border};
          border-radius: 14px;
          box-shadow: 0 6px 24px rgba(74,69,65,0.13);
          padding: 0;
        }
        .morandi-popup .leaflet-popup-content { margin: 12px 14px; }
        .morandi-popup .leaflet-popup-tip-container { margin-top: -1px; }
        .morandi-popup .leaflet-popup-tip { background: ${MORANDI.white}; box-shadow: none; }
        .leaflet-container { font-family: -apple-system, 'Noto Sans TC', sans-serif; }
        .leaflet-control-zoom a { color: ${MORANDI.text} !important; border-color: ${MORANDI.border} !important; }
      `}</style>
    </div>
  );
}
