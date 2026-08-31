import {
  CalendarRange,
  GraduationCap,
  History,
  Home,
  Layers,
  MapPin,
  Monitor,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  description: string
}

export const navItems: NavItem[] = [
  {
    to: "/",
    label: "Inicio",
    icon: Home,
    description: "Panel general de control de la escuela.",
  },
  {
    to: "/ciclos",
    label: "Ciclos escolares",
    icon: CalendarRange,
    description: "Abre o cierra ciclos. El ciclo activo alimenta grupos, pantallas y la app de padres.",
  },
  {
    to: "/grados",
    label: "Grados y grupos",
    icon: Layers,
    description: "Define salones, profesores y la pantalla TV que verá cada grupo.",
  },
  {
    to: "/alumnos",
    label: "Alumnos",
    icon: GraduationCap,
    description: "Nombre, grado, grupo y responsables de recojo. Esa lista llega al salón y a la app de padres.",
  },
  {
    to: "/profesores",
    label: "Profesores",
    icon: Users,
    description: "Asigna docentes a cada grupo. Ellos verán a sus alumnos en la pantalla del salón.",
  },
  {
    to: "/zonas",
    label: "Zonas de entrega",
    icon: MapPin,
    description: "Puntos de recojo que verán padres, profesores y la TV al momento de la salida.",
  },
  {
    to: "/pantallas",
    label: "Pantallas",
    icon: Monitor,
    description: "Vincula cada TV de salón con su grupo para mostrar la lista de alumnos y la fila de recojo.",
  },
  {
    to: "/historial",
    label: "Historial",
    icon: History,
    description: "Bitácora de entregas, avisos y cambios de configuración.",
  },
]
