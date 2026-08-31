import type {
  AcademicGrade,
  ActivityPeriod,
  ActivitySnapshot,
  GradeGroup,
  SchoolState,
} from "../types/school"
import { defaultSchedule } from "../lib/grades"
import { syncGroupCounts } from "../lib/students"
import { buildRoster } from "./roster"
import { buildTeachers } from "./teachers"
import { buildZones } from "./zones"

const CURRENT = "ciclo-2026"
const PREVIOUS = "ciclo-2025"

type GroupSeed = {
  id: string
  grade: string
  letter: string
  classroom: string
  teacherId: string
  zoneId: string
  currentCount: number
  previousCount: number | null
}

const groupSeeds: GroupSeed[] = [
  { id: "k-a", grade: "Kinder", letter: "A", classroom: "K-01", teacherId: "t-laura", zoneId: "zona-a", currentCount: 22, previousCount: 26 },
  { id: "k-b", grade: "Kinder", letter: "B", classroom: "K-03", teacherId: "t-sofia", zoneId: "zona-a", currentCount: 20, previousCount: 22 },
  { id: "1-a", grade: "1º Primaria", letter: "A", classroom: "A-01", teacherId: "t-diego", zoneId: "zona-a", currentCount: 26, previousCount: 28 },
  { id: "1-b", grade: "1º Primaria", letter: "B", classroom: "A-02", teacherId: "t-paola", zoneId: "zona-a", currentCount: 25, previousCount: 27 },
  { id: "1-c", grade: "1º Primaria", letter: "C", classroom: "A-03", teacherId: "t-lucia", zoneId: "zona-a", currentCount: 24, previousCount: null },
  { id: "2-a", grade: "2º Primaria", letter: "A", classroom: "A-12", teacherId: "t-ana", zoneId: "zona-a", currentCount: 26, previousCount: 28 },
  { id: "2-b", grade: "2º Primaria", letter: "B", classroom: "A-13", teacherId: "t-miguel", zoneId: "zona-a", currentCount: 27, previousCount: 28 },
  { id: "2-c", grade: "2º Primaria", letter: "C", classroom: "A-14", teacherId: "t-andres", zoneId: "zona-a", currentCount: 25, previousCount: 26 },
  { id: "3-a", grade: "3º Primaria", letter: "A", classroom: "B-01", teacherId: "t-elena", zoneId: "zona-b", currentCount: 28, previousCount: 29 },
  { id: "3-b", grade: "3º Primaria", letter: "B", classroom: "B-02", teacherId: "t-jorge", zoneId: "zona-b", currentCount: 26, previousCount: 27 },
  { id: "4-a", grade: "4º Primaria", letter: "A", classroom: "B-11", teacherId: "t-carmen", zoneId: "zona-b", currentCount: 27, previousCount: 28 },
  { id: "4-b", grade: "4º Primaria", letter: "B", classroom: "B-12", teacherId: "t-ivan", zoneId: "zona-b", currentCount: 26, previousCount: 27 },
  { id: "5-a", grade: "5º Primaria", letter: "A", classroom: "C-01", teacherId: "t-raul", zoneId: "zona-c", currentCount: 28, previousCount: 30 },
  { id: "5-b", grade: "5º Primaria", letter: "B", classroom: "C-02", teacherId: "t-marina", zoneId: "zona-c", currentCount: 25, previousCount: 26 },
  { id: "5-c", grade: "5º Primaria", letter: "C", classroom: "C-05", teacherId: "t-ricardo", zoneId: "zona-c", currentCount: 24, previousCount: 26 },
  { id: "6-a", grade: "6º Primaria", letter: "A", classroom: "C-11", teacherId: "t-pablo", zoneId: "zona-c", currentCount: 28, previousCount: 28 },
  { id: "6-b", grade: "6º Primaria", letter: "B", classroom: "C-12", teacherId: "t-adriana", zoneId: "zona-c", currentCount: 26, previousCount: 28 },
  { id: "6-c", grade: "6º Primaria", letter: "C", classroom: "C-13", teacherId: "t-sergio", zoneId: "zona-c", currentCount: 29, previousCount: null },
]

const gradeCatalog = [
  { key: "kinder", name: "Kinder", shortLabel: "K", color: "orange", order: 1 },
  { key: "1-primaria", name: "1º Primaria", shortLabel: "1", color: "blue", order: 2 },
  { key: "2-primaria", name: "2º Primaria", shortLabel: "2", color: "green", order: 3 },
  { key: "3-primaria", name: "3º Primaria", shortLabel: "3", color: "purple", order: 4 },
  { key: "4-primaria", name: "4º Primaria", shortLabel: "4", color: "orange", order: 5 },
  { key: "5-primaria", name: "5º Primaria", shortLabel: "5", color: "blue", order: 6 },
  { key: "6-primaria", name: "6º Primaria", shortLabel: "6", color: "green", order: 7 },
  { key: "1-secundaria", name: "1º Secundaria", shortLabel: "S", color: "purple", order: 8 },
] as const

function gradeIdFor(cycleId: string, gradeName: string) {
  const item = gradeCatalog.find((grade) => grade.name === gradeName)
  return `${cycleId}-${item?.key ?? gradeName.toLowerCase()}`
}

function buildGrades(): AcademicGrade[] {
  const current = gradeCatalog.map((grade) => ({
    id: `${CURRENT}-${grade.key}`,
    cycleId: CURRENT,
    name: grade.name,
    shortLabel: grade.shortLabel,
    color: grade.color,
    status: "activo" as const,
    order: grade.order,
  }))
  const previous = gradeCatalog
    .filter((grade) => grade.key !== "1-secundaria")
    .map((grade) => ({
      id: `${PREVIOUS}-${grade.key}`,
      cycleId: PREVIOUS,
      name: grade.name,
      shortLabel: grade.shortLabel,
      color: grade.color,
      status: "inactivo" as const,
      order: grade.order,
    }))
  return [...current, ...previous]
}

function buildGroups(): GradeGroup[] {
  return groupSeeds.flatMap((seed) => {
    const current: GradeGroup = {
      id: `${CURRENT}-${seed.id}`,
      cycleId: CURRENT,
      gradeId: gradeIdFor(CURRENT, seed.grade),
      grade: seed.grade,
      letter: seed.letter,
      classroom: seed.classroom,
      teacherId: seed.teacherId,
      screenId: `scr-${CURRENT}-${seed.id}`,
      zoneId: seed.zoneId,
      studentCount: seed.currentCount,
      shift: "Matutino",
      status: "activo",
      capacity: 30,
      inactiveCount: seed.id === "2-a" ? 2 : 0,
      pendingCount: 0,
      attendancePct: seed.id === "2-a" ? 92 : 86 + (seed.currentCount % 10),
      createdAt: "2026-08-15T09:00:00",
      schedule: seed.id === "2-a" ? defaultSchedule() : [],
    }
    if (seed.previousCount == null) return [current]
    return [
      current,
      {
        ...current,
        id: `${PREVIOUS}-${seed.id}`,
        cycleId: PREVIOUS,
        gradeId: gradeIdFor(PREVIOUS, seed.grade),
        screenId: `scr-${PREVIOUS}-${seed.id}`,
        studentCount: seed.previousCount,
        status: "inactivo",
        attendancePct: 90,
        createdAt: "2025-08-18T09:00:00",
        schedule: [],
      },
    ]
  })
}

function snapshot(
  series: { label: string; value: number }[],
  pickups: number,
  activeStudents: number,
  groupsWithActivity: number,
  teachersConnected: number,
): ActivitySnapshot {
  return { series, pickups, activeStudents, groupsWithActivity, teachersConnected }
}

const week = (values: number[]) =>
  ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((label, i) => ({
    label,
    value: values[i] ?? 0,
  }))

const activity: Record<string, Record<ActivityPeriod, ActivitySnapshot>> = {
  [CURRENT]: {
    "esta-semana": snapshot(week([48, 62, 41, 78, 96, 44]), 128, 412, 16, 22),
    "semana-pasada": snapshot(week([40, 55, 47, 64, 82, 38]), 110, 398, 15, 20),
    "este-mes": snapshot(
      [
        { label: "Sem 1", value: 92 },
        { label: "Sem 2", value: 108 },
        { label: "Sem 3", value: 128 },
        { label: "Sem 4", value: 86 },
      ],
      414,
      430,
      18,
      24,
    ),
  },
  [PREVIOUS]: {
    "esta-semana": snapshot(week([36, 44, 39, 58, 70, 30]), 96, 360, 14, 18),
    "semana-pasada": snapshot(week([32, 40, 35, 50, 61, 28]), 88, 348, 13, 17),
    "este-mes": snapshot(
      [
        { label: "Sem 1", value: 70 },
        { label: "Sem 2", value: 84 },
        { label: "Sem 3", value: 96 },
        { label: "Sem 4", value: 74 },
      ],
      324,
      380,
      16,
      20,
    ),
  },
}

const groups = buildGroups()
const roster = buildRoster(groups)
const syncedGroups = syncGroupCounts(groups, roster.students)

export const schoolSeed: SchoolState = {
  schoolName: "Colegio San Ignacio",
  productName: "Recogeya",
  adminName: "Administrador",
  adminEmail: "admin@sanignacio.edu.mx",
  cycles: [
    {
      id: CURRENT,
      label: "2026–2027",
      startDate: "2026-08-18",
      endDate: "2027-06-30",
      status: "activo",
      schoolDays: 190,
      notes: "Ciclo regular",
      createdBy: "Administrador",
      createdAt: "2026-05-15T10:30:00",
      updatedAt: "2026-05-15T10:30:00",
    },
    {
      id: PREVIOUS,
      label: "2025–2026",
      startDate: "2025-08-18",
      endDate: "2026-07-03",
      status: "cerrado",
      schoolDays: 188,
      notes: "Ciclo regular",
      createdBy: "Administrador",
      createdAt: "2025-05-12T09:15:00",
      updatedAt: "2026-07-03T16:00:00",
    },
    {
      id: "ciclo-2024",
      label: "2024–2025",
      startDate: "2024-08-19",
      endDate: "2025-06-27",
      status: "cerrado",
      schoolDays: 189,
      notes: "Ciclo regular",
      createdBy: "Administrador",
      createdAt: "2024-05-10T11:00:00",
      updatedAt: "2025-06-27T15:40:00",
    },
    {
      id: "ciclo-2023",
      label: "2023–2024",
      startDate: "2023-08-21",
      endDate: "2024-06-28",
      status: "cerrado",
      schoolDays: 187,
      notes: "Ciclo regular",
      createdBy: "Administrador",
      createdAt: "2023-05-08T10:20:00",
      updatedAt: "2024-06-28T14:10:00",
    },
    {
      id: "ciclo-2022",
      label: "2022–2023",
      startDate: "2022-08-22",
      endDate: "2023-06-30",
      status: "cerrado",
      schoolDays: 186,
      notes: "Ciclo regular",
      createdBy: "Administrador",
      createdAt: "2022-05-09T09:45:00",
      updatedAt: "2023-06-30T13:00:00",
    },
  ],
  zones: buildZones(),
  teachers: buildTeachers(),
  grades: buildGrades(),
  groups: syncedGroups,
  guardians: roster.guardians,
  students: roster.students,
  screens: groupSeeds.flatMap((seed) => {
    const current = {
      id: `scr-${CURRENT}-${seed.id}`,
      name: `Pantalla ${seed.classroom}`,
      location: `Salón ${seed.classroom}`,
      cycleId: CURRENT,
      groupId: `${CURRENT}-${seed.id}`,
      online: true,
      pairingCode: `CSI-${seed.classroom.replaceAll("-", "")}`,
    }
    if (seed.previousCount == null) return [current]
    return [
      current,
      {
        ...current,
        id: `scr-${PREVIOUS}-${seed.id}`,
        cycleId: PREVIOUS,
        groupId: `${PREVIOUS}-${seed.id}`,
        online: false,
      },
    ]
  }),
  announcements: [
    {
      id: "a1",
      cycleId: CURRENT,
      tag: "General",
      title: "Inicio del ciclo escolar 2026–2027",
      description: "El ciclo comienza el 18 de agosto. Confirma grupos, pantallas y responsables antes de la primera semana.",
      date: "2026-05-20",
    },
    {
      id: "a2",
      cycleId: CURRENT,
      tag: "Importante",
      title: "Reunión de padres de familia",
      description: "Se presentará el flujo de RecogeYa: aviso de llegada, preparación en salón y entrega en zona.",
      date: "2026-05-18",
    },
    {
      id: "a3",
      cycleId: CURRENT,
      tag: "Aviso",
      title: "Actualización de horarios de salida",
      description: "Kinder sale a las 13:20, primaria baja a las 13:40 y primaria alta a las 14:00.",
      date: "2026-05-15",
    },
    {
      id: "a4",
      cycleId: CURRENT,
      tag: "General",
      title: "Altas de responsables para la app de padres",
      description: "Los padres no se registran solos. Dirección carga el correo y los niños asignados; ellos solo inician sesión.",
      date: "2026-05-12",
    },
    {
      id: "a5",
      cycleId: PREVIOUS,
      tag: "Importante",
      title: "Cierre del ciclo 2025–2026",
      description: "El historial de entregas queda archivado. Los grupos de este ciclo ya no aparecen en pantallas activas.",
      date: "2026-07-03",
    },
  ],
  upcoming: [
    { id: "u1", cycleId: CURRENT, groupId: `${CURRENT}-2-a`, title: "Exposición de ciencias", subject: "Ciencias Naturales", datetime: "2026-05-22T08:00:00" },
    { id: "u2", cycleId: CURRENT, groupId: `${CURRENT}-1-b`, title: "Evaluación diagnóstica", subject: "Matemáticas", datetime: "2026-05-22T09:30:00" },
    { id: "u3", cycleId: CURRENT, groupId: `${CURRENT}-3-a`, title: "Entrega de proyectos", subject: "Español", datetime: "2026-05-23T08:15:00" },
    { id: "u4", cycleId: CURRENT, groupId: `${CURRENT}-5-c`, title: "Ensayo cívico", subject: "Formación", datetime: "2026-05-24T10:00:00" },
    { id: "u5", cycleId: PREVIOUS, groupId: `${PREVIOUS}-2-a`, title: "Cierre de expediente", subject: "Dirección", datetime: "2026-07-01T09:00:00" },
  ],
  activity,
}

export const CURRENT_CYCLE_ID = CURRENT
export const PREVIOUS_CYCLE_ID = PREVIOUS
