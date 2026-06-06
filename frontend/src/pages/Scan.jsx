import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { runScan } from "../api";
import { RiskBadge, ClassBadge } from "../components/Badges";
import { Zap, AlertTriangle, CheckCircle, Loader } from "lucide-react";

export default function Scan() {
  const saved = JSON.parse(localStorage.getItem("db_connection") || "{}");
  const [form, setForm] = useState({
    connection_string: saved.connection_string || "",
    db_alias: saved.db_alias || "",
    db_type: saved.db_type || "postgresql",
  });
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Run <span className="text-neon-purple">Schema Scan</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Extract current schema, compare with previous snapshot, and trigger AI analysis.
        </p>
      </div>

      <div className="card space-y-4 max-w-2xl">
        {/* DB Type toggle */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            DB Type
          </label>
          <div className="flex gap-2">
            {["postgresql", "sqlite"].map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, db_type: t, connection_string: "" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  form.db_type === t
                    ? "bg-neon-purple/10 border-neon-purple/40 text-neon-purple"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {t === "postgresql" ? "PostgreSQL" : "SQLite"}
              </button>
            ))}
          </div>
        </div>

        {/* Alias */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            Database Alias
          </label>
          <input
            value={form.db_alias}
            onChange={(e) => setForm({ ...form, db_alias: e.target.value })}
            placeholder="e.g. my_database"
            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-purple/50 transition"
          />
        </div>

        {/* Connection string */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
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
            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-purple/50 transition font-mono"
          />
          {form.db_type === "sqlite" && (
            <p className="text-slate-500 text-xs mt-1.5">
              Format: <span className="text-neon-green font-mono">sqlite:///C:/full/path/to/your.db</span>
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-red-400 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={status === "loading"}
          className="w-full py-3 bg-neon-purple/10 border border-neon-purple/40 text-neon-purple font-semibold rounded-lg hover:bg-neon-purple/20 transition glow-purple flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="space-y-4">
          {/* Summary card */}
          <div className={`card border ${result.drift_detected ? "border-neon-red/30 glow-red" : "border-neon-green/30 glow-green"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.drift_detected
                  ? <AlertTriangle size={18} className="text-neon-red" />
                  : <CheckCircle size={18} className="text-neon-green" />}
                <span className="font-semibold text-white">
                  {result.drift_detected ? "Drift Detected!" : "No Drift Detected"}
                </span>
              </div>
              {result.overall_risk && <RiskBadge risk={result.overall_risk} />}
            </div>
            {result.message && <p className="text-slate-400 text-sm">{result.message}</p>}
            {result.total_changes > 0 && (
              <p className="text-slate-300 text-sm mt-1">
                <span className="text-neon-purple font-mono">{result.total_changes}</span> change(s) detected
              </p>
            )}
          </div>

          {/* LLM Summary */}
          {result.llm_analysis?.summary && (
            <div className="card border border-neon-purple/20">
              <p className="text-xs text-neon-purple uppercase tracking-wider font-medium mb-2">
                🤖 AI Summary
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">{result.llm_analysis.summary}</p>
            </div>
          )}

          {/* Change breakdown */}
          {result.llm_analysis?.changes?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Change Analysis</p>
              {result.llm_analysis.changes.map((c, i) => (
                <div key={i} className="bg-navy-800 border border-slate-700/50 rounded-xl overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-700/40 bg-navy-900/50">
                    <span className="font-mono font-bold text-neon-blue">{c.table}</span>
                    <span className="text-slate-500 text-xs font-mono bg-slate-800 px-2 py-0.5 rounded">
                      {c.type?.replace(/_/g, " ")}
                    </span>
                    <ClassBadge classification={c.classification} />
                    <RiskBadge risk={c.risk} />
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-4">
                      <p className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-2">⚠ Impact</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{c.impact}</p>
                    </div>
                    <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-4">
                      <p className="text-xs text-neon-green uppercase tracking-wider font-semibold mb-2">✓ Mitigation</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{c.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.report_id && (
            <button
              onClick={() => navigate(`/reports/${result.report_id}`)}
              className="text-sm text-neon-purple hover:underline"
            >
              View full report →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
