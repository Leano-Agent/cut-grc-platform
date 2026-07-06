import { useState, useEffect } from 'react'
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
  CircularProgress,
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
import { complianceService, ComplianceItem } from '../../services/complianceService'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant': return '#4CAF50'
    case 'non_compliant': return '#F44336'
    case 'partial': return '#FF9800'
    case 'not_assessed': return '#9E9E9E'
    case 'under_review': return '#2196F3'
    default: return '#9E9E9E'
  }
}

const statusDisplayName = (status: string) => {
  switch (status) {
    case 'compliant': return 'Compliant'
    case 'non_compliant': return 'Non-Compliant'
    case 'partial': return 'Partial'
    case 'not_assessed': return 'Not Assessed'
    case 'under_review': return 'Under Review'
    default: return status.replace('_', ' ')
  }
}

const distributionColors: Record<string, string> = {
  compliant: '#4CAF50',
  non_compliant: '#F44336',
  partial: '#FF9800',
  not_assessed: '#9E9E9E',
  under_review: '#2196F3',
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

const ComplianceReports = () => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const data = await complianceService.getComplianceItems()
        if (!cancelled) setItems(data || [])
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const totalOverdue = items.filter(r => r.status === 'non_compliant').length
  const totalPassing = items.filter(r => r.status === 'compliant').length
  const totalNonCompliant = items.filter(r => r.status === 'non_compliant').length
  const overallRate = items.length > 0
    ? Math.round((totalPassing / items.length) * 100)
    : 0

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExport = () => {
    handleMenuClose()
  }

  /* Build distribution data from real items */
  const statusCounts: Record<string, number> = {}
  for (const item of items) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  }
  const distribution = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusDisplayName(status),
    value: count,
    color: distributionColors[status] || '#9E9E9E',
  }))

  const statsCards = [
    {
      title: 'Overall Compliance Rate',
      value: loading ? '...' : `${overallRate}%`,
      color: 'primary.main',
      icon: null,
    },
    {
      title: 'Overdue Items',
      value: loading ? '...' : totalOverdue,
      color: '#F44336',
      icon: <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Passing Items',
      value: loading ? '...' : totalPassing,
      color: '#4CAF50',
      icon: <CheckIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Non-Compliant',
      value: loading ? '...' : totalNonCompliant,
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
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 700, color: card.color }}>
                    {card.value}
                  </Typography>
                )}
                {card.icon && !loading && (
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {distribution.map((entry, index) => (
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
          )}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No compliance reports found. Use the date range filter and click "Export Report" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GavelIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                          <Typography variant="body2">{item.regulationSource || 'N/A'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{item.department || item.category || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusDisplayName(item.status)}
                          size="small"
                          sx={{
                            bgcolor: `${getStatusColor(item.status)}18`,
                            color: getStatusColor(item.status),
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {item.createdAt
                          ? new Date(item.createdAt).toISOString().split('T')[0]
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
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
