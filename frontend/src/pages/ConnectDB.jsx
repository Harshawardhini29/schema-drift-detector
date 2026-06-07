import { useState, useEffect } from "react";
import { 
  Database, Eye, EyeOff, CheckCircle, Loader, 
  AlertTriangle, RefreshCw, Plus, Edit3, Trash2, 
  ChevronLeft, Play, Server
} from "lucide-react";
import { testConnection } from "../api";
import { useNavigate } from "react-router-dom";

const PG_DEFAULTS = {
  host: "localhost", port: "5432", dbname: "", user: "", password: "", alias: "",
};

const parsePostgresUri = (uri, alias) => {
  const defaults = { host: "localhost", port: "5432", dbname: "", user: "", password: "", alias };
  if (!uri || (!uri.startsWith("postgresql://") && !uri.startsWith("postgres://"))) return defaults;
  try {
    const prefix = uri.startsWith("postgresql://") ? "postgresql://" : "postgres://";
    const content = uri.slice(prefix.length); // remove prefix
    const atIdx = content.lastIndexOf("@");
    if (atIdx === -1) return defaults;
    const creds = content.slice(0, atIdx);
    const hostDb = content.slice(atIdx + 1);

    const colonIdx = creds.indexOf(":");
    let user = creds;
    let password = "";
    if (colonIdx !== -1) {
      user = creds.slice(0, colonIdx);
      password = decodeURIComponent(creds.slice(colonIdx + 1));
    }

    const slashIdx = hostDb.indexOf("/");
    let hostPort = hostDb;
    let dbname = "";
    if (slashIdx !== -1) {
      hostPort = hostDb.slice(0, slashIdx);
      dbname = hostDb.slice(slashIdx + 1);
    }

    const hostColonIdx = hostPort.indexOf(":");
    let host = hostPort;
    let port = "5432";
    if (hostColonIdx !== -1) {
      host = hostPort.slice(0, hostColonIdx);
      port = hostPort.slice(hostColonIdx + 1);
    }

    return { host, port, dbname, user, password, alias };
  } catch {
    return defaults;
  }
};

export default function ConnectDB() {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState([]);
  const [view, setView] = useState("list"); // "list" | "form"
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [form, setForm] = useState(PG_DEFAULTS);
  const [connectionType, setConnectionType] = useState("postgresql");
  const [hostedUri, setHostedUri] = useState("");
  const [hostedAlias, setHostedAlias] = useState("");
  const [sqlitePath, setSqlitePath] = useState("");
  const [sqliteAlias, setSqliteAlias] = useState("");
  
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Card specific actions
  const [testingCardId, setTestingCardId] = useState(null);
  const [cardTestResults, setCardTestResults] = useState({});
  const [visibleUrls, setVisibleUrls] = useState({});

  const toggleUrlVisibility = (id) => {
    setVisibleUrls((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadDatabases = () => {
    const list = JSON.parse(localStorage.getItem("db_connections") || "[]");
    setDatabases(list);
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const getActiveDbId = () => {
    const active = JSON.parse(localStorage.getItem("db_connection") || "{}");
    if (!active.connection_string) return null;
    const found = databases.find(
      (db) => db.connection_string === active.connection_string && db.db_alias === active.db_alias
    );
    return found ? found.id : null;
  };

  const getConnectionString = () => {
    if (connectionType === "sqlite") return sqlitePath ? `sqlite:///${sqlitePath}` : "";
    if (connectionType === "postgresql_hosted") return hostedUri;
    const { user, password, host, port, dbname } = form;
    const encodedPassword = encodeURIComponent(password);
    return `postgresql://${user}:${encodedPassword}@${host}:${port}/${dbname}`;
  };

  const handleAddClick = () => {
    setEditingId(null);
    setForm(PG_DEFAULTS);
    setConnectionType("postgresql");
    setHostedUri("");
    setHostedAlias("");
    setSqlitePath("");
    setSqliteAlias("");
    setTestResult(null);
    setView("form");
  };

  const handleEditClick = (db) => {
    setEditingId(db.id);
    setTestResult(null);
    setConnectionType(db.connection_type || "postgresql");
    
    if (db.connection_type === "sqlite") {
      setSqliteAlias(db.db_alias || "");
      let path = db.connection_string || "";
      if (path.startsWith("sqlite:///")) {
        path = path.slice(10);
      }
      setSqlitePath(path);
    } else if (db.connection_type === "postgresql_hosted") {
      setHostedAlias(db.db_alias || "");
      setHostedUri(db.connection_string || "");
    } else {
      setForm(parsePostgresUri(db.connection_string || "", db.db_alias || ""));
    }
    setView("form");
  };

  const handleDeleteClick = (id) => {
    const list = JSON.parse(localStorage.getItem("db_connections") || "[]");
    const updated = list.filter((db) => db.id !== id);
    localStorage.setItem("db_connections", JSON.stringify(updated));
    setDatabases(updated);

    const active = JSON.parse(localStorage.getItem("db_connection") || "{}");
    const foundDeleted = list.find((db) => db.id === id);
    if (foundDeleted && active.connection_string === foundDeleted.connection_string && active.db_alias === foundDeleted.db_alias) {
      if (updated.length > 0) {
        localStorage.setItem("db_connection", JSON.stringify({
          connection_string: updated[0].connection_string,
          db_alias: updated[0].db_alias,
          db_type: updated[0].db_type,
          connection_type: updated[0].connection_type,
        }));
      } else {
        localStorage.removeItem("db_connection");
      }
    }
  };

  const handleSetActive = (db) => {
    localStorage.setItem("db_connection", JSON.stringify({
      connection_string: db.connection_string,
      db_alias: db.db_alias,
      db_type: db.db_type,
      connection_type: db.connection_type,
    }));
    loadDatabases();
  };

  const handleScanClick = (db) => {
    handleSetActive(db);
    navigate("/scan");
  };

  const handleTestCardConnection = async (db) => {
    setTestingCardId(db.id);
    setCardTestResults((prev) => ({ ...prev, [db.id]: null }));
    try {
      const res = await testConnection({ connection_string: db.connection_string });
      setCardTestResults((prev) => ({
        ...prev,
        [db.id]: { success: true, message: res.data.message || "Connected!" }
      }));
    } catch (err) {
      setCardTestResults((prev) => ({
        ...prev,
        [db.id]: {
          success: false,
          message: err.response?.data?.detail || "Connection failed."
        }
      }));
    } finally {
      setTestingCardId(null);
    }
  };

  const handleSave = () => {
    const cs = getConnectionString();
    let alias = "";
    if (connectionType === "sqlite") alias = sqliteAlias;
    else if (connectionType === "postgresql_hosted") alias = hostedAlias;
    else alias = form.alias;

    if (!cs || !alias) {
      setTestResult({ success: false, message: "Please fill in all connection details and alias." });
      return;
    }

    const list = JSON.parse(localStorage.getItem("db_connections") || "[]");
    let updated;
    const dbType = connectionType === "sqlite" ? "sqlite" : "postgresql";

    if (editingId) {
      updated = list.map((db) => {
        if (db.id === editingId) {
          return {
            ...db,
            connection_string: cs,
            db_alias: alias,
            db_type: dbType,
            connection_type: connectionType,
          };
        }
        return db;
      });
    } else {
      const newDb = {
        id: Date.now().toString(),
        connection_string: cs,
        db_alias: alias,
        db_type: dbType,
        connection_type: connectionType,
        created_at: new Date().toISOString(),
      };
      updated = [...list, newDb];
    }

    localStorage.setItem("db_connections", JSON.stringify(updated));
    setDatabases(updated);

    const active = JSON.parse(localStorage.getItem("db_connection") || "{}");
    const isEditingActive = editingId && list.find(d => d.id === editingId)?.connection_string === active.connection_string;
    if (!active.connection_string || isEditingActive || !editingId) {
      localStorage.setItem("db_connection", JSON.stringify({
        connection_string: cs,
        db_alias: alias,
        db_type: dbType,
        connection_type: connectionType,
      }));
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setView("list");
    }, 1000);
  };

  const handleTestConnection = async () => {
    const cs = getConnectionString();
    if (!cs) {
      setTestResult({ success: false, message: "Please enter connection details before testing." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection({ connection_string: cs });
      setTestResult({ success: true, message: res.data.message || "Connection successful!" });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.detail || "Connection failed. Please check your credentials or database status."
      });
    } finally {
      setTesting(false);
    }
  };

  const activeId = getActiveDbId();

  return (
    <div className="w-full space-y-6">
      {view === "list" ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Database <span className="text-neon-green">Connections</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage your connected databases for schema monitoring.
              </p>
            </div>
            <button
              onClick={handleAddClick}
              className="py-2.5 px-4 bg-neon-green/10 border border-neon-green/40 text-neon-green font-semibold rounded-lg hover:bg-neon-green/20 transition glow-green flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Add Connection
            </button>
          </div>

          {databases.length === 0 ? (
            <div className="card text-center py-20">
              <Server size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No databases connected yet.</p>
              <button
                onClick={handleAddClick}
                className="py-2 px-4 bg-neon-green/15 border border-neon-green/50 text-neon-green font-semibold rounded-lg hover:bg-neon-green/25 transition text-sm inline-flex items-center gap-1.5"
              >
                <Plus size={16} /> Connect Your First Database
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {databases.map((db) => {
                const isActive = db.id === activeId;
                const cardResult = cardTestResults[db.id];
                return (
                  <div 
                    key={db.id} 
                    className={`card border transition duration-200 flex flex-col justify-between p-5 ${
                      isActive 
                        ? "border-neon-green/40 bg-navy-800/80 glow-green" 
                        : "border-slate-700/50 hover:border-slate-600 bg-navy-850"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <h3 className="text-white font-bold text-lg truncate flex-1">{db.db_alias}</h3>
                        {isActive && (
                          <span className="flex items-center gap-1.5 text-xs text-neon-green font-semibold bg-neon-green/5 border border-neon-green/20 px-2 py-0.5 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" /> Active
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold tracking-wider mb-2 ${
                          db.connection_type === "sqlite" 
                            ? "bg-neon-purple/10 border border-neon-purple/30 text-neon-purple"
                            : db.connection_type === "postgresql_hosted"
                            ? "bg-neon-blue/10 border border-neon-blue/30 text-neon-blue"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        }`}>
                          {db.connection_type === "sqlite" 
                            ? "SQLite"
                            : db.connection_type === "postgresql_hosted"
                            ? "PostgreSQL (Hosted)"
                            : "PostgreSQL"}
                        </span>
                        
                        <div className="relative">
                          <p className="text-slate-400 text-xs font-mono break-all bg-navy-900/60 p-2.5 pr-10 rounded border border-slate-800/50 min-h-[38px] flex items-center">
                            {visibleUrls[db.id] ? db.connection_string : "••••••••••••••••••••••••••••••••"}
                          </p>
                          <button
                            onClick={() => toggleUrlVisibility(db.id)}
                            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                            title={visibleUrls[db.id] ? "Hide Connection String" : "Show Connection String"}
                          >
                            {visibleUrls[db.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {/* Connection Test feedback specifically for this card */}
                      {cardResult && (
                        <div className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs ${
                          cardResult.success 
                            ? "bg-green-950/20 border-green-800/40 text-neon-green" 
                            : "bg-red-950/20 border-red-800/40 text-red-400"
                        }`}>
                          {cardResult.success ? <CheckCircle size={12} /> : <AlertTriangle size={12} className="shrink-0" />}
                          <span className="truncate flex-1">{cardResult.message}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
                        <button
                          onClick={() => handleScanClick(db)}
                          title="Scan Schema"
                          className="p-2 bg-neon-purple/10 border border-neon-purple/40 text-neon-purple hover:bg-neon-purple/20 transition rounded-lg"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                        
                        <button
                          onClick={() => handleTestCardConnection(db)}
                          disabled={testingCardId === db.id}
                          title="Test Connection"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 transition rounded-lg border border-slate-700 disabled:opacity-50"
                        >
                          {testingCardId === db.id ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                        </button>

                        <button
                          onClick={() => handleEditClick(db)}
                          title="Edit"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 transition rounded-lg border border-slate-700"
                        >
                          <Edit3 size={14} />
                        </button>

                        {!isActive && (
                          <button
                            onClick={() => handleSetActive(db)}
                            className="text-xs px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 transition rounded-lg border border-slate-700"
                          >
                            Set Active
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteClick(db.id)}
                          title="Delete"
                          className="p-2 bg-red-950/20 hover:bg-red-900/20 border border-red-900/40 text-red-400 transition rounded-lg ml-auto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-xl space-y-6">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition"
          >
            <ChevronLeft size={16} /> Back to Connections
          </button>

          <div>
            <h1 className="text-2xl font-bold text-white">
              {editingId ? "Edit" : "Connect"} <span className="text-neon-green">Database</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure your database connection details below.
            </p>
          </div>

          {/* DB Type Toggle */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "postgresql", label: "PostgreSQL" },
              { id: "postgresql_hosted", label: "PostgreSQL (Hosted)" },
              { id: "sqlite", label: "SQLite" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setConnectionType(t.id);
                  setTestResult(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  connectionType === t.id
                    ? "bg-neon-green/10 border-neon-green/40 text-neon-green glow-green"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="card space-y-4">
            {connectionType === "postgresql" && (
              <>
                {[
                  { key: "alias", label: "Connection Alias", placeholder: "e.g. production_db" },
                  { key: "host", label: "Host", placeholder: "localhost" },
                  { key: "port", label: "Port", placeholder: "5432" },
                  { key: "dbname", label: "Database Name", placeholder: "mydb" },
                  { key: "user", label: "Username", placeholder: "postgres" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                      {label}
                    </label>
                    <input
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-green/50 transition"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-green/50 transition pr-10"
                    />
                    <button
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {connectionType === "postgresql_hosted" && (
              <>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                    Connection Alias
                  </label>
                  <input
                    value={hostedAlias}
                    onChange={(e) => setHostedAlias(e.target.value)}
                    placeholder="e.g. production_db"
                    className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-green/50 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                    Connection String / URI
                  </label>
                  <input
                    value={hostedUri}
                    onChange={(e) => setHostedUri(e.target.value)}
                    placeholder="postgresql://user:password@host:5432/mydb"
                    className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-green/50 transition font-mono"
                  />
                  <p className="text-slate-500 text-xs mt-1.5">
                    Enter the full hosted database connection URI.
                    e.g. Render/Supabase → <span className="text-neon-green font-mono">postgresql://user:pass@host:5432/dbname</span>
                  </p>
                </div>
              </>
            )}

            {connectionType === "sqlite" && (
              <>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                    Connection Alias
                  </label>
                  <input
                    value={sqliteAlias}
                    onChange={(e) => setSqliteAlias(e.target.value)}
                    placeholder="e.g. my_sqlite_db"
                    className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-green/50 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                    SQLite File Path
                  </label>
                  <input
                    value={sqlitePath}
                    onChange={(e) => setSqlitePath(e.target.value)}
                    placeholder="C:/Users/you/project/db.sqlite3"
                    className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-green/50 transition font-mono"
                  />
                  <p className="text-slate-500 text-xs mt-1.5">
                    Enter the full path to your .db file on this PC.
                    e.g. Django → <span className="text-neon-green font-mono">C:/myproject/db.sqlite3</span>
                  </p>
                </div>
              </>
            )}

            {/* Connection string preview */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                Connection String Preview
              </label>
              <div className="code-block text-xs break-all">{getConnectionString() || "—"}</div>
            </div>

            {/* Test Connection Results */}
            {testResult && (
              <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm ${
                testResult.success 
                  ? "bg-green-950/30 border-green-800/50 text-neon-green" 
                  : "bg-red-950/30 border-red-800/50 text-red-400"
              }`}>
                {testResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} className="shrink-0" />}
                <span className="break-all">{testResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full py-3 bg-neon-purple/10 border border-neon-purple/40 text-neon-purple font-semibold rounded-lg hover:bg-neon-purple/20 transition glow-purple flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testing ? (
                  <><Loader size={16} className="animate-spin" /> Testing...</>
                ) : (
                  <><RefreshCw size={16} /> Test Connection</>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={testing}
                className="w-full py-3 bg-neon-green/10 border border-neon-green/40 text-neon-green font-semibold rounded-lg hover:bg-neon-green/20 transition glow-green flex items-center justify-center gap-2"
              >
                {saved ? (
                  <><CheckCircle size={16} /> Saved!</>
                ) : (
                  <><Database size={16} /> Save Connection</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
