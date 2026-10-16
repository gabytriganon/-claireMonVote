import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { refreshData } from './lib/refresh'
import './index.css'

registerSW({ immediate: true })

// Les données sont rechargées à chaque démarrage : une app installée affiche ainsi la dernière mise à jour publiée.
refreshData().finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  ),
)
