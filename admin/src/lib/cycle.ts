import type { CycleStatus, SchoolCycle } from "../types/school"

export function todayISO(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function parseISODate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`)
}

export function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function addYears(iso: string, years: number) {
  const date = parseISODate(iso)
  date.setFullYear(date.getFullYear() + years)
  return toISODate(date)
}

export function labelFromDates(startDate: string, endDate: string) {
  return `${startDate.slice(0, 4)}–${endDate.slice(0, 4)}`
}

export function diffMonthsDays(startDate: string, endDate: string) {
  const from = parseISODate(startDate)
  const to = parseISODate(endDate)
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  let days = to.getDate() - from.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate()
  }
  if (months < 0) return { months: 0, days: 0 }
  return { months, days }
}

export function formatMonthsDays(months: number, days: number) {
  const monthPart = months === 1 ? "1 mes" : `${months} meses`
  const dayPart = days === 1 ? "1 día" : `${days} días`
  if (months === 0) return dayPart
  if (days === 0) return monthPart
  return `${monthPart}, ${dayPart}`
}

export function cycleDuration(cycle: Pick<SchoolCycle, "startDate" | "endDate">) {
  return diffMonthsDays(cycle.startDate, cycle.endDate)
}

export function averageDurationMonths(cycles: SchoolCycle[]) {
  if (cycles.length === 0) return 0
  const total = cycles.reduce((sum, cycle) => {
    const { months, days } = cycleDuration(cycle)
    return sum + months + days / 30
  }, 0)
  return Math.round((total / cycles.length) * 10) / 10
}

export function deriveCycleStatus(startDate: string, endDate: string, today = todayISO()): CycleStatus {
  if (today < startDate) return "proximo"
  if (today > endDate) return "cerrado"
  return "activo"
}

export function elapsedProgress(cycle: SchoolCycle, today = todayISO()) {
  if (today < cycle.startDate) {
    return { months: 0, days: 0, percent: 0, started: false, ended: false }
  }
  const ended = today > cycle.endDate
  const cursor = ended ? cycle.endDate : today
  const elapsed = diffMonthsDays(cycle.startDate, cursor)
  const total = parseISODate(cycle.endDate).getTime() - parseISODate(cycle.startDate).getTime()
  const done = parseISODate(cursor).getTime() - parseISODate(cycle.startDate).getTime()
  const percent = total <= 0 ? 0 : Math.min(100, Math.max(0, (done / total) * 100))
  return { ...elapsed, percent, started: true, ended }
}

export function statusBadge(status: CycleStatus) {
  if (status === "activo") {
    return { label: "Activo", className: "bg-app-green-soft text-app-green" }
  }
  if (status === "proximo") {
    return { label: "Próximo", className: "bg-app-purple-soft text-app-purple" }
  }
  return { label: "Finalizado", className: "bg-app-blue-soft text-app-primary" }
}

export function statusPhrase(status: CycleStatus) {
  if (status === "activo") return "En curso"
  if (status === "proximo") return "Por iniciar"
  return "Finalizado"
}

export function nextStartCycle(cycles: SchoolCycle[], today = todayISO()) {
  const upcoming = cycles
    .filter((cycle) => cycle.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  return upcoming ?? cycles.find((cycle) => cycle.status === "activo") ?? cycles[0]
}

export function monthsInRange(startDate: string, endDate: string) {
  const start = parseISODate(startDate)
  const end = parseISODate(endDate)
  const months: { year: number; month: number }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cursor <= last) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months
}
