import { Minus, Plus } from "lucide-react"
import { colorClass } from "../../lib/grades"
import { demandFromUsage } from "../../lib/zones"
import type { DeliveryZone } from "../../types/school"

export function CampusMap({
  zones,
  selectedId,
  zoom,
  onSelect,
  onZoomIn,
  onZoomOut,
  compact = false,
}: {
  zones: DeliveryZone[]
  selectedId: string
  zoom: number
  onSelect: (id: string) => void
  onZoomIn: () => void
  onZoomOut: () => void
  compact?: boolean
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-app-line bg-[#1b3a2a] ${compact ? "h-full min-h-[280px]" : "aspect-[4/3]"}`}>
      <div
        className="absolute inset-0 origin-center transition-transform duration-200"
        style={{ transform: `scale(${zoom})` }}
      >
        <svg viewBox="0 0 800 600" className="h-full w-full" aria-hidden>
          <rect width="800" height="600" fill="#1b3a2a" />
          <rect x="20" y="18" width="760" height="564" rx="18" fill="#2a5438" />
          <rect x="48" y="48" width="220" height="150" rx="8" fill="#3d6b48" />
          <rect x="540" y="40" width="210" height="170" rx="8" fill="#3a6846" />
          <rect x="300" y="36" width="210" height="90" rx="8" fill="#2f5c3c" />
          <path d="M0 430 h800 v48 H0 z" fill="#5b6570" />
          <path d="M250 0 v600" stroke="#5b6570" strokeWidth="36" />
          <path d="M560 0 v600" stroke="#4f5964" strokeWidth="28" />
          <rect x="40" y="250" width="180" height="150" rx="6" fill="#6d7680" />
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={52 + col * 54}
                y={262 + row * 26}
                width="44"
                height="16"
                rx="2"
                fill="#8b949e"
              />
            )),
          )}
          <rect x="290" y="150" width="250" height="210" rx="10" fill="#cbb89a" stroke="#8d7a5c" strokeWidth="3" />
          <rect x="318" y="178" width="70" height="48" rx="3" fill="#8fb4d4" />
          <rect x="402" y="178" width="70" height="48" rx="3" fill="#8fb4d4" />
          <rect x="486" y="178" width="28" height="48" rx="3" fill="#7aa3c7" />
          <rect x="318" y="244" width="194" height="90" rx="4" fill="#b49a78" />
          <rect x="390" y="332" width="50" height="22" rx="3" fill="#6b5a42" />
          <text x="415" y="248" textAnchor="middle" fill="#5c4a32" fontSize="13" fontWeight="700">
            Edificio principal
          </text>
          <rect x="70" y="70" width="150" height="95" rx="8" fill="#d2c0a4" stroke="#8d7a5c" strokeWidth="2" />
          <text x="145" y="124" textAnchor="middle" fill="#5c4a32" fontSize="12" fontWeight="700">
            Kinder
          </text>
          <rect x="575" y="70" width="150" height="110" rx="8" fill="#4f8f7a" stroke="#3a6b5c" strokeWidth="3" />
          <line x1="575" y1="125" x2="725" y2="125" stroke="#dceee6" strokeWidth="2" />
          <line x1="650" y1="70" x2="650" y2="180" stroke="#dceee6" strokeWidth="2" />
          <text x="650" y="142" textAnchor="middle" fill="#e8f6f0" fontSize="12" fontWeight="700">
            Cancha techada
          </text>
          <rect x="575" y="430" width="175" height="110" rx="8" fill="#c4ae8c" stroke="#8d7a5c" strokeWidth="2" />
          <text x="662" y="490" textAnchor="middle" fill="#5c4a32" fontSize="12" fontWeight="700">
            Talleres
          </text>
          <rect x="330" y="48" width="150" height="48" rx="6" fill="#9aa3ad" />
          <text x="405" y="78" textAnchor="middle" fill="#2d3540" fontSize="11" fontWeight="700">
            Portería norte
          </text>
          <rect x="48" y="470" width="170" height="80" rx="8" fill="#6d7680" />
          <text x="133" y="516" textAnchor="middle" fill="#e8edf2" fontSize="11" fontWeight="700">
            Est. docentes
          </text>
          <rect x="300" y="490" width="210" height="44" rx="8" fill="#d8c9b0" />
          <text x="405" y="517" textAnchor="middle" fill="#5c4a32" fontSize="12" fontWeight="700">
            Entrada principal
          </text>
          <circle cx="90" cy="210" r="10" fill="#1f4a2e" />
          <circle cx="130" cy="226" r="12" fill="#245534" />
          <circle cx="500" cy="420" r="11" fill="#1f4a2e" />
          <circle cx="740" cy="250" r="13" fill="#245534" />
          <circle cx="760" cy="380" r="10" fill="#1f4a2e" />
        </svg>

        {zones.map((zone) => {
          const selected = zone.id === selectedId
          const demand = demandFromUsage(zone.usagePct)
          const ring =
            demand === "alta" ? "ring-app-green" : demand === "media" ? "ring-app-orange" : "ring-app-primary"
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelect(zone.id)}
              aria-label={`Zona ${zone.letter}`}
              aria-pressed={selected}
              className={`absolute -translate-x-1/2 -translate-y-full rounded-full shadow-lg transition ${
                selected ? `z-10 scale-110 ring-2 ring-offset-2 ring-offset-[#1b3a2a] ${ring}` : "hover:scale-105"
              }`}
              style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
            >
              <span className={`grid size-8 place-items-center rounded-full text-xs font-extrabold ${colorClass(zone.color)}`}>
                {zone.letter}
              </span>
            </button>
          )
        })}
      </div>

      <div className="absolute right-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-xl border border-white/20 bg-black/45 backdrop-blur-sm">
        <button type="button" onClick={onZoomIn} aria-label="Acercar" className="grid size-8 place-items-center text-white hover:bg-white/15">
          <Plus size={15} />
        </button>
        <button type="button" onClick={onZoomOut} aria-label="Alejar" className="grid size-8 place-items-center text-white hover:bg-white/15">
          <Minus size={15} />
        </button>
      </div>
    </div>
  )
}
