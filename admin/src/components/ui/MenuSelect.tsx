import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

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
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const selected = options.find((option) => option.value === value)?.label ?? value

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-app-line bg-app-card px-3.5 py-2.5 text-sm font-semibold text-app-text hover:bg-app-card-hover"
      >
        <span className="inline-flex items-center gap-2">
          {icon}
          <span>{selected}</span>
        </span>
        <ChevronDown size={16} className={`text-app-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="listbox"
          className={`absolute z-20 mt-2 min-w-full overflow-hidden rounded-xl border border-app-line bg-app-card py-1 shadow-[var(--shadow)] ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className={`block w-full px-3.5 py-2 text-left text-sm font-medium hover:bg-app-card-hover ${
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
          ))}
        </ul>
      ) : null}
    </div>
  )
}
