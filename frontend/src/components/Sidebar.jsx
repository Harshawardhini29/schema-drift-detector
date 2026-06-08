import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Database, ScanSearch,
  FileWarning, History, Zap, LogOut
} from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/connect", icon: Database, label: "Databases" },
  { to: "/scan", icon: ScanSearch, label: "Run Scan" },
  { to: "/reports", icon: FileWarning, label: "Drift Reports" },
  { to: "/snapshots", icon: History, label: "Snapshots" },
];

export default function Sidebar() {
  const { user, logoutUser } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-flux-surface-container-low border-r border-flux-outline-variant/30 flex flex-col py-6 px-4 fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-sm bg-flux-primary-container/10 border border-flux-primary-container/30 flex items-center justify-center">
          <Zap size={16} className="text-flux-primary-container" />
        </div>
        <div>
          <p className="text-flux-on-surface font-bold text-sm leading-tight">SchemaDrift</p>
          <p className="text-flux-on-surface-variant text-xs font-medium">Detector</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 mb-6">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? "bg-flux-primary/5 text-flux-primary border-flux-primary/20"
                  : "text-flux-on-surface-variant border-transparent hover:text-flux-on-surface hover:bg-flux-surface-container-high/40"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      {user && (
        <div className="mt-auto mb-4 p-3 bg-white border border-flux-outline-variant/30 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-sm bg-flux-tertiary-container/20 border border-flux-tertiary-container/40 flex items-center justify-center text-flux-tertiary shrink-0 font-semibold font-mono text-sm uppercase">
              {user.username ? user.username.substring(0, 2) : "US"}
            </div>
            <div className="min-w-0">
              <p className="text-flux-on-surface text-xs font-semibold truncate leading-none mb-1">
                {user.username}
              </p>
              <p className="text-flux-on-surface-variant text-[10px] truncate leading-none">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium text-flux-on-surface-variant hover:text-flux-error hover:bg-flux-error/10 border border-transparent hover:border-flux-error/20 transition-all duration-200"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      )}

      {/* Bottom tag */}
      <div className={`px-2 pt-4 border-t border-flux-outline-variant/30 ${!user ? "mt-auto" : ""}`}>
        <p className="text-[10px] text-flux-on-surface-variant font-mono uppercase tracking-wider">AI-Powered</p>
        <p className="text-xs text-flux-tertiary font-mono">LangChain + OpenRouter</p>
      </div>
    </aside>
  );
}
