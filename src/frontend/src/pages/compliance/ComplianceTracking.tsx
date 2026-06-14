import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  LinearProgress,
  Avatar,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'

import { complianceService, ComplianceItem } from '../../services/complianceService'

const ComplianceTracking = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await complianceService.getComplianceItems()
        setItems(data)
      } catch {
        // API not available
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  // Mock data for fallback display
  const [filteredItems, setFilteredItems] = useState<ComplianceItem[]>([])
  
  useEffect(() => {
    const filtered = searchQuery
      ? items.filter(i =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.regulation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.owner.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items
    setFilteredItems(filtered)
  }, [items, searchQuery])

  const displayItems = items.length > 0 ? (searchQuery ? filteredItems : items) : []

  // Stats derived from actual data
  const totalItems = displayItems.length
  const compliantCount = displayItems.filter(i => i.status === 'compliant').length
  const nonCompliantCount = displayItems.filter(i => i.status === 'non_compliant').length
  const overallRate = totalItems > 0 ? Math.round((compliantCount / totalItems) * 100) : 85

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant': return '#4CAF50'
      case 'non_compliant': return '#F44336'
      case 'in_progress':
      case 'partial': return '#FF9800'
      case 'pending_review': return '#2196F3'
      default: return '#9E9E9E'
    }
  }

  const getComplianceColor = (level: number) => {
    if (level >= 90) return '#4CAF50'
    if (level >= 70) return '#FF9800'
    return '#F44336'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography>Loading compliance data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Compliance Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage regulatory compliance requirements
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add Requirement
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Compliance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {overallRate}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  +5%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Compliant Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {compliantCount}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  65% of total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Non-Compliant
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                8
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 600 }}>
                  Requires Attention
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upcoming Deadlines
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                12
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <ScheduleIcon sx={{ color: '#FF9800', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 600 }}>
                  Next 30 days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search compliance items..."
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <IconButton>
          <FilterIcon />
        </IconButton>
      </Box>

      {/* Compliance Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Regulation</TableCell>
                  <TableCell>Requirement</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Compliance Level</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Last Audit</TableCell>
                  <TableCell>Owner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complianceItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GavelIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.regulation}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.requirement}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(item.status)}15`,
                          color: getStatusColor(item.status),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={item.complianceLevel}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getComplianceColor(item.complianceLevel),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getComplianceColor(item.complianceLevel),
                            minWidth: 40,
                          }}
                        >
                          {item.complianceLevel}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.dueDate}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.dueDate) > new Date() ? 'Due' : 'Overdue'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.lastAudit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {item.owner.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2">
                          {item.owner}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={complianceItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Regulation Overview */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Regulation Coverage
              </Typography>
              <Box sx={{ mt: 2 }}>
                {['POPIA', 'FICA', 'GDPR', 'ISO 27001', 'King IV'].map((regulation) => (
                  <Box key={regulation} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{regulation}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {Math.floor(Math.random() * 30) + 70}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.floor(Math.random() * 30) + 70}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Audit Findings
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { finding: 'Data encryption not implemented', severity: 'High', date: '2024-03-15' },
                  { finding: 'Access logs incomplete', severity: 'Medium', date: '2024-03-10' },
                  { finding: 'Policy documentation outdated', severity: 'Low', date: '2024-03-05' },
                  { finding: 'Training records missing', severity: 'Medium', date: '2024-02-28' },
                ].map((finding, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: finding.severity === 'High' ? '#F4433610' : 
                               finding.severity === 'Medium' ? '#FF980010' : '#4CAF5010',
                      borderLeft: `4px solid ${
                        finding.severity === 'High' ? '#F44336' : 
                        finding.severity === 'Medium' ? '#FF9800' : '#4CAF50'
                      }`,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {finding.finding}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip
                        label={finding.severity}
                        size="small"
                        sx={{
                          bgcolor: finding.severity === 'High' ? '#F4433615' : 
                                   finding.severity === 'Medium' ? '#FF980015' : '#4CAF5015',
                          color: finding.severity === 'High' ? '#F44336' : 
                                 finding.severity === 'Medium' ? '#FF9800' : '#4CAF50',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {finding.date}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ComplianceTracking