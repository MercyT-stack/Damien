import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthSessionUser, getCurrentUser, getUserProfile, signInUser, signInWithGoogle, signOutUser, signUpUser, updateUserProfile } from "../services/authService";
import { getSupabase, isSupabaseConfigured } from "../services/supabaseClient";
import { Profile } from "../types";

interface AuthContextType {
  user: AuthSessionUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isSupabaseLive: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error: Error | null }>;
  signInGoogle: (customEmail?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateName: (newName: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isSupabaseLive = isSupabaseConfigured();

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const prof = await getUserProfile(currentUser.id);
        setProfile(prof);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();

    const supabase = getSupabase();
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const u: AuthSessionUser = {
            id: session.user.id,
            email: session.user.email || "",
            display_name: session.user.user_metadata?.display_name || session.user.email?.split("@")[0],
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
          };
          setUser(u);
          const prof = await getUserProfile(u.id);
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    const res = await signInUser(email, pass);
    if (!res.error && res.user) {
      setUser(res.user);
      const prof = await getUserProfile(res.user.id);
      setProfile(prof);
    }
    return { error: res.error };
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const res = await signUpUser(email, pass, name);
    if (!res.error && res.user) {
      setUser(res.user);
      const prof = await getUserProfile(res.user.id);
      setProfile(prof);
    }
    return { error: res.error };
  };

  const signInGoogle = async (customEmail?: string) => {
    const res = await signInWithGoogle(customEmail);
    if (!res.error && res.user) {
      setUser(res.user);
      const prof = await getUserProfile(res.user.id);
      setProfile(prof);
    }
    return { error: res.error };
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
  };

  const updateName = async (newName: string): Promise<boolean> => {
    if (!user) return false;
    const res = await updateUserProfile(user.id, {
      display_name: newName,
      name: newName,
    });
    if (res) {
      setProfile(res);
      setUser((prev) => (prev ? { ...prev, display_name: newName, name: newName } : null));
      return true;
    }
    return false;
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.id);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSupabaseLive,
        signIn,
        signUp,
        signInGoogle,
        signOut,
        updateName,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
