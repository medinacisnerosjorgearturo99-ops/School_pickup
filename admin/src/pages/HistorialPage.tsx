import { useEffect, useState } from "react"
import { Card } from "../components/ui/Card"
import { apiUrl } from "../lib/api"

interface PickupEvent {
  id: string
  at: string
  childName: string
  groupLabel: string
  zone: string
  responsibleName: string
  event: string
}

function eventLabel(event: string) {
  if (event === "AVISO") return "Padre avisó"
  if (event === "PREPARANDO") return "Salón preparando"
  if (event === "LISTO") return "Listo para entrega"
  if (event === "LLEGADA") return "Responsable llegó"
  if (event === "RECOGIDO") return "Alumno recogido"
  if (event === "CANCELADO") return "Cancelado"
  return event
}

function formatAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export function HistorialPage() {
  const [events, setEvents] = useState<PickupEvent[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch(apiUrl("/api/pickups/history"))
        if (!response.ok) throw new Error("No se pudo leer el historial.")
        const body = (await response.json()) as { events?: PickupEvent[] }
        if (!cancelled) {
          setEvents(body.events ?? [])
          setError("")
        }
      } catch {
        if (!cancelled) setError("No hay conexión con el servidor.")
      }
    }
    void load()
    const handle = window.setInterval(() => void load(), 4000)
    return () => {
      cancelled = true
      window.clearInterval(handle)
    }
  }, [])

  return (
    <div className="mx-auto max-w-[880px]">
      <h1 className="text-[28px] font-extrabold tracking-tight">Historial</h1>
      <p className="mt-1 text-sm text-app-muted">Avisos, preparaciones y entregas que ocurren hoy en el servidor.</p>
      <Card className="mt-6 p-5">
        {error ? <p className="text-sm text-app-muted">{error}</p> : null}
        {!error && events.length === 0 ? (
          <p className="text-sm text-app-muted">Aún no hay movimientos. Aparecerán cuando un padre avise desde la app.</p>
        ) : null}
        {events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((item) => (
              <li key={item.id} className="rounded-xl border border-app-line px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{item.childName}</p>
                  <span className="text-xs font-semibold text-app-muted">{formatAt(item.at)}</span>
                </div>
                <p className="mt-1 text-sm text-app-secondary">{eventLabel(item.event)}</p>
                <p className="mt-1 text-xs text-app-muted">
                  {[item.groupLabel, item.zone, item.responsibleName].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  )
}
