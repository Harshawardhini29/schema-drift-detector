import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 60000,
});

export const testConnection = (data) => api.post("/test-connection", data);
export const runScan = (data) => api.post("/scan", data);
export const runSqliteUploadScan = (formData) =>
  api.post("/scan/sqlite-upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getDashboard = () => api.get("/dashboard");
export const getSnapshots = (db_alias) =>
  api.get("/snapshots", { params: db_alias ? { db_alias } : {} });
export const getSnapshot = (id) => api.get(`/snapshots/${id}`);
export const getDriftReports = (db_alias) =>
  api.get("/drift-reports", { params: db_alias ? { db_alias } : {} });
export const getDriftReport = (id) => api.get(`/drift-reports/${id}`);
