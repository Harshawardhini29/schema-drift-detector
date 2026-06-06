import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ConnectDB from "./pages/ConnectDB";
import Scan from "./pages/Scan";
import { DriftReports, DriftReportDetail } from "./pages/Reports";
import Snapshots from "./pages/Snapshots";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-navy-900">
        <Sidebar />
        <main className="ml-60 flex-1 p-8 w-full min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/connect" element={<ConnectDB />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/reports" element={<DriftReports />} />
            <Route path="/reports/:id" element={<DriftReportDetail />} />
            <Route path="/snapshots" element={<Snapshots />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
