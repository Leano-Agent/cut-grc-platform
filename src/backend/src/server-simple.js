/**
 * Simple Free Tier Server for Render.com
 * Minimal dependencies, no external database required
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 10000;

// In-memory database (for free tier demo)
let users = [
  {
    id: 1,
    email: 'admin@cut.ac.za',
    // Password: Admin123! (bcrypt hash)
    password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    full_name: 'System Administrator',
    role: 'admin',
    department: 'IT'
  }
];

let risks = [
  {
    id: 1,
    title: 'Data Breach Risk',
    description: 'Potential unauthorized access to student data',
    category: 'Security',
    severity: 'high',
    status: 'identified',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Compliance Deadline',
    description: 'POPIA compliance review due next quarter',
    category: 'Compliance',
    severity: 'medium',
    status: 'monitored',
    created_at: new Date().toISOString()
  }
];

// Middleware
app.use(helmet());

// SECURITY FIX: Proper CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`🚨 BLOCKED CORS REQUEST from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CUT GRC Platform API',
    version: '1.0.0',
    status: 'operational',
    mode: 'free-tier-simple',
    endpoints: {
      health: '/health',
      login: '/api/v1/auth/login',
      risks: '/api/v1/risks',
      users: '/api/v1/users',
      dashboard: '/api/v1/dashboard/stats'
    },
    documentation: 'https://github.com/Leano-Agent/cut-grc-platform',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mode: 'free-tier-simple',
    version: '1.0.0',
    features: {
      authentication: true,
      risks: true,
      users: true,
      dashboard: true
    }
  });
});

// Authentication endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Simple password check for demo (in production, use bcrypt)
  if (password === 'Admin123!') {
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
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Risks endpoints
app.get('/api/v1/risks', (req, res) => {
  res.json(risks);
});

app.post('/api/v1/risks', (req, res) => {
  const { title, description, category, severity, status } = req.body;
  
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category required' });
  }
  
  const newRisk = {
    id: risks.length + 1,
    title,
    description: description || '',
    category,
    severity: severity || 'medium',
    status: status || 'identified',
    created_at: new Date().toISOString()
  };
  
  risks.push(newRisk);
  res.status(201).json(newRisk);
});

// Users endpoints
app.get('/api/v1/users', (req, res) => {
  const userList = users.map(({ password_hash, ...user }) => user);
  res.json(userList);
});

// Dashboard statistics
app.get('/api/v1/dashboard/stats', (req, res) => {
  const stats = {
    users: users.length,
    risks: {
      total: risks.length,
      byStatus: risks.reduce((acc, risk) => {
        acc[risk.status] = (acc[risk.status] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: risks.reduce((acc, risk) => {
        acc[risk.severity] = (acc[risk.severity] || 0) + 1;
        return acc;
      }, {})
    }
  };
  
  res.json(stats);
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
  console.log(`Simple Free Tier GRC Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Mode: Free Tier Simple (In-memory)`);
  console.log(`Default admin: admin@cut.ac.za / Admin123!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});