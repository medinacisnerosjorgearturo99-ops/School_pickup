import { useState, type FormEvent } from "react"
import { Modal } from "../ui/Modal"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

export function ImportStudentsModal({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (csv: string) => { count: number } | { error: string }
}) {
  const [csv, setCsv] = useState("Nombre,Apellido,Grado,Grupo")
  const [error, setError] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = onImport(csv)
    if ("error" in result) setError(result.error)
  }

  return (
    <Modal title="Importar alumnos" onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <p className="text-sm text-app-secondary">
          Pega un CSV con columnas <strong>Nombre, Apellido, Grado, Grupo</strong>. El grado y el grupo deben existir en el ciclo actual.
        </p>
        <label className="text-sm font-semibold">
          Archivo CSV
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="mt-1.5 block w-full text-sm text-app-muted file:mr-3 file:rounded-lg file:border-0 file:bg-app-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              void file.text().then(setCsv)
            }}
          />
        </label>
        <label className="text-sm font-semibold">
          Contenido
          <textarea className={`${fieldClass} min-h-[160px] resize-y font-mono text-xs`} value={csv} onChange={(event) => setCsv(event.target.value)} />
        </label>
        {error ? <p className="text-sm font-medium text-app-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-app-line px-4 py-2.5 text-sm font-semibold hover:bg-app-card-hover">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-primary-hover">
            Importar
          </button>
        </div>
      </form>
    </Modal>
  )
}
