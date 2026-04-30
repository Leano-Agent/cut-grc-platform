import NetInfo from '@react-native-community/netinfo'
import { Platform } from 'react-native'
import {
  getPendingSyncItems,
  markSyncItemComplete,
  incrementSyncAttempt,
  saveTask,
} from './database'
import store from '../store'

const API_BASE_URL = 'https://api.cut-grc.com'
const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MAX_RETRIES = 3

let syncInterval: NodeJS.Timeout | null = null
let isSyncing = false

export const initSync = async (): Promise<void> => {
  // Start periodic sync
  startPeriodicSync()
  
  // Listen for network connectivity changes
  NetInfo.addEventListener(state => {
    if (state.isConnected && !isSyncing) {
      // Trigger sync when connection is restored
      setTimeout(() => {
        syncData()
      }, 1000)
    }
  })
}

export const startPeriodicSync = (): void => {
  if (syncInterval) {
    clearInterval(syncInterval)
  }
  
  syncInterval = setInterval(() => {
    syncData()
  }, SYNC_INTERVAL)
}

export const stopPeriodicSync = (): void => {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

export const syncData = async (): Promise<void> => {
  if (isSyncing) {
    console.log('Sync already in progress')
    return
  }

  const networkState = await NetInfo.fetch()
  if (!networkState.isConnected) {
    console.log('No network connection, skipping sync')
    return
  }

  isSyncing = true
  store.dispatch({ type: 'sync/start' })

  try {
    // Sync pending items from queue
    await syncPendingItems()
    
    // Fetch latest tasks from server
    await fetchLatestTasks()
    
    store.dispatch({ type: 'sync/success' })
  } catch (error) {
    console.error('Sync failed:', error)
    store.dispatch({ 
      type: 'sync/error',
      payload: error.message 
    })
  } finally {
    isSyncing = false
    store.dispatch({ type: 'sync/complete' })
  }
}

const syncPendingItems = async (): Promise<void> => {
  const pendingItems = await getPendingSyncItems()
  
  for (const item of pendingItems) {
    try {
      await processSyncItem(item)
      await markSyncItemComplete(item.id)
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error)
      
      if (item.attempts >= MAX_RETRIES) {
        // Move to failed items or notify user
        console.log(`Max retries reached for item ${item.id}`)
        await markSyncItemComplete(item.id)
      } else {
        await incrementSyncAttempt(item.id)
      }
    }
  }
}

const processSyncItem = async (item: any): Promise<void> => {
  const { state } = store.getState()
  const token = state.auth.token
  
  if (!token) {
    throw new Error('No authentication token')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Device-Id': Platform.OS,
    'X-App-Version': '1.0.0',
  }

  switch (item.tableName) {
    case 'tasks':
      await syncTask(item, headers)
      break
      
    case 'task_attachments':
      await syncTaskAttachment(item, headers)
      break
      
    case 'form_submissions':
      await syncFormSubmission(item, headers)
      break
      
    default:
      console.warn(`Unknown table: ${item.tableName}`)
  }
}

const syncTask = async (item: any, headers: any): Promise<void> => {
  const { operation, data } = item
  
  switch (operation) {
    case 'create':
      await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
      break
      
    case 'update':
      await fetch(`${API_BASE_URL}/tasks/${data.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      })
      break
      
    case 'delete':
      await fetch(`${API_BASE_URL}/tasks/${data.id}`, {
        method: 'DELETE',
        headers,
      })
      break
      
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

const syncTaskAttachment = async (item: any, headers: any): Promise<void> => {
  const { operation, data } = item
  
  // For file uploads, we need to use FormData
  const formData = new FormData()
  formData.append('taskId', data.taskId)
  formData.append('type', data.type)
  formData.append('file', {
    uri: data.uri,
    type: getMimeType(data.uri),
    name: data.name,
  })
  
  const uploadHeaders = {
    ...headers,
    'Content-Type': 'multipart/form-data',
  }
  
  switch (operation) {
    case 'create':
      await fetch(`${API_BASE_URL}/tasks/${data.taskId}/attachments`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData,
      })
      break
      
    case 'delete':
      await fetch(`${API_BASE_URL}/attachments/${data.id}`, {
        method: 'DELETE',
        headers,
      })
      break
      
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

const syncFormSubmission = async (item: any, headers: any): Promise<void> => {
  const { operation, data } = item
  
  switch (operation) {
    case 'create':
    case 'update':
      await fetch(`${API_BASE_URL}/form-submissions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
      break
      
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

const fetchLatestTasks = async (): Promise<void> => {
  const { state } = store.getState()
  const token = state.auth.token
  
  if (!token) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Save tasks to local database
    for (const task of data.tasks) {
      await saveTask({
        ...task,
        syncStatus: 'synced',
      })
    }
    
    // Update Redux store
    store.dispatch({
      type: 'tasks/fetchTasks/fulfilled',
      payload: data.tasks,
    })
  } catch (error) {
    console.error('Failed to fetch latest tasks:', error)
  }
}

const getMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    default:
      return 'application/octet-stream'
  }
}

export const forceSync = async (): Promise<void> => {
  await syncData()
}

export const getSyncStatus = (): boolean => {
  return isSyncing
}