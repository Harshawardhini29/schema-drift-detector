import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDriftReports, getDriftReport } from "../api";
import { RiskBadge, ClassBadge } from "../components/Badges";
import {
  FileWarning, ArrowLeft, ChevronRight,
  AlertTriangle, ShieldCheck, Info, Table2,
} from "lucide-react";

const CHANGE_ICONS = {
  column_removed: { icon: AlertTriangle, color: "text-flux-error" },
  column_added: { icon: ShieldCheck, color: "text-flux-secondary" },
  column_type_changed: { icon: Info, color: "text-flux-tertiary" },
  table_added: { icon: Table2, color: "text-flux-secondary" },
  table_removed: { icon: Table2, color: "text-flux-error" },
  nullable_changed: { icon: Info, color: "text-flux-tertiary" },
  primary_key_changed: { icon: AlertTriangle, color: "text-flux-error" },
};

function ChangeDetail({ detail, type }) {
  if (!detail) return null;
  if (type === "column_removed")
    return (
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-flux-error line-through opacity-60">{detail.column}</span>
        <span className="text-flux-on-surface-variant text-xs">{detail.old_type}</span>
        <span className="bg-flux-error/10 border border-flux-error/20 text-flux-error text-xs px-2 py-0.5 rounded-sm font-semibold">REMOVED</span>
      </div>
    );
  if (type === "column_added")
    return (
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-flux-secondary font-bold">+ {detail.column}</span>
        <span className="text-flux-on-surface-variant text-xs">{detail.new_type}</span>
        <span className="bg-flux-secondary/10 border border-flux-secondary/20 text-flux-secondary text-xs px-2 py-0.5 rounded-sm font-semibold">ADDED</span>
      </div>
    );
  if (type === "column_type_changed")
    return (
      <div className="flex items-center gap-3 font-mono text-sm flex-wrap">
        <span className="text-flux-on-surface font-semibold">{detail.column}</span>
        <span className="text-flux-error line-through text-xs">{detail.old_type}</span>
        <span className="text-flux-on-surface-variant">→</span>
        <span className="text-flux-secondary text-xs">{detail.new_type}</span>
      </div>
    );
  return (
    <div className="code-block text-xs">{JSON.stringify(detail, null, 2)}</div>
  );
}

function ChangeCard({ c }) {
  const meta = CHANGE_ICONS[c.type] || { icon: Info, color: "text-flux-on-surface-variant" };
  const Icon = meta.icon;

  return (
    <div className="bg-white border border-flux-outline-variant/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-flux-outline-variant/20 bg-flux-surface-container-low">
        <Icon size={14} className={meta.color} />
        <span className="font-mono font-bold text-flux-secondary">{c.table}</span>
        <span className="text-flux-on-surface-variant text-xs font-mono bg-white border border-flux-outline-variant/30 px-2 py-0.5 rounded-sm">
          {c.type?.replace(/_/g, " ")}
        </span>
        {c.classification && <ClassBadge classification={c.classification} />}
        {c.risk && <RiskBadge risk={c.risk} />}
      </div>

      <div className="p-5 space-y-4">
        {/* Change detail */}
        <div className="bg-flux-surface border border-flux-outline-variant/20 rounded-sm px-4 py-3">
          <ChangeDetail detail={c.detail} type={c.type} />
        </div>

        {/* Impact + Mitigation side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-flux-error/5 border border-flux-error/20 rounded p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} className="text-flux-error" />
              <span className="text-xs text-flux-error uppercase tracking-wider font-semibold">Impact</span>
            </div>
            <p className="text-flux-on-surface text-sm leading-relaxed">{c.impact || "—"}</p>
          </div>
          <div className="bg-flux-secondary/5 border border-flux-secondary/20 rounded p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck size={12} className="text-flux-secondary" />
              <span className="text-xs text-flux-secondary uppercase tracking-wider font-semibold">Mitigation</span>
            </div>
            <p className="text-flux-on-surface text-sm leading-relaxed">{c.mitigation || "—"}</p>
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
        <div className="w-6 h-6 border-2 border-flux-error border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5 w-full max-w-[1440px] mx-auto">
      <div>
        <h1 className="text-headline-md lg:text-headline-lg font-bold text-flux-on-surface">
          Drift <span className="text-flux-error">Reports</span>
        </h1>
        <p className="text-flux-on-surface-variant text-body-md mt-1">All detected schema drift events with AI analysis.</p>
      </div>

      {reports.length === 0 ? (
        <div className="card bg-white border border-flux-outline-variant/30 text-center py-16">
          <FileWarning size={40} className="text-flux-outline mx-auto mb-3" />
          <p className="text-flux-on-surface-variant">No drift reports yet. Run a scan to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/reports/${r.id}`)}
              className="card bg-white border border-flux-outline-variant/30 hover:border-flux-error/30 cursor-pointer transition group w-full"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-flux-error/10 border border-flux-error/20 flex items-center justify-center">
                    <FileWarning size={14} className="text-flux-error" />
                  </div>
                  <div>
                    <p className="text-flux-on-surface font-semibold">{r.db_alias}</p>
                    <p className="text-flux-on-surface-variant text-xs font-mono">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge risk={r.overall_risk} />
                  <span className="text-flux-on-surface-variant text-xs font-semibold">{r.total_changes} changes</span>
                  <ChevronRight size={14} className="text-flux-outline group-hover:text-flux-on-surface transition" />
                </div>
              </div>
              {r.summary && (
                <p className="text-flux-on-surface-variant text-xs mt-2 line-clamp-2">{r.summary}</p>
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
        <div className="w-6 h-6 border-2 border-flux-error border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!report)
    return <div className="card bg-white border border-flux-outline-variant/30 text-center py-10 text-flux-on-surface-variant">Report not found.</div>;

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
    <div className="space-y-5 w-full max-w-[1440px] mx-auto">
      <button
        onClick={() => navigate("/reports")}
        className="flex items-center gap-1.5 text-sm text-flux-on-surface-variant hover:text-flux-on-surface transition font-semibold"
      >
        <ArrowLeft size={14} /> Back to Reports
      </button>

      {/* Header */}
      <div className="w-full bg-white border border-flux-error/20 rounded-lg p-5 ring-2 ring-flux-error/5 shadow-float">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-flux-on-surface-variant text-xs font-mono mb-1">Report #{report.id}</p>
            <p className="text-2xl font-bold text-flux-on-surface">{report.db_alias}</p>
            <p className="text-flux-on-surface-variant text-xs mt-1">{new Date(report.created_at).toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RiskBadge risk={report.overall_risk} />
            <span className="text-flux-on-surface-variant text-xs font-mono">{diff.total_changes} change(s) detected</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {analysis.summary && (
        <div className="w-full bg-white border border-flux-tertiary-container/30 rounded-lg p-5 shadow-sm">
          <p className="text-xs text-flux-tertiary uppercase tracking-wider font-semibold mb-2">
            🤖 AI Executive Summary
          </p>
          <p className="text-flux-on-surface text-sm leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Breaking", count: changes.filter(c => c.classification === "breaking").length, color: "text-flux-error" },
          { label: "Potentially Breaking", count: changes.filter(c => c.classification === "potentially_breaking").length, color: "text-flux-tertiary" },
          { label: "Additive", count: changes.filter(c => c.classification === "additive").length, color: "text-flux-secondary" },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white border border-flux-outline-variant/30 rounded-lg p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-flux-on-surface-variant text-xs font-semibold mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Changes grouped by table */}
      {Object.entries(byTable).map(([table, tableChanges]) => (
        <div key={table} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-flux-outline-variant/20" />
            <span className="text-flux-secondary font-mono font-bold text-sm px-3">
              📋 {table}
            </span>
            <div className="h-px flex-1 bg-flux-outline-variant/20" />
          </div>
          {tableChanges.map((c, i) => (
            <ChangeCard key={i} c={c} />
          ))}
        </div>
      ))}
    </div>
  );
}
