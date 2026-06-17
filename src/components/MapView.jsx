import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_PLACES } from "../data/places";

// Fix Leaflet default marker icon paths
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

// Category → colour + label mapping
const CAT_META = {
  "景點":       { color: MORANDI.sage,      label: "景點",       emoji: "🏛️" },
  "餐廳":       { color: MORANDI.dustyRose,  label: "餐廳",       emoji: "🍽️" },
  "咖啡 · 甜點": { color: MORANDI.warm,      label: "咖啡 · 甜點", emoji: "☕" },
  "甜點 · 酒吧": { color: MORANDI.slate,     label: "甜點 · 酒吧", emoji: "🍸" },
};

function catColor(cat) {
  return CAT_META[cat]?.color ?? MORANDI.accent;
}

// Build a coloured SVG pin icon for each marker
function makePinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <ellipse cx="14" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.15)"/>
    <path d="M14 1 C6.3 1 1 7.2 1 14.2 C1 24 14 34 14 34 C14 34 27 24 27 14.2 C27 7.2 21.7 1 14 1Z"
      fill="${color}" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="5" fill="rgba(255,255,255,0.85)"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}

// Pre-build icon cache
const ICONS = Object.fromEntries(
  Object.entries(CAT_META).map(([cat, meta]) => [cat, makePinIcon(meta.color)])
);
const DEFAULT_ICON = makePinIcon(MORANDI.accent);

const CITY_CENTERS = {
  vienna:   [48.2084, 16.3735],
  prague:   [50.0872, 14.4207],
  budapest: [47.4962, 19.0396],
};

// Flies map to the new center whenever activeCity changes
function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function MapView({ activeCity }) {
  const center = CITY_CENTERS[activeCity] ?? CITY_CENTERS.vienna;

  // Derive categories present for this city
  const cityPlaces = MAP_PLACES.filter((p) => p.city === activeCity);
  const allCats = [...new Set(cityPlaces.map((p) => p.cat))];

  const [activeCats, setActiveCats] = useState(new Set(allCats));

  // Reset filter when city changes
  useEffect(() => {
    const cats = MAP_PLACES.filter((p) => p.city === activeCity).map((p) => p.cat);
    setActiveCats(new Set(cats));
  }, [activeCity]);

  const toggleCat = (cat) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const visiblePlaces = cityPlaces.filter((p) => activeCats.has(p.cat));

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${MORANDI.border}`, boxShadow: "0 4px 16px rgba(74,69,65,0.08)", marginBottom: 24 }}>

      {/* Category filter bar */}
      <div style={{ background: MORANDI.card, padding: "10px 14px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${MORANDI.border}` }}>
        {allCats.map((cat) => {
          const meta = CAT_META[cat] ?? { color: MORANDI.accent, emoji: "📍" };
          const count = cityPlaces.filter((p) => p.cat === cat).length;
          const active = activeCats.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 20,
                border: `1.5px solid ${active ? meta.color : MORANDI.border}`,
                background: active ? meta.color + "22" : "transparent",
                color: active ? MORANDI.text : MORANDI.textLight,
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
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
          {visiblePlaces.length} spots
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
          {/* CartoDB Positron — free, no API key, minimal light style */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          <FlyTo center={center} />

          {visiblePlaces.map((place, i) => (
            <Marker
              key={`${place.city}-${i}`}
              position={[place.lat, place.lng]}
              icon={ICONS[place.cat] ?? DEFAULT_ICON}
            >
              <Popup className="morandi-popup" closeButton={false}>
                <div style={{ fontFamily: "-apple-system, 'Noto Sans TC', sans-serif", color: MORANDI.text, minWidth: 170, maxWidth: 210 }}>
                  {/* Category tag */}
                  <span style={{
                    fontSize: 9,
                    background: catColor(place.cat) + "22",
                    color: catColor(place.cat),
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    display: "inline-block",
                    marginBottom: 7,
                    border: `1px solid ${catColor(place.cat)}44`,
                  }}>
                    {CAT_META[place.cat]?.emoji} {place.cat}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 2 }}>{place.name}</div>
                  {place.nameZh && (
                    <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 5 }}>{place.nameZh}</div>
                  )}
                  {place.note && (
                    <div style={{
                      fontSize: 10,
                      color: MORANDI.textLight,
                      borderTop: `1px solid ${MORANDI.border}`,
                      paddingTop: 5,
                      marginTop: 5,
                      fontStyle: "italic",
                      lineHeight: 1.5,
                    }}>
                      {place.note}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Colour legend strip */}
      <div style={{ background: MORANDI.card, borderTop: `1px solid ${MORANDI.border}`, padding: "8px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
        {Object.entries(CAT_META).map(([cat, meta]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, display: "inline-block" }} />
            <span style={{ fontSize: 10, color: MORANDI.textLight }}>{meta.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .morandi-popup .leaflet-popup-content-wrapper {
          background: ${MORANDI.white};
          border: 1px solid ${MORANDI.border};
          border-radius: 14px;
          box-shadow: 0 6px 24px rgba(74,69,65,0.13);
          padding: 0;
        }
        .morandi-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        .morandi-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
        .morandi-popup .leaflet-popup-tip {
          background: ${MORANDI.white};
          box-shadow: none;
        }
        .leaflet-container {
          font-family: -apple-system, 'Noto Sans TC', sans-serif;
        }
        .leaflet-control-zoom a {
          color: ${MORANDI.text} !important;
          border-color: ${MORANDI.border} !important;
        }
      `}</style>
    </div>
  );
}
