import { Moon, Sun } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="inline-flex items-center gap-2 rounded-xl border border-app-line bg-app-card px-3 py-2.5 text-sm font-semibold text-app-text hover:bg-app-card-hover"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {compact ? null : <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  )
}
