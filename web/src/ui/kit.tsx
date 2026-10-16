// Componentes de interfaz tipo iOS: pantalla con título grande, listas agrupadas y controles.
import { useState, type ReactNode } from 'react'
import { useApp } from '../state'
import { ChevronLeft, RowChevron } from './icons'
import { useNav } from './nav'

export function Screen({
  title, large = false, leading, trailing, children, solidBar = false,
}: {
  title: string
  large?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  children: ReactNode
  solidBar?: boolean
}) {
  const nav = useNav()
  const [scrolled, setScrolled] = useState(false)
  const back = nav.depth > 0 && !leading ? <BackButton title={nav.backTitle} onClick={nav.pop} /> : leading
  return (
    <>
      <header className={`navbar${scrolled || (!large && solidBar) ? ' scrolled' : ''}${large ? '' : ' titled'}`}>
        <div className="navbar-side">{back}</div>
        <div className="navbar-title" style={large ? undefined : { opacity: 1 }}>{title}</div>
        <div className="navbar-side end">{trailing}</div>
      </header>
      <main
        className={`screen${nav.inSheet ? ' in-sheet' : ''}`}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > (large ? 36 : 2))}
      >
        {large && <h1 className="large-title">{title}</h1>}
        {children}
      </main>
    </>
  )
}

export function BackButton({ title, onClick }: { title?: string; onClick: () => void }) {
  const { t } = useApp()
  return (
    <button className="bar-button" onClick={onClick} style={{ paddingLeft: 0 }}>
      <ChevronLeft width={20} height={20} />
      <span className="truncate" style={{ maxWidth: '28vw' }}>{title ?? t('back')}</span>
    </button>
  )
}

export function BarButton({ children, onClick, bold, prominent, disabled, label }: {
  children: ReactNode; onClick: () => void; bold?: boolean; prominent?: boolean; disabled?: boolean; label?: string
}) {
  return (
    <button className={`bar-button${bold ? ' bold' : ''}${prominent ? ' prominent' : ''}`} onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  )
}

export function Section({ header, footer, children, flush }: { header?: ReactNode; footer?: ReactNode; children: ReactNode; flush?: boolean }) {
  return (
    <section className="section">
      {header && <div className="section-header">{header}</div>}
      {flush ? children : <div className="list">{children}</div>}
      {footer && <div className="section-footer">{footer}</div>}
    </section>
  )
}

export function Row({
  title, subtitle, caption, value, leading, trailing, onClick, chevron, className = '', children,
}: {
  title?: ReactNode; subtitle?: ReactNode; caption?: ReactNode; value?: ReactNode; leading?: ReactNode; trailing?: ReactNode
  onClick?: () => void; chevron?: boolean; className?: string; children?: ReactNode
}) {
  const content = (
    <>
      {leading}
      {children ?? (
        <div className="row-main">
          {title !== undefined && <div className="row-title">{title}</div>}
          {subtitle !== undefined && <div className="row-subtitle">{subtitle}</div>}
          {caption !== undefined && <div className="row-caption">{caption}</div>}
        </div>
      )}
      {value !== undefined && <span className="row-value">{value}</span>}
      {trailing}
      {chevron && <RowChevron />}
    </>
  )
  return onClick ? (
    <button className={`row ${className}`} onClick={onClick}>{content}</button>
  ) : (
    <div className={`row ${className}`}>{content}</div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; label: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Stepper({ value, onChange, min, max, step = 1, label }: {
  value: number; onChange: (value: number) => void; min: number; max: number; step?: number; label: string
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button aria-label={`− ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <button aria-label={`+ ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  )
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action}
    </div>
  )
}

/** Campo numérico que acepta coma o punto decimal; vacío = null. */
export function NumberField({ value, onChange, decimal, label, placeholder = '—', width }: {
  value: number | null; onChange: (value: number | null) => void; decimal?: boolean; label: string; placeholder?: string; width?: number
}) {
  const { locale } = useApp()
  const format = (v: number | null) => (v === null ? '' : new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(v))
  const [text, setText] = useState(format(value))
  const [focused, setFocused] = useState(false)
  const shown = focused ? text : format(value)
  return (
    <input
      className="field"
      style={width ? { width } : undefined}
      inputMode={decimal ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      aria-label={label}
      placeholder={placeholder}
      value={shown}
      onFocus={(e) => { setText(format(value)); setFocused(true); e.currentTarget.select() }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '')
        setText(e.target.value)
        if (raw === '') return onChange(null)
        const parsed = decimal ? parseFloat(raw) : parseInt(raw, 10)
        if (!Number.isNaN(parsed)) onChange(parsed)
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}
