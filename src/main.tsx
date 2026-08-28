import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from '@/app/App'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { registerServiceWorker } from '@/lib/pwa'

// Ilova kirish nuqtasi
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Kutilmagan xatolikda oq ekran o'rniga tushunarli xabar chiqadi */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Offline rejim (faqat production'da)
registerServiceWorker()
