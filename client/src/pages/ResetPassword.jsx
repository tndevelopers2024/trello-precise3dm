import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Boxes,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const toast = useToast();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isApproved, setIsApproved] = useState(true);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("No password reset token was provided in the link.");
      return;
    }

    api
      .get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setTokenValid(true);
        setUserInfo(res.data);
      })
      .catch((err) => {
        setTokenValid(false);
        setTokenError(
          err.response?.data?.message ||
            "This password reset link is invalid, has expired, or has already been used."
        );
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        token,
        password,
      });

      const approved = res.data?.isApproved !== false;
      setIsApproved(approved);
      setSuccess(true);
      toast.success(
        approved
          ? "Password reset successfully! You can now log in."
          : "Password updated. Account is pending Super Admin approval.",
        { title: "Password Updated" }
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password. Please try again.";
      setError(msg);
      toast.error(msg, { title: "Reset Failed" });
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

      <div className="relative z-10 w-full max-w-[460px]">
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
            <span>Password Recovery</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
            Choose a strong new password for your Precise3DM account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 p-6 sm:p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-t-2xl sm:rounded-t-3xl" />

          {verifying ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-orange-600" />
              <p className="text-sm font-semibold text-slate-700">Verifying reset link…</p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Link Invalid</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {tokenError}
                </p>
              </div>
              <div className="pt-3 flex flex-col gap-2">
                <Link
                  to="/forgot-password"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold rounded-xl py-2.5 px-4 transition-all text-center"
                >
                  Request a New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : success ? (
            isApproved ? (
              <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Your password has been changed successfully. You can now sign in with your new credentials.
                  </p>
                </div>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In Now</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                  <Clock size={30} />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                    Pending Approval
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Password Updated</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
                    Your password has been updated. However, your account remains pending Super Admin approval. You will be able to access the application once your account is approved.
                  </p>
                </div>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {userInfo && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-2">
                  <p className="text-xs text-slate-500">
                    Resetting password for: <strong className="text-slate-800 font-semibold">{userInfo.email}</strong>
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="font-semibold shrink-0">Error:</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  New Password
                </label>
                <PasswordInput
                  id="reset-new-password"
                  required
                  minLength={6}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  leftIcon={<KeyRound size={16} />}
                />
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Confirm New Password
                </label>
                <PasswordInput
                  id="reset-confirm-password"
                  required
                  minLength={6}
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  leftIcon={<ShieldCheck size={16} />}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full mt-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-orange-600"
          >
            Remembered your password? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
