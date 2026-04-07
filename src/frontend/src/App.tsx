import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import RiskManagement from './pages/risk/RiskManagement'
import ComplianceTracking from './pages/compliance/ComplianceTracking'
import InternalControls from './pages/controls/InternalControls'
import AuditManagement from './pages/audit/AuditManagement'
import UserAdministration from './pages/admin/UserAdministration'

// Hooks
import { useAuth } from './hooks/useAuth'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        Loading...
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="risk-management" element={<RiskManagement />} />
        <Route path="compliance-tracking" element={<ComplianceTracking />} />
        <Route path="internal-controls" element={<InternalControls />} />
        <Route path="audit-management" element={<AuditManagement />} />
        <Route path="user-administration" element={<UserAdministration />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App