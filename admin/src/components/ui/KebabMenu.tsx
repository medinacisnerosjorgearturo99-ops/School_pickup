import { useEffect, useId, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { MoreVertical } from "lucide-react"
import { useAnchoredMenu } from "./useAnchoredMenu"

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
  const menuId = useId()
  const { triggerRef, coords } = useAnchoredMenu(open, align, items.length)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      const menu = document.getElementById(menuId)
      if (menu?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [menuId, triggerRef])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [open])

  return (
    <div>
      <button
        ref={triggerRef}
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
      {open && coords
        ? createPortal(
            <ul
              id={menuId}
              role="menu"
              style={{ top: coords.top, left: coords.left, width: Math.max(coords.width, 180) }}
              className="fixed z-[80] min-w-[180px] overflow-hidden rounded-xl border border-app-line bg-app-card py-1 shadow-[var(--shadow)]"
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
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}
