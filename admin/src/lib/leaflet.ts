const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
export const DEFAULT_CENTER: [number, number] = [19.432608, -99.133209]

export type LeafletNs = {
  map: (el: HTMLElement, opts?: { zoomControl?: boolean }) => LeafletMap
  tileLayer: (url: string, opts: { attribution: string; maxZoom: number }) => { addTo: (map: LeafletMap) => void }
  marker: (latlng: [number, number], opts?: { icon?: LeafletIcon }) => LeafletMarker
  divIcon: (opts: { className?: string; html: string; iconSize?: [number, number]; iconAnchor?: [number, number] }) => LeafletIcon
  featureGroup: (layers: LeafletMarker[]) => { getBounds: () => LeafletBounds }
}

export function pickPinIcon(L: LeafletNs) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:999px;background:#2152FF;border:3px solid #F4F7FB;box-shadow:0 6px 16px rgba(0,0,0,.35);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap
  fitBounds: (bounds: LeafletBounds, opts?: { padding?: [number, number]; maxZoom?: number }) => void
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void
  remove: () => void
  invalidateSize: () => void
  removeLayer: (layer: LeafletMarker) => void
}

export type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker
  setLatLng: (latlng: [number, number]) => void
  remove: () => void
  on: (event: string, handler: () => void) => void
  bindPopup: (html: string) => LeafletMarker
}

type LeafletIcon = object
type LeafletBounds = object

declare global {
  interface Window {
    L?: LeafletNs
  }
}

export function loadLeaflet(): Promise<LeafletNs> {
  if (window.L) return Promise.resolve(window.L)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`)
    if (existing) {
      if (window.L) {
        resolve(window.L)
        return
      }
      existing.addEventListener("load", () => (window.L ? resolve(window.L) : reject(new Error("Leaflet"))))
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar el mapa.")))
      return
    }
    const script = document.createElement("script")
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet")))
    script.onerror = () => reject(new Error("No se pudo cargar el mapa."))
    document.head.appendChild(script)
  })
}

export type PlaceHit = {
  label: string
  lat: number
  lng: number
}

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6&countrycodes=mx&q=` +
    encodeURIComponent(q)
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  })
  if (!response.ok) throw new Error("No se pudo buscar la dirección.")
  const rows = (await response.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>
  return rows
    .map((row) => {
      const lat = Number(row.lat)
      const lng = Number(row.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { label: row.display_name ?? `${lat}, ${lng}`, lat, lng }
    })
    .filter((item): item is PlaceHit => item != null)
}
