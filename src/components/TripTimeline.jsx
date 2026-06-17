import React, { useRef } from "react";

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

const CITY_COLOR = {
  vienna:   MORANDI.sage,
  prague:   MORANDI.dustyRose,
  budapest: MORANDI.slate,
};

const CITY_LABEL = {
  vienna:   "Wien",
  prague:   "Praha",
  budapest: "Budapest",
};

// Each day: which city, what label, is it a travel day
const DAYS = [
  { date: "7/10", weekday: "Fri", city: "vienna",   emoji: "✈️", note: "Arrive" },
  { date: "7/11", weekday: "Sat", city: "vienna",   emoji: "🏛️", note: "Wien" },
  { date: "7/12", weekday: "Sun", city: "vienna",   emoji: "🏛️", note: "Wien" },
  { date: "7/13", weekday: "Mon", city: "prague",   emoji: "🚂", note: "→Praha" },
  { date: "7/14", weekday: "Tue", city: "prague",   emoji: "🏰", note: "Praha" },
  { date: "7/15", weekday: "Wed", city: "budapest", emoji: "🚂", note: "→Bpest" },
  { date: "7/16", weekday: "Thu", city: "budapest", emoji: "🏙️", note: "Budapest" },
  { date: "7/17", weekday: "Fri", city: "budapest", emoji: "✈️", note: "Depart" },
  { date: "7/18", weekday: "Sat", city: "budapest", emoji: "🏠", note: "→HKG" },
];

export default function TripTimeline({ activeCity, onCityChange }) {
  const scrollRef = useRef(null);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: MORANDI.textLight, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
        行程時間軸
      </div>
      <div
        ref={scrollRef}
        style={{
          overflowX: "auto",
          display: "flex",
          gap: 6,
          paddingBottom: 4,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.trip-timeline::-webkit-scrollbar { display: none; }`}</style>
        <div className="trip-timeline" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {DAYS.map((day, i) => {
            const color = CITY_COLOR[day.city];
            const isActive = activeCity === day.city;
            return (
              <button
                key={i}
                onClick={() => onCityChange(day.city)}
                style={{
                  flexShrink: 0,
                  width: 64,
                  padding: "8px 4px",
                  border: `1.5px solid ${isActive ? color : MORANDI.border}`,
                  borderRadius: 12,
                  background: isActive ? color + "22" : MORANDI.white,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <div style={{ fontSize: 8, color: MORANDI.textLight, letterSpacing: 1 }}>{day.weekday}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? color : MORANDI.text }}>{day.date}</div>
                <div style={{ fontSize: 14, lineHeight: 1 }}>{day.emoji}</div>
                <div style={{ fontSize: 8, color: isActive ? color : MORANDI.textLight, fontWeight: isActive ? 600 : 400, letterSpacing: 0.3 }}>{day.note}</div>
                {/* City indicator dot */}
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? color : MORANDI.border, marginTop: 1 }} />
              </button>
            );
          })}
        </div>
      </div>
      {/* City legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 6, paddingLeft: 2 }}>
        {Object.entries(CITY_COLOR).map(([city, color]) => (
          <button
            key={city}
            onClick={() => onCityChange(city)}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 9, color: activeCity === city ? color : MORANDI.textLight, fontWeight: activeCity === city ? 600 : 400 }}>
              {CITY_LABEL[city]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
