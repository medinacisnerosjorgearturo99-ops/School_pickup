import { useState, type FormEvent } from "react"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

export function StudentFormModal({
  groupLabel,
  onClose,
  onSave,
}: {
  groupLabel: string
  onClose: () => void
  onSave: (firstName: string, lastName: string) => { id: string } | { error: string }
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = onSave(firstName, lastName)
    if ("error" in result) setError(result.error)
  }

  return (
    <Modal title={`Agregar alumno · ${groupLabel}`} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <label className="text-sm font-semibold">
          Nombre
          <input
            className={fieldClass}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Nombre"
            autoFocus
          />
        </label>
        <label className="text-sm font-semibold">
          Apellido
          <input
            className={fieldClass}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Apellidos"
          />
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
            Agregar alumno
          </button>
        </div>
      </form>
    </Modal>
  )
}
