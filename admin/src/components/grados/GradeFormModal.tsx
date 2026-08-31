import { useState, type FormEvent } from "react"
import type { GradeDraft } from "../../context/SchoolContext"
import { gradeColorKeys } from "../../lib/grades"
import type { AcademicGrade, AcademicStatus } from "../../types/school"
import { MenuSelect } from "../ui/MenuSelect"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

const colorSwatch: Record<(typeof gradeColorKeys)[number], string> = {
  orange: "bg-app-orange",
  blue: "bg-app-primary",
  green: "bg-app-green",
  purple: "bg-app-purple",
}

export function GradeFormModal({
  grade,
  onClose,
  onSave,
}: {
  grade: AcademicGrade | null
  onClose: () => void
  onSave: (draft: GradeDraft, id?: string) => void
}) {
  const [name, setName] = useState(grade?.name ?? "")
  const [shortLabel, setShortLabel] = useState(grade?.shortLabel ?? "")
  const [color, setColor] = useState(grade?.color ?? "blue")
  const [status, setStatus] = useState<AcademicStatus>(grade?.status ?? "activo")
  const [error, setError] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError("Escribe el nombre del grado.")
      return
    }
    onSave({ name: name.trim(), shortLabel: shortLabel.trim(), color, status }, grade?.id)
  }

  return (
    <Modal title={grade ? "Editar grado" : "Nuevo grado"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <label className="text-sm font-semibold">
          Nombre
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="2º Primaria"
            autoFocus
          />
        </label>
        <label className="text-sm font-semibold">
          Etiqueta corta
          <input
            className={fieldClass}
            value={shortLabel}
            maxLength={2}
            onChange={(event) => setShortLabel(event.target.value)}
            placeholder="2"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">Color</legend>
          <div className="mt-2 flex gap-2">
            {gradeColorKeys.map((key) => (
              <button
                key={key}
                type="button"
                aria-label={`Color ${key}`}
                aria-pressed={color === key}
                onClick={() => setColor(key)}
                className={`grid size-9 place-items-center rounded-full border-2 ${
                  color === key ? "border-app-text" : "border-transparent"
                }`}
              >
                <span className={`size-7 rounded-full ${colorSwatch[key]}`} />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="text-sm font-semibold">
          Estado
          <div className="mt-1.5">
            <MenuSelect
              ariaLabel="Estado del grado"
              value={status}
              align="left"
              options={[
                { value: "activo", label: "Activo" },
                { value: "inactivo", label: "Inactivo" },
              ]}
              onChange={setStatus}
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
            {grade ? "Guardar cambios" : "Crear grado"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
