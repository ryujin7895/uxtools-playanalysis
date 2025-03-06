import { createContext, useContext, useEffect, useState } from "react";

export enum Theme {
  DARK = "dark",
  LIGHT = "light"
}

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = Theme.LIGHT
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    // On client, try to read from localStorage first
    if (typeof window !== "undefined") {
      const storedTheme = window.localStorage.getItem("theme");
      if (storedTheme === Theme.DARK) {
        return Theme.DARK;
      }
      
      // Explicitly use light theme for any other case
      return Theme.LIGHT;
    }
    
    // Default for server-side rendering
    return Theme.LIGHT;
  });

  // Apply theme class to html element when theme changes
  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Store in localStorage for persistence
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply light theme on component mount to ensure consistency
  useEffect(() => {
    // Force light theme on initial load if no theme is set
    if (!localStorage.getItem("theme")) {
      setTheme(Theme.LIGHT);
    }
  }, []);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Client-side function to initialize theme without server-side data
export function initializeTheme() {
  const theme = localStorage.getItem("theme") || Theme.LIGHT;
  
  if (theme === Theme.DARK) {
    document.documentElement.classList.add("dark");
  }
}