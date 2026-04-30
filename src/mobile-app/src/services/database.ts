import SQLite from 'react-native-sqlite-storage'

// Enable promise wrapper
SQLite.enablePromise(true)

const DATABASE_NAME = 'cut_grc.db'
const DATABASE_VERSION = '1.0'
const DATABASE_DISPLAY_NAME = 'CUT GRC Database'
const DATABASE_SIZE = 200000 // 200MB

let database: SQLite.SQLiteDatabase | null = null

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (database) {
    return database
  }

  try {
    database = await SQLite.openDatabase(
      {
        name: DATABASE_NAME,
        location: 'default',
        createFromLocation: 1,
      },
      () => {
        console.log('Database opened successfully')
      },
      (error: any) => {
        console.error('Failed to open database:', error)
      }
    )

    // Create tables if they don't exist
    await createTables()
    
    return database
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

const createTables = async (): Promise<void> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    // Tasks table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        assigned_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        address TEXT,
        notes TEXT,
        completed_date TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Task attachments table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        type TEXT NOT NULL,
        uri TEXT NOT NULL,
        name TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    // Forms table for data collection
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL,
        schema TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Form submissions table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        task_id TEXT,
        data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        sync_status TEXT NOT NULL DEFAULT 'pending',
        submitted_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id)
      )
    `)

    // Sync queue table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        last_attempt TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes
    await database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)
    `)
    await database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks (sync_status)
    `)
    await database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_table_record ON sync_queue (table_name, record_id)
    `)

    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Failed to create tables:', error)
    throw error
  }
}

// Task operations
export const saveTask = async (task: any): Promise<void> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    await database.executeSql(
      `INSERT OR REPLACE INTO tasks (
        id, title, description, category, priority, status,
        assigned_to, assigned_date, due_date, latitude, longitude,
        address, notes, completed_date, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description || '',
        task.category,
        task.priority,
        task.status,
        task.assignedTo,
        task.assignedDate,
        task.dueDate,
        task.location?.latitude || null,
        task.location?.longitude || null,
        task.location?.address || '',
        task.notes || '',
        task.completedDate || null,
        task.syncStatus || 'pending',
      ]
    )
  } catch (error) {
    console.error('Failed to save task:', error)
    throw error
  }
}

export const getTasks = async (filters?: any): Promise<any[]> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    let query = 'SELECT * FROM tasks'
    const params: any[] = []
    
    if (filters) {
      const conditions: string[] = []
      
      if (filters.status && filters.status.length > 0) {
        conditions.push(`status IN (${filters.status.map(() => '?').join(',')})`)
        params.push(...filters.status)
      }
      
      if (filters.priority && filters.priority.length > 0) {
        conditions.push(`priority IN (${filters.priority.map(() => '?').join(',')})`)
        params.push(...filters.priority)
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`
      }
    }
    
    query += ' ORDER BY due_date ASC'
    
    const [results] = await database.executeSql(query, params)
    const tasks: any[] = []
    
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      tasks.push({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: row.status,
        assignedTo: row.assigned_to,
        assignedDate: row.assigned_date,
        dueDate: row.due_date,
        location: {
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,
        },
        notes: row.notes,
        completedDate: row.completed_date,
        syncStatus: row.sync_status,
      })
    }
    
    return tasks
  } catch (error) {
    console.error('Failed to get tasks:', error)
    throw error
  }
}

export const addSyncQueueItem = async (
  tableName: string,
  recordId: string,
  operation: 'create' | 'update' | 'delete',
  data: any
): Promise<void> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    await database.executeSql(
      `INSERT INTO sync_queue (id, table_name, record_id, operation, data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        `${tableName}_${recordId}_${Date.now()}`,
        tableName,
        recordId,
        operation,
        JSON.stringify(data),
      ]
    )
  } catch (error) {
    console.error('Failed to add sync queue item:', error)
    throw error
  }
}

export const getPendingSyncItems = async (): Promise<any[]> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    const [results] = await database.executeSql(
      'SELECT * FROM sync_queue WHERE attempts < 3 ORDER BY created_at ASC LIMIT 50'
    )
    
    const items: any[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      items.push({
        id: row.id,
        tableName: row.table_name,
        recordId: row.record_id,
        operation: row.operation,
        data: JSON.parse(row.data),
        attempts: row.attempts,
        lastAttempt: row.last_attempt,
      })
    }
    
    return items
  } catch (error) {
    console.error('Failed to get pending sync items:', error)
    throw error
  }
}

export const markSyncItemComplete = async (id: string): Promise<void> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    await database.executeSql('DELETE FROM sync_queue WHERE id = ?', [id])
  } catch (error) {
    console.error('Failed to mark sync item complete:', error)
    throw error
  }
}

export const incrementSyncAttempt = async (id: string): Promise<void> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    await database.executeSql(
      'UPDATE sync_queue SET attempts = attempts + 1, last_attempt = ? WHERE id = ?',
      [new Date().toISOString(), id]
    )
  } catch (error) {
    console.error('Failed to increment sync attempt:', error)
    throw error
  }
}

export const clearDatabase = async (): Promise<void> => {
  if (!database) {
    throw new Error('Database not initialized')
  }

  try {
    await database.executeSql('DELETE FROM tasks')
    await database.executeSql('DELETE FROM task_attachments')
    await database.executeSql('DELETE FROM form_submissions')
    await database.executeSql('DELETE FROM sync_queue')
    console.log('Database cleared successfully')
  } catch (error) {
    console.error('Failed to clear database:', error)
    throw error
  }
}

export const closeDatabase = async (): Promise<void> => {
  if (database) {
    try {
      await database.close()
      database = null
      console.log('Database closed successfully')
    } catch (error) {
      console.error('Failed to close database:', error)
      throw error
    }
  }
}