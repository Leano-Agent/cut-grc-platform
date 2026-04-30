import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Globe, User, Bell, Search, Accessibility } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAccessibility } from '../../contexts/AccessibilityContext'

const Header: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentLanguage, changeLanguage } = useLanguage()
  const { highContrast, toggleHighContrast, fontSize, increaseFontSize, decreaseFontSize } = useAccessibility()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
    { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
    { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
    { code: 'nso', name: 'Sepedi', nativeName: 'Sesotho sa Leboa' },
    { code: 'tn', name: 'Setswana', nativeName: 'Setswana' },
    { code: 'st', name: 'Sesotho', nativeName: 'Sesotho' },
    { code: 'ts', name: 'Xitsonga', nativeName: 'Xitsonga' },
    { code: 'ss', name: 'siSwati', nativeName: 'siSwati' },
    { code: 've', name: 'Tshivenda', nativeName: 'Tshivenda' },
    { code: 'nr', name: 'isiNdebele', nativeName: 'isiNdebele' },
  ]

  const navItems = [
    { path: '/', label: t('header.home') },
    { path: '/services', label: t('header.services') },
    { path: '/documents', label: t('header.documents') },
    { path: '/payments', label: t('header.payments') },
    { path: '/track', label: t('header.track') },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  return (
    <header className={`sticky top-0 z-50 ${highContrast ? 'bg-gray-900 text-white' : 'bg-white shadow-sm'}`}>
      <div className="container mx-auto px-4">
        {/* Skip to main content */}
        <a href="#main-content" className="skip-to-main">
          {t('accessibility.skipToContent')}
        </a>

        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              className="md:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CUT</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">{t('header.title')}</h1>
                <p className="text-sm text-gray-500">{t('header.subtitle')}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:block relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                aria-label={t('header.search')}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </form>

            {/* Accessibility controls */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={decreaseFontSize}
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t('accessibility.decreaseFontSize')}
              >
                A-
              </button>
              <span className="text-sm">{fontSize}%</span>
              <button
                onClick={increaseFontSize}
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t('accessibility.increaseFontSize')}
              >
                A+
              </button>
              <button
                onClick={toggleHighContrast}
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t('accessibility.toggleHighContrast')}
              >
                <Accessibility size={20} />
              </button>
            </div>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t('header.changeLanguage')}
              >
                <Globe size={20} />
                <span className="hidden md:inline">{currentLanguage.toUpperCase()}</span>
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code)
                        setIsLanguageMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        currentLanguage === lang.code ? 'bg-primary-50 text-primary-600' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{lang.nativeName}</span>
                        <span className="text-sm text-gray-500">{lang.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User actions */}
            <div className="flex items-center space-x-2">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t('header.notifications')}
              >
                <Bell size={20} />
              </button>
              <Link
                to="/profile"
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t('header.profile')}
              >
                <User size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="px-4 py-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('header.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>
              </form>

              {/* Mobile accessibility controls */}
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={decreaseFontSize}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label={t('accessibility.decreaseFontSize')}
                  >
                    A-
                  </button>
                  <span className="text-sm">{fontSize}%</span>
                  <button
                    onClick={increaseFontSize}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label={t('accessibility.increaseFontSize')}
                  >
                    A+
                  </button>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label={t('accessibility.toggleHighContrast')}
                >
                  <Accessibility size={20} />
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header