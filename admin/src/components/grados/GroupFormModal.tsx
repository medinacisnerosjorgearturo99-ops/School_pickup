import { useState, type FormEvent } from "react"
import type { GroupDraft } from "../../context/SchoolContext"
import { nextLetter } from "../../lib/grades"
import { teacherName } from "../../lib/format"
import type { AcademicGrade, AcademicStatus, GradeGroup, Shift, Teacher, DeliveryZone } from "../../types/school"
import { MenuSelect } from "../ui/MenuSelect"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

export function GroupFormModal({
  group,
  grades,
  teachers,
  zones,
  existingLetters,
  defaultGradeId,
  onClose,
  onSave,
}: {
  group: GradeGroup | null
  grades: AcademicGrade[]
  teachers: Teacher[]
  zones: DeliveryZone[]
  existingLetters: string[]
  defaultGradeId: string
  onClose: () => void
  onSave: (draft: GroupDraft, id?: string) => { id: string } | { error: string }
}) {
  const [gradeId, setGradeId] = useState(group?.gradeId ?? defaultGradeId)
  const [letter, setLetter] = useState(group?.letter ?? nextLetter(existingLetters))
  const [classroom, setClassroom] = useState(group?.classroom ?? "")
  const [teacherId, setTeacherId] = useState(group?.teacherId ?? teachers[0]?.id ?? "")
  const [zoneId, setZoneId] = useState(group?.zoneId ?? zones[0]?.id ?? "")
  const [shift, setShift] = useState<Shift>(group?.shift ?? "Matutino")
  const [status, setStatus] = useState<AcademicStatus>(group?.status ?? "activo")
  const [capacity, setCapacity] = useState(String(group?.capacity ?? 30))
  const [error, setError] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    const cap = Number(capacity)
    if (!gradeId) {
      setError("Crea un grado antes de dar de alta grupos.")
      return
    }
    if (!letter.trim()) {
      setError("Indica la letra del grupo.")
      return
    }
    if (!Number.isFinite(cap) || cap < 1) {
      setError("La capacidad debe ser mayor a 0.")
      return
    }
    const result = onSave(
      {
        gradeId,
        letter,
        classroom,
        teacherId,
        zoneId,
        shift,
        status,
        capacity: Math.round(cap),
      },
      group?.id,
    )
    if ("error" in result) setError(result.error)
  }

  return (
    <Modal title={group ? "Editar grupo" : "Nuevo grupo"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <label className="text-sm font-semibold">
          Grado
          <div className="mt-1.5">
            <MenuSelect
              ariaLabel="Grado del grupo"
              value={gradeId}
              align="left"
              options={
                grades.length === 0
                  ? [{ value: "", label: "Crea un grado primero" }]
                  : grades.map((grade) => ({ value: grade.id, label: grade.name }))
              }
              onChange={setGradeId}
            />
          </div>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Letra
            <input
              className={fieldClass}
              value={letter}
              maxLength={1}
              onChange={(event) => setLetter(event.target.value.toUpperCase())}
              placeholder="A"
            />
          </label>
          <label className="text-sm font-semibold">
            Aula
            <input
              className={fieldClass}
              value={classroom}
              onChange={(event) => setClassroom(event.target.value)}
              placeholder="A-12"
            />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Profesor titular
          <div className="mt-1.5">
            <MenuSelect
              ariaLabel="Profesor titular"
              value={teacherId}
              align="left"
              options={[
                { value: "", label: teachers.length === 0 ? "Sin profesores aún" : "Sin profesor titular" },
                ...teachers.map((teacher) => ({
                  value: teacher.id,
                  label: teacherName(teacher.firstName, teacher.lastName),
                })),
              ]}
              onChange={setTeacherId}
            />
          </div>
        </label>
        <label className="text-sm font-semibold">
          Zona de entrega
          <div className="mt-1.5">
            <MenuSelect
              ariaLabel="Zona de entrega"
              value={zoneId}
              align="left"
              options={[
                { value: "", label: zones.length === 0 ? "Sin zonas aún" : "Sin zona" },
                ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
              ]}
              onChange={setZoneId}
            />
          </div>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Turno
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Turno"
                value={shift}
                align="left"
                options={[
                  { value: "Matutino", label: "Matutino" },
                  { value: "Vespertino", label: "Vespertino" },
                ]}
                onChange={setShift}
              />
            </div>
          </label>
          <label className="text-sm font-semibold">
            Estado
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Estado del grupo"
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
        </div>
        <label className="text-sm font-semibold">
          Capacidad
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
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
            {group ? "Guardar cambios" : "Crear grupo"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
