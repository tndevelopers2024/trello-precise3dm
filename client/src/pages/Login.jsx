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
  Layers,
  Cpu,
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
    <div className="min-h-[100dvh] relative flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/40 px-3 sm:px-6 lg:px-8 py-6 sm:py-10 overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Ambient Effects & 3D Engineering Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle CAD Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#ea580c 1px, transparent 1px), radial-gradient(#ea580c 1px, #f8fafc 1px)`,
            backgroundSize: `24px 24px`,
            backgroundPosition: `0 0, 12px 12px`,
          }}
        />

        {/* Ambient Light Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-400/10 blur-[110px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[24rem] rounded-full bg-orange-200/20 blur-[130px] pointer-events-none" />
      </div>

      {/* Main Showcase Card */}
      <div className="relative z-10 w-full max-w-5xl rounded-2xl sm:rounded-3xl lg:rounded-[32px] bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/50 backdrop-blur-xl overflow-hidden">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[580px]">
          {/* ================= LEFT HERO PANEL (DESKTOP) ================= */}
          <div className="hidden lg:flex lg:col-span-5 relative p-8 sm:p-10 lg:p-12 flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-50/90 via-orange-50/20 to-slate-100/90 border-r border-slate-200/80">
            {/* Ambient Graphic Elements */}
            <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-orange-300/15 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-44 h-44 rounded-full bg-amber-300/10 blur-xl pointer-events-none" />

            {/* Geometric Iso-Grid Overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #ea580c 1px, transparent 1px), linear-gradient(to bottom, #ea580c 1px, transparent 1px)`,
                backgroundSize: `32px 32px`,
              }}
            />

            {/* Top Tag & Hero Typography */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
                <Boxes size={13} className="text-orange-500 animate-pulse" />
                <span>3D Project Workspace</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 tracking-tight leading-[1.15]">
                Sign in to precise3dm
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm">
                Manage projects, 3D engineering deliverables, and team tasks in real-time.
              </p>

              {/* Feature Highlights */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300/60 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span>Secure 3D CAD & Deliverables Hub</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-orange-100 border border-orange-300/60 flex items-center justify-center text-orange-600 shrink-0">
                    <Layers size={13} />
                  </div>
                  <span>Real-time Workspace Sync & Task Boards</span>
                </div>
              </div>
            </div>

            {/* Bottom Presented By Pill Badge (Fixed Overlap & Sizing) */}
            <div className="relative z-10 mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200 shrink-0 max-w-[200px]">
                <span className="text-[11px] font-medium text-slate-500 shrink-0">presented by</span>
                <img
                  src="/precise-logo.png"
                  alt="precise3dm"
                  className="h-5 w-auto max-w-[100px] object-contain shrink-0"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono shrink-0">
                <Cpu size={13} className="text-orange-500" />
                <span>v2.0 Workspace</span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT FORM PANEL (DESKTOP + UNIFIED MOBILE) ================= */}
          <div className="lg:col-span-7 p-5 sm:p-8 lg:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* Mobile-Only Clean Top Branding Header (Matches Mobile Reference) */}
              <div className="lg:hidden mb-5 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200 mb-3">
                  <span className="text-[10px] font-medium text-slate-500 shrink-0">presented by</span>
                  <img
                    src="/precise-logo.png"
                    alt="precise3dm"
                    className="h-4 w-auto max-w-[95px] object-contain shrink-0"
                  />
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-600 border border-orange-500/20 mb-1.5">
                  <Boxes size={12} className="text-orange-500" />
                  <span>3D Project Workspace</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Sign in to precise3dm
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                  Manage projects, 3D engineering deliverables, and team tasks in real-time
                </p>
              </div>

              {/* Form Title on Desktop */}
              <div className="hidden lg:block mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Sign in
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Enter your workspace credentials to continue
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 p-3 text-xs sm:text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in duration-150">
                  <span className="font-semibold text-rose-600 shrink-0">Error:</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
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
                      className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 pl-10 pr-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50 transition-all shadow-xs"
                      placeholder="you@precise3dm.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      tabIndex={0}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
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
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400 focus:!ring-orange-500/30 focus:!border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:from-orange-800 active:to-amber-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-orange-500" />
                    Quick Test Logins
                  </span>
                  <span className="text-[10px] text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                    1-Click Autofill
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
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
                    className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all group touch-manipulation cursor-pointer ${
                      activeRoleFill === "admin"
                        ? "bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/30"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-0.5 sm:mb-1">
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-orange-600 flex items-center gap-1.5">
                        <Shield size={13} className="text-orange-500" />
                        Project Manager
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 font-mono font-bold">
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
                    className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all group touch-manipulation cursor-pointer ${
                      activeRoleFill === "member"
                        ? "bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/30"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-0.5 sm:mb-1">
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-orange-600 flex items-center gap-1.5">
                        <UserCheck size={13} className="text-amber-500" />
                        Employee
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono font-bold">
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

            {/* Bottom Signup Link & Footer Note */}
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-200 text-center space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm text-slate-600">
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="text-orange-600 font-bold hover:text-orange-700 hover:underline transition-colors ml-0.5"
                >
                  Create an account
                </Link>
              </p>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Secure 3D Workspace
                </span>
                <span>•</span>
                <span>Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
