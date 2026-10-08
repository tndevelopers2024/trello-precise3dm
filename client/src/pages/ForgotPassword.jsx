import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setSubmitted(true);
      toast.success("Password reset instructions sent to your email", {
        title: "Email Sent",
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to process request. Please try again.";
      setError(msg);
      toast.error(msg, { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center bg-gradient-to-b from-orange-50/50 via-slate-50 to-stone-100 px-4 sm:px-6 py-10 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* 3D Background Grid & Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#ea580c 1px, transparent 1px), radial-gradient(#ea580c 1px, #fafafa 1px)`,
            backgroundSize: `24px 24px`,
            backgroundPosition: `0 0, 12px 12px`,
          }}
        />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-500/12 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
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
                className="h-10 sm:h-11 w-auto max-w-[210px] object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-700 border border-orange-500/20 mb-2">
            <KeyRound size={13} className="text-orange-600" />
            <span>Account Recovery</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
            Enter your email address to receive a secure password reset link
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 p-6 sm:p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-t-2xl sm:rounded-t-3xl" />

          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={30} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Check Your Inbox</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  If an account exists for <strong className="font-semibold">{email}</strong>, you will receive an email with instructions to reset your password.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left text-xs text-amber-900">
                <strong>Note:</strong> The password reset link is valid for 1 hour and single-use for your security.
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl py-3 px-4 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Sign In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setError("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 cursor-pointer"
                >
                  Didn't receive email? Try again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="font-semibold shrink-0">Error:</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail size={16} />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@precise3dm.com"
                    className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50 transition-all shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full mt-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending Reset Link…</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
