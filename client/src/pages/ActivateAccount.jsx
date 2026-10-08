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
  User,
  Sparkles,
} from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function ActivateAccount() {
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

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("No activation token was provided in the link.");
      return;
    }

    api
      .get(`/auth/verify-activation-token?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setTokenValid(true);
        setUserInfo(res.data);
      })
      .catch((err) => {
        setTokenValid(false);
        setTokenError(
          err.response?.data?.message ||
            "This invitation link is invalid, has expired, or has already been used."
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
      setError("Please choose a secure password");
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
      await api.post("/auth/activate", {
        token,
        password,
      });

      setSuccess(true);
      toast.success("Account activated successfully! You can now log in.", {
        title: "Account Activated",
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to activate account. Please try again.";
      setError(msg);
      toast.error(msg, { title: "Activation Failed" });
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
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-500/12 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
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
            <Boxes size={13} className="text-orange-600" />
            <span>Account Activation</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Set Your Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
            Complete your account setup to start collaborating on 3D engineering projects
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 p-6 sm:p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-t-2xl sm:rounded-t-3xl" />

          {verifying ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-orange-600" />
              <p className="text-sm font-semibold text-slate-700">Verifying activation link…</p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Activation Link Invalid</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {tokenError}
                </p>
              </div>
              <div className="pt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  <ArrowRight size={14} className="rotate-180" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={30} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Account Activated!</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Your password has been securely set and your account is now ready for use.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Welcome Card */}
              {userInfo && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                    {userInfo.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{userInfo.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{userInfo.email}</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-700 border border-orange-500/20">
                    {userInfo.role === "admin" ? "PM" : "MEMBER"}
                  </span>
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
                  htmlFor="activate-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Create Password
                </label>
                <PasswordInput
                  id="activate-password"
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
                  htmlFor="activate-confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Confirm Password
                </label>
                <PasswordInput
                  id="activate-confirm-password"
                  required
                  minLength={6}
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
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
                    <span>Activating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Activate Account & Join</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
          <p className="text-xs text-slate-500">
            Already have an active account?{" "}
            <Link to="/login" className="text-orange-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
