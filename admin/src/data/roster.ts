import type { Gender, GradeGroup, Guardian, Student } from "../types/school"
import { createStudentDefaults } from "../lib/students"

const FIRST_M = [
  "Lucas", "Mateo", "Santiago", "Sebastián", "Leonardo", "Emiliano", "Diego", "Daniel", "Iker", "Gael",
  "Adrián", "Joaquín", "Emmanuel", "Rodrigo", "Fernando", "Pablo", "Andrés", "Hugo", "Iván", "Óscar",
]
const FIRST_F = [
  "Camila", "Valentina", "Sofía", "Regina", "Ximena", "Fernanda", "Isabella", "Renata", "Daniela", "María",
  "Lucía", "Paula", "Elena", "Natalia", "Aitana", "Victoria", "Jimena", "Valeria", "Ana", "Carolina",
]
const LAST = [
  "Hernández", "García", "Martínez", "López", "González", "Pérez", "Rodríguez", "Sánchez", "Ramírez", "Cruz",
  "Flores", "Gómez", "Morales", "Vázquez", "Jiménez", "Reyes", "Torres", "Díaz", "Gutiérrez", "Ruiz",
  "Mendoza", "Aguilar", "Castillo", "Romero", "Ortega",
]

const STREETS = [
  "C. Hacienda de Sierra Vieja 214, Tecámac, Méx.",
  "Av. Insurgentes Sur 1443, Ciudad de México",
  "Calle Morelos 45, Coacalco, Méx.",
  "Av. Central 890, Ecatepec, Méx.",
  "Privada de los Pinos 12, Tizayuca, Hgo.",
]

const BLOOD = ["O+", "O+", "O+", "A+", "A+", "B+", "O-", "AB+"]
const ALLERGIES = ["Ninguna", "Ninguna", "Ninguna", "Polvo", "Lácteos", "Polvo, lácteos", "Nueces", "Penicilina"]

function pad(isoMonthDay: string, year: number) {
  return `${year}-${isoMonthDay}`
}

function birthYearFor(grade: string) {
  if (grade.startsWith("Kinder")) return 2021
  const num = Number(grade.match(/\d+/)?.[0] ?? "2")
  return 2026 - (num + 6)
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length] as T
}

function buildFeaturedCurrent(groupId: (seed: string) => string): Student[] {
  return [
    createStudentDefaults({
      id: "lucas",
      firstName: "Lucas",
      lastName: "Gómez Martínez",
      cycleId: "ciclo-2026",
      groupId: groupId("2-a"),
      matricula: "A-2026-0123",
      guardianIds: ["g-maria", "g-jorge-gomez", "g-laura"],
      attendancePct: 95,
      birthDate: "2017-03-12",
      enrolledAt: "2026-08-15",
      gender: "Masculino",
      curp: "GOML170312HMCRZS09",
      address: "C. Hacienda de Sierra Vieja 214, Tecámac, Méx.",
      bloodType: "O+",
      allergies: "Polvo, lácteos",
      medicalNotes: "Porta antihistamínico en la mochila.",
    }),
    createStudentDefaults({
      id: "camila",
      firstName: "Camila",
      lastName: "Torres",
      cycleId: "ciclo-2026",
      groupId: groupId("2-a"),
      matricula: "A-2026-0124",
      guardianIds: ["g-gabriela"],
      attendancePct: 93,
      birthDate: "2017-06-04",
      gender: "Femenino",
    }),
    createStudentDefaults({
      id: "daniela",
      firstName: "Daniela",
      lastName: "Gómez Martínez",
      cycleId: "ciclo-2026",
      groupId: groupId("5-c"),
      matricula: "A-2026-0401",
      guardianIds: ["g-maria", "g-jorge-gomez"],
      attendancePct: 91,
      birthDate: "2014-11-21",
      gender: "Femenino",
    }),
    createStudentDefaults({
      id: "mateo",
      firstName: "Mateo",
      lastName: "Gómez Martínez",
      cycleId: "ciclo-2026",
      groupId: groupId("k-b"),
      matricula: "A-2026-0031",
      guardianIds: ["g-maria"],
      attendancePct: 88,
      birthDate: "2021-02-09",
      gender: "Masculino",
    }),
  ]
}

export function buildRoster(groups: GradeGroup[]): { students: Student[]; guardians: Guardian[] } {
  const groupId = (seed: string) => {
    const current = groups.find((group) => group.id.endsWith(`-${seed}`) && group.cycleId === "ciclo-2026")
    return current?.id ?? `ciclo-2026-${seed}`
  }

  const featured = buildFeaturedCurrent(groupId)
  const featuredByGroup = new Map<string, Student[]>()
  for (const student of featured) {
    const list = featuredByGroup.get(student.groupId) ?? []
    list.push(student)
    featuredByGroup.set(student.groupId, list)
  }

  const baseGuardians: Guardian[] = [
    { id: "g-maria", name: "María Gómez López", email: "maria.gomez@gmail.com", phone: "5551001001", relation: "Madre", kind: "PRIMARY" },
    { id: "g-jorge-gomez", name: "Jorge Gómez Ramírez", email: "jorge.gomez@gmail.com", phone: "5551001002", relation: "Padre", kind: "AUTHORIZED" },
    { id: "g-laura", name: "Laura Martínez", email: "laura.martinez@gmail.com", phone: "5551001003", relation: "Abuela", kind: "AUTHORIZED" },
    { id: "g-gabriela", name: "Gabriela Torres", email: "gabriela.torres@gmail.com", phone: "5551002001", relation: "Madre", kind: "PRIMARY" },
    { id: "g-sofia", name: "Sofía Martínez", email: "sofia.martinez@gmail.com", phone: "5551002002", relation: "Madre", kind: "PRIMARY" },
    { id: "g-carlos", name: "Carlos Gómez", email: "carlos.gomez@gmail.com", phone: "5551001004", relation: "Tío", kind: "AUTHORIZED" },
    { id: "g-alejandro", name: "Alejandro Pérez", email: "alejandro.perez@gmail.com", phone: "5551003001", relation: "Padre", kind: "PRIMARY" },
  ]

  const students: Student[] = []
  const extraGuardians: Guardian[] = []
  let matriculaSeq = 1
  let lastYear = "2026"
  let generated = 0
  const usedMatriculas = new Set(featured.map((student) => student.matricula))

  function takeMatricula(year: string, preferred?: string) {
    if (preferred && !usedMatriculas.has(preferred)) {
      usedMatriculas.add(preferred)
      return preferred
    }
    let value = `${year === "2026" ? "A-2026" : "A-2025"}-${String(matriculaSeq).padStart(4, "0")}`
    while (usedMatriculas.has(value)) {
      matriculaSeq += 1
      value = `${year === "2026" ? "A-2026" : "A-2025"}-${String(matriculaSeq).padStart(4, "0")}`
    }
    usedMatriculas.add(value)
    matriculaSeq += 1
    return value
  }

  const currentGroups = groups.filter((group) => group.cycleId === "ciclo-2026")
  const previousGroups = groups.filter((group) => group.cycleId === "ciclo-2025")

  for (const group of [...currentGroups, ...previousGroups]) {
    const year = group.cycleId === "ciclo-2026" ? "2026" : "2025"
    if (year !== lastYear) {
      matriculaSeq = 1
      lastYear = year
    }
    const featuredHere = year === "2026" ? (featuredByGroup.get(group.id) ?? []) : []
    const remaining = Math.max(0, group.studentCount - featuredHere.length)
    const built: Student[] = [...featuredHere]

    for (let i = 0; i < remaining; i += 1) {
      const index = generated + i
      const female = index % 2 === 1
      const firstName = female ? pick(FIRST_F, index) : pick(FIRST_M, index + 3)
      const lastName = `${pick(LAST, index)} ${pick(LAST, index + 7)}`
      const gender: Gender = female ? "Femenino" : "Masculino"
      const yearBirth = birthYearFor(group.grade)
      const month = String((index % 12) + 1).padStart(2, "0")
      const day = String((index % 27) + 1).padStart(2, "0")
      const guardianId = `g-auto-${group.cycleId}-${index}`
      extraGuardians.push({
        id: guardianId,
        name: female ? `Ana ${pick(LAST, index)}` : `Luis ${pick(LAST, index + 2)}`,
        email: `familia.${index}@gmail.com`,
        phone: `555${String(1001000 + index).slice(-7)}`,
        relation: female ? "Madre" : "Padre",
        kind: "PRIMARY",
      })
      built.push(
        createStudentDefaults({
          id: `${group.id}-alu-${i}`,
          firstName,
          lastName,
          cycleId: group.cycleId,
          groupId: group.id,
          matricula: takeMatricula(year),
          guardianIds: [guardianId],
          status: group.cycleId === "ciclo-2025" ? "inactivo" : "activo",
          attendancePct: 84 + (index % 15),
          birthDate: pad(`${month}-${day}`, yearBirth),
          enrolledAt: group.cycleId === "ciclo-2026" ? "2026-08-15" : "2025-08-18",
          gender,
          address: pick(STREETS, index),
          bloodType: pick(BLOOD, index),
          allergies: pick(ALLERGIES, index),
          isNew: false,
        }),
      )
    }

    generated += remaining
    students.push(...built)
  }

  const current = students.filter((student) => student.cycleId === "ciclo-2026")
  current.forEach((student) => {
    if (student.id === "lucas" || student.id === "camila" || student.id === "daniela" || student.id === "mateo") return
    student.isNew = false
    student.status = "activo"
  })
  const inactivePool = current.filter(
    (student) => student.id !== "lucas" && student.id !== "camila" && student.id !== "daniela" && student.id !== "mateo",
  )
  const twoA = inactivePool.filter((student) => student.groupId.endsWith("-2-a"))
  const inactive = [...twoA.slice(0, 2), ...inactivePool.filter((student) => !twoA.slice(0, 2).includes(student)).slice(0, 18)]
  inactive.forEach((student) => {
    student.status = "inactivo"
  })
  current
    .filter((student) => student.status === "activo" && student.id !== "lucas")
    .slice(0, 28)
    .forEach((student) => {
      student.isNew = true
    })

  const today = new Date()
  current
    .filter((student) => student.status === "activo" && student.id !== "lucas")
    .slice(28, 35)
    .forEach((student, index) => {
      const next = new Date(today)
      next.setDate(today.getDate() + index + 1)
      const month = String(next.getMonth() + 1).padStart(2, "0")
      const day = String(next.getDate()).padStart(2, "0")
      student.birthDate = `${student.birthDate.slice(0, 4)}-${month}-${day}`
    })

  const previous = students.filter((student) => student.cycleId === "ciclo-2025")
  previous.slice(0, 25).forEach((student) => {
    student.isNew = true
  })

  return { students, guardians: [...baseGuardians, ...extraGuardians] }
}
