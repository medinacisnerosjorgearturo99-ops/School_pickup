import type { SchoolCycle, SchoolState } from "../types/school"

export const EMPTY_CYCLE: SchoolCycle = {
  id: "",
  label: "Sin ciclo",
  startDate: "",
  endDate: "",
  status: "proximo",
  schoolDays: 0,
  notes: "",
  createdBy: "",
  createdAt: "",
  updatedAt: "",
}

export const schoolSeed: SchoolState = {
  schoolName: "Tu escuela",
  productName: "RecogeYa",
  adminName: "Administrador",
  adminEmail: "",
  cycles: [],
  zones: [],
  teachers: [],
  grades: [],
  groups: [],
  guardians: [],
  students: [],
  screens: [],
  announcements: [],
  upcoming: [],
  activity: {},
}

export const CURRENT_CYCLE_ID = ""
