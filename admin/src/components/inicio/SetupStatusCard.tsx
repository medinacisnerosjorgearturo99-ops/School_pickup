import { Link } from "react-router-dom"
import { useSchool } from "../../context/SchoolContext"
import { Card } from "../ui/Card"

export function SetupStatusCard() {
  const { school, stats, syncStatus, lastSyncAt } = useSchool()
  const steps = [
    { done: Boolean(school.schoolName && school.schoolName !== "Tu escuela"), label: "Nombre de la escuela", to: "/" },
    { done: school.cycles.length > 0, label: "Ciclo escolar", to: "/ciclos" },
    { done: stats.groups > 0, label: "Grados y grupos", to: "/grados" },
    { done: stats.teachers > 0, label: "Profesores", to: "/profesores" },
    { done: stats.students > 0, label: "Alumnos y responsables", to: "/alumnos" },
    { done: school.zones.length > 0, label: "Zonas de entrega", to: "/zonas" },
    { done: stats.screens > 0, label: "Pantallas de salón", to: "/pantallas" },
  ]
  const pending = steps.filter((step) => !step.done)
  const syncLabel =
    syncStatus === "ok"
      ? lastSyncAt
        ? `TV y app sincronizadas · ${new Date(lastSyncAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
        : "TV y app sincronizadas"
      : syncStatus === "syncing"
        ? "Sincronizando con el servidor…"
        : syncStatus === "error"
          ? "No se pudo sincronizar con el servidor."
          : "Esperando primera sincronización"

  return (
    <Card className="p-5">
      <h2 className="text-base font-bold">Estado de configuración</h2>
      <p className="mt-1 text-sm text-app-muted">{syncLabel}</p>
      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              to={step.to}
              className="flex items-center justify-between gap-3 rounded-xl border border-app-line px-3 py-2.5 text-sm hover:bg-app-card-hover"
            >
              <span className={step.done ? "font-semibold text-app-text" : "text-app-muted"}>{step.label}</span>
              <span className={`text-xs font-bold ${step.done ? "text-app-green" : "text-app-orange"}`}>
                {step.done ? "Listo" : "Falta"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {pending.length === 0 ? (
        <p className="mt-4 text-sm text-app-secondary">
          La escuela ya puede operar: los padres entran con el correo y la contraseña del responsable, y la TV muestra el grupo vinculado.
        </p>
      ) : null}
    </Card>
  )
}
