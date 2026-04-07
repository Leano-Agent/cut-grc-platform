import { Outlet, Navigate } from 'react-router-dom'
import { Box, Container, Paper, Typography, useTheme } from '@mui/material'
import { useAuth } from '../hooks/useAuth'

const AuthLayout = () => {
  const theme = useTheme()
  const { isAuthenticated } = useAuth()

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.light}20 0%, ${theme.palette.secondary.light}20 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(${theme.palette.primary.main}15 1px, transparent 1px),
            radial-gradient(${theme.palette.secondary.main}15 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
          opacity: 0.3,
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Logo and Title */}
          <Box
            sx={{
              textAlign: 'center',
              mb: 4,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            >
              CUT GRC Platform
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Governance, Risk & Compliance Management System
            </Typography>
            
            {/* African-inspired decorative element */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 4,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 2,
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  backgroundColor: theme.palette.secondary.main,
                  borderRadius: '50%',
                }}
              />
              <Box
                sx={{
                  width: 40,
                  height: 4,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 2,
                }}
              />
            </Box>
          </Box>

          {/* Auth Form */}
          <Outlet />

          {/* Footer */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} CUT GRC Platform. All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Built with African design principles and sovereignty in mind
            </Typography>
          </Box>
        </Paper>

        {/* Additional Info */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Contact support at{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{ color: 'primary.main', fontWeight: 500 }}
            >
              support@cutgrc.co.za
            </Typography>
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default AuthLayout