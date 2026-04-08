import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showError, showSuccess } = useUI()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    
    try {
      const result = await login(data.email, data.password)
      
      if (result.success) {
        showSuccess('Login successful! Redirecting to dashboard...')
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        showError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (error: any) {
      showError(error.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  // Demo credentials for testing
  const handleDemoLogin = (role: 'admin' | 'manager' | 'user') => {
    const credentials = {
      admin: { email: 'admin@cutgrc.co.za', password: 'Admin123!' },
      manager: { email: 'manager@cutgrc.co.za', password: 'Admin123!' },
      user: { email: 'user@cutgrc.co.za', password: 'Admin123!' },
    }

    const { email, password } = credentials[role]
    
    // Set form values
    const event = {
      target: {
        name: 'email',
        value: email,
      },
    } as React.ChangeEvent<HTMLInputElement>
    
    // This would need to be handled differently in a real app
    // For now, we'll just show a message
    showInfo(`Demo login for ${role}: ${email} / ${password}\n\nNote: All demo accounts use password: Admin123!`)
  }

  const showInfo = (message: string) => {
    // Using alert for demo purposes
    alert(message)
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" component="h2" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
        Welcome Back
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Sign in to your account to continue
      </Typography>

      {/* Demo Login Buttons */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Try demo accounts:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleDemoLogin('admin')}
            sx={{ flex: 1, minWidth: 100 }}
          >
            Admin
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleDemoLogin('manager')}
            sx={{ flex: 1, minWidth: 100 }}
          >
            Manager
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleDemoLogin('user')}
            sx={{ flex: 1, minWidth: 100 }}
          >
            User
          </Button>
        </Box>
      </Box>

      {/* Email Field */}
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            autoComplete="email"
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            disabled={isSubmitting}
          />
        )}
      />

      {/* Password Field */}
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            required
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={isSubmitting}
          />
        )}
      />

      {/* Remember Me & Forgot Password */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Link
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          sx={{ textDecoration: 'none' }}
        >
          Forgot password?
        </Link>
      </Box>

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={20} /> : <LoginIcon />}
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Register Link */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/register"
            variant="body2"
            sx={{ fontWeight: 600, textDecoration: 'none' }}
          >
            Request access
          </Link>
        </Typography>
      </Box>

      {/* Security Notice */}
      <Alert
        severity="info"
        sx={{ mt: 3 }}
        icon={false}
      >
        <Typography variant="caption">
          <strong>Demo Notice:</strong> This free-tier version uses an in-memory database. 
          User data is lost when the service restarts. All demo accounts use password: <strong>Admin123!</strong>
          For production use, upgrade to PostgreSQL and implement proper user management.
        </Typography>
      </Alert>
    </Box>
  )
}

export default Login