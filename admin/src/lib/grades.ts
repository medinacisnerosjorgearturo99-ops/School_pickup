import type { AcademicGrade, GradeGroup, ScheduleEntry } from "../types/school"

export const gradeColorClass: Record<string, string> = {
  orange: "bg-app-orange-soft text-app-orange",
  blue: "bg-app-blue-soft text-app-primary",
  green: "bg-app-green-soft text-app-green",
  purple: "bg-app-purple-soft text-app-purple",
}

export const gradeColorKeys = ["orange", "blue", "green", "purple"] as const

export function colorClass(color: string) {
  return gradeColorClass[color] ?? gradeColorClass.blue
}

export function nextLetter(existing: string[]) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (const letter of alphabet) {
    if (!existing.includes(letter)) return letter
  }
  return "Z"
}

export function defaultSchedule(): ScheduleEntry[] {
  return [
    { id: "h1", day: "Lun", start: "08:00", subject: "Español" },
    { id: "h2", day: "Lun", start: "09:00", subject: "Matemáticas" },
    { id: "h3", day: "Mar", start: "08:00", subject: "Ciencias" },
    { id: "h4", day: "Mié", start: "08:00", subject: "Inglés" },
    { id: "h5", day: "Jue", start: "08:00", subject: "Educación Física" },
    { id: "h6", day: "Vie", start: "08:00", subject: "Formación" },
  ]
}

export function groupTitle(group: Pick<GradeGroup, "grade" | "letter">) {
  return `${group.grade} · ${group.letter}`
}

export function gradeShort(name: string) {
  if (name.startsWith("Kinder")) return "K"
  if (name.includes("Secundaria")) return "S"
  return name.match(/\d+/)?.[0] ?? name.slice(0, 1).toUpperCase()
}

export function academicBadge(status: AcademicGrade["status"] | GradeGroup["status"]) {
  if (status === "activo") {
    return { label: "Activo", className: "bg-app-green-soft text-app-green" }
  }
  return { label: "Inactivo", className: "bg-app-card-hover text-app-muted" }
}

export function summarizeGrades(grades: AcademicGrade[], groups: GradeGroup[]) {
  return grades
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((grade) => {
      const belonging = groups.filter((group) => group.gradeId === grade.id)
      return {
        ...grade,
        groupCount: belonging.length,
        studentCount: belonging.reduce((sum, group) => sum + group.studentCount, 0),
      }
    })
}
