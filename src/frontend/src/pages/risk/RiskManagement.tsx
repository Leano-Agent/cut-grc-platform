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
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'

import { riskService, Risk } from '../../services/riskService'
import HeatMap, { generateSampleHeatMap } from '../../components/HeatMap'

interface RiskForm {
  title: string
  description: string
  category: string
  severity: string
  likelihood: string
  impact: string
  mitigation: string
  department: string
}

const emptyForm: RiskForm = {
  title: '',
  description: '',
  category: '',
  severity: '',
  likelihood: '',
  impact: '',
  mitigation: '',
  department: '',
}

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return '#B71C1C'
    case 'high': return '#F44336'
    case 'medium': return '#FF9800'
    case 'low': return '#4CAF50'
    default: return '#9E9E9E'
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'identified':
    case 'open': return '#F44336'
    case 'assessed':
    case 'in_review': return '#FF9800'
    case 'in_treatment':
    case 'in_progress': return '#2196F3'
    case 'monitoring': return '#9C27B0'
    case 'closed':
    case 'archived': return '#4CAF50'
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

const getOwnerDisplay = (risk: Risk): string => {
  if (!risk.owner) return '-'
  if (typeof risk.owner === 'string') return String(risk.owner)
  return `${risk.owner.firstName || ''} ${risk.owner.lastName || ''}`.trim() || risk.ownerId?.substring(0, 8) + '...' || '-'
}

const RiskManagement = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingRisk, setViewingRisk] = useState<Risk | null>(null)
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [heatMapView, setHeatMapView] = useState(false)
  const [formData, setFormData] = useState<RiskForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const data = await riskService.getRisks()
        setRisks(data)
      } catch {
        // Keep empty state if API fails
      } finally {
        setLoading(false)
      }
    }
    fetchRisks()
  }, [])

  const handleOpenDialog = () => {
    setSelectedRisk(null)
    setFormData(emptyForm)
    setError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setError('')
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.category || !formData.severity) {
      setError('Please fill in all required fields (Title, Category, Severity)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
      }
      if (formData.likelihood) payload.likelihood = formData.likelihood
      if (formData.impact) payload.impactDescription = formData.impact
      if (formData.department) payload.department = formData.department
      if (formData.mitigation) payload.existingControls = formData.mitigation

      const newRisk = await riskService.createRisk(payload as any)
      setRisks(prev => [newRisk, ...prev])
      handleCloseDialog()
    } catch (err: any) {
      setError(err.message || 'Failed to create risk')
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, riskId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedRisk(riskId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRisk(null)
  }

  const handleView = () => {
    const risk = risks.find(r => r.id === selectedRisk)
    if (risk) {
      setViewingRisk(risk)
      setOpenViewDialog(true)
    }
    handleMenuClose()
  }

  const handleEdit = () => {
    const risk = risks.find(r => r.id === selectedRisk)
    if (risk) {
      setFormData({
        title: risk.title,
        description: risk.description || '',
        category: risk.category,
        severity: risk.severity,
        likelihood: risk.likelihood || '',
        impact: risk.impactDescription || '',
        mitigation: risk.existingControls || '',
        department: risk.department || '',
      })
      setSelectedRisk(risk.id)
      setOpenDialog(true)
    }
    handleMenuClose()
  }

  const handleDelete = async () => {
    const riskId = selectedRisk
    handleMenuClose()
    if (!riskId) return
    try {
      await riskService.deleteRisk(riskId)
      setRisks(prev => prev.filter(r => r.id !== riskId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete risk')
    }
  }

  const filteredRisks = searchQuery
    ? risks.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getOwnerDisplay(r).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.department || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : risks

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography>Loading risks...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Risk Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Identify, assess, and mitigate organizational risks
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New Risk
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Total Risks</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{risks.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Critical / High</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {risks.filter(r => r.severity === 'high' || r.severity === 'critical').length}
              </Typography>
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
              <Typography variant="body2" color="text.secondary" gutterBottom>Closed</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {risks.filter(r => r.status === 'closed' || r.status === 'archived').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Open Risks</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {risks.filter(r => !['closed', 'archived'].includes(r.status)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search risks..."
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
          variant={heatMapView ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setHeatMapView(!heatMapView)}
          sx={{ minWidth: 120 }}
        >
          {heatMapView ? 'Table View' : 'Heat Map'}
        </Button>
      </Box>

      {/* Heat Map View */}
      {heatMapView && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>5×5 Risk Matrix</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Likelihood × Impact matrix showing risk distribution. Click a cell to see details.
            </Typography>
            <HeatMap data={generateSampleHeatMap()} />
          </CardContent>
        </Card>
      )}

      {/* Risks Table */}
      {!heatMapView && (
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Risk Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRisks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((risk) => (
                  <TableRow key={risk.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{risk.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated: {formatDate(risk.updatedAt || risk.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell><Chip label={risk.category} size="small" /></TableCell>
                    <TableCell>
                      <Chip
                        label={risk.severity}
                        size="small"
                        sx={{ bgcolor: `${getSeverityColor(risk.severity)}15`, color: getSeverityColor(risk.severity), fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(risk.status)}
                        size="small"
                        sx={{ bgcolor: `${getStatusColor(risk.status)}15`, color: getStatusColor(risk.status) }}
                      />
                    </TableCell>
                    <TableCell>{getOwnerDisplay(risk)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, risk.id)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRisks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No risks found. Click "Add New Risk" to create one.
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
            count={filteredRisks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
      )}

      {/* Risk Menu */}
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

      {/* Add Risk Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedRisk ? 'Edit Risk' : 'Add New Risk'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth required label="Risk Title" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter risk title"
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
                    <MenuItem value="information_security">Information Security</MenuItem>
                    <MenuItem value="compliance">Compliance</MenuItem>
                    <MenuItem value="operational">Operational</MenuItem>
                    <MenuItem value="financial">Financial</MenuItem>
                    <MenuItem value="reputational">Reputational</MenuItem>
                    <MenuItem value="strategic">Strategic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={formData.severity}
                    label="Severity"
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <MenuItem value=""><em>Select severity</em></MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Likelihood</InputLabel>
                  <Select
                    value={formData.likelihood}
                    label="Likelihood"
                    onChange={(e) => setFormData({ ...formData, likelihood: e.target.value })}
                  >
                    <MenuItem value=""><em>Select likelihood</em></MenuItem>
                    <MenuItem value="certain">Certain</MenuItem>
                    <MenuItem value="likely">Likely</MenuItem>
                    <MenuItem value="possible">Possible</MenuItem>
                    <MenuItem value="unlikely">Unlikely</MenuItem>
                    <MenuItem value="rare">Rare</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Impact</InputLabel>
                  <Select
                    value={formData.impact}
                    label="Impact"
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  >
                    <MenuItem value=""><em>Select impact</em></MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
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
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Description" multiline rows={4} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the risk in detail"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Existing Controls / Mitigation" multiline rows={3} value={formData.mitigation}
                  onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                  placeholder="Describe existing controls or mitigation strategy"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create Risk'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Risk Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Risk Details</DialogTitle>
        <DialogContent>
          {viewingRisk && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{viewingRisk.title}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body1"><Chip label={viewingRisk.category} size="small" /></Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Severity</Typography>
                  <Typography variant="body1">
                    <Chip label={viewingRisk.severity} size="small"
                      sx={{ bgcolor: `${getSeverityColor(viewingRisk.severity)}15`, color: getSeverityColor(viewingRisk.severity), fontWeight: 600 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body1">
                    <Chip label={formatStatus(viewingRisk.status)} size="small"
                      sx={{ bgcolor: `${getStatusColor(viewingRisk.status)}15`, color: getStatusColor(viewingRisk.status) }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Likelihood</Typography>
                  <Typography variant="body1">{viewingRisk.likelihood || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Impact Description</Typography>
                  <Typography variant="body1">{viewingRisk.impactDescription || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{viewingRisk.department || '-'}</Typography>
                </Grid>
                {viewingRisk.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{viewingRisk.description}</Typography>
                  </Grid>
                )}
                {viewingRisk.existingControls && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Existing Controls</Typography>
                    <Typography variant="body1">{viewingRisk.existingControls}</Typography>
                  </Grid>
                )}
                {viewingRisk.rootCause && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Root Cause</Typography>
                    <Typography variant="body1">{viewingRisk.rootCause}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                  <Typography variant="body1">{viewingRisk.riskScore ?? '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">Target Date</Typography>
                  <Typography variant="body1">{viewingRisk.targetDate ? formatDate(viewingRisk.targetDate) : '-'}</Typography>
                </Grid>
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

export default RiskManagement
