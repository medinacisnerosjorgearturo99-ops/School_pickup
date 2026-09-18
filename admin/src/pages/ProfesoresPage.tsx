import { useMemo, useState, type ReactNode } from "react"
import {
  BookOpen,
  FileText,
  Filter,
  GraduationCap,
  History,
  Pencil,
  Plus,
  Search,
  Star,
  Upload,
  UserPlus,
  Users,
} from "lucide-react"
import { useSchool, type TeacherDraft } from "../context/SchoolContext"
import { academicBadge, colorClass } from "../lib/grades"
import { formatDate, teacherName } from "../lib/format"
import { avatarTone, studentInitials } from "../lib/students"
import {
  assignedGroups,
  groupLabels,
  seniorityPhrase,
  subjectBadgeClass,
  teacherDocuments,
  teacherEvaluations,
  TEACHER_AREAS,
  TEACHER_SUBJECTS,
  upcomingClasses,
} from "../lib/teachers"
import type { GradeGroup, Teacher } from "../types/school"
import { ImportTeachersModal } from "../components/profesores/ImportTeachersModal"
import { TeacherEditorModal } from "../components/profesores/TeacherEditorModal"
import { Card } from "../components/ui/Card"
import { KebabMenu } from "../components/ui/KebabMenu"
import { MenuSelect } from "../components/ui/MenuSelect"
import { Modal } from "../components/ui/Modal"
import { ThemeToggle } from "../components/ui/ThemeToggle"

type StatusFilter = "todos" | "activo" | "inactivo"
type DetailTab = "info" | "asignaturas" | "horarios" | "evaluaciones" | "documentos" | "historial"

const tabs: { id: DetailTab; label: string }[] = [
  { id: "info", label: "Información general" },
  { id: "asignaturas", label: "Asignaturas" },
  { id: "horarios", label: "Horarios" },
  { id: "evaluaciones", label: "Evaluaciones" },
  { id: "documentos", label: "Documentos" },
  { id: "historial", label: "Historial" },
]

export function ProfesoresPage() {
  const { school, cycleId, saveTeacher, deleteTeacher, importTeachers } = useSchool()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")
  const [subjectFilter, setSubjectFilter] = useState("todas")
  const [areaFilter, setAreaFilter] = useState("todas")
  const [newOnly, setNewOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tab, setTab] = useState<DetailTab>("info")
  const [formTeacher, setFormTeacher] = useState<Teacher | null | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [flash, setFlash] = useState("")
  const [error, setError] = useState("")

  const cycleTeachers = useMemo(
    () => school.teachers.filter((teacher) => teacher.cycleIds.includes(cycleId)),
    [cycleId, school.teachers],
  )
  const cycleGroups = useMemo(
    () => school.groups.filter((group) => group.cycleId === cycleId),
    [cycleId, school.groups],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cycleTeachers
      .filter((teacher) => {
        if (statusFilter === "activo" && !teacher.active) return false
        if (statusFilter === "inactivo" && teacher.active) return false
        if (subjectFilter !== "todas" && !teacher.subjects.includes(subjectFilter)) return false
        if (areaFilter !== "todas" && teacher.area !== areaFilter) return false
        if (newOnly && !teacher.isNew) return false
        if (needle.length === 0) return true
        return `${teacherName(teacher.firstName, teacher.lastName)} ${teacher.email} ${teacher.employeeId} ${teacher.subjects.join(" ")}`
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => teacherName(a.firstName, a.lastName).localeCompare(teacherName(b.firstName, b.lastName), "es"))
  }, [areaFilter, cycleTeachers, newOnly, query, statusFilter, subjectFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, filtered.length)

  const selected =
    cycleTeachers.find((teacher) => teacher.id === teacherId) ??
    filtered[0] ??
    cycleTeachers[0]

  const activos = cycleTeachers.filter((teacher) => teacher.active).length
  const nuevos = cycleTeachers.filter((teacher) => teacher.isNew).length
  const previousNew = school.teachers.filter((teacher) => !teacher.cycleIds.includes(cycleId) && teacher.isNew).length
  const newDelta = previousNew === 0 ? 100 : Math.round(((nuevos - previousNew) / previousNew) * 100)
  const subjectAssignments = cycleTeachers.reduce((sum, teacher) => sum + teacher.subjects.length, 0)
  const hours = cycleTeachers.reduce((sum, teacher) => sum + teacher.hoursPerWeek, 0)
  const avgRating =
    cycleTeachers.length === 0
      ? 0
      : Math.round((cycleTeachers.reduce((sum, teacher) => sum + teacher.rating, 0) / cycleTeachers.length) * 10) / 10

  function notice(message: string) {
    setFlash(message)
    setError("")
    window.setTimeout(() => setFlash(""), 3200)
  }

  function handleSave(draft: TeacherDraft, id?: string) {
    const result = saveTeacher(draft, id)
    if ("error" in result) return result
    setFormTeacher(undefined)
    setTeacherId(result.id)
    notice(id ? "Profesor actualizado." : "Profesor dado de alta.")
    return result
  }

  function handleDelete() {
    if (!selected) return
    const result = deleteTeacher(selected.id)
    setConfirmDelete(false)
    if (result) {
      setError(result)
      return
    }
    setTeacherId(null)
    notice(`Se eliminó a ${teacherName(selected.firstName, selected.lastName)}.`)
  }

  function handleImport(csv: string) {
    const result = importTeachers(csv)
    if ("error" in result) return result
    setImportOpen(false)
    notice(`Se importaron ${result.count} profesor${result.count === 1 ? "" : "es"}.`)
    return result
  }

  const pageSelected = pageItems.length > 0 && pageItems.every((teacher) => selectedIds.includes(teacher.id))

  if (!selected) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <h1 className="text-[28px] font-extrabold">Profesores</h1>
        <p className="mt-2 text-sm text-app-muted">
          {cycleId ? "Aún no hay profesores en este ciclo." : "Crea un ciclo escolar primero para poder dar de alta profesores."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover"
          >
            Importar profesores
          </button>
          <button
            type="button"
            disabled={!cycleId}
            onClick={() => setFormTeacher(null)}
            className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            + Nuevo profesor
          </button>
        </div>
        {formTeacher !== undefined ? (
          <TeacherEditorModal teacher={formTeacher} onClose={() => setFormTeacher(undefined)} onSave={handleSave} />
        ) : null}
        {importOpen ? <ImportTeachersModal onClose={() => setImportOpen(false)} onImport={handleImport} /> : null}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Profesores</h1>
          <p className="mt-1 text-sm text-app-muted">Gestiona la información académica y laboral del personal docente.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <button type="button" onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover">
            <Upload size={16} />
            Importar profesores
          </button>
          <button type="button" onClick={() => setFormTeacher(null)} className="inline-flex items-center gap-2 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover">
            <Plus size={16} />
            Nuevo profesor
          </button>
        </div>
      </header>

      {flash ? <p className="rounded-xl border border-app-green/30 bg-app-green-soft px-4 py-3 text-sm font-medium text-app-green">{flash}</p> : null}
      {error ? <p className="rounded-xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm font-medium text-app-danger">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatMini label="Total profesores" value={String(cycleTeachers.length)} hint={`Activos: ${activos}`} iconClass="bg-app-blue-soft text-app-primary" icon={<Users size={20} />} />
        <StatMini label="Nuevos este ciclo" value={String(nuevos)} hint={`${newDelta >= 0 ? "+" : ""}${newDelta}% vs ciclo anterior`} iconClass="bg-app-green-soft text-app-green" icon={<UserPlus size={20} />} />
        <StatMini label="Asignaturas impartidas" value={String(subjectAssignments)} hint="Total este ciclo" iconClass="bg-app-purple-soft text-app-purple" icon={<GraduationCap size={20} />} />
        <StatMini label="Horas asignadas" value={String(hours)} hint="Promedio por semana" iconClass="bg-app-orange-soft text-app-orange" icon={<BookOpen size={20} />} />
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-app-muted">Evaluación promedio</p>
              <p className="mt-2 text-[28px] font-extrabold leading-none tracking-tight">{avgRating.toFixed(1)}</p>
              <div className="mt-2">
                <Stars value={avgRating} />
              </div>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-app-blue-soft text-app-primary">
              <Star size={20} />
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.9fr)]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          <h2 className="text-base font-bold">Lista de profesores</h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="relative">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar profesor..."
                className="w-full rounded-xl border border-app-line bg-app-bg py-2.5 pr-3 pl-9 text-sm outline-none focus:border-app-primary"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <MenuSelect
                ariaLabel="Estado"
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
                  setPage(1)
                }}
              />
              <MenuSelect
                ariaLabel="Asignatura"
                value={subjectFilter}
                align="left"
                className="min-w-[160px] flex-1"
                options={[{ value: "todas", label: "Asignatura: Todas" }, ...TEACHER_SUBJECTS.map((item) => ({ value: item, label: item }))]}
                onChange={(value) => {
                  setSubjectFilter(value)
                  setPage(1)
                }}
              />
              <MenuSelect
                ariaLabel="Área"
                value={areaFilter}
                align="left"
                className="min-w-[150px] flex-1"
                options={[{ value: "todas", label: "Área: Todas" }, ...TEACHER_AREAS.map((item) => ({ value: item, label: item }))]}
                onChange={(value) => {
                  setAreaFilter(value)
                  setPage(1)
                }}
              />
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  filtersOpen || newOnly ? "border-app-primary text-app-primary" : "border-app-line hover:bg-app-card-hover"
                }`}
              >
                <Filter size={15} />
                Filtros
              </button>
            </div>
            {filtersOpen ? (
              <label className="flex items-center gap-2 text-sm font-medium text-app-secondary">
                <input type="checkbox" className="accent-[var(--primary)]" checked={newOnly} onChange={(event) => { setNewOnly(event.target.checked); setPage(1) }} />
                Solo nuevos este ciclo
              </label>
            ) : null}
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-[11px] font-bold tracking-wide text-app-muted uppercase">
                <tr>
                  <th className="w-10 px-2">
                    <input
                      type="checkbox"
                      className="accent-[var(--primary)]"
                      checked={pageSelected}
                      onChange={(event) => {
                        const ids = pageItems.map((teacher) => teacher.id)
                        setSelectedIds((current) =>
                          event.target.checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
                        )
                      }}
                      aria-label="Seleccionar página"
                    />
                  </th>
                  <th className="px-2">Profesor</th>
                  <th className="px-2">Asignaturas</th>
                  <th className="px-2">Grados / Grupos</th>
                  <th className="px-2">Correo</th>
                  <th className="px-2">Estado</th>
                  <th className="w-10 px-2" />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-10 text-center text-app-muted">
                      No hay profesores con esos filtros.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((teacher) => {
                    const groups = assignedGroups(teacher, cycleGroups, cycleId)
                    const badge = academicBadge(teacher.active ? "activo" : "inactivo")
                    const activeRow = teacher.id === selected.id
                    return (
                      <tr key={teacher.id}>
                        <td className="px-2">
                          <input
                            type="checkbox"
                            className="accent-[var(--primary)]"
                            checked={selectedIds.includes(teacher.id)}
                            onChange={() =>
                              setSelectedIds((current) =>
                                current.includes(teacher.id) ? current.filter((id) => id !== teacher.id) : [...current, teacher.id],
                              )
                            }
                            aria-label={`Seleccionar ${teacherName(teacher.firstName, teacher.lastName)}`}
                          />
                        </td>
                        <td colSpan={5} className="p-0">
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherId(teacher.id)
                              setTab("info")
                            }}
                            className={`grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_0.8fr_minmax(0,1fr)_0.6fr] items-center gap-2 rounded-2xl border px-2 py-2.5 text-left ${
                              activeRow ? "border-app-primary bg-app-primary-soft/30" : "border-transparent hover:bg-app-card-hover"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <Avatar teacher={teacher} />
                              <span className="min-w-0">
                                <span className="block truncate font-bold">{teacherName(teacher.firstName, teacher.lastName)}</span>
                                <span className="text-[11px] text-app-muted">ID: {teacher.employeeId}</span>
                              </span>
                            </span>
                            <span className="flex flex-wrap gap-1">
                              {teacher.subjects.map((subject) => (
                                <span key={subject} className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${subjectBadgeClass(subject)}`}>
                                  {subject}
                                </span>
                              ))}
                            </span>
                            <span className="truncate text-xs font-semibold text-app-secondary">{groupLabels(groups).join(", ") || "—"}</span>
                            <span className="truncate text-xs text-app-muted">{teacher.email}</span>
                            <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
                          </button>
                        </td>
                        <td className="px-1">
                          <KebabMenu
                            ariaLabel={`Acciones de ${teacherName(teacher.firstName, teacher.lastName)}`}
                            items={[
                              { id: "edit", label: "Editar", onClick: () => setFormTeacher(teacher) },
                              {
                                id: "status",
                                label: teacher.active ? "Dar de baja" : "Reactivar",
                                onClick: () => handleSave(draftFromTeacher(teacher, { active: !teacher.active }), teacher.id),
                              },
                              {
                                id: "delete",
                                label: "Eliminar",
                                danger: true,
                                onClick: () => {
                                  setTeacherId(teacher.id)
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
              Mostrando {from} a {to} de {filtered.length} profesores
              {selectedIds.length > 0 ? ` · ${selectedIds.length} seleccionados` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <MenuSelect
                ariaLabel="Filas por página"
                value={String(pageSize) as "8" | "16" | "24"}
                options={[
                  { value: "8", label: "8 por página" },
                  { value: "16", label: "16 por página" },
                  { value: "24", label: "24 por página" },
                ]}
                onChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              />
              <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
        </Card>

        <DetailPanel
          teacher={selected}
          groups={cycleGroups}
          cycleId={cycleId}
          tab={tab}
          onTab={setTab}
          onEdit={() => setFormTeacher(selected)}
          onDelete={() => setConfirmDelete(true)}
        />
      </div>

      {formTeacher !== undefined ? (
        <TeacherEditorModal teacher={formTeacher} onClose={() => setFormTeacher(undefined)} onSave={handleSave} />
      ) : null}
      {importOpen ? <ImportTeachersModal onClose={() => setImportOpen(false)} onImport={handleImport} /> : null}
      {confirmDelete ? (
        <Modal title="Eliminar profesor" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm leading-6 text-app-secondary">
            ¿Eliminar a <strong>{teacherName(selected.firstName, selected.lastName)}</strong> del ciclo? Si es titular de un grupo, reasígnalo primero.
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

function draftFromTeacher(teacher: Teacher, patch: Partial<TeacherDraft> = {}): TeacherDraft {
  return {
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    active: teacher.active,
    subjects: teacher.subjects,
    area: teacher.area,
    role: teacher.role,
    hoursPerWeek: teacher.hoursPerWeek,
    rating: teacher.rating,
    hiredAt: teacher.hiredAt,
    gender: teacher.gender,
    birthDate: teacher.birthDate,
    curp: teacher.curp,
    rfc: teacher.rfc,
    phone: teacher.phone,
    personalEmail: teacher.personalEmail,
    address: teacher.address,
    ...patch,
  }
}

function DetailPanel({
  teacher,
  groups,
  cycleId,
  tab,
  onTab,
  onEdit,
  onDelete,
}: {
  teacher: Teacher
  groups: GradeGroup[]
  cycleId: string
  tab: DetailTab
  onTab: (tab: DetailTab) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const badge = academicBadge(teacher.active ? "activo" : "inactivo")
  const assigned = assignedGroups(teacher, groups, cycleId)
  const students = assigned.reduce((sum, group) => sum + group.studentCount, 0)
  const classes = upcomingClasses(teacher, groups, cycleId)

  return (
    <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-bold">Información del profesor</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-xl border border-app-line px-3 py-1.5 text-xs font-semibold hover:bg-app-card-hover">
            <Pencil size={13} />
            Editar
          </button>
          <KebabMenu
            ariaLabel="Más acciones"
            items={[
              { id: "edit", label: "Editar ficha", onClick: onEdit },
              { id: "delete", label: "Eliminar", danger: true, onClick: onDelete },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="relative">
          <Avatar teacher={teacher} large />
          <span className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-app-card ${teacher.active ? "bg-app-green" : "bg-app-muted"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold">{teacherName(teacher.firstName, teacher.lastName)}</h3>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
          </div>
          <p className="text-xs text-app-muted">ID: {teacher.employeeId}</p>
          <p className="text-xs text-app-muted">{teacher.role} · {teacher.subjects[0] ?? teacher.area}</p>
          <p className="mt-1 text-xs text-app-secondary">
            Ingreso {formatDate(teacher.hiredAt)} · {seniorityPhrase(teacher.hiredAt)}
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
                <Info label="Fecha de nacimiento" value={formatDate(teacher.birthDate)} />
                <Info label="CURP" value={teacher.curp} />
                <Info label="RFC" value={teacher.rfc} />
                <Info label="Sexo" value={teacher.gender} />
                <Info label="Nacionalidad" value={teacher.nationality} />
                <Info label="Teléfono" value={teacher.phone} />
                <Info label="Correo personal" value={teacher.personalEmail} />
                <Info label="Domicilio" value={teacher.address} />
              </dl>
            </section>
            <section>
              <h4 className="mb-3 text-sm font-bold">Estadísticas del profesor</h4>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Info label="Grupos asignados" value={`${assigned.length} grupos`} />
                <Info label="Alumnos a cargo" value={`${students} alumnos`} />
                <Info label="Horas asignadas / semana" value={`${teacher.hoursPerWeek} horas`} />
                <div>
                  <dt className="text-xs text-app-muted">Evaluación promedio</dt>
                  <dd className="mt-0.5 flex items-center gap-2 text-sm font-semibold">
                    {teacher.rating.toFixed(1)}
                    <Stars value={teacher.rating} />
                  </dd>
                </div>
              </dl>
            </section>
            <section>
              <h4 className="mb-3 text-sm font-bold">Próximas clases</h4>
              {classes.length === 0 ? (
                <p className="text-sm text-app-muted">Sin grupos asignados en este ciclo.</p>
              ) : (
                <ul className="space-y-2">
                  {classes.map((item) => (
                    <li key={item.id} className="rounded-xl border border-app-line px-3 py-2.5">
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-app-muted">
                        {item.subject} · {item.start} · Aula {item.classroom}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
        {tab === "asignaturas" ? (
          <ul className="space-y-2">
            {teacher.subjects.map((subject) => (
              <li key={subject} className={`rounded-xl px-3 py-2.5 text-sm font-bold ${subjectBadgeClass(subject)}`}>
                {subject}
              </li>
            ))}
          </ul>
        ) : null}
        {tab === "horarios" ? (
          <ul className="space-y-2">
            {classes.map((item) => (
              <li key={item.id} className="rounded-xl border border-app-line px-3 py-2.5">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-app-muted">{item.subject} · {item.start} · Aula {item.classroom}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {tab === "evaluaciones" ? (
          teacherEvaluations(teacher).length === 0 ? (
            <p className="text-sm text-app-muted">Sin evaluaciones cargadas.</p>
          ) : (
          <ul className="space-y-2">
            {teacherEvaluations(teacher).map((item) => (
              <li key={item.id} className="rounded-xl border border-app-line px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{item.period}</p>
                  <Stars value={item.rating} />
                </div>
                <p className="mt-1 text-xs text-app-muted">{item.note}</p>
              </li>
            ))}
          </ul>
          )
        ) : null}
        {tab === "documentos" ? (
          teacherDocuments(teacher).length === 0 ? (
            <p className="text-sm text-app-muted">Sin documentos cargados.</p>
          ) : (
          <ul className="space-y-2">
            {teacherDocuments(teacher).map((doc) => (
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
          )
        ) : null}
        {tab === "historial" ? (
          <ul className="space-y-2">
            <li className="flex items-center justify-between rounded-xl border border-app-line px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Alta en el colegio</p>
                <p className="text-xs text-app-muted">{formatDate(teacher.hiredAt)}</p>
              </div>
              <History size={14} className="text-app-muted" />
            </li>
            <li className="flex items-center justify-between rounded-xl border border-app-line px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Asignación al ciclo actual</p>
                <p className="text-xs text-app-muted">{teacher.isNew ? "Ingreso nuevo" : "Recontratación"}</p>
              </div>
              <History size={14} className="text-app-muted" />
            </li>
          </ul>
        ) : null}
      </div>
    </Card>
  )
}

function Avatar({ teacher, large = false }: { teacher: Teacher; large?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full text-xs font-extrabold ${large ? "size-16 text-lg" : "size-10"} ${colorClass(avatarTone(teacher.id))}`}>
      {studentInitials(teacher)}
    </span>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-app-orange">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={12} fill={star <= Math.round(value) ? "currentColor" : "none"} />
      ))}
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
          <span key={`e${index}`} className="px-1 text-app-muted">…</span>
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
