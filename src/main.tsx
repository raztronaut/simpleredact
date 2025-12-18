import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'


// Inject Umami Analytics
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID
if (umamiId) {
  const script = document.createElement('script')
  script.defer = true
  script.src = '/stats/script.js'
  script.setAttribute('data-website-id', umamiId)
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
