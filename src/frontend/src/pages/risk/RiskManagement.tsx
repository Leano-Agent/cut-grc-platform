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
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'

import { riskService, Risk } from '../../services/riskService'
import HeatMap, { generateSampleHeatMap } from '../../components/HeatMap'

const RiskManagement = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [heatMapView, setHeatMapView] = useState(false)

  // Fetch risks on mount
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

  const handleChangePage = (event: unknown, newPage: number) => {
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
    // Navigate to risk detail view
    handleMenuClose()
  }

  const handleEdit = () => {
    // Open edit dialog
    handleMenuClose()
    setOpenDialog(true)
  }

  const handleDelete = () => {
    // Delete risk
    handleMenuClose()
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
      case 'open': return '#F44336'
      case 'in_progress':
      case 'in review': return '#FF9800'
      case 'closed':
      case 'mitigated': return '#4CAF50'
      default: return '#9E9E9E'
    }
  }

  // Filter risks based on search query
  const filteredRisks = searchQuery
    ? risks.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department?.toLowerCase().includes(searchQuery.toLowerCase())
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
          onClick={() => setOpenDialog(true)}
        >
          Add New Risk
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Risks
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                42
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 600 }}>
                  +12%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                High Severity
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                8
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 600 }}>
                  Requires Attention
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Mitigation Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                68%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  +5%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overdue Risks
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                3
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDownIcon sx={{ color: '#FF9800', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 600 }}>
                  -2
                </Typography>
              </Box>
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
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <IconButton>
          <FilterIcon />
        </IconButton>
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
            <Typography variant="h6" gutterBottom>
              5×5 Risk Matrix
            </Typography>
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {risk.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {risk.lastUpdated}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={risk.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={risk.severity}
                        size="small"
                        sx={{
                          bgcolor: `${getSeverityColor(risk.severity)}15`,
                          color: getSeverityColor(risk.severity),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={risk.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(risk.status)}15`,
                          color: getStatusColor(risk.status),
                        }}
                      />
                    </TableCell>
                    <TableCell>{risk.owner}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, risk.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRisk ? 'Edit Risk' : 'Add New Risk'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Risk Title"
                  placeholder="Enter risk title"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select category</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="compliance">Compliance</option>
                  <option value="operational">Operational</option>
                  <option value="financial">Financial</option>
                  <option value="reputational">Reputational</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Severity"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select severity</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Probability"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select probability</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Impact"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select impact</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  placeholder="Describe the risk in detail"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mitigation Strategy"
                  multiline
                  rows={3}
                  placeholder="Describe the mitigation strategy"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            {selectedRisk ? 'Update' : 'Create'} Risk
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RiskManagement