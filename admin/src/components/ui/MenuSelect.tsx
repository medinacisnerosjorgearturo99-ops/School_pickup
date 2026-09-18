import { useEffect, useId, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { useAnchoredMenu } from "./useAnchoredMenu"

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export function MenuSelect<T extends string>({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
  align = "right",
  className = "",
}: {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  icon?: ReactNode
  ariaLabel: string
  align?: "left" | "right"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const { triggerRef, coords } = useAnchoredMenu(open, align, Math.max(options.length, 1))
  const selected = options.find((option) => option.value === value)?.label ?? (value ? String(value) : "Selecciona…")

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
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-app-line bg-app-card px-3.5 py-2.5 text-sm font-semibold text-app-text hover:bg-app-card-hover"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">{selected}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-app-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && coords
        ? createPortal(
            <ul
              id={menuId}
              role="listbox"
              style={{ top: coords.top, left: coords.left, width: coords.width }}
              className="fixed z-[80] max-h-64 overflow-auto rounded-xl border border-app-line bg-app-card py-1 shadow-[var(--shadow)]"
            >
              {options.length === 0 ? (
                <li className="px-3.5 py-2.5 text-sm text-app-muted">No hay opciones todavía.</li>
              ) : (
                options.map((option) => (
                  <li key={option.value || "empty"} role="option" aria-selected={option.value === value}>
                    <button
                      type="button"
                      className={`block w-full truncate px-3.5 py-2 text-left text-sm font-medium hover:bg-app-card-hover ${
                        option.value === value ? "text-app-primary" : "text-app-text"
                      }`}
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}
