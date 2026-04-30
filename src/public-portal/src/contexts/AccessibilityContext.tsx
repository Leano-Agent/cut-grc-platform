import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilityContextType {
  highContrast: boolean
  toggleHighContrast: () => void
  fontSize: number
  increaseFontSize: () => void
  decreaseFontSize: () => void
  reducedMotion: boolean
  toggleReducedMotion: () => void
  screenReader: boolean
  toggleScreenReader: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    const saved = localStorage.getItem('highContrast')
    return saved ? JSON.parse(saved) : false
  })

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize')
    return saved ? parseInt(saved) : 100
  })

  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('reducedMotion')
    return saved ? JSON.parse(saved) : false
  })

  const [screenReader, setScreenReader] = useState(() => {
    const saved = localStorage.getItem('screenReader')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('highContrast', JSON.stringify(highContrast))
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [highContrast])

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString())
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('reducedMotion', JSON.stringify(reducedMotion))
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }
  }, [reducedMotion])

  useEffect(() => {
    localStorage.setItem('screenReader', JSON.stringify(screenReader))
    if (screenReader) {
      document.documentElement.setAttribute('aria-live', 'polite')
      document.documentElement.setAttribute('role', 'document')
    } else {
      document.documentElement.removeAttribute('aria-live')
      document.documentElement.removeAttribute('role')
    }
  }, [screenReader])

  const toggleHighContrast = () => {
    setHighContrast(!highContrast)
  }

  const increaseFontSize = () => {
    if (fontSize < 200) {
      setFontSize(fontSize + 10)
    }
  }

  const decreaseFontSize = () => {
    if (fontSize > 50) {
      setFontSize(fontSize - 10)
    }
  }

  const toggleReducedMotion = () => {
    setReducedMotion(!reducedMotion)
  }

  const toggleScreenReader = () => {
    setScreenReader(!screenReader)
  }

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        reducedMotion,
        toggleReducedMotion,
        screenReader,
        toggleScreenReader,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}