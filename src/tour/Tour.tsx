import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Button } from '../components/Basics'
import { useApp } from '../state'
import { TOUR_STEPS, type TourStep } from './steps'

interface TourState {
  active: boolean
  index: number
  steps: TourStep[]
  start: () => void
  next: () => void
  prev: () => void
  stop: () => void
}

const Ctx = createContext<TourState | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { setStoreId } = useApp()
  const steps = useMemo(() => TOUR_STEPS.filter((s) => !(s.needsStoreSwitch && user?.storeLock)), [user])
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)

  const start = useCallback(() => {
    setStoreId(user?.storeLock ?? '14')
    setIndex(0)
    setActive(true)
  }, [user, setStoreId])
  const stop = useCallback(() => setActive(false), [])
  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        setActive(false)
        return i
      }
      return i + 1
    })
  }, [steps.length])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    if (!user) setActive(false)
  }, [user])

  const value = useMemo(() => ({ active, index, steps, start, next, prev, stop }), [active, index, steps, start, next, prev, stop])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTour(): TourState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTour outside TourProvider')
  return v
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const PAD = 6
const CARD_W = 360

export function TourOverlay() {
  const { active, index, steps, next, prev, stop } = useTour()
  const navigate = useNavigate()
  const location = useLocation()
  const [rect, setRect] = useState<Rect | null>(null)
  const step = steps[index]

  // route + page events for the step
  useEffect(() => {
    if (!active || !step) return
    if (location.pathname !== step.route) navigate(step.route)
    if (step.event) {
      const ev = step.event
      requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('phantom:tour', { detail: ev })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index])

  // find and measure the target; follow resizes, scrolls and the drawer slide-in
  useLayoutEffect(() => {
    if (!active || !step) return
    let raf = 0
    let tries = 0
    let scrolled = false
    const measure = () => {
      const el = document.querySelector(step.target)
      if (!el) return false
      if (!scrolled) {
        scrolled = true
        const r = el.getBoundingClientRect()
        if (r.top < 64 || r.bottom > window.innerHeight - 16) el.scrollIntoView({ block: 'center' })
      }
      const r = el.getBoundingClientRect()
      setRect({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 })
      return true
    }
    const find = () => {
      if (measure()) return
      if (tries++ < 90) raf = requestAnimationFrame(find)
      else setRect(null)
    }
    setRect(null)
    find()
    const late = window.setTimeout(measure, 260)
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(late)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [active, index, step, location.pathname])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, next, prev, stop])

  if (!active || !step) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampX = (x: number) => Math.max(16, Math.min(vw - CARD_W - 16, x))
  let pos: CSSProperties
  if (!rect) pos = { left: clampX(vw / 2 - CARD_W / 2), top: vh / 3 }
  else if (step.place === 'left' && rect.x - CARD_W - 16 > 16) pos = { left: rect.x - CARD_W - 16, top: Math.max(16, Math.min(vh - 260, rect.y + 48)) }
  else if (vh - (rect.y + rect.h) > 240) pos = { left: clampX(rect.x), top: rect.y + rect.h + 12 }
  else if (rect.y > 240) pos = { left: clampX(rect.x), bottom: vh - rect.y + 12 }
  else pos = { right: 24, bottom: 24 }

  const last = index === steps.length - 1
  const hole = rect ?? { x: vw / 2, y: vh / 2, w: 0, h: 0 }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={`Walkthrough step ${index + 1} of ${steps.length}`}>
      <div className="tour-dim" style={{ left: 0, top: 0, width: '100%', height: Math.max(0, hole.y) }} />
      <div className="tour-dim" style={{ left: 0, top: hole.y + hole.h, width: '100%', bottom: 0 }} />
      <div className="tour-dim" style={{ left: 0, top: hole.y, width: Math.max(0, hole.x), height: hole.h }} />
      <div className="tour-dim" style={{ left: hole.x + hole.w, top: hole.y, right: 0, height: hole.h }} />
      {rect && <div className="tour-ring" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />}
      <div className="tour-card" style={{ ...pos, width: CARD_W }}>
        <div className="tour-progress" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={i <= index ? 'on' : undefined} />
          ))}
        </div>
        <p className="meta mono">
          Step {index + 1} of {steps.length}
        </p>
        <h2 className="section" style={{ marginTop: 4 }}>
          {step.title}
        </h2>
        <p className="ink2" style={{ marginTop: 8 }}>
          {step.body}
        </p>
        <div className="tour-actions">
          <Button variant="ghost" onClick={stop}>
            Skip tour
          </Button>
          <span className="spacer" />
          {index > 0 && <Button onClick={prev}>Back</Button>}
          <Button variant="primary" onClick={next} autoFocus>
            {last ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
