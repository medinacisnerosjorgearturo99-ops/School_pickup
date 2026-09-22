import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { DEFAULT_CENTER, loadLeaflet, pickPinIcon, searchPlaces, type LeafletMap, type LeafletMarker, type LeafletNs, type PlaceHit } from "../../lib/leaflet"

export function PlacePickerMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null
  longitude: number | null
  onPick: (lat: number, lng: number, label?: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const leafletRef = useRef<LeafletNs | null>(null)
  const onPickRef = useRef(onPick)
  const coordsRef = useRef({ latitude, longitude })
  const [mapReady, setMapReady] = useState(false)
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<PlaceHit[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
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
        markerRef.current = L.marker(point, { icon: pickPinIcon(L) }).addTo(map)
        map.setView(point, 16)
      }
      window.setTimeout(() => map.invalidateSize(), 120)
      setMapReady(true)
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!mapReady || !map || !L || latitude == null || longitude == null) return
    const point: [number, number] = [latitude, longitude]
    if (!markerRef.current) {
      markerRef.current = L.marker(point, { icon: pickPinIcon(L) }).addTo(map)
    } else {
      markerRef.current.setLatLng(point)
    }
    map.setView(point, 16)
  }, [latitude, longitude, mapReady])

  async function runSearch() {
    setSearchError("")
    setSearching(true)
    try {
      const next = await searchPlaces(query)
      setHits(next)
      if (next.length === 0) setSearchError("No se encontraron direcciones. Prueba con otra búsqueda.")
    } catch {
      setHits([])
      setSearchError("No se pudo buscar. Revisa tu conexión.")
    } finally {
      setSearching(false)
    }
  }

  function chooseHit(hit: PlaceHit) {
    setHits([])
    setQuery(hit.label)
    onPick(Number(hit.lat.toFixed(6)), Number(hit.lng.toFixed(6)), hit.label)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-app-line">
      <div className="space-y-2 border-b border-app-line bg-app-bg p-3">
        <label className="relative block">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-muted" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSearchError("")
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void runSearch()
              }
            }}
            placeholder="Buscar dirección, colonia o escuela…"
            className="w-full rounded-xl border border-app-line bg-app-card py-2.5 pr-24 pl-9 text-sm outline-none focus:border-app-primary"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching || query.trim().length < 3}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg bg-app-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-app-primary-hover disabled:opacity-50"
          >
            {searching ? "…" : "Buscar"}
          </button>
        </label>
        {searchError ? <p className="text-xs font-medium text-app-danger">{searchError}</p> : null}
        {hits.length > 0 ? (
          <ul className="max-h-36 overflow-y-auto rounded-xl border border-app-line bg-app-card">
            {hits.map((hit) => (
              <li key={`${hit.lat}-${hit.lng}-${hit.label}`}>
                <button
                  type="button"
                  onClick={() => chooseHit(hit)}
                  className="w-full border-b border-app-line px-3 py-2 text-left text-xs last:border-b-0 hover:bg-app-card-hover"
                >
                  {hit.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div ref={host} className="h-64 w-full bg-app-bg" />
      <p className="px-3 py-2 text-xs text-app-muted">
        Busca una dirección o toca el mapa para marcar el punto de salida.
      </p>
    </div>
  )
}
