import React, { useState, useEffect, useRef } from "react";

const MORANDI = {
  bg: "#E8E4DF", card: "#F2EFEB", text: "#4A4541", textLight: "#8A8580",
  accent: "#9B8E82", accentSoft: "#C4B9AE", sage: "#A3AE9E",
  dustyRose: "#C4A9A0", warm: "#BFA58A", slate: "#8E9CA5",
  border: "#D5D0CA", white: "#FAFAF8",
};

const EMERGENCY = [
  { city: "Wien 🇦🇹",     police: "133", ambulance: "144", fire: "122", tourist: "+43 1 24050" },
  { city: "Praha 🇨🇿",    police: "158", ambulance: "155", fire: "150", tourist: "+420 221 714 714" },
  { city: "Budapest 🇭🇺", police: "107", ambulance: "104", fire: "105", tourist: "+36 1 438 8080" },
];

const TIPS = [
  { icon: "🚇", text: "維也納地鐵用24hr/48hr票，搭多幾次就抵" },
  { icon: "💧", text: "維也納街頭飲水機可以直接飲" },
  { icon: "🚃", text: "布拉格地鐵/電車用90分鐘ticket，可以轉車" },
  { icon: "💳", text: "三個城市都係大部分地方接受Visa/Mastercard" },
  { icon: "🌡️", text: "7月最熱，建議帶防曬、搭乘冷氣地鐵避暑" },
  { icon: "🪙", text: "布達佩斯仍然有用現金嘅地方，換少少HUF" },
  { icon: "📱", text: "下載 Google Translate 離線繁中↔德/捷/匈" },
  { icon: "🏷️", text: "Student/youth card 唔少博物館有折扣" },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, letterSpacing: 2.5, color: MORANDI.textLight, textTransform: "uppercase", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ background: MORANDI.white, borderRadius: 14, border: `1px solid ${MORANDI.border}`, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function CurrencyConverter({ rate }) {
  const [fromHKD, setFromHKD] = useState("100");
  const [fromEUR, setFromEUR] = useState("");
  const [dir, setDir] = useState("hkd"); // which field was last edited

  const hkdVal  = dir === "hkd" ? parseFloat(fromHKD) || 0 : parseFloat(fromEUR || 0) * rate;
  const eurVal  = dir === "eur" ? parseFloat(fromEUR) || 0 : parseFloat(fromHKD || 0) / rate;

  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: MORANDI.textLight, marginBottom: 4 }}>港幣 HKD</div>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={dir === "hkd" ? fromHKD : hkdVal.toFixed(2)}
              onChange={e => { setFromHKD(e.target.value); setDir("hkd"); }}
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${MORANDI.dustyRose}`, borderRadius: 10, fontSize: 18, fontWeight: 600, color: MORANDI.text, background: MORANDI.bg, outline: "none", boxSizing: "border-box" }}
            />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: MORANDI.textLight }}>HK$</span>
          </div>
        </div>
        <div style={{ fontSize: 20, color: MORANDI.border, paddingTop: 18, userSelect: "none" }}>⇄</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: MORANDI.textLight, marginBottom: 4 }}>歐羅 EUR</div>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={dir === "eur" ? fromEUR : eurVal.toFixed(2)}
              onChange={e => { setFromEUR(e.target.value); setDir("eur"); }}
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${MORANDI.sage}`, borderRadius: 10, fontSize: 18, fontWeight: 600, color: MORANDI.text, background: MORANDI.bg, outline: "none", boxSizing: "border-box" }}
            />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: MORANDI.textLight }}>€</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: MORANDI.textLight }}>
        1 EUR = <strong style={{ color: MORANDI.warm }}>HK${rate.toFixed(4)}</strong>
        <span style={{ marginLeft: 8, opacity: 0.6 }}>· 1 HKD = €{(1/rate).toFixed(4)}</span>
      </div>
    </div>
  );
}

// Quick reference table
function QuickRef({ rate }) {
  const rows = [
    { label: "一杯咖啡", eur: 3.5 },
    { label: "午餐 (casual)", eur: 15 },
    { label: "晚餐 (sit-down)", eur: 30 },
    { label: "博物館入場", eur: 18 },
    { label: "地鐵 24hr 票", eur: 8 },
    { label: "炸豬排 (Figlmüller)", eur: 22 },
  ];
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", borderBottom: i < rows.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
          <span style={{ fontSize: 12, color: MORANDI.text }}>{r.label}</span>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: MORANDI.warm }}>€{r.eur.toFixed(0)}</span>
            <span style={{ fontSize: 10, color: MORANDI.textLight, marginLeft: 8 }}>≈ HK${Math.round(r.eur * rate)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InfoPage({ onExport, onImportClick }) {
  const [rate, setRate] = useState(8.7); // fallback rate
  const [rateUpdated, setRateUpdated] = useState(null);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/EUR")
      .then(r => r.json())
      .then(data => {
        if (data?.rates?.HKD) {
          setRate(data.rates.HKD);
          setRateUpdated(new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: "0 24px" }}>
      {/* Currency converter */}
      <Section title="💱 港幣 ↔ 歐羅 即時換算">
        <CurrencyConverter rate={rate} />
        {rateUpdated && (
          <div style={{ padding: "0 16px 10px", fontSize: 9, color: MORANDI.border, textAlign: "right" }}>
            實時匯率 · 更新於 {rateUpdated}
          </div>
        )}
      </Section>

      {/* Quick reference */}
      <Section title="💶 消費參考">
        <QuickRef rate={rate} />
      </Section>

      {/* Emergency numbers */}
      <Section title="🆘 緊急聯絡">
        {EMERGENCY.map((e, i) => (
          <div key={i} style={{ padding: "12px 16px", borderBottom: i < EMERGENCY.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{e.city}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[["警察", e.police], ["救護車", e.ambulance], ["消防", e.fire]].map(([label, num]) => (
                <a key={label} href={`tel:${num}`}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", gap: 2 }}>
                  <span style={{ fontSize: 9, color: MORANDI.textLight }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: MORANDI.dustyRose }}>{num}</span>
                </a>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 9, color: MORANDI.textLight }}>旅遊熱線</span>
                <a href={`tel:${e.tourist}`} style={{ fontSize: 10, fontWeight: 500, color: MORANDI.accent, textDecoration: "none" }}>{e.tourist}</a>
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* Tips */}
      <Section title="💡 實用貼士">
        {TIPS.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 16px", borderBottom: i < TIPS.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ fontSize: 11, color: MORANDI.text, lineHeight: 1.5 }}>{t.text}</span>
          </div>
        ))}
      </Section>

      {/* Data management */}
      <Section title="💾 資料備份">
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 12, lineHeight: 1.6 }}>
            個人資料儲存喺你部機嘅瀏覽器（localStorage）。<br />
            如果想換其他設備，記得先<strong>匯出備份</strong>，然後喺新設備<strong>匯入</strong>。
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onExport}
              style={{ flex: 1, padding: "10px", background: MORANDI.accent, color: MORANDI.white, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              📤 匯出備份
            </button>
            <button onClick={onImportClick}
              style={{ flex: 1, padding: "10px", background: "transparent", color: MORANDI.accent, border: `1.5px solid ${MORANDI.accent}`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              📥 匯入備份
            </button>
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", background: MORANDI.card, borderRadius: 8, fontSize: 10, color: MORANDI.textLight, lineHeight: 1.6 }}>
            💡 iPhone 用戶：喺 Safari 開啟後，點擊分享按鈕 → 「加入主畫面」即可像 App 咁使用，資料更持久。
          </div>
        </div>
      </Section>
    </div>
  );
}
