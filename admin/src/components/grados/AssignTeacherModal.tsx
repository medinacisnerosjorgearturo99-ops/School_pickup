import { useState, type FormEvent } from "react"
import { teacherName } from "../../lib/format"
import type { Teacher } from "../../types/school"
import { MenuSelect } from "../ui/MenuSelect"
import { Modal } from "../ui/Modal"

export function AssignTeacherModal({
  groupLabel,
  teacherId,
  teachers,
  onClose,
  onSave,
}: {
  groupLabel: string
  teacherId: string
  teachers: Teacher[]
  onClose: () => void
  onSave: (teacherId: string) => void
}) {
  const [selected, setSelected] = useState(teacherId || teachers[0]?.id || "")
  const [error, setError] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!selected) {
      setError("Selecciona un profesor.")
      return
    }
    onSave(selected)
  }

  return (
    <Modal title={`Asignar profesor · ${groupLabel}`} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <label className="text-sm font-semibold">
          Profesor titular
          <div className="mt-1.5">
            <MenuSelect
              ariaLabel="Profesor titular"
              value={selected}
              align="left"
              options={teachers.map((teacher) => ({
                value: teacher.id,
                label: teacherName(teacher.firstName, teacher.lastName),
              }))}
              onChange={setSelected}
            />
          </div>
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
            Guardar asignación
          </button>
        </div>
      </form>
    </Modal>
  )
}
