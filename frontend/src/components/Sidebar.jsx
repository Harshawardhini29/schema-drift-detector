import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Database, ScanSearch,
  FileWarning, History, Zap,
} from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/connect", icon: Database, label: "Connect DB" },
  { to: "/scan", icon: ScanSearch, label: "Run Scan" },
  { to: "/reports", icon: FileWarning, label: "Drift Reports" },
  { to: "/snapshots", icon: History, label: "Snapshots" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-navy-800 border-r border-slate-700/40 flex flex-col py-6 px-4 fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-neon-green/20 border border-neon-green/40 flex items-center justify-center glow-green">
          <Zap size={16} className="text-neon-green" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">SchemaDrift</p>
          <p className="text-slate-500 text-xs">Detector</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/30 glow-green"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/30"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom tag */}
      <div className="mt-auto px-2 pt-6 border-t border-slate-700/40">
        <p className="text-xs text-slate-500 font-mono">AI-Powered</p>
        <p className="text-xs text-neon-purple font-mono">LangChain + OpenRouter</p>
      </div>
    </aside>
  );
}
