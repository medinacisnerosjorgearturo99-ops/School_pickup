import { useState, type FormEvent } from "react"
import { Plus, Trash2, UserPlus } from "lucide-react"
import type { GuardianDraft, StudentDraft } from "../../context/SchoolContext"
import type { AcademicStatus, Gender, GradeGroup, Guardian, GuardianKind, Student } from "../../types/school"
import { GUARDIAN_RELATIONS, makeCurp } from "../../lib/students"
import { MenuSelect } from "../ui/MenuSelect"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

type GuardianRow = GuardianDraft & { key: string }

function rowsFromStudent(student: Student | null, guardians: Guardian[]): GuardianRow[] {
  if (!student) {
    return [emptyRow("PRIMARY")]
  }
  const rows = student.guardianIds.flatMap((id) => {
    const guardian = guardians.find((item) => item.id === id)
    if (!guardian) return []
    return [
      {
        key: guardian.id,
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        password: guardian.password ?? "",
        phone: guardian.phone,
        relation: guardian.relation,
        kind: guardian.kind,
      },
    ]
  })
  return rows.length > 0 ? rows : [emptyRow("PRIMARY")]
}

function emptyRow(kind: GuardianKind): GuardianRow {
  return {
    key: `new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    name: "",
    email: "",
    password: "",
    phone: "",
    relation: "Madre",
    kind,
  }
}

export function StudentEditorModal({
  student,
  groups,
  guardians,
  onClose,
  onSave,
}: {
  student: Student | null
  groups: GradeGroup[]
  guardians: Guardian[]
  onClose: () => void
  onSave: (draft: StudentDraft, id?: string) => { id: string } | { error: string }
}) {
  const [firstName, setFirstName] = useState(student?.firstName ?? "")
  const [lastName, setLastName] = useState(student?.lastName ?? "")
  const [groupId, setGroupId] = useState(student?.groupId ?? groups[0]?.id ?? "")
  const [status, setStatus] = useState<AcademicStatus>(student?.status ?? "activo")
  const [birthDate, setBirthDate] = useState(student?.birthDate ?? "")
  const [gender, setGender] = useState<Gender>(student?.gender ?? "Masculino")
  const [curp, setCurp] = useState(student?.curp ?? "")
  const [address, setAddress] = useState(student?.address ?? "")
  const [bloodType, setBloodType] = useState(student?.bloodType ?? "")
  const [allergies, setAllergies] = useState(student?.allergies ?? "")
  const [medicalNotes, setMedicalNotes] = useState(student?.medicalNotes ?? "")
  const [rows, setRows] = useState<GuardianRow[]>(() => rowsFromStudent(student, guardians))
  const [linkId, setLinkId] = useState("")
  const [error, setError] = useState("")

  const assignedIds = new Set(rows.map((row) => row.id).filter(Boolean))
  const linkable = guardians.filter((guardian) => !assignedIds.has(guardian.id))

  function patchRow(key: string, patch: Partial<GuardianRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((current) => [...current, emptyRow(current.length === 0 ? "PRIMARY" : "AUTHORIZED")])
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  function linkExisting(id: string) {
    setLinkId("")
    const guardian = guardians.find((item) => item.id === id)
    if (!guardian) return
    setRows((current) => {
      if (current.some((row) => row.id === guardian.id)) return current
      const blank = current.length === 1 && !current[0].name && !current[0].email && !current[0].id
      const next: GuardianRow = {
        key: guardian.id,
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        password: guardian.password ?? "",
        phone: guardian.phone,
        relation: guardian.relation,
        kind: guardian.kind,
      }
      return blank ? [next] : [...current, next]
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!groupId) {
      setError("Crea un grupo en Grados y grupos antes de dar de alta alumnos.")
      return
    }
    const result = onSave(
      {
        firstName,
        lastName,
        groupId,
        status,
        birthDate,
        gender,
        curp: curp.trim() || makeCurp(lastName, firstName, birthDate, gender),
        address,
        bloodType,
        allergies,
        medicalNotes,
        guardians: rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          password: row.password,
          phone: row.phone,
          relation: row.relation,
          kind: row.kind,
        })),
      },
      student?.id,
    )
    if ("error" in result) setError(result.error)
  }

  return (
    <Modal title={student ? "Editar alumno" : "Nuevo alumno"} onClose={onClose} className="max-w-3xl">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Grupo
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Grupo"
                value={groupId}
                align="left"
                options={
                  groups.length === 0
                    ? [{ value: "", label: "Crea un grupo primero" }]
                    : groups.map((group) => ({ value: group.id, label: `${group.grade} - ${group.letter}` }))
                }
                onChange={setGroupId}
              />
            </div>
          </label>
          <label className="text-sm font-semibold">
            Estado
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Estado"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Fecha de nacimiento
            <input type="date" className={fieldClass} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Sexo
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Sexo"
                value={gender}
                align="left"
                options={[
                  { value: "Masculino", label: "Masculino" },
                  { value: "Femenino", label: "Femenino" },
                ]}
                onChange={setGender}
              />
            </div>
          </label>
        </div>
        <label className="text-sm font-semibold">
          CURP
          <input className={fieldClass} value={curp} onChange={(event) => setCurp(event.target.value.toUpperCase())} placeholder="CURP de 18 caracteres" />
        </label>
        <label className="text-sm font-semibold">
          Domicilio
          <input className={fieldClass} value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Tipo de sangre
            <input className={fieldClass} value={bloodType} onChange={(event) => setBloodType(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Alergias
            <input className={fieldClass} value={allergies} onChange={(event) => setAllergies(event.target.value)} />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Observaciones médicas
          <textarea className={`${fieldClass} min-h-[72px] resize-y`} value={medicalNotes} onChange={(event) => setMedicalNotes(event.target.value)} />
        </label>

        <section className="rounded-2xl border border-app-line p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold">Responsables de recojo</h3>
              <p className="mt-0.5 text-xs text-app-muted">El correo es el acceso a la app de padres. No hace falta una ficha aparte.</p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-xl bg-app-primary px-3 py-2 text-xs font-semibold text-white hover:bg-app-primary-hover"
            >
              <Plus size={14} />
              Agregar responsable
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {rows.map((row, index) => {
              const relations = GUARDIAN_RELATIONS.includes(row.relation as (typeof GUARDIAN_RELATIONS)[number])
                ? [...GUARDIAN_RELATIONS]
                : [row.relation, ...GUARDIAN_RELATIONS]
              return (
                <article key={row.key} className="rounded-2xl border border-app-line bg-app-bg p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold tracking-wide text-app-muted uppercase">
                      Responsable {index + 1}
                      {row.id ? "" : " · nuevo"}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-app-danger hover:bg-app-danger-soft"
                    >
                      <Trash2 size={13} />
                      Quitar
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold">
                      Nombre
                      <input className={fieldClass} value={row.name} onChange={(event) => patchRow(row.key, { name: event.target.value })} placeholder="Nombre completo" />
                    </label>
                    <label className="text-sm font-semibold">
                      Parentesco
                      <div className="mt-1.5">
                        <MenuSelect
                          ariaLabel={`Parentesco del responsable ${index + 1}`}
                          value={row.relation}
                          align="left"
                          options={relations.map((relation) => ({ value: relation, label: relation }))}
                          onChange={(value) => patchRow(row.key, { relation: value })}
                        />
                      </div>
                    </label>
                    <label className="text-sm font-semibold">
                      Correo
                      <input type="email" className={fieldClass} value={row.email} onChange={(event) => patchRow(row.key, { email: event.target.value })} placeholder="correo@escuela.edu" />
                    </label>
                    <label className="text-sm font-semibold">
                      Teléfono
                      <input className={fieldClass} value={row.phone} onChange={(event) => patchRow(row.key, { phone: event.target.value })} placeholder="55 0000 0000" />
                    </label>
                    <label className="text-sm font-semibold">
                      Contraseña de la app
                      <input
                        className={fieldClass}
                        value={row.password ?? ""}
                        onChange={(event) => patchRow(row.key, { password: event.target.value })}
                        placeholder="Se genera al guardar"
                      />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">
                      Tipo
                      <div className="mt-1.5">
                        <MenuSelect
                          ariaLabel={`Tipo del responsable ${index + 1}`}
                          value={row.kind}
                          align="left"
                          options={[
                            { value: "PRIMARY", label: "Principal" },
                            { value: "AUTHORIZED", label: "Autorizado para recojo" },
                          ]}
                          onChange={(value) => patchRow(row.key, { kind: value })}
                        />
                      </div>
                    </label>
                  </div>
                </article>
              )
            })}
          </div>

          {linkable.length > 0 ? (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-app-muted">
                <UserPlus size={13} />
                ¿Es el mismo tutor de un hermano? Vincúlalo
              </p>
              <MenuSelect
                ariaLabel="Vincular responsable existente"
                value={linkId}
                align="left"
                options={[
                  { value: "", label: "Selecciona un responsable existente" },
                  ...linkable.slice(0, 40).map((guardian) => ({
                    value: guardian.id,
                    label: `${guardian.name} · ${guardian.relation}`,
                  })),
                ]}
                onChange={linkExisting}
              />
            </div>
          ) : null}
        </section>

        {error ? <p className="text-sm font-medium text-app-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover">
            {student ? "Guardar cambios" : "Crear alumno"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
