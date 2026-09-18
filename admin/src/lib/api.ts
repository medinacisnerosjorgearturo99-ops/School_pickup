const origin = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")

export function apiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${origin}${suffix}`
}
