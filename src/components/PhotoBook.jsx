import React, { useState, useRef } from "react";
import { usePersisted } from "../utils/storage";

const MORANDI = {
  bg: "#E8E4DF", card: "#F2EFEB", text: "#4A4541", textLight: "#8A8580",
  accent: "#9B8E82", accentSoft: "#C4B9AE", sage: "#A3AE9E",
  dustyRose: "#C4A9A0", warm: "#BFA58A", slate: "#8E9CA5",
  border: "#D5D0CA", white: "#FAFAF8",
};

const CITY_OPTIONS = [
  { id: "hong_kong", name: "香港出發 ✈️", color: MORANDI.warm },
  { id: "vienna",    name: "Wien 🇦🇹",    color: MORANDI.sage },
  { id: "prague",    name: "Praha 🇨🇿",   color: MORANDI.dustyRose },
  { id: "budapest",  name: "Budapest 🇭🇺", color: MORANDI.slate },
  { id: "other",     name: "其他 ✨",      color: MORANDI.accentSoft },
];

const compress = (file) => new Promise(resolve => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const maxW = 1080;
    const scale = Math.min(1, maxW / img.width);
    const canvas = document.createElement("canvas");
    canvas.width  = Math.round(img.width  * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL("image/jpeg", 0.75));
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

export default function PhotoBook({ user }) {
  const [photos, setPhotos] = usePersisted(`${user}:photoBook`, []);
  const [lightbox, setLightbox]   = useState(null);
  const [filterCity, setFilterCity] = useState("all");
  const [addCity, setAddCity]     = useState("vienna");
  const [addCaption, setAddCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [editVal, setEditVal]     = useState("");
  const uploadRef = useRef(null);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      const newPhotos = [];
      for (const f of Array.from(files)) {
        const dataUrl = await compress(f);
        newPhotos.push({
          id: Date.now() + Math.random(),
          dataUrl,
          caption: addCaption.trim(),
          city: addCity,
          date: new Date().toLocaleDateString("zh-HK", { month: "short", day: "numeric" }),
        });
      }
      setPhotos(p => [...newPhotos, ...p]);
      setAddCaption("");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = (id) => setPhotos(p => p.filter(ph => ph.id !== id));
  const saveCaption = (id) => {
    setPhotos(p => p.map(ph => ph.id === id ? { ...ph, caption: editVal } : ph));
    setEditId(null);
  };

  const cityMeta = (id) => CITY_OPTIONS.find(c => c.id === id) ?? CITY_OPTIONS[4];
  const filtered  = filterCity === "all" ? photos : photos.filter(p => p.city === filterCity);
  const counts    = {};
  photos.forEach(p => { counts[p.city] = (counts[p.city] ?? 0) + 1; });

  return (
    <div style={{ padding: "0 24px" }}>
      {/* Upload card */}
      <div style={{ background: MORANDI.white, borderRadius: 18, padding: 16, marginBottom: 14,
        border: `1px solid ${MORANDI.border}`, boxShadow: "0 2px 12px rgba(74,69,65,0.07)" }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: MORANDI.textLight, textTransform: "uppercase", marginBottom: 12 }}>
          📸 加入旅途回憶
        </div>

        {/* City selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
          {CITY_OPTIONS.map(c => (
            <button key={c.id} onClick={() => setAddCity(c.id)}
              style={{ padding: "5px 11px", borderRadius: 11, border: `1.5px solid ${addCity === c.id ? c.color : MORANDI.border}`,
                background: addCity === c.id ? c.color + "22" : "transparent",
                color: addCity === c.id ? MORANDI.text : MORANDI.textLight,
                fontSize: 9, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Caption */}
        <input
          placeholder="為這一刻寫些文字…"
          value={addCaption}
          onChange={e => setAddCaption(e.target.value)}
          style={{ width: "100%", padding: "8px 11px", border: `1px solid ${MORANDI.border}`, borderRadius: 9,
            fontSize: 11, background: MORANDI.bg, color: MORANDI.text, outline: "none",
            boxSizing: "border-box", marginBottom: 10, fontFamily: "inherit" }}
        />

        {/* Upload button */}
        <input ref={uploadRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={async e => { await handleFiles(e.target.files); e.target.value = ""; }} />
        <button onClick={() => uploadRef.current?.click()} disabled={uploading}
          style={{ width: "100%", padding: "11px", background: uploading ? MORANDI.border : MORANDI.dustyRose,
            color: MORANDI.white, border: "none", borderRadius: 11, fontSize: 12,
            fontWeight: 700, cursor: uploading ? "wait" : "pointer", letterSpacing: 0.5, transition: "background 0.2s" }}>
          {uploading ? "上傳中…" : "📷 選擇相片"}
        </button>
        <div style={{ marginTop: 7, fontSize: 9, color: MORANDI.border, textAlign: "center" }}>
          可同時選擇多張 · 自動壓縮
        </div>
      </div>

      {/* City filter */}
      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
          <button onClick={() => setFilterCity("all")}
            style={{ padding: "4px 12px", borderRadius: 11, border: `1px solid ${filterCity === "all" ? MORANDI.accent : MORANDI.border}`,
              background: filterCity === "all" ? MORANDI.accent : "transparent",
              color: filterCity === "all" ? MORANDI.white : MORANDI.textLight,
              fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            全部 {photos.length}
          </button>
          {CITY_OPTIONS.filter(c => counts[c.id]).map(c => (
            <button key={c.id} onClick={() => setFilterCity(c.id)}
              style={{ padding: "4px 12px", borderRadius: 11, border: `1px solid ${filterCity === c.id ? c.color : MORANDI.border}`,
                background: filterCity === c.id ? c.color + "22" : "transparent",
                color: filterCity === c.id ? MORANDI.text : MORANDI.textLight,
                fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {c.name} {counts[c.id]}
            </button>
          ))}
        </div>
      )}

      {/* Photo grid — 2-column masonry */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: MORANDI.textLight }}>
          <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.35, lineHeight: 1 }}>🎞️</div>
          <div style={{ fontSize: 13, lineHeight: 1.9 }}>
            旅途中嘅精彩瞬間<br />都在這裡等你記錄
          </div>
        </div>
      ) : (
        <div style={{ columns: 2, gap: 10 }}>
          {filtered.map(photo => {
            const meta = cityMeta(photo.city);
            return (
              <div key={photo.id} className="fade-in-up" style={{ breakInside: "avoid", marginBottom: 10 }}>
                <div style={{ background: MORANDI.white, borderRadius: 13, overflow: "hidden",
                  border: `1px solid ${MORANDI.border}`, boxShadow: "0 2px 10px rgba(74,69,65,0.07)" }}>
                  {/* Image */}
                  <div style={{ position: "relative" }}>
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || ""}
                      onClick={() => setLightbox(photo)}
                      style={{ width: "100%", display: "block", cursor: "pointer" }}
                    />
                    {/* City badge */}
                    <div style={{ position: "absolute", top: 6, left: 6, padding: "2px 7px", borderRadius: 8,
                      background: meta.color + "dd", color: MORANDI.white, fontSize: 7.5, fontWeight: 700 }}>
                      {meta.name}
                    </div>
                    {/* Delete */}
                    <button onClick={() => deletePhoto(photo.id)}
                      style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                        background: "rgba(0,0,0,0.38)", color: "#fff", border: "none", cursor: "pointer",
                        fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✕
                    </button>
                  </div>

                  {/* Caption */}
                  <div style={{ padding: "8px 10px" }}>
                    {editId === photo.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input autoFocus value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveCaption(photo.id)}
                          style={{ flex: 1, fontSize: 10, padding: "4px 7px", border: `1px solid ${MORANDI.accent}`,
                            borderRadius: 6, background: MORANDI.bg, outline: "none", color: MORANDI.text }} />
                        <button onClick={() => saveCaption(photo.id)}
                          style={{ fontSize: 10, padding: "4px 8px", background: MORANDI.accent,
                            color: MORANDI.white, border: "none", borderRadius: 6, cursor: "pointer" }}>✓</button>
                      </div>
                    ) : (
                      <div onClick={() => { setEditId(photo.id); setEditVal(photo.caption || ""); }}
                        style={{ fontSize: 10, color: photo.caption ? MORANDI.text : MORANDI.border,
                          cursor: "text", fontStyle: photo.caption ? "normal" : "italic",
                          lineHeight: 1.45, minHeight: 14 }}>
                        {photo.caption || "點擊加入描述…"}
                      </div>
                    )}
                    <div style={{ fontSize: 8, color: MORANDI.border, marginTop: 3 }}>{photo.date}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox.dataUrl} alt={lightbox.caption || ""}
            style={{ maxWidth: "95vw", maxHeight: "78vh", borderRadius: 10, objectFit: "contain" }} />
          {lightbox.caption && (
            <div style={{ color: "#fff", fontSize: 13, marginTop: 16, textAlign: "center",
              padding: "0 36px", lineHeight: 1.6, maxWidth: 400 }}>
              {lightbox.caption}
            </div>
          )}
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 6 }}>
            {cityMeta(lightbox.city).name} · {lightbox.date}
          </div>
          <button onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.14)",
              border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%",
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
