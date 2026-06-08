import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { loginUser, registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await loginUser(username, password);
      } else {
        if (!email) {
          setError("Email is required for registration.");
          setIsLoading(false);
          return;
        }
        result = await registerUser(username, email, password);
      }

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-flux-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background visual texture */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-flux-primary-container/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-flux-tertiary-container/5 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white border border-flux-outline-variant/30 rounded-lg p-8 shadow-float relative z-10">
        
        {/* Header/Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded bg-flux-primary-container/10 border border-flux-primary-container/20 flex items-center justify-center mb-4">
            <Zap size={24} className="text-flux-primary-container" />
          </div>
          <h2 className="text-2xl font-bold text-flux-on-surface tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-flux-on-surface-variant text-sm mt-1.5 text-center">
            {isLogin ? "Sign in to monitor database schema changes" : "Get started with schema drift detection"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded bg-flux-error/10 border border-flux-error/30 text-flux-error text-sm flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-flux-on-surface-variant uppercase tracking-wider mb-2">
              Username or Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-flux-outline">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="developer"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded text-flux-on-surface placeholder-slate-400 focus:outline-none focus:border-flux-primary-container focus:ring-2 focus:ring-flux-primary-container/10 transition-all duration-200"
              />
            </div>
          </div>

          {/* Email (Signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-flux-on-surface-variant uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-flux-outline">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded text-flux-on-surface placeholder-slate-400 focus:outline-none focus:border-flux-primary-container focus:ring-2 focus:ring-flux-primary-container/10 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-flux-on-surface-variant uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-flux-outline">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded text-flux-on-surface placeholder-slate-400 focus:outline-none focus:border-flux-primary-container focus:ring-2 focus:ring-flux-primary-container/10 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-flux-outline hover:text-flux-on-surface transition-colors duration-150"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-flux-primary-container text-white font-semibold rounded flex items-center justify-center gap-2 hover:bg-flux-primary-container/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Sign Up"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer/Toggle */}
        <div className="mt-8 text-center border-t border-flux-outline-variant/20 pt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setUsername("");
              setEmail("");
              setPassword("");
            }}
            className="text-sm text-flux-on-surface-variant hover:text-flux-primary-container transition-colors duration-200 font-medium"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}
