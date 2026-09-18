import { useCallback, useLayoutEffect, useRef, useState } from "react"

export function useAnchoredMenu(open: boolean, align: "left" | "right" = "right", itemCount = 6) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)

  const update = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, 180)
    let left = align === "left" ? rect.left : rect.right - width
    left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - width - 8))
    const estimated = Math.min(itemCount * 36 + 8, 256)
    const spaceBelow = window.innerHeight - rect.bottom - 12
    const spaceAbove = rect.top - 12
    const openUp = spaceBelow < estimated && spaceAbove > spaceBelow
    const top = openUp ? Math.max(8, rect.top - 8 - Math.min(estimated, spaceAbove)) : rect.bottom + 8
    setCoords({ top, left, width })
  }, [align, itemCount])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }
    update()
    const onMove = () => update()
    window.addEventListener("resize", onMove)
    window.addEventListener("scroll", onMove, true)
    return () => {
      window.removeEventListener("resize", onMove)
      window.removeEventListener("scroll", onMove, true)
    }
  }, [open, update])

  return { triggerRef, coords }
}
