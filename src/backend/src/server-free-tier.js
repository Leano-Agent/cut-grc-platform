/**
 * Free Tier Server for Render.com
 * Uses SQLite instead of PostgreSQL/Redis
 * Zero external dependencies required
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database setup
const dbPath = process.env.SQLITE_PATH || '/data/cut-grc-free.sqlite';
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Enable foreign keys and WAL mode
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA busy_timeout = 5000');

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'risk_manager', 'compliance_officer', 'auditor')),
        department TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Risks table
    db.run(`
      CREATE TABLE IF NOT EXISTS risks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT CHECK(status IN ('identified', 'assessed', 'treated', 'monitored', 'closed')),
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user if none exists
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        console.error('Error checking users:', err);
        return;
      }
      
      if (row.count === 0) {
        const adminPassword = 'Admin123!';
        bcrypt.hash(adminPassword, 10, (err, hash) => {
          if (err) {
            console.error('Error hashing password:', err);
            return;
          }
          
          db.run(
            'INSERT INTO users (email, password_hash, full_name, role, department) VALUES (?, ?, ?, ?, ?)',
            ['admin@cut.ac.za', hash, 'System Administrator', 'admin', 'IT'],
            (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
              } else {
                console.log('Default admin user created: admin@cut.ac.za / Admin123!');
              }
            }
          );
        });
      }
    });

    console.log('Database tables initialized');
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  db.get('SELECT 1 as health_check', (err, row) => {
    if (err) {
      res.status(500).json({
        status: 'unhealthy',
        database: 'error',
        error: err.message
      });
    } else {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        mode: 'free-tier',
        version: '1.0.0'
      });
    }
  });
});

// Authentication endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  db.get('SELECT * FROM users WHERE email = ? AND is_active = true', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    bcrypt.compare(password, user.password_hash, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Simple token (in production, use JWT)
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          department: user.department
        }
      });
    });
  });
});

// Risks endpoints
app.get('/api/v1/risks', (req, res) => {
  db.all('SELECT * FROM risks ORDER BY created_at DESC', (err, risks) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(risks);
  });
});

app.post('/api/v1/risks', (req, res) => {
  const { title, description, category, severity, status } = req.body;
  
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category required' });
  }
  
  db.run(
    'INSERT INTO risks (title, description, category, severity, status) VALUES (?, ?, ?, ?, ?)',
    [title, description, category, severity || 'medium', status || 'identified'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      db.get('SELECT * FROM risks WHERE id = ?', [this.lastID], (err, risk) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json(risk);
      });
    }
  );
});

// Users endpoints
app.get('/api/v1/users', (req, res) => {
  db.all('SELECT id, email, full_name, role, department, created_at FROM users WHERE is_active = true', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Dashboard statistics
app.get('/api/v1/dashboard/stats', (req, res) => {
  const stats = {};
  
  // Get user count
  db.get('SELECT COUNT(*) as count FROM users WHERE is_active = true', (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.users = row.count;
    
    // Get risk counts by status
    db.all('SELECT status, COUNT(*) as count FROM risks GROUP BY status', (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      stats.risks = {
        total: rows.reduce((sum, row) => sum + row.count, 0),
        byStatus: rows.reduce((obj, row) => {
          obj[row.status] = row.count;
          return obj;
        }, {})
      };
      
      // Get risk counts by severity
      db.all('SELECT severity, COUNT(*) as count FROM risks GROUP BY severity', (err, severityRows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        stats.risks.bySeverity = severityRows.reduce((obj, row) => {
          obj[row.severity] = row.count;
          return obj;
        }, {});
        
        res.json(stats);
      });
    });
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Free Tier GRC Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Database: ${dbPath}`);
  console.log(`Mode: Free Tier (SQLite)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database closed');
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database closed');
    }
    process.exit(0);
  });
});