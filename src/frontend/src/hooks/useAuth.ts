import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store'
import { getCurrentUser, logout as logoutAction } from '../store/slices/authSlice'
import { authService } from '../services/authService'

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  
  const { user, token, isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  )

  useEffect(() => {
    // Check if we have a token but no user data
    if (token && !user && !isLoading) {
      dispatch(getCurrentUser())
    }
  }, [token, user, isLoading, dispatch])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password)
      // The login thunk will handle updating the store
      return { success: true, data: response }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    await dispatch(logoutAction())
    navigate('/login')
  }

  const checkPermission = (requiredRole: string | string[]): boolean => {
    if (!user) return false
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(user.role)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Define role-based permissions
    const permissions: Record<string, string[]> = {
      admin: [
        'view_dashboard',
        'manage_users',
        'manage_roles',
        'view_reports',
        'manage_settings',
        'audit_logs',
        'risk_management',
        'compliance_tracking',
        'internal_controls',
        'audit_management',
      ],
      manager: [
        'view_dashboard',
        'view_reports',
        'risk_management',
        'compliance_tracking',
        'internal_controls',
        'audit_management',
        'manage_team',
      ],
      user: [
        'view_dashboard',
        'view_reports',
        'submit_risks',
        'track_compliance',
        'report_issues',
      ],
    }

    return permissions[user.role]?.includes(permission) || false
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    checkPermission,
    hasPermission,
  }
}