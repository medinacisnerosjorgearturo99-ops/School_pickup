import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

export function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 w-full max-w-xl max-h-[85vh] overflow-auto rounded-[22px] border border-app-line bg-app-card p-6 shadow-[var(--shadow)] ${className}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-bold text-app-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-app-muted hover:bg-app-card-hover hover:text-app-text"
            aria-label="Cerrar diálogo"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
