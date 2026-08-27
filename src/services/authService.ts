import { getSupabase, isSupabaseConfigured } from "./supabaseClient";
import { Profile } from "../types";

export interface AuthSessionUser {
  id: string;
  email: string;
  name?: string;
  display_name?: string;
  username?: string;
  avatar_id?: string;
}

const LOCAL_STORAGE_KEY_USER = "angel_local_auth_user";
const LOCAL_STORAGE_KEY_PROFILE = "angel_local_profile";
const LOCAL_STORAGE_KEY_MEMORY_PREFS = "angel_memory_preferences";

function syncUsernameToMemoryPrefs(username: string) {
  try {
    if (!username) return;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_MEMORY_PREFS);
    let prefs: Record<string, any> = {};
    if (stored) {
      prefs = JSON.parse(stored);
    }
    prefs.preferred_name = username.trim();
    localStorage.setItem(LOCAL_STORAGE_KEY_MEMORY_PREFS, JSON.stringify(prefs));
  } catch (err) {
    console.warn("Could not sync username to memory preferences:", err);
  }
}

export async function signUpUser(
  email: string,
  password: string,
  displayName: string,
  username?: string
): Promise<{ user: AuthSessionUser | null; error: Error | null }> {
  const chosenUsername = (username?.trim() || displayName.trim().toLowerCase().replace(/\s+/g, "_") || email.split("@")[0]).replace(/[^a-zA-Z0-9_-]/g, "");
  syncUsernameToMemoryPrefs(chosenUsername);

  const supabase = getSupabase();
  if (!supabase) {
    // Local fallback when Supabase keys are not set
    const fallbackUser: AuthSessionUser = {
      id: "local-user-" + Date.now(),
      email,
      name: displayName,
      display_name: displayName,
      username: chosenUsername,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(fallbackUser));
    const fallbackProfile: Profile = {
      id: fallbackUser.id,
      email,
      name: displayName,
      display_name: displayName,
      username: chosenUsername,
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
        username: chosenUsername,
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
      username: chosenUsername,
    };

    try {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email || email,
        name: displayName,
        display_name: displayName,
        username: chosenUsername,
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

    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
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
      try {
        const user = JSON.parse(stored);
        if (user.username) {
          syncUsernameToMemoryPrefs(user.username);
        }
        return { user, error: null };
      } catch {
        // Continue
      }
    }
    const derivedUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "");
    syncUsernameToMemoryPrefs(derivedUsername);
    const fallbackUser: AuthSessionUser = {
      id: "local-user-default",
      email,
      name: email.split("@")[0],
      display_name: email.split("@")[0],
      username: derivedUsername,
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
    const userMetadata = data.user.user_metadata || {};
    const uName = userMetadata.username || userMetadata.display_name?.toLowerCase().replace(/\s+/g, "_") || data.user.email?.split("@")[0] || "user";
    syncUsernameToMemoryPrefs(uName);

    const user: AuthSessionUser = {
      id: data.user.id,
      email: data.user.email || email,
      display_name: userMetadata.display_name || data.user.email?.split("@")[0],
      name: userMetadata.name || data.user.email?.split("@")[0],
      username: uName,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
    return { user, error: null };
  }

  return { user: null, error: new Error("Sign in failed") };
}

const LOCAL_STORAGE_KEY_LAST_GOOGLE = "angel_last_google_account";
const LOCAL_STORAGE_KEY_SAVED_GOOGLE_ACCOUNTS = "angel_saved_google_accounts";

export interface LastGoogleAccount {
  email: string;
  name: string;
  username: string;
}

export interface SavedGoogleAccount {
  email: string;
  name: string;
  username: string;
}

const DEFAULT_GOOGLE_ACCOUNTS: SavedGoogleAccount[] = [
  {
    email: "mercy.brown.titi@gmail.com",
    name: "Mercy Brown",
    username: "mercy",
  },
];

export function getSavedGoogleAccounts(): SavedGoogleAccount[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_GOOGLE_ACCOUNTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_GOOGLE_ACCOUNTS;
}

export function saveGoogleAccountToList(account: SavedGoogleAccount): void {
  try {
    const existing = getSavedGoogleAccounts();
    const filtered = existing.filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    const updated = [account, ...filtered];
    localStorage.setItem(
      LOCAL_STORAGE_KEY_SAVED_GOOGLE_ACCOUNTS,
      JSON.stringify(updated)
    );
  } catch {
    // ignore
  }
}

export function getLastGoogleAccount(): LastGoogleAccount {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_GOOGLE);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.email) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  // Default to Mercy Brown account if first time
  return DEFAULT_GOOGLE_ACCOUNTS[0];
}

export async function signInWithGoogle(
  customEmail?: string,
  username?: string,
  customName?: string
): Promise<{ user: AuthSessionUser | null; error: Error | null }> {
  const googleEmail = (customEmail || "mercy.brown.titi@gmail.com").trim();
  const defaultDisplayName = customName?.trim() || googleEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const chosenUsername = (username?.trim() || googleEmail.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "")).toLowerCase();
  
  const googleAccountObj: SavedGoogleAccount = {
    email: googleEmail,
    name: defaultDisplayName,
    username: chosenUsername,
  };

  // Save as last Google account and add to saved Google accounts list
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_LAST_GOOGLE,
      JSON.stringify(googleAccountObj)
    );
    saveGoogleAccountToList(googleAccountObj);
  } catch {
    // ignore
  }

  // Update memory preferences with preferred username immediately
  syncUsernameToMemoryPrefs(chosenUsername);

  const supabase = getSupabase();
  const googleId = "google-" + btoa(googleEmail).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  const googleUser: AuthSessionUser = {
    id: googleId,
    email: googleEmail,
    name: defaultDisplayName,
    display_name: defaultDisplayName,
    username: chosenUsername,
  };

  const googleProfile: Profile = {
    id: googleUser.id,
    email: googleEmail,
    name: defaultDisplayName,
    display_name: defaultDisplayName,
    username: chosenUsername,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(chosenUsername)}`,
    preferences: {
      theme: "system",
      language: "en",
      intelligence_level: "standard",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(googleUser));
  localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(googleProfile));

  if (supabase) {
    try {
      await supabase.from("profiles").upsert({
        id: googleId,
        email: googleEmail,
        name: defaultDisplayName,
        display_name: defaultDisplayName,
        username: chosenUsername,
        avatar_url: googleProfile.avatar_url,
        preferences: googleProfile.preferences,
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn("Direct Supabase profile upsert notice:", err);
    }
  }

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
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.id) return parsed;
    } catch {
      // ignore
    }
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const uMeta = session.user.user_metadata || {};
        const uName = uMeta.username || session.user.email?.split("@")[0] || "user";
        return {
          id: session.user.id,
          email: session.user.email || "",
          display_name: uMeta.display_name || session.user.email?.split("@")[0],
          name: uMeta.name || session.user.email?.split("@")[0],
          username: uName,
        };
      }
    } catch {
      // ignore
    }
  }

  // Default initial user for development
  const defaultUser: AuthSessionUser = {
    id: "angel-dev-user",
    email: "user@angel.ai",
    name: "Angel User",
    display_name: "Angel User",
    username: "angel_user",
  };
  localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(defaultUser));
  return defaultUser;
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.id === userId) return parsed;
    } catch {
      // ignore
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email || "",
          name: data.name || "User",
          display_name: data.display_name || data.name || "User",
          username: data.username || data.display_name || "user",
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
    } catch {
      // ignore
    }
  }

  const defaultProfile: Profile = {
    id: userId,
    email: "user@angel.ai",
    name: "Angel User",
    display_name: "Angel User",
    username: "angel_user",
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

export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  if (updates.username) {
    syncUsernameToMemoryPrefs(updates.username);
  }

  const supabase = getSupabase();
  const current = await getUserProfile(userId);
  const updated = { ...current, ...updates, updated_at: new Date().toISOString() } as Profile;
  localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(updated));

  // Sync with current user session if relevant fields changed
  const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      if (u.id === userId) {
        if (updates.username) u.username = updates.username;
        if (updates.display_name) u.display_name = updates.display_name;
        if (updates.name) u.name = updates.name;
        if (updates.avatar_url) u.avatar_id = updates.avatar_url;
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(u));
      }
    } catch {
      // ignore
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (!error && data) {
        return data as Profile;
      }
    } catch (err) {
      console.warn("Supabase update profile notice:", err);
    }
  }

  return updated;
}
