import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Alert, Snackbar, Tooltip, FormControl,
  InputLabel, LinearProgress, Tabs, Tab, Divider, Checkbox, FormControlLabel,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon,
  Search as SearchIcon, TrackChanges as ActionIcon, Comment as CommentIcon,
  Checklist as ChecklistIcon, PlayArrow, CheckCircle, Replay, Cancel,
} from '@mui/icons-material'
import actionService, { Action, ActionStats, ActionComment, ChecklistItem } from '../../services/actionService'

const statusConfig: Record<string, { label: string; color: any }> = {
  open: { label: 'Open', color: 'default' },
  in_progress: { label: 'In Progress', color: 'info' },
  under_review: { label: 'Under Review', color: 'warning' },
  closed: { label: 'Closed', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
}
const priorityColor: Record<string, any> = { critical: 'error', high: 'warning', medium: 'info', low: 'success' }
const sourceLabels: Record<string, string> = {
  audit: 'Audit', incident: 'Incident', risk: 'Risk', compliance: 'Compliance',
  policy: 'Policy', survey: 'Survey', board: 'Board', control: 'Control', vendor: 'Vendor', other: 'Other',
}

const ActionTracking = () => {
  const [actions, setActions] = useState<Action[]>([])
  const [stats, setStats] = useState<ActionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [activeAction, setActiveAction] = useState<Action | null>(null)
  const [subTab, setSubTab] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOverdue, setShowOverdue] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '', source: 'other', sourceRef: '', priority: 'medium', category: 'corrective', department: '', assignedTo: '', dueDate: '', tags: '' })
  const [commentText, setCommentText] = useState('')
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const fetchActions = useCallback(async () => {
    setLoading(true)
    try {
      const f: any = {};
      if (filterStatus) f.status = filterStatus
      if (filterPriority) f.priority = filterPriority
      if (filterSource) f.source = filterSource
      if (searchQuery) f.search = searchQuery
      if (showOverdue) f.overdue = 'true'
      setActions(await actionService.getAll(f))
      setStats(await actionService.getStats())
    } catch { setSnackbar({ open: true, message: 'Failed to load', severity: 'error' }) }
    finally { setLoading(false) }
  }, [filterStatus, filterPriority, filterSource, searchQuery, showOverdue])
  useEffect(() => { fetchActions() }, [fetchActions])

  const refreshAction = async (id: string) => { const a = await actionService.getById(id); setActiveAction(a); const copy = [...actions]; const idx = copy.findIndex(x => x.id === id); if (idx >= 0) copy[idx] = a; setActions(copy) }
  const selectAction = async (a: Action) => { setActiveAction(a); setTab(1); setSubTab(0) }

  // CRUD
  const handleCreate = () => { setEditingAction(null); setFormData({ title: '', description: '', source: 'other', sourceRef: '', priority: 'medium', category: 'corrective', department: '', assignedTo: '', dueDate: '', tags: '' }); setDialogOpen(true) }
  const handleEdit = (a: Action) => { setEditingAction(a); setFormData({ title: a.title, description: a.description || '', source: a.source, sourceRef: a.sourceRef || '', priority: a.priority, category: a.category, department: a.department || '', assignedTo: a.assignedTo || '', dueDate: a.dueDate || '', tags: (a.tags || []).join(', ') }); setDialogOpen(true) }
  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    try {
      const d = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (editingAction) await actionService.update(editingAction.id, d)
      else await actionService.create(d)
      setDialogOpen(false); fetchActions(); setSnackbar({ open: true, message: editingAction ? 'Updated' : 'Created', severity: 'success' })
    } catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }
  const handleStatus = async (id: string, status: string) => {
    try { await actionService.updateStatus(id, status); refreshAction(id); fetchActions(); setSnackbar({ open: true, message: `Status → ${status}`, severity: 'success' }) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }

  // Comments
  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try { await actionService.addComment(activeAction!.id, { comment: commentText }); setCommentText(''); refreshAction(activeAction!.id) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }

  // Checklist
  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return
    try { await actionService.addChecklistItem(activeAction!.id, { title: newChecklistTitle }); setNewChecklistTitle(''); refreshAction(activeAction!.id) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }
  const handleToggleChecklist = async (item: ChecklistItem) => {
    try { await actionService.updateChecklistItem(activeAction!.id, item.id, { completed: !item.completed }); refreshAction(activeAction!.id) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }
  const handleDeleteChecklist = async (itemId: string) => {
    try { await actionService.deleteChecklistItem(activeAction!.id, itemId); refreshAction(activeAction!.id) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const isOverdue = (a: Action) => a.dueDate && new Date(a.dueDate) < new Date() && !['closed', 'rejected'].includes(a.status)

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>Issue & Action Tracking</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Centralised CAPA — track corrective and preventive actions from audits, incidents, risk assessments, and compliance findings across the organisation.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Actions', value: stats?.total || 0, color: 'primary.main' },
          { label: 'Open / Active', value: stats?.openCount || 0, color: 'info.main' },
          { label: 'Overdue', value: stats?.overdue || 0, color: 'error.main' },
          { label: 'Completed', value: stats?.completed || 0, color: 'success.main' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color={s.color}>{s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mb: 3 }}>
        {tab === 0 ? (
          <Box sx={{ p: 2 }}>
            {/* Filters */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" placeholder="Search actions..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
                  <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {actionService.statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small"><InputLabel>Priority</InputLabel>
                  <Select value={filterPriority} label="Priority" onChange={e => setFilterPriority(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {actionService.priorities.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small"><InputLabel>Source</InputLabel>
                  <Select value={filterSource} label="Source" onChange={e => setFilterSource(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {actionService.sources.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={1}>
                <Button fullWidth variant="outlined" onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterSource(''); setSearchQuery(''); setShowOverdue(false) }}>Clear</Button>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Action</Button>
              </Grid>
            </Grid>
            <FormControlLabel control={<Checkbox checked={showOverdue} onChange={e => setShowOverdue(e.target.checked)} size="small" />}
              label={<Typography variant="caption" fontWeight={600} color="error">Show overdue only</Typography>} sx={{ mb: 1 }} />

            {/* Table */}
            <TableContainer>
              {loading && <LinearProgress />}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Action / Title</strong></TableCell>
                    <TableCell><strong>Source</strong></TableCell>
                    <TableCell><strong>Priority</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Assignee</strong></TableCell>
                    <TableCell><strong>Due</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actions.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No actions found</Typography></TableCell></TableRow>
                  ) : actions.map(a => (
                    <TableRow key={a.id} hover sx={{ bgcolor: isOverdue(a) ? 'error.50' : undefined }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ActionIcon fontSize="small" color={a.priority === 'critical' ? 'error' : 'primary'} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                            {a.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Chip size="small" label={sourceLabels[a.source] || a.source} variant="outlined" /></TableCell>
                      <TableCell><Chip size="small" label={a.priority} color={priorityColor[a.priority] || 'default'} variant={a.priority === 'critical' ? 'filled' : 'outlined'} /></TableCell>
                      <TableCell><Chip size="small" label={statusConfig[a.status]?.label || a.status} color={statusConfig[a.status]?.color || 'default'} variant="outlined" /></TableCell>
                      <TableCell><Chip size="small" label={a.category} variant="outlined" /></TableCell>
                      <TableCell><Typography variant="body2">{a.assignedTo || '—'}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="caption" color={isOverdue(a) ? 'error.main' : 'text.secondary'} fontWeight={isOverdue(a) ? 700 : 400}>
                          {formatDate(a.dueDate)}{isOverdue(a) && ' ⚠'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Open"><IconButton size="small" onClick={() => selectAction(a)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(a)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        {a.status === 'open' && <Tooltip title="Start"><IconButton size="small" color="info" onClick={() => handleStatus(a.id, 'in_progress')}><PlayArrow fontSize="small" /></IconButton></Tooltip>}
                        {a.status === 'in_progress' && <Tooltip title="Submit Review"><IconButton size="small" color="warning" onClick={() => handleStatus(a.id, 'under_review')}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
                        {a.status === 'under_review' && <Tooltip title="Close"><IconButton size="small" color="success" onClick={() => handleStatus(a.id, 'closed')}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2 }}>
              <Box>
                <Button size="small" onClick={() => { setTab(0); setActiveAction(null) }} sx={{ mr: 1 }}>← Back</Button>
                <Typography variant="h6" display="inline">{activeAction?.title}</Typography>
                {activeAction && isOverdue(activeAction) && <Chip size="small" label="OVERDUE" color="error" sx={{ ml: 1 }} />}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {activeAction && actionService.getValidTransitions(activeAction.status).map(t => (
                  <Button key={t.value} size="small" variant="outlined" onClick={() => handleStatus(activeAction.id, t.value)}>{t.label}</Button>
                ))}
                <Button size="small" variant="contained" onClick={() => handleEdit(activeAction!)}>Edit</Button>
              </Box>
            </Box>
            <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ px: 2, mt: 1 }}>
              <Tab label="Overview" />
              <Tab label={`Checklist (${activeAction?.checklist.filter(c => c.completed).length || 0}/${activeAction?.checklist.length || 0})`} />
              <Tab label={`Comments (${activeAction?.comments.length || 0})`} />
            </Tabs>
            <Divider />
            <Box sx={{ p: 3 }}>
              {subTab === 0 && activeAction && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{activeAction.description || 'No description'}</Typography>
                  </Grid>
                  <Grid container item spacing={2}>
                    {[
                      { label: 'Source', val: sourceLabels[activeAction.source] || activeAction.source },
                      { label: 'Reference', val: activeAction.sourceRef || '—' },
                      { label: 'Priority', val: <Chip size="small" label={activeAction.priority} color={priorityColor[activeAction.priority] || 'default'} /> },
                      { label: 'Status', val: <Chip size="small" label={statusConfig[activeAction.status]?.label} color={statusConfig[activeAction.status]?.color} variant="outlined" /> },
                      { label: 'Category', val: activeAction.category },
                      { label: 'Department', val: activeAction.department || '—' },
                      { label: 'Assignee', val: activeAction.assignedTo || '—' },
                      { label: 'Due Date', val: formatDate(activeAction.dueDate) },
                      { label: 'Completed', val: formatDate(activeAction.completedAt) },
                    ].map(x => (
                      <Grid item xs={4} key={x.label}>
                        <Typography variant="caption" color="text.secondary">{x.label}</Typography>
                        <Typography variant="body2">{x.val}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  {activeAction.rootCause && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Root Cause</Typography><Typography variant="body2">{activeAction.rootCause}</Typography></Grid>}
                  {activeAction.resolution && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Resolution</Typography><Typography variant="body2">{activeAction.resolution}</Typography></Grid>}
                  {activeAction.closureNotes && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Closure Notes</Typography><Typography variant="body2">{activeAction.closureNotes}</Typography></Grid>}
                  {activeAction.tags?.length > 0 && (
                    <Grid item xs={12}><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{activeAction.tags.map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}</Box></Grid>
                  )}
                </Grid>
              )}
              {subTab === 1 && activeAction && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField fullWidth size="small" placeholder="Add checklist item..." value={newChecklistTitle}
                      onChange={e => setNewChecklistTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddChecklist() }} />
                    <Button variant="contained" onClick={handleAddChecklist} disabled={!newChecklistTitle.trim()}>Add</Button>
                  </Box>
                  {activeAction.checklist.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No checklist items yet</Typography>
                  ) : activeAction.checklist.map(item => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: item.completed ? 'success.50' : undefined }}>
                      <Checkbox checked={item.completed} onChange={() => handleToggleChecklist(item)} size="small" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.secondary' : 'text.primary' }}>
                          {item.title}
                        </Typography>
                        {item.assignedTo && <Typography variant="caption" color="text.secondary">Assigned to {item.assignedTo}</Typography>}
                      </Box>
                      {item.completedAt && <Typography variant="caption" color="text.secondary">{formatDate(item.completedAt)}</Typography>}
                      <IconButton size="small" color="error" onClick={() => handleDeleteChecklist(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Paper>
                  ))}
                </Box>
              )}
              {subTab === 2 && activeAction && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField fullWidth size="small" placeholder="Add comment..." value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      multiline maxRows={3}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }} />
                    <Button variant="contained" onClick={handleAddComment} disabled={!commentText.trim()} sx={{ alignSelf: 'flex-start' }}>Send</Button>
                  </Box>
                  {activeAction.comments.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No comments yet</Typography>
                  ) : activeAction.comments.map(c => (
                    <Paper key={c.id} variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{c.comment}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.userId || 'System'} · {formatDate(c.createdAt)}</Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAction ? 'Edit Action' : 'Create Action Item'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Source</InputLabel>
                <Select value={formData.source} label="Source" onChange={e => setFormData({ ...formData, source: e.target.value })}>
                  {actionService.sources.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Source Reference" value={formData.sourceRef} onChange={e => setFormData({ ...formData, sourceRef: e.target.value })} placeholder="e.g. AUD-2026-042" /></Grid>
            <Grid item xs={4}>
              <FormControl fullWidth><InputLabel>Priority</InputLabel>
                <Select value={formData.priority} label="Priority" onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  {actionService.priorities.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth><InputLabel>Category</InputLabel>
                <Select value={formData.category} label="Category" onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {actionService.categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField fullWidth label="Department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Assignee" value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Due Date" type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Tags (comma-separated)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editingAction ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default ActionTracking
