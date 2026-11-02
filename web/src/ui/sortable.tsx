// Lista reordenable arrastrando desde un asa (≡), con el dedo o el ratón.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { GripIcon } from './icons'

/** Copia de `items` con el elemento `from` movido a la posición `to`. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const result = [...items]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

/**
 * Posición final del elemento arrastrado: cuántos de los demás tienen el centro por encima del suyo.
 * `slots` son la parte de arriba y la altura de cada elemento al empezar a arrastrar.
 */
export function dropIndex(slots: { top: number; height: number }[], from: number, dy: number): number {
  const center = slots[from].top + slots[from].height / 2 + dy
  return slots.filter((slot, i) => i !== from && slot.top + slot.height / 2 < center).length
}

interface Drag {
  from: number
  to: number
  dy: number
  height: number
}

const EDGE = 72

export function SortableList<T>({ items, onMove, renderItem, itemClassName, itemStyle, handleLabel }: {
  items: T[]
  onMove: (from: number, to: number) => void
  /** `handle` es el asa para arrastrar; va donde quiera cada fila. */
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode
  itemClassName?: string
  itemStyle?: CSSProperties
  handleLabel: string
}) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const [drag, setDrag] = useState<Drag | null>(null)
  // Al soltar se muestra ya el orden nuevo hasta que llega de la base de datos, para que no parpadee.
  const [dropped, setDropped] = useState<T[] | null>(null)
  useEffect(() => setDropped(null), [items])
  const shown = dropped ?? items

  const start = (index: number, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const scroller = handle.closest<HTMLElement>('.screen')
    const slots = refs.current.slice(0, shown.length).map((el) => ({ top: el?.offsetTop ?? 0, height: el?.offsetHeight ?? 0 }))
    const startY = e.clientY
    const startScroll = scroller?.scrollTop ?? 0
    let y = startY
    let current: Drag = { from: index, to: index, dy: 0, height: slots[index].height }
    let frame = 0

    const update = () => {
      // Sin salir de la lista: la lista recorta lo que sobresale.
      const last = slots[slots.length - 1]
      const dy = Math.max(slots[0].top - slots[index].top, Math.min(last.top + last.height - slots[index].top - slots[index].height,
        y - startY + (scroller?.scrollTop ?? 0) - startScroll))
      current = { ...current, dy, to: dropIndex(slots, index, dy) }
      setDrag(current)
    }
    // Cerca del borde visible (bajo la barra de navegación, sobre la de pestañas), la lista se desplaza sola.
    const visibleTop = (scroller?.previousElementSibling ?? scroller)?.getBoundingClientRect().bottom ?? 0
    const visibleBottom = Math.min(scroller?.getBoundingClientRect().bottom ?? innerHeight, document.querySelector('.tabbar')?.getBoundingClientRect().top ?? innerHeight)
    const autoScroll = () => {
      if (scroller) {
        const over = y < visibleTop + EDGE ? y - (visibleTop + EDGE) : y > visibleBottom - EDGE ? y - (visibleBottom - EDGE) : 0
        if (over) {
          scroller.scrollTop += Math.max(-16, Math.min(16, over / 3))
          update()
        }
      }
      frame = requestAnimationFrame(autoScroll)
    }
    frame = requestAnimationFrame(autoScroll)

    const move = (ev: globalThis.PointerEvent) => { y = ev.clientY; update() }
    const end = () => {
      cancelAnimationFrame(frame)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      setDrag(null)
      if (current.to !== current.from) {
        setDropped(moveItem(shown, current.from, current.to))
        onMove(current.from, current.to)
      }
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
    setDrag(current)
  }

  const keyMove = (index: number, e: KeyboardEvent) => {
    const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null
    if (to === null || to < 0 || to >= shown.length) return
    e.preventDefault()
    setDropped(moveItem(shown, index, to))
    onMove(index, to)
  }

  const offset = (index: number) => {
    if (!drag) return 0
    if (index === drag.from) return drag.dy
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -drag.height
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return drag.height
    return 0
  }

  return (
    <>
      {shown.map((item, index) => {
        const lifted = drag?.from === index
        const handle = (
          <button
            className="bar-button drag-handle"
            aria-label={handleLabel}
            aria-roledescription="sortable"
            onPointerDown={(e) => start(index, e)}
            onKeyDown={(e) => keyMove(index, e)}
          >
            <GripIcon width={20} height={20} />
          </button>
        )
        return (
          <div
            key={index}
            ref={(el) => { refs.current[index] = el }}
            className={`${itemClassName ?? ''}${lifted ? ' lifted' : ''}`}
            style={{
              ...itemStyle,
              transform: drag ? `translateY(${offset(index)}px)` : undefined,
              transition: drag && !lifted ? 'transform 200ms var(--ease-out)' : undefined,
              zIndex: lifted ? 2 : undefined,
            }}
          >
            {renderItem(item, index, handle)}
          </div>
        )
      })}
    </>
  )
}
