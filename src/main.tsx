import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Inject Umami Analytics (ID is public/safe to expose in client)
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID
if (umamiId) {
  const script = document.createElement('script')
  script.defer = true
  script.src = '/stats/script.js'
  script.setAttribute('data-website-id', umamiId)
  // Force data to go through our proxy using absolute URL
  script.setAttribute('data-host-url', window.location.origin + '/stats')
  document.head.appendChild(script)
} else {
  console.warn('Umami Website ID not found. Analytics disabled.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
