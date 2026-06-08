import { useEffect, useState } from "react";
import { getSnapshots, getSnapshot } from "../api";
import { History, ChevronDown, ChevronUp, Database } from "lucide-react";

// Per-table accordion item
function SchemaTable({ tableName, tableData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-flux-outline-variant/30 rounded bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-flux-surface-container-low hover:bg-flux-surface-container transition text-left"
      >
        <div className="flex items-center gap-2">
          <Database size={14} className="text-flux-secondary" />
          <span className="text-flux-on-surface font-mono text-sm font-bold">{tableName}</span>
          <span className="text-flux-on-surface-variant text-xs font-semibold">
            {Object.keys(tableData.columns || {}).length} columns
          </span>
        </div>
        {open ? <ChevronUp size={14} className="text-flux-on-surface-variant" /> : <ChevronDown size={14} className="text-flux-on-surface-variant" />}
      </button>
      {open && (
        <div className="divide-y divide-flux-outline-variant/20 border-t border-flux-outline-variant/20">
          {Object.entries(tableData.columns || {}).map(([col, info]) => (
            <div key={col} className="flex items-center justify-between px-4 py-2 hover:bg-flux-surface even:bg-flux-surface-container-lowest/30">
              <span className="font-mono text-flux-primary text-xs font-bold">{col}</span>
              <div className="flex items-center gap-2">
                <span className="text-flux-on-surface-variant text-xs font-mono">{info.type}</span>
                {!info.nullable && (
                  <span className="text-[10px] bg-flux-tertiary/10 border border-flux-tertiary/20 text-flux-tertiary px-1.5 py-0.5 rounded-sm font-mono font-semibold">
                    NOT NULL
                  </span>
                )}
                {tableData.primary_keys?.includes(col) && (
                  <span className="text-[10px] bg-flux-secondary/10 border border-flux-secondary/20 text-flux-secondary px-1.5 py-0.5 rounded-sm font-mono font-semibold">
                    PK
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Snapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [databases, setDatabases] = useState(() => 
    JSON.parse(localStorage.getItem("db_connections") || "[]")
  );
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSnapshots = () => {
    getSnapshots()
      .then((r) => setSnapshots(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const loadDetail = async (id) => {
    if (selected === id) {
      setSelected(null);
      setDetail(null);
      return;
    }
    setSelected(id);
    const res = await getSnapshot(id);
    setDetail(res.data);
  };

  const handleToggleAutoTake = (dbId) => {
    const list = JSON.parse(localStorage.getItem("db_connections") || "[]");
    const updated = list.map((db) => {
      if (db.id === dbId) {
        const newValue = !db.auto_take;
        return { 
          ...db, 
          auto_take: newValue, 
          auto_take_interval: db.auto_take_interval || 60,
          // If enabled, initialize last run to allow it to trigger
          last_auto_take: newValue ? new Date(Date.now() - (db.auto_take_interval || 60) * 60000).toISOString() : db.last_auto_take
        };
      }
      return db;
    });
    localStorage.setItem("db_connections", JSON.stringify(updated));
    setDatabases(updated);
    // Dispatch local storage event so other components (App.jsx) know it changed
    window.dispatchEvent(new Event("storage"));
  };

  const handleChangeInterval = (dbId, interval) => {
    const list = JSON.parse(localStorage.getItem("db_connections") || "[]");
    const val = Number(interval);
    const updated = list.map((db) => {
      if (db.id === dbId) {
        return { 
          ...db, 
          auto_take_interval: val,
          last_auto_take: new Date(Date.now() - val * 60000).toISOString()
        };
      }
      return db;
    });
    localStorage.setItem("db_connections", JSON.stringify(updated));
    setDatabases(updated);
    window.dispatchEvent(new Event("storage"));
  };

  if (loading)
    return <div className="flex justify-center h-40 items-center"><div className="w-6 h-6 border-2 border-flux-primary-container border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <div>
        <h1 className="text-headline-md lg:text-headline-lg font-bold text-flux-on-surface">
          Schema <span className="text-flux-primary-container">Snapshots</span>
        </h1>
        <p className="text-flux-on-surface-variant text-body-md mt-1">Historical schema captures. Click to inspect.</p>
      </div>

      {/* Automatic Snapshot Settings */}
      {databases.length > 0 && (
        <div className="card bg-white border border-flux-outline-variant/30 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-flux-on-surface uppercase tracking-wider">
              Automatic Snapshot Settings
            </h2>
            <p className="text-flux-on-surface-variant text-xs mt-0.5">
              Automatically trigger schema scans periodically while the application is open in the browser.
            </p>
          </div>
          <div className="divide-y divide-flux-outline-variant/20 border border-flux-outline-variant/20 rounded-md overflow-hidden bg-white">
            {databases.map((db) => (
              <div key={db.id} className="flex flex-wrap items-center justify-between px-4 py-3 bg-white hover:bg-flux-surface transition gap-4">
                <div>
                  <p className="text-flux-on-surface font-semibold text-sm">{db.db_alias}</p>
                  <p className="text-flux-on-surface-variant text-xs font-mono">{db.connection_type === "sqlite" ? "SQLite" : "PostgreSQL"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {db.auto_take && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-flux-on-surface-variant font-medium">Frequency:</span>
                      <select
                        value={db.auto_take_interval || 60}
                        onChange={(e) => handleChangeInterval(db.id, e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-flux-on-surface focus:outline-none focus:border-flux-primary-container cursor-pointer font-semibold"
                      >
                        <option value={1}>1 Minute (Test)</option>
                        <option value={30}>30 Minutes</option>
                        <option value={60}>1 Hour</option>
                        <option value={360}>6 Hours</option>
                        <option value={720}>12 Hours</option>
                        <option value={1440}>24 Hours</option>
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`auto-take-${db.id}`}
                      checked={!!db.auto_take}
                      onChange={() => handleToggleAutoTake(db.id)}
                      className="w-4 h-4 text-flux-primary border-slate-300 rounded focus:ring-flux-primary-container cursor-pointer"
                    />
                    <label htmlFor={`auto-take-${db.id}`} className="text-xs text-flux-on-surface font-semibold cursor-pointer select-none">
                      Enable Auto-Capture
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshots List */}
      {snapshots.length === 0 ? (
        <div className="card bg-white border border-flux-outline-variant/30 text-center py-16">
          <History size={40} className="text-flux-outline mx-auto mb-3" />
          <p className="text-flux-on-surface-variant">No snapshots yet. Run a scan first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map((s) => (
            <div key={s.id} className="space-y-2">
              <div
                onClick={() => loadDetail(s.id)}
                className={`card bg-white border cursor-pointer transition ${
                  selected === s.id
                    ? "border-flux-primary ring-2 ring-flux-primary/10 shadow-float"
                    : "border-flux-outline-variant/30 hover:border-flux-outline"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-flux-secondary/10 border border-flux-secondary/20 flex items-center justify-center">
                      <Database size={14} className="text-flux-secondary" />
                    </div>
                    <div>
                      <p className="text-flux-on-surface font-semibold">{s.db_alias}</p>
                      <p className="text-flux-on-surface-variant text-xs font-mono">{new Date(s.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-flux-on-surface-variant text-xs font-medium">{s.table_count} tables</span>
                    <span className="text-xs bg-flux-surface border border-flux-outline-variant/30 text-flux-on-surface-variant px-2 py-0.5 rounded-sm font-mono uppercase font-semibold">
                      {s.db_type}
                    </span>
                    {selected === s.id
                      ? <ChevronUp size={14} className="text-flux-primary" />
                      : <ChevronDown size={14} className="text-flux-outline" />}
                  </div>
                </div>
              </div>

              {/* Expanded schema */}
              {selected === s.id && detail && (
                <div className="card bg-white border border-flux-outline-variant/30 space-y-3 shadow-sm">
                  <p className="text-xs text-flux-primary font-semibold uppercase tracking-wider">
                    Schema — Snapshot #{s.id}
                  </p>
                  <div className="space-y-3">
                    {Object.entries(detail.snapshot || {}).map(([table, data]) => (
                      <SchemaTable key={table} tableName={table} tableData={data} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
