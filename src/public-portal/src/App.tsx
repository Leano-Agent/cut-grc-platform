import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n/config'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import HomePage from './pages/HomePage'
import ServiceRequestPage from './pages/ServiceRequestPage'
import DocumentAccessPage from './pages/DocumentAccessPage'
import PaymentPage from './pages/PaymentPage'
import StatusTrackerPage from './pages/StatusTrackerPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import AccessibilityPage from './pages/AccessibilityPage'
import LanguageSelectorPage from './pages/LanguageSelectorPage'

// Components
import { Toaster } from './components/ui/Toaster'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { LanguageProvider } from './contexts/LanguageContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <AccessibilityProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="services" element={<ServiceRequestPage />} />
                    <Route path="documents" element={<DocumentAccessPage />} />
                    <Route path="payments" element={<PaymentPage />} />
                    <Route path="track" element={<StatusTrackerPage />} />
                    <Route path="accessibility" element={<AccessibilityPage />} />
                    <Route path="language" element={<LanguageSelectorPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>

                  {/* Auth routes */}
                  <Route path="/auth" element={<AuthLayout />}>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                    <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  </Route>
                </Routes>
                <Toaster />
              </div>
            </Router>
          </AccessibilityProvider>
        </LanguageProvider>
      </I18nextProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App