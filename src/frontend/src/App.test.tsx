import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'
import { QueryClient, QueryClientProvider } from 'react-query'

import App from './App'
import authReducer from './store/slices/authSlice'
import uiReducer from './store/slices/uiSlice'
import theme from './styles/theme'

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      },
      ui: {
        sidebarOpen: true,
        themeMode: 'light',
        language: 'en',
        notifications: [],
        isLoading: false,
        currentModule: 'dashboard',
      },
    },
  })
}

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  const store = createTestStore()
  const queryClient = createTestQueryClient()

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <ThemeProvider theme={theme}>
            <SnackbarProvider>
              {ui}
            </SnackbarProvider>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  )
}

describe('App', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  test('renders login page by default for unauthenticated users', () => {
    renderWithProviders(<App />, { route: '/' })
    
    // Check for login page elements
    expect(screen.getByText(/CUT GRC Platform/i)).toBeInTheDocument()
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  test('redirects to login when accessing protected route without authentication', () => {
    renderWithProviders(<App />, { route: '/dashboard' })
    
    // Should redirect to login
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument()
  })

  test('renders dashboard for authenticated users', () => {
    // Mock authenticated state
    const authenticatedStore = configureStore({
      reducer: {
        auth: authReducer,
        ui: uiReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'admin',
          },
          token: 'test-token',
          isLoading: false,
          error: null,
          isAuthenticated: true,
        },
        ui: {
          sidebarOpen: true,
          themeMode: 'light',
          language: 'en',
          notifications: [],
          isLoading: false,
          currentModule: 'dashboard',
        },
      },
    })

    render(
      <Provider store={authenticatedStore}>
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <ThemeProvider theme={theme}>
              <SnackbarProvider>
                <App />
              </SnackbarProvider>
            </ThemeProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    )

    // Check for dashboard elements
    expect(screen.getByText(/CUT GRC Platform/i)).toBeInTheDocument()
  })

  test('handles 404 routes', () => {
    renderWithProviders(<App />, { route: '/non-existent-route' })
    
    // Should redirect to login (since user is not authenticated)
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument()
  })

  test('renders with African design theme', () => {
    renderWithProviders(<App />)
    
    // Check for African-inspired design elements
    const platformName = screen.getByText(/CUT GRC Platform/i)
    expect(platformName).toBeInTheDocument()
    
    // Check for African sovereignty mention
    const sovereigntyText = screen.getByText(/Built with African design principles/i)
    expect(sovereigntyText).toBeInTheDocument()
  })
})

// Additional tests for specific components
describe('Authentication Flow', () => {
  test('login form validation', () => {
    renderWithProviders(<App />)
    
    const emailInput = screen.getByLabelText(/Email Address/i)
    const passwordInput = screen.getByLabelText(/Password/i)
    const submitButton = screen.getByRole('button', { name: /Sign In/i })
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(submitButton).toBeInTheDocument()
  })
})

describe('Navigation', () => {
  test('navigation links are present for authenticated users', () => {
    const authenticatedStore = configureStore({
      reducer: {
        auth: authReducer,
        ui: uiReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'admin',
          },
          token: 'test-token',
          isLoading: false,
          error: null,
          isAuthenticated: true,
        },
        ui: {
          sidebarOpen: true,
          themeMode: 'light',
          language: 'en',
          notifications: [],
          isLoading: false,
          currentModule: 'dashboard',
        },
      },
    })

    render(
      <Provider store={authenticatedStore}>
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <ThemeProvider theme={theme}>
              <SnackbarProvider>
                <App />
              </SnackbarProvider>
            </ThemeProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    )

    // Check for navigation elements
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Risk Management/i)).toBeInTheDocument()
    expect(screen.getByText(/Compliance Tracking/i)).toBeInTheDocument()
    expect(screen.getByText(/Internal Controls/i)).toBeInTheDocument()
    expect(screen.getByText(/Audit Management/i)).toBeInTheDocument()
    expect(screen.getByText(/User Administration/i)).toBeInTheDocument()
  })
})