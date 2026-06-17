import React, { useState, useEffect } from "react";

const TARGET = new Date("2026-07-10T17:45:00+08:00");

const MORANDI = {
  text: "#4A4541",
  textLight: "#8A8580",
  accent: "#9B8E82",
  warm: "#BFA58A",
  border: "#D5D0CA",
  card: "#F2EFEB",
  white: "#FAFAF8",
  dustyRose: "#C4A9A0",
};

export default function CountdownTimer() {
  const [diff, setDiff] = useState(() => TARGET - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(TARGET - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.max(0, diff);
  const days  = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const mins  = Math.floor((total % 3600000) / 60000);
  const secs  = Math.floor((total % 60000) / 1000);

  if (total <= 0) {
    return (
      <div style={{ textAlign: "center", padding: "10px 0", fontSize: 14, color: MORANDI.dustyRose, fontStyle: "italic", letterSpacing: 1 }}>
        ✈️ Bon voyage, Bea & Cora!
      </div>
    );
  }

  const units = [
    { value: days,  label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: mins,  label: "MIN" },
    { value: secs,  label: "SEC" },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "12px 0 4px" }}>
      {units.map(({ value, label }, i) => (
        <React.Fragment key={label}>
          <div style={{ textAlign: "center", minWidth: 44 }}>
            <div style={{
              fontSize: 26,
              fontWeight: 200,
              lineHeight: 1,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: MORANDI.warm,
              letterSpacing: 1,
            }}>
              {String(value).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 8, letterSpacing: 2.5, color: MORANDI.textLight, marginTop: 2 }}>
              {label}
            </div>
          </div>
          {i < 3 && (
            <div style={{ fontSize: 22, color: MORANDI.border, lineHeight: 1, marginTop: 2, fontWeight: 200 }}>:</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
