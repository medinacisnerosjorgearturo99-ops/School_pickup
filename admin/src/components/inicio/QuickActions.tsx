import { History, MapPin, Monitor, UserPlus, Users, GraduationCap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Card } from "../ui/Card"

const actions = [
  { label: "Nuevo grupo", icon: Users, to: "/grados" },
  { label: "Registrar alumno", icon: UserPlus, to: "/alumnos" },
  { label: "Asignar profesor", icon: GraduationCap, to: "/profesores" },
  { label: "Ver pantallas", icon: Monitor, to: "/pantallas" },
  { label: "Zona de entrega", icon: MapPin, to: "/zonas" },
  { label: "Ver historial", icon: History, to: "/historial" },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card className="h-full p-5">
      <h2 className="mb-4 text-base font-bold">Acciones rápidas</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.to)}
              className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-app-line bg-transparent px-3 py-4 text-center text-sm font-semibold text-app-text transition hover:bg-app-card-hover hover:border-app-primary/40"
            >
              <Icon size={22} className="text-app-muted" />
              {action.label}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
