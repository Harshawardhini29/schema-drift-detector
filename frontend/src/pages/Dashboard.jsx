import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getDashboard } from "../api";
import { RiskBadge } from "../components/Badges";
import { ScanSearch, Database, AlertTriangle, ShieldCheck } from "lucide-react";

const RISK_COLORS = { high: "#ff4560", medium: "#fbbf24", low: "#00ff88", none: "#475569" };

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
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const riskDist = data?.risk_distribution
    ? Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const stats = [
    { label: "Total Scans", value: data?.total_scans ?? 0, icon: Database, color: "neon-blue", glow: "glow-blue" },
    { label: "Drift Events", value: data?.total_drifts ?? 0, icon: AlertTriangle, color: "neon-red", glow: "glow-red" },
    { label: "High Risk", value: data?.risk_distribution?.high ?? 0, icon: ScanSearch, color: "neon-red", glow: "glow-red" },
    { label: "Low Risk", value: data?.risk_distribution?.low ?? 0, icon: ShieldCheck, color: "neon-green", glow: "glow-green" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Schema Drift{" "}
          <span className="text-neon-green">Dashboard</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          AI-powered schema change monitoring & impact analysis
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, glow }) => (
          <div key={label} className={`card ${glow} border-slate-700/50`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
                <p className={`text-3xl font-bold mt-1 text-${color}`}>{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
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
                    fill={RISK_COLORS[entry.name] || "#475569"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0a1628", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {riskDist.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[e.name] }} />
                <span className="text-xs text-slate-400 capitalize">{e.name} ({e.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart placeholder */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Changes by Risk Level
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskDist} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#0a1628", border: "1px solid #334155", borderRadius: 8 }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {riskDist.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#475569"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <p className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
          Recent Drift Events
        </p>
        {(!data?.recent_reports || data.recent_reports.length === 0) ? (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">No drift events yet.</p>
            <button
              onClick={() => navigate("/scan")}
              className="mt-3 px-4 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm rounded-lg hover:bg-neon-green/20 transition"
            >
              Run First Scan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["#", "Database", "Risk", "Changes", "Detected"].map((h) => (
                    <th key={h} className="text-left pb-3 text-slate-400 text-xs uppercase tracking-wider font-medium pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.recent_reports.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-700/20 cursor-pointer transition"
                    onClick={() => navigate(`/reports/${r.id}`)}
                  >
                    <td className="py-3 pr-4 text-slate-500 font-mono text-xs">#{r.id}</td>
                    <td className="py-3 pr-4 text-white font-medium">{r.db_alias}</td>
                    <td className="py-3 pr-4"><RiskBadge risk={r.overall_risk} /></td>
                    <td className="py-3 pr-4 text-slate-300">{r.total_changes}</td>
                    <td className="py-3 text-slate-400 text-xs">
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
