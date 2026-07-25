import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Alert, Snackbar, Tooltip, FormControl,
  InputLabel, LinearProgress, Tabs, Tab, Divider,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon,
  Search as SearchIcon, Group as GroupIcon, Event as EventIcon, Gavel as GavelIcon,
  PersonAdd, CheckCircle, Cancel,
} from '@mui/icons-material'
import boardService, { Board, BoardStats, Meeting, BoardMember } from '../../services/boardService'

const statusConfig: Record<string, { label: string; color: any }> = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'default' },
  dissolved: { label: 'Dissolved', color: 'error' },
}

const typeLabels: Record<string, string> = {
  board: 'Board', committee: 'Committee', subcommittee: 'Subcommittee',
  task_force: 'Task Force', working_group: 'Working Group',
}
const categoryLabels: Record<string, string> = {
  audit: 'Audit', risk: 'Risk', compliance: 'Compliance', governance: 'Governance',
  finance: 'Finance', hr: 'HR', it: 'IT', strategy: 'Strategy', other: 'Other',
}

const BoardManagement = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [stats, setStats] = useState<BoardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [activeBoard, setActiveBoard] = useState<Board | null>(null)
  const [subTab, setSubTab] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', type: 'committee', category: 'other', charter: '', mission: '', meetingFrequency: '', quorum: '', termLength: '', tags: '' })
  const [memberDialog, setMemberDialog] = useState(false)
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'member', position: '' })
  const [meetingDialog, setMeetingDialog] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', location: '' })
  const [minuteDialog, setMinuteDialog] = useState(false)
  const [minuteText, setMinuteText] = useState('')
  const [decisionDialog, setDecisionDialog] = useState(false)
  const [decisionForm, setDecisionForm] = useState({ title: '', description: '', owner: '', dueDate: '' })
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const fetchBoards = useCallback(async () => {
    setLoading(true)
    try {
      const f: any = {}; if (filterStatus) f.status = filterStatus; if (searchQuery) f.search = searchQuery
      setBoards(await boardService.getAll(f))
      setStats(await boardService.getStats())
    } catch { setSnackbar({ open: true, message: 'Failed to load boards', severity: 'error' }) }
    finally { setLoading(false) }
  }, [filterStatus, searchQuery])
  useEffect(() => { fetchBoards() }, [fetchBoards])

  const refreshBoard = async (id: string) => {
    const b = await boardService.getById(id)
    setActiveBoard(b)
    const idx = boards.findIndex(x => x.id === id)
    if (idx >= 0) { const copy = [...boards]; copy[idx] = b; setBoards(copy) }
  }

  const selectBoard = async (b: Board) => { setActiveBoard(b); setTab(1); setSubTab(0) }

  // Board CRUD
  const handleCreate = () => { setEditingBoard(null); setFormData({ name: '', description: '', type: 'committee', category: 'other', charter: '', mission: '', meetingFrequency: '', quorum: '', termLength: '', tags: '' }); setDialogOpen(true) }
  const handleEdit = (b: Board) => {
    setEditingBoard(b)
    setFormData({ name: b.name, description: b.description || '', type: b.type, category: b.category, charter: b.charter || '', mission: b.mission || '', meetingFrequency: b.meetingFrequency || '', quorum: b.quorum?.toString() || '', termLength: b.termLength?.toString() || '', tags: (b.tags || []).join(', ') })
    setDialogOpen(true)
  }
  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    try {
      const d = { ...formData, quorum: formData.quorum ? parseInt(formData.quorum) : null, termLength: formData.termLength ? parseInt(formData.termLength) : null, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (editingBoard) await boardService.update(editingBoard.id, d)
      else await boardService.create(d)
      setDialogOpen(false); fetchBoards()
      setSnackbar({ open: true, message: editingBoard ? 'Board updated' : 'Board created', severity: 'success' })
    } catch { setSnackbar({ open: true, message: 'Failed to save', severity: 'error' }) }
  }
  const handleDissolve = async (id: string) => {
    try { await boardService.delete(id); fetchBoards(); setSnackbar({ open: true, message: 'Board dissolved', severity: 'success' }) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }

  // Members
  const handleAddMember = async () => {
    if (!memberForm.userId.trim()) return
    try {
      await boardService.addMember(activeBoard!.id, memberForm)
      setMemberDialog(false); refreshBoard(activeBoard!.id)
      setSnackbar({ open: true, message: 'Member added', severity: 'success' })
    } catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }
  const handleRemoveMember = async (userId: string) => {
    try { await boardService.removeMember(activeBoard!.id, userId); refreshBoard(activeBoard!.id) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }

  // Meetings
  const handleAddMeeting = async () => {
    if (!meetingForm.title.trim()) return
    try {
      await boardService.addMeeting(activeBoard!.id, meetingForm)
      setMeetingDialog(false); refreshBoard(activeBoard!.id)
      setSnackbar({ open: true, message: 'Meeting scheduled', severity: 'success' })
    } catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }
  const handleMeetingStatus = async (m: Meeting, status: string) => {
    try { await boardService.updateMeeting(activeBoard!.id, m.id, { ...m, status }); refreshBoard(activeBoard!.id) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }
  const handleSaveMinutes = async () => {
    if (!activeMeeting) return
    try { await boardService.updateMeeting(activeBoard!.id, activeMeeting.id, { ...activeMeeting, minutes: minuteText }); setMinuteDialog(false); refreshBoard(activeBoard!.id); setSnackbar({ open: true, message: 'Minutes saved', severity: 'success' }) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }
  const handleAddDecision = async () => {
    if (!decisionForm.title.trim() || !activeMeeting) return
    try { await boardService.addDecision(activeBoard!.id, activeMeeting.id, decisionForm); setDecisionDialog(false); refreshBoard(activeBoard!.id); setSnackbar({ open: true, message: 'Decision added', severity: 'success' }) }
    catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }) }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const formatDateTime = (d: string) => new Date(d).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>Board & Committee Management</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage governance committees, board members, meeting schedules, minutes, and resolutions with full attendance tracking.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Bodies', value: stats?.total || 0, color: 'primary.main' },
          { label: 'Active Members', value: stats?.totalMembers || 0, color: 'info.main' },
          { label: 'Total Meetings', value: stats?.totalMeetings || 0, color: 'success.main' },
          { label: 'Upcoming', value: stats?.upcomingMeetings || 0, color: 'warning.main' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color={s.color}>{s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters + List */}
      <Paper sx={{ mb: 3 }}>
        {tab === 0 ? (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" placeholder="Search boards/committees..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
              </Grid>
              <Grid item xs={4} sm={2}>
                <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
                  <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem><MenuItem value="dissolved">Dissolved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4} sm={2}>
                <Button fullWidth variant="outlined" onClick={() => { setFilterStatus(''); setSearchQuery('') }}>Clear</Button>
              </Grid>
              <Grid item xs={4} sm={4}>
                <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Board</Button>
              </Grid>
            </Grid>
            <TableContainer>
              {loading && <LinearProgress />}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Members</strong></TableCell>
                    <TableCell><strong>Meetings</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boards.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No boards or committees yet</Typography></TableCell></TableRow>
                  ) : boards.map(b => (
                    <TableRow key={b.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GavelIcon fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{b.name}</Typography>
                            {b.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Chip size="small" label={typeLabels[b.type] || b.type} variant="outlined" /></TableCell>
                      <TableCell><Chip size="small" label={categoryLabels[b.category] || b.category} /></TableCell>
                      <TableCell><Chip size="small" label={statusConfig[b.status]?.label || b.status} color={statusConfig[b.status]?.color || 'default'} variant="outlined" /></TableCell>
                      <TableCell><Typography variant="body2">{b.members.filter(m => m.isActive).length}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{b.meetings.length}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Open"><IconButton size="small" onClick={() => selectBoard(b)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        {b.status === 'active' && <Tooltip title="Dissolve"><IconButton size="small" color="error" onClick={() => handleDissolve(b.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
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
                <Button size="small" onClick={() => { setTab(0); setActiveBoard(null) }} sx={{ mr: 1 }}>← Back to list</Button>
                <Typography variant="h6" display="inline">{activeBoard?.name}</Typography>
                {activeBoard && <Chip size="small" label={statusConfig[activeBoard.status]?.label} color={statusConfig[activeBoard.status]?.color} variant="outlined" sx={{ ml: 1 }} />}
              </Box>
              <Button variant="contained" size="small" onClick={() => handleEdit(activeBoard!)}>Edit Board</Button>
            </Box>
            <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ px: 2, mt: 1 }}>
              <Tab label="Details & Members" />
              <Tab label={`Meetings (${activeBoard?.meetings.length || 0})`} />
            </Tabs>
            <Divider />
            <Box sx={{ p: 3 }}>
              {subTab === 0 && activeBoard && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{activeBoard.description || 'No description'}</Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      {[
                        { label: 'Type', val: typeLabels[activeBoard.type] || activeBoard.type },
                        { label: 'Category', val: categoryLabels[activeBoard.category] || activeBoard.category },
                        { label: 'Meeting Frequency', val: activeBoard.meetingFrequency || '—' },
                        { label: 'Quorum', val: activeBoard.quorum ? `${activeBoard.quorum} members` : '—' },
                        { label: 'Term Length', val: activeBoard.termLength ? `${activeBoard.termLength} months` : '—' },
                      ].map(x => (
                        <Grid item xs={4} key={x.label}>
                          <Typography variant="caption" color="text.secondary">{x.label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{x.val}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                    {activeBoard.charter && <><Typography variant="subtitle2" color="text.secondary">Charter</Typography><Typography variant="body2" sx={{ mb: 1 }}>{activeBoard.charter}</Typography></>}
                    {activeBoard.mission && <><Typography variant="subtitle2" color="text.secondary">Mission</Typography><Typography variant="body2">{activeBoard.mission}</Typography></>}
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>Members ({activeBoard.members.filter(m => m.isActive).length})</Typography>
                      <Button size="small" startIcon={<PersonAdd />} onClick={() => { setMemberForm({ userId: '', role: 'member', position: '' }); setMemberDialog(true) }}>Add</Button>
                    </Box>
                    {activeBoard.members.filter(m => m.isActive).map(m => (
                      <Paper key={m.userId} variant="outlined" sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{m.position || m.userId}</Typography>
                          <Chip size="small" label={m.role.replace(/_/g, ' ')} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          {m.termEnd && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Term: {formatDate(m.termEnd)}</Typography>}
                        </Box>
                        <IconButton size="small" color="error" onClick={() => handleRemoveMember(m.userId)}><DeleteIcon fontSize="small" /></IconButton>
                      </Paper>
                    ))}
                  </Grid>
                </Grid>
              )}
              {subTab === 1 && activeBoard && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>Meeting History & Schedule</Typography>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setMeetingForm({ title: '', date: '', location: '' }); setMeetingDialog(true) }}>Schedule Meeting</Button>
                  </Box>
                  {activeBoard.meetings.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No meetings yet</Typography>
                  ) : activeBoard.meetings.map(m => (
                    <Paper key={m.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>{m.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDateTime(m.date)} · {m.location || 'No location'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <Chip size="small" label={m.status.replace(/_/g, ' ')} color={m.status === 'completed' ? 'success' : m.status === 'scheduled' ? 'info' : m.status === 'in_progress' ? 'warning' : 'error'} variant="outlined" />
                          {m.status === 'scheduled' && <>
                            <IconButton size="small" color="warning" onClick={() => handleMeetingStatus(m, 'in_progress')}><CheckCircle fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleMeetingStatus(m, 'cancelled')}><Cancel fontSize="small" /></IconButton>
                          </>}
                          {m.status === 'in_progress' && <IconButton size="small" color="success" onClick={() => handleMeetingStatus(m, 'completed')}><CheckCircle fontSize="small" /></IconButton>}
                        </Box>
                      </Box>
                      {m.agenda.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Agenda:</Typography>
                          {m.agenda.map((a, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, ml: 2 }}>
                              <Typography variant="caption">{i + 1}.</Typography>
                              <Typography variant="caption">{a.item}{a.presenter ? ` (${a.presenter})` : ''}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      {m.attendance.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" fontWeight={600}>Attendance: </Typography>
                          <Typography variant="caption">{m.attendance.filter(a => a.status === 'present').length} present · {m.attendance.filter(a => a.status === 'late').length} late · {m.attendance.filter(a => a.status === 'absent').length} absent</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {m.minutes ? (
                          <Button size="small" onClick={() => { setActiveMeeting(m); setMinuteText(m.minutes || ''); setMinuteDialog(true) }}>View/Edit Minutes</Button>
                        ) : (
                          <Button size="small" onClick={() => { setActiveMeeting(m); setMinuteText(''); setMinuteDialog(true) }}>Add Minutes</Button>
                        )}
                        <Button size="small" onClick={() => { setActiveMeeting(m); setDecisionForm({ title: '', description: '', owner: '', dueDate: '' }); setDecisionDialog(true) }}>Add Decision</Button>
                      </Box>
                      {m.decisions.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" fontWeight={600}>{m.decisions.length} Decision(s):</Typography>
                          {m.decisions.map((d, i) => (
                            <Paper key={i} variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'grey.50' }}>
                              <Typography variant="caption" fontWeight={600}>{d.title}</Typography>
                              {d.description && <Typography variant="caption" display="block" color="text.secondary">{d.description}</Typography>}
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {d.owner && <Typography variant="caption" color="text.secondary">Owner: {d.owner}</Typography>}
                                {d.dueDate && <Typography variant="caption" color="text.secondary">Due: {formatDate(d.dueDate)}</Typography>}
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Create/Edit Board Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBoard ? 'Edit Board' : 'Create Board/Committee'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={formData.type} label="Type" onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {boardService.types.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Category</InputLabel>
                <Select value={formData.category} label="Category" onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {boardService.categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Meeting Frequency" value={formData.meetingFrequency} onChange={e => setFormData({ ...formData, meetingFrequency: e.target.value })} placeholder="e.g. Monthly, Quarterly" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Quorum" type="number" value={formData.quorum} onChange={e => setFormData({ ...formData, quorum: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Term Length (months)" type="number" value={formData.termLength} onChange={e => setFormData({ ...formData, termLength: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Tags" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="comma-separated" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Charter" multiline rows={2} value={formData.charter} onChange={e => setFormData({ ...formData, charter: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Mission Statement" multiline rows={2} value={formData.mission} onChange={e => setFormData({ ...formData, mission: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editingBoard ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberDialog} onClose={() => setMemberDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="User ID" required value={memberForm.userId} onChange={e => setMemberForm({ ...memberForm, userId: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Role</InputLabel>
                <Select value={memberForm.role} label="Role" onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}>
                  {boardService.memberRoles.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Position/Title" value={memberForm.position} onChange={e => setMemberForm({ ...memberForm, position: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember}>Add Member</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={meetingDialog} onClose={() => setMeetingDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Schedule Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" required value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Date & Time" type="datetime-local" value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Location" value={meetingForm.location} onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetingDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMeeting}>Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Minutes Dialog */}
      <Dialog open={minuteDialog} onClose={() => setMinuteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Meeting Minutes — {activeMeeting?.title}</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={8} value={minuteText} onChange={e => setMinuteText(e.target.value)}
            placeholder="Enter meeting minutes..." sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMinuteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMinutes}>Save Minutes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Decision Dialog */}
      <Dialog open={decisionDialog} onClose={() => setDecisionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Resolution — {activeMeeting?.title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" required value={decisionForm.title} onChange={e => setDecisionForm({ ...decisionForm, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={3} value={decisionForm.description} onChange={e => setDecisionForm({ ...decisionForm, description: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Owner" value={decisionForm.owner} onChange={e => setDecisionForm({ ...decisionForm, owner: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Due Date" type="date" value={decisionForm.dueDate} onChange={e => setDecisionForm({ ...decisionForm, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddDecision}>Add Resolution</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default BoardManagement
