import { useEffect, useRef } from "react";

const MORANDI = {
  sage: "#A3AE9E",
  dustyRose: "#C4A9A0",
  slate: "#8E9CA5",
  accent: "#9B8E82",
  accentSoft: "#C4B9AE",
  text: "#4A4541",
  textLight: "#8A8580",
  border: "#D5D0CA",
  card: "#F2EFEB",
  white: "#FAFAF8",
  warm: "#BFA58A",
};

const CITIES = {
  vienna: {
    name: "Wien",
    nameEn: "Vienna",
    lat: 48.2082,
    lon: 16.3738,
    color: MORANDI.sage,
    hotel: "Park Hyatt Vienna",
    dates: "7/10 — 7/13",
    highlights: ["St. Stephen's Cathedral", "Belvedere Palace", "Prater"],
  },
  prague: {
    name: "Praha",
    nameEn: "Prague",
    lat: 50.0755,
    lon: 14.4378,
    color: MORANDI.dustyRose,
    hotel: "Andaz Prague",
    dates: "7/13 — 7/15",
    highlights: ["Prague Castle", "Charles Bridge", "Old Town"],
  },
  budapest: {
    name: "Budapest",
    nameEn: "Budapest",
    lat: 47.4979,
    lon: 19.0402,
    color: MORANDI.slate,
    hotel: "Párisi Udvar Hotel",
    dates: "7/15 — 7/17",
    highlights: ["Buda Castle", "Fisherman's Bastion", "Chain Bridge"],
  },
};

// SVG pin icon as a data URL so we avoid leaflet's default asset path issues
function makePinSvg(color, active) {
  const size = active ? 36 : 28;
  const stroke = active ? "#fff" : "rgba(255,255,255,0.7)";
  const sw = active ? 2.5 : 1.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.25}" viewBox="0 0 40 50">
    <ellipse cx="20" cy="47" rx="6" ry="2.5" fill="rgba(0,0,0,0.15)"/>
    <path d="M20 2 C10 2 3 10 3 20 C3 32 20 46 20 46 C20 46 37 32 37 20 C37 10 30 2 20 2Z" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>
    <circle cx="20" cy="20" r="7" fill="${stroke}" opacity="0.9"/>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(svg);
}

export default function MapView({ activeCity }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const popupRef = useRef(null);

  useEffect(() => {
    // Dynamically import Leaflet to keep bundle tidy
    import("leaflet").then((L) => {
      // Fix default icon paths
      delete L.Icon.Default.prototype._getIconUrl;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, {
          center: [48.8, 17.0],
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);

        // Draw a soft line connecting the cities
        const cityOrder = ["vienna", "prague", "budapest"];
        const latlngs = cityOrder.map((id) => [CITIES[id].lat, CITIES[id].lon]);
        L.polyline(latlngs, {
          color: MORANDI.accentSoft,
          weight: 2,
          dashArray: "6 5",
          opacity: 0.7,
        }).addTo(map);

        // Place markers for all cities
        Object.entries(CITIES).forEach(([id, city]) => {
          const isActive = id === activeCity;
          const icon = L.icon({
            iconUrl: makePinSvg(city.color, isActive),
            iconSize: isActive ? [36, 45] : [28, 35],
            iconAnchor: isActive ? [18, 45] : [14, 35],
            popupAnchor: [0, -38],
          });

          const popupContent = `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans TC',sans-serif;min-width:160px">
              <div style="font-size:14px;font-weight:600;color:${MORANDI.text};margin-bottom:2px">${city.name}</div>
              <div style="font-size:10px;color:${MORANDI.textLight};letter-spacing:1px;margin-bottom:8px;text-transform:uppercase">${city.dates}</div>
              <div style="font-size:11px;color:${MORANDI.textLight};margin-bottom:4px">🏨 ${city.hotel}</div>
              <div style="margin-top:6px;border-top:1px solid ${MORANDI.border};padding-top:6px">
                ${city.highlights.map((h) => `<div style="font-size:11px;color:${MORANDI.text};padding:2px 0">• ${h}</div>`).join("")}
              </div>
            </div>`;

          const marker = L.marker([city.lat, city.lon], { icon })
            .addTo(map)
            .bindPopup(popupContent, {
              closeButton: false,
              className: "morandi-popup",
            });

          markersRef.current[id] = { marker, city, L };
        });

        mapInstanceRef.current = { map, L };
      }

      // Fly to active city and open its popup
      const { map } = mapInstanceRef.current;
      const active = markersRef.current[activeCity];
      if (active) {
        map.flyTo([active.city.lat, active.city.lon], 12, { duration: 1.2, easeLinearity: 0.4 });
        setTimeout(() => active.marker.openPopup(), 1300);
      }

      // Refresh all marker icons to reflect new active state
      Object.entries(markersRef.current).forEach(([id, { marker, city, L: Lref }]) => {
        const isActive = id === activeCity;
        const icon = Lref.icon({
          iconUrl: makePinSvg(city.color, isActive),
          iconSize: isActive ? [36, 45] : [28, 35],
          iconAnchor: isActive ? [18, 45] : [14, 35],
          popupAnchor: [0, -38],
        });
        marker.setIcon(icon);
      });
    });
  }, [activeCity]);

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${MORANDI.border}`, marginBottom: 24 }}>
      {/* City legend strip */}
      <div style={{ display: "flex", background: MORANDI.card, borderBottom: `1px solid ${MORANDI.border}` }}>
        {Object.entries(CITIES).map(([id, city]) => (
          <div
            key={id}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 4px",
              borderLeft: id !== "vienna" ? `1px solid ${MORANDI.border}` : "none",
              opacity: id === activeCity ? 1 : 0.5,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: city.color, margin: "0 auto 4px" }} />
            <div style={{ fontSize: 10, color: MORANDI.text, fontWeight: id === activeCity ? 600 : 400 }}>{city.name}</div>
          </div>
        ))}
      </div>

      {/* Leaflet map container */}
      <div ref={mapRef} style={{ height: 380, width: "100%" }} />

      {/* Popup style injection */}
      <style>{`
        .morandi-popup .leaflet-popup-content-wrapper {
          background: ${MORANDI.white};
          border: 1px solid ${MORANDI.border};
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(74,69,65,0.12);
          padding: 0;
        }
        .morandi-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        .morandi-popup .leaflet-popup-tip {
          background: ${MORANDI.white};
        }
        .leaflet-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif;
        }
      `}</style>
    </div>
  );
}
