import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor (shared with authService)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { token, refreshToken: newRefreshToken } = response.data

          // Update tokens
          localStorage.setItem('token', token)
          localStorage.removeItem('refreshToken')
          localStorage.setItem('refreshToken', newRefreshToken)

          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`

          // Retry original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export interface WorkflowStep {
  id: string
  name: string
  description?: string
  role: string
  action: 'review' | 'approve' | 'sign' | 'verify'
  order: number
  estimatedDays?: number
  requiredFields?: string[]
  canEscalate?: boolean
  escalationRole?: string
}

export interface Workflow {
  id: string
  name: string
  description?: string
  type: 'document_approval' | 'risk_assessment' | 'compliance_check' | 'purchase_approval'
  department: string
  status: 'draft' | 'active' | 'inactive' | 'archived'
  version: string
  steps: WorkflowStep[]
  conditions?: Array<{
    condition: string
    action: string
    targetStep?: string
    additionalStep?: string
  }>
  notifications?: {
    email: boolean
    inApp: boolean
    sms: boolean
    reminderFrequency: string
  }
  createdAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  updatedAt: string
  statistics?: {
    activeInstances: number
    completedInstances: number
    averageCompletionTime: string
    successRate: string
    mostCommonDepartment: string
    bottleneckStep: string
  }
  permissions?: {
    canEdit: boolean
    canDelete: boolean
    canActivate: boolean
    canArchive: boolean
  }
}

export interface WorkflowInstance {
  id: string
  workflowId: string
  documentId: string
  documentTitle: string
  currentStep: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated'
  startedBy: string
  startedAt: string
  currentAssignee: string
  dueDate: string
  overdue: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  history?: Array<{
    step: string
    action: string
    performedBy: string
    performedAt: string
    comments?: string
  }>
}

export interface WorkflowTask {
  id: string
  instanceId: string
  workflowId: string
  workflowName: string
  stepName: string
  stepOrder: number
  documentId: string
  documentTitle: string
  department: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate: string
  daysRemaining: number
  overdue: boolean
  createdAt: string
}

export interface CreateWorkflowData {
  name: string
  description?: string
  type: 'document_approval' | 'risk_assessment' | 'compliance_check' | 'purchase_approval'
  steps: Array<{
    name: string
    role: string
    action: 'review' | 'approve' | 'sign' | 'verify'
    order: number
    timeoutDays?: number
  }>
  department: string
}

export interface WorkflowActionData {
  action: 'approve' | 'reject' | 'return' | 'escalate'
  comments?: string
}

class WorkflowService {
  async getWorkflows(): Promise<Workflow[]> {
    const response = await api.get<Workflow[]>('/workflows')
    return response.data
  }

  async getWorkflowById(id: string): Promise<Workflow> {
    const response = await api.get<Workflow>(`/workflows/${id}`)
    return response.data
  }

  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    const response = await api.post<Workflow>('/workflows', data)
    return response.data
  }

  async getWorkflowInstances(id: string): Promise<{
    workflowId: string
    instances: WorkflowInstance[]
    total: number
    stats: {
      pending: number
      inProgress: number
      completed: number
      overdue: number
    }
  }> {
    const response = await api.get(`/workflows/${id}/instances`)
    return response.data
  }

  async performWorkflowAction(
    workflowId: string,
    instanceId: string,
    data: WorkflowActionData
  ): Promise<any> {
    const response = await api.post(`/workflows/${workflowId}/instances/${instanceId}/action`, data)
    return response.data
  }

  async getMyTasks(): Promise<{
    userId: string
    tasks: WorkflowTask[]
    total: number
    stats: {
      pending: number
      overdue: number
      highPriority: number
      dueThisWeek: number
    }
  }> {
    const response = await api.get('/workflows/my-tasks')
    return response.data
  }

  // Get workflow types for dropdown
  getWorkflowTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'document_approval', label: 'Document Approval' },
      { value: 'risk_assessment', label: 'Risk Assessment' },
      { value: 'compliance_check', label: 'Compliance Check' },
      { value: 'purchase_approval', label: 'Purchase Approval' },
    ]
  }

  // Get workflow statuses for dropdown
  getWorkflowStatuses(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'archived', label: 'Archived' },
    ]
  }

  // Get instance statuses for display
  getInstanceStatuses(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'pending', label: 'Pending', color: 'warning' },
      { value: 'in_progress', label: 'In Progress', color: 'info' },
      { value: 'completed', label: 'Completed', color: 'success' },
      { value: 'rejected', label: 'Rejected', color: 'error' },
      { value: 'escalated', label: 'Escalated', color: 'warning' },
    ]
  }

  // Get priority options
  getPriorities(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'low', label: 'Low', color: 'success' },
      { value: 'medium', label: 'Medium', color: 'warning' },
      { value: 'high', label: 'High', color: 'error' },
      { value: 'critical', label: 'Critical', color: 'error' },
    ]
  }

  // Calculate days remaining
  calculateDaysRemaining(dueDate: string): number {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status color
  getStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      rejected: 'error',
      escalated: 'warning',
      draft: 'default',
      active: 'success',
      inactive: 'default',
      archived: 'default',
    }
    return statusMap[status] || 'default'
  }

  // Get priority color
  getPriorityColor(priority: string): string {
    const priorityMap: Record<string, string> = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    }
    return priorityMap[priority] || 'default'
  }
}

export const workflowService = new WorkflowService()