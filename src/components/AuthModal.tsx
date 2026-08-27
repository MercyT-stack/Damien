import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getLastGoogleAccount, LastGoogleAccount } from "../services/authService";
import { AngelLogo } from "./AngelLogo";
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  AtSign, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  UserPlus, 
  Users,
  ChevronRight
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInGoogle, isSupabaseLive } = useAuth();
  const [mode, setMode] = useState<"options" | "signin_email" | "signup_email" | "google_custom">("options");
  
  // Last used Google account on device
  const [recentGoogle, setRecentGoogle] = useState<LastGoogleAccount>(getLastGoogleAccount());

  // Email form state
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  
  // Custom Google sign in state
  const [googleEmail, setGoogleEmail] = useState<string>("");
  const [googleUsername, setGoogleUsername] = useState<string>("");
  const [googleName, setGoogleName] = useState<string>("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const recent = getLastGoogleAccount();
      setRecentGoogle(recent);
      setGoogleEmail("");
      setGoogleUsername("");
      setGoogleName("");
      setMode("options");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Fast-track: Continue with recent Google account (e.g. Mercy)
  const handleQuickRecentGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    try {
      const targetEmail = recentGoogle?.email || "mercy.brown.titi@gmail.com";
      const targetUsername = recentGoogle?.username || "mercy";
      const targetName = recentGoogle?.name || "Mercy Brown";

      const { error } = await signInGoogle(targetEmail, targetUsername, targetName);
      if (error) {
        setErrorMsg(error.message || "Failed to sign in with Google.");
      } else {
        setSuccessMsg(`Welcome back, ${targetUsername}! Angel is active.`);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in error occurred.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Open custom Google account form
  const handleOpenCustomGoogle = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleEmail("");
    setGoogleUsername("");
    setGoogleName("");
    setMode("google_custom");
  };

  // Submit custom Google account
  const handleConfirmCustomGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = googleEmail.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid Google email address.");
      return;
    }

    const defaultUserFromEmail = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanUsername = (googleUsername.trim() || defaultUserFromEmail).toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanUsername) {
      setErrorMsg("Please provide a username for Angel to address you.");
      return;
    }

    setIsGoogleLoading(true);
    try {
      const { error } = await signInGoogle(cleanEmail, cleanUsername, googleName.trim() || undefined);
      if (error) {
        setErrorMsg(error.message || "Failed to sign in with Google.");
      } else {
        setSuccessMsg(`Welcome, ${cleanUsername}! Angel is ready.`);
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in error occurred.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (mode === "signup_email") {
      if (!displayName.trim()) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      if (!username.trim()) {
        setErrorMsg("Please enter a username so Angel knows how to address you.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "signin_email") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || "Failed to sign in. Please verify your credentials.");
        } else {
          setSuccessMsg("Signed in successfully!");
          setTimeout(() => {
            onClose();
          }, 500);
        }
      } else {
        const cleanUser = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "");
        const { error } = await signUp(email.trim(), password, displayName.trim(), cleanUser);
        if (error) {
          setErrorMsg(error.message || "Failed to create account.");
        } else {
          setSuccessMsg(`Welcome, ${cleanUser}! Account created.`);
          setTimeout(() => {
            onClose();
          }, 500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecentShortName = () => {
    if (recentGoogle?.name) {
      return recentGoogle.name.split(" ")[0];
    }
    if (recentGoogle?.username) {
      return recentGoogle.username;
    }
    return "Mercy";
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-[440px] rounded-3xl bg-[#111113] border border-neutral-800/90 shadow-2xl shadow-cyan-950/20 p-6 sm:p-8 animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

        {/* Close Button */}
        <button
          id="btn-auth-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800/80 transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6 pt-1">
          <div className="p-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-inner mb-3">
            <AngelLogo size="md" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === "google_custom"
              ? "Sign in with another Google account"
              : mode === "signin_email"
              ? "Sign in with Email"
              : mode === "signup_email"
              ? "Create your ANGEL Account"
              : "Sign in to ANGEL"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            {mode === "google_custom"
              ? "Enter your Google email and username for Angel to address you."
              : mode === "options"
              ? "Choose your preferred Google account or sign in with email."
              : isSupabaseLive
              ? "Secure persistence & intelligent companion sync"
              : "Experience Angel with personalized companion intelligence"}
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE 1: OPTIONS (Continue with Mercy + Sign in with another Google account + Email) */}
        {mode === "options" && (
          <div className="space-y-3">
            {/* Primary Option: Continue as Recent Account (e.g. Continue with Mercy) */}
            <button
              id="btn-auth-continue-recent-google"
              type="button"
              onClick={handleQuickRecentGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-100 font-semibold text-xs border border-neutral-700/80 hover:border-cyan-500/60 flex items-center justify-between shadow-md transition-all group active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    Continue with {getRecentShortName()}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {recentGoogle?.email || "mercy.brown.titi@gmail.com"}
                  </div>
                </div>
              </div>
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              )}
            </button>

            {/* Secondary Google Option: Sign in with another Google account */}
            <button
              id="btn-auth-another-google"
              type="button"
              onClick={handleOpenCustomGoogle}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 text-neutral-300 hover:text-white font-medium text-xs border border-neutral-800 hover:border-neutral-700 flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50"
            >
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>Or sign in with another Google account</span>
            </button>

            {/* Clean Divider Line */}
            <div className="relative flex items-center justify-center my-4 w-full">
              <div className="grow h-px bg-neutral-800/80" />
              <span className="shrink-0 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                OR CONTINUE WITH EMAIL
              </span>
              <div className="grow h-px bg-neutral-800/80" />
            </div>

            {/* Email Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-switch-email-signin"
                onClick={() => setMode("signin_email")}
                className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>Email Sign In</span>
              </button>
              <button
                type="button"
                id="btn-switch-email-signup"
                onClick={() => setMode("signup_email")}
                className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
                <span>Register</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: CUSTOM GOOGLE ACCOUNT INPUT */}
        {mode === "google_custom" && (
          <form onSubmit={handleConfirmCustomGoogleSignIn} className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                Google Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                <input
                  id="google-custom-input-email"
                  type="email"
                  required
                  autoFocus
                  placeholder="your.google.account@gmail.com"
                  value={googleEmail}
                  onChange={(e) => {
                    setGoogleEmail(e.target.value);
                    if (!googleUsername) {
                      setGoogleUsername(e.target.value.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, ""));
                    }
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-neutral-950/90 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5" />
                  Username (How Angel Addresses You)
                </label>
                <span className="text-[10px] text-neutral-500">Required</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-mono text-cyan-500">@</span>
                <input
                  id="google-custom-input-username"
                  type="text"
                  required
                  placeholder="e.g. alex, titilayo, sam"
                  value={googleUsername}
                  onChange={(e) => setGoogleUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-neutral-950/90 border border-cyan-500/50 text-cyan-200 placeholder:text-neutral-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 focus:outline-hidden transition"
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Angel will greet you as <span className="text-cyan-400 font-semibold">{googleUsername || "your username"}</span>.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                Display Name (Optional)
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                <input
                  id="google-custom-input-name"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-neutral-950/90 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-hidden transition"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("options")}
                className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition"
              >
                Back
              </button>
              <button
                id="btn-google-custom-submit"
                type="submit"
                disabled={isGoogleLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                ) : (
                  <>
                    <span>Sign In with this Google Account</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: EMAIL SIGN IN / REGISTER */}
        {(mode === "signin_email" || mode === "signup_email") && (
          <div className="space-y-4 animate-fadeIn">
            {/* Tab switch */}
            <div className="flex p-1 rounded-xl bg-neutral-950/80 border border-neutral-850">
              <button
                type="button"
                id="tab-auth-signin"
                onClick={() => {
                  setMode("signin_email");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === "signin_email"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-auth-signup"
                onClick={() => {
                  setMode("signup_email");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === "signup_email"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {mode === "signup_email" && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                      <input
                        id="auth-input-name"
                        type="text"
                        required
                        placeholder="e.g. Mercy Brown"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          if (!username) {
                            setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, ""));
                          }
                        }}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-neutral-950/90 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                        <AtSign className="w-3.5 h-3.5" />
                        Username (How Angel Addresses You)
                      </label>
                      <span className="text-[10px] text-neutral-500">Required</span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-mono text-cyan-500">@</span>
                      <input
                        id="auth-input-username"
                        type="text"
                        required
                        placeholder="e.g. mercy, titilayo, alex"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        className="w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl bg-neutral-950/90 border border-cyan-500/50 text-cyan-200 placeholder:text-neutral-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 focus:outline-hidden transition font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Angel will greet and address you by this username.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                  <input
                    id="auth-input-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-neutral-950/90 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                  <input
                    id="auth-input-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-neutral-950/90 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode("options")}
                  className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition"
                >
                  Back
                </button>
                <button
                  id="auth-btn-submit"
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  ) : (
                    <>
                      <span>{mode === "signin_email" ? "Sign In" : "Create Account"}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
