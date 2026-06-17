import React from "react";

const MORANDI = {
  bg: "#E8E4DF",
  card: "#F2EFEB",
  text: "#4A4541",
  textLight: "#8A8580",
  accent: "#9B8E82",
  border: "#D5D0CA",
  white: "#FAFAF8",
  dustyRose: "#C4A9A0",
  warm: "#BFA58A",
};

const PROFILES = [
  { name: "Bea",  emoji: "🍒", color: MORANDI.dustyRose },
  { name: "Cora", emoji: "🌸", color: MORANDI.accent },
];

if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap";
  link.rel = "stylesheet";
  if (!document.head.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link);
  }
}

export default function ProfilePicker({ onSelect }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: MORANDI.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif",
      color: MORANDI.text,
      padding: "40px 24px",
      textAlign: "center",
    }}>
      {/* Decorative dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
        {["#C4B9AE", "#A3AE9E", "#C4A9A0", "#8E9CA5", "#BFA58A"].map((c, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c, opacity: 0.6 }} />
        ))}
      </div>

      <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: MORANDI.textLight, marginBottom: 12 }}>
        JULY 2026 ₍ᐢ.ˬ.ᐢ₎♡
      </div>
      <h1 style={{
        fontSize: 34,
        fontWeight: 300,
        fontStyle: "italic",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        color: MORANDI.dustyRose,
        lineHeight: 1.25,
        margin: "0 0 6px",
        letterSpacing: 0.5,
      }}>
        Bea & Cora's
      </h1>
      <h2 style={{
        fontSize: 24,
        fontWeight: 300,
        fontStyle: "italic",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        color: MORANDI.dustyRose,
        margin: "0 0 32px",
        letterSpacing: 0.5,
      }}>
        European Summer
      </h2>

      <div style={{ fontSize: 13, color: MORANDI.textLight, marginBottom: 28, letterSpacing: 0.5 }}>
        誰在用？
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {PROFILES.map(({ name, emoji, color }) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            style={{
              width: 130,
              padding: "28px 20px",
              background: MORANDI.white,
              border: `1.5px solid ${MORANDI.border}`,
              borderRadius: 20,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.background = color + "15";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = MORANDI.border;
              e.currentTarget.style.background = MORANDI.white;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: 40 }}>{emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: MORANDI.text, letterSpacing: 0.5 }}>{name}</span>
            <span style={{ fontSize: 10, color: MORANDI.textLight, letterSpacing: 1 }}>繼續</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 48, fontSize: 10, color: MORANDI.border, letterSpacing: 2 }}>
        Wien · Praha · Budapest
      </div>
    </div>
  );
}
