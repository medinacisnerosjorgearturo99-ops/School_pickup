import { teacherName } from "./format"
import { studentInitials } from "./students"
import { apiUrl } from "./api"
import type { ClassroomScreen, GradeGroup, SchoolState } from "../types/school"

export function pairingCodeFor(classroom: string) {
  const clean = classroom.replaceAll("-", "").replaceAll(" ", "").toUpperCase()
  return `TV-${clean || "01"}`
}

export function screenFromGroup(group: GradeGroup, online = true): ClassroomScreen {
  return {
    id: group.screenId ?? `scr-${group.id}`,
    name: `Pantalla ${group.classroom}`,
    location: `Salón ${group.classroom}`,
    cycleId: group.cycleId,
    groupId: group.id,
    online,
    pairingCode: pairingCodeFor(group.classroom),
  }
}

export function ensureScreens(groups: GradeGroup[], screens: ClassroomScreen[]): ClassroomScreen[] {
  const repaired = screens.map((screen) => ({
    ...screen,
    pairingCode: screen.pairingCode || pairingCodeFor(screen.location.replace(/^Salón\s+/i, "")),
  }))
  const extras = groups
    .filter((group) => !repaired.some((screen) => screen.id === group.screenId || screen.groupId === group.id))
    .map((group) => screenFromGroup(group, group.status === "activo"))
  return extras.length === 0 ? repaired : [...repaired, ...extras]
}

export interface SchoolSyncPayload {
  schoolName: string
  screens: Array<{
    id: string
    name: string
    location: string
    groupId: string | null
    pairingCode: string
    online: boolean
  }>
  groups: Array<{
    id: string
    grade: string
    letter: string
    classroom: string
    teacherName: string
    zoneName: string
    zonePhone: string
    zoneLat: number | null
    zoneLng: number | null
  }>
  students: Array<{
    id: string
    firstName: string
    lastName: string
    initials: string
    groupId: string
    status: string
    guardianName: string
    guardianIds: string[]
  }>
  guardians: Array<{
    id: string
    name: string
    email: string
    password: string
    phone: string
    relation: string
    kind: string
  }>
}

export function buildSchoolSync(school: SchoolState, cycleId: string): SchoolSyncPayload {
  const teacherById = new Map(school.teachers.map((teacher) => [teacher.id, teacherName(teacher.firstName, teacher.lastName)]))
  const zoneById = new Map(school.zones.map((zone) => [zone.id, zone]))
  const guardianById = new Map(school.guardians.map((guardian) => [guardian.id, guardian]))
  const groups = school.groups.filter((group) => group.cycleId === cycleId && group.status === "activo")
  const groupIds = new Set(groups.map((group) => group.id))
  const screens = school.screens
    .filter((screen) => screen.cycleId === cycleId)
    .map((screen) => {
      const group = groups.find((item) => item.id === screen.groupId)
      return {
        id: screen.id,
        name: screen.name,
        location: screen.location,
        groupId: screen.groupId,
        pairingCode: screen.pairingCode || pairingCodeFor(group?.classroom ?? screen.location),
        online: screen.online,
      }
    })

  return {
    schoolName: school.schoolName,
    screens,
    groups: groups.map((group) => {
      const zone = zoneById.get(group.zoneId)
      return {
        id: group.id,
        grade: group.grade,
        letter: group.letter,
        classroom: group.classroom,
        teacherName: teacherById.get(group.teacherId) ?? "Sin profesor",
        zoneName: zone?.name ?? "Sin zona",
        zonePhone: zone?.responsiblePhone ?? "",
        zoneLat: zone?.latitude ?? null,
        zoneLng: zone?.longitude ?? null,
      }
    }),
    students: school.students
      .filter((student) => groupIds.has(student.groupId))
      .map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        initials: studentInitials(student),
        groupId: student.groupId,
        status: student.status,
        guardianName: student.guardianIds.map((id) => guardianById.get(id)?.name).find(Boolean) ?? "",
        guardianIds: student.guardianIds,
      })),
    guardians: school.guardians
      .filter((guardian) =>
        school.students.some((student) => groupIds.has(student.groupId) && student.guardianIds.includes(guardian.id)),
      )
      .map((guardian) => ({
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        password: guardian.password ?? "",
        phone: guardian.phone,
        relation: guardian.relation,
        kind: guardian.kind,
      })),
  }
}

export async function publishSchoolSync(payload: SchoolSyncPayload) {
  const response = await fetch(apiUrl("/api/school/sync"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error("No se pudo sincronizar con el servidor de TV.")
}

export async function fetchAdminSchool(): Promise<SchoolState | null> {
  try {
    const response = await fetch(apiUrl("/api/school/admin"))
    if (response.status === 204 || !response.ok) return null
    const data = (await response.json()) as SchoolState
    if (!data || typeof data.schoolName !== "string") return null
    return data
  } catch {
    return null
  }
}

export async function persistAdminSchool(school: SchoolState) {
  const response = await fetch(apiUrl("/api/school/admin"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(school),
  })
  if (!response.ok) throw new Error("No se pudo guardar en la base de datos.")
}
