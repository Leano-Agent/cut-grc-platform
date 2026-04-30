import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useAccessibility } from '../contexts/AccessibilityContext'

const MainLayout: React.FC = () => {
  const { fontSize, highContrast } = useAccessibility()

  return (
    <div 
      className={`min-h-screen flex flex-col ${highContrast ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}
      style={{ fontSize: `${fontSize}%` }}
    >
      <Header />
      <main id="main-content" className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout