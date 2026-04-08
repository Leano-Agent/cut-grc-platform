import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Login from './pages/auth/Login'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import Dashboard from './pages/dashboard/Dashboard'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import RiskManagement from './pages/risk/RiskManagement'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import ComplianceTracking from './pages/compliance/ComplianceTracking'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import InternalControls from './pages/controls/InternalControls'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import AuditManagement from './pages/audit/AuditManagement'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import UserAdministration from './pages/admin/UserAdministration'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';

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
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
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
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="risk-management" element={<RiskManagement />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="compliance-tracking" element={<ComplianceTracking />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="internal-controls" element={<InternalControls />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="audit-management" element={<AuditManagement />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="user-administration" element={<UserAdministration />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
    </Routes>
  )
}

export default App