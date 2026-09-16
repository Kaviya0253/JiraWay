import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Without this, refreshing mid-module reopens at whatever scroll position
// the browser remembers from before the reload, instead of the top — the
// browser's own scroll-restoration-on-reload behavior, not anything this
// app does. There's no multi-page history here to restore scroll for, so
// it's just off entirely.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
