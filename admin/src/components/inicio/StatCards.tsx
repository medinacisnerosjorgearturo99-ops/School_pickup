import { GraduationCap, Monitor, UserRound, Users } from "lucide-react"
import { useSchool } from "../../context/SchoolContext"
import { Card } from "../ui/Card"

function formatDelta(value: number, suffix: string) {
  if (value === 0) return `Sin cambio ${suffix}`
  const sign = value > 0 ? "+" : ""
  return `${sign}${value} ${suffix}`
}

export function StatCards() {
  const { stats, selectedCycle } = useSchool()
  const closed = selectedCycle.status === "cerrado"

  const cards = [
    {
      label: "Total grupos",
      value: stats.groups,
      hint: closed ? "Ciclo cerrado" : formatDelta(stats.groupsDelta, "este ciclo"),
      icon: Users,
      iconClass: "bg-app-blue-soft text-app-primary",
    },
    {
      label: "Alumnos inscritos",
      value: stats.students,
      hint: closed ? "Ciclo cerrado" : formatDelta(stats.studentsDelta, "este ciclo"),
      icon: UserRound,
      iconClass: "bg-app-green-soft text-app-green",
    },
    {
      label: "Profesores activos",
      value: stats.teachers,
      hint: `${stats.teachersActivePct}% activos`,
      icon: GraduationCap,
      iconClass: "bg-app-purple-soft text-app-purple",
    },
    {
      label: "Pantallas activas",
      value: stats.screensOnline,
      hint: stats.screensOnline === stats.screens ? "En funcionamiento" : `${stats.screensOnline} de ${stats.screens} en línea`,
      icon: Monitor,
      iconClass: "bg-app-orange-soft text-app-orange",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-app-muted">{card.label}</p>
                <p className="mt-2 text-[32px] font-extrabold leading-none tracking-tight">{card.value}</p>
                <p className="mt-2 text-xs font-medium text-app-muted">{card.hint}</p>
              </div>
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${card.iconClass}`}>
                <Icon size={20} />
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
