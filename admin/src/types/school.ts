export type CycleStatus = "activo" | "cerrado" | "proximo"
export type AcademicStatus = "activo" | "inactivo"
export type Shift = "Matutino" | "Vespertino"
export type GuardianKind = "PRIMARY" | "AUTHORIZED"
export type Gender = "Masculino" | "Femenino"
export type AnnouncementTag = "General" | "Importante" | "Aviso"
export type ActivityPeriod = "esta-semana" | "semana-pasada" | "este-mes"

export interface SchoolCycle {
  id: string
  label: string
  startDate: string
  endDate: string
  status: CycleStatus
  schoolDays: number
  notes: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AcademicGrade {
  id: string
  cycleId: string
  name: string
  shortLabel: string
  color: string
  status: AcademicStatus
  order: number
}

export interface ScheduleEntry {
  id: string
  day: string
  start: string
  subject: string
}

export type ZoneDemand = "alta" | "media" | "baja"

export interface DeliveryZone {
  id: string
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
  vehiclesToday: number
  studentsToday: number
  incidentsToday: number
  mapX: number
  mapY: number
  color: string
}

export interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
  active: boolean
  cycleIds: string[]
  employeeId: string
  subjects: string[]
  area: string
  role: string
  extraGroupIds: string[]
  hoursPerWeek: number
  rating: number
  hiredAt: string
  isNew: boolean
  birthDate: string
  curp: string
  rfc: string
  gender: Gender
  nationality: string
  phone: string
  personalEmail: string
  address: string
}

export interface GradeGroup {
  id: string
  cycleId: string
  gradeId: string
  grade: string
  letter: string
  classroom: string
  teacherId: string
  screenId: string | null
  zoneId: string
  studentCount: number
  shift: Shift
  status: AcademicStatus
  capacity: number
  inactiveCount: number
  pendingCount: number
  attendancePct: number
  createdAt: string
  schedule: ScheduleEntry[]
}

export interface Guardian {
  id: string
  name: string
  email: string
  phone: string
  relation: string
  kind: GuardianKind
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  cycleId: string
  groupId: string
  guardianIds: string[]
  matricula: string
  status: AcademicStatus
  attendancePct: number
  birthDate: string
  enrolledAt: string
  gender: Gender
  nationality: string
  curp: string
  address: string
  bloodType: string
  allergies: string
  medicalNotes: string
  isNew: boolean
}

export interface ClassroomScreen {
  id: string
  name: string
  location: string
  cycleId: string
  groupId: string | null
  online: boolean
  pairingCode: string
}

export interface Announcement {
  id: string
  cycleId: string
  tag: AnnouncementTag
  title: string
  description: string
  date: string
}

export interface UpcomingEvent {
  id: string
  cycleId: string
  groupId: string
  title: string
  subject: string
  datetime: string
}

export interface ActivityPoint {
  label: string
  value: number
}

export interface ActivitySnapshot {
  series: ActivityPoint[]
  pickups: number
  activeStudents: number
  groupsWithActivity: number
  teachersConnected: number
}

export interface SchoolState {
  schoolName: string
  productName: string
  adminName: string
  adminEmail: string
  cycles: SchoolCycle[]
  grades: AcademicGrade[]
  zones: DeliveryZone[]
  teachers: Teacher[]
  groups: GradeGroup[]
  guardians: Guardian[]
  students: Student[]
  screens: ClassroomScreen[]
  announcements: Announcement[]
  upcoming: UpcomingEvent[]
  activity: Record<string, Record<ActivityPeriod, ActivitySnapshot>>
}
