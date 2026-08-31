import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { BrandMark } from "../ui/BrandMark"
import { useSchool } from "../../context/SchoolContext"

export function AppLayout() {
  const { school } = useSchool()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-app-bg text-app-text">
      <div className="hidden w-[272px] shrink-0 lg:block">
        <div className="sticky top-0 h-svh">
          <Sidebar />
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[272px] max-w-[85vw]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-app-line px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-app-text hover:bg-app-card-hover"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <BrandMark size={32} />
          <p className="text-sm font-bold">{school.schoolName}</p>
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
