import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, User, Boxes, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import Select from "../components/ui/Select.jsx";

const ROLE_OPTIONS = [
  { value: "member", label: "Employee / Engineer", sublabel: "Work on tasks and update progress" },
  { value: "admin", label: "Project Manager", sublabel: "Create projects, manage boards and members" },
];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success("Account created successfully!", { title: "Welcome to Precise3DM" });
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't create your account.";
      setError(msg);
      toast.error(msg, { title: "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center bg-gradient-to-b from-orange-50/50 via-slate-50 to-stone-100 px-4 sm:px-6 py-10 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Precision 3D Background Decorative Grid & Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#ea580c 1px, transparent 1px), radial-gradient(#ea580c 1px, #fafafa 1px)`,
            backgroundSize: `24px 24px`,
            backgroundPosition: `0 0, 12px 12px`,
          }}
        />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-orange-500/12 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
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
            <span>Join Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
            Get started with precise3dm project tracking
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 text-xs sm:text-sm text-rose-700 bg-rose-50/90 border border-rose-200 rounded-xl animate-in fade-in duration-150">
              <span className="font-semibold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <User size={16} />
                </div>
                <input
                  required
                  value={form.name}
                  onChange={update("name")}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3.5 py-2.5 sm:py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@precise3dm.com"
                  className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3.5 py-2.5 sm:py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <PasswordInput
                required
                minLength={6}
                value={form.password}
                onChange={update("password")}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                leftIcon={<Lock size={16} />}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Workspace Role
              </label>
              <Select
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
                placeholder="Select your role"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:from-orange-700 active:to-orange-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
        </div>

        {/* Bottom Sign In Link */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-xs sm:text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-orange-600 font-bold hover:text-orange-700 hover:underline transition-colors ml-0.5"
            >
              Sign in
            </Link>
          </p>

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" /> Secure 3D Workspace
            </span>
            <span>•</span>
            <span>Instant Setup</span>
          </div>
        </div>
      </div>
    </div>
  );
}
