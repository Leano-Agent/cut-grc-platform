import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface TaskLocation {
  latitude: number
  longitude: number
  address: string
}

interface TaskAttachment {
  id: string
  type: 'photo' | 'document' | 'signature'
  uri: string
  name: string
  timestamp: string
}

interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assignedTo: string
  assignedDate: string
  dueDate: string
  location: TaskLocation
  attachments: TaskAttachment[]
  notes: string
  completedDate?: string
  syncStatus: 'synced' | 'pending' | 'failed'
}

interface TasksState {
  tasks: Task[]
  filteredTasks: Task[]
  selectedTask: Task | null
  isLoading: boolean
  error: string | null
  filters: {
    status: string[]
    priority: string[]
    category: string[]
    dateRange: {
      start: string | null
      end: string | null
    }
  }
  searchQuery: string
}

const initialState: TasksState = {
  tasks: [],
  filteredTasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,
  filters: {
    status: [],
    priority: [],
    category: [],
    dateRange: {
      start: null,
      end: null,
    },
  },
  searchQuery: '',
}

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('https://api.cut-grc.com/tasks', {
        headers: {
          'Authorization': `Bearer ${/* token from store */ ''}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      return data.tasks
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (task: Partial<Task> & { id: string }, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`https://api.cut-grc.com/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* token from store */ ''}`,
        },
        body: JSON.stringify(task),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const data = await response.json()
      return data.task
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'id' | 'syncStatus'>, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('https://api.cut-grc.com/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* token from store */ ''}`,
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      const data = await response.json()
      return data.task
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    selectTask: (state, action: PayloadAction<string>) => {
      state.selectedTask = state.tasks.find(task => task.id === action.payload) || null
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null
    },
    updateTaskLocal: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id)
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload, syncStatus: 'pending' }
        state.filteredTasks = filterTasks(state.tasks, state.filters, state.searchQuery)
      }
    },
    addAttachment: (state, action: PayloadAction<{ taskId: string; attachment: TaskAttachment }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId)
      if (task) {
        task.attachments.push(action.payload.attachment)
        task.syncStatus = 'pending'
        state.filteredTasks = filterTasks(state.tasks, state.filters, state.searchQuery)
      }
    },
    setFilters: (state, action: PayloadAction<Partial<TasksState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.filteredTasks = filterTasks(state.tasks, state.filters, state.searchQuery)
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.filteredTasks = filterTasks(state.tasks, state.filters, action.payload)
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
      state.searchQuery = ''
      state.filteredTasks = state.tasks
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false
        state.tasks = action.payload
        state.filteredTasks = filterTasks(action.payload, state.filters, state.searchQuery)
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = { ...action.payload, syncStatus: 'synced' }
          state.filteredTasks = filterTasks(state.tasks, state.filters, state.searchQuery)
        }
      })
      
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push({ ...action.payload, syncStatus: 'synced' })
        state.filteredTasks = filterTasks(state.tasks, state.filters, state.searchQuery)
      })
  },
})

// Helper function to filter tasks
const filterTasks = (
  tasks: Task[],
  filters: TasksState['filters'],
  searchQuery: string
): Task[] => {
  let filtered = tasks

  // Apply status filter
  if (filters.status.length > 0) {
    filtered = filtered.filter(task => filters.status.includes(task.status))
  }

  // Apply priority filter
  if (filters.priority.length > 0) {
    filtered = filtered.filter(task => filters.priority.includes(task.priority))
  }

  // Apply category filter
  if (filters.category.length > 0) {
    filtered = filtered.filter(task => filters.category.includes(task.category))
  }

  // Apply date range filter
  if (filters.dateRange.start && filters.dateRange.end) {
    filtered = filtered.filter(task => {
      const taskDate = new Date(task.assignedDate)
      const startDate = new Date(filters.dateRange.start!)
      const endDate = new Date(filters.dateRange.end!)
      return taskDate >= startDate && taskDate <= endDate
    })
  }

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.location.address.toLowerCase().includes(query)
    )
  }

  return filtered
}

export const {
  selectTask,
  clearSelectedTask,
  updateTaskLocal,
  addAttachment,
  setFilters,
  setSearchQuery,
  clearFilters,
} = tasksSlice.actions

export default tasksSlice.reducer