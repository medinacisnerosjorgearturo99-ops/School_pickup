import type { DeliveryZone, ZoneDemand } from "../types/school"

export function demandFromUsage(usagePct: number): ZoneDemand {
  if (usagePct >= 70) return "alta"
  if (usagePct >= 30) return "media"
  return "baja"
}

export function demandBadge(demand: ZoneDemand) {
  if (demand === "alta") return { label: "Alta", className: "text-app-green", dot: "bg-app-green" }
  if (demand === "media") return { label: "Media", className: "text-app-orange", dot: "bg-app-orange" }
  return { label: "Baja", className: "text-app-primary", dot: "bg-app-primary" }
}

export function demandPhrase(demand: ZoneDemand) {
  if (demand === "alta") return "Alta demanda"
  if (demand === "media") return "Demanda media"
  return "Demanda baja"
}

export function usageBarClass(demand: ZoneDemand) {
  if (demand === "alta") return "bg-app-green"
  if (demand === "media") return "bg-app-orange"
  return "bg-app-primary"
}

export function zoneTitle(zone: Pick<DeliveryZone, "name" | "description">) {
  if (!zone.description || zone.name.includes(zone.description)) return zone.name
  return `${zone.name} - ${zone.description}`
}

export function formatHour12(hhmm: string) {
  const [hoursRaw, minutes = "00"] = hhmm.split(":")
  const hours = Number(hoursRaw)
  if (!Number.isFinite(hours)) return hhmm
  const suffix = hours >= 12 ? "PM" : "AM"
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${String(hour12).padStart(2, "0")}:${minutes} ${suffix}`
}

export function formatWait(seconds: number) {
  const safe = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  if (minutes === 0) return `${rest} seg`
  if (rest === 0) return `${minutes} min`
  return `${minutes} min ${rest} seg`
}

export function nextZoneLetter(zones: DeliveryZone[]) {
  const used = zones.map((zone) => zone.letter.toUpperCase())
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (const letter of alphabet) {
    if (!used.includes(letter)) return letter
  }
  return "Z"
}

export function zoneHistory(zone: DeliveryZone) {
  return [
    { id: `${zone.id}-h1`, time: "13:42", text: `${zone.studentsToday} alumnos entregados en el turno vespertino.` },
    { id: `${zone.id}-h2`, time: "13:18", text: `Pico de ${Math.max(zone.vehiclesToday - 4, 1)} vehículos en fila.` },
    { id: `${zone.id}-h3`, time: "07:55", text: "Cierre del horario matutino sin incidencias." },
    { id: `${zone.id}-h4`, time: "07:12", text: "Apertura de zona y primer vehículo registrado." },
  ]
}
