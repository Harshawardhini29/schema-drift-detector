import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ConnectDB from "./pages/ConnectDB";
import Scan from "./pages/Scan";
import { DriftReports, DriftReportDetail } from "./pages/Reports";
import Snapshots from "./pages/Snapshots";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { runScan } from "./api";

function useAutoScan() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const connectionsKey = `db_connections_${user.email}`;

    const checkAndTriggerScans = async () => {
      const list = JSON.parse(localStorage.getItem(connectionsKey) || "[]");
      let updated = false;

      const newConnections = await Promise.all(
        list.map(async (db) => {
          if (!db.auto_take) return db;

          const intervalMs = (db.auto_take_interval || 60) * 60000;
          const lastRun = db.last_auto_take ? new Date(db.last_auto_take).getTime() : 0;
          const now = Date.now();

          if (now - lastRun >= intervalMs) {
            console.log(`[Auto-Scan] Triggering schema scan for database alias: ${db.db_alias}...`);
            try {
              await runScan({
                connection_string: db.connection_string,
                db_alias: db.db_alias,
                db_type: db.db_type,
              });
              console.log(`[Auto-Scan] Successfully completed scan for: ${db.db_alias}`);
              updated = true;
              return { ...db, last_auto_take: new Date(now).toISOString() };
            } catch (err) {
              console.error(`[Auto-Scan] Failed to execute scan for: ${db.db_alias}`, err);
              // Update timestamp to avoid spamming the logs/errors immediately on the next check
              return { ...db, last_auto_take: new Date(now).toISOString() };
            }
          }
          return db;
        })
      );

      if (updated) {
        localStorage.setItem(connectionsKey, JSON.stringify(newConnections));
        window.dispatchEvent(new Event("storage"));
      }
    };

    // Run initial check on render
    checkAndTriggerScans();

    // Check periodically every 30 seconds
    const intervalId = setInterval(checkAndTriggerScans, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function Layout() {
  // Activate automatic background scans while logged in
  useAutoScan();

  return (
    <div className="flex min-h-screen bg-flux-background">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 w-full min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Guest routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/connect" element={<ConnectDB />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/reports" element={<DriftReports />} />
            <Route path="/reports/:id" element={<DriftReportDetail />} />
            <Route path="/snapshots" element={<Snapshots />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
