import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const MAP_PLACES = [
  // === 維也納 Vienna ===
  { city: "vienna", cat: "景點", name: "St. Stephen's Cathedral", nameZh: "聖史蒂芬大教堂", lat: 48.2084, lng: 16.3735, note: "酒店步行5min · 可登南塔" },
  { city: "vienna", cat: "景點", name: "Kunsthistorisches Museum", nameZh: "藝術史博物館", lat: 48.2033, lng: 16.3614, note: "世界級館藏 · 如果只揀一間博物館" },
  { city: "vienna", cat: "景點", name: "Albertina", nameZh: "阿爾貝蒂娜美術館", lat: 48.2047, lng: 16.3681, note: "版畫與現當代藝術" },
  { city: "vienna", cat: "景點", name: "Belvedere Palace", nameZh: "美景宮", lat: 48.1915, lng: 16.3809, note: "Klimt 原作《吻》" },
  { city: "vienna", cat: "景點", name: "Votive Church", nameZh: "感恩/沃蒂夫教堂", lat: 48.2156, lng: 16.3585, note: "新哥德式 · 光影展" },
  { city: "vienna", cat: "景點", name: "Karlskirche", nameZh: "卡爾教堂", lat: 48.1982, lng: 16.3714, note: "巴洛克式 · 可搭升降機上頂" },
  { city: "vienna", cat: "景點", name: "Vienna City Hall", nameZh: "市政廳", lat: 48.2108, lng: 16.3573, note: "外觀打卡 · 7月有Film Festival" },
  { city: "vienna", cat: "景點", name: "Prater", nameZh: "普拉特遊樂場", lat: 48.2166, lng: 16.3959, note: "摩天輪日落 Riesenrad" },
  { city: "vienna", cat: "景點", name: "Kaisermühlenbucht", nameZh: "多瑙河灣觀景台", lat: 48.2315, lng: 16.4162, note: "22區 · 絕美多瑙河景" },
  { city: "vienna", cat: "餐廳", name: "Figlmüller Bäckerstraße", nameZh: "費格米勒炸豬排", lat: 48.2093, lng: 16.3748, note: "經典炸豬排 €20–30" },
  { city: "vienna", cat: "餐廳", name: "Schnitzel One", nameZh: "炸豬排一號", lat: 48.1932, lng: 16.3456, note: "評分更高 ⚡ 另一炸豬排選擇" },
  { city: "vienna", cat: "餐廳", name: "Schweizerhaus", nameZh: "瑞士屋", lat: 48.2181, lng: 16.3984, note: "Prater 啤酒花園 · 豬腳+捷克啤酒" },
  { city: "vienna", cat: "餐廳", name: "Chattanooga", nameZh: "查塔努加", lat: 48.2087, lng: 16.3701, note: "Graben 附近 · 下午4點後變明亮啤酒屋" },
  { city: "vienna", cat: "咖啡 · 甜點", name: "Café Sperl", nameZh: "斯佩爾咖啡", lat: 48.2007, lng: 16.3606, note: "1880年 · 經典維也納咖啡館有鋼琴演奏" },
  { city: "vienna", cat: "咖啡 · 甜點", name: "Café Diglas", nameZh: "蒂格拉斯咖啡", lat: 48.2078, lng: 16.3754, note: "近聖史蒂芬大教堂 · 蛋糕出色" },
  { city: "vienna", cat: "咖啡 · 甜點", name: "Demel", nameZh: "德梅爾皇家糕點", lat: 48.2086, lng: 16.3673, note: "皇室甜點 · Kohlmarkt 14 極近酒店" },
  { city: "vienna", cat: "咖啡 · 甜點", name: "Café Goldegg", nameZh: "金蛋咖啡", lat: 48.1904, lng: 16.3768, note: "近美景宮 · 本地人去嘅" },
  { city: "vienna", cat: "咖啡 · 甜點", name: "GOTA Coffee Experts", nameZh: "GOTA精品咖啡", lat: 48.1939, lng: 16.3262, note: "歐洲頂尖 Specialty coffee" },

  // === 布拉格 Prague ===
  { city: "prague", cat: "景點", name: "Prague Castle", nameZh: "布拉格城堡", lat: 50.0911, lng: 14.4016, note: "世界最大古堡群 · 朝早去避人潮" },
  { city: "prague", cat: "景點", name: "Charles Bridge", nameZh: "查理大橋", lat: 50.0865, lng: 14.4114, note: "日出與日落最靚 · 24小時開放" },
  { city: "prague", cat: "景點", name: "Old Town Bridge Tower", nameZh: "舊城橋塔", lat: 50.0862, lng: 14.4135, note: "登頂望 Charles Bridge 全景" },
  { city: "prague", cat: "景點", name: "The Vrtba Garden", nameZh: "維爾特巴花園", lat: 50.0869, lng: 14.4032, note: "UNESCO 巴洛克花園 · 人少寧靜" },
  { city: "prague", cat: "景點", name: "Střelecký Island", nameZh: "射手島", lat: 50.0815, lng: 14.4098, note: "河中小島散步 · 休憩綠洲" },
  { city: "prague", cat: "餐廳", name: "Kantýna", nameZh: "卡恩蒂納肉食館", lat: 50.0843, lng: 14.4303, note: "肉舖+餐廳概念 · 牛排本地人極推薦" },
  { city: "prague", cat: "餐廳", name: "Venue", nameZh: "Venue bistro", lat: 50.0844, lng: 14.4215, note: "人氣極高 Brunch · 8am開易排隊" },
  { city: "prague", cat: "餐廳", name: "Pork's Vodičkova", nameZh: "波克斯豬肉館", lat: 50.0792, lng: 14.4246, note: "豬肉專門店 · 豬扒更佳" },
  { city: "prague", cat: "餐廳", name: "Terasa U Prince", nameZh: "王子露台", lat: 50.0872, lng: 14.4207, note: "Old Town Square 天台餐廳 · 經典打卡景觀" },
  { city: "prague", cat: "咖啡 · 甜點", name: "Café Kafíčko", nameZh: "卡菲思科咖啡", lat: 50.0881, lng: 14.4045, note: "Malá Strana 寧靜小巷 · 必試蜂蜜蛋糕" },
  { city: "prague", cat: "咖啡 · 甜點", name: "Arte Bianca Bakery", nameZh: "白藝術麵包店", lat: 50.0754, lng: 14.4448, note: "Vinohrady 區 4.9高分 · 開心果可頌" },

  // === 布達佩斯 Budapest ===
  { city: "budapest", cat: "景點", name: "Buda Castle", nameZh: "布達城堡", lat: 47.4962, lng: 19.0396, note: "Buda 側山頂 · 可搭纜車上山" },
  { city: "budapest", cat: "景點", name: "Fisherman's Bastion", nameZh: "漁人堡", lat: 47.5019, lng: 19.0349, note: "日落與夜景時分最美 · 有童話感" },
  { city: "budapest", cat: "景點", name: "Széchenyi Chain Bridge", nameZh: "塞切尼鏈橋", lat: 47.4989, lng: 19.0437, note: "最經典夜景大橋 · 連接布達與佩斯" },
  { city: "budapest", cat: "景點", name: "Liberty Bridge", nameZh: "自由橋", lat: 47.4858, lng: 19.0556, note: "綠色鐵橋 · 非常容易出片" },
  { city: "budapest", cat: "餐廳", name: "Cirkusz Café", nameZh: "馬戲團咖啡", lat: 47.4986, lng: 19.0601, note: "7:30am 開 · Brunch 首選" },
  { city: "budapest", cat: "餐廳", name: "Comme Chez Soi", nameZh: "法式小館", lat: 47.4941, lng: 19.0528, note: "必試鵝肝配蘋果火焰 · 記得提前預約" },
  { city: "budapest", cat: "餐廳", name: "Mosselen Belgian Beer Café", nameZh: "比利時啤酒咖啡", lat: 47.5142, lng: 19.0514, note: "主打青口與比利時啤酒 · 位於13區" },
  { city: "budapest", cat: "餐廳", name: "Taste Asian", nameZh: "亞洲味道", lat: 47.4952, lng: 19.0589, note: "鵝肝+亞洲菜出色 · 想換口味時去" },
  { city: "budapest", cat: "甜點 · 酒吧", name: "White Raven Skybar", nameZh: "白烏鴉天台酒吧", lat: 47.5021, lng: 19.0345, note: "Hilton 頂層 · 望漁人堡 Sunset 最佳 · 2pm開" },
  { city: "budapest", cat: "甜點 · 酒吧", name: "Gelateria La Romana", nameZh: "羅馬娜雪糕", lat: 47.4925, lng: 19.0542, note: "連鎖高質意式雪糕店" },
];

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
