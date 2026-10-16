// Iconos SVG en línea, inspirados en SF Symbols. Heredan el color con currentColor.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p })

export const CalendarIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
)
export const ListIcon = (p: P) => (
  <svg {...base(p)}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
)
export const DumbbellIcon = (p: P) => (
  <svg {...base(p)}><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></svg>
)
export const ChartIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 20h18" /><path d="M4 16l5-5 4 3 7-8" /><path d="M15 6h5v5" /></svg>
)
export const GearIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
)
export const PlusIcon = (p: P) => <svg {...base(p)} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
export const ChevronLeft = (p: P) => <svg {...base(p)} strokeWidth={2.6}><path d="M15 4l-8 8 8 8" /></svg>
export const ChevronRight = (p: P) => <svg {...base(p)} strokeWidth={2.6}><path d="M9 4l8 8-8 8" /></svg>
export const RowChevron = (p: P) => (
  <svg viewBox="0 0 8 13" className="chevron" aria-hidden {...p}><path d="M1.5 1.5L6.5 6.5L1.5 11.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const TrashIcon = (p: P) => <svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
export const PlayIcon = (p: P) => <svg viewBox="0 0 24 24" aria-hidden {...p}><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
export const StopIcon = (p: P) => <svg viewBox="0 0 24 24" aria-hidden {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
export const TimerIcon = (p: P) => <svg {...base(p)}><circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.5V9.5M10 2.5h4" /></svg>
export const TrophyIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}><path fill="currentColor" d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1 1.7zm10 0v2.7A2 2 0 0 0 18 8V7z" /></svg>
)
export const CheckIcon = (p: P) => <svg {...base(p)} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
export const CheckCircle = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const Circle = (p: P) => <svg viewBox="0 0 24 24" aria-hidden {...p}><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth={1.5} /></svg>
export const EllipsisIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={1.8} /><circle cx="7.5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="16.5" cy="12" r="1.4" fill="currentColor" /></svg>
)
export const ArrowUp = (p: P) => <svg {...base(p)}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
export const ArrowDown = (p: P) => <svg {...base(p)}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
export const TriangleUp = (p: P) => <svg viewBox="0 0 10 10" aria-hidden {...p}><path d="M5 1l4.5 8h-9z" fill="currentColor" /></svg>
export const TriangleDown = (p: P) => <svg viewBox="0 0 10 10" aria-hidden {...p}><path d="M5 9L.5 1h9z" fill="currentColor" /></svg>
export const EqualIcon = (p: P) => <svg viewBox="0 0 10 10" aria-hidden {...p}><path d="M1 3.5h8M1 6.5h8" stroke="currentColor" strokeWidth={1.6} /></svg>
export const SparkleIcon = (p: P) => <svg viewBox="0 0 10 10" aria-hidden {...p}><path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill="currentColor" /></svg>
export const BoltIcon = (p: P) => <svg viewBox="0 0 24 24" aria-hidden {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" /></svg>
export const SearchIcon = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
export const ShareIcon = (p: P) => <svg {...base(p)}><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8" /></svg>
