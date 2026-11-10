// Navegación tipo iOS: una pila de pantallas por pestaña y hojas modales que aparecen desde abajo.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface StackEntry {
  key: number
  node: ReactNode
  /** Título de la pantalla, para el botón «atrás» de la siguiente. */
  title?: string
}

interface NavValue {
  push: (node: ReactNode, title?: string) => void
  pop: () => void
  popToRoot: () => void
  depth: number
  backTitle?: string
  inSheet: boolean
}

const NavContext = createContext<NavValue>({ push: () => {}, pop: () => {}, popToRoot: () => {}, depth: 0, inSheet: false })
export const useNav = () => useContext(NavContext)

/** Pila de navegación. Las pantallas de debajo siguen montadas para conservar su scroll. */
export function Stack({ root, rootTitle, inSheet = false }: { root: ReactNode; rootTitle?: string; inSheet?: boolean }) {
  const counter = useRef(0)
  const [entries, setEntries] = useState<StackEntry[]>([])
  const push = useCallback((node: ReactNode, title?: string) => setEntries((e) => [...e, { key: ++counter.current, node, title }]), [])
  const pop = useCallback(() => setEntries((e) => e.slice(0, -1)), [])
  const popToRoot = useCallback(() => setEntries([]), [])

  const all = [{ key: 0, node: root, title: rootTitle }, ...entries]
  return (
    <>
      {all.map((entry, index) => (
        <div
          key={entry.key}
          className={index > 0 ? 'stack-entry pushed' : 'stack-entry'}
          style={{ visibility: index < all.length - 2 ? 'hidden' : undefined }}
          aria-hidden={index < all.length - 1}
        >
          <NavContext.Provider value={{ push, pop, popToRoot, depth: index, backTitle: all[index - 1]?.title, inSheet }}>
            {entry.node}
          </NavContext.Provider>
        </div>
      ))}
    </>
  )
}

// ---------- Hojas modales ----------

interface SheetEntry {
  key: number
  node: ReactNode
  full: boolean
  /** Identifica la hoja para no abrirla dos veces (p. ej. el mismo entreno). */
  id?: string
  /** Minimizada: sigue montada, oculta, y en su lugar se ve `bar` sobre las pestañas. */
  minimized: boolean
  bar?: ReactNode
}

export interface MinimizedBar {
  key: number
  bar: ReactNode
  restore: () => void
}

interface SheetValue {
  present: (node: ReactNode, options?: { full?: boolean; id?: string }) => void
  /** Dentro de una hoja, la cierra; fuera, cierra la de arriba. */
  dismiss: () => void
  /** Dentro de una hoja, la oculta y deja `bar` sobre las pestañas para volver a ella. */
  minimize: (bar: ReactNode) => void
  /** Dentro de una hoja, le pone el `id` de `present` (cuando su contenido cambia, p. ej. al empezar el entreno). */
  identify: (id: string) => void
  minimizedBars: MinimizedBar[]
}

const SheetContext = createContext<SheetValue>({ present: () => {}, dismiss: () => {}, minimize: () => {}, identify: () => {}, minimizedBars: [] })
export const useSheet = () => useContext(SheetContext)

export function SheetHost({ children }: { children: ReactNode }) {
  const counter = useRef(0)
  const [sheets, setSheets] = useState<SheetEntry[]>([])
  const setMinimized = useCallback((key: number, minimized: boolean, bar?: ReactNode) =>
    setSheets((s) => s.map((x) => (x.key === key ? { ...x, minimized, bar: minimized ? bar : undefined } : x))), [])
  const present = useCallback((node: ReactNode, options: { full?: boolean; id?: string } = {}) =>
    setSheets((s) => {
      const existing = options.id ? s.find((x) => x.id === options.id) : undefined
      if (existing) return s.map((x) => (x === existing ? { ...x, minimized: false, bar: undefined } : x))
      return [...s, { key: ++counter.current, node, full: !!options.full, id: options.id, minimized: false }]
    }), [])
  const dismissKey = useCallback((key: number) => setSheets((s) => s.filter((x) => x.key !== key)), [])
  const dismissTop = useCallback(() => setSheets((s) => {
    const top = [...s].reverse().find((x) => !x.minimized)
    return top ? s.filter((x) => x !== top) : s
  }), [])
  const identify = useCallback((key: number, id: string) => setSheets((s) => s.map((x) => (x.key === key ? { ...x, id } : x))), [])
  const minimizedBars = useMemo(
    () => sheets.filter((x) => x.minimized).map((x) => ({ key: x.key, bar: x.bar, restore: () => setMinimized(x.key, false) })),
    [sheets, setMinimized],
  )
  const root = useMemo(() => ({ present, dismiss: dismissTop, minimize: () => {}, identify: () => {}, minimizedBars }), [present, dismissTop, minimizedBars])

  return (
    <SheetContext.Provider value={root}>
      {children}
      {sheets.map((sheet) =>
        createPortal(
          <div>
            <div className={`backdrop${sheet.minimized ? ' minimized' : ''}`} onClick={sheet.full ? undefined : () => dismissKey(sheet.key)} />
            <div className={`sheet${sheet.full ? ' full' : ''}${sheet.minimized ? ' minimized' : ''}`} role="dialog" aria-modal="true" aria-hidden={sheet.minimized || undefined}>
              <SheetScope sheetKey={sheet.key} root={root} dismissKey={dismissKey} setMinimized={setMinimized} identify={identify}>
                <Stack root={sheet.node} inSheet />
              </SheetScope>
            </div>
          </div>,
          document.body,
          String(sheet.key),
        ),
      )}
    </SheetContext.Provider>
  )
}

/** Da a cada hoja un `dismiss` y un `minimize` que actúan sobre ella misma, aunque no sea la de arriba. */
function SheetScope({ sheetKey, root, dismissKey, setMinimized, identify, children }: {
  sheetKey: number
  root: SheetValue
  dismissKey: (key: number) => void
  setMinimized: (key: number, minimized: boolean, bar?: ReactNode) => void
  identify: (key: number, id: string) => void
  children: ReactNode
}) {
  const value = useMemo<SheetValue>(() => ({
    ...root,
    dismiss: () => dismissKey(sheetKey),
    minimize: (bar) => setMinimized(sheetKey, true, bar),
    identify: (id) => identify(sheetKey, id),
  }), [root, sheetKey, dismissKey, setMinimized, identify])
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
}
