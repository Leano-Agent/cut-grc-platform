import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Initialize accessibility features
import { initializeAccessibility } from './utils/accessibility'
initializeAccessibility()

// Initialize language detection
import { initializeLanguage } from './utils/language'
initializeLanguage()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)