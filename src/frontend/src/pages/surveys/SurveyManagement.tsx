import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Alert, Snackbar, Tooltip, FormControl, InputLabel, LinearProgress,
  Switch, FormControlLabel, Tabs, Tab, Divider,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as VisibilityIcon, Publish as PublishIcon,
  Search as SearchIcon, Poll as PollIcon, Quiz as QuizIcon,
  ArrowUpward, ArrowDownward,
} from '@mui/icons-material'
import surveyService, { Survey, SurveyStats, SurveyResults, Question } from '../../services/surveyService'

const statusConfig: Record<string, { label: string; color: 'default' | 'success' | 'error' }> = {
  draft: { label: 'Draft', color: 'default' },
  published: { label: 'Published', color: 'success' },
  closed: { label: 'Closed', color: 'error' },
  archived: { label: 'Archived', color: 'default' },
}

const categoryLabels: Record<string, string> = {
  compliance: 'Compliance', risk_assessment: 'Risk Assessment', audit: 'Audit',
  training: 'Training', employee: 'Employee', customer: 'Customer',
  vendor: 'Vendor', security: 'Security', other: 'Other',
}

const SurveyManagement = () => {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '', category: 'other', department: '', targetAudience: '', closeDate: '', tags: '', anonymous: false, requireLogin: true })
  const [questionDialog, setQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ type: 'text', title: '', description: '', required: false, options: '', defaultValue: '', validationMin: '', validationMax: '' })
  const [results, setResults] = useState<SurveyResults | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const fetchSurveys = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterStatus) filters.status = filterStatus
      if (searchQuery) filters.search = searchQuery
      const data = await surveyService.getAll(filters)
      setSurveys(data)
      const s = await surveyService.getStats()
      setStats(s)
    } catch { setSnackbar({ open: true, message: 'Failed to load surveys', severity: 'error' }) }
    finally { setLoading(false) }
  }, [filterStatus, searchQuery])

  useEffect(() => { fetchSurveys() }, [fetchSurveys])

  const fetchResults = async (survey: Survey) => {
    try {
      const r = await surveyService.getResults(survey.id)
      setResults(r)
    } catch { setResults(null) }
  }

  const selectSurvey = (survey: Survey) => {
    setActiveSurvey(survey)
    setTab(1)
    fetchResults(survey)
  }

  const handleCreate = () => {
    setEditingSurvey(null)
    setFormData({ title: '', description: '', category: 'other', department: '', targetAudience: '', closeDate: '', tags: '', anonymous: false, requireLogin: true })
    setDialogOpen(true)
  }

  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey)
    setFormData({
      title: survey.title, description: survey.description || '', category: survey.category,
      department: survey.department || '', targetAudience: survey.targetAudience || '',
      closeDate: survey.closeDate || '', tags: (survey.tags || []).join(', '),
      anonymous: survey.anonymous, requireLogin: survey.requireLogin,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    try {
      const data = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (editingSurvey) await surveyService.update(editingSurvey.id, data)
      else await surveyService.create(data)
      setDialogOpen(false)
      fetchSurveys()
      setSnackbar({ open: true, message: editingSurvey ? 'Survey updated' : 'Survey created', severity: 'success' })
    } catch { setSnackbar({ open: true, message: 'Failed to save', severity: 'error' }) }
  }

  const handlePublish = async (id: string) => {
    try { await surveyService.updateStatus(id, 'published'); fetchSurveys(); setSnackbar({ open: true, message: 'Survey published!', severity: 'success' }) }
    catch { setSnackbar({ open: true, message: 'Failed to publish', severity: 'error' }) }
  }

  const handleClose = async (id: string) => {
    try { await surveyService.updateStatus(id, 'closed'); fetchSurveys(); setSnackbar({ open: true, message: 'Survey closed', severity: 'success' }) }
    catch { setSnackbar({ open: true, message: 'Failed to close', severity: 'error' }) }
  }

  // Question builder
  const openQuestionDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question)
      setQForm({
        type: question.type, title: question.title, description: question.description || '',
        required: question.required, options: (question.options || []).join('\n'),
        defaultValue: question.defaultValue || '',
        validationMin: question.validation?.min?.toString() || '',
        validationMax: question.validation?.max?.toString() || '',
      })
    } else {
      setEditingQuestion(null)
      setQForm({ type: 'text', title: '', description: '', required: false, options: '', defaultValue: '', validationMin: '', validationMax: '' })
    }
    setQuestionDialog(true)
  }

  const handleQuestionSubmit = async () => {
    if (!qForm.title.trim() || !activeSurvey) return
    try {
      const options = ['multiple_choice', 'single_choice'].includes(qForm.type) ? qForm.options.split('\n').map(s => s.trim()).filter(Boolean) : null
      const validation: any = {}
      if (qForm.validationMin) validation.min = parseInt(qForm.validationMin)
      if (qForm.validationMax) validation.max = parseInt(qForm.validationMax)
      const question = {
        type: qForm.type, title: qForm.title.trim(), description: qForm.description || null,
        required: qForm.required, options: options?.length ? options : null,
        defaultValue: qForm.defaultValue || null,
        validation: Object.keys(validation).length ? validation : null,
      }
      if (editingQuestion) {
        await surveyService.updateQuestion(activeSurvey.id, editingQuestion.id, question)
      } else {
        await surveyService.addQuestion(activeSurvey.id, question)
      }
      setQuestionDialog(false)
      const updated = await surveyService.getById(activeSurvey.id)
      setActiveSurvey(updated)
      setSnackbar({ open: true, message: editingQuestion ? 'Question updated' : 'Question added', severity: 'success' })
    } catch { setSnackbar({ open: true, message: 'Failed to save question', severity: 'error' }) }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!activeSurvey) return
    try {
      await surveyService.deleteQuestion(activeSurvey.id, questionId)
      const updated = await surveyService.getById(activeSurvey.id)
      setActiveSurvey(updated)
      setSnackbar({ open: true, message: 'Question deleted', severity: 'success' })
    } catch { setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' }) }
  }

  const handleMoveQuestion = async (index: number, direction: -1 | 1) => {
    if (!activeSurvey) return
    const qs = [...activeSurvey.questions]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= qs.length) return
    ;[qs[index], qs[newIndex]] = [qs[newIndex], qs[index]]
    try {
      await surveyService.reorderQuestions(activeSurvey.id, qs.map(q => q.id))
      const updated = await surveyService.getById(activeSurvey.id)
      setActiveSurvey(updated)
    } catch { setSnackbar({ open: true, message: 'Failed to reorder', severity: 'error' }) }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>Survey & Questionnaire</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create surveys, collect responses, and analyse results for compliance assessments, risk evaluations, and stakeholder feedback.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Surveys', value: stats?.total || 0, color: 'primary.main' },
          { label: 'Active (Published)', value: stats?.activePublished || 0, color: 'success.main' },
          { label: 'Total Responses', value: stats?.totalResponses || 0, color: 'info.main' },
        ].map(s => (
          <Grid item xs={4} key={s.label}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color={s.color}>{s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      {/* List / Builder / Results tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ px: 2, pt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" placeholder="Search surveys..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
            </Grid>
            <Grid item xs={4} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {surveyService.statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4} sm={2}>
              <Button fullWidth variant="outlined" onClick={() => { setFilterStatus(''); setSearchQuery('') }}>Clear</Button>
            </Grid>
            <Grid item xs={4} sm={4}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Survey</Button>
            </Grid>
          </Grid>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1, px: 2 }}>
          <Tab label="Survey List" />
          <Tab label="Builder" disabled={!activeSurvey} />
          <Tab label="Results" disabled={!activeSurvey} />
        </Tabs>

        {/* Survey List */}
        {tab === 0 && (
          <TableContainer>
            {loading && <LinearProgress />}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Questions</strong></TableCell>
                  <TableCell><strong>Responses</strong></TableCell>
                  <TableCell><strong>Closes</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {surveys.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{loading ? 'Loading...' : 'No surveys yet'}</Typography>
                  </TableCell></TableRow>
                ) : surveys.map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PollIcon fontSize="small" color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                          {s.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Chip size="small" label={categoryLabels[s.category] || s.category} /></TableCell>
                    <TableCell><Chip size="small" label={statusConfig[s.status]?.label || s.status} color={statusConfig[s.status]?.color || 'default'} variant="outlined" /></TableCell>
                    <TableCell><Typography variant="body2">{s.questions.length}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{s.totalResponses}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{formatDate(s.closeDate)}</Typography></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Open"><IconButton size="small" onClick={() => selectSurvey(s)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      {s.status === 'draft' && <Tooltip title="Publish"><IconButton size="small" color="success" onClick={() => handlePublish(s.id)}><PublishIcon fontSize="small" /></IconButton></Tooltip>}
                      {s.status === 'published' && <Tooltip title="Close"><IconButton size="small" color="error" onClick={() => handleClose(s.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Builder */}
        {tab === 1 && activeSurvey && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">{activeSurvey.title}</Typography>
                <Typography variant="body2" color="text.secondary">{activeSurvey.questions.length} questions · {activeSurvey.totalResponses} responses</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {activeSurvey.status === 'draft' && (
                  <Button variant="contained" color="success" onClick={() => handlePublish(activeSurvey.id)}>
                    Publish Survey
                  </Button>
                )}
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => openQuestionDialog()}>
                  Add Question
                </Button>
              </Box>
            </Box>

            {activeSurvey.questions.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
                <QuizIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">No questions yet. Add your first question to build the survey.</Typography>
              </Paper>
            ) : (
              activeSurvey.questions.map((q, i) => (
                <Paper key={q.id} variant="outlined" sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleMoveQuestion(i, -1)} disabled={i === 0}><ArrowUpward fontSize="small" /></IconButton>
                    <Typography variant="caption" fontWeight={700}>{i + 1}</Typography>
                    <IconButton size="small" onClick={() => handleMoveQuestion(i, 1)} disabled={i === activeSurvey.questions.length - 1}><ArrowDownward fontSize="small" /></IconButton>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip size="small" label={q.type.replace(/_/g, ' ')} variant="outlined" />
                      {q.required && <Chip size="small" label="Required" color="error" variant="outlined" sx={{ height: 20 }} />}
                    </Box>
                    <Typography variant="body2" fontWeight={600}>{q.title}</Typography>
                    {q.description && <Typography variant="caption" color="text.secondary">{q.description}</Typography>}
                    {q.options && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        {q.options.map(o => <Chip key={o} label={o} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />)}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => openQuestionDialog(q)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteQuestion(q.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        )}

        {/* Results */}
        {tab === 2 && activeSurvey && results && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">{activeSurvey.title} — Results</Typography>
              <Typography variant="body2" color="text.secondary">{results.totalResponses} total responses</Typography>
            </Box>
            {results.questions.map(q => (
              <Paper key={q.questionId} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>{q.title}</Typography>
                {'optionCounts' in q && q.optionCounts && (
                  <Box>
                    {Object.entries(q.optionCounts).map(([opt, count]) => {
                      const total = Object.values(q.optionCounts!).reduce((s, v) => s + v, 0)
                      const pct = total > 0 ? Math.round((count as number) / total * 100) : 0
                      return (
                        <Box key={opt} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ minWidth: 200 }}>{opt}</Typography>
                          <Box sx={{ flexGrow: 1, bgcolor: 'grey.200', borderRadius: 1, height: 20 }}>
                            <Box sx={{ bgcolor: 'primary.main', width: `${pct}%`, height: 20, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="caption" color="white" fontWeight={700}>{pct}%</Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 30 }}>{count as number}</Typography>
                        </Box>
                      )
                    })}
                  </Box>
                )}
                {'average' in q && q.average !== undefined && (
                  <Box>
                    <Typography variant="h5" color="primary" fontWeight={700}>{q.average} / 5</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      {[1, 2, 3, 4, 5].map(v => (
                        <Box key={v} sx={{
                          width: 40, height: 40, borderRadius: 1,
                          bgcolor: q.distribution?.includes(v) ? 'primary.main' : 'grey.200',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Typography variant="caption" color={q.distribution?.includes(v) ? 'white' : 'text.secondary'}>{v}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                {'responses' in q && Array.isArray(q.responses) && q.responses.length > 0 && (
                  <Box>
                    {q.responses.slice(0, 5).map((r, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 1, mb: 0.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">{String(r) || '(empty)'}</Typography>
                      </Paper>
                    ))}
                    {q.responses.length > 5 && <Typography variant="caption" color="text.secondary">+{q.responses.length - 5} more</Typography>}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Create/Edit Survey Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSurvey ? 'Edit Survey' : 'Create Survey'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" required value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Category</InputLabel>
                <Select value={formData.category} label="Category" onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {surveyService.categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Department" value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Target Audience" value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Close Date" type="date" value={formData.closeDate}
                onChange={e => setFormData({ ...formData, closeDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Tags (comma-separated)" value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={formData.anonymous} onChange={e => setFormData({ ...formData, anonymous: e.target.checked })} />} label="Anonymous" />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={formData.requireLogin} onChange={e => setFormData({ ...formData, requireLogin: e.target.checked })} />} label="Require Login" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editingSurvey ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialog} onClose={() => setQuestionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={qForm.type} label="Type" onChange={e => setQForm({ ...qForm, type: e.target.value })}>
                  {surveyService.questionTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Question Title" required value={qForm.title}
                onChange={e => setQForm({ ...qForm, title: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description / Help Text" value={qForm.description}
                onChange={e => setQForm({ ...qForm, description: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={qForm.required} onChange={e => setQForm({ ...qForm, required: e.target.checked })} />} label="Required" />
            </Grid>
            {['multiple_choice', 'single_choice'].includes(qForm.type) && (
              <Grid item xs={12}>
                <TextField fullWidth label="Options (one per line)" multiline rows={4} value={qForm.options}
                  onChange={e => setQForm({ ...qForm, options: e.target.value })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3" />
              </Grid>
            )}
            {qForm.type === 'rating' && (
              <Grid item xs={6}>
                <TextField fullWidth label="Max Rating" type="number" value={qForm.validationMax}
                  onChange={e => setQForm({ ...qForm, validationMax: e.target.value })} />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuestionSubmit}>{editingQuestion ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default SurveyManagement
