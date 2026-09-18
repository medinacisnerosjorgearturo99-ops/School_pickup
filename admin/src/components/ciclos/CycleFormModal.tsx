import { useState, type FormEvent } from "react"
import { labelFromDates, todayISO } from "../../lib/cycle"
import type { CycleDraft } from "../../context/SchoolContext"
import type { SchoolCycle } from "../../types/school"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

export function CycleFormModal({
  cycle,
  onClose,
  onSave,
}: {
  cycle: SchoolCycle | null
  onClose: () => void
  onSave: (draft: CycleDraft, id?: string) => void
}) {
  const [label, setLabel] = useState(cycle?.label ?? "")
  const [startDate, setStartDate] = useState(cycle?.startDate ?? todayISO())
  const [endDate, setEndDate] = useState(cycle?.endDate ?? "")
  const [schoolDays, setSchoolDays] = useState(String(cycle?.schoolDays ?? 190))
  const [notes, setNotes] = useState(cycle?.notes ?? "")
  const [makeActive, setMakeActive] = useState(cycle?.status === "activo")
  const [error, setError] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!startDate || !endDate) {
      setError("Indica fecha de inicio y de fin.")
      return
    }
    if (endDate <= startDate) {
      setError("La fecha de fin debe ser posterior al inicio.")
      return
    }
    const days = Number(schoolDays)
    if (!Number.isFinite(days) || days < 1) {
      setError("Los días lectivos deben ser un número mayor a 0.")
      return
    }
    onSave(
      {
        label: label.trim() || labelFromDates(startDate, endDate),
        startDate,
        endDate,
        schoolDays: Math.round(days),
        notes,
        makeActive,
      },
      cycle?.id,
    )
  }

  return (
    <Modal title={cycle ? "Editar ciclo escolar" : "Nuevo ciclo escolar"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <label className="text-sm font-semibold">
          Nombre
          <input
            className={fieldClass}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="2027–2028"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Fecha de inicio
            <input
              type="date"
              className={fieldClass}
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                if (!label) setLabel(labelFromDates(event.target.value, endDate || event.target.value))
              }}
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Fecha de fin
            <input
              type="date"
              className={fieldClass}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Días lectivos estimados
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={schoolDays}
            onChange={(event) => setSchoolDays(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          Observaciones
          <textarea
            className={`${fieldClass} min-h-[88px] resize-y`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-app-secondary">
          <input
            type="checkbox"
            checked={makeActive}
            onChange={(event) => setMakeActive(event.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Marcar como ciclo activo (el anterior se cierra)
        </label>
        {error ? <p className="text-sm font-medium text-app-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover"
          >
            {cycle ? "Guardar cambios" : "Crear ciclo"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
