import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { workflowService, Workflow, WorkflowInstance, WorkflowTask, CreateWorkflowData, WorkflowActionData } from '../../services/workflowService'

export interface WorkflowState {
  workflows: Workflow[]
  currentWorkflow: Workflow | null
  workflowInstances: WorkflowInstance[]
  myTasks: WorkflowTask[]
  isLoading: boolean
  error: string | null
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  workflowInstances: [],
  myTasks: [],
  isLoading: false,
  error: null
}

// Async thunks
export const fetchWorkflows = createAsyncThunk(
  'workflows/fetchWorkflows',
  async (_, { rejectWithValue }) => {
    try {
      const workflows = await workflowService.getWorkflows()
      return workflows
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch workflows')
    }
  }
)

export const fetchWorkflowById = createAsyncThunk(
  'workflows/fetchWorkflowById',
  async (id: string, { rejectWithValue }) => {
    try {
      const workflow = await workflowService.getWorkflowById(id)
      return workflow
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch workflow')
    }
  }
)

export const createWorkflow = createAsyncThunk(
  'workflows/createWorkflow',
  async (data: CreateWorkflowData, { rejectWithValue }) => {
    try {
      const workflow = await workflowService.createWorkflow(data)
      return workflow
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create workflow')
    }
  }
)

export const fetchWorkflowInstances = createAsyncThunk(
  'workflows/fetchWorkflowInstances',
  async (workflowId: string, { rejectWithValue }) => {
    try {
      const response = await workflowService.getWorkflowInstances(workflowId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch workflow instances')
    }
  }
)

export const performWorkflowAction = createAsyncThunk(
  'workflows/performWorkflowAction',
  async ({ workflowId, instanceId, data }: { workflowId: string; instanceId: string; data: WorkflowActionData }, { rejectWithValue }) => {
    try {
      const result = await workflowService.performWorkflowAction(workflowId, instanceId, data)
      return { instanceId, result }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to perform workflow action')
    }
  }
)

export const fetchMyTasks = createAsyncThunk(
  'workflows/fetchMyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await workflowService.getMyTasks()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tasks')
    }
  }
)

const workflowSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentWorkflow: (state) => {
      state.currentWorkflow = null
    },
    updateWorkflowInstance: (state, action: PayloadAction<{ instanceId: string; updates: Partial<WorkflowInstance> }>) => {
      const { instanceId, updates } = action.payload
      const instanceIndex = state.workflowInstances.findIndex(instance => instance.id === instanceId)
      if (instanceIndex !== -1) {
        state.workflowInstances[instanceIndex] = {
          ...state.workflowInstances[instanceIndex],
          ...updates
        }
      }
    },
    updateTask: (state, action: PayloadAction<{ taskId: string; updates: Partial<WorkflowTask> }>) => {
      const { taskId, updates } = action.payload
      const taskIndex = state.myTasks.findIndex(task => task.id === taskId)
      if (taskIndex !== -1) {
        state.myTasks[taskIndex] = {
          ...state.myTasks[taskIndex],
          ...updates
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch workflows
      .addCase(fetchWorkflows.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.isLoading = false
        state.workflows = action.payload
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Fetch workflow by ID
      .addCase(fetchWorkflowById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWorkflowById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentWorkflow = action.payload
      })
      .addCase(fetchWorkflowById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Create workflow
      .addCase(createWorkflow.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.isLoading = false
        state.workflows.unshift(action.payload)
        state.currentWorkflow = action.payload
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Fetch workflow instances
      .addCase(fetchWorkflowInstances.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWorkflowInstances.fulfilled, (state, action) => {
        state.isLoading = false
        state.workflowInstances = action.payload.instances
      })
      .addCase(fetchWorkflowInstances.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Perform workflow action
      .addCase(performWorkflowAction.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(performWorkflowAction.fulfilled, (state, action) => {
        state.isLoading = false
        const { instanceId, result } = action.payload
        
        // Update the instance in the list
        const instanceIndex = state.workflowInstances.findIndex(instance => instance.id === instanceId)
        if (instanceIndex !== -1) {
          state.workflowInstances[instanceIndex] = {
            ...state.workflowInstances[instanceIndex],
            currentStep: result.nextStep,
            currentAssignee: result.nextAssignee,
            status: result.action === 'approve' ? 'in_progress' : 
                   result.action === 'reject' ? 'rejected' : 'pending'
          }
        }
        
        // Also update in myTasks if present
        const taskIndex = state.myTasks.findIndex(task => task.instanceId === instanceId)
        if (taskIndex !== -1) {
          // Remove task from myTasks since it's no longer assigned to current user
          state.myTasks.splice(taskIndex, 1)
        }
      })
      .addCase(performWorkflowAction.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Fetch my tasks
      .addCase(fetchMyTasks.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.isLoading = false
        state.myTasks = action.payload.tasks
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const { clearError, clearCurrentWorkflow, updateWorkflowInstance, updateTask } = workflowSlice.actions
export default workflowSlice.reducer