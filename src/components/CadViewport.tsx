import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  active: boolean
  hint: string
  children: ReactNode
}

export function CadViewport({ active, hint, children }: Props) {
  const spaceRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 12 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => {
    if (!active) {
      setZoom(1)
      setPan({ x: 0, y: 12 })
      return
    }
    const space = spaceRef.current
    if (!space) return
    const fit = () => {
      const sheet = space.querySelector('#shop-sheet') as HTMLElement | null
      if (!sheet) return
      const box = space.getBoundingClientRect()
      const z = Math.min(box.width / sheet.offsetWidth, box.height / sheet.offsetHeight) * 0.92
      const next = Number.isFinite(z) && z > 0.04 ? z : 0.35
      setZoom(next)
      setPan({
        x: Math.max(8, (box.width - sheet.offsetWidth * next) / 2),
        y: 16,
      })
    }
    const id = requestAnimationFrame(fit)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const box = space.getBoundingClientRect()
      const mx = e.clientX - box.left
      const my = e.clientY - box.top
      setZoom((z) => {
        const next = Math.min(6, Math.max(0.08, z * (e.deltaY > 0 ? 0.9 : 1.11)))
        const k = next / z
        setPan((p) => ({ x: mx - k * (mx - p.x), y: my - k * (my - p.y) }))
        return next
      })
    }
    space.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      cancelAnimationFrame(id)
      space.removeEventListener('wheel', onWheel)
    }
  }, [active])

  if (!active) return <>{children}</>

  return (
    <div
      className="cad-space"
      ref={spaceRef}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y })
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
    >
      <div
        className="cad-space-inner"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {children}
      </div>
      <div className="cad-hud">
        {hint} · {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}
