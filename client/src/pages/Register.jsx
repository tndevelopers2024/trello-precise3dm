import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  Mail,
  User,
  Boxes,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Shield,
  Layers,
  Cpu,
  MailCheck,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", role: "member" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submittedRole, setSubmittedRole] = useState("member");

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid work email address");
      return;
    }

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const name = form.name.trim();
      const role = form.role;

      await register(name, email, role);
      setSubmittedEmail(email);
      setSubmittedRole(role);
      setSubmittedSuccess(true);
      toast.success(
        "Your account has been created successfully. Please check your email to activate your account and set your password.",
        { title: "Account Created" }
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't create your account. Please try again.";
      setError(msg);
      toast.error(msg, { title: "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedSuccess(false);
    setError("");
    setForm({ name: "", email: "", role: "member" });
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
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-400/10 blur-[110px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[24rem] rounded-full bg-orange-200/20 blur-[130px] pointer-events-none" />
      </div>

      {/* Main Showcase Card */}
      <div className="relative z-10 w-full max-w-5xl rounded-2xl sm:rounded-3xl lg:rounded-[32px] bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/50 backdrop-blur-xl overflow-hidden">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[620px]">
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
                <span>Join Workspace</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 tracking-tight leading-[1.15]">
                Create your account
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm">
                Join precise3dm to collaborate on 3D engineering deliverables, tasks, and project timelines.
              </p>

              {/* Feature Highlights */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300/60 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span>Instant Access to Project Workspaces</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-orange-100 border border-orange-300/60 flex items-center justify-center text-orange-600 shrink-0">
                    <Layers size={13} />
                  </div>
                  <span>Real-time Task Boards & Sprint Sync</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-sky-100 border border-sky-300/60 flex items-center justify-center text-sky-600 shrink-0">
                    <Shield size={13} />
                  </div>
                  <span>Secure Email-based Account Activation</span>
                </div>
              </div>
            </div>

            {/* Bottom Presented By Pill Badge */}
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
              {/* Mobile-Only Clean Top Branding Header */}
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
                  <span>Join Workspace</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {submittedSuccess ? "Check your email" : "Create your account"}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                  {submittedSuccess
                    ? "Activate your account to get started"
                    : "Get started with precise3dm engineering project workspace"}
                </p>
              </div>

              {submittedSuccess ? (
                /* ================= SUCCESS CONFIRMATION STATE ================= */
                <div className="py-3 sm:py-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  {/* Top Success Badge */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                        <MailCheck size={36} className="text-emerald-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 size={14} />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      <Sparkles size={12} className="text-emerald-600" />
                      <span>Account Created Successfully</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Check Your Email
                    </h2>
                  </div>

                  {/* Clear Success Message Prompt */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-slate-50 border border-orange-200/80 shadow-xs space-y-3">
                    <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed text-center">
                      Your account has been created successfully. Please check your email to activate your account and set your password.
                    </p>

                    <div className="pt-2 border-t border-orange-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2 truncate max-w-full">
                        <Mail size={14} className="text-orange-600 shrink-0" />
                        <span className="font-mono font-medium text-slate-800 truncate">{submittedEmail}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 shrink-0">
                        {submittedRole === "admin" ? "PROJECT MANAGER" : "MEMBER"}
                      </span>
                    </div>
                  </div>

                  {/* Security & Approval Explanatory Note */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                    <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Shield size={14} className="text-orange-500" />
                      <span>Approval Workflow & Activation</span>
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                      We've sent an activation link to your email to set your password. After setting your password, your account will remain <strong>Pending Approval</strong> until a Super Admin approves it.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:from-orange-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 cursor-pointer"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300/80 text-slate-700 text-xs font-semibold rounded-xl py-2.5 px-4 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Register another account</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= REGISTRATION FORM STATE ================= */
                <>
                  {/* Form Title on Desktop */}
                  <div className="hidden lg:block mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Register
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Enter your details to create your workspace account
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
                        htmlFor="register-name"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <input
                          id="register-name"
                          type="text"
                          required
                          disabled={loading}
                          value={form.name}
                          onChange={update("name")}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 pl-10 pr-3.5 py-2.5 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="register-email"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                      >
                        Work Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                          <Mail size={16} />
                        </div>
                        <input
                          id="register-email"
                          type="email"
                          required
                          disabled={loading}
                          value={form.email}
                          onChange={update("email")}
                          placeholder="you@precise3dm.com"
                          className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 pl-10 pr-3.5 py-2.5 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Role Selector Tiles */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Workspace Role
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        {/* Member / Employee Option */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, role: "member" })}
                          disabled={loading}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            form.role === "member"
                              ? "bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/30 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-orange-300"
                          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <UserCheck
                                size={14}
                                className={form.role === "member" ? "text-orange-600" : "text-slate-400"}
                              />
                              Employee
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              MEMBER
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            Work on deliverables & task lists
                          </span>
                        </button>

                        {/* Admin / Project Manager Option */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, role: "admin" })}
                          disabled={loading}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            form.role === "admin"
                              ? "bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/30 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-orange-300"
                          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Shield
                                size={14}
                                className={form.role === "admin" ? "text-orange-600" : "text-slate-400"}
                              />
                              Project Manager
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                              ADMIN
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            Manage projects, boards & team
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:from-orange-800 active:to-amber-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-white" />
                          <span>Creating account…</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Bottom Sign In Link & Footer Note */}
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-200 text-center space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-orange-600 font-bold hover:text-orange-700 hover:underline transition-colors ml-0.5"
                >
                  Sign in
                </Link>
              </p>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Secure 3D Workspace
                </span>
                <span>•</span>
                <span>Email Activation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
