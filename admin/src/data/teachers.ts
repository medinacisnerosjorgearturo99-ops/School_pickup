import type { Gender, Teacher } from "../types/school"

const CURRENT = "ciclo-2026"
const PREVIOUS = "ciclo-2025"

type Base = {
  id: string
  firstName: string
  lastName: string
  email: string
  cycleIds: string[]
  subjects: string[]
  area: string
  extraGroupIds?: string[]
  hoursPerWeek: number
  rating: number
  hiredAt: string
  isNew?: boolean
  active?: boolean
  gender: Gender
  birthDate: string
  phone: string
}

const bases: Base[] = [
  { id: "t-ana", firstName: "Ana", lastName: "Martínez López", email: "ana.martinez@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Matemáticas"], area: "Matemáticas", extraGroupIds: [`${CURRENT}-2-b`, `${CURRENT}-3-a`], hoursPerWeek: 22, rating: 4.6, hiredAt: "2024-03-15", gender: "Femenino", birthDate: "1992-04-18", phone: "5552001001" },
  { id: "t-ricardo", firstName: "Ricardo", lastName: "López", email: "ricardo.lopez@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Ciencias Naturales", "Formación"], area: "Ciencias", hoursPerWeek: 21, rating: 4.5, hiredAt: "2023-08-10", gender: "Masculino", birthDate: "1988-11-02", phone: "5552001002" },
  { id: "t-laura", firstName: "Laura", lastName: "Torres", email: "laura.torres@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Español", "Formación"], area: "Lenguaje", hoursPerWeek: 22, rating: 4.7, hiredAt: "2022-08-16", gender: "Femenino", birthDate: "1990-07-21", phone: "5552001003" },
  { id: "t-diego", firstName: "Diego", lastName: "Ramírez", email: "diego.ramirez@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Matemáticas", "Ciencias Naturales"], area: "Matemáticas", hoursPerWeek: 22, rating: 4.4, hiredAt: "2023-01-09", gender: "Masculino", birthDate: "1989-03-14", phone: "5552001004" },
  { id: "t-sofia", firstName: "Sofía", lastName: "Navarro", email: "sofia.navarro@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Español"], area: "Lenguaje", hoursPerWeek: 22, rating: 4.8, hiredAt: "2021-08-18", gender: "Femenino", birthDate: "1987-09-30", phone: "5552001005" },
  { id: "t-miguel", firstName: "Miguel", lastName: "Hernández", email: "miguel.hernandez@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Matemáticas", "Computación"], area: "Matemáticas", hoursPerWeek: 22, rating: 4.3, hiredAt: "2024-08-12", gender: "Masculino", birthDate: "1991-01-08", phone: "5552001006" },
  { id: "t-paola", firstName: "Paola", lastName: "Vega", email: "paola.vega@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Español", "Formación"], area: "Lenguaje", hoursPerWeek: 22, rating: 4.6, hiredAt: "2022-02-01", gender: "Femenino", birthDate: "1993-12-05", phone: "5552001007" },
  { id: "t-andres", firstName: "Andrés", lastName: "Castillo", email: "andres.castillo@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Matemáticas"], area: "Matemáticas", hoursPerWeek: 21, rating: 4.5, hiredAt: "2023-08-14", gender: "Masculino", birthDate: "1986-06-19", phone: "5552001008" },
  { id: "t-elena", firstName: "Elena", lastName: "Ríos", email: "elena.rios@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Ciencias Naturales"], area: "Ciencias", hoursPerWeek: 22, rating: 4.7, hiredAt: "2020-08-17", gender: "Femenino", birthDate: "1985-05-11", phone: "5552001009" },
  { id: "t-jorge", firstName: "Jorge", lastName: "Mendoza", email: "jorge.mendoza@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Historia", "Formación"], area: "Ciencias", hoursPerWeek: 22, rating: 4.4, hiredAt: "2022-08-15", gender: "Masculino", birthDate: "1984-10-22", phone: "5552001010" },
  { id: "t-carmen", firstName: "Carmen", lastName: "Salazar", email: "carmen.salazar@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Español", "Historia"], area: "Lenguaje", hoursPerWeek: 22, rating: 4.8, hiredAt: "2019-08-19", gender: "Femenino", birthDate: "1982-02-27", phone: "5552001011" },
  { id: "t-ivan", firstName: "Iván", lastName: "Paredes", email: "ivan.paredes@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Matemáticas", "Computación"], area: "Matemáticas", hoursPerWeek: 21, rating: 4.2, hiredAt: "2024-01-08", gender: "Masculino", birthDate: "1994-08-03", phone: "5552001012" },
  { id: "t-lucia", firstName: "Lucía", lastName: "Ortiz", email: "lucia.ortiz@sanignacio.edu.mx", cycleIds: [CURRENT], subjects: ["Español", "Arte"], area: "Lenguaje", hoursPerWeek: 22, rating: 4.6, hiredAt: "2026-08-03", isNew: true, gender: "Femenino", birthDate: "1995-03-16", phone: "5552001013" },
  { id: "t-raul", firstName: "Raúl", lastName: "Cabrera", email: "raul.cabrera@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Ciencias Naturales"], area: "Ciencias", hoursPerWeek: 21, rating: 4.5, hiredAt: "2021-08-16", gender: "Masculino", birthDate: "1983-12-12", phone: "5552001014" },
  { id: "t-marina", firstName: "Marina", lastName: "Flores", email: "marina.flores@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Inglés"], area: "Idiomas", hoursPerWeek: 22, rating: 4.9, hiredAt: "2020-01-13", gender: "Femenino", birthDate: "1991-07-07", phone: "5552001015" },
  { id: "t-pablo", firstName: "Pablo", lastName: "Reyes", email: "pablo.reyes@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Historia"], area: "Ciencias", hoursPerWeek: 21, rating: 4.4, hiredAt: "2022-08-18", gender: "Masculino", birthDate: "1988-04-25", phone: "5552001016" },
  { id: "t-adriana", firstName: "Adriana", lastName: "Núñez", email: "adriana.nunez@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Español"], area: "Lenguaje", hoursPerWeek: 21, rating: 4.6, hiredAt: "2023-08-11", gender: "Femenino", birthDate: "1990-01-19", phone: "5552001017" },
  { id: "t-sergio", firstName: "Sergio", lastName: "Ibarra", email: "sergio.ibarra@sanignacio.edu.mx", cycleIds: [CURRENT], subjects: ["Computación", "Matemáticas"], area: "Matemáticas", hoursPerWeek: 22, rating: 4.3, hiredAt: "2026-08-04", isNew: true, gender: "Masculino", birthDate: "1992-09-09", phone: "5552001018" },
  { id: "t-gabriela", firstName: "Gabriela", lastName: "Peña", email: "gabriela.pena@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Inglés", "Arte"], area: "Idiomas", extraGroupIds: [`${CURRENT}-5-a`, `${CURRENT}-6-a`], hoursPerWeek: 22, rating: 4.7, hiredAt: "2021-08-20", gender: "Femenino", birthDate: "1989-11-28", phone: "5552001019" },
  { id: "t-hugo", firstName: "Hugo", lastName: "Campos", email: "hugo.campos@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Ed. Física"], area: "Arte y movimiento", extraGroupIds: [`${CURRENT}-3-a`, `${CURRENT}-4-a`], hoursPerWeek: 18, rating: 4.1, hiredAt: "2022-08-08", active: false, gender: "Masculino", birthDate: "1986-08-14", phone: "5552001020" },
  { id: "t-claudia", firstName: "Claudia", lastName: "Miranda", email: "claudia.miranda@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Arte", "Formación"], area: "Arte y movimiento", extraGroupIds: [`${CURRENT}-1-a`, `${CURRENT}-2-a`], hoursPerWeek: 21, rating: 4.8, hiredAt: "2020-08-10", gender: "Femenino", birthDate: "1987-06-02", phone: "5552001021" },
  { id: "t-fernando", firstName: "Fernando", lastName: "Aguilar", email: "fernando.aguilar@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Ed. Física"], area: "Arte y movimiento", extraGroupIds: [`${CURRENT}-5-b`, `${CURRENT}-6-b`], hoursPerWeek: 18, rating: 4.0, hiredAt: "2023-08-07", active: false, gender: "Masculino", birthDate: "1985-01-31", phone: "5552001022" },
  { id: "t-isabel", firstName: "Isabel", lastName: "Morales", email: "isabel.morales@sanignacio.edu.mx", cycleIds: [CURRENT, PREVIOUS], subjects: ["Inglés"], area: "Idiomas", extraGroupIds: [`${CURRENT}-k-a`, `${CURRENT}-1-b`], hoursPerWeek: 22, rating: 4.7, hiredAt: "2024-08-05", gender: "Femenino", birthDate: "1993-05-23", phone: "5552001023" },
  { id: "t-oscar", firstName: "Óscar", lastName: "Delgado", email: "oscar.delgado@sanignacio.edu.mx", cycleIds: [CURRENT], subjects: ["Computación", "Arte"], area: "Arte y movimiento", extraGroupIds: [`${CURRENT}-4-b`, `${CURRENT}-6-c`], hoursPerWeek: 21, rating: 4.5, hiredAt: "2026-08-06", isNew: true, gender: "Masculino", birthDate: "1994-12-01", phone: "5552001024" },
]

function curpOf(lastName: string, firstName: string, birthDate: string, gender: Gender) {
  const last = lastName.replace(/[^A-Za-zÁÉÍÓÚÑ]/gi, "").toUpperCase().padEnd(4, "X").slice(0, 4)
  const first = firstName.replace(/[^A-Za-zÁÉÍÓÚÑ]/gi, "").toUpperCase().slice(0, 1)
  const [year, month, day] = birthDate.split("-")
  return `${last}${first}${(year ?? "90").slice(2)}${month}${day}${gender === "Femenino" ? "M" : "H"}DFRPN09`
}

export function buildTeachers(): Teacher[] {
  return bases.map((base, index) => {
    const female = base.gender === "Femenino"
    return {
      id: base.id,
      firstName: base.firstName,
      lastName: base.lastName,
      email: base.email,
      active: base.active ?? true,
      cycleIds: base.cycleIds,
      employeeId: `PRO-${String(index + 1).padStart(4, "0")}`,
      subjects: base.subjects,
      area: base.area,
      role: female ? "Profesora titular" : "Profesor titular",
      extraGroupIds: base.extraGroupIds ?? [],
      hoursPerWeek: base.hoursPerWeek,
      rating: base.rating,
      hiredAt: base.hiredAt,
      isNew: base.isNew ?? false,
      birthDate: base.birthDate,
      curp: curpOf(base.lastName, base.firstName, base.birthDate, base.gender),
      rfc: `${curpOf(base.lastName, base.firstName, base.birthDate, base.gender).slice(0, 10)}XXX`,
      gender: base.gender,
      nationality: "Mexicana",
      phone: base.phone,
      personalEmail: base.email.replace("@sanignacio.edu.mx", ".personal@gmail.com"),
      address: "Av. Universidad 324, Ciudad de México",
    }
  })
}
