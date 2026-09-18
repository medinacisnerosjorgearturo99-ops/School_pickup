import { useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  Link2,
  Monitor,
  Power,
  RefreshCw,
  Search,
  Tv,
  Unplug,
  Users,
} from "lucide-react"
import { useSchool } from "../context/SchoolContext"
import { colorClass, groupTitle } from "../lib/grades"
import { formatDateTime, teacherName } from "../lib/format"
import { avatarTone, studentFullName, studentInitials } from "../lib/students"
import type { ClassroomScreen, GradeGroup, Student } from "../types/school"
import { Card } from "../components/ui/Card"
import { MenuSelect } from "../components/ui/MenuSelect"
import { ThemeToggle } from "../components/ui/ThemeToggle"

export function PantallasPage() {
  const { school, cycleId, bindScreen, syncNow, syncStatus, lastSyncAt } = useSchool()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "online" | "offline">("todos")
  const [screenId, setScreenId] = useState<string | null>(null)
  const [flash, setFlash] = useState("")

  const cycleScreens = useMemo(
    () => school.screens.filter((screen) => screen.cycleId === cycleId),
    [cycleId, school.screens],
  )
  const cycleGroups = useMemo(
    () => school.groups.filter((group) => group.cycleId === cycleId),
    [cycleId, school.groups],
  )
  const groupById = useMemo(() => new Map(cycleGroups.map((group) => [group.id, group])), [cycleGroups])
  const gradeById = useMemo(() => new Map(school.grades.map((grade) => [grade.id, grade])), [school.grades])
  const teacherById = useMemo(() => new Map(school.teachers.map((teacher) => [teacher.id, teacher])), [school.teachers])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cycleScreens
      .filter((screen) => {
        if (statusFilter === "online" && !screen.groupId) return false
        if (statusFilter === "offline" && screen.groupId) return false
        if (needle.length === 0) return true
        const group = screen.groupId ? groupById.get(screen.groupId) : undefined
        return `${screen.name} ${screen.location} ${screen.pairingCode} ${group ? groupTitle(group) : ""}`
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [cycleScreens, groupById, query, statusFilter])

  const selected =
    cycleScreens.find((screen) => screen.id === screenId) ??
    filtered[0] ??
    cycleScreens[0]

  const selectedGroup = selected?.groupId ? groupById.get(selected.groupId) : undefined
  const roster = useMemo(() => {
    if (!selectedGroup) return []
    return school.students
      .filter((student) => student.groupId === selectedGroup.id && student.status !== "inactivo")
      .sort((a, b) => studentFullName(a).localeCompare(studentFullName(b), "es"))
  }, [school.students, selectedGroup])

  const online = cycleScreens.filter((screen) => Boolean(screen.groupId)).length
  const paired = cycleScreens.filter((screen) => Boolean(screen.groupId)).length
  const enrolled = cycleScreens.reduce((sum, screen) => {
    const group = screen.groupId ? groupById.get(screen.groupId) : undefined
    return sum + (group?.studentCount ?? 0)
  }, 0)

  function notice(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(""), 3200)
  }

  async function handleSync() {
    await syncNow()
    notice("Padrón enviado a las TVs.")
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <h1 className="text-[28px] font-extrabold">Pantallas</h1>
        <p className="mt-2 text-sm text-app-muted">Crea un grupo para generar su TV de salón.</p>
        <Link to="/grados" className="mt-4 inline-flex rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white">
          Ir a grados y grupos
        </Link>
      </div>
    )
  }

  const teacher = selectedGroup ? teacherById.get(selectedGroup.teacherId) : undefined
  const syncHint =
    syncStatus === "ok" && lastSyncAt
      ? `Sincronizado ${formatDateTime(lastSyncAt)}`
      : syncStatus === "syncing"
        ? "Enviando padrón al servidor…"
        : syncStatus === "error"
          ? "El servidor de TV no respondió. Abre :8080 y vuelve a sincronizar."
          : "Aún no se ha enviado el padrón."

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Pantallas</h1>
          <p className="mt-1 text-sm text-app-muted">
            Cada TV de salón muestra solo a los alumnos de su grupo. El código se escribe una vez en la televisión.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => void handleSync()}
            className="inline-flex items-center gap-2 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover"
          >
            <RefreshCw size={16} className={syncStatus === "syncing" ? "animate-spin" : ""} />
            Sincronizar ahora
          </button>
        </div>
      </header>

      {flash ? <p className="rounded-xl border border-app-green/30 bg-app-green-soft px-4 py-3 text-sm font-medium text-app-green">{flash}</p> : null}
      {syncStatus === "error" ? (
        <p className="rounded-xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm font-medium text-app-danger">{syncHint}</p>
      ) : (
        <p className="text-sm text-app-muted">{syncHint}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatMini label="Pantallas del ciclo" value={String(cycleScreens.length)} hint={`${paired} vinculadas a un grupo`} iconClass="bg-app-blue-soft text-app-primary" icon={<Monitor size={20} />} />
        <StatMini label="Vinculadas" value={String(online)} hint={online === cycleScreens.length && cycleScreens.length > 0 ? "Todas tienen grupo" : `${cycleScreens.length - online} sin grupo`} iconClass="bg-app-green-soft text-app-green" icon={<Link2 size={20} />} />
        <StatMini label="Sin vincular" value={String(cycleScreens.length - paired)} hint="Esperan código o grupo" iconClass="bg-app-orange-soft text-app-orange" icon={<Unplug size={20} />} />
        <StatMini label="Alumnos en TV" value={String(enrolled)} hint="Suma de grupos con pantalla" iconClass="bg-app-purple-soft text-app-purple" icon={<Users size={20} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)_minmax(280px,0.75fr)]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5">
          <h2 className="text-base font-bold">TVs de salón</h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="relative min-w-0">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar salón, grupo o código…"
                className="w-full rounded-xl border border-app-line bg-app-bg py-2.5 pr-3 pl-9 text-sm outline-none focus:border-app-primary"
              />
            </label>
            <MenuSelect
              ariaLabel="Filtrar por vínculo"
              value={statusFilter}
              align="left"
              options={[
                { value: "todos", label: "Todas" },
                { value: "online", label: "Vinculadas" },
                { value: "offline", label: "Sin grupo" },
              ]}
              onChange={setStatusFilter}
            />
          </div>
          <ul className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filtered.map((screen) => {
              const group = screen.groupId ? groupById.get(screen.groupId) : undefined
              const active = screen.id === selected.id
              return (
                <li key={screen.id}>
                  <button
                    type="button"
                    onClick={() => setScreenId(screen.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left ${
                      active ? "border-app-primary bg-app-primary-soft/30" : "border-transparent hover:bg-app-card-hover"
                    }`}
                  >
                    <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${screen.groupId ? "bg-app-blue-soft text-app-primary" : "bg-app-card-hover text-app-muted"}`}>
                      <Tv size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-bold">{group ? groupTitle(group) : screen.name}</span>
                        <span className={`size-2 shrink-0 rounded-full ${screen.groupId ? "bg-app-green" : "bg-app-muted"}`} />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-app-muted">
                        {screen.location} · {screen.pairingCode}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <ScreenDetail
          screen={selected}
          group={selectedGroup}
          teacherLabel={teacher ? teacherName(teacher.firstName, teacher.lastName) : "Sin profesor"}
          zoneName={selectedGroup ? school.zones.find((zone) => zone.id === selectedGroup.zoneId)?.name ?? "—" : "—"}
          gradeColor={selectedGroup ? gradeById.get(selectedGroup.gradeId)?.color : undefined}
          cycleGroups={cycleGroups}
          onBind={(groupId) => {
            bindScreen(selected.id, groupId)
            notice(groupId ? "Grupo asignado a esta TV. La pantalla tomará este salón al vincular el código." : "Se desvinculó el grupo.")
          }}
        />

        <RosterCard group={selectedGroup} students={roster} />
      </div>
    </div>
  )
}

function ScreenDetail({
  screen,
  group,
  teacherLabel,
  zoneName,
  gradeColor,
  cycleGroups,
  onBind,
}: {
  screen: ClassroomScreen
  group: GradeGroup | undefined
  teacherLabel: string
  zoneName: string
  gradeColor: string | undefined
  cycleGroups: GradeGroup[]
  onBind: (groupId: string | null) => void
}) {
  return (
    <Card className="flex min-h-[560px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-app-muted uppercase">Pantalla de salón</p>
          <h2 className="mt-1 text-xl font-extrabold">{group ? groupTitle(group) : screen.name}</h2>
          <p className="mt-1 text-sm text-app-muted">{screen.location}</p>
        </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${screen.groupId ? "bg-app-green-soft text-app-green" : "bg-app-card-hover text-app-muted"}`}>
          {screen.groupId ? "Vinculada" : "Sin grupo"}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-app-line bg-app-bg px-4 py-5 text-center">
        <p className="text-xs font-bold tracking-wide text-app-muted uppercase">Código de vinculación</p>
        <p className="mt-2 font-mono text-3xl font-extrabold tracking-[0.18em]">{screen.pairingCode}</p>
        <p className="mt-2 text-xs text-app-muted">Escríbelo en la TV del salón para mostrar este grupo.</p>
      </div>

      <label className="mt-5 block text-sm font-semibold">
        Grupo en esta TV
        <span className="mt-1.5 block">
          <MenuSelect
            ariaLabel="Asignar grupo"
            value={screen.groupId ?? "none"}
            align="left"
            className="w-full"
            options={[
              { value: "none", label: "Sin grupo" },
              ...cycleGroups.map((item) => ({ value: item.id, label: `${item.grade} · ${item.letter} · ${item.classroom}` })),
            ]}
            onChange={(value) => onBind(value === "none" ? null : value)}
          />
        </span>
      </label>

      <dl className="mt-5 grid gap-3 text-sm">
        <Row label="Profesor" value={teacherLabel} />
        <Row label="Salón" value={group?.classroom ?? screen.location} />
        <Row label="Zona" value={zoneName} />
        <Row label="Alumnos" value={group ? String(group.studentCount) : "0"} />
      </dl>

      {group && gradeColor ? (
        <p className={`mt-4 inline-flex self-start rounded-full px-2.5 py-1 text-xs font-bold ${colorClass(gradeColor)}`}>{group.grade}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        {screen.groupId ? (
          <button
            type="button"
            onClick={() => onBind(null)}
            className="inline-flex items-center gap-2 rounded-xl border border-app-line px-3 py-2 text-sm font-semibold hover:bg-app-card-hover"
          >
            <Power size={16} />
            Desvincular grupo
          </button>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-xs text-app-muted">
            <Link2 size={14} />
            Asigna un grupo para que la TV reciba su lista.
          </p>
        )}
      </div>
    </Card>
  )
}

function RosterCard({ group, students }: { group: GradeGroup | undefined; students: Student[] }) {
  if (!group) {
    return (
      <Card className="flex min-h-[560px] flex-col items-center justify-center p-5 text-center">
        <Tv size={28} className="text-app-muted" />
        <p className="mt-3 font-bold">Sin grupo asignado</p>
        <p className="mt-1 text-sm text-app-muted">La TV no mostrará alumnos hasta que elijas un grupo.</p>
      </Card>
    )
  }

  return (
    <Card className="flex min-h-[560px] flex-col overflow-hidden p-5">
      <h2 className="text-base font-bold">Lista que verá la TV</h2>
      <p className="mt-1 text-sm text-app-muted">
        {students.length} alumno{students.length === 1 ? "" : "s"} de {groupTitle(group)}
      </p>
      <ul className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {students.map((student) => (
          <li key={student.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className={`grid size-9 place-items-center rounded-full text-xs font-bold ${colorClass(avatarTone(student.id))}`}>
              {studentInitials(student)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{studentFullName(student)}</span>
              <span className="text-xs text-app-muted">{student.status === "activo" ? "Inscrito" : "Pendiente"}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-app-line pb-2">
      <dt className="text-app-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
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
