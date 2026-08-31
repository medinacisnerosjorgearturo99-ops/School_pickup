import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { CURRENT_CYCLE_ID, schoolSeed } from "../data/seed"
import { addYears, deriveCycleStatus, labelFromDates } from "../lib/cycle"
import { defaultSchedule, gradeShort } from "../lib/grades"
import { createStudentDefaults, nextMatricula, parseStudentCsv, syncGroupCounts, upsertGuardians } from "../lib/students"
import { nextEmployeeId, parseTeacherCsv } from "../lib/teachers"
import { buildSchoolSync, ensureScreens, publishSchoolSync, screenFromGroup } from "../lib/tvSync"
import type {
  AcademicGrade,
  AcademicStatus,
  ActivityPeriod,
  ClassroomScreen,
  CycleStatus,
  Gender,
  GuardianKind,
  GradeGroup,
  Guardian,
  SchoolCycle,
  SchoolState,
  Shift,
  Student,
  Teacher,
  DeliveryZone,
} from "../types/school"

export type TvSyncStatus = "idle" | "syncing" | "ok" | "error"

const CYCLES_KEY = "recogeya-cycles"
const ACADEMIC_KEY = "recogeya-academic"
const TEACHERS_KEY = "recogeya-teachers"
const ZONES_KEY = "recogeya-zones"
const SCREENS_KEY = "recogeya-screens"

export interface CycleDraft {
  label: string
  startDate: string
  endDate: string
  schoolDays: number
  notes: string
  makeActive: boolean
}

export interface GradeDraft {
  name: string
  shortLabel: string
  color: string
  status: AcademicStatus
}

export interface GroupDraft {
  gradeId: string
  letter: string
  classroom: string
  teacherId: string
  zoneId: string
  shift: Shift
  status: AcademicStatus
  capacity: number
}

export interface GuardianDraft {
  id?: string
  name: string
  email: string
  phone: string
  relation: string
  kind: GuardianKind
}

export interface StudentDraft {
  firstName: string
  lastName: string
  groupId: string
  status: AcademicStatus
  birthDate: string
  gender: Gender
  curp: string
  address: string
  bloodType: string
  allergies: string
  medicalNotes: string
  guardians: GuardianDraft[]
}

export interface TeacherDraft {
  firstName: string
  lastName: string
  email: string
  active: boolean
  subjects: string[]
  area: string
  role: string
  hoursPerWeek: number
  rating: number
  hiredAt: string
  gender: Gender
  birthDate: string
  curp: string
  rfc: string
  phone: string
  personalEmail: string
  address: string
}

export interface ZoneDraft {
  name: string
  description: string
  letter: string
  location: string
  capacity: number
  avgWaitSec: number
  usagePct: number
  status: AcademicStatus
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
  responsibleName: string
  responsiblePhone: string
  mapX: number
  mapY: number
  color: string
}

interface DashboardStats {
  groups: number
  groupsDelta: number
  students: number
  studentsDelta: number
  teachers: number
  teachersActivePct: number
  screens: number
  screensOnline: number
}

interface SchoolContextValue {
  school: SchoolState
  cycleId: string
  selectedCycle: SchoolCycle
  setCycleId: (id: string) => void
  activityPeriod: ActivityPeriod
  setActivityPeriod: (period: ActivityPeriod) => void
  stats: DashboardStats
  saveCycle: (draft: CycleDraft, id?: string) => string
  duplicateCycle: (id: string) => string | null
  deleteCycle: (id: string) => string | null
  saveGrade: (draft: GradeDraft, id?: string) => string
  deleteGrade: (id: string) => string | null
  saveGroup: (draft: GroupDraft, id?: string) => { id: string } | { error: string }
  deleteGroup: (id: string) => string | null
  addStudentToGroup: (groupId: string, firstName: string, lastName: string) => { id: string } | { error: string }
  saveStudent: (draft: StudentDraft, id?: string) => { id: string } | { error: string }
  deleteStudent: (id: string) => string | null
  importStudents: (csv: string) => { count: number } | { error: string }
  saveTeacher: (draft: TeacherDraft, id?: string) => { id: string } | { error: string }
  deleteTeacher: (id: string) => string | null
  importTeachers: (csv: string) => { count: number } | { error: string }
  saveZone: (draft: ZoneDraft, id?: string) => { id: string } | { error: string }
  deleteZone: (id: string) => string | null
  assignTeacher: (groupId: string, teacherId: string) => void
  addScheduleEntry: (groupId: string, day: string, start: string, subject: string) => void
  removeScheduleEntry: (groupId: string, entryId: string) => void
  bindScreen: (screenId: string, groupId: string | null) => void
  toggleScreenOnline: (screenId: string) => void
  syncNow: () => Promise<void>
  syncStatus: TvSyncStatus
  lastSyncAt: string | null
}

const SchoolContext = createContext<SchoolContextValue | null>(null)

function readStoredCycles(): SchoolCycle[] | null {
  try {
    const raw = localStorage.getItem(CYCLES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SchoolCycle[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (!parsed.every((cycle) => cycle.id && cycle.label && cycle.startDate && cycle.endDate)) return null
    return parsed
  } catch {
    return null
  }
}

function persistCycles(cycles: SchoolCycle[]) {
  try {
    localStorage.setItem(CYCLES_KEY, JSON.stringify(cycles))
  } catch {
    /* ignore */
  }
}

function studentsAreComplete(students: Student[]) {
  return students.length > 40 && students.every((student) => Boolean(student.matricula) && Boolean(student.birthDate))
}

function readAcademic() {
  try {
    const raw = localStorage.getItem(ACADEMIC_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Pick<SchoolState, "grades" | "groups" | "students" | "guardians">
    if (!Array.isArray(parsed.grades) || !Array.isArray(parsed.groups) || !Array.isArray(parsed.students)) return null
    return {
      grades: parsed.grades,
      groups: parsed.groups,
      students: studentsAreComplete(parsed.students) ? parsed.students : null,
      guardians: Array.isArray(parsed.guardians) && parsed.guardians.length > 0 ? parsed.guardians : null,
    }
  } catch {
    return null
  }
}

function persistTeachers(teachers: Teacher[]) {
  try {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers))
  } catch {
    /* ignore */
  }
}

function readTeachers(): Teacher[] | null {
  try {
    const raw = localStorage.getItem(TEACHERS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Teacher[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (!parsed.every((teacher) => teacher.id && teacher.employeeId && Array.isArray(teacher.subjects))) return null
    return parsed
  } catch {
    return null
  }
}

function persistZones(zones: DeliveryZone[]) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones))
  } catch {
    /* ignore */
  }
}

function readZones(): DeliveryZone[] | null {
  try {
    const raw = localStorage.getItem(ZONES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DeliveryZone[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (!parsed.every((zone) => zone.id && zone.letter && typeof zone.capacity === "number")) return null
    return parsed
  } catch {
    return null
  }
}

function persistAcademic(grades: AcademicGrade[], groups: GradeGroup[], students: Student[], guardians: Guardian[]) {
  try {
    localStorage.setItem(ACADEMIC_KEY, JSON.stringify({ grades, groups, students, guardians }))
  } catch {
    /* ignore */
  }
}

function persistScreens(screens: ClassroomScreen[]) {
  try {
    localStorage.setItem(SCREENS_KEY, JSON.stringify(screens))
  } catch {
    /* ignore */
  }
}

function readScreens(): ClassroomScreen[] | null {
  try {
    const raw = localStorage.getItem(SCREENS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ClassroomScreen[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (!parsed.every((screen) => screen.id && screen.cycleId)) return null
    return parsed
  } catch {
    return null
  }
}

function nowISO() {
  return new Date().toISOString()
}

function applyActiveRule(cycles: SchoolCycle[], activeId: string | null): SchoolCycle[] {
  return cycles.map((cycle): SchoolCycle => {
    if (activeId && cycle.id === activeId) return { ...cycle, status: "activo" }
    if (cycle.status === "activo") {
      const demoted: CycleStatus = deriveCycleStatus(cycle.startDate, cycle.endDate) === "proximo" ? "proximo" : "cerrado"
      return { ...cycle, status: demoted }
    }
    return { ...cycle, status: deriveCycleStatus(cycle.startDate, cycle.endDate) }
  })
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [school, setSchool] = useState<SchoolState>(() => {
    const academic = readAcademic()
    const students = academic?.students ?? schoolSeed.students
    const groups = academic?.groups ?? schoolSeed.groups
    const guardians = academic?.students ? academic.guardians ?? schoolSeed.guardians : schoolSeed.guardians
    return {
      ...schoolSeed,
      cycles: readStoredCycles() ?? schoolSeed.cycles,
      grades: academic?.grades ?? schoolSeed.grades,
      groups: academic?.students ? groups : syncGroupCounts(groups, students),
      students,
      guardians,
      teachers: readTeachers() ?? schoolSeed.teachers,
      zones: readZones() ?? schoolSeed.zones,
      screens: ensureScreens(academic?.students ? groups : syncGroupCounts(groups, students), readScreens() ?? schoolSeed.screens),
    }
  })
  const [cycleId, setCycleId] = useState(CURRENT_CYCLE_ID)
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>("esta-semana")
  const [syncStatus, setSyncStatus] = useState<TvSyncStatus>("idle")
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const patchAcademic = useCallback(
    (patch: Partial<Pick<SchoolState, "grades" | "groups" | "students" | "guardians" | "screens">>) => {
      setSchool((current) => {
        const next = { ...current, ...patch }
        persistAcademic(next.grades, next.groups, next.students, next.guardians)
        if (patch.screens) persistScreens(next.screens)
        return next
      })
    },
    [],
  )

  const patchScreens = useCallback((screens: ClassroomScreen[]) => {
    persistScreens(screens)
    setSchool((current) => ({ ...current, screens }))
  }, [])

  const setCycles = useCallback((next: SchoolCycle[], preferredId?: string) => {
    persistCycles(next)
    setSchool((current) => ({ ...current, cycles: next }))
    setCycleId((currentId) => {
      if (preferredId && next.some((cycle) => cycle.id === preferredId)) return preferredId
      if (next.some((cycle) => cycle.id === currentId)) return currentId
      return next.find((cycle) => cycle.status === "activo")?.id ?? next[0]?.id ?? currentId
    })
  }, [])

  const saveCycle = useCallback(
    (draft: CycleDraft, id?: string) => {
      const derived = deriveCycleStatus(draft.startDate, draft.endDate)
      const status = draft.makeActive ? "activo" : derived
      const cycleIdToUse = id ?? `ciclo-${draft.startDate.slice(0, 4)}-${Date.now().toString(36)}`
      const existing = school.cycles.find((cycle) => cycle.id === cycleIdToUse)
      const saved: SchoolCycle = {
        id: cycleIdToUse,
        label: draft.label.trim() || labelFromDates(draft.startDate, draft.endDate),
        startDate: draft.startDate,
        endDate: draft.endDate,
        status,
        schoolDays: draft.schoolDays,
        notes: draft.notes.trim() || "Ciclo regular",
        createdBy: existing?.createdBy ?? school.adminName,
        createdAt: existing?.createdAt ?? nowISO(),
        updatedAt: nowISO(),
      }
      const without = school.cycles.filter((cycle) => cycle.id !== cycleIdToUse)
      const merged = [saved, ...without]
      const next = status === "activo" ? applyActiveRule(merged, saved.id) : merged
      setCycles(next, saved.id)
      return saved.id
    },
    [school.adminName, school.cycles, setCycles],
  )

  const duplicateCycle = useCallback(
    (id: string) => {
      const source = school.cycles.find((cycle) => cycle.id === id)
      if (!source) return null
      const startDate = addYears(source.startDate, 1)
      const endDate = addYears(source.endDate, 1)
      return saveCycle({
        label: labelFromDates(startDate, endDate),
        startDate,
        endDate,
        schoolDays: source.schoolDays,
        notes: source.notes,
        makeActive: false,
      })
    },
    [saveCycle, school.cycles],
  )

  const deleteCycle = useCallback(
    (id: string) => {
      if (school.cycles.length <= 1) return "Debe existir al menos un ciclo escolar."
      const next = school.cycles.filter((cycle) => cycle.id !== id)
      if (next.length === school.cycles.length) return "No se encontró el ciclo."
      const current = next.find((cycle) => deriveCycleStatus(cycle.startDate, cycle.endDate) === "activo")
      const repaired = current
        ? applyActiveRule(next, current.id)
        : next.map((cycle): SchoolCycle => ({
            ...cycle,
            status: deriveCycleStatus(cycle.startDate, cycle.endDate),
          }))
      setCycles(repaired)
      return null
    },
    [school.cycles, setCycles],
  )

  const saveGrade = useCallback(
    (draft: GradeDraft, id?: string) => {
      const name = draft.name.trim()
      const existing = id ? school.grades.find((grade) => grade.id === id) : undefined
      const gradeId = existing?.id ?? `${cycleId}-${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${Date.now().toString(36)}`
      const saved: AcademicGrade = {
        id: gradeId,
        cycleId: existing?.cycleId ?? cycleId,
        name,
        shortLabel: (draft.shortLabel.trim() || gradeShort(name)).slice(0, 2),
        color: draft.color,
        status: draft.status,
        order: existing?.order ?? Math.max(0, ...school.grades.filter((grade) => grade.cycleId === cycleId).map((grade) => grade.order)) + 1,
      }
      const grades = existing
        ? school.grades.map((grade) => (grade.id === saved.id ? saved : grade))
        : [...school.grades, saved]
      const groups = school.groups.map((group) => (group.gradeId === saved.id ? { ...group, grade: saved.name } : group))
      patchAcademic({ grades, groups })
      return saved.id
    },
    [cycleId, patchAcademic, school.grades, school.groups],
  )

  const deleteGrade = useCallback(
    (id: string) => {
      if (school.groups.some((group) => group.gradeId === id)) {
        return "Quita los grupos de este grado antes de eliminarlo."
      }
      patchAcademic({ grades: school.grades.filter((grade) => grade.id !== id) })
      return null
    },
    [patchAcademic, school.grades, school.groups],
  )

  const saveGroup = useCallback(
    (draft: GroupDraft, id?: string) => {
      const grade = school.grades.find((item) => item.id === draft.gradeId)
      if (!grade) return { error: "Selecciona un grado válido." }
      const letter = draft.letter.trim().toUpperCase().slice(0, 1) || "A"
      const clash = school.groups.some(
        (group) => group.gradeId === draft.gradeId && group.letter === letter && group.id !== id,
      )
      if (clash) return { error: `Ya existe el grupo ${grade.name} · ${letter}.` }
      const existing = id ? school.groups.find((group) => group.id === id) : undefined
      const groupId = existing?.id ?? `${grade.cycleId}-${letter.toLowerCase()}-${Date.now().toString(36)}`
      const saved: GradeGroup = {
        id: groupId,
        cycleId: grade.cycleId,
        gradeId: grade.id,
        grade: grade.name,
        letter,
        classroom: draft.classroom.trim() || `${letter}-01`,
        teacherId: draft.teacherId,
        screenId: existing?.screenId ?? `scr-${groupId}`,
        zoneId: draft.zoneId,
        studentCount: existing?.studentCount ?? 0,
        shift: draft.shift,
        status: draft.status,
        capacity: draft.capacity,
        inactiveCount: existing?.inactiveCount ?? 0,
        pendingCount: existing?.pendingCount ?? 0,
        attendancePct: existing?.attendancePct ?? 90,
        createdAt: existing?.createdAt ?? nowISO(),
        schedule: existing?.schedule ?? defaultSchedule(),
      }
      const groups = existing
        ? school.groups.map((group) => (group.id === saved.id ? saved : group))
        : [...school.groups, saved]
      const nextScreen = screenFromGroup(saved, saved.cycleId.includes("2026"))
      const screens = school.screens.some((screen) => screen.id === nextScreen.id || screen.groupId === saved.id)
        ? school.screens.map((screen) =>
            screen.id === nextScreen.id || screen.groupId === saved.id
              ? { ...nextScreen, online: screen.online }
              : screen,
          )
        : [...school.screens, nextScreen]
      patchAcademic({ groups, screens })
      return { id: saved.id }
    },
    [patchAcademic, school.grades, school.groups, school.screens],
  )

  const deleteGroup = useCallback(
    (id: string) => {
      if (!school.groups.some((group) => group.id === id)) return "No se encontró el grupo."
      patchAcademic({
        groups: school.groups.filter((group) => group.id !== id),
        students: school.students.filter((student) => student.groupId !== id),
        screens: school.screens.map((screen) => (screen.groupId === id ? { ...screen, groupId: null } : screen)),
      })
      return null
    },
    [patchAcademic, school.groups, school.screens, school.students],
  )

  const addStudentToGroup = useCallback(
    (groupId: string, firstName: string, lastName: string) => {
      const group = school.groups.find((item) => item.id === groupId)
      if (!group) return { error: "No se encontró el grupo." }
      const first = firstName.trim()
      const last = lastName.trim()
      if (!first || !last) return { error: "Escribe nombre y apellido." }
      const student = createStudentDefaults({
        firstName: first,
        lastName: last,
        cycleId: group.cycleId,
        groupId,
        matricula: nextMatricula(school.students, group.cycleId === CURRENT_CYCLE_ID ? "2026" : "2025"),
        isNew: true,
        enrolledAt: school.cycles.find((cycle) => cycle.id === group.cycleId)?.startDate,
      })
      const students = [...school.students, student]
      patchAcademic({
        students,
        groups: syncGroupCounts(school.groups, students),
      })
      return { id: student.id }
    },
    [patchAcademic, school.cycles, school.groups, school.students],
  )

  const saveStudent = useCallback(
    (draft: StudentDraft, id?: string) => {
      const group = school.groups.find((item) => item.id === draft.groupId)
      if (!group) return { error: "Selecciona un grupo válido." }
      const first = draft.firstName.trim()
      const last = draft.lastName.trim()
      if (!first || !last) return { error: "Escribe nombre y apellido." }
      const existing = id ? school.students.find((student) => student.id === id) : undefined
      const linked = upsertGuardians(school.guardians, draft.guardians)
      if ("error" in linked) return linked
      const saved = createStudentDefaults({
        id: existing?.id,
        firstName: first,
        lastName: last,
        cycleId: group.cycleId,
        groupId: group.id,
        matricula: existing?.matricula ?? nextMatricula(school.students, group.cycleId.slice(-4)),
        guardianIds: linked.ids,
        status: draft.status,
        attendancePct: existing?.attendancePct ?? 90,
        birthDate: draft.birthDate,
        enrolledAt: existing?.enrolledAt ?? group.createdAt.slice(0, 10),
        gender: draft.gender,
        curp: draft.curp,
        address: draft.address,
        bloodType: draft.bloodType,
        allergies: draft.allergies,
        medicalNotes: draft.medicalNotes,
        isNew: existing?.isNew ?? true,
      })
      const students = existing
        ? school.students.map((student) => (student.id === saved.id ? saved : student))
        : [...school.students, saved]
      patchAcademic({
        students,
        guardians: linked.guardians,
        groups: syncGroupCounts(school.groups, students),
      })
      return { id: saved.id }
    },
    [patchAcademic, school.groups, school.guardians, school.students],
  )

  const deleteStudent = useCallback(
    (id: string) => {
      if (!school.students.some((student) => student.id === id)) return "No se encontró el alumno."
      const students = school.students.filter((student) => student.id !== id)
      patchAcademic({
        students,
        groups: syncGroupCounts(school.groups, students),
      })
      return null
    },
    [patchAcademic, school.groups, school.students],
  )

  const importStudents = useCallback(
    (csv: string) => {
      const rows = parseStudentCsv(csv)
      if (rows.length === 0) return { error: "No se encontraron filas para importar. Usa nombre, apellido, grado, grupo." }
      const cycleGroups = school.groups.filter((group) => group.cycleId === cycleId)
      const created: Student[] = []
      const skipped: string[] = []
      let roster = school.students
      for (const row of rows) {
        const group = cycleGroups.find(
          (item) =>
            item.grade.toLowerCase() === row.grade.toLowerCase() && item.letter.toUpperCase() === row.letter,
        ) ?? (row.grade
          ? undefined
          : cycleGroups[0])
        if (!group) {
          skipped.push(`${row.firstName} ${row.lastName}`)
          continue
        }
        const student = createStudentDefaults({
          firstName: row.firstName,
          lastName: row.lastName,
          cycleId: group.cycleId,
          groupId: group.id,
          matricula: nextMatricula(roster, group.cycleId.slice(-4)),
          isNew: true,
          enrolledAt: school.cycles.find((cycle) => cycle.id === group.cycleId)?.startDate,
        })
        roster = [...roster, student]
        created.push(student)
      }
      if (created.length === 0) return { error: skipped.length > 0 ? "Ninguna fila coincidió con un grado y grupo del ciclo." : "No se importó ningún alumno." }
      patchAcademic({
        students: roster,
        groups: syncGroupCounts(school.groups, roster),
      })
      return { count: created.length }
    },
    [cycleId, patchAcademic, school.cycles, school.groups, school.students],
  )

  const patchTeachers = useCallback((teachers: Teacher[]) => {
    persistTeachers(teachers)
    setSchool((current) => ({ ...current, teachers }))
  }, [])

  const saveTeacher = useCallback(
    (draft: TeacherDraft, id?: string) => {
      const first = draft.firstName.trim()
      const last = draft.lastName.trim()
      const email = draft.email.trim()
      if (!first || !last) return { error: "Escribe nombre y apellido." }
      if (!email) return { error: "Escribe el correo institucional." }
      const existing = id ? school.teachers.find((teacher) => teacher.id === id) : undefined
      const saved: Teacher = {
        id: existing?.id ?? `t-${Date.now().toString(36)}`,
        firstName: first,
        lastName: last,
        email,
        active: draft.active,
        cycleIds: existing?.cycleIds.includes(cycleId) ? existing.cycleIds : [...(existing?.cycleIds ?? []), cycleId],
        employeeId: existing?.employeeId ?? nextEmployeeId(school.teachers),
        subjects: draft.subjects.length > 0 ? draft.subjects : ["Formación"],
        area: draft.area,
        role: draft.role,
        extraGroupIds: existing?.extraGroupIds ?? [],
        hoursPerWeek: draft.hoursPerWeek,
        rating: draft.rating,
        hiredAt: draft.hiredAt,
        isNew: existing?.isNew ?? true,
        birthDate: draft.birthDate,
        curp: draft.curp,
        rfc: draft.rfc,
        gender: draft.gender,
        nationality: "Mexicana",
        phone: draft.phone,
        personalEmail: draft.personalEmail || email,
        address: draft.address,
      }
      const teachers = existing
        ? school.teachers.map((teacher) => (teacher.id === saved.id ? saved : teacher))
        : [...school.teachers, saved]
      patchTeachers(teachers)
      return { id: saved.id }
    },
    [cycleId, patchTeachers, school.teachers],
  )

  const deleteTeacher = useCallback(
    (id: string) => {
      if (school.groups.some((group) => group.teacherId === id)) {
        return "Reasigna los grupos de este profesor antes de eliminarlo."
      }
      if (!school.teachers.some((teacher) => teacher.id === id)) return "No se encontró el profesor."
      patchTeachers(school.teachers.filter((teacher) => teacher.id !== id))
      return null
    },
    [patchTeachers, school.groups, school.teachers],
  )

  const importTeachers = useCallback(
    (csv: string) => {
      const rows = parseTeacherCsv(csv)
      if (rows.length === 0) return { error: "No se encontraron filas. Usa nombre, apellido, correo, asignatura, área." }
      let roster = school.teachers
      const created: Teacher[] = []
      for (const row of rows) {
        const result = {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || `${row.firstName.toLowerCase()}.${row.lastName.toLowerCase().split(" ")[0]}@sanignacio.edu.mx`,
          active: true,
          subjects: [row.subject],
          area: row.area,
          role: "Profesor titular",
          hoursPerWeek: 20,
          rating: 4.5,
          hiredAt: new Date().toISOString().slice(0, 10),
          gender: "Femenino" as Gender,
          birthDate: "1990-01-15",
          curp: "",
          rfc: "",
          phone: "",
          personalEmail: "",
          address: "Ciudad de México",
        }
        const first = result.firstName.trim()
        const last = result.lastName.trim()
        const saved: Teacher = {
          id: `t-${Date.now().toString(36)}-${created.length}`,
          firstName: first,
          lastName: last,
          email: result.email,
          active: true,
          cycleIds: [cycleId],
          employeeId: nextEmployeeId(roster),
          subjects: result.subjects,
          area: result.area,
          role: result.role,
          extraGroupIds: [],
          hoursPerWeek: 20,
          rating: 4.5,
          hiredAt: result.hiredAt,
          isNew: true,
          birthDate: result.birthDate,
          curp: result.curp,
          rfc: result.rfc,
          gender: result.gender,
          nationality: "Mexicana",
          phone: result.phone,
          personalEmail: result.email,
          address: result.address,
        }
        roster = [...roster, saved]
        created.push(saved)
      }
      patchTeachers(roster)
      return { count: created.length }
    },
    [cycleId, patchTeachers, school.teachers],
  )

  const patchZones = useCallback((zones: DeliveryZone[]) => {
    persistZones(zones)
    setSchool((current) => ({ ...current, zones }))
  }, [])

  const saveZone = useCallback(
    (draft: ZoneDraft, id?: string) => {
      const name = draft.name.trim()
      const letter = draft.letter.trim().toUpperCase().slice(0, 1) || "A"
      if (!name) return { error: "Escribe el nombre de la zona." }
      const clash = school.zones.some((zone) => zone.letter === letter && zone.id !== id)
      if (clash) return { error: `Ya existe la zona ${letter}.` }
      const existing = id ? school.zones.find((zone) => zone.id === id) : undefined
      const saved: DeliveryZone = {
        id: existing?.id ?? `zona-${letter.toLowerCase()}-${Date.now().toString(36)}`,
        name,
        description: draft.description.trim() || draft.location.trim(),
        letter,
        location: draft.location.trim() || name,
        capacity: draft.capacity,
        avgWaitSec: draft.avgWaitSec,
        usagePct: draft.usagePct,
        status: draft.status,
        morningStart: draft.morningStart,
        morningEnd: draft.morningEnd,
        afternoonStart: draft.afternoonStart,
        afternoonEnd: draft.afternoonEnd,
        responsibleName: draft.responsibleName.trim() || "Sin asignar",
        responsiblePhone: draft.responsiblePhone.trim(),
        vehiclesToday: existing?.vehiclesToday ?? 0,
        studentsToday: existing?.studentsToday ?? 0,
        incidentsToday: existing?.incidentsToday ?? 0,
        mapX: draft.mapX,
        mapY: draft.mapY,
        color: draft.color,
      }
      const zones = existing
        ? school.zones.map((zone) => (zone.id === saved.id ? saved : zone))
        : [...school.zones, saved]
      patchZones(zones)
      return { id: saved.id }
    },
    [patchZones, school.zones],
  )

  const deleteZone = useCallback(
    (id: string) => {
      if (school.groups.some((group) => group.zoneId === id)) {
        return "Reasigna los grupos de esta zona antes de eliminarla."
      }
      if (!school.zones.some((zone) => zone.id === id)) return "No se encontró la zona."
      patchZones(school.zones.filter((zone) => zone.id !== id))
      return null
    },
    [patchZones, school.groups, school.zones],
  )

  const assignTeacher = useCallback(
    (groupId: string, teacherId: string) => {
      patchAcademic({
        groups: school.groups.map((group) => (group.id === groupId ? { ...group, teacherId } : group)),
      })
    },
    [patchAcademic, school.groups],
  )

  const addScheduleEntry = useCallback(
    (groupId: string, day: string, start: string, subject: string) => {
      patchAcademic({
        groups: school.groups.map((group) => {
          if (group.id !== groupId) return group
          return {
            ...group,
            schedule: [
              ...group.schedule,
              { id: `h-${Date.now().toString(36)}`, day, start, subject: subject.trim() },
            ],
          }
        }),
      })
    },
    [patchAcademic, school.groups],
  )

  const removeScheduleEntry = useCallback(
    (groupId: string, entryId: string) => {
      patchAcademic({
        groups: school.groups.map((group) =>
          group.id === groupId ? { ...group, schedule: group.schedule.filter((entry) => entry.id !== entryId) } : group,
        ),
      })
    },
    [patchAcademic, school.groups],
  )

  const bindScreen = useCallback(
    (screenId: string, groupId: string | null) => {
      const screens = school.screens.map((screen) => {
        if (screen.id === screenId) return { ...screen, groupId }
        if (groupId && screen.groupId === groupId) return { ...screen, groupId: null }
        return screen
      })
      const groups = school.groups.map((group) => {
        if (group.id === groupId) return { ...group, screenId }
        if (group.screenId === screenId) return { ...group, screenId: null }
        return group
      })
      patchAcademic({ screens, groups })
    },
    [patchAcademic, school.groups, school.screens],
  )

  const toggleScreenOnline = useCallback(
    (screenId: string) => {
      patchScreens(school.screens.map((screen) => (screen.id === screenId ? { ...screen, online: !screen.online } : screen)))
    },
    [patchScreens, school.screens],
  )

  const syncNow = useCallback(async () => {
    setSyncStatus("syncing")
    try {
      await publishSchoolSync(buildSchoolSync(school, cycleId))
      setSyncStatus("ok")
      setLastSyncAt(new Date().toISOString())
    } catch {
      setSyncStatus("error")
    }
  }, [cycleId, school])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSyncStatus((current) => (current === "idle" ? "syncing" : current))
      void publishSchoolSync(buildSchoolSync(school, cycleId))
        .then(() => {
          setSyncStatus("ok")
          setLastSyncAt(new Date().toISOString())
        })
        .catch(() => setSyncStatus("error"))
    }, 800)
    return () => window.clearTimeout(handle)
  }, [cycleId, school])

  const value = useMemo<SchoolContextValue>(() => {
    const selectedCycle = school.cycles.find((cycle) => cycle.id === cycleId) ?? school.cycles[0]!
    const groups = school.groups.filter((group) => group.cycleId === cycleId)
    const olderCycle = school.cycles.find(
      (cycle) => cycle.id !== cycleId && cycle.startDate < selectedCycle.startDate,
    )
    const previousGroups = olderCycle
      ? school.groups.filter((group) => group.cycleId === olderCycle.id)
      : []
    const teachers = school.teachers.filter((teacher) => teacher.cycleIds.includes(cycleId) && teacher.active)
    const screens = school.screens.filter((screen) => screen.cycleId === cycleId)
    const students = groups.reduce((sum, group) => sum + group.studentCount, 0)
    const previousStudents = previousGroups.reduce((sum, group) => sum + group.studentCount, 0)

    return {
      school,
      cycleId,
      selectedCycle,
      setCycleId,
      activityPeriod,
      setActivityPeriod,
      stats: {
        groups: groups.length,
        groupsDelta: groups.length - previousGroups.length,
        students,
        studentsDelta: students - previousStudents,
        teachers: teachers.length,
        teachersActivePct: teachers.length === 0 ? 0 : 100,
        screens: screens.length,
        screensOnline: screens.filter((screen) => screen.online).length,
      },
      saveCycle,
      duplicateCycle,
      deleteCycle,
      saveGrade,
      deleteGrade,
      saveGroup,
      deleteGroup,
      addStudentToGroup,
      saveStudent,
      deleteStudent,
      importStudents,
      saveTeacher,
      deleteTeacher,
      importTeachers,
      saveZone,
      deleteZone,
      assignTeacher,
      addScheduleEntry,
      removeScheduleEntry,
      bindScreen,
      toggleScreenOnline,
      syncNow,
      syncStatus,
      lastSyncAt,
    }
  }, [
    activityPeriod,
    addScheduleEntry,
    addStudentToGroup,
    assignTeacher,
    bindScreen,
    cycleId,
    deleteCycle,
    deleteGrade,
    deleteGroup,
    deleteStudent,
    deleteTeacher,
    deleteZone,
    duplicateCycle,
    importStudents,
    importTeachers,
    lastSyncAt,
    removeScheduleEntry,
    saveCycle,
    saveGrade,
    saveGroup,
    saveStudent,
    saveTeacher,
    saveZone,
    school,
    syncNow,
    syncStatus,
    toggleScreenOnline,
  ])

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
}

export function useSchool() {
  const ctx = useContext(SchoolContext)
  if (!ctx) throw new Error("useSchool debe usarse dentro de SchoolProvider")
  return ctx
}
