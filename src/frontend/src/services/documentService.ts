import axios from 'axios'
import { authService } from './authService'

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

export interface Document {
  id: string
  title: string
  description?: string
  category: 'policy' | 'procedure' | 'form' | 'report' | 'memo' | 'other'
  department: string
  status: 'draft' | 'review' | 'approved' | 'archived'
  fileName: string
  fileSize: number
  fileType: string
  fileUrl?: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  tags?: string[]
  version: number
  downloadCount: number
  metadata?: Record<string, any>
  workflow?: {
    currentStep: string
    steps: Array<{
      name: string
      completed: boolean
      completedAt?: string
      completedBy?: string
    }>
  }
  permissions?: {
    canEdit: boolean
    canDelete: boolean
    canDownload: boolean
    canShare: boolean
    canApprove: boolean
  }
}

export interface DocumentFilters {
  page?: number
  limit?: number
  category?: string
  department?: string
  status?: string
  search?: string
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'category'
  sortOrder?: 'asc' | 'desc'
}

export interface DocumentResponse {
  documents: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: DocumentFilters
}

export interface CreateDocumentData {
  title: string
  description?: string
  category: 'policy' | 'procedure' | 'form' | 'report' | 'memo' | 'other'
  department: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateDocumentData {
  title?: string
  description?: string
  category?: 'policy' | 'procedure' | 'form' | 'report' | 'memo' | 'other'
  department?: string
  tags?: string[]
  metadata?: Record<string, any>
  status?: 'draft' | 'review' | 'approved' | 'archived'
}

export interface ShareDocumentData {
  users?: string[]
  departments?: string[]
  permission: 'view' | 'comment' | 'edit'
  message?: string
}

export interface DocumentVersion {
  version: number
  title: string
  description?: string
  changedBy: {
    id: string
    name: string
  }
  changedAt: string
  changes: string[]
  fileSize: number
}

class DocumentService {
  async getDocuments(filters: DocumentFilters = {}): Promise<DocumentResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    
    const response = await api.get<DocumentResponse>(`/documents?${params.toString()}`)
    return response.data
  }

  async getDocumentById(id: string): Promise<Document> {
    const response = await api.get<Document>(`/documents/${id}`)
    return response.data
  }

  async createDocument(data: CreateDocumentData): Promise<Document> {
    const response = await api.post<Document>('/documents', data)
    return response.data
  }

  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    const response = await api.put<Document>(`/documents/${id}`, data)
    return response.data
  }

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  }

  async uploadDocumentFile(id: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post(`/documents/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    })
    
    return response.data
  }

  async shareDocument(id: string, data: ShareDocumentData): Promise<any> {
    const response = await api.post(`/documents/${id}/share`, data)
    return response.data
  }

  async getDocumentVersions(id: string): Promise<{
    documentId: string
    versions: DocumentVersion[]
    currentVersion: number
  }> {
    const response = await api.get(`/documents/${id}/versions`)
    return response.data
  }

  // Helper method to download file with proper filename
  async downloadDocumentWithFilename(id: string, filename: string): Promise<void> {
    const blob = await this.downloadDocument(id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Get document categories for dropdown
  getCategories(): Array<{ value: string; label: string }> {
    return [
      { value: 'policy', label: 'Policy' },
      { value: 'procedure', label: 'Procedure' },
      { value: 'form', label: 'Form' },
      { value: 'report', label: 'Report' },
      { value: 'memo', label: 'Memo' },
      { value: 'other', label: 'Other' },
    ]
  }

  // Get document statuses for dropdown
  getStatuses(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'review', label: 'In Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'archived', label: 'Archived' },
    ]
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon based on file type
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎥'
    if (fileType.includes('audio')) return '🎵'
    if (fileType.includes('zip') || fileType.includes('compressed')) return '📦'
    return '📎'
  }
}

export const documentService = new DocumentService()