import { forwardRef, useEffect, useId, useState } from 'react'

export const Circle = forwardRef(function Circle({ className = '', children }, ref) {
  return (
    <div
      ref={ref}
      className={`z-10 flex items-center justify-center rounded-full border ${className}`}
    >
      {children}
    </div>
  )
})

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(motion.matches)
    update()
    motion.addEventListener('change', update)
    return () => motion.removeEventListener('change', update)
  }, [])

  return reduced
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 4,
  delay = 0,
  pathColor = '#c5dbfa',
  pathWidth = 2,
  pathOpacity = 0.7,
  gradientStartColor = '#0072e8',
  gradientStopColor = '#004fdf',
}) {
  const rawId = useId().replace(/:/g, '')
  const id = `beam-${rawId}`
  const reduced = useReducedMotion()
  const [pathD, setPathD] = useState('')
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updatePath = () => {
      const container = containerRef.current
      const from = fromRef.current
      const to = toRef.current
      if (!container || !from || !to) return

      const containerRect = container.getBoundingClientRect()
      const fromRect = from.getBoundingClientRect()
      const toRect = to.getBoundingClientRect()
      const startX = fromRect.left - containerRect.left + fromRect.width / 2
      const startY = fromRect.top - containerRect.top + fromRect.height / 2
      const endX = toRect.left - containerRect.left + toRect.width / 2
      const endY = toRect.top - containerRect.top + toRect.height / 2
      const controlY = startY - curvature

      setSvgDimensions({ width: containerRect.width, height: containerRect.height })
      setPathD(`M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`)
    }

    const observer = new ResizeObserver(updatePath)
    if (containerRef.current) observer.observe(containerRef.current)
    if (fromRef.current) observer.observe(fromRef.current)
    if (toRef.current) observer.observe(toRef.current)
    updatePath()

    return () => observer.disconnect()
  }, [containerRef, fromRef, toRef, curvature])

  if (svgDimensions.width === 0 || !pathD) return null

  const start = reverse ? { x1: '90%', x2: '100%' } : { x1: '10%', x2: '0%' }
  const end = reverse ? { x1: '-10%', x2: '0%' } : { x1: '110%', x2: '100%' }

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute top-0 left-0"
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      aria-hidden="true"
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        stroke={`url(#${id})`}
        strokeWidth={pathWidth}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={start.x1} x2={start.x2} y1="0%" y2="0%">
          {!reduced && (
            <>
              <animate attributeName="x1" values={`${start.x1};${end.x1}`} dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="x2" values={`${start.x2};${end.x2}`} dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" />
            </>
          )}
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
