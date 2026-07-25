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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Cloud as CloudIcon,
  Computer as ComputerIcon,
  Person as PersonIcon,
  Work as WorkIcon,
} from '@mui/icons-material'
import vendorService, { Vendor, VendorStats, VendorFormData, AssessmentFormData } from '../../services/vendorService'

const categoryConfig: Record<string, { label: string; color: 'error' | 'warning' | 'info' | 'success' }> = {
  critical: { label: 'Critical', color: 'error' },
  high: { label: 'High', color: 'warning' },
  medium: { label: 'Medium', color: 'info' },
  low: { label: 'Low', color: 'success' },
}

const assessmentStatusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }> = {
  not_assessed: { label: 'Not Assessed', color: 'default' },
  in_progress: { label: 'In Progress', color: 'warning' },
  assessed: { label: 'Assessed', color: 'success' },
  expired: { label: 'Expired', color: 'error' },
}

const statusConfig: Record<string, { label: string; color: 'success' | 'default' | 'warning' | 'error' }> = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'default' },
  under_review: { label: 'Under Review', color: 'warning' },
  blacklisted: { label: 'Blacklisted', color: 'error' },
}

const vendorTypeIcons: Record<string, React.ReactNode> = {
  software: <ComputerIcon fontSize="small" />,
  hardware: <ComputerIcon fontSize="small" />,
  cloud_service: <CloudIcon fontSize="small" />,
  consultant: <PersonIcon fontSize="small" />,
  contractor: <WorkIcon fontSize="small" />,
  other: <BusinessIcon fontSize="small" />,
}

const emptyForm: VendorFormData = {
  name: '',
  description: '',
  category: 'medium',
  vendorType: 'other',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  serviceDescription: '',
  contractValue: undefined,
  contractStart: '',
  contractEnd: '',
  certifications: [],
  notes: '',
  tags: [],
}

const emptyAssessment: AssessmentFormData = {
  cyberScore: 3,
  complianceScore: 3,
  assessmentDate: new Date().toISOString().split('T')[0],
  nextAssessmentDate: '',
}

const VendorManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState<VendorFormData>(emptyForm)
  const [assessmentData, setAssessmentData] = useState<AssessmentFormData>(emptyAssessment)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterCategory) filters.category = filterCategory
      if (filterStatus) filters.status = filterStatus
      if (searchQuery) filters.search = searchQuery

      const data = await vendorService.getAll(filters)
      setVendors(data)

      const statsData = await vendorService.getStats()
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
      setSnackbar({ open: true, message: 'Failed to load vendors', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus, searchQuery])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingId(vendor.id)
    setFormData({
      name: vendor.name,
      description: vendor.description || '',
      category: vendor.category,
      vendorType: vendor.vendorType,
      contactName: vendor.contactName || '',
      contactEmail: vendor.contactEmail || '',
      contactPhone: vendor.contactPhone || '',
      serviceDescription: vendor.serviceDescription || '',
      contractValue: vendor.contractValue || undefined,
      contractStart: vendor.contractStart || '',
      contractEnd: vendor.contractEnd || '',
      certifications: vendor.certifications || [],
      notes: vendor.notes || '',
      tags: vendor.tags || [],
    })
    setDialogOpen(true)
  }

  const handleView = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setDetailDialogOpen(true)
  }

  const handleAssess = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setAssessmentData({
      cyberScore: vendor.cyberScore || 3,
      complianceScore: vendor.complianceScore || 3,
      assessmentDate: vendor.lastAssessmentDate || new Date().toISOString().split('T')[0],
      nextAssessmentDate: vendor.nextAssessmentDate || '',
    })
    setAssessmentDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await vendorService.delete(id)
      setSnackbar({ open: true, message: 'Vendor blacklisted successfully', severity: 'success' })
      fetchVendors()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to blacklist vendor', severity: 'error' })
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Vendor name is required', severity: 'error' })
      return
    }

    try {
      if (editingId) {
        await vendorService.update(editingId, formData)
        setSnackbar({ open: true, message: 'Vendor updated successfully', severity: 'success' })
      } else {
        await vendorService.create(formData)
        setSnackbar({ open: true, message: 'Vendor created successfully', severity: 'success' })
      }
      setDialogOpen(false)
      fetchVendors()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save vendor', severity: 'error' })
    }
  }

  const handleAssessmentSubmit = async () => {
    if (!selectedVendor) return

    try {
      await vendorService.assess(selectedVendor.id, assessmentData)
      setSnackbar({ open: true, message: 'Vendor assessment completed', severity: 'success' })
      setAssessmentDialogOpen(false)
      fetchVendors()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to submit assessment', severity: 'error' })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—'
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value)
  }

  const getRiskChip = (riskScore: number | null) => {
    const info = vendorService.getRiskInfo(riskScore)
    return <Chip size="small" label={info.label} sx={{ backgroundColor: info.color, color: '#fff', fontWeight: 600 }} />
  }

  const getCategoryChip = (category: string) => {
    const config = categoryConfig[category] || { label: category, color: 'default' as const }
    return <Chip size="small" label={config.label} color={config.color} variant="filled" />
  }

  const getStatusChip = (status: string) => {
    const config = statusConfig[status] || { label: status, color: 'default' as const }
    return <Chip size="small" label={config.label} color={config.color} variant="outlined" />
  }

  const getAssessmentChip = (status: string) => {
    const config = assessmentStatusConfig[status] || { label: status, color: 'default' as const }
    return <Chip size="small" label={config.label} color={config.color} variant="outlined" />
  }

  const getTagChip = (tag: string) => (
    <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
  )

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Vendor Risk Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage third-party vendors, assess cyber and compliance risk, and track vendor lifecycles.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Vendors</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats?.byCategory?.critical || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Critical</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats?.assessed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Assessed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats?.expired || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Expired</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats?.notAssessed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Not Assessed</Typography>
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
              placeholder="Search vendors..."
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
                {vendorService.categories.map(c => (
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
                {vendorService.statuses.map(s => (
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
              New Vendor
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Vendor Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Vendor</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Risk Score</strong></TableCell>
              <TableCell><strong>Assessment</strong></TableCell>
              <TableCell><strong>Contract</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading vendors...' : 'No vendors found. Register your first vendor!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {vendorTypeIcons[vendor.vendorType] || <BusinessIcon fontSize="small" color="primary" />}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {vendor.name}
                        </Typography>
                        {vendor.contactName && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {vendor.contactName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getCategoryChip(vendor.category)}</TableCell>
                  <TableCell>{getStatusChip(vendor.status)}</TableCell>
                  <TableCell>{getRiskChip(vendor.riskScore)}</TableCell>
                  <TableCell>{getAssessmentChip(vendor.assessmentStatus)}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {vendor.contractStart ? formatDate(vendor.contractStart) : '—'}
                      {vendor.contractEnd ? ` → ${formatDate(vendor.contractEnd)}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => handleView(vendor)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(vendor)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Assess">
                      <IconButton size="small" onClick={() => handleAssess(vendor)} color="primary">
                        <AssessmentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {vendor.status !== 'blacklisted' && (
                      <Tooltip title="Blacklist">
                        <IconButton size="small" onClick={() => handleDelete(vendor.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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
          {editingId ? 'Edit Vendor' : 'Register New Vendor'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vendor Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cloud Infrastructure Provider"
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
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {vendorService.categories.map(c => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vendor Type</InputLabel>
                <Select
                  value={formData.vendorType}
                  label="Vendor Type"
                  onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                >
                  {vendorService.vendorTypes.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.contactName || ''}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                Service & Contract Details
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Description"
                multiline
                rows={2}
                value={formData.serviceDescription || ''}
                onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contract Value (ZAR)"
                type="number"
                value={formData.contractValue || ''}
                onChange={(e) => setFormData({ ...formData, contractValue: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contract Start"
                type="date"
                value={formData.contractStart || ''}
                onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contract End"
                type="date"
                value={formData.contractEnd || ''}
                onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={(formData.tags || []).join(', ')}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="cloud, infrastructure, critical"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certifications (comma-separated)"
                value={(formData.certifications || []).join(', ')}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
                placeholder="ISO 27001, SOC 2, POPIA Compliant"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingId ? 'Update Vendor' : 'Create Vendor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onClose={() => setAssessmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="primary" />
            <span>Vendor Assessment — {selectedVendor?.name}</span>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedVendor && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Assess the vendor's cybersecurity posture and compliance standing. Scores range from 1 (poor) to 5 (excellent).
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cyber Score (1-5)"
                  type="number"
                  value={assessmentData.cyberScore}
                  onChange={(e) => setAssessmentData({ ...assessmentData, cyberScore: Math.min(5, Math.max(1, Number(e.target.value))) })}
                  inputProps={{ min: 1, max: 5 }}
                  helperText="Cybersecurity maturity rating"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Compliance Score (1-5)"
                  type="number"
                  value={assessmentData.complianceScore}
                  onChange={(e) => setAssessmentData({ ...assessmentData, complianceScore: Math.min(5, Math.max(1, Number(e.target.value))) })}
                  inputProps={{ min: 1, max: 5 }}
                  helperText="Compliance & regulatory rating"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Assessment Date"
                  type="date"
                  value={assessmentData.assessmentDate}
                  onChange={(e) => setAssessmentData({ ...assessmentData, assessmentDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Next Assessment Date"
                  type="date"
                  value={assessmentData.nextAssessmentDate}
                  onChange={(e) => setAssessmentData({ ...assessmentData, nextAssessmentDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Current Risk Score:</strong>{' '}
                    {selectedVendor.riskScore !== null ? selectedVendor.riskScore + '/5' : 'Not yet assessed'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Current Assessment:</strong>{' '}
                    {selectedVendor.assessmentStatus.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Contract Value:</strong> {formatCurrency(selectedVendor.contractValue)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleAssessmentSubmit} startIcon={<AssessmentIcon />}>
            Submit Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            <span>{selectedVendor?.name}</span>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedVendor && (
            <Box>
              {/* Summary Row */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {getCategoryChip(selectedVendor.category)}
                {getStatusChip(selectedVendor.status)}
                {getAssessmentChip(selectedVendor.assessmentStatus)}
                {getRiskChip(selectedVendor.riskScore)}
                <Chip
                  size="small"
                  icon={vendorTypeIcons[selectedVendor.vendorType] || <BusinessIcon />}
                  label={vendorService.vendorTypes.find(t => t.value === selectedVendor.vendorType)?.label || selectedVendor.vendorType}
                  variant="outlined"
                />
              </Box>

              {selectedVendor.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {selectedVendor.description}
                </Typography>
              )}

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Contact Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography variant="body2">{selectedVendor.contactName || '—'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body2">{selectedVendor.contactEmail || '—'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body2">{selectedVendor.contactPhone || '—'}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Service & Contract</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Service Description</Typography>
                      <Typography variant="body2">{selectedVendor.serviceDescription || '—'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Contract Value</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatCurrency(selectedVendor.contractValue)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Start Date</Typography>
                      <Typography variant="body2">{formatDate(selectedVendor.contractStart)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">End Date</Typography>
                      <Typography variant="body2">{formatDate(selectedVendor.contractEnd)}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Risk Assessment</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Cyber Score</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedVendor.cyberScore !== null ? `${selectedVendor.cyberScore}/5` : 'Not assessed'}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Compliance Score</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedVendor.complianceScore !== null ? `${selectedVendor.complianceScore}/5` : 'Not assessed'}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedVendor.riskScore !== null ? `${selectedVendor.riskScore}/5` : 'Not assessed'}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Typography variant="body2">{getAssessmentChip(selectedVendor.assessmentStatus)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Last Assessment</Typography>
                      <Typography variant="body2">{formatDate(selectedVendor.lastAssessmentDate)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Next Assessment</Typography>
                      <Typography variant="body2">{formatDate(selectedVendor.nextAssessmentDate)}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Certifications & Documents</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption" color="text.secondary">Certifications</Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedVendor.certifications.length > 0 ? (
                      selectedVendor.certifications.map(cert => (
                        <Chip key={cert} label={cert} size="small" color="primary" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">Documents</Typography>
                  {selectedVendor.documents.length > 0 ? (
                    selectedVendor.documents.map((doc, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2">📄 {doc.name}</Typography>
                        <Chip size="small" label={doc.type} variant="outlined" />
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No documents</Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Notes & Tags</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{selectedVendor.notes || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">Tags</Typography>
                  <Box>
                    {selectedVendor.tags.length > 0 ? selectedVendor.tags.map(getTagChip) : <Typography variant="body2" color="text.secondary">No tags</Typography>}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Metadata</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Created By</Typography>
                      <Typography variant="body2">{selectedVendor.createdBy || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Created At</Typography>
                      <Typography variant="body2">{formatDate(selectedVendor.createdAt)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Updated At</Typography>
                      <Typography variant="body2">{formatDate(selectedVendor.updatedAt)}</Typography>
                    </Grid>
                    {Object.keys(selectedVendor.metadata).length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Additional Metadata</Typography>
                        {Object.entries(selectedVendor.metadata).map(([key, value]) => (
                          <Typography key={key} variant="body2">{key}: {String(value)}</Typography>
                        ))}
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedVendor && (
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => { setDetailDialogOpen(false); handleAssess(selectedVendor) }}
            >
              Assess Vendor
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default VendorManagement
