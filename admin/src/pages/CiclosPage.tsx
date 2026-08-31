import { useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  CalendarRange,
  Copy,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useSchool, type CycleDraft } from "../context/SchoolContext"
import {
  averageDurationMonths,
  cycleDuration,
  elapsedProgress,
  formatMonthsDays,
  nextStartCycle,
  statusBadge,
  statusPhrase,
} from "../lib/cycle"
import { formatDate, formatDateTime } from "../lib/format"
import type { CycleStatus, SchoolCycle } from "../types/school"
import { CycleCalendarModal } from "../components/ciclos/CycleCalendarModal"
import { CycleFormModal } from "../components/ciclos/CycleFormModal"
import { Card } from "../components/ui/Card"
import { MenuSelect } from "../components/ui/MenuSelect"
import { Modal } from "../components/ui/Modal"
import { ThemeToggle } from "../components/ui/ThemeToggle"

const PAGE_SIZE = 5

type StatusFilter = "todos" | CycleStatus

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Estado: Todos" },
  { value: "activo", label: "Estado: Activo" },
  { value: "cerrado", label: "Estado: Finalizado" },
  { value: "proximo", label: "Estado: Próximo" },
]

export function CiclosPage() {
  const { school, cycleId, saveCycle, duplicateCycle, deleteCycle } = useSchool()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")
  const [page, setPage] = useState(1)
  const [formCycle, setFormCycle] = useState<SchoolCycle | null | undefined>(undefined)
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [flash, setFlash] = useState("")
  const [error, setError] = useState("")

  const cycles = useMemo(
    () => school.cycles.slice().sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [school.cycles],
  )
  const selected = cycles.find((cycle) => cycle.id === (inspectedId ?? cycleId)) ?? cycles[0]
  const active = cycles.find((cycle) => cycle.status === "activo")
  const upcoming = nextStartCycle(cycles)
  const average = averageDurationMonths(cycles)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cycles.filter((cycle) => {
      const matchesStatus = statusFilter === "todos" || cycle.status === statusFilter
      const matchesQuery =
        needle.length === 0 ||
        cycle.label.toLowerCase().includes(needle) ||
        cycle.notes.toLowerCase().includes(needle)
      return matchesStatus && matchesQuery
    })
  }, [cycles, query, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)

  function notice(message: string) {
    setFlash(message)
    setError("")
    window.setTimeout(() => setFlash(""), 3200)
  }

  function handleSave(draft: CycleDraft, id?: string) {
    const savedId = saveCycle(draft, id)
    setFormCycle(undefined)
    setInspectedId(savedId)
    notice(id ? "Ciclo actualizado." : "Ciclo escolar creado.")
  }

  function handleDuplicate() {
    if (!selected) return
    const newId = duplicateCycle(selected.id)
    if (newId) {
      setInspectedId(newId)
      notice(`Se duplicó ${selected.label} al siguiente año.`)
    }
  }

  function handleDelete() {
    if (!selected) return
    const result = deleteCycle(selected.id)
    setConfirmDelete(false)
    if (result) {
      setError(result)
      return
    }
    setInspectedId(null)
    notice(`Se eliminó el ciclo ${selected.label}.`)
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-[1180px]">
        <h1 className="text-[28px] font-extrabold">Ciclos escolares</h1>
        <p className="mt-2 text-sm text-app-muted">Aún no hay ciclos. Crea el primero para comenzar.</p>
        <button
          type="button"
          onClick={() => setFormCycle(null)}
          className="mt-4 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Nuevo ciclo escolar
        </button>
        {formCycle !== undefined ? (
          <CycleFormModal cycle={formCycle} onClose={() => setFormCycle(undefined)} onSave={handleSave} />
        ) : null}
      </div>
    )
  }

  const duration = cycleDuration(selected)
  const progress = elapsedProgress(selected)
  const badge = statusBadge(selected.status)
  const detailTitle = selected.status === "activo" ? "Información del ciclo activo" : "Información del ciclo"

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Ciclos escolares</h1>
          <p className="mt-1 text-sm text-app-muted">Gestiona y administra los ciclos escolares de la institución.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setFormCycle(null)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover"
          >
            <Plus size={16} />
            Nuevo ciclo escolar
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatMini
          label="Ciclos escolares"
          value={String(cycles.length)}
          hint="Total registrados"
          iconClass="bg-app-blue-soft text-app-primary"
          icon={<CalendarRange size={20} />}
        />
        <StatMini
          label="Ciclo activo"
          value={active?.label ?? "—"}
          hint=""
          iconClass="bg-app-green-soft text-app-green"
          icon={<CalendarDays size={20} />}
          accent={active ? "En curso" : "Sin ciclo en curso"}
          accentDot={Boolean(active)}
        />
        <StatMini
          label="Próximo inicio"
          value={upcoming ? formatDate(upcoming.startDate) : "—"}
          hint={upcoming?.label ?? ""}
          iconClass="bg-app-purple-soft text-app-purple"
          icon={<CalendarDays size={20} />}
        />
        <StatMini
          label="Duración promedio"
          value={`${average} meses`}
          hint="Por ciclo escolar"
          iconClass="bg-app-orange-soft text-app-orange"
          icon={<GraduationCap size={20} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
        <Card className="flex min-h-[520px] flex-col p-5">
          <h2 className="text-base font-bold">Lista de ciclos escolares</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar ciclo escolar..."
                className="w-full rounded-xl border border-app-line bg-app-bg py-2.5 pr-3 pl-9 text-sm outline-none focus:border-app-primary"
              />
            </label>
            <MenuSelect
              ariaLabel="Filtrar por estado"
              value={statusFilter}
              options={filterOptions}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              align="left"
              className="w-full sm:w-[210px]"
            />
          </div>

          <div className="mt-4 flex flex-1 flex-col gap-3">
            {pageItems.length === 0 ? (
              <p className="py-10 text-center text-sm text-app-muted">No hay ciclos con esos filtros.</p>
            ) : (
              pageItems.map((cycle) => {
                const itemBadge = statusBadge(cycle.status)
                const itemDuration = cycleDuration(cycle)
                const isSelected = cycle.id === selected.id
                return (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => setInspectedId(cycle.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? cycle.status === "activo"
                          ? "border-app-green bg-app-green-soft/30"
                          : "border-app-primary bg-app-primary-soft/30"
                        : "border-app-line hover:bg-app-card-hover"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          cycle.status === "activo"
                            ? "bg-app-green-soft text-app-green"
                            : cycle.status === "proximo"
                              ? "bg-app-purple-soft text-app-purple"
                              : "bg-app-blue-soft text-app-primary"
                        }`}
                      >
                        <CalendarDays size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-extrabold">{cycle.label}</p>
                          <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${itemBadge.className}`}>
                            {itemBadge.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-app-muted">
                          {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
                        </p>
                        <p className="mt-1 text-xs text-app-muted">{formatMonthsDays(itemDuration.months, itemDuration.days)}</p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-line pt-4 text-sm">
            <p className="text-app-muted">
              Mostrando {from} a {to} de {filtered.length} ciclos
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-app-line px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-app-primary px-2 text-xs font-bold text-white">
                {safePage}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                className="rounded-lg border border-app-line px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">{detailTitle}</h2>
              <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
            </div>
            <div className="flex items-start gap-3">
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  selected.status === "activo"
                    ? "bg-app-green-soft text-app-green"
                    : selected.status === "proximo"
                      ? "bg-app-purple-soft text-app-purple"
                      : "bg-app-blue-soft text-app-primary"
                }`}
              >
                <CalendarDays size={22} />
              </span>
              <div>
                <h3 className="text-xl font-extrabold">Ciclo escolar {selected.label}</h3>
                <p className="text-sm text-app-muted">{statusPhrase(selected.status)}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-app-muted">
                <span>
                  Tiempo transcurrido:{" "}
                  {progress.started ? formatMonthsDays(progress.months, progress.days) : "Aún no inicia"}
                </span>
                <span>{Math.round(progress.percent)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-app-line">
                <div
                  className={`h-full rounded-full ${selected.status === "activo" ? "bg-app-green" : "bg-app-primary"}`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-x-10 gap-y-1 text-sm sm:grid-cols-2">
              <dl className="space-y-3">
                <Info label="Fecha de inicio" value={formatDate(selected.startDate)} />
                <Info label="Fecha de fin" value={formatDate(selected.endDate)} />
                <Info label="Duración total" value={formatMonthsDays(duration.months, duration.days)} />
                <Info label="Días lectivos estimados" value={`${selected.schoolDays} días`} />
                <Info label="Estado" value={statusPhrase(selected.status)} />
              </dl>
              <dl className="space-y-3">
                <Info label="Creado por" value={selected.createdBy} />
                <Info label="Fecha de creación" value={formatDateTime(selected.createdAt)} />
                <Info label="Última actualización" value={formatDateTime(selected.updatedAt)} />
                <Info label="Observaciones" value={selected.notes} />
              </dl>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <ActionButton icon={<Pencil size={15} />} label="Editar" onClick={() => setFormCycle(selected)} />
              <ActionButton icon={<CalendarDays size={15} />} label="Calendario escolar" onClick={() => setCalendarOpen(true)} />
              <ActionButton icon={<Copy size={15} />} label="Duplicar" onClick={handleDuplicate} />
              <ActionButton
                icon={<Trash2 size={15} />}
                label="Eliminar"
                danger
                onClick={() => setConfirmDelete(true)}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Acciones rápidas</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickTile label="Agregar grado" icon={GraduationCap} onClick={() => navigate("/grados")} />
              <QuickTile label="Agregar grupo" icon={Users} onClick={() => navigate("/grados")} />
              <QuickTile label="Asignar profesores" icon={UserPlus} onClick={() => navigate("/profesores")} />
              <QuickTile label="Ver calendario escolar" icon={CalendarDays} onClick={() => setCalendarOpen(true)} />
            </div>
          </Card>
        </div>
      </div>

      {formCycle !== undefined ? (
        <CycleFormModal cycle={formCycle} onClose={() => setFormCycle(undefined)} onSave={handleSave} />
      ) : null}
      {calendarOpen ? <CycleCalendarModal cycle={selected} onClose={() => setCalendarOpen(false)} /> : null}
      {confirmDelete ? (
        <Modal title="Eliminar ciclo escolar" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm leading-6 text-app-secondary">
            ¿Eliminar el ciclo <strong>{selected.label}</strong>? Los grupos y pantallas de otros ciclos no se
            modifican, pero este periodo dejará de aparecer en el panel.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
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
  accent,
  accentDot = false,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
  iconClass: string
  accent?: string
  accentDot?: boolean
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-app-muted">{label}</p>
          <p className="mt-2 truncate text-[28px] font-extrabold leading-none tracking-tight">{value}</p>
          <p className="mt-2 flex items-center gap-2 text-xs font-medium text-app-muted">
            {hint}
            {accent ? (
              <span className="inline-flex items-center gap-1.5 text-app-green">
                {accentDot ? <span className="size-1.5 rounded-full bg-app-green" /> : null}
                {accent}
              </span>
            ) : null}
          </p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconClass}`}>{icon}</span>
      </div>
    </Card>
  )
}

function QuickTile({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border border-app-line px-3 py-4 text-center text-sm font-semibold hover:border-app-primary/40 hover:bg-app-card-hover"
    >
      <Icon size={22} className="text-app-muted" />
      {label}
    </button>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-app-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
        danger
          ? "border-app-danger/40 text-app-danger hover:bg-app-danger-soft"
          : "border-app-primary/40 text-app-primary hover:bg-app-primary-soft"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
