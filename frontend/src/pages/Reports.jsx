import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDriftReports, getDriftReport } from "../api";
import { RiskBadge, ClassBadge } from "../components/Badges";
import {
  FileWarning, ArrowLeft, ChevronRight,
  AlertTriangle, ShieldCheck, Info, Table2,
} from "lucide-react";

const CHANGE_ICONS = {
  column_removed: { icon: AlertTriangle, color: "text-neon-red" },
  column_added: { icon: ShieldCheck, color: "text-neon-green" },
  column_type_changed: { icon: Info, color: "text-yellow-400" },
  table_added: { icon: Table2, color: "text-neon-green" },
  table_removed: { icon: Table2, color: "text-neon-red" },
  nullable_changed: { icon: Info, color: "text-yellow-400" },
  primary_key_changed: { icon: AlertTriangle, color: "text-neon-red" },
};

function ChangeDetail({ detail, type }) {
  if (!detail) return null;
  if (type === "column_removed")
    return (
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-neon-red line-through opacity-60">{detail.column}</span>
        <span className="text-slate-500 text-xs">{detail.old_type}</span>
        <span className="bg-red-900/40 border border-red-700/50 text-red-400 text-xs px-2 py-0.5 rounded">REMOVED</span>
      </div>
    );
  if (type === "column_added")
    return (
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-neon-green">+ {detail.column}</span>
        <span className="text-slate-500 text-xs">{detail.new_type}</span>
        <span className="bg-green-900/40 border border-green-700/50 text-neon-green text-xs px-2 py-0.5 rounded">ADDED</span>
      </div>
    );
  if (type === "column_type_changed")
    return (
      <div className="flex items-center gap-3 font-mono text-sm flex-wrap">
        <span className="text-white">{detail.column}</span>
        <span className="text-red-400 line-through text-xs">{detail.old_type}</span>
        <span className="text-slate-400">→</span>
        <span className="text-neon-green text-xs">{detail.new_type}</span>
      </div>
    );
  return (
    <div className="code-block text-xs">{JSON.stringify(detail, null, 2)}</div>
  );
}

function ChangeCard({ c }) {
  const meta = CHANGE_ICONS[c.type] || { icon: Info, color: "text-slate-400" };
  const Icon = meta.icon;

  return (
    <div className="bg-navy-800 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-700/40 bg-navy-900/50">
        <Icon size={14} className={meta.color} />
        <span className="font-mono font-bold text-neon-blue">{c.table}</span>
        <span className="text-slate-500 text-xs font-mono bg-slate-800 px-2 py-0.5 rounded">
          {c.type?.replace(/_/g, " ")}
        </span>
        {c.classification && <ClassBadge classification={c.classification} />}
        {c.risk && <RiskBadge risk={c.risk} />}
      </div>

      <div className="p-5 space-y-4">
        {/* Change detail */}
        <div className="bg-navy-900 border border-slate-700/40 rounded-lg px-4 py-3">
          <ChangeDetail detail={c.detail} type={c.type} />
        </div>

        {/* Impact + Mitigation side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-xs text-red-400 uppercase tracking-wider font-semibold">Impact</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{c.impact || "—"}</p>
          </div>
          <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck size={12} className="text-neon-green" />
              <span className="text-xs text-neon-green uppercase tracking-wider font-semibold">Mitigation</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{c.mitigation || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DriftReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDriftReports()
      .then((r) => setReports(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center h-40 items-center">
        <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5 w-full">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Drift <span className="text-neon-red">Reports</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">All detected schema drift events with AI analysis.</p>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center py-16">
          <FileWarning size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No drift reports yet. Run a scan to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/reports/${r.id}`)}
              className="card border border-slate-700/50 hover:border-neon-red/30 cursor-pointer transition group w-full"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                    <FileWarning size={14} className="text-neon-red" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{r.db_alias}</p>
                    <p className="text-slate-500 text-xs font-mono">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge risk={r.overall_risk} />
                  <span className="text-slate-400 text-xs">{r.total_changes} changes</span>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300 transition" />
                </div>
              </div>
              {r.summary && (
                <p className="text-slate-500 text-xs mt-2 line-clamp-2">{r.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DriftReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDriftReport(id)
      .then((r) => setReport(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center h-40 items-center">
        <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!report)
    return <div className="card text-center py-10 text-slate-400">Report not found.</div>;

  const analysis = report.llm_analysis || {};
  const diff = report.raw_diff || {};
  const changes = analysis.changes?.length > 0 ? analysis.changes : (diff.changes || []);

  // Group changes by table
  const byTable = changes.reduce((acc, c) => {
    if (!acc[c.table]) acc[c.table] = [];
    acc[c.table].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-5 w-full">
      <button
        onClick={() => navigate("/reports")}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={14} /> Back to Reports
      </button>

      {/* Header */}
      <div className="w-full bg-navy-800 border border-neon-red/20 rounded-xl p-5 glow-red">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-mono mb-1">Report #{report.id}</p>
            <p className="text-2xl font-bold text-white">{report.db_alias}</p>
            <p className="text-slate-500 text-xs mt-1">{new Date(report.created_at).toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RiskBadge risk={report.overall_risk} />
            <span className="text-slate-400 text-xs font-mono">{diff.total_changes} change(s) detected</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {analysis.summary && (
        <div className="w-full bg-navy-800 border border-neon-purple/20 rounded-xl p-5">
          <p className="text-xs text-neon-purple uppercase tracking-wider font-semibold mb-2">
            🤖 AI Executive Summary
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Breaking", count: changes.filter(c => c.classification === "breaking").length, color: "text-neon-red" },
          { label: "Potentially Breaking", count: changes.filter(c => c.classification === "potentially_breaking").length, color: "text-yellow-400" },
          { label: "Additive", count: changes.filter(c => c.classification === "additive").length, color: "text-neon-green" },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-navy-800 border border-slate-700/50 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-slate-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Changes grouped by table */}
      {Object.entries(byTable).map(([table, tableChanges]) => (
        <div key={table} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-700/50" />
            <span className="text-neon-blue font-mono font-bold text-sm px-3">
              📋 {table}
            </span>
            <div className="h-px flex-1 bg-slate-700/50" />
          </div>
          {tableChanges.map((c, i) => (
            <ChangeCard key={i} c={c} />
          ))}
        </div>
      ))}
    </div>
  );
}
