import { useState, type FormEvent } from "react"
import type { ZoneDraft } from "../../context/SchoolContext"
import { gradeColorKeys } from "../../lib/grades"
import { nextZoneLetter } from "../../lib/zones"
import type { AcademicStatus, DeliveryZone, Guardian } from "../../types/school"
import { MenuSelect } from "../ui/MenuSelect"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

export function ZoneFormModal({
  zone,
  zones,
  guardians,
  onClose,
  onSave,
}: {
  zone: DeliveryZone | null
  zones: DeliveryZone[]
  guardians: Guardian[]
  onClose: () => void
  onSave: (draft: ZoneDraft, id?: string) => { id: string } | { error: string }
}) {
  const [name, setName] = useState(zone?.name ?? `Zona ${nextZoneLetter(zones)}`)
  const [letter, setLetter] = useState(zone?.letter ?? nextZoneLetter(zones))
  const [description, setDescription] = useState(zone?.description ?? "")
  const [location, setLocation] = useState(zone?.location ?? "")
  const [capacity, setCapacity] = useState(String(zone?.capacity ?? 12))
  const [avgWaitSec, setAvgWaitSec] = useState(String(zone?.avgWaitSec ?? 240))
  const [usagePct, setUsagePct] = useState(String(zone?.usagePct ?? 40))
  const [status, setStatus] = useState<AcademicStatus>(zone?.status ?? "activo")
  const [morningStart, setMorningStart] = useState(zone?.morningStart ?? "07:00")
  const [morningEnd, setMorningEnd] = useState(zone?.morningEnd ?? "08:00")
  const [afternoonStart, setAfternoonStart] = useState(zone?.afternoonStart ?? "13:00")
  const [afternoonEnd, setAfternoonEnd] = useState(zone?.afternoonEnd ?? "15:00")
  const [responsibleName, setResponsibleName] = useState(zone?.responsibleName ?? "")
  const [responsiblePhone, setResponsiblePhone] = useState(zone?.responsiblePhone ?? "")
  const [color, setColor] = useState(zone?.color ?? "blue")
  const [mapX, setMapX] = useState(String(zone?.mapX ?? 50))
  const [mapY, setMapY] = useState(String(zone?.mapY ?? 50))
  const [error, setError] = useState("")

  function applyGuardian(id: string) {
    const guardian = guardians.find((item) => item.id === id)
    if (!guardian) return
    setResponsibleName(guardian.name)
    setResponsiblePhone(guardian.phone)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const cap = Number(capacity)
    const wait = Number(avgWaitSec)
    const usage = Number(usagePct)
    const x = Number(mapX)
    const y = Number(mapY)
    if (!Number.isFinite(cap) || cap < 1) {
      setError("La capacidad debe ser mayor a 0.")
      return
    }
    const result = onSave(
      {
        name,
        description,
        letter,
        location,
        capacity: Math.round(cap),
        avgWaitSec: Number.isFinite(wait) ? wait : 240,
        usagePct: Number.isFinite(usage) ? Math.min(100, Math.max(0, usage)) : 40,
        status,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        responsibleName,
        responsiblePhone,
        mapX: Number.isFinite(x) ? x : 50,
        mapY: Number.isFinite(y) ? y : 50,
        color,
      },
      zone?.id,
    )
    if ("error" in result) setError(result.error)
  }

  return (
    <Modal title={zone ? "Editar zona de entrega" : "Nueva zona de entrega"} onClose={onClose} className="max-w-2xl">
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-[1fr_80px]">
          <label className="text-sm font-semibold">
            Nombre
            <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Zona A" autoFocus />
          </label>
          <label className="text-sm font-semibold">
            Letra
            <input className={fieldClass} value={letter} maxLength={1} onChange={(event) => setLetter(event.target.value.toUpperCase())} />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Ubicación
          <input className={fieldClass} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Entrada principal del colegio" />
        </label>
        <label className="text-sm font-semibold">
          Descripción
          <input className={fieldClass} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Acceso principal" />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Capacidad
            <input type="number" min={1} className={fieldClass} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Espera (seg)
            <input type="number" min={0} className={fieldClass} value={avgWaitSec} onChange={(event) => setAvgWaitSec(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Uso %
            <input type="number" min={0} max={100} className={fieldClass} value={usagePct} onChange={(event) => setUsagePct(event.target.value)} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Horario matutino
            <div className="grid grid-cols-2 gap-2">
              <input type="time" className={fieldClass} value={morningStart} onChange={(event) => setMorningStart(event.target.value)} />
              <input type="time" className={fieldClass} value={morningEnd} onChange={(event) => setMorningEnd(event.target.value)} />
            </div>
          </label>
          <label className="text-sm font-semibold">
            Horario vespertino
            <div className="grid grid-cols-2 gap-2">
              <input type="time" className={fieldClass} value={afternoonStart} onChange={(event) => setAfternoonStart(event.target.value)} />
              <input type="time" className={fieldClass} value={afternoonEnd} onChange={(event) => setAfternoonEnd(event.target.value)} />
            </div>
          </label>
        </div>
        <label className="text-sm font-semibold">
          Responsable
          <div className="mt-1.5">
            <MenuSelect
              ariaLabel="Responsable"
              value={guardians.find((guardian) => guardian.name === responsibleName)?.id ?? ""}
              align="left"
              options={[
                { value: "", label: "Escribir manualmente" },
                ...guardians.slice(0, 40).map((guardian) => ({ value: guardian.id, label: guardian.name })),
              ]}
              onChange={applyGuardian}
            />
          </div>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Nombre del responsable
            <input className={fieldClass} value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Teléfono
            <input className={fieldClass} value={responsiblePhone} onChange={(event) => setResponsiblePhone(event.target.value)} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Estado
            <div className="mt-1.5">
              <MenuSelect
                ariaLabel="Estado"
                value={status}
                align="left"
                options={[
                  { value: "activo", label: "Activa" },
                  { value: "inactivo", label: "Inactiva" },
                ]}
                onChange={setStatus}
              />
            </div>
          </label>
          <label className="text-sm font-semibold">
            Mapa X %
            <input type="number" min={4} max={96} className={fieldClass} value={mapX} onChange={(event) => setMapX(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Mapa Y %
            <input type="number" min={4} max={96} className={fieldClass} value={mapY} onChange={(event) => setMapY(event.target.value)} />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Color</legend>
          <div className="mt-2 flex gap-2">
            {gradeColorKeys.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={color === key}
                onClick={() => setColor(key)}
                className={`grid size-9 place-items-center rounded-full border-2 ${color === key ? "border-app-text" : "border-transparent"}`}
              >
                <span className={`size-7 rounded-full ${key === "orange" ? "bg-app-orange" : key === "green" ? "bg-app-green" : key === "purple" ? "bg-app-purple" : "bg-app-primary"}`} />
              </button>
            ))}
          </div>
        </fieldset>
        {error ? <p className="text-sm font-medium text-app-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover">
            {zone ? "Guardar cambios" : "Crear zona"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
