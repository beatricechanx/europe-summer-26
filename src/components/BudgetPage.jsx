import React, { useState } from "react";
import { usePersisted } from "../utils/storage";

const MORANDI = {
  bg: "#E8E4DF",
  card: "#F2EFEB",
  text: "#4A4541",
  textLight: "#8A8580",
  accent: "#9B8E82",
  accentSoft: "#C4B9AE",
  sage: "#A3AE9E",
  dustyRose: "#C4A9A0",
  warm: "#BFA58A",
  slate: "#8E9CA5",
  border: "#D5D0CA",
  white: "#FAFAF8",
};

const EUR_RATE = 8.5; // 1 EUR = 8.5 HKD

const EXPENSE_CATS = ["餐飲", "交通", "住宿", "景點", "購物", "其他"];

const DEFAULT_PREPAID = [
  { id: 1, desc: "機票 (Bea) — CA110+CA841+CA720+CA763", amount: 7200, currency: "HKD", paidBy: "Bea", split: "solo" },
  { id: 2, desc: "機票 (Cora) — CA110+CA841+CA720+CA763", amount: 7200, currency: "HKD", paidBy: "Cora", split: "solo" },
  { id: 3, desc: "Vienna — Park Hyatt (3晚)", amount: 4500, currency: "HKD", paidBy: "Bea", split: "equal" },
  { id: 4, desc: "Prague — Andaz (2晚)", amount: 3200, currency: "HKD", paidBy: "Bea", split: "equal" },
  { id: 5, desc: "Budapest — Párisi Udvar (2晚)", amount: 3800, currency: "HKD", paidBy: "Bea", split: "equal" },
  { id: 6, desc: "ÖBB Train Vienna → Prague", amount: 480, currency: "HKD", paidBy: "Bea", split: "equal" },
  { id: 7, desc: "ČD Train Prague → Budapest", amount: 560, currency: "HKD", paidBy: "Bea", split: "equal" },
];

const DEFAULT_LOCAL = [];

function toHKD(amount, currency) {
  return currency === "EUR" ? amount * EUR_RATE : amount;
}

function formatAmount(amount, currency, displayCurrency) {
  if (displayCurrency === "EUR") {
    const eur = currency === "EUR" ? amount : amount / EUR_RATE;
    return `€${eur.toFixed(0)}`;
  }
  const hkd = toHKD(amount, currency);
  return `HK$${Math.round(hkd).toLocaleString()}`;
}

const inputStyle = (extra = {}) => ({
  padding: "6px 10px",
  border: `1px solid ${MORANDI.border}`,
  borderRadius: 7,
  fontSize: 12,
  background: MORANDI.bg,
  color: MORANDI.text,
  outline: "none",
  ...extra,
});

const IconBtn = ({ onClick, title, children, danger }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "2px 4px",
      color: danger ? "#C4A9A0" : MORANDI.textLight,
      fontSize: 13,
      lineHeight: 1,
      flexShrink: 0,
    }}
  >
    {children}
  </button>
);

function ExpenseList({ expenses, onEdit, onDelete, editingId, editingData, setEditingData, onSaveEdit, onCancelEdit, displayCurrency }) {
  if (expenses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "28px 0", color: MORANDI.textLight, fontSize: 12, fontStyle: "italic" }}>
        未有記錄
      </div>
    );
  }
  return (
    <div>
      {expenses.map((exp, i) => (
        <div key={exp.id}>
          {editingId === exp.id ? (
            <div style={{ padding: "10px 0", borderBottom: `1px solid ${MORANDI.border}` }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input
                  value={editingData.desc}
                  onChange={e => setEditingData(p => ({ ...p, desc: e.target.value }))}
                  placeholder="描述"
                  style={inputStyle({ flex: 2 })}
                />
                <input
                  type="number"
                  value={editingData.amount}
                  onChange={e => setEditingData(p => ({ ...p, amount: e.target.value }))}
                  placeholder="金額"
                  style={inputStyle({ flex: 1 })}
                />
                <select
                  value={editingData.currency}
                  onChange={e => setEditingData(p => ({ ...p, currency: e.target.value }))}
                  style={inputStyle({ background: MORANDI.white })}
                >
                  <option value="HKD">HKD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <select
                  value={editingData.paidBy}
                  onChange={e => setEditingData(p => ({ ...p, paidBy: e.target.value }))}
                  style={inputStyle({ flex: 1, background: MORANDI.white })}
                >
                  <option value="Bea">🍒 Bea 付</option>
                  <option value="Cora">🌸 Cora 付</option>
                </select>
                <select
                  value={editingData.split}
                  onChange={e => setEditingData(p => ({ ...p, split: e.target.value }))}
                  style={inputStyle({ flex: 1, background: MORANDI.white })}
                >
                  <option value="equal">AA 平分</option>
                  <option value="solo">只算自己</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={onCancelEdit} style={{ padding: "4px 12px", border: `1px solid ${MORANDI.border}`, borderRadius: 6, background: "transparent", fontSize: 11, cursor: "pointer", color: MORANDI.textLight }}>取消</button>
                <button onClick={onSaveEdit} style={{ padding: "4px 12px", border: "none", borderRadius: 6, background: MORANDI.accent, color: MORANDI.white, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>儲存</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: i < expenses.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, background: exp.paidBy === "Bea" ? MORANDI.dustyRose + "33" : MORANDI.accent + "33", color: exp.paidBy === "Bea" ? MORANDI.dustyRose : MORANDI.accent, padding: "1px 6px", borderRadius: 6, fontWeight: 600, flexShrink: 0 }}>
                    {exp.paidBy === "Bea" ? "🍒" : "🌸"} {exp.paidBy}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{exp.desc}</span>
                </div>
                <div style={{ fontSize: 10, color: MORANDI.textLight, marginTop: 1 }}>
                  {exp.split === "equal" ? "AA 平分" : "只算自己"}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: MORANDI.warm }}>
                  {formatAmount(exp.amount, exp.currency, displayCurrency)}
                </div>
                <div style={{ fontSize: 9, color: MORANDI.textLight }}>
                  {exp.currency}
                </div>
              </div>
              <IconBtn onClick={() => onEdit(exp)} title="編輯">✏️</IconBtn>
              <IconBtn onClick={() => onDelete(exp.id)} title="刪除" danger>✕</IconBtn>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddExpenseForm({ onAdd, displayCurrency }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(displayCurrency === "EUR" ? "EUR" : "HKD");
  const [paidBy, setPaidBy] = useState("Bea");
  const [split, setSplit] = useState("equal");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onAdd({ id: Date.now(), desc: desc.trim(), amount: parseFloat(amount), currency, paidBy, split });
    setDesc("");
    setAmount("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ borderTop: `1px solid ${MORANDI.border}`, paddingTop: 12, marginTop: 8 }}>
      <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 8 }}>➕ 新增記錄</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述 (如: 晚餐)" style={inputStyle({ flex: 2 })} />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="金額" style={inputStyle({ width: 80 })} />
        <select value={currency} onChange={e => setCurrency(e.target.value)} style={inputStyle({ background: MORANDI.white })}>
          <option value="HKD">HKD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select value={paidBy} onChange={e => setPaidBy(e.target.value)} style={inputStyle({ flex: 1, background: MORANDI.white })}>
          <option value="Bea">🍒 Bea 付</option>
          <option value="Cora">🌸 Cora 付</option>
        </select>
        <select value={split} onChange={e => setSplit(e.target.value)} style={inputStyle({ flex: 1, background: MORANDI.white })}>
          <option value="equal">AA 平分</option>
          <option value="solo">只算自己</option>
        </select>
        <button type="submit" style={{ padding: "6px 14px", background: MORANDI.warm, color: MORANDI.white, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>
          記帳
        </button>
      </div>
    </form>
  );
}

function Settlement({ prepaid, local, displayCurrency }) {
  const allExpenses = [...prepaid, ...local];

  // Calculate net: positive = Cora owes Bea, negative = Bea owes Cora
  let net = 0;
  const breakdown = [];

  for (const exp of allExpenses) {
    if (exp.split !== "equal") continue;
    const hkd = toHKD(exp.amount, exp.currency);
    const share = hkd / 2;
    if (exp.paidBy === "Bea") {
      net += share; // Cora owes Bea this much
      breakdown.push({ desc: exp.desc, amount: share, direction: "Cora → Bea" });
    } else {
      net -= share; // Bea owes Cora this much
      breakdown.push({ desc: exp.desc, amount: share, direction: "Bea → Cora" });
    }
  }

  const absNet = Math.abs(net);
  const absNetEur = absNet / EUR_RATE;
  const ower = net > 0 ? "Cora" : "Bea";
  const owed = net > 0 ? "Bea" : "Cora";
  const owerEmoji = ower === "Bea" ? "🍒" : "🌸";
  const owedEmoji = owed === "Bea" ? "🍒" : "🌸";

  // Totals per person
  let beaTotalPaid = 0, coraTotalPaid = 0, beaOwes = 0, coraOwes = 0;
  for (const exp of allExpenses) {
    const hkd = toHKD(exp.amount, exp.currency);
    if (exp.paidBy === "Bea") beaTotalPaid += hkd;
    else coraTotalPaid += hkd;
    if (exp.split === "equal") {
      beaOwes += hkd / 2;
      coraOwes += hkd / 2;
    } else {
      if (exp.paidBy === "Bea") beaOwes += hkd;
      else coraOwes += hkd;
    }
  }

  const fmt = (hkd) => displayCurrency === "EUR"
    ? `€${(hkd / EUR_RATE).toFixed(0)}`
    : `HK$${Math.round(hkd).toLocaleString()}`;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[{ name: "Bea", emoji: "🍒", paid: beaTotalPaid, owes: beaOwes, color: MORANDI.dustyRose },
          { name: "Cora", emoji: "🌸", paid: coraTotalPaid, owes: coraOwes, color: MORANDI.accent }].map(p => (
          <div key={p.name} style={{ background: MORANDI.white, border: `1.5px solid ${p.color}44`, borderRadius: 14, padding: "14px 14px" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{p.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: MORANDI.text }}>{p.name}</div>
            <div style={{ fontSize: 10, color: MORANDI.textLight, marginTop: 6, marginBottom: 2 }}>已付出</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: p.color }}>{fmt(p.paid)}</div>
            <div style={{ fontSize: 10, color: MORANDI.textLight, marginTop: 4, marginBottom: 2 }}>應付份額</div>
            <div style={{ fontSize: 12, color: MORANDI.text }}>{fmt(p.owes)}</div>
          </div>
        ))}
      </div>

      {/* Net settlement */}
      {allExpenses.filter(e => e.split === "equal").length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: MORANDI.textLight, fontSize: 12, fontStyle: "italic" }}>
          未有需要分帳的記錄
        </div>
      ) : Math.round(absNet) === 0 ? (
        <div style={{ textAlign: "center", background: MORANDI.sage + "22", border: `1px solid ${MORANDI.sage}`, borderRadius: 14, padding: "18px 16px" }}>
          <div style={{ fontSize: 22 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MORANDI.text, marginTop: 6 }}>已結清！</div>
        </div>
      ) : (
        <div style={{ textAlign: "center", background: MORANDI.warm + "18", border: `1.5px solid ${MORANDI.warm}55`, borderRadius: 14, padding: "20px 16px" }}>
          <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 8, letterSpacing: 0.5 }}>結算結果</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>{owerEmoji}</span>
            <span style={{ fontSize: 12, color: MORANDI.textLight }}>→</span>
            <span style={{ fontSize: 22 }}>{owedEmoji}</span>
          </div>
          <div style={{ fontSize: 11, color: MORANDI.textLight, marginBottom: 4 }}>
            <strong style={{ color: MORANDI.text }}>{ower}</strong> 需要還給 <strong style={{ color: MORANDI.text }}>{owed}</strong>
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, color: MORANDI.warm, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {displayCurrency === "EUR" ? `€${absNetEur.toFixed(0)}` : `HK$${Math.round(absNet).toLocaleString()}`}
          </div>
          <div style={{ fontSize: 10, color: MORANDI.textLight, marginTop: 4 }}>
            {displayCurrency === "EUR" ? `≈ HK$${Math.round(absNet).toLocaleString()}` : `≈ €${absNetEur.toFixed(0)}`}
          </div>
        </div>
      )}

      {/* Breakdown */}
      {breakdown.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: MORANDI.textLight, textTransform: "uppercase", marginBottom: 8 }}>明細</div>
          {breakdown.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < breakdown.length - 1 ? `1px solid ${MORANDI.border}` : "none" }}>
              <span style={{ fontSize: 11, color: MORANDI.text, flex: 1 }}>{b.desc}</span>
              <span style={{ fontSize: 9, color: MORANDI.textLight, marginRight: 8 }}>{b.direction}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: MORANDI.warm }}>{fmt(b.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BudgetPage({ user }) {
  const [subTab, setSubTab] = useState("prepaid");
  const [displayCurrency, setDisplayCurrency] = useState("HKD");

  // Budget data is shared between users (not user-namespaced)
  const [prepaid, setPrepaid] = usePersisted("budget:prepaid", DEFAULT_PREPAID);
  const [local, setLocal] = usePersisted("budget:local", DEFAULT_LOCAL);

  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  const expenses = subTab === "prepaid" ? prepaid : local;
  const setExpenses = subTab === "prepaid" ? setPrepaid : setLocal;

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setEditingData({ desc: exp.desc, amount: String(exp.amount), currency: exp.currency, paidBy: exp.paidBy, split: exp.split });
  };

  const saveEdit = () => {
    if (!editingData.desc?.trim() || !editingData.amount) return;
    setExpenses(p => p.map(x => x.id === editingId
      ? { ...x, desc: editingData.desc.trim(), amount: parseFloat(editingData.amount), currency: editingData.currency, paidBy: editingData.paidBy, split: editingData.split }
      : x
    ));
    setEditingId(null);
  };

  const deleteExpense = (id) => {
    setExpenses(p => p.filter(x => x.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const totalHKD = expenses.reduce((sum, e) => sum + toHKD(e.amount, e.currency), 0);
  const totalDisplay = displayCurrency === "EUR"
    ? `€${(totalHKD / EUR_RATE).toFixed(0)}`
    : `HK$${Math.round(totalHKD).toLocaleString()}`;

  return (
    <div style={{ padding: "0 24px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: MORANDI.textLight, textTransform: "uppercase" }}>
          💰 預算分帳
        </div>
        {/* Currency toggle */}
        <div style={{ display: "flex", gap: 4, background: MORANDI.card, borderRadius: 10, padding: 3, border: `1px solid ${MORANDI.border}` }}>
          {["HKD", "EUR"].map(c => (
            <button
              key={c}
              onClick={() => setDisplayCurrency(c)}
              style={{
                padding: "3px 10px",
                borderRadius: 7,
                border: "none",
                background: displayCurrency === c ? MORANDI.white : "transparent",
                color: displayCurrency === c ? MORANDI.text : MORANDI.textLight,
                fontSize: 10,
                fontWeight: displayCurrency === c ? 600 : 400,
                cursor: "pointer",
                boxShadow: displayCurrency === c ? "0 1px 4px rgba(74,69,65,0.1)" : "none",
                transition: "all 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["prepaid", "✈️ 已預付"], ["local", "💳 當地消費"], ["settle", "🤝 分帳結算"]].map(([t, label]) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              flex: 1,
              padding: "8px 4px",
              border: `1px solid ${subTab === t ? MORANDI.accent : MORANDI.border}`,
              borderRadius: 10,
              background: subTab === t ? MORANDI.accent + "18" : "transparent",
              color: subTab === t ? MORANDI.text : MORANDI.textLight,
              fontSize: 10,
              fontWeight: subTab === t ? 600 : 400,
              cursor: "pointer",
              letterSpacing: 0.3,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: MORANDI.white, borderRadius: 16, border: `1px solid ${MORANDI.border}`, padding: "16px 16px" }}>
        {subTab === "settle" ? (
          <Settlement prepaid={prepaid} local={local} displayCurrency={displayCurrency} />
        ) : (
          <>
            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${MORANDI.border}`, paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: MORANDI.textLight }}>
                {subTab === "prepaid" ? "出發前已付款" : "當地消費記錄"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: MORANDI.warm }}>{totalDisplay}</div>
            </div>

            <ExpenseList
              expenses={expenses}
              onEdit={startEdit}
              onDelete={deleteExpense}
              editingId={editingId}
              editingData={editingData}
              setEditingData={setEditingData}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              displayCurrency={displayCurrency}
            />

            <AddExpenseForm
              onAdd={e => setExpenses(p => [...p, e])}
              displayCurrency={displayCurrency}
            />
          </>
        )}
      </div>
    </div>
  );
}
