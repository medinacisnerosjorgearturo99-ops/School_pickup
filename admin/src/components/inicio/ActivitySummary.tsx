import { useMemo, useState } from "react"
import { useSchool } from "../../context/SchoolContext"
import type { ActivityPeriod } from "../../types/school"
import { Card } from "../ui/Card"
import { MenuSelect } from "../ui/MenuSelect"

const periods: { value: ActivityPeriod; label: string }[] = [
  { value: "esta-semana", label: "Esta semana" },
  { value: "semana-pasada", label: "Semana pasada" },
  { value: "este-mes", label: "Este mes" },
]

export function ActivitySummary() {
  const { school, cycleId, activityPeriod, setActivityPeriod } = useSchool()
  const snapshot = school.activity[cycleId]?.[activityPeriod]
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const chart = useMemo(() => {
    const series = snapshot?.series ?? []
    const max = Math.max(...series.map((point) => point.value), 1)
    const width = 320
    const height = 160
    const padX = 16
    const padY = 16
    const innerW = width - padX * 2
    const innerH = height - padY * 2
    const points = series.map((point, index) => {
      const x = padX + (series.length <= 1 ? innerW / 2 : (index / (series.length - 1)) * innerW)
      const y = padY + innerH - (point.value / max) * innerH
      return { ...point, x, y }
    })
    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ")
    const last = points[points.length - 1]
    const first = points[0]
    const area = first && last
      ? `${line} L ${last.x.toFixed(1)} ${height - padY} L ${first.x.toFixed(1)} ${height - padY} Z`
      : ""
    return { width, height, points, line, area }
  }, [snapshot])

  if (!snapshot) {
    return (
      <Card className="h-full p-5">
        <h2 className="text-base font-bold">Resumen de actividad</h2>
        <p className="mt-6 text-sm text-app-muted">No hay actividad registrada en este ciclo.</p>
      </Card>
    )
  }

  const metrics = [
    { label: "Entregas registradas", value: snapshot.pickups },
    { label: "Alumnos activos", value: snapshot.activeStudents },
    { label: "Grupos con actividad", value: snapshot.groupsWithActivity },
    { label: "Profesores conectados", value: snapshot.teachersConnected },
  ]

  return (
    <Card className="h-full p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Resumen de actividad</h2>
        <MenuSelect
          ariaLabel="Periodo de actividad"
          value={activityPeriod}
          options={periods}
          onChange={setActivityPeriod}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="min-w-0">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-[170px] w-full overflow-visible"
            role="img"
            aria-label="Actividad por periodo"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--chart)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {chart.points.map((point, index) => (
              <line
                key={point.label}
                x1={point.x}
                x2={point.x}
                y1="16"
                y2="144"
                stroke="var(--line)"
                strokeDasharray="3 6"
                opacity={index === 0 || index === chart.points.length - 1 ? 0 : 0.7}
              />
            ))}
            <path d={chart.area} fill="url(#activityFill)" />
            <path d={chart.line} fill="none" stroke="var(--chart)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {chart.points.map((point, index) => (
              <g key={point.label} onMouseEnter={() => setHoverIndex(index)}>
                <circle cx={point.x} cy={point.y} r={hoverIndex === index ? 5 : 3.5} fill="var(--chart)" />
                <text x={point.x} y="156" textAnchor="middle" fill="var(--muted)" fontSize="11" fontWeight="600">
                  {point.label}
                </text>
              </g>
            ))}
            {hoverIndex != null && chart.points[hoverIndex] ? (
              <g>
                <rect
                  x={chart.points[hoverIndex].x - 18}
                  y={chart.points[hoverIndex].y - 28}
                  width="36"
                  height="20"
                  rx="6"
                  fill="var(--card)"
                  stroke="var(--line)"
                />
                <text
                  x={chart.points[hoverIndex].x}
                  y={chart.points[hoverIndex].y - 14}
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize="11"
                  fontWeight="700"
                >
                  {chart.points[hoverIndex].value}
                </text>
              </g>
            ) : null}
          </svg>
        </div>
        <dl className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-app-muted">{metric.label}</dt>
              <dd className="font-extrabold tabular-nums">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  )
}
