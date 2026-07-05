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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'

import { controlService, Control } from '../../services/controlService'

interface ControlForm {
  title: string
  description: string
  controlType: string
  frequency: string
  status: string
  department: string
  controlOwner: string
  designEffectiveness: string
  operationalEffectiveness: string
  automationLevel: string
  tags: string
}

const emptyForm: ControlForm = {
  title: '',
  description: '',
  controlType: '',
  frequency: 'monthly',
  status: 'draft',
  department: '',
  controlOwner: '',
  designEffectiveness: '',
  operationalEffectiveness: '',
  automationLevel: '',
  tags: '',
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return '#4CAF50'
    case 'draft': return '#FF9800'
    case 'testing': return '#2196F3'
    case 'review': return '#9C27B0'
    case 'inactive': return '#9E9E9E'
    case 'failed': return '#F44336'
    default: return '#9E9E9E'
  }
}

const getEffectivenessColor = (eff?: string) => {
  switch (eff) {
    case 'effective': return '#4CAF50'
    case 'partially_effective': return '#FF9800'
    case 'ineffective': return '#F44336'
    case 'not_designed':
    case 'not_tested': return '#9E9E9E'
    default: return '#9E9E9E'
  }
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

const getOwnerDisplay = (control: Control): string => {
  if (control.controlOwner) return control.controlOwner
  if (typeof control.owner === 'string') return control.owner
  if (control.owner && typeof control.owner === 'object') {
    const o = control.owner as any
    return `${o.firstName || ''} ${o.lastName || ''}`.trim() || String(o.id || '').substring(0, 8) || '-'
  }
  return '-'
}

const InternalControls = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingControl, setViewingControl] = useState<Control | null>(null)
  const [controls, setControls] = useState<Control[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<ControlForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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
  const testingControls = controls.filter(c => c.status === 'testing').length
  const needsReview = controls.filter(c => c.status === 'draft' || c.status === 'review').length
  const effectiveCount = controls.filter(c => c.designEffectiveness === 'effective').length
  const avgEffectiveness = controls.length > 0
    ? Math.round((effectiveCount / controls.length) * 100)
    : 0

  // Control type distribution from real data
  const typeCounts = controls.reduce<Record<string, number>>((acc, c) => {
    const key = c.controlType || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const typeLabels: Record<string, string> = {
    preventive: 'Preventive',
    detective: 'Detective',
    corrective: 'Corrective',
    directive: 'Directive',
    compensating: 'Compensating',
  }

  const typeEntries = Object.entries(typeCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      label: typeLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
      count,
    }))

  const maxTypeCount = Math.max(...typeEntries.map(e => e.count), 1)

  // Filter
  const filteredControls = searchQuery
    ? controls.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getOwnerDisplay(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : controls

  const handleOpenDialog = () => {
    setSelectedId(null)
    setFormData(emptyForm)
    setError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setError('')
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setError('Control name is required')
      return
    }
    if (!formData.controlType) {
      setError('Control type is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, any> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        controlType: formData.controlType,
        status: formData.status,
        department: formData.department || 'General',
        controlOwner: formData.controlOwner.trim() || 'Unassigned',
      }
      if (formData.frequency) payload.frequency = formData.frequency
      if (formData.designEffectiveness) payload.designEffectiveness = formData.designEffectiveness
      if (formData.operationalEffectiveness) payload.operationalEffectiveness = formData.operationalEffectiveness
      if (formData.automationLevel) payload.automationLevel = formData.automationLevel
      if (formData.tags.trim()) {
        payload.tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }

      const newControl = await controlService.createControl(payload as any)
      setControls(prev => [newControl, ...prev])
      handleCloseDialog()
      setSnackbar({ open: true, message: 'Control created successfully', severity: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create control'
      setError(message)
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedId) return
    if (!formData.title.trim()) {
      setError('Control name is required')
      return
    }
    if (!formData.controlType) {
      setError('Control type is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, any> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        controlType: formData.controlType,
        status: formData.status,
        department: formData.department || 'General',
        controlOwner: formData.controlOwner.trim() || 'Unassigned',
      }
      if (formData.frequency) payload.frequency = formData.frequency
      if (formData.designEffectiveness) payload.designEffectiveness = formData.designEffectiveness
      if (formData.operationalEffectiveness) payload.operationalEffectiveness = formData.operationalEffectiveness
      if (formData.automationLevel) payload.automationLevel = formData.automationLevel
      if (formData.tags.trim()) {
        payload.tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }

      const updated = await controlService.updateControl(selectedId, payload as any)
      setControls(prev => prev.map(c => c.id === selectedId ? updated : c))
      handleCloseDialog()
      setSnackbar({ open: true, message: 'Control updated successfully', severity: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update control'
      setError(message)
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedId(id)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedId(null)
  }

  const handleView = () => {
    const control = controls.find(c => c.id === selectedId)
    if (control) {
      setViewingControl(control)
      setOpenViewDialog(true)
    }
    handleMenuClose()
  }

  const handleEdit = () => {
    const control = controls.find(c => c.id === selectedId)
    if (control) {
      setFormData({
        title: control.title,
        description: control.description || '',
        controlType: control.controlType || '',
        frequency: control.frequency || 'monthly',
        status: control.status,
        department: control.department || '',
        controlOwner: control.controlOwner || (typeof control.owner === 'string' ? control.owner : '') || '',
        designEffectiveness: control.designEffectiveness || '',
        operationalEffectiveness: control.operationalEffectiveness || '',
        automationLevel: control.automationLevel || '',
        tags: (control.tags || []).join(', '),
      })
      setOpenDialog(true)
    }
    handleMenuClose()
  }

  const handleDelete = async () => {
    const id = selectedId
    handleMenuClose()
    if (!id) return
    try {
      await controlService.deleteControl(id)
      setControls(prev => prev.filter(c => c.id !== id))
      setSnackbar({ open: true, message: 'Control deleted successfully', severity: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete control'
      setSnackbar({ open: true, message, severity: 'error' })
    }
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
          onClick={handleOpenDialog}
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
                Design Effectiveness
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {avgEffectiveness}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: effectiveCount > 0 ? '#4CAF50' : '#9E9E9E', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: effectiveCount > 0 ? '#4CAF50' : '#9E9E9E', fontWeight: 600 }}>
                  {effectiveCount} effective
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Testing
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {testingControls}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <SettingsIcon sx={{ color: '#2196F3', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 600 }}>
                  Currently in testing
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
                  {controls.filter(c => c.status === 'failed').length} failed
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
                  <TableCell>Type</TableCell>
                  <TableCell>Design Eff.</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Tested</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredControls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((control) => (
                  <TableRow key={control.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {control.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {control.controlType || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={typeLabels[control.controlType] || control.controlType}
                        size="small"
                        sx={{
                          bgcolor: (control.controlType === 'preventive' || control.controlType === 'directive') ? '#4CAF5015' : '#2196F315',
                          color: (control.controlType === 'preventive' || control.controlType === 'directive') ? '#4CAF50' : '#2196F3',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={control.designEffectiveness || 'N/A'}
                        size="small"
                        sx={{
                          bgcolor: `${getEffectivenessColor(control.designEffectiveness)}15`,
                          color: getEffectivenessColor(control.designEffectiveness),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(control.status)}
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
                        {control.lastTestedAt ? formatDate(control.lastTestedAt) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {control.frequency ? formatStatus(control.frequency) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getOwnerDisplay(control)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, control.id)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredControls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No controls found. Click "Add Control" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
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

      {/* Control Type Distribution */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Control Type Distribution
              </Typography>
              <Box sx={{ mt: 2 }}>
                {typeEntries.length > 0 ? (
                  typeEntries.map((item) => (
                    <Box key={item.label} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.count} controls
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.count / maxTypeCount) * 100}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#E0E0E0' }}
                      />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No controls yet. Add your first control to see type distribution.
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

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Add / Edit Control Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedId ? 'Edit Control' : 'Add New Control'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Control Name"
                  placeholder="Enter control name"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  placeholder="Describe the control in detail"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Control Type</InputLabel>
                  <Select
                    value={formData.controlType}
                    label="Control Type"
                    onChange={(e) => setFormData({ ...formData, controlType: e.target.value })}
                  >
                    <MenuItem value=""><em>Select type</em></MenuItem>
                    <MenuItem value="preventive">Preventive</MenuItem>
                    <MenuItem value="detective">Detective</MenuItem>
                    <MenuItem value="corrective">Corrective</MenuItem>
                    <MenuItem value="directive">Directive</MenuItem>
                    <MenuItem value="compensating">Compensating</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.frequency}
                    label="Frequency"
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="annually">Annually</MenuItem>
                    <MenuItem value="ad_hoc">Ad Hoc</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="testing">Testing</MenuItem>
                    <MenuItem value="review">Review</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Automation Level</InputLabel>
                  <Select
                    value={formData.automationLevel}
                    label="Automation Level"
                    onChange={(e) => setFormData({ ...formData, automationLevel: e.target.value })}
                  >
                    <MenuItem value=""><em>Select</em></MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="semi_automated">Semi-Automated</MenuItem>
                    <MenuItem value="fully_automated">Fully Automated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Design Effectiveness</InputLabel>
                  <Select
                    value={formData.designEffectiveness}
                    label="Design Effectiveness"
                    onChange={(e) => setFormData({ ...formData, designEffectiveness: e.target.value })}
                  >
                    <MenuItem value=""><em>Select</em></MenuItem>
                    <MenuItem value="effective">Effective</MenuItem>
                    <MenuItem value="partially_effective">Partially Effective</MenuItem>
                    <MenuItem value="ineffective">Ineffective</MenuItem>
                    <MenuItem value="not_designed">Not Designed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Operational Effectiveness</InputLabel>
                  <Select
                    value={formData.operationalEffectiveness}
                    label="Operational Effectiveness"
                    onChange={(e) => setFormData({ ...formData, operationalEffectiveness: e.target.value })}
                  >
                    <MenuItem value=""><em>Select</em></MenuItem>
                    <MenuItem value="effective">Effective</MenuItem>
                    <MenuItem value="partially_effective">Partially Effective</MenuItem>
                    <MenuItem value="ineffective">Ineffective</MenuItem>
                    <MenuItem value="not_tested">Not Tested</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Control Owner"
                  placeholder="Enter control owner name"
                  value={formData.controlOwner}
                  onChange={(e) => setFormData({ ...formData, controlOwner: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  placeholder="e.g. Finance, IT, Operations"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags"
                  placeholder="Comma-separated tags (e.g. sox, pci, critical)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={selectedId ? handleUpdate : handleCreate}
            disabled={saving}
          >
            {saving ? 'Saving...' : selectedId ? 'Update Control' : 'Create Control'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Control Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Control Details</DialogTitle>
        <DialogContent>
          {viewingControl && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{viewingControl.title}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={typeLabels[viewingControl.controlType] || viewingControl.controlType}
                      size="small"
                      sx={{
                        bgcolor: '#2196F315',
                        color: '#2196F3',
                      }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={formatStatus(viewingControl.status)}
                      size="small"
                      sx={{ bgcolor: `${getStatusColor(viewingControl.status)}15`, color: getStatusColor(viewingControl.status), fontWeight: 600 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Frequency</Typography>
                  <Typography variant="body1">{viewingControl.frequency ? formatStatus(viewingControl.frequency) : '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Design Effectiveness</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={viewingControl.designEffectiveness || 'N/A'}
                      size="small"
                      sx={{ bgcolor: `${getEffectivenessColor(viewingControl.designEffectiveness)}15`, color: getEffectivenessColor(viewingControl.designEffectiveness) }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Operational Effectiveness</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={viewingControl.operationalEffectiveness || 'N/A'}
                      size="small"
                      sx={{ bgcolor: `${getEffectivenessColor(viewingControl.operationalEffectiveness)}15`, color: getEffectivenessColor(viewingControl.operationalEffectiveness) }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Automation Level</Typography>
                  <Typography variant="body1">{viewingControl.automationLevel ? formatStatus(viewingControl.automationLevel) : '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{viewingControl.department || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Control Owner</Typography>
                  <Typography variant="body1">{getOwnerDisplay(viewingControl)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Last Tested</Typography>
                  <Typography variant="body1">{viewingControl.lastTestedAt ? formatDate(viewingControl.lastTestedAt) : '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Next Test Date</Typography>
                  <Typography variant="body1">{viewingControl.nextTestDate ? formatDate(viewingControl.nextTestDate) : '-'}</Typography>
                </Grid>
                {viewingControl.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{viewingControl.description}</Typography>
                  </Grid>
                )}
                {viewingControl.tags && viewingControl.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Tags</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {viewingControl.tags.map((tag, i) => (
                        <Chip key={i} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
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
