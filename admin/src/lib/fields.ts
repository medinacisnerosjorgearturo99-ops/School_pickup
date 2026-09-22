export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const

export function onlyDigits(value: string, max = 10) {
  return value.replace(/\D/g, "").slice(0, max)
}

export function onlyCurp(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18)
}

export function onlyRfc(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9Ñ&]/g, "").slice(0, 13)
}

export function onlyName(value: string, max = 80) {
  return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]/g, "").slice(0, max)
}

export function onlyAlnum(value: string, max: number) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, max)
}

export function clampInt(value: string, min: number, max: number) {
  const digits = value.replace(/[^\d]/g, "")
  if (!digits) return ""
  const n = Number(digits)
  if (!Number.isFinite(n)) return ""
  return String(Math.min(max, Math.max(min, n)))
}

export function phoneOk(value: string) {
  return value.length === 0 || value.length === 10
}

export function curpOk(value: string) {
  return value.length === 0 || value.length === 18
}

export function rfcOk(value: string) {
  return value.length === 0 || value.length === 12 || value.length === 13
}
