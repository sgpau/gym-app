// Navegación tipo iOS: una pila de pantallas por pestaña y hojas modales que aparecen desde abajo.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
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
}

interface SheetValue {
  present: (node: ReactNode, options?: { full?: boolean }) => void
  dismiss: () => void
}

const SheetContext = createContext<SheetValue>({ present: () => {}, dismiss: () => {} })
export const useSheet = () => useContext(SheetContext)

export function SheetHost({ children }: { children: ReactNode }) {
  const counter = useRef(0)
  const [sheets, setSheets] = useState<SheetEntry[]>([])
  const present = useCallback((node: ReactNode, options: { full?: boolean } = {}) =>
    setSheets((s) => [...s, { key: ++counter.current, node, full: !!options.full }]), [])
  const dismiss = useCallback(() => setSheets((s) => s.slice(0, -1)), [])

  return (
    <SheetContext.Provider value={{ present, dismiss }}>
      {children}
      {sheets.map((sheet) =>
        createPortal(
          <div key={sheet.key}>
            <div className="backdrop" onClick={sheet.full ? undefined : dismiss} />
            <div className={`sheet${sheet.full ? ' full' : ''}`} role="dialog" aria-modal="true">
              <Stack root={sheet.node} inSheet />
            </div>
          </div>,
          document.body,
        ),
      )}
    </SheetContext.Provider>
  )
}
