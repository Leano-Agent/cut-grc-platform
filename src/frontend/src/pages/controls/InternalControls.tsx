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
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  MenuItem,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'

import { controlService, Control } from '../../services/controlService'

interface FormState {
  title: string
  description: string
  category: string
  type: string
  status: string
  effectiveness: string
  owner: string
  department: string
  notes: string
}

const initialFormState: FormState = {
  title: '',
  description: '',
  category: '',
  type: '',
  status: 'draft',
  effectiveness: 'medium',
  owner: '',
  department: '',
  notes: '',
}

const InternalControls = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [controls, setControls] = useState<Control[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState<FormState>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await controlService.getControls()
        setControls(data)
      } catch {
        // API not available
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived stats
  const totalControls = controls.length
  const activeControls = controls.filter(c => c.status === 'active').length
  const automatedControls = controls.filter(c => c.type === 'preventive').length // rough proxy
  const needsReview = controls.filter(c => c.status === 'inactive' || c.status === 'draft').length
  const avgEffectiveness = controls.length > 0
    ? Math.round(controls.reduce((sum, c) => sum + (c.effectiveness === 'high' ? 90 : c.effectiveness === 'medium' ? 70 : 40), 0) / controls.length)
    : 88

  // Category counts from real data
  const categoryCounts = controls.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1
    return acc
  }, {})

  const categoryColors: Record<string, string> = {
    security: '#F44336',
    financial: '#4CAF50',
    it: '#2196F3',
    operational: '#FF9800',
    third_party: '#9C27B0',
  }

  const categoryLabels: Record<string, string> = {
    security: 'Security',
    financial: 'Financial',
    it: 'IT',
    operational: 'Operational',
    third_party: 'Third Party',
  }

  const categoryEntries = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      category: categoryLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
      count,
      color: categoryColors[key] || '#757575',
    }))

  const maxCategoryCount = Math.max(...categoryEntries.map(e => e.count), 1)

  // Filter
  const filteredControls = searchQuery
    ? controls.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.owner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : controls

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#4CAF50'
      case 'needs review':
      case 'draft':
      case 'review': return '#FF9800'
      case 'inactive':
      case 'archived': return '#9E9E9E'
      default: return '#9E9E9E'
    }
  }

  const getEffectivenessColor = (level: number) => {
    if (level >= 90) return '#4CAF50'
    if (level >= 70) return '#FF9800'
    return '#F44336'
  }

  // Convert effectiveness string to number for display
  const getEffectivenessValue = (eff: string): number => {
    switch (eff.toLowerCase()) {
      case 'high': return 90
      case 'medium': return 70
      case 'low': return 40
      default: return 50
    }
  }

  const handleFieldChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) {
      newErrors.title = 'Control name is required'
    }
    if (!form.type) {
      newErrors.type = 'Control type is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = async () => {
    if (!validate()) return

    setSubmitting(true)
    try {
      const newControl = await controlService.createControl({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category || 'general',
        type: form.type as Control['type'],
        status: form.status as Control['status'],
        effectiveness: form.effectiveness as Control['effectiveness'],
        owner: form.owner.trim() || 'Unassigned',
        department: form.department.trim() || 'General',
        notes: form.notes.trim() || undefined,
      })
      setControls(prev => [newControl, ...prev])
      setOpenDialog(false)
      setForm(initialFormState)
      setSnackbar({ open: true, message: 'Control created successfully', severity: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create control'
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm(initialFormState)
    setErrors({})
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography>Loading controls...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Internal Controls
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Design, implement, and monitor internal control mechanisms
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Control
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Controls
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalControls}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AssignmentIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  +{activeControls} active
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Control Effectiveness
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {avgEffectiveness}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  +3%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Automated Controls
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {controls.length > 0 ? Math.round((controls.filter(c => c.type === 'preventive' || c.type === 'detective').length / controls.length) * 100) : 0}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <SettingsIcon sx={{ color: '#2196F3', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 600 }}>
                  Target: 60%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Needs Review
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {needsReview}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningIcon sx={{ color: '#FF9800', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 600 }}>
                  Overdue: {controls.filter(c => c.status === 'inactive').length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search controls..."
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
      </Box>

      {/* Controls Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Control Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Effectiveness</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Tested</TableCell>
                  <TableCell>Automated</TableCell>
                  <TableCell>Owner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredControls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((control) => (
                  <TableRow key={control.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {control.title}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Type: {control.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={control.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={control.type}
                        size="small"
                        sx={{
                          bgcolor: (control.type === 'preventive' || control.type === 'directive') ? '#4CAF5015' : '#2196F315',
                          color: (control.type === 'preventive' || control.type === 'directive') ? '#4CAF50' : '#2196F3',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getEffectivenessValue(control.effectiveness)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getEffectivenessColor(getEffectivenessValue(control.effectiveness)),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getEffectivenessColor(getEffectivenessValue(control.effectiveness)),
                            minWidth: 40,
                          }}
                        >
                          {getEffectivenessValue(control.effectiveness)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={control.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(control.status)}15`,
                          color: getStatusColor(control.status),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {control.lastTested || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={control.status === 'active'}
                            size="small"
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {control.owner}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredControls.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Control Framework */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Control Categories
              </Typography>
              <Box sx={{ mt: 2 }}>
                {categoryEntries.length > 0 ? (
                  categoryEntries.map((item) => (
                    <Box key={item.category} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{item.category}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.count} controls
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.count / maxCategoryCount) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#E0E0E0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: item.color,
                          },
                        }}
                      />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No controls yet. Add your first control to see category distribution.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Control Testing Schedule
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { period: 'This Week', count: 8, completed: 5 },
                  { period: 'This Month', count: 24, completed: 18 },
                  { period: 'Next Month', count: 32, completed: 0 },
                  { period: 'This Quarter', count: 85, completed: 24 },
                ].map((schedule) => (
                  <Box
                    key={schedule.period}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {schedule.period}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {schedule.completed}/{schedule.count} completed
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(schedule.completed / schedule.count) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Control Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Control</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Control Name"
                  placeholder="Enter control name"
                  value={form.title}
                  onChange={handleFieldChange('title')}
                  error={!!errors.title}
                  helperText={errors.title}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  placeholder="Describe the control in detail"
                  value={form.description}
                  onChange={handleFieldChange('description')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  select
                  value={form.category}
                  onChange={handleFieldChange('category')}
                >
                  <MenuItem value="">Select category</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="financial">Financial</MenuItem>
                  <MenuItem value="it">IT</MenuItem>
                  <MenuItem value="operational">Operational</MenuItem>
                  <MenuItem value="third_party">Third Party</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Control Type"
                  select
                  value={form.type}
                  onChange={handleFieldChange('type')}
                  error={!!errors.type}
                  helperText={errors.type}
                >
                  <MenuItem value="">Select type</MenuItem>
                  <MenuItem value="preventive">Preventive</MenuItem>
                  <MenuItem value="detective">Detective</MenuItem>
                  <MenuItem value="corrective">Corrective</MenuItem>
                  <MenuItem value="directive">Directive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Status"
                  select
                  value={form.status}
                  onChange={handleFieldChange('status')}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Effectiveness"
                  select
                  value={form.effectiveness}
                  onChange={handleFieldChange('effectiveness')}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="not_rated">Not Rated</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner"
                  placeholder="Enter control owner"
                  value={form.owner}
                  onChange={handleFieldChange('owner')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  placeholder="Enter department"
                  value={form.department}
                  onChange={handleFieldChange('department')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  placeholder="Additional notes"
                  value={form.notes}
                  onChange={handleFieldChange('notes')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Control'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default InternalControls
