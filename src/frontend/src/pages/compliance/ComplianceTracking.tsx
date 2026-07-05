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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
  Alert,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material'

import { complianceService, ComplianceItem } from '../../services/complianceService'
import ComplianceDashboard from '../../components/ComplianceDashboard'
import { exportCSV } from '../../utils/exportUtils'

interface ComplianceForm {
  title: string
  description: string
  regulationSource: string
  regulationSection: string
  category: string
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed' | 'under_review'
  department: string
  ownerId: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  effectiveDate: string
  reviewFrequency: string
  lastReviewedAt: string
  nextReviewDate: string
  penaltyForNonCompliance: string
  tags: string
}

const emptyForm: ComplianceForm = {
  title: '',
  description: '',
  regulationSource: '',
  regulationSection: '',
  category: '',
  status: 'not_assessed',
  department: '',
  ownerId: '',
  priority: 'medium',
  effectiveDate: '',
  reviewFrequency: '',
  lastReviewedAt: '',
  nextReviewDate: '',
  penaltyForNonCompliance: '',
  tags: '',
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'compliant': return '#4CAF50'
    case 'non_compliant': return '#F44336'
    case 'partial': return '#FF9800'
    case 'under_review': return '#2196F3'
    case 'not_assessed': return '#9E9E9E'
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

const getOwnerDisplay = (item: ComplianceItem): string => {
  if (!item.owner) return '-'
  if (typeof item.owner === 'string') return String(item.owner)
  return `${item.owner.firstName || ''} ${item.owner.lastName || ''}`.trim() || item.ownerId?.substring(0, 8) + '...' || '-'
}

const ComplianceTracking = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingItem, setViewingItem] = useState<ComplianceItem | null>(null)
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dashboardView, setDashboardView] = useState(false)
  const [formData, setFormData] = useState<ComplianceForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await complianceService.getComplianceItems()
        setItems(data)
      } catch {
        // Keep empty state if API fails
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const handleOpenDialog = () => {
    setSelectedItemId(null)
    setFormData(emptyForm)
    setError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setError('')
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.category) {
      setError('Please fill in all required fields (Title, Category)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description || undefined,
        regulationSource: formData.regulationSource || undefined,
        regulationSection: formData.regulationSection || undefined,
        category: formData.category,
        status: formData.status,
        department: formData.department || 'General',
        priority: formData.priority,
      }
      if (formData.ownerId) payload.ownerId = formData.ownerId
      if (formData.effectiveDate) payload.effectiveDate = formData.effectiveDate
      if (formData.reviewFrequency) payload.reviewFrequency = formData.reviewFrequency
      if (formData.lastReviewedAt) payload.lastReviewedAt = formData.lastReviewedAt
      if (formData.nextReviewDate) payload.nextReviewDate = formData.nextReviewDate
      if (formData.penaltyForNonCompliance) payload.penaltyForNonCompliance = formData.penaltyForNonCompliance
      if (formData.tags) payload.tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)

      const newItem = await complianceService.createComplianceItem(payload as any)
      setItems(prev => [newItem, ...prev])
      handleCloseDialog()
    } catch (err: any) {
      setError(err.message || 'Failed to create compliance item')
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, itemId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedItemId(itemId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedItemId(null)
  }

  const handleView = () => {
    const item = items.find(i => i.id === selectedItemId)
    if (item) {
      setViewingItem(item)
      setOpenViewDialog(true)
    }
    handleMenuClose()
  }

  const handleEdit = () => {
    const item = items.find(i => i.id === selectedItemId)
    if (item) {
      setFormData({
        title: item.title,
        description: item.description || '',
        regulationSource: item.regulationSource || '',
        regulationSection: item.regulationSection || '',
        category: item.category,
        status: item.status,
        department: item.department || '',
        ownerId: item.ownerId || '',
        priority: item.priority || 'medium',
        effectiveDate: item.effectiveDate || '',
        reviewFrequency: item.reviewFrequency || '',
        lastReviewedAt: item.lastReviewedAt || '',
        nextReviewDate: item.nextReviewDate || '',
        penaltyForNonCompliance: item.penaltyForNonCompliance || '',
        tags: (item.tags || []).join(', '),
      })
      setSelectedItemId(item.id)
      setOpenDialog(true)
    }
    handleMenuClose()
  }

  const handleDelete = async () => {
    const itemId = selectedItemId
    handleMenuClose()
    if (!itemId) return
    try {
      await complianceService.deleteComplianceItem(itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete compliance item')
    }
  }

  const filteredItems = searchQuery
    ? items.filter(i =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.regulationSource || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        getOwnerDisplay(i).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  // Stats derived from actual data
  const totalItems = items.length
  const compliantCount = items.filter(i => i.status === 'compliant').length
  const nonCompliantCount = items.filter(i => i.status === 'non_compliant').length
  const pendingCount = items.filter(i => i.status === 'partial' || i.status === 'under_review' || i.status === 'not_assessed').length

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography>Loading compliance data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Compliance Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage regulatory compliance requirements
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Requirement
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Total Requirements</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Compliant</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>{compliantCount}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  {totalItems > 0 ? Math.round((compliantCount / totalItems) * 100) + '%' : 'No items'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Non-Compliant</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#F44336' }}>{nonCompliantCount}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 600 }}>Requires Attention</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Pending / Not Assessed</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>{pendingCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search compliance items..."
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
        <IconButton><FilterIcon /></IconButton>
        <Button
          variant={dashboardView ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setDashboardView(!dashboardView)}
          sx={{ minWidth: 140 }}
        >
          {dashboardView ? 'Requirements Table' : 'Compliance Dashboard'}
        </Button>
      </Box>

      {/* Compliance Dashboard */}
      {dashboardView && (
        <Box sx={{ mb: 3 }}>
          <ComplianceDashboard onExport={() => exportCSV('compliance-report', ['Regulation', 'Status', 'Department', 'Owner'], items, i => [i.regulationSource || '-', i.status, i.department || '-', getOwnerDisplay(i)])} />
        </Box>
      )}

      {/* Compliance Table */}
      {!dashboardView && (
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Regulation</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Last Reviewed</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated: {formatDate(item.updatedAt || item.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GavelIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                        <Typography variant="body2">
                          {item.regulationSource || '-'}
                          {item.regulationSection ? ` §${item.regulationSection}` : ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(item.status)}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(item.status)}15`,
                          color: getStatusColor(item.status),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.department || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{getOwnerDisplay(item)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(item.lastReviewedAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, item.id)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No compliance items found. Click "Add Requirement" to create one.
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
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
      )}

      {/* Item Menu */}
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

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedItemId ? 'Edit Compliance Requirement' : 'Add Compliance Requirement'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth required label="Title" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter compliance requirement title"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Description" multiline rows={3} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the compliance requirement"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Regulation Source" value={formData.regulationSource}
                  onChange={(e) => setFormData({ ...formData, regulationSource: e.target.value })}
                  placeholder="e.g., POPIA, FICA, GDPR"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Regulation Section" value={formData.regulationSection}
                  onChange={(e) => setFormData({ ...formData, regulationSection: e.target.value })}
                  placeholder="e.g., Section 14"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value=""><em>Select category</em></MenuItem>
                    <MenuItem value="data_protection">Data Protection</MenuItem>
                    <MenuItem value="privacy">Privacy</MenuItem>
                    <MenuItem value="financial">Financial</MenuItem>
                    <MenuItem value="operational">Operational</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="legal">Legal</MenuItem>
                    <MenuItem value="environmental">Environmental</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <MenuItem value="compliant">Compliant</MenuItem>
                    <MenuItem value="non_compliant">Non-Compliant</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="under_review">Under Review</MenuItem>
                    <MenuItem value="not_assessed">Not Assessed</MenuItem>
                  </Select>
                </FormControl>
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
                    <MenuItem value="Legal">Legal</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                    <MenuItem value="Compliance">Compliance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Owner ID" value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  placeholder="User ID"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Effective Date" type="date" value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Review Frequency" value={formData.reviewFrequency}
                  onChange={(e) => setFormData({ ...formData, reviewFrequency: e.target.value })}
                  placeholder="e.g., quarterly, annually"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Last Reviewed" type="date" value={formData.lastReviewedAt}
                  onChange={(e) => setFormData({ ...formData, lastReviewedAt: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Next Review Date" type="date" value={formData.nextReviewDate}
                  onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Penalty for Non-Compliance" multiline rows={2} value={formData.penaltyForNonCompliance}
                  onChange={(e) => setFormData({ ...formData, penaltyForNonCompliance: e.target.value })}
                  placeholder="Describe potential penalties"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Tags" value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Comma-separated tags: privacy, gdpr, critical"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Saving...' : selectedItemId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Compliance Item Details</DialogTitle>
        <DialogContent>
          {viewingItem && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{viewingItem.title}</Typography>
                </Grid>
                {viewingItem.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{viewingItem.description}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Regulation Source</Typography>
                  <Typography variant="body1">{viewingItem.regulationSource || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Regulation Section</Typography>
                  <Typography variant="body1">{viewingItem.regulationSection || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body1"><Chip label={viewingItem.category} size="small" /></Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={formatStatus(viewingItem.status)}
                      size="small"
                      sx={{ bgcolor: `${getStatusColor(viewingItem.status)}15`, color: getStatusColor(viewingItem.status) }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{viewingItem.department || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Priority</Typography>
                  <Typography variant="body1">{viewingItem.priority ? formatStatus(viewingItem.priority) : '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Owner</Typography>
                  <Typography variant="body1">{getOwnerDisplay(viewingItem)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Effective Date</Typography>
                  <Typography variant="body1">{formatDate(viewingItem.effectiveDate)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Review Frequency</Typography>
                  <Typography variant="body1">{viewingItem.reviewFrequency || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Last Reviewed</Typography>
                  <Typography variant="body1">{formatDate(viewingItem.lastReviewedAt)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Next Review</Typography>
                  <Typography variant="body1">{formatDate(viewingItem.nextReviewDate)}</Typography>
                </Grid>
                {viewingItem.penaltyForNonCompliance && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Penalty for Non-Compliance</Typography>
                    <Typography variant="body1">{viewingItem.penaltyForNonCompliance}</Typography>
                  </Grid>
                )}
                {viewingItem.tags && viewingItem.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">Tags</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {viewingItem.tags.map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" variant="outlined" />
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
    </Box>
  )
}

export default ComplianceTracking
