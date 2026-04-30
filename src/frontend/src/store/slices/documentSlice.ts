import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { documentService, Document, DocumentFilters, DocumentResponse, CreateDocumentData, UpdateDocumentData } from '../../services/documentService'

export interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  isLoading: boolean
  error: string | null
  filters: DocumentFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  }
}

// Async thunks
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (filters: DocumentFilters = {}, { rejectWithValue }) => {
    try {
      const response = await documentService.getDocuments(filters)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch documents')
    }
  }
)

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchDocumentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const document = await documentService.getDocumentById(id)
      return document
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch document')
    }
  }
)

export const createDocument = createAsyncThunk(
  'documents/createDocument',
  async (data: CreateDocumentData, { rejectWithValue }) => {
    try {
      const document = await documentService.createDocument(data)
      return document
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create document')
    }
  }
)

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async ({ id, data }: { id: string; data: UpdateDocumentData }, { rejectWithValue }) => {
    try {
      const document = await documentService.updateDocument(id, data)
      return document
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update document')
    }
  }
)

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (id: string, { rejectWithValue }) => {
    try {
      await documentService.deleteDocument(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete document')
    }
  }
)

export const uploadDocumentFile = createAsyncThunk(
  'documents/uploadDocumentFile',
  async ({ id, file }: { id: string; file: File }, { rejectWithValue }) => {
    try {
      const result = await documentService.uploadDocumentFile(id, file)
      return result
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload file')
    }
  }
)

export const downloadDocument = createAsyncThunk(
  'documents/downloadDocument',
  async ({ id, filename }: { id: string; filename: string }, { rejectWithValue }) => {
    try {
      await documentService.downloadDocumentWithFilename(id, filename)
      return { id, filename }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to download document')
    }
  }
)

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentDocument: (state) => {
      state.currentDocument = null
    },
    setFilters: (state, action: PayloadAction<DocumentFilters>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        state.documents = action.payload.documents
        state.pagination = action.payload.pagination
        state.filters = { ...state.filters, ...action.payload.filters }
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Fetch document by ID
      .addCase(fetchDocumentById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentDocument = action.payload
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Create document
      .addCase(createDocument.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.isLoading = false
        state.documents.unshift(action.payload)
        state.currentDocument = action.payload
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Update document
      .addCase(updateDocument.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.documents.findIndex(doc => doc.id === action.payload.id)
        if (index !== -1) {
          state.documents[index] = action.payload
        }
        if (state.currentDocument?.id === action.payload.id) {
          state.currentDocument = action.payload
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.isLoading = false
        state.documents = state.documents.filter(doc => doc.id !== action.payload)
        if (state.currentDocument?.id === action.payload) {
          state.currentDocument = null
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Upload document file
      .addCase(uploadDocumentFile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadDocumentFile.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(uploadDocumentFile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Download document
      .addCase(downloadDocument.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(downloadDocument.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(downloadDocument.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const { clearError, clearCurrentDocument, setFilters, resetFilters } = documentSlice.actions
export default documentSlice.reducer