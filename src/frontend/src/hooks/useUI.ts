import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  setLanguage,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setLoading,
  setCurrentModule,
  Notification,
} from '../store/slices/uiSlice'

export const useUI = () => {
  const dispatch = useDispatch<AppDispatch>()
  
  const {
    sidebarOpen,
    themeMode,
    language,
    notifications,
    isLoading,
    currentModule,
  } = useSelector((state: RootState) => state.ui)

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar())
  }, [dispatch])

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    dispatch(setSidebarOpen(open))
  }, [dispatch])

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme())
  }, [dispatch])

  const handleSetTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch(setTheme(theme))
  }, [dispatch])

  const handleSetLanguage = useCallback((lang: 'en' | 'fr' | 'pt' | 'sw' | 'zu' | 'xh') => {
    dispatch(setLanguage(lang))
  }, [dispatch])

  const handleAddNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    dispatch(addNotification(notification))
  }, [dispatch])

  const handleMarkNotificationAsRead = useCallback((id: string) => {
    dispatch(markNotificationAsRead(id))
  }, [dispatch])

  const handleMarkAllNotificationsAsRead = useCallback(() => {
    dispatch(markAllNotificationsAsRead())
  }, [dispatch])

  const handleClearNotifications = useCallback(() => {
    dispatch(clearNotifications())
  }, [dispatch])

  const handleSetLoading = useCallback((loading: boolean) => {
    dispatch(setLoading(loading))
  }, [dispatch])

  const handleSetCurrentModule = useCallback((module: string) => {
    dispatch(setCurrentModule(module))
  }, [dispatch])

  // Helper function to show success notification
  const showSuccess = useCallback((message: string) => {
    handleAddNotification({
      type: 'success',
      message,
    })
  }, [handleAddNotification])

  // Helper function to show error notification
  const showError = useCallback((message: string) => {
    handleAddNotification({
      type: 'error',
      message,
    })
  }, [handleAddNotification])

  // Helper function to show warning notification
  const showWarning = useCallback((message: string) => {
    handleAddNotification({
      type: 'warning',
      message,
    })
  }, [handleAddNotification])

  // Helper function to show info notification
  const showInfo = useCallback((message: string) => {
    handleAddNotification({
      type: 'info',
      message,
    })
  }, [handleAddNotification])

  return {
    // State
    sidebarOpen,
    themeMode,
    language,
    notifications,
    isLoading,
    currentModule,
    
    // Actions
    toggleSidebar: handleToggleSidebar,
    setSidebarOpen: handleSetSidebarOpen,
    toggleTheme: handleToggleTheme,
    setTheme: handleSetTheme,
    setLanguage: handleSetLanguage,
    addNotification: handleAddNotification,
    markNotificationAsRead: handleMarkNotificationAsRead,
    markAllNotificationsAsRead: handleMarkAllNotificationsAsRead,
    clearNotifications: handleClearNotifications,
    setLoading: handleSetLoading,
    setCurrentModule: handleSetCurrentModule,
    
    // Helper functions
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}