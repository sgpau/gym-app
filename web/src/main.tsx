import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './theme/theme.css'

// Actualización automática: cuando hay una versión nueva publicada, se instala sola. La recarga espera a que
// la app pase a segundo plano, para no cerrar lo que estés haciendo (por ejemplo, un entreno recién empezado).
registerSW({
  immediate: true,
  onNeedReload() {
    if (document.visibilityState === 'hidden') return location.reload()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') location.reload()
    })
  },
})

// Pide almacenamiento persistente para que Safari no borre los entrenos si hace falta espacio.
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
