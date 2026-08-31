import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { SchoolProvider } from "./context/SchoolContext"
import { ThemeProvider } from "./context/ThemeContext"
import { AppLayout } from "./components/layout/AppLayout"
import { InicioPage } from "./pages/InicioPage"
import { CiclosPage } from "./pages/CiclosPage"
import { GradosPage } from "./pages/GradosPage"
import { AlumnosPage } from "./pages/AlumnosPage"
import { ProfesoresPage } from "./pages/ProfesoresPage"
import { ZonasPage } from "./pages/ZonasPage"
import { PantallasPage } from "./pages/PantallasPage"
import { ModulePlaceholder } from "./pages/ModulePlaceholder"

export default function App() {
  return (
    <ThemeProvider>
      <SchoolProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<InicioPage />} />
              <Route path="ciclos" element={<CiclosPage />} />
              <Route path="grados" element={<GradosPage />} />
              <Route path="alumnos" element={<AlumnosPage />} />
              <Route path="profesores" element={<ProfesoresPage />} />
              <Route path="zonas" element={<ZonasPage />} />
              <Route path="responsables" element={<Navigate to="/alumnos" replace />} />
              <Route path="pantallas" element={<PantallasPage />} />
              <Route path="historial" element={<ModulePlaceholder />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SchoolProvider>
    </ThemeProvider>
  )
}
