import React, { useEffect, useMemo, useState } from 'react'

// Временни потребители за демо
const USERS = {
  user1: "Test@2025a",
  user2: "Test@2025b",
};

const ls = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};

export default function App(){
  const [user, setUser] = useState(ls.get("auth_user", null));
  if(!user) return <Login onLogin={(u)=>{ setUser(u); ls.set("auth_user", u); }} />;
  return <AppShell user={user} onLogout={()=>{ setUser(null); localStorage.removeItem("auth_user"); }} />
}

function Login({ onLogin }){
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = (e)=>{
    e.preventDefault();
    if(USERS[u] && USERS[u]===p) onLogin(u);
    else setErr("Невалидни данни за вход");
  };

  return (
    <div className="container" style={{maxWidth: 420}}>
      <div className="card">
        <div className="vstack" style={{gap: 12}}>
          <div className="title">Вход</div>
          <form onSubmit={submit} className="vstack">
            <input placeholder="Потребител" value={u} onChange={e=>setU(e.target.value)} />
            <input placeholder="Парола" type="password" value={p} onChange={e=>setP(e.target.value)} />
            {err && <div className="small" style={{color:'#dc2626'}}>{err}</div>}
            <button type="submit">Влез</button>
          </form>
          <div className="small">Демо: user1 / {USERS.user1} · user2 / {USERS.user2}</div>
        </div>
      </div>
    </div>
  );
}

function AppShell({ user, onLogout }){
  const emptyForm = {
    date: new Date().toISOString().slice(0,10),
    location: "",
    name: "",
    phone: "",
    email: "",
    landPlace: "",
    landId: "",
    area: "",
    cultivableArea: "",
    pricePerDecare: "",
    category: "",
    rent: "",
    contractUntil: "",
    comment: ""
  };
  const [form, setForm] = useState(emptyForm);
  const [offers, setOffers] = useState(ls.get("offers", []));

  const [search, setSearch] = useState(ls.get("filters_search", ""));
  const [filters, setFilters] = useState(ls.get("filters_obj", { location: "", category: "", contractUntil: "" }));
  const [columns, setColumns] = useState(ls.get("columns_visible", {
    "Дата": true,
    "Землище": true,
    "Име": false,
    "Телефон": false,
    "Имейл": false,
    "Местност": true,
    "№ имот": true,
    "Дка": true,
    "Обраб. дка": true,
    "Цена/дка": true,
    "Категория": true,
    "Аренда": true,
    "Договор до": true,
    "Коментар": true,
  }));

  useEffect(()=>{ ls.set("offers", offers); }, [offers]);
  useEffect(()=>{ ls.set("filters_search", search); }, [search]);
  useEffect(()=>{ ls.set("filters_obj", filters); }, [filters]);
  useEffect(()=>{ ls.set("columns_visible", columns); }, [columns]);

  const submit = (e)=>{
    e.preventDefault();
    const row = {
      date: form.date,
      location: form.location.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      landPlace: form.landPlace.trim(),
      landId: form.landId.trim(),
      area: fixDec(form.area),
      cultivableArea: fixDec(form.cultivableArea),
      pricePerDecare: fixDec(form.pricePerDecare),
      category: form.category.trim(),
      rent: fixDec(form.rent),
      contractUntil: form.contractUntil.trim(),
      comment: form.comment.trim(),
      _id: (typeof crypto!=='undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2),
      _createdBy: user,
    };
    setOffers([row, ...offers]);
    setForm({ ...emptyForm, location: form.location });
  };

  const remove = (id)=> setOffers(offers.filter(o=>o._id!==id));

  const locations = useMemo(()=>Array.from(new Set(offers.map(o=>o.location).filter(Boolean))).sort(), [offers]);
  const categories = useMemo(()=>Array.from(new Set(offers.map(o=>o.category).filter(Boolean))).sort(), [offers]);
  const years = useMemo(()=>Array.from(new Set(offers.map(o=>o.contractUntil).filter(Boolean))).sort(), [offers]);

  const normalized = (s) => String(s ?? "").toLowerCase();
  const filtered = useMemo(()=>{
    return offers.filter(o=>{
      const s = normalized(search);
      const matchesSearch = !s || Object.values(o).some(v=>normalized(v).includes(s));
      const fLoc = !filters.location || o.location === filters.location;
      const fCat = !filters.category || o.category === filters.category;
      const fYear = !filters.contractUntil || o.contractUntil === filters.contractUntil;
      return matchesSearch && fLoc && fCat && fYear;
    });
  }, [offers, search, filters]);

  const columnsMap = [
    ["Дата","date"],
    ["Землище","location"],
    ["Име","name"],
    ["Телефон","phone"],
    ["Имейл","email"],
    ["Местност","landPlace"],
    ["№ имот","landId"],
    ["Дка","area"],
    ["Обраб. дка","cultivableArea"],
    ["Цена/дка","pricePerDecare"],
    ["Категория","category"],
    ["Аренда","rent"],
    ["Договор до","contractUntil"],
    ["Коментар","comment"],
  ];

  return (
    <div className="container">
      <div className="header">
        <div className="title">Оферти за земя</div>
        <div className="hstack">
          <button className="secondary" onClick={onLogout}>Изход ({user})</button>
        </div>
      </div>

      <div className="card">
        <div className="vstack" style={{gap: 10}}>
          <div style={{fontWeight:600}}>Добавяне на оферта</div>
          <form onSubmit={submit} className="grid cols-3">
            <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
            <input placeholder="Землище" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} />
            <input placeholder="Име" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            <input placeholder="Телефон" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
            <input placeholder="Имейл" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            <input placeholder="Местност" value={form.landPlace} onChange={e=>setForm({...form, landPlace:e.target.value})} />
            <input placeholder="№ имот" value={form.landId} onChange={e=>setForm({...form, landId:e.target.value})} />
            <input placeholder="Дка (общо)" value={form.area} onChange={e=>setForm({...form, area:e.target.value})} />
            <input placeholder="Обработваеми дка" value={form.cultivableArea} onChange={e=>setForm({...form, cultivableArea:e.target.value})} />
            <input placeholder="Цена/дка" value={form.pricePerDecare} onChange={e=>setForm({...form, pricePerDecare:e.target.value})} />
            <input placeholder="Категория" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
            <input placeholder="Аренда" value={form.rent} onChange={e=>setForm({...form, rent:e.target.value})} />
            <input placeholder="Договор до (година)" value={form.contractUntil} onChange={e=>setForm({...form, contractUntil:e.target.value})} />
            <input placeholder="Коментар" value={form.comment} onChange={e=>setForm({...form, comment:e.target.value})} />
            <div style={{gridColumn: "1 / -1"}}>
              <button type="submit" style={{width:"100%"}}>Запиши</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="vstack" style={{gap: 10}}>
          <div style={{fontWeight:600}}>Търсене и филтри</div>
          <div className="grid cols-4">
            <input placeholder="Търси навсякъде..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select value={filters.location} onChange={e=>setFilters({...filters, location:e.target.value})}>
              <option value="">Всички землища</option>
              {locations.map(l=> <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filters.category} onChange={e=>setFilters({...filters, category:e.target.value})}>
              <option value="">Всички категории</option>
              {categories.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.contractUntil} onChange={e=>setFilters({...filters, contractUntil:e.target.value})}>
              <option value="">Всички години</option>
              {years.map(y=> <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="hstack" style={{flexWrap:'wrap', justifyContent:'space-between'}}>
            <div className="hstack" style={{gap: 6, flexWrap:'wrap'}}>
              {Object.keys(columns).map(key => (
                <label key={key} className="checkbox">
                  <input
                    type="checkbox"
                    checked={columns[key]}
                    onChange={()=>setColumns({...columns, [key]: !columns[key]})}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
            <div className="hstack" style={{gap: 8}}>
              <button className="secondary" onClick={()=>exportCSV(filtered.map(mapRowForExport))}>Експорт в CSV</button>
              <button className="secondary" onClick={()=>exportCSVForBuyer(filtered.map(mapRowForExport))}>Експорт за купувач</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              {columnsMap.map(([label])=> columns[label] && (
                <th key={label}>{label}</th>
              ))}
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o._id}>
                {columnsMap.map(([label, key]) => columns[label] && (
                  <td key={label}>{renderCell(key, o)}</td>
                ))}
                <td><button className="danger" onClick={()=>remove(o._id)}>Изтрий</button></td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={columnsMap.filter(([l])=>columns[l]).length+1} className="small">Няма намерени записи</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderCell(key, o){
  const map = {
    date: o.date,
    location: o.location,
    name: o.name,
    phone: o.phone,
    email: o.email,
    landPlace: o.landPlace,
    landId: o.landId,
    area: formatDec(o.area),
    cultivableArea: formatDec(o.cultivableArea),
    pricePerDecare: formatDec(o.pricePerDecare),
    category: o.category,
    rent: formatDec(o.rent),
    contractUntil: o.contractUntil,
    comment: o.comment,
  };
  return map[key] ?? "";
}

function mapRowForExport(o){
  return {
    "Дата": o.date,
    "Землище": o.location,
    "Име": o.name,
    "Телефон": o.phone,
    "Имейл": o.email,
    "Местност": o.landPlace,
    "№ имот": o.landId,
    "Дка": formatDec(o.area),
    "Обраб. дка": formatDec(o.cultivableArea),
    "Цена/дка": formatDec(o.pricePerDecare),
    "Категория": o.category,
    "Аренда": formatDec(o.rent),
    "Договор до": o.contractUntil,
    "Коментар": o.comment,
  };
}

function exportCSV(rows){
  if(!rows.length) return;
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(",")].concat(
    rows.map(r => headers.map(h => `"${String(r[h]??"").replaceAll('"','""')}"`).join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `oferti_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// Експорт без лични данни
function exportCSVForBuyer(rows){
  if(!rows.length) return;
  const omit = new Set(["Име","Телефон","Имейл"]);
  const headers = Object.keys(rows[0] || {}).filter(h => !omit.has(h));
  const csv = [headers.join(",")].concat(
    rows.map(r => headers.map(h => `"${String(r[h]??"").replaceAll('"','""')}"`).join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `oferti_za_kuvuvach_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function fixDec(v){
  const s = String(v ?? "").replaceAll(" ", "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(3) : "";
}

function formatDec(v){
  if(v===undefined || v===null || v==="") return "";
  const n = Number(v);
  if(!Number.isFinite(n)) return String(v);
  return n.toFixed(3).replace(".", ",");
}

// експорт за евентуални тестове
export { formatDec, fixDec };
