import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  VerifiedUser as AuditIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface AuditReport {
  id: string
  name: string
  auditor: string
  department: string
  date: string
  status: 'completed' | 'in_progress' | 'scheduled' | 'failed'
  findings: number
  actions: number
}

const mockReports: AuditReport[] = [
  { id: 'ar-1', name: 'Q3 2025 Financial Audit - Revenue Division', auditor: 'Alice Chen', department: 'Finance', date: '2025-10-01', status: 'completed', findings: 3, actions: 5 },
  { id: 'ar-2', name: 'IT Security Audit - Access Controls', auditor: 'Bob Martinez', department: 'IT', date: '2025-09-28', status: 'completed', findings: 7, actions: 12 },
  { id: 'ar-3', name: 'Compliance Audit - POPIA Readiness', auditor: 'Carol Wu', department: 'Legal', date: '2025-09-20', status: 'in_progress', findings: 5, actions: 8 },
  { id: 'ar-4', name: 'Operational Audit - Supply Chain', auditor: 'David Kim', department: 'Operations', date: '2025-09-15', status: 'in_progress', findings: 2, actions: 3 },
  { id: 'ar-5', name: 'Procurement Audit - Vendor Compliance', auditor: 'Eve Johnson', department: 'Procurement', date: '2025-10-05', status: 'scheduled', findings: 0, actions: 0 },
  { id: 'ar-6', name: 'Annual HR Compliance Review', auditor: 'Frank Lee', department: 'HR', date: '2025-08-28', status: 'completed', findings: 1, actions: 2 },
  { id: 'ar-7', name: 'Data Privacy Audit - Customer Records', auditor: 'Grace Patel', department: 'IT', date: '2025-08-20', status: 'failed', findings: 12, actions: 18 },
  { id: 'ar-8', name: 'Treasury Operations Audit', auditor: 'Henry Zhao', department: 'Finance', date: '2025-10-10', status: 'scheduled', findings: 0, actions: 0 },
  { id: 'ar-9', name: 'Quality Management System Audit', auditor: 'Iris Chang', department: 'Operations', date: '2025-09-05', status: 'completed', findings: 4, actions: 6 },
  { id: 'ar-10', name: 'Environmental Compliance Audit', auditor: 'Jack Daniels', department: 'Legal', date: '2025-09-12', status: 'failed', findings: 8, actions: 14 },
]

interface MonthlyAuditData {
  month: string
  completed: number
  scheduled: number
}

const mockMonthlyData: MonthlyAuditData[] = [
  { month: 'Jan', completed: 4, scheduled: 2 },
  { month: 'Feb', completed: 3, scheduled: 3 },
  { month: 'Mar', completed: 5, scheduled: 1 },
  { month: 'Apr', completed: 2, scheduled: 4 },
  { month: 'May', completed: 6, scheduled: 2 },
  { month: 'Jun', completed: 4, scheduled: 3 },
  { month: 'Jul', completed: 7, scheduled: 1 },
  { month: 'Aug', completed: 5, scheduled: 3 },
  { month: 'Sep', completed: 3, scheduled: 4 },
  { month: 'Oct', completed: 6, scheduled: 2 },
  { month: 'Nov', completed: 4, scheduled: 3 },
  { month: 'Dec', completed: 2, scheduled: 5 },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#4CAF50'
    case 'in_progress': return '#2196F3'
    case 'scheduled': return '#9E9E9E'
    case 'failed': return '#F44336'
    default: return '#9E9E9E'
  }
}

const totalAudits = mockReports.length
const completedAudits = mockReports.filter(r => r.status === 'completed').length
const inProgressAudits = mockReports.filter(r => r.status === 'in_progress').length
const passRate = mockReports.length > 0
  ? Math.round((completedAudits / mockReports.length) * 100)
  : 0

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

const AuditReports = () => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExport = () => {
    handleMenuClose()
  }

  const statsCards = [
    {
      title: 'Total Audits',
      value: totalAudits,
      color: 'primary.main',
      icon: <AuditIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Completed',
      value: completedAudits,
      color: '#4CAF50',
      icon: <CheckIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'In Progress',
      value: inProgressAudits,
      color: '#2196F3',
      icon: <AuditIcon sx={{ color: '#2196F3', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Pass Rate',
      value: `${passRate}%`,
      color: passRate >= 60 ? '#4CAF50' : '#F44336',
      icon: <WarningIcon sx={{ color: passRate >= 60 ? '#4CAF50' : '#F44336', fontSize: 16, mr: 0.5 }} />,
    },
  ]

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Audit Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and export audit reports across departments and regulations
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* ── Stats summary ───────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: card.color }}>
                  {card.value}
                </Typography>
                {card.icon && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {card.icon}
                    <Typography variant="body2" sx={{ color: card.color, fontWeight: 600 }}>
                      {card.title === 'Total Audits'
                        ? 'All time'
                        : card.title === 'Pass Rate'
                          ? passRate >= 60 ? 'On Track' : 'Needs Improvement'
                          : ''}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Bar chart: Audits by Month ──────────────────────────── */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Audits by Month
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockMonthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 13 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E0E0E0' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => (
                  <Typography variant="body2" component="span" sx={{ color: 'text.primary' }}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </Typography>
                )}
              />
              <Bar dataKey="completed" name="Completed" fill="#4CAF50" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="scheduled" name="Scheduled" fill="#9E9E9E" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Reports table ───────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Audit Reports
            </Typography>
            <Button size="small" startIcon={<DownloadIcon />}>
              Export All
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Report Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Auditor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Findings</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">More</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {report.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{report.auditor}</Typography>
                    </TableCell>
                    <TableCell>{report.department}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(report.status)}18`,
                          color: getStatusColor(report.status),
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: report.findings > 5 ? '#F44336' : report.findings > 0 ? '#FF9800' : '#4CAF50',
                        }}
                      >
                        {report.findings}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {report.actions}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {mockReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No audit reports found. Use the date range filter and click "Export Report" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ── Row actions menu ────────────────────────────────────── */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleExport}>
          <DownloadIcon fontSize="small" sx={{ mr: 1.5 }} />
          Download PDF
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <AuditIcon fontSize="small" sx={{ mr: 1.5 }} />
          View Details
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AuditReports
