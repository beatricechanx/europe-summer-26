import React, { useState } from "react";
import { usePersisted } from "../utils/storage";
import { MAP_PLACES } from "../data/places";

const MORANDI = {
  bg: "#E8E4DF", card: "#F2EFEB", text: "#4A4541", textLight: "#8A8580",
  accent: "#9B8E82", accentSoft: "#C4B9AE", sage: "#A3AE9E",
  dustyRose: "#C4A9A0", warm: "#BFA58A", slate: "#8E9CA5",
  border: "#D5D0CA", white: "#FAFAF8",
};

const CITY_COLOR = { vienna: MORANDI.sage, prague: MORANDI.dustyRose, budapest: MORANDI.slate };
const CITY_NAME  = { vienna: "Wien", prague: "Praha", budapest: "Budapest" };
const CITY_EN    = { vienna: "Vienna", prague: "Prague", budapest: "Budapest" };

const TRIP_DAYS = [
  { date: "2026-07-10", label: "7/10", weekday: "Fri", city: "vienna",   icon: "✈️", tag: "Arrive Wien" },
  { date: "2026-07-11", label: "7/11", weekday: "Sat", city: "vienna",   icon: "🏛️", tag: "Wien" },
  { date: "2026-07-12", label: "7/12", weekday: "Sun", city: "vienna",   icon: "🏛️", tag: "Wien" },
  { date: "2026-07-13", label: "7/13", weekday: "Mon", city: "prague",   icon: "🚂", tag: "Wien→Praha" },
  { date: "2026-07-14", label: "7/14", weekday: "Tue", city: "prague",   icon: "🏰", tag: "Praha" },
  { date: "2026-07-15", label: "7/15", weekday: "Wed", city: "budapest", icon: "🚂", tag: "Praha→Bpest" },
  { date: "2026-07-16", label: "7/16", weekday: "Thu", city: "budapest", icon: "🏙️", tag: "Budapest" },
  { date: "2026-07-17", label: "7/17", weekday: "Fri", city: "budapest", icon: "✈️", tag: "Depart 13:00" },
  { date: "2026-07-18", label: "7/18", weekday: "Sat", city: "budapest", icon: "🏠", tag: "→HKG" },
];

const SLOTS = [
  { key: "morning",   label: "上午",   icon: "☀️",  placeholder: "早餐、景點、博物館…" },
  { key: "afternoon", label: "下午",   icon: "🌤",  placeholder: "景點、購物、咖啡…" },
  { key: "evening",   label: "夜晚",   icon: "🌙",  placeholder: "晚餐、酒吧、夜景…" },
];

function mapsRouteUrl(items, cityEn) {
  if (!items.length) return null;
  const places = items.map(it => encodeURIComponent(`${it.name} ${it.cityEn || cityEn}`));
  if (places.length === 1) return `https://www.google.com/maps/search/?api=1&query=${places[0]}`;
  const origin = places[0];
  const dest   = places[places.length - 1];
  const wps    = places.slice(1, -1).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${wps ? "&waypoints=" + wps : ""}&travelmode=walking`;
}

export default function DailyPlanner({ user, customPlaces }) {
  const [dailyPlan, setDailyPlan] = usePersisted(`${user}:dailyPlan`, {});
  const [selectedDate, setSelectedDate] = useState(TRIP_DAYS[0].date);
  const [addingSlot, setAddingSlot] = useState(null);
  const [searchQ, setSearchQ] = useState("");

  const day = TRIP_DAYS.find(d => d.date === selectedDate) ?? TRIP_DAYS[0];
  const dayData = dailyPlan[selectedDate] ?? { items: [], dayNote: "" };
  const allItems = dayData.items ?? [];
  const color = CITY_COLOR[day.city];

  // All places for the day's city (preset + custom)
  const presetPlaces = MAP_PLACES.filter(p => p.city === day.city);
  const cityCustom   = (customPlaces?.[day.city] ?? []);
  const allPlaces    = [
    ...presetPlaces.map(p => ({ name: p.name, cat: p.cat, city: p.city, cityEn: CITY_EN[p.city] })),
    ...cityCustom.map(p => ({ name: p.name, cat: p.cat ?? "其他", city: day.city, cityEn: CITY_EN[day.city], isCustom: true })),
  ];
  const filtered = searchQ.trim().length >= 1
    ? allPlaces.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : allPlaces.slice(0, 10);

  const updateDay = (patch) => {
    setDailyPlan(p => ({ ...p, [selectedDate]: { ...dayData, ...patch } }));
  };

  const addItem = (place) => {
    const slot = addingSlot ?? "morning";
    const item = { id: Date.now(), name: place.name, cat: place.cat, cityEn: place.cityEn, slot };
    updateDay({ items: [...allItems, item] });
    setSearchQ("");
    setAddingSlot(null);
  };

  const addCustomItem = () => {
    if (!searchQ.trim()) return;
    const item = { id: Date.now(), name: searchQ.trim(), cat: "其他", cityEn: CITY_EN[day.city], slot: addingSlot ?? "morning" };
    updateDay({ items: [...allItems, item] });
    setSearchQ("");
    setAddingSlot(null);
  };

  const removeItem = (id) => {
    updateDay({ items: allItems.filter(it => it.id !== id) });
  };

  const routeUrl = mapsRouteUrl(allItems, CITY_EN[day.city]);

  return (
    <div style={{ padding: "0 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: MORANDI.textLight, textTransform: "uppercase" }}>📅 每日行程規劃</div>
        {routeUrl && (
          <a href={routeUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 14, background: color + "22", border: `1px solid ${color}55`, color: color, fontSize: 10, fontWeight: 600, textDecoration: "none" }}>
            🗺️ 看路線
          </a>
        )}
      </div>

      {/* Day selector */}
      <div style={{ overflowX: "auto", marginBottom: 16, scrollbarWidth: "none" }}>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, paddingBottom: 4 }}>
          {TRIP_DAYS.map(d => {
            const c = CITY_COLOR[d.city];
            const active = d.date === selectedDate;
            const count = (dailyPlan[d.date]?.items ?? []).length;
            return (
              <button key={d.date} onClick={() => setSelectedDate(d.date)}
                style={{ flexShrink: 0, width: 68, padding: "8px 4px", border: `1.5px solid ${active ? c : MORANDI.border}`,
                  borderRadius: 12, background: active ? c + "22" : MORANDI.white, cursor: "pointer",
                  textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ fontSize: 8, color: MORANDI.textLight }}>{d.weekday}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: active ? c : MORANDI.text }}>{d.label}</div>
                <div style={{ fontSize: 14 }}>{d.icon}</div>
                <div style={{ fontSize: 7, color: active ? c : MORANDI.textLight, letterSpacing: 0.2, lineHeight: 1.2 }}>{d.tag}</div>
                {count > 0 && (
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: c, color: MORANDI.white, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{count}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <div style={{ background: MORANDI.white, borderRadius: 16, border: `1px solid ${MORANDI.border}`, overflow: "hidden", marginBottom: 16 }}>
        {/* Day title */}
        <div style={{ padding: "12px 16px", background: color + "18", borderBottom: `1px solid ${MORANDI.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{day.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: MORANDI.text }}>{CITY_NAME[day.city]} · {day.weekday}, {day.label}</div>
            <div style={{ fontSize: 10, color: color, fontWeight: 500 }}>{day.tag}</div>
          </div>
          {allItems.length > 0 && (
            <div style={{ marginLeft: "auto", fontSize: 10, color: MORANDI.textLight }}>{allItems.length} 個地點</div>
          )}
        </div>

        {/* Slots */}
        {SLOTS.map(slot => {
          const slotItems = allItems.filter(it => it.slot === slot.key);
          return (
            <div key={slot.key} style={{ borderBottom: `1px solid ${MORANDI.border}`, padding: "10px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: slotItems.length > 0 ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13 }}>{slot.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: MORANDI.textLight, letterSpacing: 0.5 }}>{slot.label}</span>
                </div>
                <button onClick={() => { setAddingSlot(slot.key); setSearchQ(""); }}
                  style={{ fontSize: 10, color: color, background: "none", border: `1px solid ${color}55`, borderRadius: 8, padding: "2px 8px", cursor: "pointer" }}>
                  + 加地點
                </button>
              </div>

              {slotItems.length === 0 && addingSlot !== slot.key && (
                <div style={{ fontSize: 10, color: MORANDI.border, fontStyle: "italic", marginTop: 2 }}>{slot.placeholder}</div>
              )}

              {slotItems.map((item, i) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                  borderBottom: i < slotItems.length - 1 ? `1px dashed ${MORANDI.border}` : "none" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 9, color: MORANDI.textLight }}>{item.cat}</div>
                  </div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + " " + item.cityEn)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, textDecoration: "none", color: MORANDI.textLight }} onClick={e => e.stopPropagation()}>📍</a>
                  <button onClick={() => removeItem(item.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: MORANDI.border, fontSize: 13, padding: "0 2px" }}>✕</button>
                </div>
              ))}

              {/* Inline add picker */}
              {addingSlot === slot.key && (
                <div style={{ marginTop: 8, background: MORANDI.bg, borderRadius: 10, padding: 10 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                      placeholder="搜尋或輸入地點名稱…"
                      autoFocus
                      style={{ flex: 1, padding: "6px 10px", border: `1px solid ${MORANDI.border}`, borderRadius: 7, fontSize: 12, background: MORANDI.white, color: MORANDI.text, outline: "none" }} />
                    <button onClick={() => { setAddingSlot(null); setSearchQ(""); }}
                      style={{ padding: "4px 8px", border: `1px solid ${MORANDI.border}`, borderRadius: 7, background: "transparent", fontSize: 11, cursor: "pointer", color: MORANDI.textLight }}>取消</button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {filtered.map((p, i) => (
                      <div key={i} onClick={() => addItem(p)}
                        style={{ padding: "7px 8px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                          marginBottom: 2, background: "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.background = MORANDI.card}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 8, background: color + "22", color: color, padding: "1px 5px", borderRadius: 5, fontWeight: 600, border: `1px solid ${color}44`, flexShrink: 0 }}>{p.cat}</span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</span>
                        {p.isCustom && <span style={{ fontSize: 8, color: MORANDI.accentSoft }}>✨</span>}
                      </div>
                    ))}
                    {searchQ.trim().length >= 1 && (
                      <div onClick={addCustomItem}
                        style={{ padding: "7px 8px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                          background: color + "15", border: `1px dashed ${color}55`, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: color }}>＋</span>
                        <span style={{ fontSize: 12, color: color, fontWeight: 500 }}>自訂: "{searchQ.trim()}"</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Day notes */}
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: MORANDI.textLight, textTransform: "uppercase", marginBottom: 5 }}>今日備注</div>
          <textarea
            value={dayData.dayNote}
            onChange={e => updateDay({ dayNote: e.target.value })}
            placeholder="記低今日特別安排、入場費、開放時間…"
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${MORANDI.border}`, borderRadius: 8,
              fontSize: 11, background: MORANDI.bg, color: MORANDI.text, outline: "none",
              resize: "vertical", minHeight: 56, fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Trip summary */}
      {TRIP_DAYS.some(d => (dailyPlan[d.date]?.items ?? []).length > 0) && (
        <div style={{ background: MORANDI.card, borderRadius: 14, border: `1px solid ${MORANDI.border}`, padding: "12px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: MORANDI.textLight, textTransform: "uppercase", marginBottom: 10 }}>行程總覽</div>
          {TRIP_DAYS.map(d => {
            const items = dailyPlan[d.date]?.items ?? [];
            if (!items.length) return null;
            const c = CITY_COLOR[d.city];
            return (
              <div key={d.date} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${MORANDI.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>{d.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{d.label}</span>
                  <span style={{ fontSize: 10, color: MORANDI.textLight }}>{d.tag}</span>
                </div>
                <div style={{ fontSize: 10, color: MORANDI.text, lineHeight: 1.7, paddingLeft: 22 }}>
                  {items.map(it => it.name).join(" → ")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
