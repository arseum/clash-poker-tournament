import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DisplayPage } from './pages/DisplayPage.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { initTimerLoop } from './timer.ts'

const isDisplay = new URLSearchParams(window.location.search).has('display')

// Démarre le timer singleton uniquement dans la fenêtre principale
if (!isDisplay) {
  initTimerLoop();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {isDisplay ? <DisplayPage /> : <App />}
    </ThemeProvider>
  </StrictMode>,
)
