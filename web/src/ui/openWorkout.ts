// Entreno abierto en pantalla, para volver a abrirlo si la página se recarga (actualización o Safari que la reinicia).
// sessionStorage sobrevive a una recarga pero no a cerrar la app.

const KEY = 'openWorkout'

export interface OpenWorkout {
  id: string
  isNew: boolean
}

export function rememberOpenWorkout(open: OpenWorkout) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(open))
  } catch {
    // Almacenamiento bloqueado: no se recuerda, sin más.
  }
}

export function forgetOpenWorkout(id: string) {
  try {
    if (readOpenWorkout()?.id === id) sessionStorage.removeItem(KEY)
  } catch {
    // Igual que arriba.
  }
}

/** El entreno que estaba abierto antes de recargar, y lo olvida. */
export function takeOpenWorkout(): OpenWorkout | null {
  const open = readOpenWorkout()
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Igual que arriba.
  }
  return open
}

function readOpenWorkout(): OpenWorkout | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    return value && typeof value.id === 'string' ? { id: value.id, isNew: !!value.isNew } : null
  } catch {
    return null
  }
}
