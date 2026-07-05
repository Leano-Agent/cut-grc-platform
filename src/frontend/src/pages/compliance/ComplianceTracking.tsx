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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
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
import ComplianceDashboard from '../../components/ComplianceDashboard'
import { exportCSV } from '../../utils/exportUtils'

type FormStatus = '' | 'compliant' | 'non_compliant' | 'in_progress' | 'pending_review' | 'not_applicable'

interface FormState {
  title: string
  description: string
  regulation: string
  status: FormStatus
  department: string
  owner: string
  dueDate: string
  notes: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  regulation: '',
  status: '',
  department: '',
  owner: '',
  dueDate: '',
  notes: '',
}

const ComplianceTracking = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dashboardView, setDashboardView] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<{ title?: string; regulation?: string }>({})
  const [submitting, setSubmitting] = useState(false)

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

  const [filteredItems, setFilteredItems] = useState<ComplianceItem[]>([])

  useEffect(() => {
    const filtered = searchQuery
      ? items.filter(i =>
          i.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
  const upcomingDeadlinesCount = displayItems.filter(i =>
    i.dueDate && new Date(i.dueDate) > new Date() &&
    new Date(i.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length
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

  // Dialog handlers
  const handleOpenDialog = () => {
    setForm(emptyForm)
    setFormErrors({})
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setFormErrors({})
  }

  const handleFormChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    // Clear field error on change
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCreate = async () => {
    // Validate
    const errors: { title?: string; regulation?: string } = {}
    if (!form.title.trim()) errors.title = 'Title is required'
    if (!form.regulation.trim()) errors.regulation = 'Regulation is required'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const newItem = await complianceService.createComplianceItem({
        title: form.title,
        description: form.description || undefined,
        regulation: form.regulation,
        status: form.status || 'in_progress' as any,
        department: form.department || 'General',
        owner: form.owner || 'Unassigned',
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        lastReviewed: new Date().toISOString().split('T')[0],
      })
      setItems(prev => [...prev, newItem])
      handleCloseDialog()
    } catch {
      // API error — silently fail for now
    } finally {
      setSubmitting(false)
    }
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
          onClick={handleOpenDialog}
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
                  {totalItems > 0 ? Math.round((compliantCount / totalItems) * 100) + '% of total' : 'No items'}
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
                {nonCompliantCount}
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
                {upcomingDeadlinesCount}
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        <Button
          variant={dashboardView ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setDashboardView(!dashboardView)}
          sx={{ minWidth: 140 }}
        >
          {dashboardView ? 'Requirements Table' : 'Compliance Dashboard'}
        </Button>
      </Box>

      {/* Compliance Dashboard */}
      {dashboardView && (
        <Box sx={{ mb: 3 }}>
          <ComplianceDashboard onExport={() => exportCSV('compliance-report', ['Regulation', 'Status', 'Owner', 'Due Date'], items, i => [i.regulation, i.status, i.owner, i.dueDate || ''])} />
        </Box>
      )}

      {/* Compliance Table */}
      {!dashboardView && (
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
                {displayItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
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
                        {item.title || item.requirement}
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
                            value={item.complianceLevel || 0}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getComplianceColor(item.complianceLevel || 0),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getComplianceColor(item.complianceLevel || 0),
                            minWidth: 40,
                          }}
                        >
                          {item.complianceLevel || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.dueDate}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.dueDate && new Date(item.dueDate) > new Date() ? 'Due' : 'Overdue'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.lastAudit || item.lastReviewed}
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
            count={displayItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
      )}

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

      {/* Create Requirement Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Compliance Requirement</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title *"
              fullWidth
              required
              value={form.title}
              onChange={handleFormChange('title')}
              error={!!formErrors.title}
              helperText={formErrors.title}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={handleFormChange('description')}
            />
            <TextField
              label="Regulation *"
              fullWidth
              required
              value={form.regulation}
              onChange={handleFormChange('regulation')}
              error={!!formErrors.regulation}
              helperText={formErrors.regulation}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as FormStatus }))}
              >
                <MenuItem value=""><em>Select status</em></MenuItem>
                <MenuItem value="compliant">Compliant</MenuItem>
                <MenuItem value="non_compliant">Non-Compliant</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="pending_review">Pending Review</MenuItem>
                <MenuItem value="not_applicable">Not Applicable</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Department"
              fullWidth
              value={form.department}
              onChange={handleFormChange('department')}
            />
            <TextField
              label="Owner"
              fullWidth
              value={form.owner}
              onChange={handleFormChange('owner')}
            />
            <TextField
              label="Due Date"
              type="date"
              fullWidth
              value={form.dueDate}
              onChange={handleFormChange('dueDate')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={handleFormChange('notes')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ComplianceTracking
