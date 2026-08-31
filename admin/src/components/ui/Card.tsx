import { type ReactNode } from "react"

export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[22px] border border-app-line bg-app-card ${className}`}>
      {children}
    </section>
  )
}
