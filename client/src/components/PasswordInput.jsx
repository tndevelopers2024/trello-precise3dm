import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  id,
  name = "password",
  autoComplete = "current-password",
  required = false,
  minLength,
  disabled = false,
  className = "",
  containerClassName = "",
  leftIcon = null,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      {leftIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <input
        type={showPassword ? "text" : "password"}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full rounded-xl bg-white border border-slate-200 ${
          leftIcon ? "pl-10" : "pl-3.5"
        } pr-11 py-2.5 sm:py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
        tabIndex={0}
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 focus:text-slate-800 focus:outline-none rounded-lg transition-colors touch-manipulation cursor-pointer"
      >
        {showPassword ? (
          <EyeOff size={16} className="shrink-0" />
        ) : (
          <Eye size={16} className="shrink-0" />
        )}
      </button>
    </div>
  );
}
