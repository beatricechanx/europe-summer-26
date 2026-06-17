import React, { useState, useEffect, useRef } from "react";
import MapView from "./components/MapView";
import CountdownTimer from "./components/CountdownTimer";
import ProfilePicker from "./components/ProfilePicker";
import TripTimeline from "./components/TripTimeline";
import BudgetPage from "./components/BudgetPage";
import { usePersisted } from "./utils/storage";
import { MAP_PLACES } from "./data/places";

const MORANDI = {
  bg: "#E8E4DF",
  card: "#F2EFEB",
  text: "#4A4541",
  textLight: "#8A8580",
  accent: "#9B8E82",
  accentSoft: "#C4B9AE",
  sage: "#A3AE9E",
  dustyRose: "#C4A9A0",
  slate: "#8E9CA5",
  warm: "#BFA58A",
  border: "#D5D0CA",
  white: "#FAFAF8",
};

const CAT_OPTIONS = ["景點", "餐廳", "咖啡 · 甜點", "甜點 · 酒吧", "其他"];
const EXPENSE_CATS = ["餐飲", "交通", "住宿", "購物", "門票", "其他"];

// Nominatim viewbox: left,top,right,bottom
const CITY_BBOX = {
  vienna:   "16.18,48.33,16.58,48.10",
  prague:   "14.22,50.18,14.71,49.97",
  budapest: "18.92,47.62,19.33,47.35",
};

function mapsUrl(name, cityNameEn) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + cityNameEn)}`;
}

const cities = [
  {
    id: "vienna", name: "Wien", nameEn: "Vienna",
    dates: "7/10 — 7/13", hotel: "Park Hyatt Vienna", hotelNote: "Am Hof 2, 1010",
    weather: "25–34°C · 偶有雷陣雨", accent: MORANDI.sage,
    tagline: "The City of… Before Sunrise",
    lat: 48.2082, lon: 16.3738,
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Vienna+Austria",
    places: [
      { cat: "景點", items: [
        { name: "St. Stephen's Cathedral", nameZh: "聖史蒂芬大教堂", note: "酒店步行5min" },
        { name: "Kunsthistorisches Museum", nameZh: "藝術史博物館", note: "如果只揀一間博物館" },
        { name: "Albertina", nameZh: "阿爾貝蒂娜美術館", note: "" },
        { name: "Belvedere Palace", nameZh: "美景宮", note: "Klimt 原作" },
        { name: "Votive Church", nameZh: "感恩教堂", note: "哥德式" },
        { name: "Karlskirche", nameZh: "卡爾教堂", note: "巴洛克" },
        { name: "Vienna City Hall", nameZh: "市政廳", note: "外觀打卡" },
        { name: "Prater", nameZh: "普拉特遊樂場", note: "摩天輪日落" },
        { name: "Kaisermühlenbucht", nameZh: "觀景台", note: "多瑙河景" },
      ]},
      { cat: "餐廳", items: [
        { name: "Figlmüller", nameZh: "", note: "必食炸豬排 · Bäckerstraße" },
        { name: "Schnitzel One", nameZh: "", note: "另一炸豬排選擇" },
        { name: "Schweizerhaus", nameZh: "", note: "Prater 啤酒花園 · 豬肋骨" },
        { name: "Chattanooga", nameZh: "", note: "Graben 附近" },
        { name: "Wiener Stadtbräu", nameZh: "", note: "本地啤酒" },
      ]},
      { cat: "咖啡 · 甜點", items: [
        { name: "Café Sperl", nameZh: "", note: "經典維也納咖啡館" },
        { name: "Café Diglas", nameZh: "", note: "蛋糕" },
        { name: "Demel", nameZh: "", note: "皇室甜點 · Kohlmarkt" },
        { name: "Café Goldegg", nameZh: "", note: "本地人去嘅" },
        { name: "Kachel Café", nameZh: "", note: "1040區 · 隱世" },
        { name: "GOTA Coffee Experts", nameZh: "", note: "Specialty coffee" },
        { name: "re:kaffee", nameZh: "", note: "近中央車站" },
        { name: "ERICH", nameZh: "", note: "Neustiftgasse" },
        { name: "Öfferl (Schottengasse)", nameZh: "", note: "烘焙" },
        { name: "Öfferl (Wollzeile)", nameZh: "", note: "烘焙" },
      ]},
    ],
  },
  {
    id: "prague", name: "Praha", nameEn: "Prague",
    dates: "7/13 — 7/15", hotel: "Andaz Prague", hotelNote: "Senovážné nám., 近主車站",
    weather: "23–32°C · 午後雷陣雨機會高", accent: MORANDI.dustyRose,
    tagline: "The City of Red Roofs",
    lat: 50.0755, lon: 14.4378,
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Prague+Czech+Republic",
    places: [
      { cat: "景點", items: [
        { name: "Prague Castle", nameZh: "布拉格城堡", note: "朝早去避人潮" },
        { name: "Charles Bridge", nameZh: "查理大橋", note: "日出最靚" },
        { name: "Old Town Bridge Tower", nameZh: "舊城橋塔", note: "登頂睇全景" },
        { name: "Great South Tower", nameZh: "南塔", note: "舊城廣場觀景" },
        { name: "Vrtba Garden", nameZh: "維爾特巴花園", note: "巴洛克花園 · 寧靜" },
        { name: "Střelecký Island", nameZh: "射手島", note: "河中小島散步" },
      ]},
      { cat: "餐廳", items: [
        { name: "Kantýna", nameZh: "", note: "牛排 · 本地人推薦" },
        { name: "Venue", nameZh: "", note: "Bistro" },
        { name: "Ribs of Prague", nameZh: "", note: "Melantrichova · 豬肋骨" },
        { name: "Pork's", nameZh: "", note: "Vodičkova · 豬肉專門" },
        { name: "Terasa U Prince", nameZh: "", note: "天台餐廳 · 景觀" },
      ]},
      { cat: "咖啡 · 甜點", items: [
        { name: "Café Kafíčko", nameZh: "", note: "Malá Strana · 寧靜" },
        { name: "Lázeňská 4", nameZh: "", note: "小巷咖啡" },
        { name: "TYPIKA Karlín", nameZh: "", note: "Specialty coffee" },
        { name: "Cafefin", nameZh: "", note: "" },
        { name: "(A)void Cafe", nameZh: "", note: "" },
        { name: "Arte Bianca", nameZh: "", note: "意式烘焙" },
        { name: "TISSE Bakery", nameZh: "", note: "Nusle" },
      ]},
    ],
  },
  {
    id: "budapest", name: "Budapest", nameEn: "Budapest",
    dates: "7/15 — 7/17", hotel: "Párisi Udvar Hotel", hotelNote: "Hyatt · 5th District · Pest側",
    weather: "25–35°C · 中歐最熱城市", accent: MORANDI.slate,
    tagline: "The Blue Danube",
    lat: 47.4979, lon: 19.0402,
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Budapest+Hungary",
    places: [
      { cat: "景點", items: [
        { name: "Buda Castle", nameZh: "布達城堡", note: "Buda 側" },
        { name: "Fisherman's Bastion", nameZh: "漁人堡", note: "日落時分" },
        { name: "Széchenyi Chain Bridge", nameZh: "鏈橋", note: "夜景" },
        { name: "Liberty Bridge", nameZh: "自由橋", note: "Szabadság híd" },
      ]},
      { cat: "餐廳", items: [
        { name: "Cirkusz Café", nameZh: "", note: "Brunch 首選" },
        { name: "Comme Chez Soi", nameZh: "", note: "法式 · 晚餐" },
        { name: "Mosselen", nameZh: "", note: "Belgian Beer Café · 青口" },
        { name: "Taste Asian", nameZh: "", note: "想食亞洲嘢嗰陣" },
      ]},
      { cat: "甜點 · 酒吧", items: [
        { name: "White Raven Skybar", nameZh: "", note: "Sunset drinks" },
        { name: "Gelateria La Romana", nameZh: "", note: "兩間分店" },
      ]},
    ],
  },
];

const transport = [
  { from: "Hong Kong (HKG)", to: "Beijing (PEK)", icon: "✈️", flight: "CA 110", detail: "7/10 Fri · 17:45 — 21:15", trainKey: null },
  { from: "Beijing (PEK)", to: "Vienna (VIE)", icon: "✈️", flight: "CA 841", detail: "7/11 Sat · 02:55 — 06:50", trainKey: null },
  { from: "Vienna", to: "Prague", icon: "🚂", flight: "ÖBB Train", detail: "7/13 · ~4hr 行程", trainKey: "vp" },
  { from: "Prague", to: "Budapest", icon: "🚂", flight: "ČD Train", detail: "7/15 · 6:00am · ~7hr 行程", trainKey: "pb" },
  { from: "Budapest (BUD)", to: "Beijing (PEK)", icon: "✈️", flight: "CA 720", detail: "7/17 Fri · 13:00 — 04:10 (+1)", trainKey: null },
  { from: "Beijing (PKX)", to: "Hong Kong (HKG)", icon: "✈️", flight: "CA 763", detail: "7/18 Sat · 13:40 — 17:10", trainKey: null },
];

const DEFAULT_EXPENSES = [
  { id: 1, desc: "機票 (CA 110 + CA 841)", amount: 6800, category: "交通" },
  { id: 2, desc: "Vienna 酒店住宿", amount: 4500, category: "住宿" },
  { id: 3, desc: "Prague 酒店住宿", amount: 3200, category: "住宿" },
  { id: 4, desc: "Budapest 酒店住宿", amount: 3800, category: "住宿" },
];

// ── Tiny shared UI ──────────────────────────────────────────────────────────

const ChevronDown = ({ rotated }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
    style={{ transform: rotated ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.22s ease", flexShrink: 0 }}>
    <path d="M4 6L8 10L12 6" stroke={MORANDI.textLight} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconBtn = ({ onClick, title, children, danger }) => (
  <button onClick={onClick} title={title}
    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
      color: danger ? "#C4A9A0" : MORANDI.textLight, fontSize: 13, lineHeight: 1, flexShrink: 0 }}>
    {children}
  </button>
);

const MapsLink = ({ name, cityNameEn }) => (
  <a href={mapsUrl(name, cityNameEn)} target="_blank" rel="noopener noreferrer"
    onClick={e => e.stopPropagation()} title="在 Google Maps 搵"
    style={{ fontSize: 12, color: MORANDI.textLight, textDecoration: "none", flexShrink: 0, lineHeight: 1, padding: "0 2px" }}>
    📍
  </a>
);

const inputStyle = (extra = {}) => ({
  padding: "6px 10px", border: `1px solid ${MORANDI.border}`, borderRadius: 7,
  fontSize: 12, background: MORANDI.bg, color: MORANDI.text, outline: "none", ...extra,
});

const CatIcon = ({ cat }) => {
  const s = { width: 14, height: 14, display: "inline-block", verticalAlign: "middle", marginRight: 6 };
  if (cat.includes("景")) return (
    <svg style={s} viewBox="0 0 16 16">
      <circle cx="8" cy="6" r="3" fill="none" stroke={MORANDI.accent} strokeWidth="1.2" />
      <path d="M3,14 Q8,10 13,14" fill="none" stroke={MORANDI.accent} strokeWidth="1.2" />
    </svg>
  );
  if (cat.includes("餐")) return (
    <svg style={s} viewBox="0 0 16 16">
      <circle cx="8" cy="9" r="5" fill="none" stroke={MORANDI.accent} strokeWidth="1.2" />
      <line x1="8" y1="2" x2="8" y2="4" stroke={MORANDI.accent} strokeWidth="1" />
    </svg>
  );
  return (
    <svg style={s} viewBox="0 0 16 16">
      <rect x="3" y="6" width="10" height="8" rx="2" fill="none" stroke={MORANDI.accent} strokeWidth="1.2" />
      <path d="M13,8 Q15,8 15,10 Q15,12 13,12" fill="none" stroke={MORANDI.accent} strokeWidth="1" />
      <path d="M6,4 Q8,2 10,4" fill="none" stroke={MORANDI.accent} strokeWidth="0.8" />
    </svg>
  );
};

const CityIllustration = ({ city }) => {
  if (city === "vienna") return (
    <svg viewBox="0 0 200 80" style={{ width: "100%", height: 80 }}>
      <line x1="20" y1="78" x2="180" y2="78" stroke={MORANDI.accentSoft} strokeWidth="0.5" />
      <line x1="60" y1="15" x2="60" y2="55" stroke={MORANDI.accent} strokeWidth="1" />
      <polygon points="60,15 54,40 66,40" fill="none" stroke={MORANDI.accent} strokeWidth="0.8" />
      <rect x="50" y="55" width="20" height="23" fill="none" stroke={MORANDI.accent} strokeWidth="0.8" rx="1" />
      <circle cx="130" cy="45" r="25" fill="none" stroke={MORANDI.sage} strokeWidth="0.6" />
      <line x1="130" y1="70" x2="130" y2="45" stroke={MORANDI.sage} strokeWidth="0.8" />
      <line x1="115" y1="70" x2="130" y2="45" stroke={MORANDI.sage} strokeWidth="0.5" />
      <line x1="145" y1="70" x2="130" y2="45" stroke={MORANDI.sage} strokeWidth="0.5" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const x = 130+25*Math.cos(a*Math.PI/180), y = 45+25*Math.sin(a*Math.PI/180);
        return <circle key={a} cx={x} cy={y} r="2.5" fill="none" stroke={MORANDI.sage} strokeWidth="0.5" />;
      })}
      <rect x="22" y="62" width="12" height="10" rx="2" fill="none" stroke={MORANDI.warm} strokeWidth="0.8" />
      <path d="M34,65 Q38,65 38,68 Q38,71 34,71" fill="none" stroke={MORANDI.warm} strokeWidth="0.6" />
      <path d="M25,60 Q28,56 31,60" fill="none" stroke={MORANDI.warm} strokeWidth="0.5" />
    </svg>
  );
  if (city === "prague") return (
    <svg viewBox="0 0 200 80" style={{ width: "100%", height: 80 }}>
      <line x1="10" y1="78" x2="190" y2="78" stroke={MORANDI.accentSoft} strokeWidth="0.5" />
      <path d="M20,60 Q60,45 100,60 Q140,45 180,60" fill="none" stroke={MORANDI.dustyRose} strokeWidth="1" />
      {[35,55,75,105,125,145,165].map(x => <line key={x} x1={x} y1={60} x2={x} y2="78" stroke={MORANDI.dustyRose} strokeWidth="0.5" />)}
      <rect x="70" y="20" width="8" height="40" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" />
      <polygon points="74,20 68,12 80,12" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" />
      <rect x="90" y="30" width="10" height="30" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" />
      <polygon points="95,30 88,22 102,22" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" />
      <rect x="112" y="25" width="7" height="35" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" />
      <polygon points="115.5,25 110,17 121,17" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" />
    </svg>
  );
  return (
    <svg viewBox="0 0 200 80" style={{ width: "100%", height: 80 }}>
      <line x1="10" y1="78" x2="190" y2="78" stroke={MORANDI.accentSoft} strokeWidth="0.5" />
      <path d="M10,55 Q50,48 100,55 Q150,48 190,55" fill="none" stroke={MORANDI.slate} strokeWidth="0.8" />
      <path d="M10,58 Q50,51 100,58 Q150,51 190,58" fill="none" stroke={MORANDI.slate} strokeWidth="0.4" opacity="0.5" />
      <path d="M25,55 Q45,20 75,55" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" />
      <rect x="40" y="28" width="16" height="12" fill="none" stroke={MORANDI.accent} strokeWidth="0.7" rx="1" />
      <line x1="48" y1="22" x2="48" y2="28" stroke={MORANDI.accent} strokeWidth="0.5" />
      <rect x="120" y="35" width="30" height="20" fill="none" stroke={MORANDI.slate} strokeWidth="0.6" rx="1" />
      <ellipse cx="135" cy="35" rx="8" ry="6" fill="none" stroke={MORANDI.slate} strokeWidth="0.6" />
      <line x1="135" y1="24" x2="135" y2="29" stroke={MORANDI.slate} strokeWidth="0.5" />
    </svg>
  );
};

if (typeof document !== "undefined") {
  const href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap";
  if (!document.head.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement("link");
    link.href = href; link.rel = "stylesheet";
    document.head.appendChild(link);
  }
}

// ── Outer wrapper: handles user profile ─────────────────────────────────────

export default function TravelPage() {
  const [user, setUser] = useState(() => localStorage.getItem("eu-user") || "");

  if (!user) {
    return (
      <ProfilePicker onSelect={(name) => {
        localStorage.setItem("eu-user", name);
        setUser(name);
      }} />
    );
  }

  return (
    <AppContent
      key={user}
      user={user}
      onChangeUser={() => {
        localStorage.removeItem("eu-user");
        setUser("");
      }}
    />
  );
}

// ── Inner app (remounted on user switch) ─────────────────────────────────────

function AppContent({ user, onChangeUser }) {
  const userEmoji = user === "Bea" ? "🍒" : "🌸";

  const [activeCity, setActiveCity] = useState("vienna");
  const [openCats, setOpenCats] = usePersisted(`${user}:openCats`, {});
  const [trainRefs, setTrainRefs] = usePersisted(`${user}:trainRefs`, { vp: "", pb: "" });
  const [checkedItems, setCheckedItems] = usePersisted(`${user}:checkedItems`, {});
  const [activeTab, setActiveTab] = useState("itinerary");
  const [transportOpen, setTransportOpen] = useState(true);

  // Custom places (persisted, user-namespaced)
  const [customPlaces, setCustomPlaces] = usePersisted(`${user}:customPlaces`, { vienna: [], prague: [], budapest: [] });
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceCat, setNewPlaceCat] = useState("景點");
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [editingPlaceData, setEditingPlaceData] = useState({ name: "", note: "", cat: "景點" });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nominatimSuggestions, setNominatimSuggestions] = useState([]);
  const [selectedNominatim, setSelectedNominatim] = useState(null);
  const suggestionsRef = useRef(null);

  // Simple expenses (persisted, user-namespaced)
  const [expenses, setExpenses] = usePersisted(`${user}:expenses`, DEFAULT_EXPENSES);
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("餐飲");
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseData, setEditingExpenseData] = useState({ desc: "", amount: "", category: "餐飲" });

  const [weatherData, setWeatherData] = useState({ vienna: "載入中…", prague: "載入中…", budapest: "載入中…" });

  // Fetch weather
  useEffect(() => {
    (async () => {
      const updated = {};
      for (const c of cities) {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code&timezone=auto`);
          const data = await res.json();
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          let desc = "晴朗";
          if (code >= 1 && code <= 3) desc = "多雲";
          if (code >= 45 && code <= 48) desc = "有霧";
          if (code >= 51 && code <= 67) desc = "飄雨";
          if (code >= 71 && code <= 77) desc = "有雪";
          if (code >= 80 && code <= 82) desc = "陣雨🌧️";
          if (code >= 95) desc = "雷暴⛈️";
          updated[c.id] = `${temp}°C · ${desc}`;
        } catch {
          updated[c.id] = c.weather;
        }
      }
      setWeatherData(updated);
    })();
  }, []);

  // Nominatim autocomplete for add-place form
  useEffect(() => {
    if (newPlaceName.trim().length < 2) { setNominatimSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const bbox = CITY_BBOX[activeCity];
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newPlaceName)}&format=json&limit=6&viewbox=${bbox}&bounded=1&email=beatricechanx@gmail.com&accept-language=zh-HK,zh,en`);
        const data = await res.json();
        setNominatimSuggestions(data);
      } catch {
        setNominatimSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [newPlaceName, activeCity]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Handlers ──

  const toggleCat = (key) => setOpenCats(p => ({ ...p, [key]: !p[key] }));
  const toggleCheck = (id) => setCheckedItems(p => ({ ...p, [id]: !p[id] }));

  const handleAddPlace = (e) => {
    e.preventDefault();
    if (!newPlaceName.trim()) return;
    const place = {
      id: Date.now(),
      name: newPlaceName.trim(),
      note: "",
      cat: newPlaceCat,
      ...(selectedNominatim && {
        mapLat: parseFloat(selectedNominatim.lat),
        mapLng: parseFloat(selectedNominatim.lon),
      }),
    };
    setCustomPlaces(p => ({ ...p, [activeCity]: [...p[activeCity], place] }));
    setNewPlaceName("");
    setSelectedNominatim(null);
    setNominatimSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDeletePlace = (cityId, placeId) => {
    setCustomPlaces(p => ({ ...p, [cityId]: p[cityId].filter(x => x.id !== placeId) }));
    if (editingPlaceId === placeId) setEditingPlaceId(null);
  };

  const startEditPlace = (place) => {
    setEditingPlaceId(place.id);
    setEditingPlaceData({ name: place.name, note: place.note ?? "", cat: place.cat });
  };

  const saveEditPlace = (cityId) => {
    if (!editingPlaceData.name.trim()) return;
    setCustomPlaces(p => ({
      ...p,
      [cityId]: p[cityId].map(x => x.id === editingPlaceId
        ? { ...x, ...editingPlaceData, name: editingPlaceData.name.trim() }
        : x),
    }));
    setEditingPlaceId(null);
  };

  // Called from MapView when user adds a pin via Nominatim search
  const handleMapAddPlace = (cityId, place) => {
    setCustomPlaces(p => ({ ...p, [cityId]: [...(p[cityId] ?? []), place] }));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpenseDesc.trim() || !newExpenseAmount) return;
    setExpenses(p => [...p, { id: Date.now(), desc: newExpenseDesc.trim(), amount: parseFloat(newExpenseAmount), category: newExpenseCat }]);
    setNewExpenseDesc("");
    setNewExpenseAmount("");
  };

  const handleDeleteExpense = (id) => {
    setExpenses(p => p.filter(x => x.id !== id));
    if (editingExpenseId === id) setEditingExpenseId(null);
  };

  const startEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setEditingExpenseData({ desc: exp.desc, amount: String(exp.amount), category: exp.category });
  };

  const saveEditExpense = () => {
    if (!editingExpenseData.desc.trim() || !editingExpenseData.amount) return;
    setExpenses(p => p.map(x => x.id === editingExpenseId
      ? { ...x, desc: editingExpenseData.desc.trim(), amount: parseFloat(editingExpenseData.amount), category: editingExpenseData.category }
      : x
    ));
    setEditingExpenseId(null);
  };

  const city = cities.find(c => c.id === activeCity);
  const totalSpent = expenses.reduce((sum, x) => sum + x.amount, 0);
  const cityCustomPlaces = customPlaces[activeCity] ?? [];
  const showCityCols = activeTab !== "budget";

  return (
    <div style={{ minHeight: "100vh", background: MORANDI.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif", color: MORANDI.text, maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{ padding: "36px 24px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: MORANDI.textLight, marginBottom: 8 }}>JULY 2026 ₍ᐢ.ˬ.ᐢ₎♡🍒</div>
        <h1 style={{ fontSize: 36, fontWeight: 300, margin: "0 0 4px", letterSpacing: 1, color: "#C4A9A0", lineHeight: 1.2, fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif" }}>
          <div>Bea & Cora's</div>
          <div style={{ marginTop: 2, fontSize: 30 }}>European Summer</div>
        </h1>

        {/* Countdown */}
        <CountdownTimer />

        <div style={{ fontSize: 12, color: MORANDI.textLight, letterSpacing: 2.5, borderTop: `1px solid ${MORANDI.border}`, paddingTop: 10, marginTop: 10, display: "inline-block", paddingLeft: 16, paddingRight: 16, fontFamily: "'Cormorant Garamond', serif", textTransform: "uppercase" }}>
          🌞 Wien · Praha · Budapest 🇪🇺✨
        </div>

        {/* Action row */}
        <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://maps.app.goo.gl/StN8UirVpaZVF36h8?g_st=i" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 18, border: `1px solid ${MORANDI.border}`, background: MORANDI.white, color: MORANDI.text, fontSize: 11, textDecoration: "none", fontWeight: 500, letterSpacing: 0.3 }}>
            <span style={{ fontSize: 14 }}>🗺️</span>
            <span>Europe₍ᐢ. .ᐢ₎₊˚⊹ ᰔ · Beatrice</span>
            <span style={{ fontSize: 9, color: MORANDI.textLight }}>↗</span>
          </a>
          {/* Profile chip */}
          <button onClick={onChangeUser}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 18, border: `1px solid ${MORANDI.border}`, background: MORANDI.card, color: MORANDI.textLight, fontSize: 11, cursor: "pointer", letterSpacing: 0.3 }}>
            <span>{userEmoji}</span>
            <span>{user}</span>
            <span style={{ fontSize: 9 }}>切換</span>
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{ display: "flex", gap: 8, padding: "0 24px", marginBottom: 20 }}>
        {[["itinerary", "行程清單"], ["map", "地圖"], ["budget", "預算分帳"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "9px 4px", background: activeTab === tab ? MORANDI.card : "transparent", color: MORANDI.text, border: `1px solid ${MORANDI.border}`, borderRadius: 12, fontSize: 11, letterSpacing: 0.3, fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Budget tab — full page, no city tabs */}
      {activeTab === "budget" && <BudgetPage user={user} />}

      {/* Itinerary + Map tabs share the city chrome */}
      {showCityCols && (
        <>
          {/* ── Transport — collapsible ── */}
          <div style={{ padding: "0 24px", marginBottom: 20 }}>
            <div style={{ background: MORANDI.card, borderRadius: 16, border: `1px solid ${MORANDI.border}`, overflow: "hidden" }}>
              <button onClick={() => setTransportOpen(p => !p)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", background: "transparent", border: "none", cursor: "pointer", borderBottom: transportOpen ? `1px solid ${MORANDI.border}` : "none" }}>
                <span style={{ fontSize: 10, letterSpacing: 2, color: MORANDI.textLight, textTransform: "uppercase", fontWeight: 500 }}>✈️ 航班與交通路程</span>
                <ChevronDown rotated={transportOpen} />
              </button>
              {transportOpen && (
                <div style={{ padding: "4px 20px 8px" }}>
                  {transport.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 0", borderBottom: i < transport.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
                      <span style={{ fontSize: 15, width: 20, marginTop: 2, textAlign: "center" }}>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{t.from} → {t.to}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                          {t.flight && <span style={{ fontSize: 9, background: MORANDI.border, padding: "2px 6px", borderRadius: 4, color: MORANDI.text, fontWeight: 500 }}>{t.flight}</span>}
                          <span style={{ fontSize: 11, color: MORANDI.textLight }}>{t.detail}</span>
                        </div>
                      </div>
                      {t.trainKey && (
                        <input placeholder="Ref 編號" value={trainRefs[t.trainKey]}
                          onChange={e => setTrainRefs(p => ({ ...p, [t.trainKey]: e.target.value }))}
                          style={{ width: 78, fontSize: 10, padding: "4px 8px", border: `1px solid ${MORANDI.border}`, borderRadius: 8, background: MORANDI.white, color: MORANDI.text, outline: "none", marginTop: 2 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── City tabs ── */}
          <div style={{ display: "flex", padding: "0 24px", marginBottom: 20 }}>
            {cities.map(c => (
              <button key={c.id} onClick={() => setActiveCity(c.id)} style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer", background: "transparent", borderBottom: activeCity === c.id ? `2px solid ${c.accent}` : `1px solid ${MORANDI.border}`, color: activeCity === c.id ? MORANDI.text : MORANDI.textLight, fontSize: 13, fontWeight: activeCity === c.id ? 500 : 400, letterSpacing: 0.5, transition: "all 0.15s" }}>
                {c.name}
              </button>
            ))}
          </div>

          {/* ── Per-city content ── */}
          <div style={{ padding: "0 24px" }}>
            <div style={{ marginBottom: 14, opacity: 0.85 }}><CityIllustration city={activeCity} /></div>

            <div style={{ textAlign: "center", marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 400, letterSpacing: 0.5, marginBottom: 4, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>{city.tagline}</div>
              <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 10 }}>{city.dates}</div>
              <a href={city.mapUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 12, border: `1px solid ${MORANDI.border}`, color: MORANDI.textLight, fontSize: 10, textDecoration: "none", fontStyle: "italic" }}>
                📍 Explore {city.nameEn} Map
              </a>
            </div>

            {/* Hotel */}
            <div style={{ background: MORANDI.white, borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: `1px solid ${MORANDI.border}` }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: MORANDI.textLight, marginBottom: 5 }}>住宿</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{city.hotel}</div>
              <div style={{ fontSize: 11, color: MORANDI.textLight, marginTop: 2 }}>{city.hotelNote}</div>
            </div>

            {/* Weather */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", marginBottom: 18, background: MORANDI.card, borderRadius: 10, border: `1px solid ${MORANDI.border}` }}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="3.5" fill="none" stroke={MORANDI.warm} strokeWidth="1.2" />
                {[0,45,90,135,180,225,270,315].map(a => {
                  const x1 = 8+5*Math.cos(a*Math.PI/180), y1 = 8+5*Math.sin(a*Math.PI/180);
                  const x2 = 8+6.5*Math.cos(a*Math.PI/180), y2 = 8+6.5*Math.sin(a*Math.PI/180);
                  return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={MORANDI.warm} strokeWidth="0.8" />;
                })}
              </svg>
              <span style={{ fontSize: 12, color: MORANDI.textLight, fontStyle: "italic" }}>Real-time: {weatherData[activeCity]}</span>
            </div>

            {/* ── Tab content ── */}
            {activeTab === "itinerary" ? (
              <div>
                {/* Preset place categories */}
                {city.places.map((cat, ci) => {
                  const key = `${activeCity}-${ci}`;
                  const isOpen = openCats[key] !== false;
                  return (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <button onClick={() => toggleCat(key)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", border: "none", cursor: "pointer", background: MORANDI.card, borderRadius: isOpen ? "12px 12px 0 0" : 12, color: MORANDI.text, borderBottom: isOpen ? `1px solid ${MORANDI.border}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CatIcon cat={cat.cat} />
                          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }}>{cat.cat}</span>
                          <span style={{ fontSize: 10, color: MORANDI.textLight, marginLeft: 4 }}>{cat.items.length}</span>
                        </div>
                        <ChevronDown rotated={isOpen} />
                      </button>
                      {isOpen && (
                        <div style={{ background: MORANDI.card, borderRadius: "0 0 12px 12px", padding: "4px 0" }}>
                          {cat.items.map((item, ii) => {
                            const itemId = `${key}-${ii}`;
                            const isChecked = !!checkedItems[itemId];
                            return (
                              <div key={ii} onClick={() => toggleCheck(itemId)} style={{ padding: "10px 16px", display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", backgroundColor: isChecked ? "rgba(250,250,248,0.4)" : "transparent", borderBottom: ii < cat.items.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
                                <div style={{ marginTop: 2, width: 13, height: 13, borderRadius: "50%", border: `1px solid ${isChecked ? MORANDI.accent : MORANDI.textLight}`, background: isChecked ? MORANDI.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {isChecked && <div style={{ width: 5, height: 5, borderRadius: "50%", background: MORANDI.white }} />}
                                </div>
                                <div style={{ flex: 1, opacity: isChecked ? 0.5 : 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13, fontWeight: 500, textDecoration: isChecked ? "line-through" : "none" }}>{item.name}</span>
                                    {item.nameZh && <span style={{ fontSize: 12, color: MORANDI.textLight }}>{item.nameZh}</span>}
                                    <MapsLink name={item.name} cityNameEn={city.nameEn} />
                                  </div>
                                  {item.note && <div style={{ fontSize: 11, color: MORANDI.textLight, marginTop: 2 }}>{item.note}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Custom places (My List) ── */}
                <div style={{ marginTop: 18, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: MORANDI.textLight, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
                    我的清單 · {city.nameEn}{cityCustomPlaces.length > 0 && ` (${cityCustomPlaces.length})`}
                  </div>

                  {cityCustomPlaces.length > 0 && (
                    <div style={{ background: MORANDI.card, borderRadius: 12, marginBottom: 10, overflow: "hidden", border: `1px solid ${MORANDI.border}` }}>
                      {cityCustomPlaces.map((place, pi) => (
                        <div key={place.id}>
                          {editingPlaceId === place.id ? (
                            <div style={{ padding: "12px 14px", background: MORANDI.white, borderBottom: pi < cityCustomPlaces.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
                              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                <input value={editingPlaceData.name} onChange={e => setEditingPlaceData(p => ({ ...p, name: e.target.value }))} placeholder="名稱" style={inputStyle({ flex: 1 })} />
                                <select value={editingPlaceData.cat} onChange={e => setEditingPlaceData(p => ({ ...p, cat: e.target.value }))} style={inputStyle({ background: MORANDI.white })}>
                                  {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <input value={editingPlaceData.note} onChange={e => setEditingPlaceData(p => ({ ...p, note: e.target.value }))} placeholder="備註 (可選)" style={inputStyle({ width: "100%", marginBottom: 8, boxSizing: "border-box" })} />
                              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                <button onClick={() => setEditingPlaceId(null)} style={{ padding: "5px 12px", border: `1px solid ${MORANDI.border}`, borderRadius: 6, background: "transparent", fontSize: 11, cursor: "pointer", color: MORANDI.textLight }}>取消</button>
                                <button onClick={() => saveEditPlace(activeCity)} style={{ padding: "5px 12px", border: "none", borderRadius: 6, background: MORANDI.accent, color: MORANDI.white, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>儲存</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: "9px 14px", display: "flex", alignItems: "flex-start", gap: 8, borderBottom: pi < cityCustomPlaces.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 9, background: MORANDI.accentSoft + "44", color: MORANDI.accent, padding: "2px 6px", borderRadius: 7, fontWeight: 600, border: `1px solid ${MORANDI.accentSoft}` }}>{place.cat}</span>
                                  <span style={{ fontSize: 13, fontWeight: 500 }}>{place.name}</span>
                                  <MapsLink name={place.name} cityNameEn={city.nameEn} />
                                  {place.mapLat && <span style={{ fontSize: 9, color: MORANDI.accent }} title="已加入地圖">📌</span>}
                                </div>
                                {place.note && <div style={{ fontSize: 11, color: MORANDI.textLight, marginTop: 2 }}>{place.note}</div>}
                              </div>
                              <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
                                <IconBtn onClick={() => startEditPlace(place)} title="編輯">✏️</IconBtn>
                                <IconBtn onClick={() => handleDeletePlace(activeCity, place.id)} title="刪除" danger>✕</IconBtn>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new place form with Nominatim autocomplete */}
                  <form onSubmit={handleAddPlace} style={{ background: MORANDI.white, padding: 12, borderRadius: 12, border: `1px solid ${MORANDI.border}` }}>
                    <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 8 }}>➕ 新增地點</div>

                    <div ref={suggestionsRef} style={{ position: "relative", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="text"
                          placeholder="搜尋地點 (Nominatim 建議)"
                          value={newPlaceName}
                          onChange={e => {
                            setNewPlaceName(e.target.value);
                            setSelectedNominatim(null);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          style={inputStyle({ flex: 1 })}
                          autoComplete="off"
                        />
                        <a
                          href={newPlaceName.trim() ? mapsUrl(newPlaceName.trim(), city.nameEn) : undefined}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => { if (!newPlaceName.trim()) e.preventDefault(); }}
                          title="先喺 Google Maps 搵"
                          style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: 7, border: `1px solid ${MORANDI.border}`, background: newPlaceName.trim() ? MORANDI.bg : MORANDI.card, color: newPlaceName.trim() ? MORANDI.text : MORANDI.textLight, fontSize: 12, textDecoration: "none", cursor: newPlaceName.trim() ? "pointer" : "default", whiteSpace: "nowrap", flexShrink: 0 }}
                        >
                          🗺️
                        </a>
                      </div>

                      {/* Nominatim dropdown */}
                      {showSuggestions && nominatimSuggestions.length > 0 && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 44, background: MORANDI.white, border: `1px solid ${MORANDI.border}`, borderRadius: 10, zIndex: 50, boxShadow: "0 6px 20px rgba(74,69,65,0.12)", overflow: "hidden" }}>
                          {nominatimSuggestions.map((s, i) => {
                            const name = s.display_name.split(",")[0];
                            const sub = s.display_name.split(",").slice(1, 3).join(", ").trim();
                            return (
                              <div
                                key={i}
                                onMouseDown={e => {
                                  e.preventDefault();
                                  setNewPlaceName(name);
                                  setSelectedNominatim(s);
                                  setShowSuggestions(false);
                                }}
                                style={{ padding: "9px 12px", cursor: "pointer", borderBottom: i < nominatimSuggestions.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}
                                onMouseEnter={e => e.currentTarget.style.background = MORANDI.card}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <div style={{ fontSize: 13, fontWeight: 500, color: MORANDI.text }}>{name}</div>
                                {sub && <div style={{ fontSize: 10, color: MORANDI.textLight, marginTop: 1 }}>{sub}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <select value={newPlaceCat} onChange={e => setNewPlaceCat(e.target.value)} style={inputStyle({ background: MORANDI.white, flex: 1 })}>
                        {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="submit" style={{ padding: "6px 16px", background: MORANDI.accent, color: MORANDI.white, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Add</button>
                    </div>
                    {selectedNominatim && (
                      <div style={{ marginTop: 6, fontSize: 10, color: MORANDI.accent, fontStyle: "italic" }}>
                        📌 將在地圖顯示 Pin
                      </div>
                    )}
                  </form>
                </div>

                {/* ── Expense tracker ── */}
                <div style={{ background: MORANDI.white, padding: 18, borderRadius: 16, border: `1px solid ${MORANDI.border}`, marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${MORANDI.border}`, paddingBottom: 9, marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>💵 歐遊金錢記帳總覽</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: MORANDI.warm }}>HK${totalSpent.toLocaleString()}</div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    {expenses.map(exp => (
                      <div key={exp.id}>
                        {editingExpenseId === exp.id ? (
                          <div style={{ padding: "8px 0", borderBottom: `1px solid ${MORANDI.border}` }}>
                            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                              <input value={editingExpenseData.desc} onChange={e => setEditingExpenseData(p => ({ ...p, desc: e.target.value }))} placeholder="項目" style={inputStyle({ flex: 2 })} />
                              <input type="number" value={editingExpenseData.amount} onChange={e => setEditingExpenseData(p => ({ ...p, amount: e.target.value }))} placeholder="金額" style={inputStyle({ flex: 1 })} />
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between" }}>
                              <select value={editingExpenseData.category} onChange={e => setEditingExpenseData(p => ({ ...p, category: e.target.value }))} style={inputStyle({ background: MORANDI.white })}>
                                {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setEditingExpenseId(null)} style={{ padding: "4px 10px", border: `1px solid ${MORANDI.border}`, borderRadius: 6, background: "transparent", fontSize: 11, cursor: "pointer", color: MORANDI.textLight }}>取消</button>
                                <button onClick={saveEditExpense} style={{ padding: "4px 10px", border: "none", borderRadius: 6, background: MORANDI.warm, color: MORANDI.white, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>儲存</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "7px 0", borderBottom: `1px solid ${MORANDI.border}`, color: MORANDI.text }}>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              {exp.desc}{" "}
                              <span style={{ fontSize: 9, background: MORANDI.card, padding: "2px 4px", borderRadius: 4, color: MORANDI.textLight }}>{exp.category}</span>
                            </span>
                            <span style={{ fontWeight: 500, flexShrink: 0 }}>HK${exp.amount.toLocaleString()}</span>
                            <IconBtn onClick={() => startEditExpense(exp)} title="編輯">✏️</IconBtn>
                            <IconBtn onClick={() => handleDeleteExpense(exp.id)} title="刪除" danger>✕</IconBtn>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: 7, borderTop: `1px solid ${MORANDI.border}`, paddingTop: 10 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input type="text" placeholder="新支出項目" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} style={inputStyle({ flex: 2 })} />
                      <input type="number" placeholder="HKD" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} style={inputStyle({ flex: 1 })} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <select value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} style={inputStyle({ background: MORANDI.white })}>
                        {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="submit" style={{ padding: "6px 14px", background: MORANDI.warm, color: MORANDI.white, border: "none", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>記帳</button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* ── Map tab ── */
              <div>
                <TripTimeline activeCity={activeCity} onCityChange={setActiveCity} />
                <MapView
                  activeCity={activeCity}
                  customPlaces={customPlaces}
                  onAddPlace={handleMapAddPlace}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
