import type { GradeGroup, Guardian, Student } from "../types/school"

export function buildRoster(_groups: GradeGroup[] = []): { students: Student[]; guardians: Guardian[] } {
  return { students: [], guardians: [] }
}
