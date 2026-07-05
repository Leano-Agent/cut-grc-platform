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
  Avatar,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { auditService, Audit } from '../../services/auditService'

interface AuditForm {
  title: string
  description: string
  type: string
  status: string
  priority: string
  scope: string
  department: string
  auditor: string
  auditee: string
  scheduledStart: string
  scheduledEnd: string
}

const emptyForm: AuditForm = {
  title: '',
  description: '',
  type: '',
  status: 'planned',
  priority: 'medium',
  scope: '',
  department: '',
  auditor: '',
  auditee: '',
  scheduledStart: '',
  scheduledEnd: '',
}

const getStatusColor = (s: string) => {
  switch (s.toLowerCase()) {
    case 'completed': return '#4CAF50'
    case 'in_progress': return '#2196F3'
    case 'planned': return '#FF9800'
    case 'overdue': return '#F44336'
    case 'cancelled': return '#9E9E9E'
    default: return '#9E9E9E'
  }
}

const getTypeColor = (t: string) => {
  switch (t.toLowerCase()) {
    case 'internal': return '#4CAF50'
    case 'external': return '#2196F3'
    case 'compliance':
    case 'financial': return '#9C27B0'
    case 'operational': return '#FF9800'
    default: return '#9E9E9E'
  }
}

const getPriorityColor = (p: string) => {
  switch (p.toLowerCase()) {
    case 'critical': return '#B71C1C'
    case 'high': return '#F44336'
    case 'medium': return '#FF9800'
    case 'low': return '#4CAF50'
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

const AuditManagement = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingAudit, setViewingAudit] = useState<Audit | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<AuditForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await auditService.getAudits()
        setAudits(data)
      } catch { /* API not available */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  // Derived stats
  const activeAudits = audits.filter(a => a.status === 'in_progress').length
  const totalFindings = audits.reduce((sum, a) => sum + (a.findings || 0), 0)
  const completedAudits = audits.filter(a => a.status === 'completed').length
  const completionRate = audits.length > 0 ? Math.round((completedAudits / audits.length) * 100) : 0
  const upcomingAudits = audits.filter(a => a.status === 'planned').length
  const overdueAudits = audits.filter(a => a.status === 'overdue').length

  const progressValue = (a: Audit): number =>
    a.status === 'completed' ? 100 : a.status === 'in_progress' ? 65 : a.status === 'overdue' ? 75 : 0

  const filteredAudits = searchQuery
    ? audits.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.auditor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.scope.toLowerCase().includes(searchQuery.toLowerCase()))
    : audits

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
      setError('Audit title is required')
      return
    }
    if (!formData.type) {
      setError('Audit type is required')
      return
    }
    if (!formData.scope.trim()) {
      setError('Audit scope is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const newAudit = await auditService.createAudit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type as Audit['type'],
        status: formData.status as Audit['status'],
        priority: formData.priority as Audit['priority'],
        scope: formData.scope.trim(),
        department: formData.department.trim() || 'General',
        auditor: formData.auditor.trim() || 'Unassigned',
        auditee: formData.auditee.trim() || 'Unassigned',
        scheduledStart: formData.scheduledStart,
        scheduledEnd: formData.scheduledEnd,
      })
      setAudits(prev => [newAudit, ...prev])
      handleCloseDialog()
      setSnackbar({ open: true, message: 'Audit created successfully', severity: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create audit'
      setError(message)
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedId) return
    if (!formData.title.trim()) {
      setError('Audit title is required')
      return
    }
    if (!formData.type) {
      setError('Audit type is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await auditService.updateAudit(selectedId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type as Audit['type'],
        status: formData.status as Audit['status'],
        priority: formData.priority as Audit['priority'],
        scope: formData.scope.trim(),
        department: formData.department.trim(),
        auditor: formData.auditor.trim(),
        auditee: formData.auditee.trim(),
        scheduledStart: formData.scheduledStart,
        scheduledEnd: formData.scheduledEnd,
      })
      setAudits(prev => prev.map(a => a.id === selectedId ? updated : a))
      handleCloseDialog()
      setSnackbar({ open: true, message: 'Audit updated successfully', severity: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update audit'
      setError(message)
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10))
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
    const audit = audits.find(a => a.id === selectedId)
    if (audit) {
      setViewingAudit(audit)
      setOpenViewDialog(true)
    }
    handleMenuClose()
  }

  const handleEdit = () => {
    const audit = audits.find(a => a.id === selectedId)
    if (audit) {
      setFormData({
        title: audit.title,
        description: audit.description || '',
        type: audit.type,
        status: audit.status,
        priority: audit.priority,
        scope: audit.scope,
        department: audit.department,
        auditor: audit.auditor,
        auditee: audit.auditee,
        scheduledStart: audit.scheduledStart,
        scheduledEnd: audit.scheduledEnd,
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
      await auditService.deleteAudit(id)
      setAudits(prev => prev.filter(a => a.id !== id))
      setSnackbar({ open: true, message: 'Audit deleted successfully', severity: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete audit'
      setSnackbar({ open: true, message, severity: 'error' })
    }
  }

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', py:8 }}><Typography>Loading audits...</Typography></Box>

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight:700, mb:1 }}>Audit Management</Typography>
          <Typography variant="body1" color="text.secondary">Plan, execute, and track audit activities</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>Schedule Audit</Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb:4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Active Audits</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{activeAudits}</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <VerifiedUserIcon sx={{ color:'primary.main', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'primary.main', fontWeight:600 }}>In progress</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Open Findings</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{totalFindings}</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <WarningIcon sx={{ color:'#F44336', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'#F44336', fontWeight:600 }}>Total across audits</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Audit Completion</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{completionRate}%</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <TrendingUpIcon sx={{ color:'#4CAF50', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'#4CAF50', fontWeight:600 }}>Completed audits</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Upcoming / Overdue</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{upcomingAudits} / {overdueAudits}</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <ScheduleIcon sx={{ color:'#FF9800', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'#FF9800', fontWeight:600 }}>Planned</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Box sx={{ display:'flex', gap:2, mb:3 }}>
        <TextField placeholder="Search audits..." fullWidth
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
        <IconButton><FilterIcon /></IconButton>
      </Box>

      {/* Audits Table */}
      <Card><CardContent>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Audit Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Findings</TableCell>
                <TableCell>Auditor</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAudits.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight:600 }}>{a.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.scope}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.type} size="small" sx={{ bgcolor:`${getTypeColor(a.type)}15`, color:getTypeColor(a.type) }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={formatStatus(a.status)} size="small"
                      sx={{ bgcolor:`${getStatusColor(a.status)}15`, color:getStatusColor(a.status), fontWeight:600 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={a.priority} size="small"
                      sx={{ bgcolor:`${getPriorityColor(a.priority)}15`, color:getPriorityColor(a.priority), fontWeight:600 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Box sx={{ flexGrow:1 }}>
                        <LinearProgress variant="determinate" value={progressValue(a)}
                          sx={{ height:8, borderRadius:4, bgcolor:'#E0E0E0',
                            '& .MuiLinearProgress-bar':{ bgcolor: progressValue(a) === 100 ? '#4CAF50' : '#2196F3' } }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight:600, color: progressValue(a) === 100 ? '#4CAF50' : '#2196F3', minWidth:40 }}>
                        {progressValue(a)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight:600 }}>{a.findings || 0}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center' }}>
                      <Avatar sx={{ width:32, height:32, mr:1, fontSize:14 }}>{a.auditor.split(' ').map(n => n[0]).join('').substring(0, 2)}</Avatar>
                      <Typography variant="body2">{a.auditor}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, a.id)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAudits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No audits found. Click "Schedule Audit" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[5,10,25]} component="div" count={filteredAudits.length}
          rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
      </CardContent></Card>

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

      {/* Add / Edit Audit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedId ? 'Edit Audit' : 'Schedule New Audit'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Audit Title *"
                  placeholder="Enter audit title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Audit Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Audit Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <MenuItem value=""><em>Select type</em></MenuItem>
                    <MenuItem value="internal">Internal</MenuItem>
                    <MenuItem value="external">External</MenuItem>
                    <MenuItem value="compliance">Compliance</MenuItem>
                    <MenuItem value="financial">Financial</MenuItem>
                    <MenuItem value="operational">Operational</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Scope *"
                  placeholder="Enter audit scope"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    label="Department"
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <MenuItem value=""><em>Select department</em></MenuItem>
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Legal">Legal</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Auditor"
                  placeholder="Enter auditor name"
                  value={formData.auditor}
                  onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Auditee"
                  placeholder="Enter auditee name"
                  value={formData.auditee}
                  onChange={(e) => setFormData({ ...formData, auditee: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="planned">Planned</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.scheduledEnd}
                  onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  placeholder="Describe the audit scope and objectives"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={selectedId ? handleUpdate : handleCreate} disabled={saving}>
            {saving ? 'Saving...' : selectedId ? 'Update Audit' : 'Schedule Audit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Audit Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Details</DialogTitle>
        <DialogContent>
          {viewingAudit && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{viewingAudit.title}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body1">
                    <Chip label={viewingAudit.type} size="small" sx={{ bgcolor: `${getTypeColor(viewingAudit.type)}15`, color: getTypeColor(viewingAudit.type) }} />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body1">
                    <Chip label={formatStatus(viewingAudit.status)} size="small"
                      sx={{ bgcolor: `${getStatusColor(viewingAudit.status)}15`, color: getStatusColor(viewingAudit.status), fontWeight: 600 }} />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Priority</Typography>
                  <Typography variant="body1">
                    <Chip label={viewingAudit.priority} size="small"
                      sx={{ bgcolor: `${getPriorityColor(viewingAudit.priority)}15`, color: getPriorityColor(viewingAudit.priority) }} />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{viewingAudit.department || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Auditor</Typography>
                  <Typography variant="body1">{viewingAudit.auditor}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Auditee</Typography>
                  <Typography variant="body1">{viewingAudit.auditee || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">Scheduled Start</Typography>
                  <Typography variant="body1">{formatDate(viewingAudit.scheduledStart)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">Scheduled End</Typography>
                  <Typography variant="body1">{formatDate(viewingAudit.scheduledEnd)}</Typography>
                </Grid>
                {viewingAudit.actualStart && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">Actual Start</Typography>
                    <Typography variant="body1">{formatDate(viewingAudit.actualStart)}</Typography>
                  </Grid>
                )}
                {viewingAudit.actualEnd && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">Actual End</Typography>
                    <Typography variant="body1">{formatDate(viewingAudit.actualEnd)}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Findings</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewingAudit.findings || 0}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Recommendations</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewingAudit.recommendations || 0}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Scope</Typography>
                  <Typography variant="body1">{viewingAudit.scope}</Typography>
                </Grid>
                {viewingAudit.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{viewingAudit.description}</Typography>
                  </Grid>
                )}
                {viewingAudit.reportUrl && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Report URL</Typography>
                    <Typography variant="body1">
                      <a href={viewingAudit.reportUrl} target="_blank" rel="noopener noreferrer">
                        {viewingAudit.reportUrl}
                      </a>
                    </Typography>
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

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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

export default AuditManagement
