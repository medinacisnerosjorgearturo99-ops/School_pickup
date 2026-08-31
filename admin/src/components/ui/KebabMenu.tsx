import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { MoreVertical } from "lucide-react"

export interface KebabItem {
  id: string
  label: string
  onClick: () => void
  danger?: boolean
  icon?: ReactNode
}

export function KebabMenu({
  items,
  ariaLabel = "Más opciones",
  align = "right",
}: {
  items: KebabItem[]
  ariaLabel?: string
  align?: "left" | "right"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        className="rounded-lg p-1.5 text-app-muted hover:bg-app-card-hover hover:text-app-text"
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className={`absolute z-30 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-app-line bg-app-card py-1 shadow-[var(--shadow)] ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm font-medium hover:bg-app-card-hover ${
                  item.danger ? "text-app-danger" : "text-app-text"
                }`}
                onClick={(event) => {
                  event.stopPropagation()
                  setOpen(false)
                  item.onClick()
                }}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
