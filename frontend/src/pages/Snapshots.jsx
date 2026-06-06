import { useEffect, useState } from "react";
import { getSnapshots, getSnapshot } from "../api";
import { History, ChevronDown, ChevronUp, Database } from "lucide-react";

function SchemaTable({ tableName, tableData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-navy-700 hover:bg-slate-700/30 transition text-left"
      >
        <div className="flex items-center gap-2">
          <Database size={14} className="text-neon-blue" />
          <span className="text-white font-mono text-sm font-semibold">{tableName}</span>
          <span className="text-slate-500 text-xs">
            {Object.keys(tableData.columns || {}).length} columns
          </span>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && (
        <div className="divide-y divide-slate-700/30">
          {Object.entries(tableData.columns || {}).map(([col, info]) => (
            <div key={col} className="flex items-center justify-between px-4 py-2 bg-navy-900/50">
              <span className="font-mono text-neon-green text-xs">{col}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-mono">{info.type}</span>
                {!info.nullable && (
                  <span className="text-xs bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 px-1.5 py-0.5 rounded font-mono">
                    NOT NULL
                  </span>
                )}
                {tableData.primary_keys?.includes(col) && (
                  <span className="text-xs bg-neon-blue/10 border border-neon-blue/30 text-neon-blue px-1.5 py-0.5 rounded font-mono">
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
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSnapshots()
      .then((r) => setSnapshots(r.data))
      .finally(() => setLoading(false));
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

  if (loading)
    return <div className="flex justify-center h-40 items-center"><div className="w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Schema <span className="text-neon-blue">Snapshots</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Historical schema captures. Click to inspect.</p>
      </div>

      {snapshots.length === 0 ? (
        <div className="card text-center py-16">
          <History size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No snapshots yet. Run a scan first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map((s) => (
            <div key={s.id} className="space-y-2">
              <div
                onClick={() => loadDetail(s.id)}
                className={`card border cursor-pointer transition ${
                  selected === s.id
                    ? "border-neon-blue/40 glow-blue"
                    : "border-slate-700/50 hover:border-neon-blue/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                      <Database size={14} className="text-neon-blue" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{s.db_alias}</p>
                      <p className="text-slate-500 text-xs font-mono">{new Date(s.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">{s.table_count} tables</span>
                    <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
                      {s.db_type}
                    </span>
                    {selected === s.id
                      ? <ChevronUp size={14} className="text-neon-blue" />
                      : <ChevronDown size={14} className="text-slate-500" />}
                  </div>
                </div>
              </div>

              {/* Expanded schema */}
              {selected === s.id && detail && (
                <div className="card border border-neon-blue/20 space-y-2">
                  <p className="text-xs text-neon-blue uppercase tracking-wider font-medium mb-3">
                    Schema — Snapshot #{s.id}
                  </p>
                  {Object.entries(detail.snapshot || {}).map(([table, data]) => (
                    <SchemaTable key={table} tableName={table} tableData={data} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
