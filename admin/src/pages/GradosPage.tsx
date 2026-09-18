import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  Clock,
  DoorOpen,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"
import {
  useSchool,
  type GradeDraft,
  type GroupDraft,
} from "../context/SchoolContext"
import { academicBadge, colorClass, groupTitle, summarizeGrades } from "../lib/grades"
import { formatDate, teacherName } from "../lib/format"
import type { AcademicGrade, AcademicStatus, GradeGroup } from "../types/school"
import { AssignTeacherModal } from "../components/grados/AssignTeacherModal"
import { GradeFormModal } from "../components/grados/GradeFormModal"
import { GroupFormModal } from "../components/grados/GroupFormModal"
import { StudentFormModal } from "../components/grados/StudentFormModal"
import { Card } from "../components/ui/Card"
import { KebabMenu } from "../components/ui/KebabMenu"
import { MenuSelect } from "../components/ui/MenuSelect"
import { Modal } from "../components/ui/Modal"
import { ThemeToggle } from "../components/ui/ThemeToggle"

type StatusFilter = "todos" | AcademicStatus
type DetailTab = "info" | "alumnos" | "profesores" | "horario"

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"]

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Estado: Todos" },
  { value: "activo", label: "Estado: Activo" },
  { value: "inactivo", label: "Estado: Inactivo" },
]

const tabs: { id: DetailTab; label: string }[] = [
  { id: "info", label: "Información" },
  { id: "alumnos", label: "Alumnos" },
  { id: "profesores", label: "Profesores" },
  { id: "horario", label: "Horario" },
]

export function GradosPage() {
  const {
    school,
    cycleId,
    saveGrade,
    deleteGrade,
    saveGroup,
    deleteGroup,
    addStudentToGroup,
    assignTeacher,
    addScheduleEntry,
    removeScheduleEntry,
  } = useSchool()

  const [gradeQuery, setGradeQuery] = useState("")
  const [groupQuery, setGroupQuery] = useState("")
  const [gradeStatus, setGradeStatus] = useState<StatusFilter>("todos")
  const [groupStatus, setGroupStatus] = useState<StatusFilter>("todos")
  const [gradeId, setGradeId] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>("info")
  const [formGrade, setFormGrade] = useState<AcademicGrade | null | undefined>(undefined)
  const [formGroup, setFormGroup] = useState<GradeGroup | null | undefined>(undefined)
  const [createGradeId, setCreateGradeId] = useState<string | null>(null)
  const [studentOpen, setStudentOpen] = useState(false)
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<"grade" | "group" | null>(null)
  const [flash, setFlash] = useState("")
  const [error, setError] = useState("")

  const teachers = useMemo(
    () => school.teachers.filter((teacher) => teacher.cycleIds.includes(cycleId) && teacher.active),
    [cycleId, school.teachers],
  )

  const cycleGrades = useMemo(
    () => school.grades.filter((grade) => grade.cycleId === cycleId).sort((a, b) => a.order - b.order),
    [cycleId, school.grades],
  )
  const cycleGroups = useMemo(
    () => school.groups.filter((group) => group.cycleId === cycleId),
    [cycleId, school.groups],
  )
  const summarized = useMemo(() => summarizeGrades(cycleGrades, cycleGroups), [cycleGrades, cycleGroups])

  const selectedGrade =
    summarized.find((grade) => grade.id === gradeId) ??
    summarized[0]

  const groupsOfGrade = useMemo(() => {
    if (!selectedGrade) return []
    return cycleGroups
      .filter((group) => group.gradeId === selectedGrade.id)
      .sort((a, b) => a.letter.localeCompare(b.letter))
  }, [cycleGroups, selectedGrade])

  const filteredGrades = useMemo(() => {
    const needle = gradeQuery.trim().toLowerCase()
    return summarized.filter((grade) => {
      const matchesStatus = gradeStatus === "todos" || grade.status === gradeStatus
      const matchesQuery = needle.length === 0 || grade.name.toLowerCase().includes(needle)
      return matchesStatus && matchesQuery
    })
  }, [gradeQuery, gradeStatus, summarized])

  const filteredGroups = useMemo(() => {
    const needle = groupQuery.trim().toLowerCase()
    return groupsOfGrade.filter((group) => {
      const matchesStatus = groupStatus === "todos" || group.status === groupStatus
      const teacher = school.teachers.find((item) => item.id === group.teacherId)
      const haystack = `${group.letter} ${group.classroom} ${teacher ? teacherName(teacher.firstName, teacher.lastName) : ""}`.toLowerCase()
      return matchesStatus && (needle.length === 0 || haystack.includes(needle))
    })
  }, [groupQuery, groupStatus, groupsOfGrade, school.teachers])

  const selectedGroup =
    filteredGroups.find((group) => group.id === groupId) ??
    groupsOfGrade.find((group) => group.id === groupId) ??
    filteredGroups[0] ??
    groupsOfGrade[0]

  const students = school.students.filter((student) => student.groupId === selectedGroup?.id)
  const studentTotal = cycleGroups.reduce((sum, group) => sum + group.studentCount, 0)
  const ratio = teachers.length === 0 ? "—" : `1:${Math.max(1, Math.round(studentTotal / teachers.length))}`

  function notice(message: string) {
    setFlash(message)
    setError("")
    window.setTimeout(() => setFlash(""), 3200)
  }

  function selectGrade(id: string) {
    setGradeId(id)
    const first = cycleGroups.filter((group) => group.gradeId === id).sort((a, b) => a.letter.localeCompare(b.letter))[0]
    setGroupId(first?.id ?? null)
    setTab("info")
  }

  function handleSaveGrade(draft: GradeDraft, id?: string) {
    const savedId = saveGrade(draft, id)
    if (!savedId) {
      setError("Crea un ciclo escolar antes de dar de alta grados.")
      return
    }
    setFormGrade(undefined)
    selectGrade(savedId)
    notice(id ? "Grado actualizado." : "Grado creado.")
  }

  function handleSaveGroup(draft: GroupDraft, id?: string) {
    const result = saveGroup(draft, id)
    if ("error" in result) return result
    setFormGroup(undefined)
    setCreateGradeId(null)
    setGradeId(draft.gradeId)
    setGroupId(result.id)
    notice(id ? "Grupo actualizado." : "Grupo creado.")
    return result
  }

  function handleDeleteGrade() {
    if (!selectedGrade) return
    const result = deleteGrade(selectedGrade.id)
    setConfirmDelete(null)
    if (result) {
      setError(result)
      return
    }
    setGradeId(null)
    setGroupId(null)
    notice(`Se eliminó el grado ${selectedGrade.name}.`)
  }

  function handleDeleteGroup() {
    if (!selectedGroup) return
    const result = deleteGroup(selectedGroup.id)
    setConfirmDelete(null)
    setMoreOpen(false)
    if (result) {
      setError(result)
      return
    }
    setGroupId(null)
    notice(`Se eliminó el grupo ${groupTitle(selectedGroup)}.`)
  }

  function handleAddStudent(firstName: string, lastName: string) {
    if (!selectedGroup) return { error: "Selecciona un grupo." }
    const result = addStudentToGroup(selectedGroup.id, firstName, lastName)
    if ("error" in result) return result
    setStudentOpen(false)
    setTab("alumnos")
    notice("Alumno agregado al grupo.")
    return result
  }

  function openNewGroup(forGradeId?: string) {
    const target = forGradeId ?? selectedGrade?.id
    if (forGradeId) setGradeId(forGradeId)
    setCreateGradeId(target ?? null)
    setFormGroup(null)
  }

  if (!selectedGrade) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <h1 className="text-[28px] font-extrabold">Grados y grupos</h1>
        <p className="mt-2 text-sm text-app-muted">
          {cycleId ? "Aún no hay grados en este ciclo. Crea el primero para comenzar." : "Crea un ciclo escolar primero para poder dar de alta grados."}
        </p>
        <button
          type="button"
          disabled={!cycleId}
          onClick={() => setFormGrade(null)}
          className="mt-4 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          + Nuevo grado
        </button>
        {formGrade !== undefined ? (
          <GradeFormModal grade={formGrade} onClose={() => setFormGrade(undefined)} onSave={handleSaveGrade} />
        ) : null}
      </div>
    )
  }

  const teacher = school.teachers.find((item) => item.id === selectedGroup?.teacherId)
  const groupLabel = selectedGroup ? `${selectedGroup.grade} - ${selectedGroup.letter}` : ""

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Grados y grupos</h1>
          <p className="mt-1 text-sm text-app-muted">Administra la estructura académica de grados y grupos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setFormGrade(null)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover"
          >
            <Plus size={16} />
            Nuevo grado
          </button>
        </div>
      </header>

      {flash ? (
        <p className="rounded-xl border border-app-green/30 bg-app-green-soft px-4 py-3 text-sm font-medium text-app-green">
          {flash}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm font-medium text-app-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatMini
          label="Grados"
          value={String(cycleGrades.length)}
          hint="Total grados"
          iconClass="bg-app-blue-soft text-app-primary"
          icon={<GraduationCap size={20} />}
        />
        <StatMini
          label="Grupos"
          value={String(cycleGroups.length)}
          hint="Total grupos"
          iconClass="bg-app-green-soft text-app-green"
          icon={<Users size={20} />}
        />
        <StatMini
          label="Alumnos"
          value={String(studentTotal)}
          hint="Total alumnos"
          iconClass="bg-app-purple-soft text-app-purple"
          icon={<UserRound size={20} />}
        />
        <StatMini
          label="Profesores"
          value={String(teachers.length)}
          hint="Asignados"
          iconClass="bg-app-orange-soft text-app-orange"
          icon={<Presentation size={20} />}
        />
        <StatMini
          label="Relación promedio"
          value={ratio}
          hint="Profesor : Alumno"
          iconClass="bg-app-blue-soft text-app-primary"
          icon={<ClipboardList size={20} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.9fr)_minmax(300px,1fr)_minmax(320px,1.1fr)]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          <h2 className="text-base font-bold">Grados</h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="relative min-w-0">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
              <input
                value={gradeQuery}
                onChange={(event) => setGradeQuery(event.target.value)}
                placeholder="Buscar grado..."
                className="w-full rounded-xl border border-app-line bg-app-bg py-2.5 pr-3 pl-9 text-sm outline-none focus:border-app-primary"
              />
            </label>
            <div className="flex gap-2">
              <MenuSelect
                ariaLabel="Filtrar grados por estado"
                value={gradeStatus}
                options={statusFilters}
                onChange={setGradeStatus}
                align="left"
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => setFormGrade(null)}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-app-primary px-3 py-2 text-xs font-semibold text-white hover:bg-app-primary-hover"
              >
                <Plus size={14} />
                Nuevo grado
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2 text-[11px] font-bold tracking-wide text-app-muted uppercase">
            <span>Grado</span>
            <span className="w-14 text-center">Grupos</span>
            <span className="w-16 text-center">Alumnos</span>
            <span className="w-10 text-right">Acciones</span>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {filteredGrades.length === 0 ? (
              <p className="py-10 text-center text-sm text-app-muted">No hay grados con esos filtros.</p>
            ) : (
              filteredGrades.map((grade) => {
                const selected = grade.id === selectedGrade.id
                return (
                  <div
                    key={grade.id}
                    onClick={() => selectGrade(grade.id)}
                    className={`grid cursor-pointer grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 rounded-2xl border px-3 py-2.5 transition ${
                      selected ? "border-app-primary bg-app-primary-soft/30" : "border-app-line hover:bg-app-card-hover"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3 text-left">
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${colorClass(grade.color)}`}
                      >
                        {grade.shortLabel}
                      </span>
                      <span className="truncate font-bold">{grade.name}</span>
                    </div>
                    <span className="w-14 text-center text-sm font-semibold text-app-secondary">{grade.groupCount}</span>
                    <span className="w-16 text-center text-sm font-semibold text-app-secondary">{grade.studentCount}</span>
                    <span onClick={(event) => event.stopPropagation()}>
                      <KebabMenu
                        ariaLabel={`Acciones de ${grade.name}`}
                        items={[
                          { id: "edit", label: "Editar grado", onClick: () => setFormGrade(grade) },
                          { id: "group", label: "Nuevo grupo", onClick: () => openNewGroup(grade.id) },
                          {
                            id: "delete",
                            label: "Eliminar",
                            danger: true,
                            onClick: () => {
                              setGradeId(grade.id)
                              setConfirmDelete("grade")
                            },
                          },
                        ]}
                      />
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold">Grupos del grado seleccionado</h2>
              <div className="mt-2 max-w-[220px]">
                <MenuSelect
                  ariaLabel="Grado seleccionado"
                  value={selectedGrade.id}
                  options={cycleGrades.map((grade) => ({ value: grade.id, label: grade.name }))}
                  onChange={selectGrade}
                  align="left"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <label className="relative min-w-0">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
              <input
                value={groupQuery}
                onChange={(event) => setGroupQuery(event.target.value)}
                placeholder="Buscar grupo..."
                className="w-full rounded-xl border border-app-line bg-app-bg py-2.5 pr-3 pl-9 text-sm outline-none focus:border-app-primary"
              />
            </label>
            <div className="flex gap-2">
              <MenuSelect
                ariaLabel="Filtrar grupos por estado"
                value={groupStatus}
                options={statusFilters}
                onChange={setGroupStatus}
                align="left"
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => openNewGroup(selectedGrade.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-app-primary px-3 py-2 text-xs font-semibold text-white hover:bg-app-primary-hover"
              >
                <Plus size={14} />
                Nuevo grupo
              </button>
            </div>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-app-line px-4 py-10 text-center">
                <p className="text-sm font-semibold">Sin grupos en {selectedGrade.name}</p>
                <p className="mt-1 text-xs text-app-muted">Crea el primer grupo para asignar aula, profesor y alumnos.</p>
                <button
                  type="button"
                  onClick={() => openNewGroup(selectedGrade.id)}
                  className="mt-4 rounded-xl bg-app-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  + Nuevo grupo
                </button>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const titular = school.teachers.find((item) => item.id === group.teacherId)
                const selected = group.id === selectedGroup?.id
                const badge = academicBadge(group.status)
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setGroupId(group.id)
                      setTab("info")
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected ? "border-app-primary bg-app-primary-soft/30" : "border-app-line hover:bg-app-card-hover"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${colorClass(selectedGrade.color)}`}>
                        {group.letter}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-extrabold">{group.grade} - {group.letter}</p>
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>
                            <span className="size-1.5 rounded-full bg-current" />
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-app-muted">Aula {group.classroom}</p>
                        <p className="text-xs text-app-muted">Turno {group.shift}</p>
                        <p className="text-xs text-app-muted">
                          {titular ? teacherName(titular.firstName, titular.lastName) : "Sin profesor"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-app-secondary">{group.studentCount} alumnos</p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          {selectedGroup ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold">{groupLabel}</h2>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${academicBadge(selectedGroup.status).className}`}>
                      {academicBadge(selectedGroup.status).label}
                    </span>
                  </div>
                </div>
                <KebabMenu
                  ariaLabel={`Acciones de ${groupLabel}`}
                  items={[
                    { id: "edit", label: "Editar grupo", onClick: () => setFormGroup(selectedGroup) },
                    { id: "students", label: "Agregar alumnos", onClick: () => setStudentOpen(true) },
                    { id: "teacher", label: "Asignar profesor", onClick: () => setTeacherOpen(true) },
                    { id: "delete", label: "Eliminar grupo", danger: true, onClick: () => setConfirmDelete("group") },
                  ]}
                />
              </div>

              <div className="mt-4 flex gap-1 overflow-x-auto border-b border-app-line">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${
                      tab === item.id
                        ? "border-app-primary text-app-primary"
                        : "border-transparent text-app-muted hover:text-app-text"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                {tab === "info" ? (
                  <InfoTab
                    group={selectedGroup}
                    teacherLabel={teacher ? teacherName(teacher.firstName, teacher.lastName) : "Sin asignar"}
                    onEdit={() => setFormGroup(selectedGroup)}
                    onStudents={() => setStudentOpen(true)}
                    onTeachers={() => {
                      setTab("profesores")
                      setTeacherOpen(true)
                    }}
                    onSchedule={() => setTab("horario")}
                    onMore={() => setMoreOpen(true)}
                  />
                ) : null}
                {tab === "alumnos" ? (
                  <StudentsTab
                    group={selectedGroup}
                    named={students}
                    onAdd={() => setStudentOpen(true)}
                  />
                ) : null}
                {tab === "profesores" ? (
                  <TeachersTab
                    teacher={teacher}
                    onAssign={() => setTeacherOpen(true)}
                  />
                ) : null}
                {tab === "horario" ? (
                  <ScheduleTab
                    group={selectedGroup}
                    onAdd={(day, start, subject) => addScheduleEntry(selectedGroup.id, day, start, subject)}
                    onRemove={(entryId) => removeScheduleEntry(selectedGroup.id, entryId)}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="font-bold">Selecciona un grupo</p>
              <p className="mt-1 text-sm text-app-muted">
                Elige un grupo de {selectedGrade.name} o crea uno nuevo para ver el detalle.
              </p>
            </div>
          )}
        </Card>
      </div>

      {formGrade !== undefined ? (
        <GradeFormModal grade={formGrade} onClose={() => setFormGrade(undefined)} onSave={handleSaveGrade} />
      ) : null}
      {formGroup !== undefined ? (
        <GroupFormModal
          group={formGroup}
          grades={cycleGrades}
          teachers={teachers}
          zones={school.zones}
          existingLetters={cycleGroups
            .filter(
              (group) =>
                group.gradeId === (formGroup?.gradeId ?? createGradeId ?? selectedGrade.id) &&
                group.id !== formGroup?.id,
            )
            .map((group) => group.letter)}
          defaultGradeId={formGroup?.gradeId ?? createGradeId ?? selectedGrade.id}
          onClose={() => {
            setFormGroup(undefined)
            setCreateGradeId(null)
          }}
          onSave={handleSaveGroup}
        />
      ) : null}
      {studentOpen && selectedGroup ? (
        <StudentFormModal
          groupLabel={groupLabel}
          onClose={() => setStudentOpen(false)}
          onSave={handleAddStudent}
        />
      ) : null}
      {teacherOpen && selectedGroup ? (
        <AssignTeacherModal
          groupLabel={groupLabel}
          teacherId={selectedGroup.teacherId}
          teachers={teachers}
          onClose={() => setTeacherOpen(false)}
          onSave={(id) => {
            assignTeacher(selectedGroup.id, id)
            setTeacherOpen(false)
            notice("Profesor asignado.")
          }}
        />
      ) : null}
      {moreOpen && selectedGroup ? (
        <Modal title="Más opciones" onClose={() => setMoreOpen(false)}>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false)
                setFormGroup(selectedGroup)
              }}
              className="rounded-xl border border-app-line px-4 py-2.5 text-left text-sm font-semibold hover:bg-app-card-hover"
            >
              Editar grupo
            </button>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false)
                setConfirmDelete("group")
              }}
              className="rounded-xl border border-app-danger/40 px-4 py-2.5 text-left text-sm font-semibold text-app-danger hover:bg-app-danger-soft"
            >
              Eliminar grupo
            </button>
          </div>
        </Modal>
      ) : null}
      {confirmDelete ? (
        <Modal
          title={confirmDelete === "grade" ? "Eliminar grado" : "Eliminar grupo"}
          onClose={() => setConfirmDelete(null)}
        >
          <p className="text-sm leading-6 text-app-secondary">
            {confirmDelete === "grade"
              ? `¿Eliminar el grado ${selectedGrade.name}? Solo es posible si no tiene grupos.`
              : `¿Eliminar el grupo ${groupLabel}? Los alumnos de este grupo también se quitarán del padrón.`}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete === "grade" ? handleDeleteGrade : handleDeleteGroup}
              className="rounded-xl bg-app-danger px-4 py-2.5 text-sm font-semibold text-white"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      ) : null}
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

function InfoTab({
  group,
  teacherLabel,
  onEdit,
  onStudents,
  onTeachers,
  onSchedule,
  onMore,
}: {
  group: GradeGroup
  teacherLabel: string
  onEdit: () => void
  onStudents: () => void
  onTeachers: () => void
  onSchedule: () => void
  onMore: () => void
}) {
  const rows = [
    { icon: GraduationCap, label: "Grado", value: group.grade },
    { icon: DoorOpen, label: "Aula", value: group.classroom },
    { icon: Clock, label: "Turno", value: group.shift },
    { icon: Presentation, label: "Profesor titular", value: teacherLabel },
    { icon: Users, label: "Capacidad", value: `${group.capacity} alumnos` },
    { icon: UserRound, label: "Alumnos inscritos", value: `${group.studentCount} alumnos` },
    { icon: CalendarClock, label: "Fecha de creación", value: formatDate(group.createdAt.slice(0, 10)) },
  ]
  const actions: { label: string; icon: LucideIcon; onClick: () => void }[] = [
    { label: "Editar grupo", icon: Pencil, onClick: onEdit },
    { label: "Agregar alumnos", icon: UserPlus, onClick: onStudents },
    { label: "Asignar profesores", icon: Presentation, onClick: onTeachers },
    { label: "Horario del grupo", icon: CalendarClock, onClick: onSchedule },
    { label: "Más opciones", icon: MoreHorizontal, onClick: onMore },
  ]

  return (
    <div className="flex flex-col gap-5">
      <dl className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.label} className="flex items-center gap-3 text-sm">
              <span className="grid size-8 place-items-center rounded-lg bg-app-bg text-app-muted">
                <Icon size={16} />
              </span>
              <div>
                <dt className="text-xs text-app-muted">{row.label}</dt>
                <dd className="font-semibold">{row.value}</dd>
              </div>
            </div>
          )
        })}
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-app-line p-3">
          <p className="text-sm font-bold">Resumen del grupo</p>
          <StudentDonut active={group.studentCount} inactive={group.inactiveCount} pending={group.pendingCount} />
        </div>
        <div className="rounded-2xl border border-app-line p-3">
          <p className="text-sm font-bold">Asistencia promedio</p>
          <AttendanceGauge value={group.attendancePct} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold">Acciones rápidas</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-app-line px-2 py-3 text-center text-[11px] font-semibold hover:border-app-primary/40 hover:bg-app-card-hover"
              >
                <Icon size={18} className="text-app-muted" />
                {action.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StudentsTab({
  group,
  named,
  onAdd,
}: {
  group: GradeGroup
  named: { id: string; firstName: string; lastName: string }[]
  onAdd: () => void
}) {
  const unnamed = Math.max(0, group.studentCount - named.length)
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{group.studentCount} inscritos</p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-xl bg-app-primary px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>
      {named.length === 0 && unnamed === 0 ? (
        <p className="py-8 text-center text-sm text-app-muted">Este grupo aún no tiene alumnos.</p>
      ) : (
        <ul className="space-y-2">
          {named.map((student) => (
            <li
              key={student.id}
              className="flex items-center gap-3 rounded-xl border border-app-line px-3 py-2.5"
            >
              <span className="grid size-8 place-items-center rounded-full bg-app-blue-soft text-xs font-bold text-app-primary">
                {student.firstName.slice(0, 1)}
                {student.lastName.slice(0, 1)}
              </span>
              <span className="text-sm font-semibold">
                {student.firstName} {student.lastName}
              </span>
            </li>
          ))}
          {unnamed > 0 ? (
            <li className="rounded-xl border border-dashed border-app-line px-3 py-2.5 text-sm text-app-muted">
              Y {unnamed} alumno{unnamed === 1 ? "" : "s"} más en el conteo del grupo, sin ficha nominal todavía.
            </li>
          ) : null}
        </ul>
      )}
    </div>
  )
}

function TeachersTab({
  teacher,
  onAssign,
}: {
  teacher: { firstName: string; lastName: string; email: string } | undefined
  onAssign: () => void
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold">Profesor titular</p>
        <button
          type="button"
          onClick={onAssign}
          className="inline-flex items-center gap-1 rounded-xl bg-app-primary px-3 py-1.5 text-xs font-semibold text-white"
        >
          Asignar
        </button>
      </div>
      {teacher ? (
        <div className="flex items-center gap-3 rounded-2xl border border-app-line px-4 py-3">
          <span className="grid size-10 place-items-center rounded-full bg-app-orange-soft text-sm font-bold text-app-orange">
            {teacher.firstName.slice(0, 1)}
            {teacher.lastName.slice(0, 1)}
          </span>
          <div>
            <p className="font-bold">{teacherName(teacher.firstName, teacher.lastName)}</p>
            <p className="text-xs text-app-muted">{teacher.email}</p>
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-app-muted">Este grupo no tiene profesor titular.</p>
      )}
    </div>
  )
}

function ScheduleTab({
  group,
  onAdd,
  onRemove,
}: {
  group: GradeGroup
  onAdd: (day: string, start: string, subject: string) => void
  onRemove: (entryId: string) => void
}) {
  const [day, setDay] = useState(WEEKDAYS[0])
  const [start, setStart] = useState("08:00")
  const [subject, setSubject] = useState("")
  const entries = group.schedule

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!subject.trim()) return
    onAdd(day, start, subject.trim())
    setSubject("")
  }

  return (
    <div>
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_minmax(0,1.4fr)_auto]" onSubmit={submit}>
        <MenuSelect ariaLabel="Día" value={day} options={WEEKDAYS.map((item) => ({ value: item, label: item }))} onChange={setDay} align="left" />
        <input
          type="time"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm outline-none focus:border-app-primary"
        />
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Materia"
          className="rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm outline-none focus:border-app-primary"
        />
        <button type="submit" className="rounded-xl bg-app-primary px-3 py-2.5 text-sm font-semibold text-white">
          Agregar
        </button>
      </form>
      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-app-muted">Aún no hay horario para este grupo.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-app-line px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-app-bg text-app-muted">
                  <BookOpen size={15} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{entry.subject}</p>
                  <p className="text-xs text-app-muted">
                    {entry.day} · {entry.start}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Quitar ${entry.subject}`}
                onClick={() => onRemove(entry.id)}
                className="rounded-lg p-1.5 text-app-muted hover:bg-app-danger-soft hover:text-app-danger"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StudentDonut({
  active,
  inactive,
  pending,
}: {
  active: number
  inactive: number
  pending: number
}) {
  const total = Math.max(1, active + inactive + pending)
  const r = 38
  const c = 2 * Math.PI * r
  const slices = [
    { value: active, color: "var(--primary)" },
    { value: inactive, color: "var(--orange)" },
    { value: pending, color: "var(--muted)" },
  ]
  let offset = 0

  return (
    <div className="mt-2 flex items-center gap-3">
      <svg viewBox="0 0 100 100" className="size-[108px] shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
        {slices.map((slice) => {
          const length = (slice.value / total) * c
          const dash = `${length} ${c - length}`
          const current = offset
          offset += length
          if (slice.value <= 0) return null
          return (
            <circle
              key={slice.color}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={-current}
              strokeLinecap="butt"
            />
          )
        })}
      </svg>
      <ul className="space-y-1.5 text-xs">
        <LegendDot color="bg-app-primary" label={`${active} Activos`} />
        <LegendDot color="bg-app-orange" label={`${inactive} Inactivos`} />
        <LegendDot color="bg-app-muted" label={`${pending} Pendientes`} />
      </ul>
    </div>
  )
}

function AttendanceGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const r = 40
  const c = 2 * Math.PI * r
  const filled = (pct / 100) * c

  return (
    <div className="mt-2 flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="size-[108px] -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--green)"
            strokeWidth="10"
            strokeDasharray={`${filled} ${c - filled}`}
            strokeLinecap="round"
          />
        </svg>
        <p className="absolute inset-0 grid place-items-center text-xl font-extrabold">{pct}%</p>
      </div>
      <p className="mt-1 text-xs text-app-muted">Este mes</p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2 font-medium text-app-secondary">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </li>
  )
}
