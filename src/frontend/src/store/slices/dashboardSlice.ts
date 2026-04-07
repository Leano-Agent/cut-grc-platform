import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface DashboardMetrics {
  totalRisks: number
  highSeverityRisks: number
  complianceRate: number
  openAudits: number
  activeUsers: number
  riskTrend: number
  auditCompletion: number
  controlEffectiveness: number
}

export interface DashboardState {
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: DashboardState = {
  metrics: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
}

// Mock async thunk for dashboard data
export const fetchDashboardMetrics = createAsyncThunk(
  'dashboard/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      return {
        totalRisks: 42,
        highSeverityRisks: 8,
        complianceRate: 92,
        openAudits: 8,
        activeUsers: 156,
        riskTrend: 12,
        auditCompletion: 68,
        controlEffectiveness: 88,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard metrics')
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null
    },
    updateMetric: (state, action: PayloadAction<{ metric: keyof DashboardMetrics; value: number }>) => {
      if (state.metrics) {
        state.metrics[action.payload.metric] = action.payload.value
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.isLoading = false
        state.metrics = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearDashboardError, updateMetric } = dashboardSlice.actions
export default dashboardSlice.reducer