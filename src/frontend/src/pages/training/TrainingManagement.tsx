import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Tooltip,
  FormControl,
  InputLabel,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Archive as ArchiveIcon,
  PlayArrow as PlayArrowIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import trainingService, { Training, TrainingStats, TrainingFormData, EnrolledUser } from '../../services/trainingService'

const statusConfig: Record<string, { label: string; color: 'default' | 'success' | 'error' | 'warning' | 'info' }> = {
  draft: { label: 'Draft', color: 'default' },
  active: { label: 'Active', color: 'success' },
  expired: { label: 'Expired', color: 'error' },
  archived: { label: 'Archived', color: 'default' },
}

const typeConfig: Record<string, { label: string; color: 'info' | 'primary' | 'secondary' | 'warning' }> = {
  mandatory: { label: 'Mandatory', color: 'info' },
  elective: { label: 'Elective', color: 'primary' },
  certification: { label: 'Certification', color: 'secondary' },
  awareness: { label: 'Awareness', color: 'warning' },
}

const categoryLabels: Record<string, string> = {
  compliance: 'Compliance',
  security: 'Security',
  popia: 'POPIA',
  risk: 'Risk Management',
  governance: 'Governance',
  onboarding: 'Onboarding',
  other: 'Other',
}

const emptyForm: TrainingFormData = {
  title: '',
  description: '',
  type: 'mandatory',
  category: 'other',
  department: '',
  assignedTo: [],
  dueDate: '',
  expiryDate: '',
  modules: [],
  tags: [],
}

const TrainingManagement = () => {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)
  const [formData, setFormData] = useState<TrainingFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [enrollUserId, setEnrollUserId] = useState('')
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [completeUserId, setCompleteUserId] = useState('')
  const [completeScore, setCompleteScore] = useState<number>(100)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const fetchTrainings = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterCategory) filters.category = filterCategory
      if (filterStatus) filters.status = filterStatus
      if (searchQuery) filters.search = searchQuery

      const data = await trainingService.getAll(filters)
      setTrainings(data)

      const statsData = await trainingService.getStats()
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch training programmes:', err)
      setSnackbar({ open: true, message: 'Failed to load training programmes', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus, searchQuery])

  useEffect(() => {
    fetchTrainings()
  }, [fetchTrainings])

  const handleCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleEdit = (training: Training) => {
    setEditingId(training.id)
    setFormData({
      title: training.title,
      description: training.description || '',
      type: training.type,
      category: training.category,
      department: training.department || '',
      assignedTo: training.assignedTo || [],
      dueDate: training.dueDate || '',
      expiryDate: training.expiryDate || '',
      modules: training.modules || [],
      tags: training.tags || [],
    })
    setDialogOpen(true)
  }

  const handleView = (training: Training) => {
    setSelectedTraining(training)
    setDetailDialogOpen(true)
  }

  const handleOpenEnroll = (training: Training) => {
    setSelectedTraining(training)
    setEnrollUserId('')
    setEnrollDialogOpen(true)
  }

  const handleEnroll = async () => {
    if (!selectedTraining || !enrollUserId.trim()) {
      setSnackbar({ open: true, message: 'User ID is required', severity: 'error' })
      return
    }
    try {
      await trainingService.enrollUser(selectedTraining.id, enrollUserId.trim())
      setSnackbar({ open: true, message: 'User enrolled successfully', severity: 'success' })
      setEnrollDialogOpen(false)
      fetchTrainings()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to enroll user', severity: 'error' })
    }
  }

  const handleOpenComplete = (training: Training, userId: string) => {
    setSelectedTraining(training)
    setCompleteUserId(userId)
    setCompleteScore(100)
    setCompleteDialogOpen(true)
  }

  const handleComplete = async () => {
    if (!selectedTraining) return
    try {
      await trainingService.completeUser(selectedTraining.id, completeUserId, { score: completeScore, status: 'completed' })
      setSnackbar({ open: true, message: 'User completion recorded successfully', severity: 'success' })
      setCompleteDialogOpen(false)
      fetchTrainings()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to record completion', severity: 'error' })
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await trainingService.updateStatus(id, newStatus)
      setSnackbar({ open: true, message: `Training status updated to "${newStatus}"`, severity: 'success' })
      fetchTrainings()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update training status', severity: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await trainingService.delete(id)
      setSnackbar({ open: true, message: 'Training programme archived successfully', severity: 'success' })
      fetchTrainings()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to archive training programme', severity: 'error' })
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setSnackbar({ open: true, message: 'Training title is required', severity: 'error' })
      return
    }

    try {
      if (editingId) {
        await trainingService.update(editingId, formData)
        setSnackbar({ open: true, message: 'Training programme updated successfully', severity: 'success' })
      } else {
        await trainingService.create(formData)
        setSnackbar({ open: true, message: 'Training programme created successfully', severity: 'success' })
      }
      setDialogOpen(false)
      fetchTrainings()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save training programme', severity: 'error' })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusChip = (status: string) => {
    const config = statusConfig[status] || { label: status, color: 'default' as const }
    return <Chip size="small" label={config.label} color={config.color} variant="outlined" />
  }

  const getTypeChip = (type: string) => {
    const config = typeConfig[type] || { label: type, color: 'default' as const }
    return <Chip size="small" label={config.label} color={config.color} variant="filled" />
  }

  const getCategoryChip = (category: string) => {
    return <Chip size="small" label={categoryLabels[category] || category} variant="filled" />
  }

  const getUserStatusChip = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'info' | 'default' | 'error'> = {
      completed: 'success',
      in_progress: 'info',
      pending: 'warning',
      expired: 'error',
    }
    const labels: Record<string, string> = {
      completed: 'Completed',
      in_progress: 'In Progress',
      pending: 'Pending',
      expired: 'Expired',
    }
    return <Chip size="small" label={labels[status] || status} color={colors[status] || 'default'} variant="outlined" />
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Training & Awareness
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage training programmes, track enrolments, and monitor completion rates across the organisation.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Programmes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats?.active || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {stats?.completionRate || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats?.totalEnrolled || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Enrolled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats?.overdue || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Overdue</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters & Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search training programmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {trainingService.categories.map(c => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {trainingService.statuses.map(s => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { setFilterCategory(''); setFilterStatus(''); setSearchQuery('') }}
            >
              Clear
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              New Programme
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Training Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Completion</strong></TableCell>
              <TableCell><strong>Due Date</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading training programmes...' : 'No training programmes found. Create your first programme!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trainings.map((training) => (
                <TableRow key={training.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {training.title}
                        </Typography>
                        {training.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {training.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getTypeChip(training.type)}</TableCell>
                  <TableCell>{getCategoryChip(training.category)}</TableCell>
                  <TableCell>{getStatusChip(training.status)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{training.department || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={training.completionRate}
                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" fontWeight={600}>
                        {training.completionRate}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(training.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => handleView(training)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(training)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Enroll user">
                      <IconButton size="small" onClick={() => handleOpenEnroll(training)} color="primary">
                        <PersonIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {training.status === 'draft' && (
                      <Tooltip title="Activate">
                        <IconButton size="small" onClick={() => handleStatusChange(training.id, 'active')} color="success">
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Archive">
                      <IconButton size="small" onClick={() => handleDelete(training.id)} color="error">
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Training Programme' : 'Create New Training Programme'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Training Title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. POPIA Compliance Training"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {trainingService.types.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {trainingService.categories.map(c => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. All Departments, IT, HR"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={(formData.tags || []).join(', ')}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="e.g. popia, compliance, mandatory"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={formData.expiryDate || ''}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingId ? 'Update Programme' : 'Create Programme'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{selectedTraining?.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedTraining && getTypeChip(selectedTraining.type)} · Created {formatDate(selectedTraining?.createdAt || null)}
              </Typography>
            </Box>
            {selectedTraining && getStatusChip(selectedTraining.status)}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTraining && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedTraining.description || 'No description provided.'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body2">{categoryLabels[selectedTraining.category] || selectedTraining.category}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body2">{selectedTraining.department || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                <Typography variant="body2">{formatDate(selectedTraining.dueDate)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                <Typography variant="body2">{formatDate(selectedTraining.expiryDate)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Completion Rate</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedTraining.completionRate}
                    sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" fontWeight={700}>
                    {selectedTraining.completionRate}%
                  </Typography>
                </Box>
              </Grid>

              {/* Modules */}
              {selectedTraining.modules && selectedTraining.modules.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Modules ({selectedTraining.modules.length})
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <List dense>
                      {selectedTraining.modules
                        .sort((a, b) => a.order - b.order)
                        .map((mod, idx) => (
                          <ListItem key={idx}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                                {mod.order}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={mod.title}
                              secondary={`${mod.type} · ${mod.duration} min`}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Paper>
                </Grid>
              )}

              {/* Enrolled Users */}
              {selectedTraining.enrolledUsers && selectedTraining.enrolledUsers.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Enrolled Users ({selectedTraining.enrolledUsers.length})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>User ID</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Score</strong></TableCell>
                          <TableCell><strong>Enrolled At</strong></TableCell>
                          <TableCell><strong>Completed At</strong></TableCell>
                          <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedTraining.enrolledUsers.map((eu) => (
                          <TableRow key={eu.userId}>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                                {eu.userId}
                              </Typography>
                            </TableCell>
                            <TableCell>{getUserStatusChip(eu.status)}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {eu.score !== null ? `${eu.score}%` : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{formatDate(eu.enrolledAt)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{formatDate(eu.completedAt)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              {eu.status !== 'completed' && (
                                <Tooltip title="Mark as completed">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleOpenComplete(selectedTraining, eu.userId)}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {selectedTraining.tags && selectedTraining.tags.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedTraining.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedTraining && (selectedTraining.status === 'draft') && (
            <>
              <Button
                variant="outlined"
                size="small"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  handleStatusChange(selectedTraining.id, 'active')
                  setDetailDialogOpen(false)
                }}
              >
                Activate
              </Button>
            </>
          )}
          {selectedTraining && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailDialogOpen(false)
                handleEdit(selectedTraining)
              }}
            >
              Edit
            </Button>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enroll User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="User ID"
              value={enrollUserId}
              onChange={(e) => setEnrollUserId(e.target.value)}
              placeholder="e.g. user_4"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEnroll}>Enroll</Button>
        </DialogActions>
      </Dialog>

      {/* Complete User Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Mark User Completed</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              User: <strong>{completeUserId}</strong>
            </Typography>
            <TextField
              fullWidth
              label="Score (%)"
              type="number"
              value={completeScore}
              onChange={(e) => setCompleteScore(Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleComplete}>
            Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TrainingManagement
