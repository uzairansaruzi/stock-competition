"use client"

import { Monitor, Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/90 p-1 text-xs font-medium text-zinc-600 shadow-md shadow-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300",
        className,
      )}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value
        const description = value === "system" ? `Follows system (${resolvedTheme})` : `${label} theme`

        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 transition-colors",
              isActive
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
            )}
            aria-pressed={isActive}
            aria-label={description}
            title={description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
