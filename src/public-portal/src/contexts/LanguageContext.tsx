import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface LanguageContextType {
  currentLanguage: string
  changeLanguage: (lang: string) => void
  direction: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en')
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr')

  // RTL languages
  const rtlLanguages = ['ar', 'he', 'fa', 'ur']

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage')
    if (savedLanguage) {
      changeLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    // Update document direction
    document.documentElement.dir = direction
    document.documentElement.lang = currentLanguage
  }, [direction, currentLanguage])

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setCurrentLanguage(lang)
    setDirection(rtlLanguages.includes(lang) ? 'rtl' : 'ltr')
    localStorage.setItem('preferredLanguage', lang)
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, direction }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}