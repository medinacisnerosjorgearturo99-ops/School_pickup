import { useMemo, useState, type ReactNode } from "react"
import {
  Cake,
  FileText,
  Filter,
  GraduationCap,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Upload,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"
import { useSchool, type GuardianDraft, type StudentDraft } from "../context/SchoolContext"
import { academicBadge, colorClass } from "../lib/grades"
import { formatDate } from "../lib/format"
import {
  ageYears,
  attendanceSeries,
  avatarTone,
  daysUntilBirthday,
  formatDayMonth,
  guardianKindLabel,
  isBirthdaySoon,
  pickupHistory,
  studentDocuments,
  studentFullName,
  studentInitials,
} from "../lib/students"
import type { AcademicStatus, GradeGroup, Guardian, Student } from "../types/school"
import { ImportStudentsModal } from "../components/alumnos/ImportStudentsModal"
import { StudentEditorModal } from "../components/alumnos/StudentEditorModal"
import { Card } from "../components/ui/Card"
import { KebabMenu } from "../components/ui/KebabMenu"
import { MenuSelect } from "../components/ui/MenuSelect"
import { Modal } from "../components/ui/Modal"
import { ThemeToggle } from "../components/ui/ThemeToggle"

const PAGE_SIZE = 8
const PREFERRED_ID = "lucas"
const PREFERRED_GRADE = "2º Primaria"

type StatusFilter = "todos" | AcademicStatus
type DetailTab = "info" | "academico" | "asistencia" | "salud" | "documentos" | "historial"

const tabs: { id: DetailTab; label: string }[] = [
  { id: "info", label: "Información general" },
  { id: "academico", label: "Académico" },
  { id: "asistencia", label: "Asistencia" },
  { id: "salud", label: "Salud" },
  { id: "documentos", label: "Documentos" },
  { id: "historial", label: "Historial" },
]

export function AlumnosPage() {
  const { school, cycleId, saveStudent, deleteStudent, importStudents } = useSchool()
  const [query, setQuery] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("preferred")
  const [groupFilter, setGroupFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("activo")
  const [birthdayOnly, setBirthdayOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [studentId, setStudentId] = useState<string | null>(PREFERRED_ID)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tab, setTab] = useState<DetailTab>("info")
  const [formStudent, setFormStudent] = useState<Student | null | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [flash, setFlash] = useState("")
  const [error, setError] = useState("")

  const cycleGroups = useMemo(
    () => school.groups.filter((group) => group.cycleId === cycleId).sort((a, b) => a.grade.localeCompare(b.grade) || a.letter.localeCompare(b.letter)),
    [cycleId, school.groups],
  )
  const cycleGrades = useMemo(
    () => school.grades.filter((grade) => grade.cycleId === cycleId).sort((a, b) => a.order - b.order),
    [cycleId, school.grades],
  )
  const preferredGradeId = cycleGrades.find((grade) => grade.name === PREFERRED_GRADE)?.id ?? "todos"
  const effectiveGrade = gradeFilter === "preferred" ? preferredGradeId : gradeFilter

  const cycleStudents = useMemo(
    () => school.students.filter((student) => student.cycleId === cycleId),
    [cycleId, school.students],
  )

  const groupById = useMemo(() => new Map(cycleGroups.map((group) => [group.id, group])), [cycleGroups])
  const guardianById = useMemo(() => new Map(school.guardians.map((guardian) => [guardian.id, guardian])), [school.guardians])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cycleStudents
      .filter((student) => {
        const group = groupById.get(student.groupId)
        if (!group) return false
        if (effectiveGrade !== "todos" && group.gradeId !== effectiveGrade) return false
        if (groupFilter !== "todos" && group.id !== groupFilter) return false
        if (statusFilter !== "todos" && student.status !== statusFilter) return false
        if (birthdayOnly && !isBirthdaySoon(student.birthDate)) return false
        if (needle.length === 0) return true
        const guardianNames = student.guardianIds.map((id) => guardianById.get(id)?.name ?? "").join(" ")
        return `${studentFullName(student)} ${student.matricula} ${guardianNames}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => {
        const groupA = groupById.get(a.groupId)
        const groupB = groupById.get(b.groupId)
        const grade = (groupA?.grade ?? "").localeCompare(groupB?.grade ?? "")
        if (grade !== 0) return grade
        const letter = (groupA?.letter ?? "").localeCompare(groupB?.letter ?? "")
        if (letter !== 0) return letter
        if (a.id === PREFERRED_ID) return -1
        if (b.id === PREFERRED_ID) return 1
        return studentFullName(a).localeCompare(studentFullName(b), "es")
      })
  }, [birthdayOnly, cycleStudents, effectiveGrade, groupById, groupFilter, guardianById, query, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)

  const selected =
    cycleStudents.find((student) => student.id === studentId) ??
    cycleStudents.find((student) => student.id === PREFERRED_ID) ??
    filtered[0] ??
    cycleStudents[0]

  const selectedGroup = selected ? groupById.get(selected.groupId) : undefined
  const groupsForGrade = effectiveGrade === "todos" ? cycleGroups : cycleGroups.filter((group) => group.gradeId === effectiveGrade)

  const activos = cycleStudents.filter((student) => student.status === "activo").length
  const inactivos = cycleStudents.length - activos
  const nuevos = cycleStudents.filter((student) => student.isNew).length
  const previousNew = school.students.filter((student) => student.cycleId !== cycleId && student.isNew).length
  const newDelta = previousNew === 0 ? 100 : Math.round(((nuevos - previousNew) / previousNew) * 100)
  const avgAttendance =
    cycleStudents.length === 0
      ? 0
      : Math.round(cycleStudents.reduce((sum, student) => sum + student.attendancePct, 0) / cycleStudents.length)
  const upcomingBirthdays = cycleStudents.filter((student) => student.status === "activo" && isBirthdaySoon(student.birthDate)).length

  function notice(message: string) {
    setFlash(message)
    setError("")
    window.setTimeout(() => setFlash(""), 3200)
  }

  function resetPage() {
    setPage(1)
  }

  function handleSave(draft: StudentDraft, id?: string) {
    const result = saveStudent(draft, id)
    if ("error" in result) return result
    setFormStudent(undefined)
    setStudentId(result.id)
    notice(id ? "Alumno actualizado." : "Alumno dado de alta.")
    return result
  }

  function handleDelete() {
    if (!selected) return
    const result = deleteStudent(selected.id)
    setConfirmDelete(false)
    if (result) {
      setError(result)
      return
    }
    setStudentId(null)
    notice(`Se eliminó a ${studentFullName(selected)}.`)
  }

  function handleImport(csv: string) {
    const result = importStudents(csv)
    if ("error" in result) return result
    setImportOpen(false)
    notice(`Se importaron ${result.count} alumno${result.count === 1 ? "" : "s"}.`)
    return result
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const pageSelected = pageItems.length > 0 && pageItems.every((student) => selectedIds.includes(student.id))

  if (!selected) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <h1 className="text-[28px] font-extrabold">Alumnos</h1>
        <p className="mt-2 text-sm text-app-muted">Aún no hay alumnos en este ciclo.</p>
        <button type="button" onClick={() => setFormStudent(null)} className="mt-4 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white">
          + Nuevo alumno
        </button>
        {formStudent !== undefined ? (
          <StudentEditorModal student={formStudent} groups={cycleGroups} guardians={school.guardians} onClose={() => setFormStudent(undefined)} onSave={handleSave} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Alumnos</h1>
          <p className="mt-1 text-sm text-app-muted">Gestiona la información académica y personal de los alumnos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover"
          >
            <Upload size={16} />
            Importar alumnos
          </button>
          <button
            type="button"
            onClick={() => setFormStudent(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover"
          >
            <Plus size={16} />
            Nuevo alumno
          </button>
        </div>
      </header>

      {flash ? <p className="rounded-xl border border-app-green/30 bg-app-green-soft px-4 py-3 text-sm font-medium text-app-green">{flash}</p> : null}
      {error ? <p className="rounded-xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm font-medium text-app-danger">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatMini label="Total alumnos" value={String(cycleStudents.length)} hint={`Activos: ${activos}`} iconClass="bg-app-blue-soft text-app-primary" icon={<Users size={20} />} />
        <StatMini
          label="Nuevos este ciclo"
          value={String(nuevos)}
          hint={`${newDelta >= 0 ? "+" : ""}${newDelta}% vs ciclo anterior`}
          iconClass="bg-app-green-soft text-app-green"
          icon={<UserPlus size={20} />}
        />
        <StatMini label="Porcentaje de asistencia" value={`${avgAttendance}%`} hint="Promedio general" iconClass="bg-app-purple-soft text-app-purple" icon={<GraduationCap size={20} />} />
        <StatMini
          label="Alumnos inactivos"
          value={String(inactivos)}
          hint={cycleStudents.length === 0 ? "0% del total" : `${((inactivos / cycleStudents.length) * 100).toFixed(1)}% del total`}
          iconClass="bg-app-orange-soft text-app-orange"
          icon={<UserMinus size={20} />}
        />
        <StatMini label="Cumpleaños próximos" value={String(upcomingBirthdays)} hint="En los próximos 7 días" iconClass="bg-app-blue-soft text-app-primary" icon={<Cake size={20} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.9fr)]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          <h2 className="text-base font-bold">Lista de alumnos</h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="relative min-w-0">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  resetPage()
                }}
                placeholder="Buscar alumno..."
                className="w-full rounded-xl border border-app-line bg-app-bg py-2.5 pr-3 pl-9 text-sm outline-none focus:border-app-primary"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <MenuSelect
                ariaLabel="Filtrar por grado"
                value={effectiveGrade}
                align="left"
                className="min-w-[140px] flex-1"
                options={[{ value: "todos", label: "Todos los grados" }, ...cycleGrades.map((grade) => ({ value: grade.id, label: grade.name }))]}
                onChange={(value) => {
                  setGradeFilter(value)
                  setGroupFilter("todos")
                  resetPage()
                }}
              />
              <MenuSelect
                ariaLabel="Filtrar por grupo"
                value={groupFilter}
                align="left"
                className="min-w-[120px] flex-1"
                options={[{ value: "todos", label: "Todos los grupos" }, ...groupsForGrade.map((group) => ({ value: group.id, label: group.letter }))]}
                onChange={(value) => {
                  setGroupFilter(value)
                  resetPage()
                }}
              />
              <MenuSelect
                ariaLabel="Filtrar por estado"
                value={statusFilter}
                align="left"
                className="min-w-[150px] flex-1"
                options={[
                  { value: "todos", label: "Estado: Todos" },
                  { value: "activo", label: "Estado: Activo" },
                  { value: "inactivo", label: "Estado: Inactivo" },
                ]}
                onChange={(value) => {
                  setStatusFilter(value)
                  resetPage()
                }}
              />
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  filtersOpen || birthdayOnly ? "border-app-primary text-app-primary" : "border-app-line hover:bg-app-card-hover"
                }`}
              >
                <Filter size={15} />
                Filtros
              </button>
            </div>
            {filtersOpen ? (
              <label className="flex items-center gap-2 text-sm font-medium text-app-secondary">
                <input type="checkbox" className="accent-[var(--primary)]" checked={birthdayOnly} onChange={(event) => { setBirthdayOnly(event.target.checked); resetPage() }} />
                Solo cumpleaños en los próximos 7 días
              </label>
            ) : null}
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-[11px] font-bold tracking-wide text-app-muted uppercase">
                <tr>
                  <th className="w-10 px-2">
                    <input
                      type="checkbox"
                      className="accent-[var(--primary)]"
                      checked={pageSelected}
                      onChange={(event) => {
                        const ids = pageItems.map((student) => student.id)
                        setSelectedIds((current) =>
                          event.target.checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
                        )
                      }}
                      aria-label="Seleccionar página"
                    />
                  </th>
                  <th className="px-2">Alumno</th>
                  <th className="px-2">Grado</th>
                  <th className="px-2">Grupo</th>
                  <th className="px-2">Responsable</th>
                  <th className="px-2">Asistencia</th>
                  <th className="px-2">Estado</th>
                  <th className="w-10 px-2" />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-10 text-center text-app-muted">
                      No hay alumnos con esos filtros.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((student) => {
                    const group = groupById.get(student.groupId)
                    const guardian = student.guardianIds.map((id) => guardianById.get(id)).find(Boolean)
                    const badge = academicBadge(student.status)
                    const active = student.id === selected.id
                    return (
                      <tr key={student.id}>
                        <td className="px-2">
                          <input
                            type="checkbox"
                            className="accent-[var(--primary)]"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => toggleSelect(student.id)}
                            aria-label={`Seleccionar ${studentFullName(student)}`}
                          />
                        </td>
                        <td colSpan={6} className="p-0">
                          <button
                            type="button"
                            onClick={() => {
                              setStudentId(student.id)
                              setTab("info")
                            }}
                            className={`grid w-full grid-cols-[minmax(0,1.4fr)_0.9fr_0.5fr_minmax(0,1.2fr)_0.9fr_0.7fr] items-center gap-2 rounded-2xl border px-2 py-2.5 text-left ${
                              active ? "border-app-primary bg-app-primary-soft/30" : "border-transparent hover:bg-app-card-hover"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <Avatar student={student} />
                              <span className="min-w-0">
                                <span className="block truncate font-bold">{studentFullName(student)}</span>
                                <span className="text-[11px] text-app-muted">Matrícula: {student.matricula}</span>
                              </span>
                            </span>
                            <span className="truncate text-app-secondary">{group?.grade ?? "—"}</span>
                            <span className="font-semibold">{group?.letter ?? "—"}</span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{guardian?.name ?? "Sin responsable"}</span>
                              <span className="text-[11px] text-app-muted">{guardian?.relation ?? ""}</span>
                            </span>
                            <span>
                              <span className="text-xs font-bold">{student.attendancePct}%</span>
                              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-app-line">
                                <span className="block h-full rounded-full bg-app-green" style={{ width: `${student.attendancePct}%` }} />
                              </span>
                            </span>
                            <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
                          </button>
                        </td>
                        <td className="px-1">
                          <KebabMenu
                            ariaLabel={`Acciones de ${studentFullName(student)}`}
                            items={[
                              { id: "edit", label: "Editar", onClick: () => setFormStudent(student) },
                              {
                                id: "status",
                                label: student.status === "activo" ? "Dar de baja" : "Reactivar",
                                onClick: () =>
                                  handleSave({
                                    firstName: student.firstName,
                                    lastName: student.lastName,
                                    groupId: student.groupId,
                                    status: student.status === "activo" ? "inactivo" : "activo",
                                    birthDate: student.birthDate,
                                    gender: student.gender,
                                    curp: student.curp,
                                    address: student.address,
                                    bloodType: student.bloodType,
                                    allergies: student.allergies,
                                    medicalNotes: student.medicalNotes,
                                    guardians: guardianDrafts(student, school.guardians),
                                  }, student.id),
                              },
                              {
                                id: "delete",
                                label: "Eliminar",
                                danger: true,
                                onClick: () => {
                                  setStudentId(student.id)
                                  setConfirmDelete(true)
                                },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-line pt-4 text-sm">
            <p className="text-app-muted">
              Mostrando {from} a {to} de {filtered.length} alumnos
              {selectedIds.length > 0 ? ` · ${selectedIds.length} seleccionados` : ""}
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          </div>
        </Card>

        <DetailPanel
          student={selected}
          group={selectedGroup}
          guardians={selected.guardianIds.map((id) => guardianById.get(id)).filter((item): item is Guardian => Boolean(item))}
          tab={tab}
          onTab={setTab}
          onEdit={() => setFormStudent(selected)}
          onDelete={() => setConfirmDelete(true)}
          onGreet={() => notice(`Se envió una felicitación a los responsables de ${studentFullName(selected)}.`)}
          onCalendar={() => setCalendarOpen(true)}
        />
      </div>

      {formStudent !== undefined ? (
        <StudentEditorModal student={formStudent} groups={cycleGroups} guardians={school.guardians} onClose={() => setFormStudent(undefined)} onSave={handleSave} />
      ) : null}
      {importOpen ? <ImportStudentsModal onClose={() => setImportOpen(false)} onImport={handleImport} /> : null}
      {calendarOpen ? (
        <Modal title="Calendario de cumpleaños" onClose={() => setCalendarOpen(false)}>
          <p className="text-sm text-app-secondary">
            El cumpleaños de <strong>{studentFullName(selected)}</strong> es el {formatDayMonth(selected.birthDate)}. Faltan {daysUntilBirthday(selected.birthDate)} días.
          </p>
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={() => setCalendarOpen(false)} className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white">
              Cerrar
            </button>
          </div>
        </Modal>
      ) : null}
      {confirmDelete ? (
        <Modal title="Eliminar alumno" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm leading-6 text-app-secondary">
            ¿Eliminar a <strong>{studentFullName(selected)}</strong> del padrón de este ciclo? El conteo del grupo se actualizará.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover">
              Cancelar
            </button>
            <button type="button" onClick={handleDelete} className="rounded-xl bg-app-danger px-4 py-2.5 text-sm font-semibold text-white">
              Eliminar
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function DetailPanel({
  student,
  group,
  guardians,
  tab,
  onTab,
  onEdit,
  onDelete,
  onGreet,
  onCalendar,
}: {
  student: Student
  group: GradeGroup | undefined
  guardians: Guardian[]
  tab: DetailTab
  onTab: (tab: DetailTab) => void
  onEdit: () => void
  onDelete: () => void
  onGreet: () => void
  onCalendar: () => void
}) {
  const badge = academicBadge(student.status)
  const days = daysUntilBirthday(student.birthDate)

  return (
    <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-bold">Información del alumno</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-xl border border-app-line px-3 py-1.5 text-xs font-semibold hover:bg-app-card-hover">
            <Pencil size={13} />
            Editar
          </button>
          <KebabMenu
            ariaLabel="Más acciones"
            items={[
              { id: "edit", label: "Editar ficha", onClick: onEdit },
              { id: "greet", label: "Enviar felicitación", onClick: onGreet },
              { id: "delete", label: "Eliminar", danger: true, onClick: onDelete },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="relative">
          <Avatar student={student} large />
          <span className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-app-card ${student.status === "activo" ? "bg-app-green" : "bg-app-muted"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold">{studentFullName(student)}</h3>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
          </div>
          <p className="text-xs text-app-muted">Matrícula: {student.matricula}</p>
          <p className="text-xs text-app-muted">{group ? `${group.grade} - ${group.letter}` : "Sin grupo"}</p>
          <p className="mt-1 text-xs text-app-secondary">
            {formatDate(student.birthDate)} · {ageYears(student.birthDate)} años · Alta {formatDate(student.enrolledAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-app-line">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={`shrink-0 border-b-2 px-2.5 py-2 text-xs font-semibold ${
              tab === item.id ? "border-app-primary text-app-primary" : "border-transparent text-app-muted hover:text-app-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {tab === "info" ? (
          <div className="flex flex-col gap-5">
            <section>
              <h4 className="mb-3 text-sm font-bold">Datos personales</h4>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Info label="Nombre completo" value={studentFullName(student)} />
                <Info label="CURP" value={student.curp} />
                <Info label="Sexo" value={student.gender} />
                <Info label="Nacionalidad" value={student.nationality} />
                <Info label="Domicilio" value={student.address} />
              </dl>
            </section>
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold">Responsables</h4>
                <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-app-primary hover:bg-app-primary-soft">
                  <UserPlus size={13} />
                  Agregar
                </button>
              </div>
              {guardians.length === 0 ? (
                <p className="text-sm text-app-muted">Sin responsables asignados. Agrégalos al editar al alumno.</p>
              ) : (
                <ul className="space-y-2">
                  {guardians.map((guardian) => (
                    <li key={guardian.id} className="rounded-2xl border border-app-line px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold">{guardian.name}</p>
                        <span className="rounded-md bg-app-blue-soft px-2 py-0.5 text-[11px] font-bold text-app-primary">{guardian.relation}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-app-muted">{guardianKindLabel(guardian.kind)}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-app-muted">
                        <Phone size={12} /> {guardian.phone || "Sin teléfono"}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-app-muted">
                        <Mail size={12} /> {guardian.email}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h4 className="mb-3 text-sm font-bold">Información adicional</h4>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Info label="Tipo de sangre" value={student.bloodType} />
                <Info label="Alergias" value={student.allergies} />
                <Info label="Observaciones" value={student.medicalNotes} />
              </dl>
            </section>
            <section className="rounded-2xl border border-app-line p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-app-blue-soft text-app-primary">
                  <Cake size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Cumpleaños</p>
                  <p className="text-sm">{formatDayMonth(student.birthDate)}</p>
                  <p className="text-xs text-app-muted">{days === 0 ? "Hoy" : `Faltan ${days} días`}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={onGreet} className="rounded-xl bg-app-primary px-3 py-2 text-xs font-semibold text-white">
                      Enviar felicitación
                    </button>
                    <button type="button" onClick={onCalendar} className="rounded-xl border border-app-line px-3 py-2 text-xs font-semibold hover:bg-app-card-hover">
                      Ver calendario
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}
        {tab === "academico" ? (
          <dl className="grid gap-3">
            <Info label="Grado" value={group?.grade ?? "—"} />
            <Info label="Grupo" value={group?.letter ?? "—"} />
            <Info label="Aula" value={group?.classroom ?? "—"} />
            <Info label="Turno" value={group?.shift ?? "—"} />
            <Info label="Matrícula" value={student.matricula} />
            <Info label="Fecha de inscripción" value={formatDate(student.enrolledAt)} />
            <Info label="Alumno nuevo" value={student.isNew ? "Sí, ingresó este ciclo" : "Reinscrito"} />
          </dl>
        ) : null}
        {tab === "asistencia" ? (
          <div>
            <p className="text-3xl font-extrabold">{student.attendancePct}%</p>
            <p className="text-xs text-app-muted">Promedio del ciclo</p>
            <ul className="mt-4 space-y-2">
              {attendanceSeries(student.attendancePct).map((item) => (
                <li key={item.label}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span>{item.label}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-app-line">
                    <div className="h-full rounded-full bg-app-green" style={{ width: `${item.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {tab === "salud" ? (
          <dl className="grid gap-3">
            <Info label="Tipo de sangre" value={student.bloodType} />
            <Info label="Alergias" value={student.allergies} />
            <Info label="Observaciones médicas" value={student.medicalNotes} />
          </dl>
        ) : null}
        {tab === "documentos" ? (
          <ul className="space-y-2">
            {studentDocuments(student).map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-app-line px-3 py-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-app-bg text-app-muted">
                  <FileText size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{doc.name}</p>
                  <p className="text-xs text-app-muted">{doc.kind} · {formatDate(doc.uploadedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {tab === "historial" ? (
          <ul className="space-y-2">
            {pickupHistory(student).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-app-line px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{item.status}</p>
                  <p className="flex items-center gap-1 text-xs text-app-muted">
                    <MapPin size={11} /> {item.zone} · {formatDate(item.date)}
                  </p>
                </div>
                <History size={14} className="text-app-muted" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  )
}

function Avatar({ student, large = false }: { student: Student; large?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full text-xs font-extrabold ${large ? "size-16 text-lg" : "size-10"} ${colorClass(avatarTone(student.id))}`}>
      {studentInitials(student)}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-app-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
    </div>
  )
}

function StatMini({
  label,
  value,
  hint,
  icon,
  iconClass,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
  iconClass: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-app-muted">{label}</p>
          <p className="mt-2 truncate text-[28px] font-extrabold leading-none tracking-tight">{value}</p>
          <p className="mt-2 text-xs font-medium text-app-muted">{hint}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconClass}`}>{icon}</span>
      </div>
    </Card>
  )
}

function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  const items = pageWindow(page, pageCount)
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-app-line px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40">
        Anterior
      </button>
      {items.map((item, index) =>
        item === "…" ? (
          <span key={`e${index}`} className="px-1 text-app-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-bold ${
              item === page ? "bg-app-primary text-white" : "border border-app-line hover:bg-app-card-hover"
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)} className="rounded-lg border border-app-line px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40">
        Siguiente
      </button>
    </div>
  )
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 3) return [1, 2, 3, 4, "…", total]
  if (current >= total - 2) return [1, "…", total - 3, total - 2, total - 1, total]
  return [1, "…", current - 1, current, current + 1, "…", total]
}

function guardianDrafts(student: Student, guardians: Guardian[]): GuardianDraft[] {
  return student.guardianIds.flatMap((id) => {
    const guardian = guardians.find((item) => item.id === id)
    if (!guardian) return []
    return [
      {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone,
        relation: guardian.relation,
        kind: guardian.kind,
      },
    ]
  })
}
