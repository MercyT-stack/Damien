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
  signUp: (email: string, pass: string, name: string, username?: string) => Promise<{ error: Error | null }>;
  signInGoogle: (customEmail?: string, username?: string, customName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateName: (newName: string) => Promise<boolean>;
  updateUsername: (newUsername: string) => Promise<boolean>;
  updateAvatar: (avatarId: string) => Promise<boolean>;
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
          const uMeta = session.user.user_metadata || {};
          const u: AuthSessionUser = {
            id: session.user.id,
            email: session.user.email || "",
            display_name: uMeta.display_name || session.user.email?.split("@")[0],
            name: uMeta.name || session.user.email?.split("@")[0],
            username: uMeta.username || session.user.email?.split("@")[0],
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

  const signUp = async (email: string, pass: string, name: string, username?: string) => {
    const res = await signUpUser(email, pass, name, username);
    if (!res.error && res.user) {
      setUser(res.user);
      const prof = await getUserProfile(res.user.id);
      setProfile(prof);
    }
    return { error: res.error };
  };

  const signInGoogle = async (customEmail?: string, username?: string, customName?: string) => {
    const res = await signInWithGoogle(customEmail, username, customName);
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

  const updateUsername = async (newUsername: string): Promise<boolean> => {
    if (!user) return false;
    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanUsername) return false;
    const res = await updateUserProfile(user.id, {
      username: cleanUsername,
    });
    if (res) {
      setProfile(res);
      setUser((prev) => (prev ? { ...prev, username: cleanUsername } : null));
      return true;
    }
    return false;
  };

  const updateAvatar = async (avatarId: string): Promise<boolean> => {
    if (!user) return false;
    const res = await updateUserProfile(user.id, {
      avatar_url: avatarId,
    });
    if (res) {
      setProfile(res);
      setUser((prev) => (prev ? { ...prev, avatar_id: avatarId } : null));
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
        updateUsername,
        updateAvatar,
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
