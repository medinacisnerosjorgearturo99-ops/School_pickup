import { CalendarDays } from "lucide-react"
import { useSchool } from "../context/SchoolContext"
import { AnnouncementsCard } from "../components/inicio/AnnouncementsCard"
import { ActivitySummary } from "../components/inicio/ActivitySummary"
import { QuickActions } from "../components/inicio/QuickActions"
import { StatCards } from "../components/inicio/StatCards"
import { UpcomingCard } from "../components/inicio/UpcomingCard"
import { MenuSelect } from "../components/ui/MenuSelect"
import { ThemeToggle } from "../components/ui/ThemeToggle"

export function InicioPage() {
  const { school, cycleId, setCycleId } = useSchool()

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">
            ¡Bienvenido, {school.adminName}!
          </h1>
          <p className="mt-1 text-sm text-app-muted">Panel general de control.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <MenuSelect
            ariaLabel="Ciclo escolar"
            value={cycleId}
            onChange={setCycleId}
            icon={<CalendarDays size={16} className="text-app-muted" />}
            className="w-max"
            options={school.cycles.map((cycle) => ({
              value: cycle.id,
              label: `Ciclo ${cycle.label}`,
            }))}
          />
        </div>
      </header>

      <StatCards />

      <div className="grid gap-4 xl:grid-cols-2">
        <AnnouncementsCard />
        <UpcomingCard />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QuickActions />
        <ActivitySummary />
      </div>
    </div>
  )
}
