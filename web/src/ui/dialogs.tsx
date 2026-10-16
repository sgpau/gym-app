// Hojas de acción y alertas tipo iOS, con una API de promesas: `await confirm(...)`.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../state'

export interface DialogAction {
  label: string
  destructive?: boolean
  onSelect: () => void
}

interface ActionSheetState {
  kind: 'actions'
  title: string
  message?: string
  actions: DialogAction[]
}
interface AlertState {
  kind: 'alert'
  title: string
  message?: string
}

interface DialogValue {
  actions: (title: string, actions: DialogAction[], message?: string) => void
  /** Confirmación de una acción destructiva. */
  confirm: (title: string, actionLabel: string, onConfirm: () => void, message?: string) => void
  alert: (title: string, message?: string) => void
}

const DialogContext = createContext<DialogValue | null>(null)
export function useDialogs() {
  const value = useContext(DialogContext)
  if (!value) throw new Error('useDialogs fuera de DialogHost')
  return value
}

export function DialogHost({ children }: { children: ReactNode }) {
  const { t } = useApp()
  const [state, setState] = useState<ActionSheetState | AlertState | null>(null)
  const close = () => setState(null)

  const actions = useCallback((title: string, list: DialogAction[], message?: string) => setState({ kind: 'actions', title, message, actions: list }), [])
  const confirm = useCallback(
    (title: string, actionLabel: string, onConfirm: () => void, message?: string) =>
      setState({ kind: 'actions', title, message, actions: [{ label: actionLabel, destructive: true, onSelect: onConfirm }] }),
    [],
  )
  const alert = useCallback((title: string, message?: string) => setState({ kind: 'alert', title, message }), [])

  return (
    <DialogContext.Provider value={{ actions, confirm, alert }}>
      {children}
      {state && createPortal(
        <>
          <div className="backdrop" style={{ zIndex: 60 }} onClick={close} />
          {state.kind === 'actions' ? (
            <div className="action-sheet" role="dialog" aria-modal="true" aria-label={state.title}>
              <div className="action-group">
                <div className="action-title"><strong>{state.title}</strong>{state.message}</div>
                {state.actions.map((a) => (
                  <button key={a.label} className={a.destructive ? 'destructive' : ''} onClick={() => { close(); a.onSelect() }}>{a.label}</button>
                ))}
              </div>
              <div className="action-group cancel"><button onClick={close}>{t('cancel')}</button></div>
            </div>
          ) : (
            <div className="alert-box" role="alertdialog" aria-modal="true" aria-label={state.title}>
              <div className="alert-body"><h3>{state.title}</h3>{state.message && <p>{state.message}</p>}</div>
              <button onClick={close}>{t('ok')}</button>
            </div>
          )}
        </>,
        document.body,
      )}
    </DialogContext.Provider>
  )
}
