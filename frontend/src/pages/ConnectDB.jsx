import { useState } from "react";
import { Database, Eye, EyeOff, CheckCircle } from "lucide-react";

const PG_DEFAULTS = {
  host: "localhost", port: "5432", dbname: "", user: "", password: "", alias: "",
};

export default function ConnectDB() {
  const [form, setForm] = useState(PG_DEFAULTS);
  const [dbType, setDbType] = useState("postgresql");
  const [sqlitePath, setSqlitePath] = useState("");
  const [sqliteAlias, setSqliteAlias] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  const getConnectionString = () => {
    if (dbType === "sqlite") return sqlitePath ? `sqlite:///${sqlitePath}` : "";
    const { user, password, host, port, dbname } = form;
    const encodedPassword = encodeURIComponent(password);
    return `postgresql://${user}:${encodedPassword}@${host}:${port}/${dbname}`;
  };

  const handleSave = () => {
    const cs = getConnectionString();
    const alias = dbType === "sqlite" ? sqliteAlias : form.alias;
    if (!cs || !alias) return;
    localStorage.setItem("db_connection", JSON.stringify({
      connection_string: cs,
      db_alias: alias,
      db_type: dbType,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Connect <span className="text-neon-green">Database</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure your database connection for schema monitoring.
        </p>
      </div>

      {/* DB Type Toggle */}
      <div className="flex gap-2">
        {["postgresql", "sqlite"].map((t) => (
          <button
            key={t}
            onClick={() => setDbType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              dbType === t
                ? "bg-neon-green/10 border-neon-green/40 text-neon-green glow-green"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t === "postgresql" ? "PostgreSQL" : "SQLite"}
          </button>
        ))}
      </div>

      <div className="card space-y-4">
        {dbType === "postgresql" ? (
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
        ) : (
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
                className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neon-green/50 transition font-mono text-xs"
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

        <button
          onClick={handleSave}
          className="w-full py-3 bg-neon-green/10 border border-neon-green/40 text-neon-green font-semibold rounded-lg hover:bg-neon-green/20 transition glow-green flex items-center justify-center gap-2"
        >
          {saved ? (
            <><CheckCircle size={16} /> Saved!</>
          ) : (
            <><Database size={16} /> Save Connection</>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Connection details are saved in your browser. Go to{" "}
        <span className="text-neon-green">Run Scan</span> to start monitoring.
      </p>
    </div>
  );
}
