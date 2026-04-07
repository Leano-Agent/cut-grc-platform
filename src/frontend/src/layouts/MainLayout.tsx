import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedUserIcon,
  People as PeopleIcon,
} from '@mui/icons-material'

import Sidebar from '../components/navigation/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useUI } from '../hooks/useUI'

const drawerWidth = 280

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null)

  const { user, logout } = useAuth()
  const { sidebarOpen, toggleSidebar, notifications } = useUI()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget)
  }

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  // Navigation items for sidebar
  const navItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['admin', 'manager', 'user'],
    },
    {
      title: 'Risk Management',
      icon: <SecurityIcon />,
      path: '/risk-management',
      roles: ['admin', 'manager', 'user'],
    },
    {
      title: 'Compliance Tracking',
      icon: <GavelIcon />,
      path: '/compliance-tracking',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Internal Controls',
      icon: <AssignmentIcon />,
      path: '/internal-controls',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Audit Management',
      icon: <VerifiedUserIcon />,
      path: '/audit-management',
      roles: ['admin', 'manager'],
    },
    {
      title: 'User Administration',
      icon: <PeopleIcon />,
      path: '/user-administration',
      roles: ['admin'],
    },
  ]

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          ml: { sm: `${sidebarOpen ? drawerWidth : 0}px` },
          transition: 'width 0.3s, margin 0.3s',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            CUT GRC Platform
          </Typography>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationsOpen}>
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Avatar
              sx={{ width: 40, height: 40, cursor: 'pointer' }}
              onClick={handleMenuOpen}
              src={user?.avatar}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar for mobile */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          <Sidebar navItems={navItems} />
        </Drawer>
        
        {/* Sidebar for desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: 'width 0.3s',
              width: sidebarOpen ? drawerWidth : 0,
              overflowX: 'hidden',
            },
          }}
          open={sidebarOpen}
        >
          <Sidebar navItems={navItems} />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          transition: 'width 0.3s',
          mt: '64px', // AppBar height
        }}
      >
        <Outlet />
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={`${user?.firstName} ${user?.lastName}`}
            secondary={user?.email}
          />
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 400,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem key={notification.id} onClick={handleNotificationsClose}>
              <ListItemText
                primary={notification.message}
                secondary={new Date(notification.timestamp).toLocaleString()}
                primaryTypographyProps={{
                  color: notification.type === 'error' ? 'error.main' : 'text.primary',
                }}
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <ListItemText primary="No notifications" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}

export default MainLayout