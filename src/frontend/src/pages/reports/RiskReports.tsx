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
import { riskService, Risk, SEVERITY_LABELS, RISK_STATUS_MAP } from '../../services/riskService'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  Cybersecurity: '#F44336',
  Compliance: '#FF9800',
  Operational: '#2196F3',
  Financial: '#4CAF50',
  Reputational: '#9C27B0',
  Strategic: '#00BCD4',
}

const getCategoryColor = (category: string): string =>
  CATEGORY_COLORS[category] || '#607D8B'

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
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const data = await riskService.getRisks()
        setRisks(data)
      } catch {
        setRisks([])
      } finally {
        setLoading(false)
      }
    }
    fetchRisks()
  }, [])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExport = () => {
    handleMenuClose()
  }

  /* ── Computed stats ──────────────────────────────────────────── */

  const totalRisks = risks.length
  const criticalCount = risks.filter((r) => r.severity === 'critical').length
  const highCount = risks.filter((r) => r.severity === 'high').length
  const closedArchivedCount = risks.filter(
    (r) => r.status === 'closed' || r.status === 'archived',
  ).length
  const mitigationRate =
    totalRisks > 0
      ? Math.round((closedArchivedCount / totalRisks) * 100) + '%'
      : '0%'

  const statsCards = [
    {
      title: 'Total Risks',
      value: totalRisks,
      color: 'primary.main',
      icon: null,
    },
    {
      title: 'Critical Risks',
      value: criticalCount,
      color: '#B71C1C',
      icon: <WarningIcon sx={{ color: '#B71C1C', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'High Risks',
      value: highCount,
      color: '#F44336',
      icon: <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />,
    },
    {
      title: 'Mitigation Rate',
      value: mitigationRate,
      color: '#4CAF50',
      icon: null,
    },
  ]

  /* ── Computed category data for chart ────────────────────────── */

  const categoryCounts: Record<string, number> = {}
  risks.forEach((r) => {
    const cat = r.category || 'Uncategorized'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  const categoryData = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      fill: getCategoryColor(category),
    }))
    .sort((a, b) => b.count - a.count)

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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="category" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E0E0E0' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
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

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                  {risks.map((risk) => (
                    <TableRow key={risk.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {risk.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={risk.category}
                          size="small"
                          sx={{ bgcolor: `${getCategoryColor(risk.category)}18`, color: getCategoryColor(risk.category), fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {typeof risk.owner === 'object' && risk.owner
                          ? `${risk.owner.firstName} ${risk.owner.lastName}`
                          : risk.ownerId || '—'}
                      </TableCell>
                      <TableCell>
                        {risk.createdAt
                          ? new Date(risk.createdAt).toISOString().split('T')[0]
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={risk.status}
                          size="small"
                          sx={{ bgcolor: `${getStatusColor(risk.status)}18`, color: getStatusColor(risk.status), fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {risks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No risks found. Use the date range filter and click "Generate Report" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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
