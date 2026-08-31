import { useMemo, useState } from "react"
import { useSchool } from "../../context/SchoolContext"
import { formatDateTime, groupBadge } from "../../lib/format"
import { Card } from "../ui/Card"
import { Modal } from "../ui/Modal"

const badgePalette = [
  "bg-app-green-soft text-app-green",
  "bg-app-blue-soft text-app-primary",
  "bg-app-orange-soft text-app-orange",
  "bg-app-purple-soft text-app-purple",
]

export function UpcomingCard() {
  const { school, cycleId } = useSchool()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const items = useMemo(() => {
    return school.upcoming
      .filter((event) => event.cycleId === cycleId)
      .slice()
      .sort((a, b) => a.datetime.localeCompare(b.datetime))
      .map((event, index) => {
        const group = school.groups.find((item) => item.id === event.groupId)
        return {
          ...event,
          badge: group ? groupBadge(group.grade, group.letter) : "—",
          palette: badgePalette[index % badgePalette.length],
        }
      })
  }, [cycleId, school.groups, school.upcoming])

  const preview = items.slice(0, 3)

  return (
    <>
      <Card className="flex h-full flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">Entregas próximas</h2>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="text-sm font-semibold text-app-primary hover:underline"
          >
            Ver calendario &gt;
          </button>
        </div>
        <div className="flex flex-1 flex-col">
          {preview.length === 0 ? (
            <p className="py-8 text-sm text-app-muted">No hay entregas programadas en este ciclo.</p>
          ) : (
            preview.map((item) => (
              <div key={item.id} className="flex items-start gap-3 border-b border-app-line py-3 last:border-b-0">
                <span className={`mt-0.5 min-w-12 rounded-md px-2 py-1 text-center text-[11px] font-extrabold ${item.palette}`}>
                  {item.badge}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-app-muted">{item.subject}</p>
                  <p className="mt-1 text-xs text-app-muted">{formatDateTime(item.datetime)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      {calendarOpen ? (
        <Modal title="Calendario de entregas" onClose={() => setCalendarOpen(false)}>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-app-line p-3">
                <span className={`min-w-12 rounded-md px-2 py-1 text-center text-[11px] font-extrabold ${item.palette}`}>
                  {item.badge}
                </span>
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-app-muted">{item.subject}</p>
                  <p className="mt-1 text-xs font-medium text-app-secondary">{formatDateTime(item.datetime)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </>
  )
}
