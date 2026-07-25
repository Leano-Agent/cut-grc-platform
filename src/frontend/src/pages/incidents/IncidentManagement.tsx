import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Alert, Snackbar, Tooltip, FormControl, InputLabel, LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as VisibilityIcon, AssignmentInd as AssignIcon,
  Search as SearchIcon, ReportProblem as IncidentIcon,
} from '@mui/icons-material'
import incidentService, { Incident, IncidentStats, IncidentFormData } from '../../services/incidentService'

const statusConfig: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  reported: { label: 'Reported', color: 'default' },
  investigating: { label: 'Investigating', color: 'info' },
  contained: { label: 'Contained', color: 'warning' },
  resolved: { label: 'Resolved', color: 'success' },
  closed: { label: 'Closed', color: 'default' },
}

const severityColor: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error', high: 'warning', medium: 'info', low: 'success',
}

const categoryLabels: Record<string, string> = {
  security: 'Security', data_breach: 'Data Breach', fraud: 'Fraud',
  compliance_violation: 'Compliance', operational: 'Operational',
  hr: 'HR', physical: 'Physical', privacy: 'Privacy', other: 'Other',
}

const emptyForm: IncidentFormData = {
  title: '', description: '', category: 'other', severity: 'medium',
  priority: 'medium', department: '', location: '', detectionMethod: '',
  impact: '', tags: [], regulatoryObligations: [],
}

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [formData, setFormData] = useState<IncidentFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterCategory) filters.category = filterCategory
      if (filterStatus) filters.status = filterStatus
      if (filterSeverity) filters.severity = filterSeverity
      if (searchQuery) filters.search = searchQuery
      const data = await incidentService.getAll(filters)
      setIncidents(data)
      const statsData = await incidentService.getStats()
      setStats(statsData)
    } catch { setSnackbar({ open: true, message: 'Failed to load incidents', severity: 'error' }) }
    finally { setLoading(false) }
  }, [filterCategory, filterStatus, filterSeverity, searchQuery])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  const handleCreate = () => { setEditingId(null); setFormData(emptyForm); setDialogOpen(true) }
  
  const handleEdit = (inc: Incident) => {
    setEditingId(inc.id)
    setFormData({
      title: inc.title, description: inc.description || '', category: inc.category,
      severity: inc.severity, priority: inc.priority, department: inc.department || '',
      location: inc.location || '', detectionMethod: inc.detectionMethod || '',
      impact: inc.impact || '', tags: inc.tags || [], regulatoryObligations: inc.regulatoryObligations || [],
    })
    setDialogOpen(true)
  }

  const handleView = (inc: Incident) => { setSelectedIncident(inc); setDetailDialogOpen(true) }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await incidentService.updateStatus(id, newStatus)
      setSnackbar({ open: true, message: `Incident status updated`, severity: 'success' })
      fetchIncidents()
    } catch { setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' }) }
  }

  const handleDelete = async (id: string) => {
    try {
      await incidentService.delete(id)
      setSnackbar({ open: true, message: 'Incident closed', severity: 'success' })
      fetchIncidents()
    } catch { setSnackbar({ open: true, message: 'Failed to close incident', severity: 'error' }) }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setSnackbar({ open: true, message: 'Title is required', severity: 'error' }); return
    }
    try {
      if (editingId) { await incidentService.update(editingId, formData) }
      else { await incidentService.create(formData) }
      setSnackbar({ open: true, message: editingId ? 'Incident updated' : 'Incident created', severity: 'success' })
      setDialogOpen(false); fetchIncidents()
    } catch { setSnackbar({ open: true, message: 'Failed to save', severity: 'error' }) }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const timeSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>Incident Management</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Track, investigate, and resolve security and operational incidents with full audit trail and SLA monitoring.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Incidents', value: stats?.total || 0, color: 'primary.main' },
          { label: 'Open Incidents', value: stats?.openIncidents || 0, color: 'info.main' },
          { label: 'Critical Open', value: stats?.criticalOpen || 0, color: 'error.main' },
          { label: 'SLA Breached', value: stats?.slaBreached || 0, color: 'warning.main' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color={s.color}>{s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" placeholder="Search incidents..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={4} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={filterCategory} label="Category" onChange={e => setFilterCategory(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {incidentService.categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {incidentService.statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select value={filterSeverity} label="Severity" onChange={e => setFilterSeverity(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {incidentService.severities.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={1}>
            <Button fullWidth variant="outlined" onClick={() => { setFilterCategory(''); setFilterStatus(''); setFilterSeverity(''); setSearchQuery('') }}>Clear</Button>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Report Incident</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Incident</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Severity</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Age</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">{loading ? 'Loading...' : 'No incidents found.'}</Typography>
              </TableCell></TableRow>
            ) : incidents.map(inc => (
              <TableRow key={inc.id} hover sx={{ bgcolor: inc.severity === 'critical' && inc.status !== 'resolved' && inc.status !== 'closed' ? 'error.50' : undefined }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IncidentIcon fontSize="small" color={inc.severity === 'critical' ? 'error' : inc.severity === 'high' ? 'warning' : 'action'} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{inc.title}</Typography>
                      {inc.reportedBy && <Typography variant="caption" color="text.secondary">Reported by {inc.reportedBy}</Typography>}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Chip size="small" label={categoryLabels[inc.category] || inc.category} variant="filled" /></TableCell>
                <TableCell><Chip size="small" label={inc.severity} color={severityColor[inc.severity] || 'default'} variant={inc.severity === 'critical' ? 'filled' : 'outlined'} /></TableCell>
                <TableCell><Chip size="small" label={statusConfig[inc.status]?.label || inc.status} color={statusConfig[inc.status]?.color || 'default'} variant="outlined" /></TableCell>
                <TableCell><Typography variant="body2">{inc.department || '—'}</Typography></TableCell>
                <TableCell>
                  <Typography variant="caption" color={timeSince(inc.createdAt) > 7 ? 'error.main' : 'text.secondary'}>
                    {timeSince(inc.createdAt)}d{inc.slaBreached && <Chip size="small" label="SLA" color="error" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View"><IconButton size="small" onClick={() => handleView(inc)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(inc)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  {inc.status === 'reported' && (
                    <Tooltip title="Start Investigation"><IconButton size="small" color="info" onClick={() => handleStatusChange(inc.id, 'investigating')}><AssignIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {inc.status === 'investigating' && (
                    <Tooltip title="Mark Contained"><IconButton size="small" color="warning" onClick={() => handleStatusChange(inc.id, 'contained')}><AssignIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {inc.status === 'contained' && (
                    <Tooltip title="Mark Resolved"><IconButton size="small" color="success" onClick={() => handleStatusChange(inc.id, 'resolved')}><AssignIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {!['closed', 'resolved'].includes(inc.status) && (
                    <Tooltip title="Close"><IconButton size="small" color="error" onClick={() => handleDelete(inc.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Incident' : 'Report New Incident'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Incident Title" required value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Suspicious Network Activity Detected" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Category</InputLabel>
                <Select value={formData.category} label="Category" onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {incidentService.categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControl fullWidth><InputLabel>Severity</InputLabel>
                <Select value={formData.severity} label="Severity" onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                  {incidentService.severities.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControl fullWidth><InputLabel>Priority</InputLabel>
                <Select value={formData.priority} label="Priority" onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  {incidentService.severities.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Department" value={formData.department || ''}
                onChange={e => setFormData({ ...formData, department: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Location" value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Detection Method" value={formData.detectionMethod || ''}
                onChange={e => setFormData({ ...formData, detectionMethod: e.target.value })}
                placeholder="e.g. Internal Audit, IDS/IPS Alert, User Report" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={3} value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Impact" multiline rows={2} value={formData.impact || ''}
                onChange={e => setFormData({ ...formData, impact: e.target.value })}
                placeholder="Describe the business impact of this incident" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Report Incident'}</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IncidentIcon color={selectedIncident?.severity === 'critical' ? 'error' : 'primary'} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{selectedIncident?.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                Reported {formatDate(selectedIncident?.createdAt || null)} by {selectedIncident?.reportedBy || 'Unknown'}
              </Typography>
            </Box>
            {selectedIncident && <Chip size="small" label={statusConfig[selectedIncident.status]?.label} color={statusConfig[selectedIncident.status]?.color || 'default'} />}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncident && (
            <Grid container spacing={2}>
              <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary">Category</Typography><Typography variant="body2">{categoryLabels[selectedIncident.category]}</Typography></Grid>
              <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary">Severity</Typography><Chip size="small" label={selectedIncident.severity} color={severityColor[selectedIncident.severity] || 'default'} /></Grid>
              <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary">Department</Typography><Typography variant="body2">{selectedIncident.department || '—'}</Typography></Grid>
              {selectedIncident.description && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Description</Typography><Typography variant="body2">{selectedIncident.description}</Typography></Grid>}
              {selectedIncident.impact && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Impact</Typography><Typography variant="body2">{selectedIncident.impact}</Typography></Grid>}
              {selectedIncident.rootCause && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Root Cause</Typography><Typography variant="body2">{selectedIncident.rootCause}</Typography></Grid>}
              {selectedIncident.remediation && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Remediation</Typography><Typography variant="body2">{selectedIncident.remediation}</Typography></Grid>}
              {selectedIncident.lessonsLearned && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Lessons Learned</Typography><Typography variant="body2">{selectedIncident.lessonsLearned}</Typography></Grid>}
              {selectedIncident.tags?.length > 0 && (
                <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{selectedIncident.tags.map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}</Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedIncident && incidentService.getValidTransitions(selectedIncident.status).map(t => (
            <Button key={t.value} variant="outlined" size="small"
              onClick={() => { handleStatusChange(selectedIncident.id, t.value); setDetailDialogOpen(false) }}>
              {t.label}
            </Button>
          ))}
          <Button variant="contained" onClick={() => { setDetailDialogOpen(false); selectedIncident && handleEdit(selectedIncident) }}>Edit</Button>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default IncidentManagement
