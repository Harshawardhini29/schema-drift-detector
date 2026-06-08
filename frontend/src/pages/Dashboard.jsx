import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getDashboard } from "../api";
import { RiskBadge } from "../components/Badges";
import { ScanSearch, Database, AlertTriangle, ShieldCheck } from "lucide-react";

// Tonal compliance colors matching Luminous Flux (error, tertiary, secondary, neutral outline)
const RISK_COLORS = { 
  high: "#ba1a1a", 
  medium: "#661bc5", 
  low: "#006685", 
  none: "#737688",
  potentially_breaking: "#661bc5",
  breaking: "#ba1a1a",
  additive: "#006685"
};

const getColor = (name) => {
  if (!name) return "#737688";
  return RISK_COLORS[name.toLowerCase()] || "#737688";
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-flux-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const riskDist = data?.risk_distribution
    ? Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const stats = [
    { label: "Total Scans", value: data?.total_scans ?? 0, icon: Database, colorClass: "text-flux-secondary", bgClass: "bg-flux-secondary/10 border-flux-secondary/20" },
    { label: "Drift Events", value: data?.total_drifts ?? 0, icon: AlertTriangle, colorClass: "text-flux-error", bgClass: "bg-flux-error/10 border-flux-error/20" },
    { label: "High Risk", value: data?.risk_distribution?.high ?? 0, icon: ScanSearch, colorClass: "text-flux-error", bgClass: "bg-flux-error/10 border-flux-error/20" },
    { label: "Low Risk", value: data?.risk_distribution?.low ?? 0, icon: ShieldCheck, colorClass: "text-flux-secondary", bgClass: "bg-flux-secondary/10 border-flux-secondary/20" },
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-headline-md lg:text-headline-lg font-bold text-flux-on-surface">
          Schema Drift{" "}
          <span className="text-flux-primary-container">Dashboard</span>
        </h1>
        <p className="text-flux-on-surface-variant text-body-md mt-1">
          AI-powered schema change monitoring & impact analysis
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, colorClass, bgClass }) => (
          <div key={label} className="card bg-white border border-flux-outline-variant/30 transition duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-flux-on-surface-variant text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${colorClass}`}>{value}</p>
              </div>
              <div className={`w-9 h-9 rounded border flex items-center justify-center ${bgClass}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="card bg-white border border-flux-outline-variant/30">
          <p className="text-label-md font-semibold text-flux-on-surface-variant mb-4 uppercase tracking-wider">
            Risk Distribution
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {riskDist.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={getColor(entry.name)}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  background: "#ffffff", 
                  border: "1px solid #c3c5d9", 
                  borderRadius: 8,
                  boxShadow: "0 4px 12px 0 rgba(19, 27, 46, 0.05)" 
                }}
                labelStyle={{ color: "#434656", fontFamily: "Geist, sans-serif" }}
                itemStyle={{ color: "#131b2e", fontFamily: "Geist, sans-serif" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {riskDist.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: getColor(e.name) }} />
                <span className="text-xs text-flux-on-surface-variant capitalize">{e.name?.replace(/_/g, " ")} ({e.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="card bg-white border border-flux-outline-variant/30">
          <p className="text-label-md font-semibold text-flux-on-surface-variant mb-4 uppercase tracking-wider">
            Changes by Risk Level
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskDist} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7ff" />
              <XAxis dataKey="name" tick={{ fill: "#434656", fontSize: 12, fontFamily: "Geist, sans-serif" }} />
              <YAxis tick={{ fill: "#434656", fontSize: 12, fontFamily: "Geist, sans-serif" }} />
              <Tooltip
                contentStyle={{ 
                  background: "#ffffff", 
                  border: "1px solid #c3c5d9", 
                  borderRadius: 8,
                  boxShadow: "0 4px 12px 0 rgba(19, 27, 46, 0.05)" 
                }}
                itemStyle={{ color: "#131b2e", fontFamily: "Geist, sans-serif" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {riskDist.map((entry) => (
                  <Cell key={entry.name} fill={getColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card bg-white border border-flux-outline-variant/30">
        <p className="text-label-md font-semibold text-flux-on-surface-variant mb-4 uppercase tracking-wider">
          Recent Drift Events
        </p>
        {(!data?.recent_reports || data.recent_reports.length === 0) ? (
          <div className="text-center py-10">
            <p className="text-flux-on-surface-variant text-sm">No drift events yet.</p>
            <button
              onClick={() => navigate("/scan")}
              className="mt-3 px-4 py-2 bg-flux-primary-container/10 border border-flux-primary-container/30 text-flux-primary-container text-sm rounded font-semibold hover:bg-flux-primary-container/20 transition"
            >
              Run First Scan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-flux-outline-variant/20 rounded-md">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-flux-outline-variant/30 bg-flux-surface-container-low text-left">
                  {["#", "Database", "Risk", "Changes", "Detected"].map((h) => (
                    <th key={h} className="pb-3 pt-3 pl-4 text-flux-on-surface-variant text-xs uppercase tracking-wider font-semibold pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-flux-outline-variant/20">
                {data.recent_reports.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer transition hover:bg-flux-surface-container-low/50 odd:bg-white even:bg-flux-surface-container-low/20"
                    onClick={() => navigate(`/reports/${r.id}`)}
                  >
                    <td className="py-3 pl-4 pr-4 text-flux-on-surface-variant font-mono text-xs">#{r.id}</td>
                    <td className="py-3 pl-4 pr-4 text-flux-on-surface font-semibold">{r.db_alias}</td>
                    <td className="py-3 pl-4 pr-4"><RiskBadge risk={r.overall_risk} /></td>
                    <td className="py-3 pl-4 pr-4 text-flux-on-surface font-medium">{r.total_changes}</td>
                    <td className="py-3 pl-4 text-flux-on-surface-variant text-xs pr-4">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
