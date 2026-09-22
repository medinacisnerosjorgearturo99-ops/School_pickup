import { useEffect, useRef } from "react"

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
const DEFAULT_CENTER: [number, number] = [19.432608, -99.133209]

type LeafletNs = {
  map: (el: HTMLElement, opts: { zoomControl: boolean }) => LeafletMap
  tileLayer: (url: string, opts: { attribution: string; maxZoom: number }) => { addTo: (map: LeafletMap) => void }
  marker: (latlng: [number, number]) => LeafletMarker
}

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void
  remove: () => void
  invalidateSize: () => void
}

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker
  setLatLng: (latlng: [number, number]) => void
}

declare global {
  interface Window {
    L?: LeafletNs
  }
}

function loadLeaflet(): Promise<LeafletNs> {
  if (window.L) return Promise.resolve(window.L)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`)
    if (existing) {
      existing.addEventListener("load", () => (window.L ? resolve(window.L) : reject(new Error("Leaflet"))))
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

export function PlacePickerMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null
  longitude: number | null
  onPick: (lat: number, lng: number) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const leafletRef = useRef<LeafletNs | null>(null)
  const onPickRef = useRef(onPick)
  const coordsRef = useRef({ latitude, longitude })
  onPickRef.current = onPick
  coordsRef.current = { latitude, longitude }

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    void loadLeaflet().then((L) => {
      if (cancelled || !host.current || mapRef.current) return
      leafletRef.current = L
      const map = L.map(el, { zoomControl: true }).setView(DEFAULT_CENTER, 12)
      mapRef.current = map
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)
      map.on("click", (event) => {
        onPickRef.current(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)))
      })
      const start = coordsRef.current
      if (start.latitude != null && start.longitude != null) {
        const point: [number, number] = [start.latitude, start.longitude]
        markerRef.current = L.marker(point).addTo(map)
        map.setView(point, 16)
      }
      window.setTimeout(() => map.invalidateSize(), 120)
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || latitude == null || longitude == null) return
    const point: [number, number] = [latitude, longitude]
    if (!markerRef.current) {
      markerRef.current = L.marker(point).addTo(map)
    } else {
      markerRef.current.setLatLng(point)
    }
    map.setView(point, 16)
  }, [latitude, longitude])

  return (
    <div className="overflow-hidden rounded-2xl border border-app-line">
      <div ref={host} className="h-64 w-full bg-app-bg" />
      <p className="px-3 py-2 text-xs text-app-muted">
        Toca el mapa para marcar el punto de salida. Puedes acercar y moverte como en Maps.
      </p>
    </div>
  )
}
