import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { useSchool } from "../../context/SchoolContext"
import { formatDate } from "../../lib/format"
import type { Announcement, AnnouncementTag } from "../../types/school"
import { Card } from "../ui/Card"
import { Modal } from "../ui/Modal"

const tagClass: Record<AnnouncementTag, string> = {
  General: "bg-app-blue-soft text-app-primary",
  Importante: "bg-app-green-soft text-app-green",
  Aviso: "bg-app-purple-soft text-app-purple",
}

function AnnouncementRow({
  item,
  expanded,
  onToggle,
}: {
  item: Announcement
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-3 border-b border-app-line px-5 py-4 text-left last:border-b-0 hover:bg-app-card-hover"
    >
      <span className={`mt-0.5 shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${tagClass[item.tag]}`}>
        {item.tag}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-app-text">{item.title}</span>
        <span className={`mt-0.5 block text-xs text-app-muted ${expanded ? "" : "line-clamp-1"}`}>
          {item.description}
        </span>
      </span>
      <span className="shrink-0 pt-0.5 text-xs font-medium text-app-muted">{formatDate(item.date)}</span>
      <ChevronRight
        size={16}
        className={`mt-1 shrink-0 text-app-muted transition ${expanded ? "rotate-90" : ""}`}
      />
    </button>
  )
}

export function AnnouncementsCard() {
  const { school, cycleId } = useSchool()
  const items = school.announcements.filter((item) => item.cycleId === cycleId)
  const preview = items.slice(0, 3)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  return (
    <>
      <Card className="flex h-full flex-col">
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-base font-bold">Anuncios y avisos</h2>
        </div>
        <div className="flex-1">
          {preview.length === 0 ? (
            <p className="px-5 py-8 text-sm text-app-muted">No hay avisos en este ciclo.</p>
          ) : (
            preview.map((item) => (
              <AnnouncementRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              />
            ))
          )}
        </div>
        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-semibold text-app-primary hover:underline"
          >
            Ver todos los avisos &gt;
          </button>
        </div>
      </Card>
      {showAll ? (
        <Modal title="Anuncios y avisos" onClose={() => setShowAll(false)}>
          <div className="-mx-2">
            {items.map((item) => (
              <AnnouncementRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              />
            ))}
          </div>
        </Modal>
      ) : null}
    </>
  )
}
