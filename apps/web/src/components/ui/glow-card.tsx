import React, { useEffect, useRef, useMemo, type ReactNode } from 'react'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange'
  size?: 'sm' | 'md' | 'lg'
  width?: string | number
  height?: string | number
  customSize?: boolean
  radius?: number
}

const glowColorMap = {
  blue: { base: 213, spread: 0 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
}

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
}

// ── Singleton style injection — runs once per page load ───────────────────────

const GLOW_STYLES = `
  [data-glow]::before,
  [data-glow]::after {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: calc(var(--border-size) * -1);
    border: var(--border-size) solid transparent;
    border-radius: calc(var(--radius) * 1px);
    background-attachment: fixed;
    background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
    background-repeat: no-repeat;
    background-position: 50% 50%;
    mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    mask-clip: padding-box, border-box;
    mask-composite: intersect;
  }
  [data-glow]::before {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
      calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
    );
    filter: brightness(2);
  }
  [data-glow]::after {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
      calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
    );
  }
  [data-glow] [data-glow] {
    position: absolute;
    inset: 0;
    will-change: filter;
    opacity: var(--outer, 1);
    border-radius: calc(var(--radius) * 1px);
    border-width: calc(var(--border-size) * 20);
    filter: blur(calc(var(--border-size) * 10));
    background: none;
    pointer-events: none;
    border: none;
  }
  [data-glow] > [data-glow]::before {
    inset: -10px;
    border-width: 10px;
  }
`

let stylesInjected = false
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return
  stylesInjected = true
  const el = document.createElement('style')
  el.textContent = GLOW_STYLES
  document.head.appendChild(el)
}

// ── Shared pointer registry — one listener for all cards ─────────────────────

const registeredCards = new Set<HTMLDivElement>()
let pointerListenerActive = false

function registerCard(el: HTMLDivElement) {
  registeredCards.add(el)
  if (pointerListenerActive) return
  pointerListenerActive = true
  document.addEventListener('pointermove', onPointerMove, { passive: true })
}

function unregisterCard(el: HTMLDivElement) {
  registeredCards.delete(el)
  if (registeredCards.size === 0 && pointerListenerActive) {
    pointerListenerActive = false
    document.removeEventListener('pointermove', onPointerMove)
  }
}

function onPointerMove(e: PointerEvent) {
  const x = e.clientX.toFixed(2)
  const xp = (e.clientX / window.innerWidth).toFixed(2)
  const y = e.clientY.toFixed(2)
  const yp = (e.clientY / window.innerHeight).toFixed(2)
  for (const card of registeredCards) {
    card.style.setProperty('--x', x)
    card.style.setProperty('--xp', xp)
    card.style.setProperty('--y', y)
    card.style.setProperty('--yp', yp)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GlowCard({
  children,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false,
  radius = 14,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureStyles()
    const el = cardRef.current!
    registerCard(el)
    return () => unregisterCard(el)
  }, [])

  const { base, spread } = glowColorMap[glowColor]

  const inlineStyles = useMemo((): React.CSSProperties & Record<string, string | number> => {
    const styles: React.CSSProperties & Record<string, string | number> = {
      '--base': base,
      '--spread': spread,
      '--radius': radius,
      '--border': '3',
      '--backdrop': 'hsl(0 0% 60% / 0.12)',
      '--backup-border': 'var(--backdrop)',
      '--size': '200',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      backgroundAttachment: 'fixed',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      touchAction: 'none',
    }
    if (width !== undefined) styles.width = typeof width === 'number' ? `${width}px` : width
    if (height !== undefined) styles.height = typeof height === 'number' ? `${height}px` : height
    return styles
  }, [base, spread, radius, width, height])

  return (
    <div
      ref={cardRef}
      data-glow
      style={inlineStyles}
      className={`
        ${!customSize ? sizeMap[size] : ''}
        rounded-2xl relative shadow-[0_1rem_2rem_-1rem_black] p-4 gap-4 backdrop-blur-[5px]
        ${className}
      `}
    >
      <div data-glow />
      {children}
    </div>
  )
}
