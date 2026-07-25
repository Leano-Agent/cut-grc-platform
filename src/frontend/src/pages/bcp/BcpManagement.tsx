import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Alert, Snackbar, Tooltip, FormControl, InputLabel, LinearProgress, Tabs, Tab,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as VisibilityIcon, Science as ScienceIcon,
  Search as SearchIcon, BusinessCenter as BcpIcon,
} from '@mui/icons-material'
import bcpService, { BcpPlan, BcpStats, BcpFormData, CriticalFunction, RecoveryProcedure, Stakeholder } from '../../services/bcpService'

const statusConfig: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  draft: { label: 'Draft', color: 'default' },
  reviewed: { label: 'Reviewed', color: 'info' },
  approved: { label: 'Approved', color: 'success' },
  tested: { label: 'Tested', color: 'warning' },
  expired: { label: 'Expired', color: 'error' },
}

const typeLabels: Record<string, string> = {
  bcp: 'Business Continuity',
  drp: 'Disaster Recovery',
  crisis_plan: 'Crisis Management',
  pandemic_plan: 'Pandemic Response',
}

const testResultColor: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  pass: 'success',
  pass_with_issues: 'warning',
  fail: 'error',
  incomplete: 'default',
}

const testResultLabels: Record<string, string> = {
  pass: 'Pass',
  pass_with_issues: 'Pass w/ Issues',
  fail: 'Fail',
  incomplete: 'Incomplete',
}

const emptyForm: BcpFormData = {
  name: '', description: '', type: 'bcp', department: '', owner: '',
  scope: '', objectives: '', criticalFunctions: [], recoveryProcedures: [],
  stakeholders: [], tags: [],
}

const BcpManagement = () => {
  const [plans, setPlans] = useState<BcpPlan[]>([])
  const [stats, setStats] = useState<BcpStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [detailTab, setDetailTab] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<BcpPlan | null>(null)
  const [formData, setFormData] = useState<BcpFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testForm, setTestForm] = useState({ type: 'tabletop', result: 'pass', notes: '', participants: '' })
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterType) filters.type = filterType
      if (filterStatus) filters.status = filterStatus
      if (filterDepartment) filters.department = filterDepartment
      if (searchQuery) filters.search = searchQuery
      const data = await bcpService.getAll(filters)
      setPlans(data)
      const statsData = await bcpService.getStats()
      setStats(statsData)
    } catch { setSnackbar({ open: true, message: 'Failed to load BCP plans', severity: 'error' }) }
    finally { setLoading(false) }
  }, [filterType, filterStatus, filterDepartment, searchQuery])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const handleCreate = () => { setEditingId(null); setFormData(emptyForm); setDialogOpen(true) }

  const handleEdit = (p: BcpPlan) => {
    setEditingId(p.id)
    setFormData({
      name: p.name, description: p.description || '', type: p.type,
      department: p.department || '', owner: p.owner || '',
      scope: p.scope || '', objectives: p.objectives || '',
      criticalFunctions: p.criticalFunctions || [],
      recoveryProcedures: p.recoveryProcedures || [],
      stakeholders: p.stakeholders || [],
      tags: p.tags || [],
    })
    setDialogOpen(true)
  }

  const handleView = (p: BcpPlan) => { setSelectedPlan(p); setDetailTab(0); setDetailDialogOpen(true) }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await bcpService.updateStatus(id, newStatus)
      setSnackbar({ open: true, message: `BCP plan status updated`, severity: 'success' })
      fetchPlans()
    } catch { setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' }) }
  }

  const handleDelete = async (id: string) => {
    try {
      await bcpService.delete(id)
      setSnackbar({ open: true, message: 'BCP plan archived', severity: 'success' })
      fetchPlans()
    } catch { setSnackbar({ open: true, message: 'Failed to archive', severity: 'error' }) }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Name is required', severity: 'error' }); return
    }
    try {
      if (editingId) { await bcpService.update(editingId, formData) }
      else { await bcpService.create(formData) }
      setSnackbar({ open: true, message: editingId ? 'Plan updated' : 'Plan created', severity: 'success' })
      setDialogOpen(false); fetchPlans()
    } catch { setSnackbar({ open: true, message: 'Failed to save', severity: 'error' }) }
  }

  const handleRecordTest = async () => {
    if (!selectedPlan) return
    try {
      await bcpService.recordTest(selectedPlan.id, {
        type: testForm.type,
        result: testForm.result,
        notes: testForm.notes || undefined,
        participants: testForm.participants ? testForm.participants.split(',').map(s => s.trim()) : [],
      })
      setSnackbar({ open: true, message: 'Test recorded successfully', severity: 'success' })
      setTestDialogOpen(false)
      fetchPlans()
      if (selectedPlan) {
        const updated = await bcpService.getById(selectedPlan.id)
        setSelectedPlan(updated)
      }
    } catch { setSnackbar({ open: true, message: 'Failed to record test', severity: 'error' }) }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  const statCards = [
    { label: 'Total Plans', value: stats?.total || 0, color: 'primary.main' },
    { label: 'Approved', value: stats?.approved || 0, color: 'success.main' },
    { label: 'Needs Review', value: stats?.needsReview || 0, color: 'info.main' },
    { label: 'Expiring Soon', value: stats?.expiringSoon || 0, color: 'warning.main' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>Business Continuity Management</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage business continuity plans, disaster recovery procedures, crisis management, and pandemic response plans with full test tracking and stakeholder management.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map(s => (
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
            <TextField fullWidth size="small" placeholder="Search plans..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={4} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={filterType} label="Type" onChange={e => setFilterType(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {bcpService.types.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {bcpService.statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} sm={2}>
            <TextField fullWidth size="small" label="Department"
              value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={1}>
            <Button fullWidth variant="outlined" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterDepartment(''); setSearchQuery('') }}>Clear</Button>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Plan</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Plan Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Owner</strong></TableCell>
              <TableCell><strong>Next Test</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">{loading ? 'Loading...' : 'No BCP plans found.'}</Typography>
              </TableCell></TableRow>
            ) : plans.map(p => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BcpIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      {p.objectives && <Typography variant="caption" color="text.secondary" sx={{
                        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{p.objectives}</Typography>}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Chip size="small" label={typeLabels[p.type] || p.type} variant="outlined" /></TableCell>
                <TableCell><Chip size="small" label={statusConfig[p.status]?.label || p.status} color={statusConfig[p.status]?.color || 'default'} variant="outlined" /></TableCell>
                <TableCell><Typography variant="body2">{p.department || '—'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{p.owner || '—'}</Typography></TableCell>
                <TableCell>
                  <Typography variant="caption" color={p.testSchedule.nextTestDate ? 'text.secondary' : 'text.disabled'}>
                    {p.testSchedule.nextTestDate ? formatDate(p.testSchedule.nextTestDate) : 'Not scheduled'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View"><IconButton size="small" onClick={() => handleView(p)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Record Test"><IconButton size="small" color="secondary" onClick={() => { setSelectedPlan(p); setTestForm({ type: 'tabletop', result: 'pass', notes: '', participants: '' }); setTestDialogOpen(true) }}><ScienceIcon fontSize="small" /></IconButton></Tooltip>
                  {bcpService.getValidTransitions(p.status).length > 0 && (
                    bcpService.getValidTransitions(p.status).map(t => (
                      <Tooltip key={t.value} title={t.label}>
                        <IconButton size="small" color="primary" onClick={() => handleStatusChange(p.id, t.value)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ))
                  )}
                  <Tooltip title="Archive"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit BCP Plan' : 'Create New BCP Plan'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Plan Name" required value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. IT Disaster Recovery Plan" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={formData.type} label="Type" onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {bcpService.types.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="Department" value={formData.department || ''}
                onChange={e => setFormData({ ...formData, department: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="Owner" value={formData.owner || ''}
                onChange={e => setFormData({ ...formData, owner: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Scope" multiline rows={2} value={formData.scope || ''}
                onChange={e => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Define the scope of this plan — which departments, systems, and locations are covered" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Objectives" multiline rows={2} value={formData.objectives || ''}
                onChange={e => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="e.g. Restore critical IT services within 4 hours of a disaster event" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Tags (comma-separated)" value={(formData.tags || []).join(', ')}
                onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Create Plan'}</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog with Tabs */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BcpIcon color="primary" />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{selectedPlan?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedPlan ? typeLabels[selectedPlan.type] : ''} — Created {formatDate(selectedPlan?.createdAt || null)}
              </Typography>
            </Box>
            {selectedPlan && <Chip size="small" label={statusConfig[selectedPlan.status]?.label} color={statusConfig[selectedPlan.status]?.color || 'default'} />}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 400 }}>
          {selectedPlan && (
            <>
              <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Recovery Procedures" />
                <Tab label="Test History" />
              </Tabs>

              {/* Tab 0: Overview */}
              {detailTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Owner</Typography><Typography variant="body2">{selectedPlan.owner || '—'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Department</Typography><Typography variant="body2">{selectedPlan.department || '—'}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Scope</Typography><Typography variant="body2">{selectedPlan.scope || '—'}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Objectives</Typography><Typography variant="body2">{selectedPlan.objectives || '—'}</Typography></Grid>
                  {selectedPlan.description && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Description</Typography><Typography variant="body2">{selectedPlan.description}</Typography></Grid>}

                  {/* Critical Functions */}
                  {selectedPlan.criticalFunctions.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Critical Functions</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Function</strong></TableCell>
                              <TableCell><strong>Priority</strong></TableCell>
                              <TableCell><strong>RTO</strong></TableCell>
                              <TableCell><strong>RPO</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedPlan.criticalFunctions.map((cf, i) => (
                              <TableRow key={i}>
                                <TableCell>{cf.name}</TableCell>
                                <TableCell><Chip size="small" label={`P${cf.priority}`} color={cf.priority === 1 ? 'error' : cf.priority === 2 ? 'warning' : 'info'} /></TableCell>
                                <TableCell>{cf.rto}h</TableCell>
                                <TableCell>{cf.rpo}h</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}

                  {/* Test Schedule */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Test Schedule</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={3}><Typography variant="caption" color="text.secondary">Frequency</Typography><Typography variant="body2">{selectedPlan.testSchedule.frequency}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="caption" color="text.secondary">Last Test</Typography><Typography variant="body2">{formatDate(selectedPlan.testSchedule.lastTestDate)}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="caption" color="text.secondary">Next Test</Typography><Typography variant="body2">{formatDate(selectedPlan.testSchedule.nextTestDate)}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="caption" color="text.secondary">Last Result</Typography>
                          <Box>{selectedPlan.testSchedule.lastTestResult ? <Chip size="small" label={testResultLabels[selectedPlan.testSchedule.lastTestResult] || selectedPlan.testSchedule.lastTestResult} color={testResultColor[selectedPlan.testSchedule.lastTestResult] || 'default'} /> : '—'}</Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Stakeholders */}
                  {selectedPlan.stakeholders.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Stakeholders</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Name</strong></TableCell>
                              <TableCell><strong>Role</strong></TableCell>
                              <TableCell><strong>Contact</strong></TableCell>
                              <TableCell><strong>Department</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedPlan.stakeholders.map((s, i) => (
                              <TableRow key={i}>
                                <TableCell>{s.name}</TableCell>
                                <TableCell>{s.role}</TableCell>
                                <TableCell>{s.contact}</TableCell>
                                <TableCell>{s.department}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}

                  {selectedPlan.tags?.length > 0 && (
                    <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Tags</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{selectedPlan.tags.map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}</Box>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Tab 1: Recovery Procedures */}
              {detailTab === 1 && (
                <Box>
                  {selectedPlan.recoveryProcedures.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No recovery procedures defined yet.</Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Step</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell><strong>Owner</strong></TableCell>
                            <TableCell><strong>Duration</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPlan.recoveryProcedures.map((rp, i) => (
                            <TableRow key={i}>
                              <TableCell><Chip size="small" label={rp.step} color="primary" variant="outlined" /></TableCell>
                              <TableCell>{rp.description}</TableCell>
                              <TableCell>{rp.owner}</TableCell>
                              <TableCell>{rp.duration}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* Tab 2: Test History */}
              {detailTab === 2 && (
                <Box>
                  {selectedPlan.testHistory.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No tests recorded yet.</Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Result</strong></TableCell>
                            <TableCell><strong>Notes</strong></TableCell>
                            <TableCell><strong>Participants</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPlan.testHistory.map((th, i) => (
                            <TableRow key={i}>
                              <TableCell>{formatDate(th.date)}</TableCell>
                              <TableCell><Chip size="small" label={th.type.replace(/_/g, ' ')} variant="outlined" /></TableCell>
                              <TableCell><Chip size="small" label={testResultLabels[th.result] || th.result} color={testResultColor[th.result] || 'default'} /></TableCell>
                              <TableCell><Typography variant="body2">{th.notes || '—'}</Typography></TableCell>
                              <TableCell><Typography variant="caption">{Array.isArray(th.participants) ? th.participants.join(', ') : th.participants || '—'}</Typography></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" startIcon={<ScienceIcon />} onClick={() => { setTestForm({ type: 'tabletop', result: 'pass', notes: '', participants: '' }); setTestDialogOpen(true) }}>
                      Record New Test
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectedPlan && bcpService.getValidTransitions(selectedPlan.status).map(t => (
            <Button key={t.value} variant="outlined" size="small"
              onClick={() => { handleStatusChange(selectedPlan.id, t.value); setDetailDialogOpen(false) }}>
              {t.label}
            </Button>
          ))}
          <Button variant="contained" onClick={() => { setDetailDialogOpen(false); selectedPlan && handleEdit(selectedPlan) }}>Edit</Button>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Record Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Test Result</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Test Type</InputLabel>
                <Select value={testForm.type} label="Test Type" onChange={e => setTestForm({ ...testForm, type: e.target.value })}>
                  {bcpService.testTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Result</InputLabel>
                <Select value={testForm.result} label="Result" onChange={e => setTestForm({ ...testForm, result: e.target.value })}>
                  {bcpService.testResults.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={3} value={testForm.notes}
                onChange={e => setTestForm({ ...testForm, notes: e.target.value })}
                placeholder="Describe the test scope, findings, and any issues discovered" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Participants (comma-separated)" value={testForm.participants}
                onChange={e => setTestForm({ ...testForm, participants: e.target.value })}
                placeholder="e.g. IT Team, External Audit, Department Heads" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRecordTest}>Record Test</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default BcpManagement
