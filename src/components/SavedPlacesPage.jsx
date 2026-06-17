import React, { useState, useRef } from "react";
import { usePersisted } from "../utils/storage";

const MORANDI = {
  bg: "#E8E4DF", card: "#F2EFEB", text: "#4A4541", textLight: "#8A8580",
  accent: "#9B8E82", accentSoft: "#C4B9AE", sage: "#A3AE9E",
  dustyRose: "#C4A9A0", warm: "#BFA58A", slate: "#8E9CA5",
  border: "#D5D0CA", white: "#FAFAF8",
};

const CITY_META = {
  vienna:   { name: "Wien",     flag: "🇦🇹", color: "#A3AE9E" },
  prague:   { name: "Praha",    flag: "🇨🇿", color: "#C4A9A0" },
  budapest: { name: "Budapest", flag: "🇭🇺", color: "#8E9CA5" },
};

const compress = (file) => new Promise(resolve => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const maxW = 900;
    const scale = Math.min(1, maxW / img.width);
    const canvas = document.createElement("canvas");
    canvas.width  = img.width  * scale;
    canvas.height = img.height * scale;
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL("image/jpeg", 0.72));
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

export default function SavedPlacesPage({ user, placeStatus, customPlaces }) {
  const [cityFilter, setCityFilter] = useState("all");
  const [placePhotos, setPlacePhotos] = usePersisted(`${user}:placePhotos`, {});
  const [lightbox, setLightbox]       = useState(null);
  const uploadRefs = useRef({});

  // Build list: loved/been preset places + all custom places
  const allPlaces = [];
  const seen = new Set();

  Object.entries(placeStatus).forEach(([key, status]) => {
    if (!status.loved && !status.been) return;
    const idx = key.indexOf("::");
    if (idx < 0) return;
    const cityId = key.slice(0, idx);
    const name   = key.slice(idx + 2);
    if (CITY_META[cityId]) {
      allPlaces.push({ key, cityId, name, loved: status.loved, been: status.been, note: status.note, isCustom: false });
      seen.add(key);
    }
  });

  Object.entries(customPlaces).forEach(([cityId, places]) => {
    places.forEach(place => {
      const key = `${cityId}::${place.name}`;
      if (seen.has(key)) return;
      const status = placeStatus[key] ?? {};
      allPlaces.push({ key, cityId, name: place.name, cat: place.cat, loved: status.loved, been: status.been, note: status.note, isCustom: true });
      seen.add(key);
    });
  });

  const filtered = cityFilter === "all" ? allPlaces : allPlaces.filter(p => p.cityId === cityFilter);

  const handleUpload = async (placeKey, file) => {
    const dataUrl = await compress(file);
    setPlacePhotos(p => ({ ...p, [placeKey]: dataUrl }));
  };

  return (
    <div style={{ padding: "0 24px" }}>
      {/* City filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
        {[{ id: "all", name: "全部", flag: "🌍" }, ...Object.entries(CITY_META).map(([id, m]) => ({ id, name: m.name, flag: m.flag }))].map(c => (
          <button key={c.id} onClick={() => setCityFilter(c.id)}
            style={{ padding: "5px 13px", borderRadius: 12, border: `1px solid ${cityFilter === c.id ? MORANDI.accent : MORANDI.border}`,
              background: cityFilter === c.id ? MORANDI.accent : "transparent",
              color: cityFilter === c.id ? MORANDI.white : MORANDI.textLight,
              fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }}>
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: MORANDI.textLight }}>
          <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.4 }}>🤍</div>
          <div style={{ fontSize: 13, lineHeight: 1.9, color: MORANDI.textLight }}>
            喺景點清單撳❤️<br />就會喺呢度出現
          </div>
          <div style={{ marginTop: 12, fontSize: 10, color: MORANDI.border }}>自訂景點亦會自動顯示</div>
        </div>
      ) : (
        <div style={{ columns: 2, gap: 10 }}>
          {filtered.map(place => {
            const photo = placePhotos[place.key];
            const meta  = CITY_META[place.cityId] ?? {};
            return (
              <div key={place.key} className="fade-in-up"
                style={{ breakInside: "avoid", marginBottom: 10 }}>
                <div style={{ background: MORANDI.white, borderRadius: 14, overflow: "hidden",
                  border: `1px solid ${MORANDI.border}`, boxShadow: "0 2px 10px rgba(74,69,65,0.07)" }}>
                  {/* Photo area */}
                  <div style={{ height: 110, background: MORANDI.bg, position: "relative", overflow: "hidden",
                    cursor: photo ? "pointer" : "default" }}
                    onClick={() => photo && setLightbox({ src: photo, name: place.name, city: meta.name })}>
                    {photo ? (
                      <img src={photo} alt={place.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", height: "100%", gap: 4, opacity: 0.3 }}>
                        <span style={{ fontSize: 28 }}>📸</span>
                      </div>
                    )}
                    {/* City badge */}
                    <div style={{ position: "absolute", top: 6, left: 6, padding: "2px 7px", borderRadius: 8,
                      background: (meta.color ?? MORANDI.accent) + "dd", color: "#fff", fontSize: 8, fontWeight: 700 }}>
                      {meta.flag} {meta.name}
                    </div>
                    {/* Upload / change photo */}
                    <button
                      onClick={e => { e.stopPropagation(); uploadRefs.current[place.key]?.click(); }}
                      style={{ position: "absolute", bottom: 6, right: 6, padding: "3px 7px", borderRadius: 7,
                        background: "rgba(0,0,0,0.38)", color: "#fff", fontSize: 9, border: "none", cursor: "pointer" }}>
                      {photo ? "換相" : "加相 📷"}
                    </button>
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      ref={el => uploadRefs.current[place.key] = el}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(place.key, f); e.target.value = ""; }} />
                  </div>

                  {/* Info */}
                  <div style={{ padding: "9px 10px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.35, marginBottom: 4 }}>{place.name}</div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                      {place.loved && <span style={{ fontSize: 12 }}>❤️</span>}
                      {place.been  && (
                        <span style={{ fontSize: 8, color: MORANDI.sage, fontWeight: 700, background: MORANDI.sage + "18",
                          padding: "1px 5px", borderRadius: 5, border: `1px solid ${MORANDI.sage}44` }}>✓ 去過</span>
                      )}
                      {place.isCustom && (
                        <span style={{ fontSize: 8, color: MORANDI.accent, background: MORANDI.accentSoft + "30",
                          padding: "1px 5px", borderRadius: 5, border: `1px solid ${MORANDI.accentSoft}` }}>自訂</span>
                      )}
                    </div>
                    {place.note && (
                      <div style={{ fontSize: 9, color: MORANDI.textLight, marginTop: 4, lineHeight: 1.45,
                        borderTop: `1px solid ${MORANDI.border}`, paddingTop: 4 }}>{place.note}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count summary */}
      {filtered.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 6, marginBottom: 8, fontSize: 9, color: MORANDI.border }}>
          {filtered.filter(p => p.loved).length} 個心儀 · {filtered.filter(p => p.been).length} 個去過 · 共 {filtered.length} 個地點
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox.src} alt={lightbox.name}
            style={{ maxWidth: "95vw", maxHeight: "80vh", borderRadius: 10, objectFit: "contain" }} />
          <div style={{ color: "#fff", fontSize: 13, marginTop: 14, fontWeight: 600 }}>{lightbox.name}</div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 4 }}>{lightbox.city}</div>
          <button onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}
    </div>
  );
}
