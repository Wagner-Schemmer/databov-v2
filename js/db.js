// Helper Supabase REST sem dependências (SELECT + INSERT com RLS)
const DBCFG = (window.APP_CONFIG && window.APP_CONFIG.supabase) || {};
const DBH = () => ({ apikey: DBCFG.anonKey, Authorization: "Bearer " + DBCFG.anonKey, "Content-Type": "application/json" });
async function dbList(table, q = "select=*") {
  const r = await fetch(`${DBCFG.url}/rest/v1/${table}?${q}`, { headers: DBH() });
  if (!r.ok) throw new Error("dbList " + r.status);
  return r.json();
}
async function dbInsert(table, row) {
  const r = await fetch(`${DBCFG.url}/rest/v1/${table}`, { method: "POST", headers: { ...DBH(), Prefer: "return=minimal" }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error("dbInsert " + r.status);
}
