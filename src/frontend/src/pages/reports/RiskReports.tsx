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
  PictureAsPdf as PdfIcon,
  Assessment as AssessmentIcon,
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
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface RiskReport {
  id: string
  name: string
  type: 'Quarterly' | 'Monthly' | 'Annual' | 'Ad-hoc'
  generatedBy: string
  date: string
  status: 'completed' | 'pending' | 'failed'
}

const mockReports: RiskReport[] = [
  { id: 'rpt-1', name: 'Q3 2025 Risk Assessment', type: 'Quarterly', generatedBy: 'Alice Chen', date: '2025-10-01', status: 'completed' },
  { id: 'rpt-2', name: 'Cybersecurity Risk Review', type: 'Monthly', generatedBy: 'Bob Martinez', date: '2025-09-28', status: 'completed' },
  { id: 'rpt-3', name: 'Annual Enterprise Risk Report', type: 'Annual', generatedBy: 'Carol Wu', date: '2025-09-15', status: 'pending' },
  { id: 'rpt-4', name: 'Vendor Risk Assessment', type: 'Ad-hoc', generatedBy: 'David Kim', date: '2025-09-10', status: 'completed' },
  { id: 'rpt-5', name: 'Compliance Gap Analysis', type: 'Monthly', generatedBy: 'Eve Johnson', date: '2025-09-05', status: 'failed' },
  { id: 'rpt-6', name: 'Q4 Risk Forecast', type: 'Quarterly', generatedBy: 'Alice Chen', date: '2025-10-15', status: 'pending' },
  { id: 'rpt-7', name: 'Operational Risk Dashboard', type: 'Monthly', generatedBy: 'Frank Lee', date: '2025-08-28', status: 'completed' },
  { id: 'rpt-8', name: 'Strategic Risk Overview', type: 'Annual', generatedBy: 'Grace Patel', date: '2025-08-20', status: 'completed' },
]

interface RiskByCategory {
  category: string
  count: number
  fill: string
}

const mockCategoryData: RiskByCategory[] = [
  { category: 'Cybersecurity', count: 42, fill: '#F44336' },
  { category: 'Compliance', count: 28, fill: '#FF9800' },
  { category: 'Operational', count: 35, fill: '#2196F3' },
  { category: 'Financial', count: 18, fill: '#4CAF50' },
  { category: 'Reputational', count: 12, fill: '#9C27B0' },
  { category: 'Strategic', count: 22, fill: '#00BCD4' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#4CAF50'
    case 'pending': return '#FF9800'
    case 'failed': return '#F44336'
    default: return '#9E9E9E'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Quarterly': return '#1565C0'
    case 'Monthly': return '#6A1B9A'
    case 'Annual': return '#2E7D32'
    case 'Ad-hoc': return '#E65100'
    default: return '#546E7A'
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

const RiskReports = () => {
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
      title: 'Total Risks',
      value: 157,
      color: 'primary.main',
      icon: null,
    },
    {
      title: 'Critical Risks',
      value: 12,
      color: '#B71C1C',
      icon: <WarningIcon sx={{ color: '#B71C1C', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'High Risks',
      value: 28,
      color: '#F44336',
      icon: <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Mitigation Rate',
      value: '74%',
      color: '#4CAF50',
      icon: null,
    },
  ]

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Risk Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and export risk reports across the organization
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
          <Button variant="contained" startIcon={<AssessmentIcon />}>
            Generate Report
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
                      Requires Immediate Action
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Bar chart: Risks by Category ────────────────────────── */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Risks by Category
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockCategoryData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="category" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 13 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E0E0E0' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Reports table ───────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Risk Reports
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
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Generated By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
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
                      <Chip
                        label={report.type}
                        size="small"
                        sx={{ bgcolor: `${getTypeColor(report.type)}18`, color: getTypeColor(report.type), fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{report.generatedBy}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        size="small"
                        sx={{ bgcolor: `${getStatusColor(report.status)}18`, color: getStatusColor(report.status), fontWeight: 600, textTransform: 'capitalize' }}
                      />
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
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No reports found. Use the date range filter and click "Generate Report" to create one.
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
          <PdfIcon fontSize="small" sx={{ mr: 1.5 }} />
          Preview
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default RiskReports
