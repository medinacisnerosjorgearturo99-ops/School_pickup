import { NavLink } from "react-router-dom"
import { ChevronUp, UserRound } from "lucide-react"
import { useState } from "react"
import { useSchool } from "../../context/SchoolContext"
import { useTheme } from "../../context/ThemeContext"
import { navItems } from "../../nav"
import { BrandMark } from "../ui/BrandMark"

export function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const { school } = useSchool()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-app-line bg-app-sidebar">
      <div className="flex items-center gap-3 px-5 py-6">
        <BrandMark size={42} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-app-text">{school.schoolName}</p>
          <p className="text-xs font-semibold tracking-wide text-app-primary">{school.productName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Principal">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => {
                setMenuOpen(false)
                onNavigate?.()
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-app-primary text-white shadow-sm"
                    : "text-app-muted hover:bg-app-card-hover hover:text-app-text"
                }`
              }
            >
              <Icon size={18} strokeWidth={2.1} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="relative border-t border-app-line p-3">
        {menuOpen ? (
          <div className="absolute inset-x-3 bottom-full z-40 mb-2 overflow-hidden rounded-xl border border-app-line bg-app-card shadow-[var(--shadow)]">
            <button
              type="button"
              className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-app-text hover:bg-app-card-hover"
              onClick={() => {
                toggleTheme()
                setMenuOpen(false)
              }}
            >
              {theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-app-card-hover"
          aria-expanded={menuOpen}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-app-primary text-white">
            <UserRound size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-app-text">{school.adminName}</span>
            <span className="block truncate text-xs text-app-muted">{school.adminEmail}</span>
          </span>
          <ChevronUp size={16} className={`text-app-muted transition ${menuOpen ? "" : "rotate-180"}`} />
        </button>
      </div>
    </aside>
  )
}
