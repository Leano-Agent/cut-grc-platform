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
  Gavel as GavelIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface ComplianceReport {
  id: string
  name: string
  regulation: string
  period: string
  status: 'compliant' | 'non_compliant' | 'pending'
  generated: string
}

const mockReports: ComplianceReport[] = [
  { id: 'cr-1', name: 'Q3 2025 POPIA Compliance Report', regulation: 'POPIA', period: 'Q3 2025', status: 'compliant', generated: '2025-10-02' },
  { id: 'cr-2', name: 'FICA Regulatory Review - September', regulation: 'FICA', period: 'Sep 2025', status: 'compliant', generated: '2025-09-28' },
  { id: 'cr-3', name: 'GDPR Data Protection Assessment', regulation: 'GDPR', period: 'Q3 2025', status: 'non_compliant', generated: '2025-09-20' },
  { id: 'cr-4', name: 'ISO 27001 Compliance Audit', regulation: 'ISO 27001', period: 'Annual 2025', status: 'pending', generated: '2025-09-15' },
  { id: 'cr-5', name: 'King IV Governance Report', regulation: 'King IV', period: 'H1 2025', status: 'compliant', generated: '2025-08-30' },
  { id: 'cr-6', name: 'CCPA Readiness Assessment', regulation: 'CCPA', period: 'Q3 2025', status: 'non_compliant', generated: '2025-08-25' },
  { id: 'cr-7', name: 'SOX Internal Controls Review', regulation: 'SOX', period: 'FY 2025', status: 'pending', generated: '2025-08-18' },
  { id: 'cr-8', name: 'PCI DSS Compliance Scan', regulation: 'PCI DSS', period: 'Jul 2025', status: 'compliant', generated: '2025-07-30' },
]

interface ComplianceDistribution {
  name: string
  value: number
  color: string
}

const mockDistribution: ComplianceDistribution[] = [
  { name: 'Compliant', value: 4, color: '#4CAF50' },
  { name: 'Non-Compliant', value: 2, color: '#F44336' },
  { name: 'Pending', value: 2, color: '#FF9800' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant': return '#4CAF50'
    case 'non_compliant': return '#F44336'
    case 'pending': return '#FF9800'
    default: return '#9E9E9E'
  }
}

const totalOverdue = mockReports.filter(r => r.status === 'non_compliant').length
const totalPassing = mockReports.filter(r => r.status === 'compliant').length
const totalNonCompliant = mockReports.filter(r => r.status === 'non_compliant').length
const overallRate = mockReports.length > 0
  ? Math.round((totalPassing / mockReports.length) * 100)
  : 0

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

const ComplianceReports = () => {
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
      title: 'Overall Compliance Rate',
      value: `${overallRate}%`,
      color: 'primary.main',
      icon: null,
    },
    {
      title: 'Overdue Items',
      value: totalOverdue,
      color: '#F44336',
      icon: <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Passing Items',
      value: totalPassing,
      color: '#4CAF50',
      icon: <CheckIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Non-Compliant',
      value: totalNonCompliant,
      color: '#F44336',
      icon: <GavelIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />,
    },
  ]

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Compliance Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and export compliance reports across regulations and standards
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
                      {card.title === 'Overdue Items' || card.title === 'Non-Compliant'
                        ? 'Requires Attention'
                        : 'On Track'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Donut / Pie Chart: Compliance Status Distribution ──────── */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Compliance Status Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockDistribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                dataKey="value"
                paddingAngle={3}
              >
                {mockDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E0E0E0' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <Typography variant="body2" component="span" sx={{ color: 'text.primary' }}>
                    {value}
                  </Typography>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Reports table ───────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Compliance Reports
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
                  <TableCell sx={{ fontWeight: 600 }}>Regulation</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Generated</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GavelIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                        <Typography variant="body2">{report.regulation}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{report.period}</TableCell>
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
                    <TableCell>{report.generated}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {mockReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No compliance reports found. Use the date range filter and click "Export Report" to create one.
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
          <GavelIcon fontSize="small" sx={{ mr: 1.5 }} />
          View Details
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default ComplianceReports
