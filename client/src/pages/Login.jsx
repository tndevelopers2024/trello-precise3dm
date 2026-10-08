import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Boxes,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRoleFill, setActiveRoleFill] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back to Precise3DM!", { title: "Signed In" });
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't sign in. Please verify your credentials.";
      setError(msg);
      toast.error(msg, { title: "Sign in failed" });
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role, credEmail, credPass, label) => {
    setEmail(credEmail);
    setPassword(credPass);
    setError("");
    setActiveRoleFill(role);
    toast.info(`Loaded ${label} credentials`);
  };

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center bg-gradient-to-b from-orange-50/50 via-slate-50 to-stone-100 px-4 sm:px-6 py-10 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Precision 3D Background Decorative Grid & Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle CAD / 3D Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#ea580c 1px, transparent 1px), radial-gradient(#ea580c 1px, #fafafa 1px)`,
            backgroundSize: `24px 24px`,
            backgroundPosition: `0 0, 12px 12px`,
          }}
        />

        {/* Ambient Orange & Amber Light Spheres */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-500/12 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
          {/* Logo Container with Ambient Glow & Precision Border */}
          <div className="relative mb-4 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 opacity-20 blur-sm group-hover:opacity-35 transition-opacity" />
            <div className="relative bg-white border border-orange-100 shadow-md rounded-2xl p-3.5 px-6 flex items-center justify-center">
              <img
                src="/precise-logo.png"
                alt="precise3dm"
                className="h-10 sm:h-11 w-auto max-w-[210px] object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-700 border border-orange-500/20 mb-2">
            <Boxes size={13} className="text-orange-600 animate-pulse" />
            <span>3D Project Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Sign in to precise3dm
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
            Manage projects, 3D engineering deliverables, and team tasks in real-time
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 p-6 sm:p-8 relative overflow-hidden">
          {/* Top Brand Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 text-xs sm:text-sm text-rose-700 bg-rose-50/90 border border-rose-200 rounded-xl animate-in fade-in duration-150">
              <span className="font-semibold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3.5 py-2.5 sm:py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50 transition-all shadow-sm"
                  placeholder="you@precise3dm.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>
              </div>
              <PasswordInput
                id="login-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock size={16} />}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-orange-500" />
                Quick Test Logins
              </span>
              <span className="text-[10px] text-orange-700 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full font-medium">
                1-Click Autofill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Project Manager Pill */}
              <button
                type="button"
                onClick={() =>
                  fillCredentials(
                    "admin",
                    "admin@workspace.com",
                    "password123",
                    "Project Manager (Admin)"
                  )
                }
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all group touch-manipulation cursor-pointer ${
                  activeRoleFill === "admin"
                    ? "bg-orange-50/90 border-orange-400 ring-2 ring-orange-500/20"
                    : "bg-slate-50/80 hover:bg-orange-50/50 border-slate-200/90 hover:border-orange-300"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-orange-600 flex items-center gap-1.5">
                    <Shield size={13} className="text-orange-500" />
                    Project Manager
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-700 font-mono font-bold">
                    ADMIN
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono truncate w-full">
                  admin@workspace.com
                </span>
              </button>

              {/* Employee Pill */}
              <button
                type="button"
                onClick={() =>
                  fillCredentials(
                    "member",
                    "member@workspace.com",
                    "password123",
                    "Site Engineer (Member)"
                  )
                }
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all group touch-manipulation cursor-pointer ${
                  activeRoleFill === "member"
                    ? "bg-orange-50/90 border-orange-400 ring-2 ring-orange-500/20"
                    : "bg-slate-50/80 hover:bg-orange-50/50 border-slate-200/90 hover:border-orange-300"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-orange-600 flex items-center gap-1.5">
                    <UserCheck size={13} className="text-amber-600" />
                    Employee
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-mono font-bold">
                    MEMBER
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono truncate w-full">
                  member@workspace.com
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Signup Link */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-xs sm:text-sm text-slate-600">
            Don't have an account yet?{" "}
            <Link
              to="/register"
              className="text-orange-600 font-bold hover:text-orange-700 hover:underline transition-colors ml-0.5"
            >
              Create an account
            </Link>
          </p>

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" /> Secure 3D Workspace
            </span>
            <span>•</span>
            <span>Real-time Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
