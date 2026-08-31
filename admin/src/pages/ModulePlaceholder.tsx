import { useLocation } from "react-router-dom"
import { navItems } from "../nav"
import { Card } from "../components/ui/Card"

export function ModulePlaceholder() {
  const { pathname } = useLocation()
  const item = navItems.find((nav) => nav.to === pathname)

  return (
    <div className="mx-auto max-w-[780px]">
      <h1 className="text-[28px] font-extrabold tracking-tight">{item?.label ?? "Módulo"}</h1>
      <p className="mt-1 text-sm text-app-muted">Configuración de dirección escolar</p>
      <Card className="mt-6 p-6">
        <p className="text-sm leading-6 text-app-secondary">
          {item?.description ?? "Este módulo se construirá a continuación."}
        </p>
        <p className="mt-4 text-sm leading-6 text-app-muted">
          La vista de Inicio ya concentra el ciclo, grupos, alumnos, profesores y pantallas.
          Este módulo se habilitará en el siguiente paso para que dirección capture los datos
          que después verán padres, docentes y las TVs de salón.
        </p>
      </Card>
    </div>
  )
}
