import { teacherName } from "./format"
import { studentInitials } from "./students"
import type { ClassroomScreen, GradeGroup, SchoolState } from "../types/school"

export function pairingCodeFor(classroom: string) {
  const clean = classroom.replaceAll("-", "").replaceAll(" ", "").toUpperCase()
  return `CSI-${clean || "TV"}`
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
    .map((group) => screenFromGroup(group, group.cycleId.includes("2026")))
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
  }>
  students: Array<{
    id: string
    firstName: string
    lastName: string
    initials: string
    groupId: string
    status: string
    guardianName: string
  }>
}

export function buildSchoolSync(school: SchoolState, cycleId: string): SchoolSyncPayload {
  const teacherById = new Map(school.teachers.map((teacher) => [teacher.id, teacherName(teacher.firstName, teacher.lastName)]))
  const zoneById = new Map(school.zones.map((zone) => [zone.id, zone.name]))
  const guardianById = new Map(school.guardians.map((guardian) => [guardian.id, guardian.name]))
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
    groups: groups.map((group) => ({
      id: group.id,
      grade: group.grade,
      letter: group.letter,
      classroom: group.classroom,
      teacherName: teacherById.get(group.teacherId) ?? "Sin profesor",
      zoneName: zoneById.get(group.zoneId) ?? "Sin zona",
    })),
    students: school.students
      .filter((student) => groupIds.has(student.groupId))
      .map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        initials: studentInitials(student),
        groupId: student.groupId,
        status: student.status,
        guardianName: student.guardianIds.map((id) => guardianById.get(id)).find(Boolean) ?? "",
      })),
  }
}

export async function publishSchoolSync(payload: SchoolSyncPayload) {
  const response = await fetch("/api/school/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error("No se pudo sincronizar con el servidor de TV.")
}
