import { useEffect, useState, type FormEvent } from "react"
import { useSchool } from "../../context/SchoolContext"
import { Card } from "../ui/Card"

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-app-line bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none focus:border-app-primary"

export function SchoolSetupCard() {
  const { school, updateSchoolProfile } = useSchool()
  const [schoolName, setSchoolName] = useState(school.schoolName)
  const [adminName, setAdminName] = useState(school.adminName)
  const [adminEmail, setAdminEmail] = useState(school.adminEmail)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSchoolName(school.schoolName)
    setAdminName(school.adminName)
    setAdminEmail(school.adminEmail)
  }, [school.adminEmail, school.adminName, school.schoolName])

  function submit(event: FormEvent) {
    event.preventDefault()
    updateSchoolProfile({ schoolName, adminName, adminEmail })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2800)
  }

  return (
    <Card className="p-5">
      <h2 className="text-base font-bold">Datos de la escuela</h2>
      <p className="mt-1 text-sm text-app-muted">
        Este nombre aparece en el panel, en las TVs de salón y al sincronizar con la app de padres.
      </p>
      <form className="mt-4 grid gap-4 lg:grid-cols-3" onSubmit={submit}>
        <label className="text-sm font-semibold">
          Nombre de la escuela
          <input
            className={fieldClass}
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
            placeholder="Nombre de tu escuela"
          />
        </label>
        <label className="text-sm font-semibold">
          Nombre del administrador
          <input
            className={fieldClass}
            value={adminName}
            onChange={(event) => setAdminName(event.target.value)}
            placeholder="Tu nombre"
          />
        </label>
        <label className="text-sm font-semibold">
          Correo institucional
            <input
            type="email"
            className={fieldClass}
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value.trim().slice(0, 80))}
            placeholder="direccion@escuela.edu"
            maxLength={80}
          />
        </label>
        <div className="flex items-center gap-3 lg:col-span-3">
          <button
            type="submit"
            className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Guardar datos
          </button>
          {saved ? <p className="text-sm font-medium text-app-green">Datos guardados.</p> : null}
        </div>
      </form>
    </Card>
  )
}
