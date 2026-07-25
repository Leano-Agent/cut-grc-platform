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
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Archive as ArchiveIcon,
  Publish as PublishIcon,
  Search as SearchIcon,
  Article as ArticleIcon,
} from '@mui/icons-material'
import policyService, { Policy, PolicyStats, PolicyFormData } from '../../services/policyService'

const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }> = {
  draft: { label: 'Draft', color: 'default' },
  under_review: { label: 'Under Review', color: 'warning' },
  approved: { label: 'Approved', color: 'info' },
  published: { label: 'Published', color: 'success' },
  expired: { label: 'Expired', color: 'error' },
  archived: { label: 'Archived', color: 'default' },
}

const categoryLabels: Record<string, string> = {
  information_security: 'Info Security',
  data_privacy: 'Data Privacy',
  acceptable_use: 'Acceptable Use',
  access_control: 'Access Control',
  business_continuity: 'Business Continuity',
  incident_response: 'Incident Response',
  hr: 'HR & Personnel',
  financial: 'Financial',
  compliance: 'Compliance',
  it_governance: 'IT Governance',
  other: 'Other',
}

const emptyForm: PolicyFormData = {
  title: '',
  description: '',
  category: 'other',
  content: '',
  scope: '',
  department: '',
  effectiveDate: '',
  reviewDate: '',
  expiryDate: '',
  tags: [],
  regulatoryReferences: [],
}

const PolicyManagement = () => {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [stats, setStats] = useState<PolicyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [formData, setFormData] = useState<PolicyFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const fetchPolicies = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterCategory) filters.category = filterCategory
      if (filterStatus) filters.status = filterStatus
      if (searchQuery) filters.search = searchQuery

      const data = await policyService.getAll(filters)
      setPolicies(data)
      
      const statsData = await policyService.getStats()
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch policies:', err)
      setSnackbar({ open: true, message: 'Failed to load policies', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus, searchQuery])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleEdit = (policy: Policy) => {
    setEditingId(policy.id)
    setFormData({
      title: policy.title,
      description: policy.description || '',
      category: policy.category,
      content: policy.content || '',
      scope: policy.scope || '',
      department: policy.department || '',
      effectiveDate: policy.effectiveDate || '',
      reviewDate: policy.reviewDate || '',
      expiryDate: policy.expiryDate || '',
      tags: policy.tags || [],
      regulatoryReferences: policy.regulatoryReferences || [],
    })
    setDialogOpen(true)
  }

  const handleView = (policy: Policy) => {
    setSelectedPolicy(policy)
    setDetailDialogOpen(true)
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await policyService.updateStatus(id, newStatus)
      setSnackbar({ open: true, message: `Policy status updated to "${newStatus}"`, severity: 'success' })
      fetchPolicies()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update policy status', severity: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await policyService.delete(id)
      setSnackbar({ open: true, message: 'Policy archived successfully', severity: 'success' })
      fetchPolicies()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to archive policy', severity: 'error' })
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setSnackbar({ open: true, message: 'Policy title is required', severity: 'error' })
      return
    }

    try {
      if (editingId) {
        await policyService.update(editingId, formData)
        setSnackbar({ open: true, message: 'Policy updated successfully', severity: 'success' })
      } else {
        await policyService.create(formData)
        setSnackbar({ open: true, message: 'Policy created successfully', severity: 'success' })
      }
      setDialogOpen(false)
      fetchPolicies()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save policy', severity: 'error' })
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

  const getCategoryChip = (category: string) => {
    return <Chip size="small" label={categoryLabels[category] || category} variant="filled" />
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Policy Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create, manage, and govern organisational policies with version control and approval workflows.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Policies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats?.byStatus?.published || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Published</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats?.needsReview || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Needs Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats?.expiringSoon || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Expiring Soon</Typography>
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
              placeholder="Search policies..."
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
                {policyService.categories.map(c => (
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
                {policyService.statuses.map(s => (
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
              New Policy
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Policy Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Version</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Effective</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading policies...' : 'No policies found. Create your first policy!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              policies.map((policy) => (
                <TableRow key={policy.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ArticleIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {policy.title}
                        </Typography>
                        {policy.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {policy.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getCategoryChip(policy.category)}</TableCell>
                  <TableCell>{getStatusChip(policy.status)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">
                      v{policy.version}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{policy.department || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(policy.effectiveDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => handleView(policy)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(policy)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {policy.status === 'draft' && (
                      <Tooltip title="Send for review">
                        <IconButton size="small" onClick={() => handleStatusChange(policy.id, 'under_review')} color="warning">
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {policy.status === 'under_review' && (
                      <Tooltip title="Approve">
                        <IconButton size="small" onClick={() => handleStatusChange(policy.id, 'approved')} color="info">
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {policy.status === 'approved' && (
                      <Tooltip title="Publish">
                        <IconButton size="small" onClick={() => handleStatusChange(policy.id, 'published')} color="success">
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Archive">
                      <IconButton size="small" onClick={() => handleDelete(policy.id)} color="error">
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
          {editingId ? 'Edit Policy' : 'Create New Policy'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Policy Title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Information Security Policy"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {policyService.categories.map(c => (
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
                placeholder="e.g. IT, HR, Legal"
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scope"
                multiline
                rows={2}
                value={formData.scope || ''}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Who does this policy apply to?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Policy Content (Markdown)"
                multiline
                rows={6}
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter policy content using Markdown..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                value={formData.effectiveDate || ''}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Review Date"
                type="date"
                value={formData.reviewDate || ''}
                onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
            {editingId ? 'Update Policy' : 'Create Policy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon color="primary" />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{selectedPolicy?.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                v{selectedPolicy?.version} · Created {formatDate(selectedPolicy?.createdAt || null)}
              </Typography>
            </Box>
            {selectedPolicy && getStatusChip(selectedPolicy.status)}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPolicy && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedPolicy.description || 'No description provided.'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body2">{categoryLabels[selectedPolicy.category] || selectedPolicy.category}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body2">{selectedPolicy.department || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Effective Date</Typography>
                <Typography variant="body2">{formatDate(selectedPolicy.effectiveDate)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Review Date</Typography>
                <Typography variant="body2">{formatDate(selectedPolicy.reviewDate)}</Typography>
              </Grid>
              {selectedPolicy.tags && selectedPolicy.tags.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedPolicy.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
              {selectedPolicy.regulatoryReferences && selectedPolicy.regulatoryReferences.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Regulatory References</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedPolicy.regulatoryReferences.map(ref => (
                      <Chip key={ref} label={ref} size="small" color="info" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
              {selectedPolicy.content && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Content</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {selectedPolicy.content}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedPolicy && (selectedPolicy.status === 'draft' || selectedPolicy.status === 'under_review' || selectedPolicy.status === 'approved') && (
            <>
              {policyService.getValidTransitions(selectedPolicy.status).map(t => (
                <Button
                  key={t.value}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    handleStatusChange(selectedPolicy.id, t.value)
                    setDetailDialogOpen(false)
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </>
          )}
          {selectedPolicy && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailDialogOpen(false)
                handleEdit(selectedPolicy)
              }}
            >
              Edit
            </Button>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
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

export default PolicyManagement
