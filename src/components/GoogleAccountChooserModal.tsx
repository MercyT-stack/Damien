import React, { useState } from "react";
import { User, Plus, X, ArrowRight, Loader2 } from "lucide-react";
import { SavedGoogleAccount } from "../services/authService";

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SavedGoogleAccount[];
  onSelectAccount: (acc: SavedGoogleAccount) => void;
  onAddNewAccount: (email: string, name: string) => void;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSelectAccount,
  onAddNewAccount,
}) => {
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanEmail = newEmail.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid Google account email.");
      return;
    }
    const derivedName = newName.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    onAddNewAccount(cleanEmail, derivedName);
  };

  return (
    <div
      id="google-account-chooser-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="google-account-chooser-card"
        className="relative w-full max-w-[420px] rounded-3xl bg-[#111113] border border-neutral-800 p-6 sm:p-7 shadow-2xl shadow-cyan-950/20 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="btn-close-google-chooser"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md mb-2.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          <h3 className="text-lg font-bold text-white">Choose an account</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            to continue to <span className="text-cyan-400 font-semibold">ANGEL</span>
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {!isAddingNew ? (
          <div className="space-y-2">
            {/* List of previously used Google accounts */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {accounts.map((acc, index) => (
                <button
                  key={acc.email || index}
                  id={`btn-google-account-${index}`}
                  type="button"
                  onClick={() => onSelectAccount(acc)}
                  className="w-full p-3 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {acc.name?.charAt(0).toUpperCase() || acc.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {acc.name || acc.email.split("@")[0]}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 font-medium">
                    Select
                  </span>
                </button>
              ))}
            </div>

            {/* Add another Google account option */}
            <button
              id="btn-google-add-another-account"
              type="button"
              onClick={() => {
                setIsAddingNew(true);
                setErrorMsg(null);
              }}
              className="w-full p-3 mt-1 rounded-2xl bg-neutral-950/80 hover:bg-neutral-850 border border-dashed border-neutral-700 hover:border-cyan-500/70 flex items-center gap-3 text-neutral-300 hover:text-white transition group"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-850 flex items-center justify-center text-neutral-400 group-hover:text-cyan-400 group-hover:bg-neutral-800 shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold">
                Use another Google account
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateNew} className="space-y-3 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Google Email Address
              </label>
              <input
                id="input-new-google-email"
                type="email"
                required
                autoFocus
                placeholder="name@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Full Name (Optional)
              </label>
              <input
                id="input-new-google-name"
                type="text"
                placeholder="e.g. Alex Morgan"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
              >
                Back
              </button>
              <button
                id="btn-submit-new-google-account"
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Continue with Google</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
