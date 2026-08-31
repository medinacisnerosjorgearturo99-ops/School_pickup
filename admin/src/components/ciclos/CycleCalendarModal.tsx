import { monthsInRange, parseISODate } from "../../lib/cycle"
import type { SchoolCycle } from "../../types/school"
import { Modal } from "../ui/Modal"

const weekdayLabels = ["L", "M", "M", "J", "V", "S", "D"]

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function CycleCalendarModal({
  cycle,
  onClose,
}: {
  cycle: SchoolCycle
  onClose: () => void
}) {
  const months = monthsInRange(cycle.startDate, cycle.endDate)
  const start = parseISODate(cycle.startDate)
  const end = parseISODate(cycle.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Modal title={`Calendario ${cycle.label}`} onClose={onClose} className="max-w-4xl">
      <p className="mb-4 text-sm text-app-muted">
        {cycle.schoolDays} días lectivos estimados. Los asuetos oficiales se podrán cargar después.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {months.map(({ year, month }) => {
          const title = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(
            new Date(year, month, 1),
          )
          return (
            <div key={`${year}-${month}`} className="rounded-2xl border border-app-line p-3">
              <p className="mb-2 text-center text-sm font-bold capitalize">{title}</p>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-app-muted">
                {weekdayLabels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {monthMatrix(year, month).map((day, index) => {
                  if (day == null) return <span key={index} />
                  const date = new Date(year, month, day)
                  const inRange = date >= start && date <= end
                  const isStart = date.getTime() === start.getTime()
                  const isEnd = date.getTime() === end.getTime()
                  const isToday = date.getTime() === today.getTime()
                  return (
                    <span
                      key={index}
                      className={`grid h-7 place-items-center rounded-md text-[11px] font-semibold ${
                        isStart || isEnd
                          ? "bg-app-primary text-white"
                          : isToday
                            ? "bg-app-green-soft text-app-green"
                            : inRange
                              ? "text-app-text"
                              : "text-app-muted/40"
                      }`}
                    >
                      {day}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
