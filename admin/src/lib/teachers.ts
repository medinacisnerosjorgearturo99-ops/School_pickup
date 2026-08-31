import { diffMonthsDays, todayISO } from "./cycle"
import type { GradeGroup, Teacher } from "../types/school"

export const TEACHER_SUBJECTS = [
  "Matemáticas",
  "Español",
  "Ciencias Naturales",
  "Historia",
  "Inglés",
  "Ed. Física",
  "Arte",
  "Computación",
  "Formación",
] as const

export const TEACHER_AREAS = ["Matemáticas", "Lenguaje", "Ciencias", "Idiomas", "Formación", "Arte y movimiento"] as const

const subjectClass: Record<string, string> = {
  Matemáticas: "bg-app-blue-soft text-app-primary",
  Español: "bg-app-danger-soft text-app-danger",
  "Ciencias Naturales": "bg-app-green-soft text-app-green",
  Historia: "bg-app-orange-soft text-app-orange",
  Inglés: "bg-app-purple-soft text-app-purple",
  "Ed. Física": "bg-app-orange-soft text-app-orange",
  Arte: "bg-app-danger-soft text-app-danger",
  Computación: "bg-app-purple-soft text-app-purple",
  Formación: "bg-app-blue-soft text-app-primary",
}

export function subjectBadgeClass(subject: string) {
  return subjectClass[subject] ?? "bg-app-card-hover text-app-secondary"
}

export function nextEmployeeId(teachers: Teacher[]) {
  let max = 0
  for (const teacher of teachers) {
    const value = Number(teacher.employeeId.replace(/\D/g, ""))
    if (Number.isFinite(value) && value > max) max = value
  }
  return `PRO-${String(max + 1).padStart(4, "0")}`
}

export function assignedGroups(teacher: Teacher, groups: GradeGroup[], cycleId: string) {
  return groups.filter(
    (group) =>
      group.cycleId === cycleId && (group.teacherId === teacher.id || teacher.extraGroupIds.includes(group.id)),
  )
}

export function groupLabels(groups: GradeGroup[]) {
  return groups.map((group) => {
    if (group.grade.startsWith("Kinder")) return `K${group.letter}`
    const num = group.grade.match(/\d+/)?.[0]
    return num ? `${num}°${group.letter}` : `${group.grade} ${group.letter}`
  })
}

export function seniorityPhrase(hiredAt: string, today = todayISO()) {
  const { months } = diffMonthsDays(hiredAt, today)
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years <= 0) return rest <= 1 ? "1 mes" : `${rest} meses`
  const yearPart = years === 1 ? "1 año" : `${years} años`
  if (rest === 0) return yearPart
  return `${yearPart}, ${rest} ${rest === 1 ? "mes" : "meses"}`
}

export function upcomingClasses(teacher: Teacher, groups: GradeGroup[], cycleId: string) {
  const subject = teacher.subjects[0] ?? "Clase"
  return assignedGroups(teacher, groups, cycleId)
    .slice(0, 3)
    .map((group) => {
      const slot =
        group.schedule.find((entry) => teacher.subjects.includes(entry.subject)) ??
        group.schedule[0] ?? { start: "08:00", subject, day: "Lun" }
      return {
        id: `${teacher.id}-${group.id}`,
        title: `${group.grade} - ${group.letter}`,
        subject: slot.subject || subject,
        start: slot.start,
        classroom: group.classroom,
      }
    })
}

export function teacherDocuments(teacher: Teacher) {
  return [
    { id: `${teacher.id}-contrato`, name: "Contrato laboral", kind: "Laboral", uploadedAt: teacher.hiredAt },
    { id: `${teacher.id}-ine`, name: "Identificación oficial", kind: "Identificación", uploadedAt: teacher.hiredAt },
    { id: `${teacher.id}-titulo`, name: "Título profesional", kind: "Académico", uploadedAt: teacher.hiredAt },
  ]
}

export function teacherEvaluations(teacher: Teacher) {
  return [
    { id: `${teacher.id}-e1`, period: "1er bimestre", rating: teacher.rating, note: "Dominio de grupo y claridad en clase." },
    { id: `${teacher.id}-e2`, period: "2º bimestre", rating: Math.min(5, Math.round((teacher.rating + 0.2) * 10) / 10), note: "Buena comunicación con familias." },
    { id: `${teacher.id}-e3`, period: "Dirección", rating: teacher.rating, note: "Cumple horarios y reportes de asistencia." },
  ]
}

export function parseTeacherCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return [] as { firstName: string; lastName: string; email: string; subject: string; area: string }[]
  const start = /nombre|name/i.test(lines[0] ?? "") ? 1 : 0
  return lines.slice(start).flatMap((line) => {
    const cells = line.split(/[,;\t]/).map((cell) => cell.trim().replace(/^"|"$/g, ""))
    const [firstName, lastName, email, subject, area] = cells
    if (!firstName || !lastName) return []
    return [
      {
        firstName,
        lastName,
        email: email ?? "",
        subject: subject || "Formación",
        area: area || "Formación",
      },
    ]
  })
}
