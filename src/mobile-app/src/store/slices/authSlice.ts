import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import * as Keychain from 'react-native-keychain'

interface User {
  id: string
  email: string
  name: string
  role: 'field_worker' | 'supervisor' | 'admin'
  department: string
  phone: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('https://api.cut-grc.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      // Save credentials to keychain
      await Keychain.setInternetCredentials(
        'cut-grc-app',
        credentials.email,
        data.token
      )
      
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear keychain
      await Keychain.resetInternetCredentials('cut-grc-app')
      
      // TODO: Call logout API if needed
      return null
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      // Check if credentials exist in keychain
      const credentials = await Keychain.getInternetCredentials('cut-grc-app')
      
      if (credentials) {
        // TODO: Validate token with backend
        return {
          user: {
            id: '1',
            email: credentials.username,
            name: 'Field Worker',
            role: 'field_worker' as const,
            department: 'Municipal Services',
            phone: '+27 123 456 789',
          },
          token: credentials.password,
        }
      }
      
      return null
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
      
      // Check auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.isAuthenticated = true
          state.user = action.payload.user
          state.token = action.payload.token
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false
      })
  },
})

export const { clearError, updateProfile } = authSlice.actions
export default authSlice.reducer