import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeMode } from "../types";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "angel_theme_preference";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
    if (stored === "black") return "dark";
    if (stored === "white") return "light";
    return "dark"; // Default is DARK per specification
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    
    // Set initial system match
    setSystemDark(mediaQuery.matches);
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const normalizedTheme: "dark" | "light" | "system" = 
    theme === "black" ? "dark" : theme === "white" ? "light" : theme;

  const resolvedTheme: "dark" | "light" =
    normalizedTheme === "system" ? (systemDark ? "dark" : "light") : normalizedTheme;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
      root.setAttribute("data-theme", "light");
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    const canonical = newTheme === "black" ? "dark" : newTheme === "white" ? "light" : newTheme;
    setThemeState(canonical);
    localStorage.setItem(THEME_STORAGE_KEY, canonical);
  };

  return (
    <ThemeContext.Provider value={{ theme: normalizedTheme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

