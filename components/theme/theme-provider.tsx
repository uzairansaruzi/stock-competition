"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = "theme-preference"

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const getSystemPreference = (): "light" | "dark" => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(STORAGE_KEY)
  if (value === "light" || value === "dark" || value === "system") {
    return value
  }

  return null
}

const applyResolvedTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") {
    return
  }

  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

const persistTheme = (value: Theme) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, value)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(getSystemPreference())

  const setThemePreference = useCallback((value: Theme) => {
    setThemeState(value)
    persistTheme(value)

    const nextResolved = value === "system" ? getSystemPreference() : value
    setResolvedTheme(nextResolved)
    applyResolvedTheme(nextResolved)
  }, [])

  useEffect(() => {
    const stored = getStoredTheme()
    if (stored) {
      setThemePreference(stored)
      return
    }

    // No stored preference: respect the user's OS setting.
    const systemPreference = getSystemPreference()
    setResolvedTheme(systemPreference)
    applyResolvedTheme(systemPreference)
  }, [setThemePreference])

  useEffect(() => {
    if (theme !== "system") {
      return
    }

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const listener = (event: MediaQueryListEvent) => {
      const nextResolved = event.matches ? "dark" : "light"
      setResolvedTheme(nextResolved)
      applyResolvedTheme(nextResolved)
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener)
    } else {
      // Safari < 14
      mediaQuery.addListener(listener)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", listener)
      } else {
        mediaQuery.removeListener(listener)
      }
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    if (theme === "system") {
      const next = resolvedTheme === "dark" ? "light" : "dark"
      setThemePreference(next)
      return
    }

    setThemePreference(theme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setThemePreference, theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemePreference,
      toggleTheme,
    }),
    [resolvedTheme, setThemePreference, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
