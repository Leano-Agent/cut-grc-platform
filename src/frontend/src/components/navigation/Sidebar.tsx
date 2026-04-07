import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedUserIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Report as ReportIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material'

import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

interface NavItem {
  title: string
  icon: React.ReactNode
  path: string
  roles: string[]
  children?: NavItem[]
}

interface SidebarProps {
  navItems: NavItem[]
}

const Sidebar = ({ navItems }: SidebarProps) => {
  const location = useLocation()
  const { user } = useAuth()
  const { sidebarOpen } = useUI()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const handleClick = (title: string) => {
    setOpenItems(prev => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    // Check if user has permission to see this item
    if (!item.roles.includes(user?.role || '')) {
      return null
    }

    const hasChildren = item.children && item.children.length > 0
    const isItemOpen = openItems[item.title] || false

    return (
      <Box key={item.title}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            component={hasChildren ? 'div' : NavLink}
            to={hasChildren ? '#' : item.path}
            onClick={hasChildren ? () => handleClick(item.title) : undefined}
            sx={{
              minHeight: 48,
              justifyContent: sidebarOpen ? 'initial' : 'center',
              px: 2.5,
              pl: depth > 0 ? 4 + depth * 2 : 2.5,
              backgroundColor: isActive(item.path) ? 'primary.light' : 'transparent',
              color: isActive(item.path) ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: isActive(item.path) ? 'primary.main' : 'action.hover',
              },
              '&.active': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarOpen ? 3 : 'auto',
                justifyContent: 'center',
                color: isActive(item.path) ? 'primary.contrastText' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {sidebarOpen && (
              <>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
                {hasChildren && (
                  <Box>
                    {isItemOpen ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                )}
              </>
            )}
          </ListItemButton>
        </ListItem>
        
        {/* Render children if any */}
        {hasChildren && sidebarOpen && (
          <Collapse in={isItemOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    )
  }

  // Additional navigation items
  const additionalItems: NavItem[] = [
    {
      title: 'Reports',
      icon: <ReportIcon />,
      path: '/reports',
      roles: ['admin', 'manager'],
      children: [
        {
          title: 'Risk Reports',
          icon: <AssessmentIcon />,
          path: '/reports/risk',
          roles: ['admin', 'manager'],
        },
        {
          title: 'Compliance Reports',
          icon: <AssessmentIcon />,
          path: '/reports/compliance',
          roles: ['admin', 'manager'],
        },
        {
          title: 'Audit Reports',
          icon: <AssessmentIcon />,
          path: '/reports/audit',
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      roles: ['admin'],
      children: [
        {
          title: 'System Settings',
          icon: <SettingsIcon />,
          path: '/settings/system',
          roles: ['admin'],
        },
        {
          title: 'User Roles',
          icon: <PeopleIcon />,
          path: '/settings/roles',
          roles: ['admin'],
        },
        {
          title: 'Email Templates',
          icon: <SettingsIcon />,
          path: '/settings/email',
          roles: ['admin'],
        },
      ],
    },
    {
      title: 'Help & Support',
      icon: <HelpIcon />,
      path: '/help',
      roles: ['admin', 'manager', 'user'],
    },
  ]

  return (
    <Box>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              display: sidebarOpen ? 'block' : 'none',
            }}
          >
            CUT GRC
          </Typography>
          {!sidebarOpen && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
              }}
            >
              CG
            </Typography>
          )}
        </Box>
      </Toolbar>
      <Divider />
      
      {/* Main Navigation */}
      <List sx={{ px: 1 }}>
        {navItems.map(item => renderNavItem(item))}
      </List>
      
      <Divider />
      
      {/* Additional Navigation */}
      <List sx={{ px: 1 }}>
        {additionalItems.map(item => renderNavItem(item))}
      </List>
      
      {/* Footer section */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '0.75rem',
          }}
        >
          {sidebarOpen ? 'CUT GRC Platform v1.0' : 'v1.0'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '0.75rem',
            mt: 0.5,
          }}
        >
          © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  )
}

export default Sidebar