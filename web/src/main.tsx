import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './theme/theme.css'

// Actualización automática: cuando hay una versión nueva publicada, se instala y se recarga sola.
registerSW({ immediate: true })

// Pide almacenamiento persistente para que Safari no borre los entrenos si hace falta espacio.
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
