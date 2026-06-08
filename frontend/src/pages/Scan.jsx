import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { runScan } from "../api";
import { RiskBadge, ClassBadge } from "../components/Badges";
import { Zap, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Scan() {
  const { user } = useAuth();
  const connectionsKey = user ? `db_connections_${user.email}` : "db_connections";
  const activeConnKey = user ? `db_connection_${user.email}` : "db_connection";

  const databases = JSON.parse(localStorage.getItem(connectionsKey) || "[]");
  
  const [selectedDbId, setSelectedDbId] = useState(() => {
    const active = JSON.parse(localStorage.getItem(activeConnKey) || "{}");
    if (active.connection_string) {
      const found = databases.find(
        (db) => db.connection_string === active.connection_string && db.db_alias === active.db_alias
      );
      return found ? found.id : "manual";
    } else if (databases.length > 0) {
      return databases[0].id;
    }
    return "manual";
  });
  
  const [form, setForm] = useState(() => {
    const active = JSON.parse(localStorage.getItem(activeConnKey) || "{}");
    if (active.connection_string) {
      const found = databases.find(
        (db) => db.connection_string === active.connection_string && db.db_alias === active.db_alias
      );
      if (found) {
        return {
          connection_string: found.connection_string,
          db_alias: found.db_alias,
          db_type: found.db_type,
        };
      } else {
        return {
          connection_string: active.connection_string || "",
          db_alias: active.db_alias || "",
          db_type: active.db_type || "postgresql",
        };
      }
    } else if (databases.length > 0) {
      return {
        connection_string: databases[0].connection_string,
        db_alias: databases[0].db_alias,
        db_type: databases[0].db_type,
      };
    }
    return {
      connection_string: "",
      db_alias: "",
      db_type: "postgresql",
    };
  });
  
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const active = JSON.parse(localStorage.getItem(activeConnKey) || "{}");
    const list = JSON.parse(localStorage.getItem(connectionsKey) || "[]");
    if (!active.connection_string && list.length > 0) {
      localStorage.setItem(activeConnKey, JSON.stringify({
        connection_string: list[0].connection_string,
        db_alias: list[0].db_alias,
        db_type: list[0].db_type,
        connection_type: list[0].connection_type,
      }));
    }
  }, []);

  const handleDbSelectChange = (e) => {
    const val = e.target.value;
    setSelectedDbId(val);
    setError("");

    if (val === "manual") {
      setForm({
        connection_string: "",
        db_alias: "",
        db_type: "postgresql",
      });
    } else {
      const db = databases.find((d) => d.id === val);
      if (db) {
        setForm({
          connection_string: db.connection_string,
          db_alias: db.db_alias,
          db_type: db.db_type,
        });
        localStorage.setItem(activeConnKey, JSON.stringify({
          connection_string: db.connection_string,
          db_alias: db.db_alias,
          db_type: db.db_type,
          connection_type: db.connection_type,
        }));
      }
    }
  };

  const handleScan = async () => {
    if (!form.connection_string || !form.db_alias) {
      setError("Please fill connection string and alias.");
      return;
    }
    setStatus("loading"); setError(""); setResult(null);
    try {
      const res = await runScan(form);
      setResult(res.data); setStatus("done");
    } catch (e) {
      setError(e.response?.data?.detail || "Scan failed. Check your connection.");
      setStatus("error");
    }
  };

  const isManual = selectedDbId === "manual";

  return (
    <div className="w-full space-y-6 max-w-[1440px] mx-auto">
      <div>
        <h1 className="text-headline-md lg:text-headline-lg font-bold text-flux-on-surface">
          Run <span className="text-flux-tertiary-container">Schema Scan</span>
        </h1>
        <p className="text-flux-on-surface-variant text-body-md mt-1">
          Extract current schema, compare with previous snapshot, and trigger AI analysis.
        </p>
      </div>

      <div className="card bg-white border border-flux-outline-variant/30 space-y-4 max-w-2xl">
        {/* Connection Selector */}
        {databases.length > 0 && (
          <div>
            <label className="text-xs text-flux-on-surface-variant uppercase tracking-wider font-semibold block mb-1.5">
              Select Database Connection
            </label>
            <select
              value={selectedDbId}
              onChange={handleDbSelectChange}
              className="w-full bg-white border border-slate-200 rounded px-3 py-2.5 text-sm text-flux-on-surface focus:outline-none focus:border-flux-primary-container focus:ring-2 focus:ring-flux-primary-container/10 transition cursor-pointer font-semibold"
            >
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.db_alias} ({db.connection_type === "sqlite" ? "SQLite" : "PostgreSQL"})
                </option>
              ))}
              <option value="manual">Configure connection manually...</option>
            </select>
          </div>
        )}

        {/* DB Type toggle */}
        <div>
          <label className="text-xs text-flux-on-surface-variant uppercase tracking-wider font-semibold block mb-1.5">
            DB Type
          </label>
          <div className="flex gap-2">
            {["postgresql", "sqlite"].map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, db_type: t, connection_string: "" })}
                disabled={!isManual}
                className={`px-4 py-2 rounded text-sm font-semibold border transition-all ${
                  form.db_type === t
                    ? "bg-flux-tertiary-container/10 border-flux-tertiary-container/30 text-flux-tertiary-container"
                    : "border-slate-200 text-flux-on-surface-variant hover:border-slate-400 bg-white"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {t === "postgresql" ? "PostgreSQL" : "SQLite"}
              </button>
            ))}
          </div>
        </div>

        {/* Alias */}
        <div>
          <label className="text-xs text-flux-on-surface-variant uppercase tracking-wider font-semibold block mb-1.5">
            Database Alias
          </label>
          <input
            value={form.db_alias}
            onChange={(e) => setForm({ ...form, db_alias: e.target.value })}
            placeholder="e.g. my_database"
            readOnly={!isManual}
            className={`w-full bg-white border border-slate-200 rounded px-3 py-2.5 text-sm text-flux-on-surface placeholder-slate-400 focus:outline-none focus:border-flux-primary-container focus:ring-2 focus:ring-flux-primary-container/10 transition ${
              !isManual ? "opacity-75 bg-flux-surface cursor-not-allowed border-slate-200" : ""
            }`}
          />
        </div>

        {/* Connection string */}
        <div>
          <label className="text-xs text-flux-on-surface-variant uppercase tracking-wider font-semibold block mb-1.5">
            Connection String
          </label>
          <input
            value={form.connection_string}
            onChange={(e) => setForm({ ...form, connection_string: e.target.value })}
            placeholder={
              form.db_type === "sqlite"
                ? "sqlite:///d:/myproject/db.sqlite3"
                : "postgresql://postgres:password@localhost:5432/mydb"
            }
            readOnly={!isManual}
            className={`w-full bg-white border border-slate-200 rounded px-3 py-2.5 text-sm text-flux-on-surface placeholder-slate-400 focus:outline-none focus:border-flux-primary-container focus:ring-2 focus:ring-flux-primary-container/10 transition font-mono ${
              !isManual ? "opacity-75 bg-flux-surface cursor-not-allowed border-slate-200" : ""
            }`}
          />
          {form.db_type === "sqlite" && isManual && (
            <p className="text-flux-on-surface-variant text-xs mt-1.5">
              Format: <span className="text-flux-secondary font-mono">sqlite:///C:/full/path/to/your.db</span>
            </p>
          )}
          {!isManual && (
            <p className="text-flux-on-surface-variant text-xs mt-1.5">
              Preconfigured connection. To edit details, go to{" "}
              <span 
                onClick={() => navigate("/connect")}
                className="text-flux-primary font-semibold cursor-pointer hover:underline"
              >
                Databases
              </span>.
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-flux-error/10 border border-flux-error/30 rounded px-3 py-2 text-flux-error text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={status === "loading"}
          className="w-full py-3 bg-flux-primary text-white font-semibold rounded hover:bg-flux-primary-container transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-float"
        >
          {status === "loading" ? (
            <><Loader size={16} className="animate-spin" /> Scanning & Analyzing...</>
          ) : (
            <><Zap size={16} /> Run AI Scan</>
          )}
        </button>
      </div>

      {/* Result */}
      {status === "done" && result && (
        <div className="space-y-4 max-w-4xl">
          {/* Summary card */}
          <div className={`card bg-white border transition duration-200 ${result.drift_detected ? "border-flux-error/30 ring-2 ring-flux-error/5" : "border-flux-secondary/30 ring-2 ring-flux-secondary/5"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.drift_detected
                  ? <AlertTriangle size={18} className="text-flux-error" />
                  : <CheckCircle size={18} className="text-flux-secondary" />}
                <span className="font-bold text-flux-on-surface text-base">
                  {result.drift_detected ? "Drift Detected!" : "No Drift Detected"}
                </span>
              </div>
              {result.overall_risk && <RiskBadge risk={result.overall_risk} />}
            </div>
            {result.message && <p className="text-flux-on-surface-variant text-sm">{result.message}</p>}
            {result.total_changes > 0 && (
              <p className="text-flux-on-surface-variant text-sm mt-1">
                <span className="text-flux-primary font-mono font-bold">{result.total_changes}</span> change(s) detected
              </p>
            )}
          </div>

          {/* LLM Summary */}
          {result.llm_analysis?.summary && (
            <div className="card bg-white border border-flux-tertiary-container/30">
              <p className="text-xs text-flux-tertiary font-semibold uppercase tracking-wider mb-2">
                🤖 AI Summary
              </p>
              <p className="text-flux-on-surface text-sm leading-relaxed">{result.llm_analysis.summary}</p>
            </div>
          )}

          {/* Change breakdown */}
          {result.llm_analysis?.changes?.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-flux-on-surface-variant uppercase tracking-wider font-semibold">Change Analysis</p>
              {result.llm_analysis.changes.map((c, i) => (
                <div key={i} className="bg-white border border-flux-outline-variant/30 rounded-lg overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-flux-outline-variant/30 bg-flux-surface-container-low">
                    <span className="font-mono font-bold text-flux-secondary">{c.table}</span>
                    <span className="text-flux-on-surface-variant text-xs font-mono bg-white border border-flux-outline-variant/30 px-2 py-0.5 rounded-sm">
                      {c.type?.replace(/_/g, " ")}
                    </span>
                    <ClassBadge classification={c.classification} />
                    <RiskBadge risk={c.risk} />
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-flux-error/5 border border-flux-error/20 rounded-sm p-4">
                      <p className="text-xs text-flux-error uppercase tracking-wider font-semibold mb-2">⚠ Impact</p>
                      <p className="text-flux-on-surface text-sm leading-relaxed">{c.impact}</p>
                    </div>
                    <div className="bg-flux-secondary/5 border border-flux-secondary/20 rounded-sm p-4">
                      <p className="text-xs text-flux-secondary uppercase tracking-wider font-semibold mb-2">✓ Mitigation</p>
                      <p className="text-flux-on-surface text-sm leading-relaxed">{c.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.report_id && (
            <button
              onClick={() => navigate(`/reports/${result.report_id}`)}
              className="text-sm text-flux-primary hover:underline font-semibold"
            >
              View full report →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
