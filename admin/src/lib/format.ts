const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const dateTimeFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})

function capitalizeMonth(value: string) {
  return value.replace(/(\d+\s)([a-z])/u, (_, prefix: string, letter: string) => prefix + letter.toUpperCase())
}

export function formatDate(iso: string) {
  return capitalizeMonth(dateFmt.format(new Date(`${iso}T00:00:00`)))
}

export function formatDateTime(iso: string) {
  return capitalizeMonth(dateTimeFmt.format(new Date(iso)).replace(",", ","))
}

export function groupBadge(grade: string, letter: string) {
  if (grade.startsWith("Kinder")) return `K${letter}`
  const num = grade.match(/\d+/)?.[0]
  return num ? `${num}°${letter}` : `${grade} ${letter}`
}

export function teacherName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
}
