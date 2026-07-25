import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import Dashboard from './pages/dashboard/Dashboard'
import RiskManagement from './pages/risk/RiskManagement'
import ComplianceTracking from './pages/compliance/ComplianceTracking'
import InternalControls from './pages/controls/InternalControls'
import AuditManagement from './pages/audit/AuditManagement'
import UserAdministration from './pages/admin/UserAdministration'
import PolicyManagement from './pages/policies/PolicyManagement'
import IncidentManagement from './pages/incidents/IncidentManagement'
import SurveyManagement from './pages/surveys/SurveyManagement'
import BoardManagement from './pages/boards/BoardManagement'
import ActionTracking from './pages/actions/ActionTracking'
import BcpManagement from './pages/bcp/BcpManagement'
import VendorManagement from './pages/vendors/VendorManagement'
import TrainingManagement from './pages/training/TrainingManagement'

// New pages for sidebar routes that were blank
import RiskReports from './pages/reports/RiskReports'
import ComplianceReports from './pages/reports/ComplianceReports'
import AuditReports from './pages/reports/AuditReports'
import SystemSettings from './pages/settings/SystemSettings'
import UserRoles from './pages/settings/UserRoles'
import EmailTemplates from './pages/settings/EmailTemplates'
import Help from './pages/help/Help'

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
        <Route path="/register" element={<Register />} />
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
        <Route path="risk-management" element={<RiskManagement />} />
        <Route path="compliance-tracking" element={<ComplianceTracking />} />
        <Route path="internal-controls" element={<InternalControls />} />
        <Route path="audit-management" element={<AuditManagement />} />
        <Route path="policy-management" element={<PolicyManagement />} />
        <Route path="incident-management" element={<IncidentManagement />} />
        <Route path="survey-management" element={<SurveyManagement />} />
        <Route path="board-management" element={<BoardManagement />} />
        <Route path="action-tracking" element={<ActionTracking />} />
        <Route path="vendor-management" element={<VendorManagement />} />
        <Route path="training-management" element={<TrainingManagement />} />
        <Route path="bcp-management" element={<BcpManagement />} />
        <Route path="user-administration" element={<UserAdministration />} />
        
        {/* Reports */}
        <Route path="reports/risk" element={<RiskReports />} />
        <Route path="reports/compliance" element={<ComplianceReports />} />
        <Route path="reports/audit" element={<AuditReports />} />
        
        {/* Settings */}
        <Route path="settings/system" element={<SystemSettings />} />
        <Route path="settings/roles" element={<UserRoles />} />
        <Route path="settings/email" element={<EmailTemplates />} />
        
        {/* Help */}
        <Route path="help" element={<Help />} />
        
        <Route path="diagnostics" element={<DiagnosticsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App