import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DisplayPage } from './pages/DisplayPage.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

const isDisplay = new URLSearchParams(window.location.search).has('display')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {isDisplay ? <DisplayPage /> : <App />}
    </ThemeProvider>
  </StrictMode>,
)
