import { getSupabase, isSupabaseConfigured } from "./supabaseClient";
import { Profile } from "../types";

export interface AuthSessionUser {
  id: string;
  email: string;
  name?: string;
  display_name?: string;
}

const LOCAL_STORAGE_KEY_USER = "angel_local_auth_user";
const LOCAL_STORAGE_KEY_PROFILE = "angel_local_profile";

export async function signUpUser(email: string, password: string, displayName: string): Promise<{ user: AuthSessionUser | null; error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    // Local fallback when Supabase keys are not set
    const fallbackUser: AuthSessionUser = {
      id: "local-user-" + Date.now(),
      email,
      name: displayName,
      display_name: displayName,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(fallbackUser));
    const fallbackProfile: Profile = {
      id: fallbackUser.id,
      email,
      name: displayName,
      display_name: displayName,
      preferences: {
        theme: "system",
        language: "en",
        intelligence_level: "standard",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(fallbackProfile));
    return { user: fallbackUser, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        name: displayName,
      },
    },
  });

  if (error) {
    return { user: null, error };
  }

  if (data.user) {
    const user: AuthSessionUser = {
      id: data.user.id,
      email: data.user.email || email,
      display_name: displayName,
      name: displayName,
    };

    // Ensure profile row exists (gracefully handle if profiles table is not yet provisioned)
    try {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email || email,
        name: displayName,
        display_name: displayName,
        preferences: {
          theme: "system",
          language: "en",
          intelligence_level: "standard",
        },
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignore if table not yet migrated
    }

    return { user, error: null };
  }

  return { user: null, error: new Error("Account creation failed") };
}

export async function signInUser(email: string, password: string): Promise<{ user: AuthSessionUser | null; error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    // Local fallback mode
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
    if (stored) {
      const user = JSON.parse(stored);
      return { user, error: null };
    }
    const fallbackUser: AuthSessionUser = {
      id: "local-user-default",
      email,
      name: email.split("@")[0],
      display_name: email.split("@")[0],
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(fallbackUser));
    return { user: fallbackUser, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error };
  }

  if (data.user) {
    const user: AuthSessionUser = {
      id: data.user.id,
      email: data.user.email || email,
      display_name: data.user.user_metadata?.display_name || data.user.email?.split("@")[0],
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
    };
    return { user, error: null };
  }

  return { user: null, error: new Error("Sign in failed") };
}

export async function signInWithGoogle(customEmail?: string): Promise<{ user: AuthSessionUser | null; error: Error | null }> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { user: null, error };
    return { user: null, error: null }; // Redirects to Google OAuth
  }

  // Local Google OAuth simulation with user details
  const googleEmail = customEmail || "mercy.brown.titi@gmail.com";
  const displayName = googleEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const googleUser: AuthSessionUser = {
    id: "google-user-" + Date.now(),
    email: googleEmail,
    name: displayName,
    display_name: displayName,
  };

  localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(googleUser));
  const googleProfile: Profile = {
    id: googleUser.id,
    email: googleEmail,
    name: displayName,
    display_name: displayName,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
    preferences: {
      theme: "system",
      language: "en",
      intelligence_level: "standard",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(googleProfile));

  return { user: googleUser, error: null };
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
}

export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    // Default initial user for development when keys not set
    const defaultUser: AuthSessionUser = {
      id: "angel-dev-user",
      email: "user@angel.ai",
      name: "Angel User",
      display_name: "Angel User",
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(defaultUser));
    return defaultUser;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || "",
      display_name: session.user.user_metadata?.display_name || session.user.email?.split("@")[0],
      name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
    };
  }
  return null;
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    const defaultProfile: Profile = {
      id: userId,
      email: "user@angel.ai",
      name: "Angel User",
      display_name: "Angel User",
      preferences: {
        theme: "system",
        language: "en",
        intelligence_level: "standard",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(defaultProfile));
    return defaultProfile;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // If not found, return a base profile
    return {
      id: userId,
      email: "",
      name: "User",
      display_name: "User",
      preferences: {
        theme: "system",
        language: "en",
        intelligence_level: "standard",
      },
    };
  }

  return {
    id: data.id,
    email: data.email || "",
    name: data.name || "User",
    display_name: data.display_name || data.name || "User",
    avatar_url: data.avatar_url,
    preferences: data.preferences || {
      theme: "system",
      language: "en",
      intelligence_level: "standard",
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const current = await getUserProfile(userId);
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() } as Profile;
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(updated));
    return updated;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error || !data) {
    const current = await getUserProfile(userId);
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() } as Profile;
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(updated));
    return updated;
  }

  return data as Profile;
}
