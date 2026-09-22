import { useEffect, useRef, useState } from "react"
import { demandFromUsage } from "../../lib/zones"
import { DEFAULT_CENTER, loadLeaflet, type LeafletMap, type LeafletMarker, type LeafletNs } from "../../lib/leaflet"
import type { DeliveryZone } from "../../types/school"

const pinColors = {
  alta: "#22C55E",
  media: "#F59E0B",
  baja: "#2152FF",
} as const

function pinHtml(letter: string, selected: boolean, demand: keyof typeof pinColors) {
  const color = pinColors[demand]
  const ring = selected ? "3px solid #F4F7FB" : "2px solid rgba(255,255,255,.85)"
  const scale = selected ? "1.12" : "1"
  return `<div style="transform:scale(${scale});width:34px;height:34px;border-radius:999px;background:${color};border:${ring};box-shadow:0 6px 16px rgba(0,0,0,.35);display:grid;place-items:center;color:#fff;font:800 13px Inter,system-ui,sans-serif;">${letter}</div>`
}

export function CampusMap({
  zones,
  selectedId,
  onSelect,
  compact = false,
}: {
  zones: DeliveryZone[]
  selectedId: string
  zoom?: number
  onSelect: (id: string) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  compact?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const leafletRef = useRef<LeafletNs | null>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const onSelectRef = useRef(onSelect)
  const fittedKeyRef = useRef("")
  const [mapReady, setMapReady] = useState(false)
  onSelectRef.current = onSelect

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    void loadLeaflet().then((L) => {
      if (cancelled || !host.current || mapRef.current) return
      leafletRef.current = L
      const map = L.map(el, { zoomControl: true }).setView(DEFAULT_CENTER, 13)
      mapRef.current = map
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)
      window.setTimeout(() => map.invalidateSize(), 120)
      setMapReady(true)
    })
    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
      fittedKeyRef.current = ""
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!mapReady || !map || !L) return

    markersRef.current.forEach((marker) => {
      map.removeLayer(marker)
      marker.remove()
    })
    markersRef.current = []

    const plotted = zones.filter((zone) => zone.latitude != null && zone.longitude != null)
    const nextMarkers = plotted.map((zone) => {
      const demand = demandFromUsage(zone.usagePct)
      const selected = zone.id === selectedId
      const icon = L.divIcon({
        className: "",
        html: pinHtml(zone.letter, selected, demand),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
      const marker = L.marker([zone.latitude as number, zone.longitude as number], { icon })
        .addTo(map)
        .bindPopup(`<strong>${zone.name}</strong><br/>${zone.location || "Sin ubicación"}`)
      marker.on("click", () => onSelectRef.current(zone.id))
      return marker
    })
    markersRef.current = nextMarkers

    const fitKey = plotted.map((zone) => `${zone.id}:${zone.latitude},${zone.longitude}`).join("|")
    if (fitKey !== fittedKeyRef.current) {
      fittedKeyRef.current = fitKey
      if (nextMarkers.length === 1) {
        const zone = plotted[0]
        map.setView([zone.latitude as number, zone.longitude as number], 16)
      } else if (nextMarkers.length > 1) {
        map.fitBounds(L.featureGroup(nextMarkers).getBounds(), { padding: [36, 36], maxZoom: 16 })
      } else {
        map.setView(DEFAULT_CENTER, 12)
      }
    }
    window.setTimeout(() => map.invalidateSize(), 80)
  }, [zones, selectedId, mapReady])

  const hasPins = zones.some((zone) => zone.latitude != null && zone.longitude != null)

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-app-line bg-app-bg ${compact ? "h-full min-h-[280px]" : "aspect-[4/3]"}`}>
      <div ref={host} className="absolute inset-0 z-0" />
      {!hasPins ? (
        <div className="pointer-events-none absolute inset-0 z-[400] grid place-items-center bg-black/35 p-6 text-center">
          <p className="max-w-sm text-sm font-medium text-white">
            Aún no hay salidas marcadas en el mapa. Edita una zona y busca o toca el punto de entrega.
          </p>
        </div>
      ) : null}
    </div>
  )
}
