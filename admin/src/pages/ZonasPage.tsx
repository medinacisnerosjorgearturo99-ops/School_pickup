import { useMemo, useState, type ReactNode } from "react"
import {
  BarChart3,
  Car,
  Clock,
  History,
  MapPin,
  Maximize2,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react"
import { useSchool, type ZoneDraft } from "../context/SchoolContext"
import { colorClass } from "../lib/grades"
import {
  demandBadge,
  demandFromUsage,
  demandPhrase,
  formatHour12,
  formatWait,
  usageBarClass,
  zoneHistory,
  zoneTitle,
} from "../lib/zones"
import type { AcademicStatus, DeliveryZone, Guardian, ZoneDemand } from "../types/school"
import { CampusMap } from "../components/zonas/CampusMap"
import { ZoneFormModal } from "../components/zonas/ZoneFormModal"
import { Card } from "../components/ui/Card"
import { KebabMenu } from "../components/ui/KebabMenu"
import { MenuSelect } from "../components/ui/MenuSelect"
import { Modal } from "../components/ui/Modal"
import { ThemeToggle } from "../components/ui/ThemeToggle"

const PAGE_SIZE = 8
const ZOOM_MIN = 0.9
const ZOOM_MAX = 1.45
const ZOOM_STEP = 0.15

type StatusFilter = "todos" | AcademicStatus
type DemandFilter = "todos" | ZoneDemand

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Estado: Todos" },
  { value: "activo", label: "Estado: Activas" },
  { value: "inactivo", label: "Estado: Inactivas" },
]

const demandFilters: { value: DemandFilter; label: string }[] = [
  { value: "todos", label: "Uso: Todos" },
  { value: "alta", label: "Uso: Alta" },
  { value: "media", label: "Uso: Media" },
  { value: "baja", label: "Uso: Baja" },
]

export function ZonasPage() {
  const { school, saveZone, deleteZone } = useSchool()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")
  const [demandFilter, setDemandFilter] = useState<DemandFilter>("todos")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [zoneId, setZoneId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [formZone, setFormZone] = useState<DeliveryZone | null | undefined>(undefined)
  const [assignOpen, setAssignOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [fullMapOpen, setFullMapOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [flash, setFlash] = useState("")
  const [error, setError] = useState("")

  const zones = useMemo(
    () => school.zones.slice().sort((a, b) => a.letter.localeCompare(b.letter, "es")),
    [school.zones],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return zones.filter((zone) => {
      if (statusFilter !== "todos" && zone.status !== statusFilter) return false
      if (demandFilter !== "todos" && demandFromUsage(zone.usagePct) !== demandFilter) return false
      if (needle.length === 0) return true
      return `${zoneTitle(zone)} ${zone.location} ${zone.letter} ${zone.responsibleName}`.toLowerCase().includes(needle)
    })
  }, [demandFilter, query, statusFilter, zones])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)

  const selected =
    zones.find((zone) => zone.id === zoneId) ??
    filtered[0] ??
    zones[0]

  const activeZones = zones.filter((zone) => zone.status === "activo")
  const activePct = zones.length === 0 ? 0 : Math.round((activeZones.length / zones.length) * 100)
  const avgUsage =
    activeZones.length === 0
      ? 0
      : Math.round(activeZones.reduce((sum, zone) => sum + zone.usagePct, 0) / activeZones.length)
  const avgWait =
    activeZones.length === 0
      ? 0
      : activeZones.reduce((sum, zone) => sum + zone.avgWaitSec, 0) / activeZones.length
  const deliveriesToday = zones.reduce((sum, zone) => sum + zone.studentsToday, 0)

  function notice(message: string) {
    setFlash(message)
    setError("")
    window.setTimeout(() => setFlash(""), 3200)
  }

  function handleSave(draft: ZoneDraft, id?: string) {
    const result = saveZone(draft, id)
    if ("error" in result) return result
    setFormZone(undefined)
    setAssignOpen(false)
    setZoneId(result.id)
    notice(id ? "Zona actualizada." : "Zona de entrega creada.")
    return result
  }

  function handleDelete() {
    if (!selected) return
    const result = deleteZone(selected.id)
    setConfirmDelete(false)
    if (result) {
      setError(result)
      return
    }
    setZoneId(null)
    notice(`Se eliminó ${zoneTitle(selected)}.`)
  }

  function toggleStatus() {
    if (!selected) return
    const next: AcademicStatus = selected.status === "activo" ? "inactivo" : "activo"
    const result = saveZone(toDraft(selected, { status: next }), selected.id)
    if ("error" in result) {
      setError(result.error)
      return
    }
    notice(next === "inactivo" ? "Zona desactivada." : "Zona activada.")
  }

  function handleAssign(guardianId: string) {
    if (!selected) return
    const guardian = school.guardians.find((item) => item.id === guardianId)
    if (!guardian) {
      setError("Selecciona un responsable.")
      return
    }
    const result = saveZone(toDraft(selected, { responsibleName: guardian.name, responsiblePhone: guardian.phone }), selected.id)
    if ("error" in result) {
      setError(result.error)
      return
    }
    setAssignOpen(false)
    notice(`Responsable asignado: ${guardian.name}.`)
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <h1 className="text-[28px] font-extrabold">Zonas de entrega</h1>
        <p className="mt-2 text-sm text-app-muted">Aún no hay zonas. Crea la primera para comenzar.</p>
        <button type="button" onClick={() => setFormZone(null)} className="mt-4 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white">
          + Nueva zona de entrega
        </button>
        {formZone !== undefined ? (
          <ZoneFormModal zone={formZone} zones={zones} guardians={school.guardians} onClose={() => setFormZone(undefined)} onSave={handleSave} />
        ) : null}
      </div>
    )
  }

  const demand = demandFromUsage(selected.usagePct)
  const demandUi = demandBadge(demand)
  const statusUi = zoneStatusBadge(selected.status)

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Zonas de entrega</h1>
          <p className="mt-1 text-sm text-app-muted">Administra los puntos y áreas donde se realiza la entrega y recogida de alumnos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setFormZone(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover"
          >
            <Plus size={16} />
            Nueva zona de entrega
          </button>
        </div>
      </header>

      {flash ? <p className="rounded-xl border border-app-green/30 bg-app-green-soft px-4 py-3 text-sm font-medium text-app-green">{flash}</p> : null}
      {error ? <p className="rounded-xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm font-medium text-app-danger">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatMini label="Total zonas" value={String(zones.length)} hint="Zonas activas" iconClass="bg-app-blue-soft text-app-primary" icon={<MapPin size={20} />} />
        <StatMini label="Zonas activas" value={String(activeZones.length)} hint={`${activePct}% del total`} iconClass="bg-app-green-soft text-app-green" icon={<Car size={20} />} />
        <StatMini label="Uso promedio" value={`${avgUsage}%`} hint="Esta semana" iconClass="bg-app-purple-soft text-app-purple" icon={<Users size={20} />} />
        <StatMini label="Tiempo promedio" value={formatWait(avgWait)} hint="Por entrega" iconClass="bg-app-orange-soft text-app-orange" icon={<Clock size={20} />} />
        <StatMini label="Entregas hoy" value={String(deliveriesToday)} hint="Hasta el momento" iconClass="bg-app-green-soft text-app-green" icon={<ShieldCheck size={20} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.9fr)_minmax(300px,1.1fr)_minmax(300px,0.95fr)]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          <h2 className="text-base font-bold">Lista de zonas de entrega</h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="relative min-w-0">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar zona..."
                className="w-full rounded-xl border border-app-line bg-app-bg py-2.5 pr-3 pl-9 text-sm outline-none focus:border-app-primary"
              />
            </label>
            <div className="flex gap-2">
              <MenuSelect
                ariaLabel="Filtrar por estado"
                value={statusFilter}
                options={statusFilters}
                onChange={(value) => {
                  setStatusFilter(value)
                  setPage(1)
                }}
                align="left"
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  filtersOpen || demandFilter !== "todos" ? "border-app-primary text-app-primary" : "border-app-line hover:bg-app-card-hover"
                }`}
              >
                <SlidersHorizontal size={15} />
                Filtros
              </button>
            </div>
            {filtersOpen ? (
              <MenuSelect
                ariaLabel="Filtrar por nivel de uso"
                value={demandFilter}
                options={demandFilters}
                onChange={(value) => {
                  setDemandFilter(value)
                  setPage(1)
                }}
                align="left"
              />
            ) : null}
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {pageItems.length === 0 ? (
              <p className="py-10 text-center text-sm text-app-muted">No hay zonas con esos filtros.</p>
            ) : (
              pageItems.map((zone) => {
                const isSelected = zone.id === selected.id
                const zoneDemand = demandBadge(demandFromUsage(zone.usagePct))
                const badge = zoneStatusBadge(zone.status)
                return (
                  <div
                    key={zone.id}
                    onClick={() => setZoneId(zone.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                      isSelected ? "border-app-primary bg-app-primary-soft/30" : "border-app-line hover:bg-app-card-hover"
                    }`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${colorClass(zone.color)}`}>
                      {zone.letter}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{zoneTitle(zone)}</p>
                          <p className="mt-0.5 text-xs text-app-muted">Capacidad: {zone.capacity} vehículos</p>
                          <p className="text-xs text-app-muted">Tiempo promedio: {formatWait(zone.avgWaitSec)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${zoneDemand.className}`}>
                            <span className={`size-1.5 rounded-full ${zoneDemand.dot}`} />
                            {zoneDemand.label}
                          </span>
                          <span onClick={(event) => event.stopPropagation()}>
                            <KebabMenu
                              ariaLabel={`Acciones de ${zone.name}`}
                              items={[
                                { id: "edit", label: "Editar zona", icon: <Pencil size={14} />, onClick: () => setFormZone(zone) },
                                { id: "assign", label: "Asignar responsable", icon: <UserPlus size={14} />, onClick: () => { setZoneId(zone.id); setAssignOpen(true) } },
                                {
                                  id: "delete",
                                  label: "Eliminar",
                                  danger: true,
                                  icon: <Trash2 size={14} />,
                                  onClick: () => {
                                    setZoneId(zone.id)
                                    setConfirmDelete(true)
                                  },
                                },
                              ]}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-app-line pt-3 text-xs text-app-muted">
            <p>
              Mostrando {from} a {to} de {filtered.length} zonas
            </p>
            <div className="flex gap-1">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="rounded-lg border border-app-line px-2.5 py-1.5 font-semibold disabled:opacity-40">
                Anterior
              </button>
              <button type="button" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)} className="rounded-lg border border-app-line px-2.5 py-1.5 font-semibold disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </div>
        </Card>

        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold">Mapa de zonas de entrega</h2>
            <button type="button" onClick={() => setFullMapOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-app-primary hover:underline">
              <Maximize2 size={13} />
              Ver en mapa completo
            </button>
          </div>
          <div className="mt-4 min-h-0 flex-1">
            <CampusMap
              zones={zones}
              selectedId={selected.id}
              zoom={zoom}
              onSelect={setZoneId}
              onZoomIn={() => setZoom((value) => Math.min(ZOOM_MAX, Number((value + ZOOM_STEP).toFixed(2))))}
              onZoomOut={() => setZoom((value) => Math.max(ZOOM_MIN, Number((value - ZOOM_STEP).toFixed(2))))}
              compact
            />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold tracking-wide text-app-muted uppercase">Nivel de uso</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
              <LegendDot className="bg-app-green" label="Alta (70-100%)" />
              <LegendDot className="bg-app-orange" label="Media (30-69%)" />
              <LegendDot className="bg-app-primary" label="Baja (0-29%)" />
            </div>
          </div>
        </Card>

        <Card className="flex min-h-[560px] flex-col overflow-hidden p-5 xl:max-h-[calc(100svh-12rem)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`grid size-12 shrink-0 place-items-center rounded-full text-lg font-extrabold ${colorClass(selected.color)}`}>
                {selected.letter}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold">{zoneTitle(selected)}</h2>
                <p className={`mt-0.5 text-xs font-bold ${demandUi.className}`}>{demandPhrase(demand)}</p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusUi.className}`}>{statusUi.label}</span>
          </div>

          <dl className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto text-sm">
            <DetailRow icon={<MapPin size={16} />} label="Ubicación" value={selected.location} />
            <DetailRow icon={<Car size={16} />} label="Capacidad" value={`${selected.capacity} vehículos`} />
            <DetailRow icon={<Clock size={16} />} label="Tiempo promedio" value={formatWait(selected.avgWaitSec)} />
            <div className="flex gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-app-bg text-app-muted">
                <BarChart3 size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-app-muted">Nivel de uso</dt>
                <dd className="mt-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-app-bg">
                      <div className={`h-full rounded-full ${usageBarClass(demand)}`} style={{ width: `${selected.usagePct}%` }} />
                    </div>
                    <span className="text-xs font-bold">{selected.usagePct}%</span>
                  </div>
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-app-bg text-app-muted">
                <Clock size={16} />
              </span>
              <div>
                <dt className="text-xs text-app-muted">Horario de operación</dt>
                <dd className="mt-0.5 font-semibold">
                  {formatHour12(selected.morningStart)} - {formatHour12(selected.morningEnd)}
                </dd>
                <dd className="font-semibold">
                  {formatHour12(selected.afternoonStart)} - {formatHour12(selected.afternoonEnd)}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-app-bg text-app-muted">
                <UserRound size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-app-muted">Responsable</dt>
                <dd className="truncate font-semibold">{selected.responsibleName}</dd>
              </div>
              {selected.responsiblePhone ? (
                <a
                  href={`tel:${selected.responsiblePhone}`}
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-app-primary text-white hover:bg-app-primary-hover"
                  aria-label={`Llamar a ${selected.responsibleName}`}
                >
                  <Phone size={15} />
                </a>
              ) : null}
            </div>
          </dl>

          <div className="mt-5">
            <h3 className="text-sm font-bold">Estadísticas de hoy</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStat icon={<Car size={14} />} value={String(selected.vehiclesToday)} label="Vehículos utilizados" />
              <MiniStat icon={<Users size={14} />} value={String(selected.studentsToday)} label="Alumnos entregados" />
              <MiniStat icon={<Clock size={14} />} value={formatWait(selected.avgWaitSec)} label="Tiempo promedio espera" />
              <MiniStat icon={<ShieldCheck size={14} />} value={String(selected.incidentsToday)} label="Incidencias" />
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-bold">Acciones rápidas</h3>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <QuickAction icon={<Pencil size={18} />} label="Editar zona" onClick={() => setFormZone(selected)} />
              <QuickAction icon={<UserPlus size={18} />} label="Asignar responsable" onClick={() => setAssignOpen(true)} />
              <QuickAction icon={<History size={18} />} label="Ver historial" onClick={() => setHistoryOpen(true)} />
              <QuickAction
                icon={<Power size={18} />}
                label={selected.status === "activo" ? "Desactivar zona" : "Activar zona"}
                onClick={toggleStatus}
                danger={selected.status === "activo"}
              />
            </div>
          </div>
        </Card>
      </div>

      {formZone !== undefined ? (
        <ZoneFormModal zone={formZone} zones={zones} guardians={school.guardians} onClose={() => setFormZone(undefined)} onSave={handleSave} />
      ) : null}

      {assignOpen ? (
        <AssignResponsibleModal
          zone={selected}
          guardians={school.guardians}
          onClose={() => setAssignOpen(false)}
          onAssign={handleAssign}
        />
      ) : null}

      {historyOpen ? (
        <Modal title={`Historial · ${selected.name}`} onClose={() => setHistoryOpen(false)}>
          <ul className="space-y-2">
            {zoneHistory(selected).length === 0 ? (
              <li className="text-sm text-app-muted">Las entregas de esta zona se verán en Historial cuando un padre avise.</li>
            ) : (
              zoneHistory(selected).map((item) => (
              <li key={item.id} className="flex gap-3 rounded-xl border border-app-line px-3 py-2.5">
                <span className="text-xs font-bold text-app-muted">{item.time}</span>
                <p className="text-sm">{item.text}</p>
              </li>
              ))
            )}
          </ul>
        </Modal>
      ) : null}

      {fullMapOpen ? (
        <Modal title="Mapa de zonas de entrega" onClose={() => setFullMapOpen(false)} className="max-w-4xl">
          <CampusMap
            zones={zones}
            selectedId={selected.id}
            zoom={zoom}
            onSelect={setZoneId}
            onZoomIn={() => setZoom((value) => Math.min(ZOOM_MAX, Number((value + ZOOM_STEP).toFixed(2))))}
            onZoomOut={() => setZoom((value) => Math.max(ZOOM_MIN, Number((value - ZOOM_STEP).toFixed(2))))}
          />
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold">
            <LegendDot className="bg-app-green" label="Alta (70-100%)" />
            <LegendDot className="bg-app-orange" label="Media (30-69%)" />
            <LegendDot className="bg-app-primary" label="Baja (0-29%)" />
          </div>
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal title="Eliminar zona" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-app-secondary">
            ¿Eliminar {zoneTitle(selected)}? Los grupos asignados a esta zona deben reasignarse antes.
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

function toDraft(zone: DeliveryZone, overrides: Partial<ZoneDraft> = {}): ZoneDraft {
  return {
    name: zone.name,
    description: zone.description,
    letter: zone.letter,
    location: zone.location,
    capacity: zone.capacity,
    avgWaitSec: zone.avgWaitSec,
    usagePct: zone.usagePct,
    status: zone.status,
    morningStart: zone.morningStart,
    morningEnd: zone.morningEnd,
    afternoonStart: zone.afternoonStart,
    afternoonEnd: zone.afternoonEnd,
    responsibleName: zone.responsibleName,
    responsiblePhone: zone.responsiblePhone,
    mapX: zone.mapX,
    mapY: zone.mapY,
    color: zone.color,
    ...overrides,
  }
}

function zoneStatusBadge(status: AcademicStatus) {
  if (status === "activo") return { label: "Activa", className: "bg-app-green-soft text-app-green" }
  return { label: "Inactiva", className: "bg-app-card-hover text-app-muted" }
}

function AssignResponsibleModal({
  zone,
  guardians,
  onClose,
  onAssign,
}: {
  zone: DeliveryZone
  guardians: Guardian[]
  onClose: () => void
  onAssign: (id: string) => void
}) {
  const [guardianId, setGuardianId] = useState(guardians.find((guardian) => guardian.name === zone.responsibleName)?.id ?? "")
  return (
    <Modal title="Asignar responsable" onClose={onClose}>
      <p className="mb-4 text-sm text-app-muted">Elige un responsable de la lista de tutores para {zone.name}.</p>
      <MenuSelect
        ariaLabel="Responsable"
        value={guardianId}
        align="left"
        options={[
          { value: "", label: "Selecciona un responsable" },
          ...guardians.slice(0, 60).map((guardian) => ({ value: guardian.id, label: guardian.name })),
        ]}
        onChange={setGuardianId}
      />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover">
          Cancelar
        </button>
        <button
          type="button"
          disabled={!guardianId}
          onClick={() => onAssign(guardianId)}
          className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover disabled:opacity-40"
        >
          Asignar
        </button>
      </div>
    </Modal>
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

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-app-bg text-app-muted">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-app-muted">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  )
}

function MiniStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-app-line bg-app-bg px-3 py-3">
      <span className="text-app-muted">{icon}</span>
      <p className="mt-1 text-lg font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-app-muted">{label}</p>
    </div>
  )
}

function QuickAction({
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
      className={`flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[11px] font-semibold ${
        danger
          ? "border-app-danger/40 text-app-danger hover:bg-app-danger-soft"
          : "border-app-line text-app-secondary hover:border-app-primary/40 hover:bg-app-card-hover hover:text-app-text"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${className}`} />
      {label}
    </span>
  )
}
