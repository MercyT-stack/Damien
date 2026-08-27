import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AngelLogo } from "./AngelLogo";
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInGoogle, isSupabaseLive } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await signInGoogle();
      if (error) {
        setErrorMsg(error.message || "Failed to sign in with Google.");
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in error occurred.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (mode === "signup" && !displayName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || "Failed to sign in. Please verify your credentials.");
        } else {
          onClose();
        }
      } else {
        const { error } = await signUp(email.trim(), password, displayName.trim());
        if (error) {
          setErrorMsg(error.message || "Failed to create account.");
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 md:p-8 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <AngelLogo size="md" />
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mt-3">
            {mode === "signin" ? "Sign in to ANGEL" : "Create your ANGEL Account"}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {isSupabaseLive
              ? "Secure cloud persistence & authentication"
              : "Experience Angel with Google or email login"}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign-in Primary Button */}
        <button
          id="btn-auth-google"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-semibold text-xs border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-2.5 shadow-xs transition-all disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
          <span className="bg-white dark:bg-neutral-900 px-2.5 text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
            or continue with email
          </span>
          <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
        </div>

        {/* Tab switch */}
        <div className="flex p-1 mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "signin"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Your Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-neutral-400" />
                <input
                  id="auth-input-name"
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-neutral-400" />
              <input
                id="auth-input-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-neutral-400" />
              <input
                id="auth-input-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            id="auth-btn-submit"
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In with Email" : "Create Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
