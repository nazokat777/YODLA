import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from '@/app/App'
import { registerServiceWorker } from '@/lib/pwa'

// Ilova kirish nuqtasi
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline rejim (faqat production'da)
registerServiceWorker()
