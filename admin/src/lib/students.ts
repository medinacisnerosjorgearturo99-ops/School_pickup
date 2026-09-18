import { todayISO } from "./cycle"
import { gradeColorKeys } from "./grades"
import type { Gender, GradeGroup, Guardian, GuardianKind, Student } from "../types/school"

export const GUARDIAN_RELATIONS = [
  "Madre",
  "Padre",
  "Tutor legal",
  "Abuela",
  "Abuelo",
  "Tía",
  "Tío",
  "Hermano",
  "Hermana",
  "Autorizado",
] as const

export function guardianKindLabel(kind: GuardianKind) {
  return kind === "PRIMARY" ? "Principal" : "Autorizado"
}

export function studentFullName(student: Pick<Student, "firstName" | "lastName">) {
  return `${student.firstName} ${student.lastName}`
}

export function studentInitials(student: Pick<Student, "firstName" | "lastName">) {
  const last = student.lastName.trim().split(/\s+/)[0] ?? ""
  return `${student.firstName.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase()
}

export function avatarTone(id: string) {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % gradeColorKeys.length
  return gradeColorKeys[hash] ?? "blue"
}

export function ageYears(birthDate: string, today = todayISO()) {
  if (!birthDate) return 0
  const birth = new Date(`${birthDate}T00:00:00`)
  const now = new Date(`${today}T00:00:00`)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(now.getTime())) return 0
  let age = now.getFullYear() - birth.getFullYear()
  const month = now.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1
  return Math.max(0, age)
}

export function nextBirthdayDate(birthDate: string, today = todayISO()) {
  const birth = new Date(`${birthDate}T00:00:00`)
  const now = new Date(`${today}T00:00:00`)
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  return next
}

export function daysUntilBirthday(birthDate: string, today = todayISO()) {
  const now = new Date(`${today}T00:00:00`)
  const next = nextBirthdayDate(birthDate, today)
  return Math.round((next.getTime() - now.getTime()) / 86_400_000)
}

export function isBirthdaySoon(birthDate: string, withinDays = 7, today = todayISO()) {
  if (!birthDate) return false
  const days = daysUntilBirthday(birthDate, today)
  return days >= 0 && days <= withinDays
}

export function formatDayMonth(iso: string) {
  const formatted = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long" }).format(
    new Date(`${iso}T00:00:00`),
  )
  return formatted.replace(/ de ([a-záéíóúñ])/u, (_, letter: string) => ` de ${letter.toUpperCase()}`)
}

export function nextMatricula(students: Student[], year: string) {
  const prefix = `A-${year}-`
  let max = 0
  for (const student of students) {
    if (!student.matricula.startsWith(prefix)) continue
    const value = Number(student.matricula.slice(prefix.length))
    if (Number.isFinite(value) && value > max) max = value
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`
}

export function makeCurp(lastName: string, firstName: string, birthDate: string, gender: Gender) {
  const last = lastName
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .padEnd(4, "X")
  const first = firstName
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .padEnd(2, "X")
  const [year, month, day] = birthDate.split("-")
  const sex = gender === "Femenino" ? "M" : "H"
  return `${last.slice(0, 4)}${first.slice(0, 1)}${(year ?? "16").slice(2)}${month ?? "01"}${day ?? "01"}${sex}MCRZS09`.slice(
    0,
    18,
  )
}

export function createStudentDefaults(input: {
  id?: string
  firstName: string
  lastName: string
  cycleId: string
  groupId: string
  matricula: string
  guardianIds?: string[]
  status?: Student["status"]
  attendancePct?: number
  birthDate?: string
  enrolledAt?: string
  gender?: Gender
  nationality?: string
  curp?: string
  address?: string
  bloodType?: string
  allergies?: string
  medicalNotes?: string
  isNew?: boolean
}): Student {
  const gender = input.gender ?? "Masculino"
  const birthDate = input.birthDate ?? ""
  return {
    id: input.id ?? `alu-${Date.now().toString(36)}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    cycleId: input.cycleId,
    groupId: input.groupId,
    guardianIds: input.guardianIds ?? [],
    matricula: input.matricula,
    status: input.status ?? "activo",
    attendancePct: input.attendancePct ?? 0,
    birthDate,
    enrolledAt: input.enrolledAt ?? todayISO(),
    gender,
    nationality: input.nationality ?? "Mexicana",
    curp: input.curp ?? makeCurp(input.lastName, input.firstName, birthDate, gender),
    address: input.address ?? "",
    bloodType: input.bloodType ?? "",
    allergies: input.allergies ?? "",
    medicalNotes: input.medicalNotes ?? "",
    isNew: input.isNew ?? false,
  }
}

export function syncGroupCounts(groups: GradeGroup[], students: Student[]): GradeGroup[] {
  return groups.map((group) => {
    const members = students.filter((student) => student.groupId === group.id)
    return {
      ...group,
      studentCount: members.length,
      inactiveCount: members.filter((student) => student.status === "inactivo").length,
    }
  })
}

export function parseStudentCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return [] as { firstName: string; lastName: string; grade: string; letter: string }[]
  const start = /nombre|name/i.test(lines[0] ?? "") ? 1 : 0
  return lines.slice(start).flatMap((line) => {
    const cells = line.split(/[,;\t]/).map((cell) => cell.trim().replace(/^"|"$/g, ""))
    const [firstName, lastName, grade, letter] = cells
    if (!firstName || !lastName) return []
    return [
      {
        firstName,
        lastName,
        grade: grade ?? "",
        letter: (letter ?? "A").slice(0, 1).toUpperCase(),
      },
    ]
  })
}

export function attendanceSeries(_pct: number) {
  return [] as Array<{ label: string; pct: number }>
}

export function pickupHistory(_student: Student) {
  return [] as Array<{ id: string; date: string; zone: string; status: string }>
}

export function upsertGuardians(
  current: Guardian[],
  drafts: Array<{
    id?: string
    name: string
    email: string
    password?: string
    phone: string
    relation: string
    kind: GuardianKind
  }>,
): { guardians: Guardian[]; ids: string[] } | { error: string } {
  const filled = drafts.filter((draft) => draft.name.trim() || draft.email.trim() || draft.phone.trim())
  let guardians = current.slice()
  const ids: string[] = []

  for (const draft of filled) {
    const name = draft.name.trim()
    const email = draft.email.trim()
    const phone = draft.phone.trim()
    const relation = draft.relation.trim() || "Tutor legal"
    if (!name) return { error: "Cada responsable necesita un nombre." }
    if (!email || !email.includes("@")) {
      return { error: "Cada responsable necesita un correo válido. Es el acceso a la app de padres." }
    }

    const byId = draft.id ? guardians.find((guardian) => guardian.id === draft.id) : undefined
    const byEmail = guardians.find((guardian) => guardian.email.toLowerCase() === email.toLowerCase())
    const target = byId ?? byEmail
    const saved: Guardian = {
      id: target?.id ?? `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      email,
      password: draft.password?.trim() || target?.password || generateParentPassword(),
      phone,
      relation,
      kind: draft.kind,
    }
    guardians = target
      ? guardians.map((guardian) => (guardian.id === saved.id ? saved : guardian))
      : [...guardians, saved]
    if (!ids.includes(saved.id)) ids.push(saved.id)
  }

  return { guardians, ids }
}

export function generateParentPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export function studentDocuments(_student: Student) {
  return [] as Array<{ id: string; name: string; kind: string; uploadedAt: string }>
}
