import { useState, type FormEvent } from "react"
import type { TeacherDraft } from "../../context/SchoolContext"
import { TEACHER_AREAS, TEACHER_SUBJECTS } from "../../lib/teachers"
import type { Gender, Teacher } from "../../types/school"
import { MenuSelect } from "../ui/MenuSelect"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

export function TeacherEditorModal({
  teacher,
  onClose,
  onSave,
}: {
  teacher: Teacher | null
  onClose: () => void
  onSave: (draft: TeacherDraft, id?: string) => { id: string } | { error: string }
}) {
  const [firstName, setFirstName] = useState(teacher?.firstName ?? "")
  const [lastName, setLastName] = useState(teacher?.lastName ?? "")
  const [email, setEmail] = useState(teacher?.email ?? "")
  const [active, setActive] = useState(teacher?.active ?? true)
  const [area, setArea] = useState(teacher?.area ?? "Formación")
  const [role, setRole] = useState(teacher?.role ?? "Profesor titular")
  const [subjects, setSubjects] = useState<string[]>(teacher?.subjects ?? ["Formación"])
  const [hoursPerWeek, setHoursPerWeek] = useState(String(teacher?.hoursPerWeek ?? 20))
  const [rating, setRating] = useState(String(teacher?.rating && teacher.rating > 0 ? teacher.rating : 4))
  const [hiredAt, setHiredAt] = useState(teacher?.hiredAt ?? new Date().toISOString().slice(0, 10))
  const [gender, setGender] = useState<Gender>(teacher?.gender ?? "Femenino")
  const [birthDate, setBirthDate] = useState(teacher?.birthDate ?? "")
  const [curp, setCurp] = useState(teacher?.curp ?? "")
  const [rfc, setRfc] = useState(teacher?.rfc ?? "")
  const [phone, setPhone] = useState(teacher?.phone ?? "")
  const [personalEmail, setPersonalEmail] = useState(teacher?.personalEmail ?? "")
  const [address, setAddress] = useState(teacher?.address ?? "")
  const [error, setError] = useState("")

  function toggleSubject(subject: string) {
    setSubjects((current) => (current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const hours = Number(hoursPerWeek)
    const score = Number(rating)
    if (!Number.isFinite(hours) || hours < 1) {
      setError("Las horas semanales deben ser mayores a 0.")
      return
    }
    if (!Number.isFinite(score) || score < 0 || score > 5) {
      setError("La evaluación va de 0 a 5.")
      return
    }
    const result = onSave(
      {
        firstName,
        lastName,
        email,
        active,
        subjects,
        area,
        role,
        hoursPerWeek: Math.round(hours),
        rating: Math.round(score * 10) / 10,
        hiredAt,
        gender,
        birthDate,
        curp,
        rfc,
        phone,
        personalEmail,
        address,
      },
      teacher?.id,
    )
    if ("error" in result) setError(result.error)
  }

  return (
    <Modal title={teacher ? "Editar profesor" : "Nuevo profesor"} onClose={onClose} className="max-w-2xl">
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Nombre
            <input className={fieldClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nombre" autoFocus />
          </label>
          <label className="text-sm font-semibold">
            Apellidos
            <input className={fieldClass} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Apellidos" />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Correo institucional
          <input type="email" className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@escuela.edu" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Área
            <div className="mt-1.5">
              <MenuSelect ariaLabel="Área" value={area} align="left" options={TEACHER_AREAS.map((item) => ({ value: item, label: item }))} onChange={setArea} />
            </div>
          </label>
          <label className="text-sm font-semibold">
            Estado
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Estado"
                value={active ? "activo" : "inactivo"}
                align="left"
                options={[
                  { value: "activo", label: "Activo" },
                  { value: "inactivo", label: "Inactivo" },
                ]}
                onChange={(value) => setActive(value === "activo")}
              />
            </div>
          </label>
        </div>
        <label className="text-sm font-semibold">
          Puesto
          <input className={fieldClass} value={role} onChange={(event) => setRole(event.target.value)} />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">Asignaturas</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEACHER_SUBJECTS.map((subject) => (
              <label key={subject} className="inline-flex items-center gap-2 rounded-lg border border-app-line px-2.5 py-1.5 text-xs font-semibold">
                <input type="checkbox" className="accent-[var(--primary)]" checked={subjects.includes(subject)} onChange={() => toggleSubject(subject)} />
                {subject}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Horas / semana
            <input type="number" min={1} className={fieldClass} value={hoursPerWeek} onChange={(event) => setHoursPerWeek(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Evaluación
            <input type="number" min={0} max={5} step={0.1} className={fieldClass} value={rating} onChange={(event) => setRating(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Ingreso
            <input type="date" className={fieldClass} value={hiredAt} onChange={(event) => setHiredAt(event.target.value)} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Sexo
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Sexo"
                value={gender}
                align="left"
                options={[
                  { value: "Femenino", label: "Femenino" },
                  { value: "Masculino", label: "Masculino" },
                ]}
                onChange={setGender}
              />
            </div>
          </label>
          <label className="text-sm font-semibold">
            Fecha de nacimiento
            <input type="date" className={fieldClass} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            CURP
            <input className={fieldClass} value={curp} onChange={(event) => setCurp(event.target.value.toUpperCase())} />
          </label>
          <label className="text-sm font-semibold">
            RFC
            <input className={fieldClass} value={rfc} onChange={(event) => setRfc(event.target.value.toUpperCase())} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Teléfono
            <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Correo personal
            <input className={fieldClass} value={personalEmail} onChange={(event) => setPersonalEmail(event.target.value)} />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Domicilio
          <input className={fieldClass} value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        {error ? <p className="text-sm font-medium text-app-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover">
            {teacher ? "Guardar cambios" : "Crear profesor"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
