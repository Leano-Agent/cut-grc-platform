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
  LinearProgress,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'

import { controlService, Control } from '../../services/controlService'

const InternalControls = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [controls, setControls] = useState<Control[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await controlService.getControls()
        setControls(data)
      } catch {
        // API not available
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived stats
  const totalControls = controls.length
  const activeControls = controls.filter(c => c.status === 'active').length
  const automatedControls = controls.filter(c => c.type === 'preventive').length // rough proxy
  const needsReview = controls.filter(c => c.status === 'inactive' || c.status === 'draft').length
  const avgEffectiveness = controls.length > 0
    ? Math.round(controls.reduce((sum, c) => sum + (c.effectiveness === 'high' ? 90 : c.effectiveness === 'medium' ? 70 : 40), 0) / controls.length)
    : 88

  // Filter
  const filteredControls = searchQuery
    ? controls.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.owner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : controls

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#4CAF50'
      case 'needs review':
      case 'draft':
      case 'review': return '#FF9800'
      case 'inactive':
      case 'archived': return '#9E9E9E'
      default: return '#9E9E9E'
    }
  }

  const getEffectivenessColor = (level: number) => {
    if (level >= 90) return '#4CAF50'
    if (level >= 70) return '#FF9800'
    return '#F44336'
  }

  // Convert effectiveness string to number for display
  const getEffectivenessValue = (eff: string): number => {
    switch (eff.toLowerCase()) {
      case 'high': return 90
      case 'medium': return 70
      case 'low': return 40
      default: return 50
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography>Loading controls...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Internal Controls
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Design, implement, and monitor internal control mechanisms
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Control
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Controls
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalControls}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AssignmentIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  +12 this month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Control Effectiveness
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {avgEffectiveness}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  +3%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Automated Controls
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {controls.length > 0 ? Math.round((controls.filter(c => c.type === 'preventive' || c.type === 'detective').length / controls.length) * 100) : 0}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <SettingsIcon sx={{ color: '#2196F3', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 600 }}>
                  Target: 60%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Needs Review
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {needsReview}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningIcon sx={{ color: '#FF9800', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 600 }}>
                  Overdue: 5
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search controls..."
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
        <IconButton>
          <FilterIcon />
        </IconButton>
      </Box>

      {/* Controls Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Control Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Effectiveness</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Tested</TableCell>
                  <TableCell>Automated</TableCell>
                  <TableCell>Owner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredControls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((control) => (
                  <TableRow key={control.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {control.title}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Type: {control.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={control.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={control.type}
                        size="small"
                        sx={{
                          bgcolor: (control.type === 'preventive' || control.type === 'directive') ? '#4CAF5015' : '#2196F315',
                          color: (control.type === 'preventive' || control.type === 'directive') ? '#4CAF50' : '#2196F3',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getEffectivenessValue(control.effectiveness)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getEffectivenessColor(getEffectivenessValue(control.effectiveness)),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getEffectivenessColor(getEffectivenessValue(control.effectiveness)),
                            minWidth: 40,
                          }}
                        >
                          {getEffectivenessValue(control.effectiveness)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={control.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(control.status)}15`,
                          color: getStatusColor(control.status),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {control.lastTested || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={control.status === 'active'}
                            size="small"
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {control.owner}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredControls.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Control Framework */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Control Categories
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { category: 'Security', count: 42, color: '#F44336' },
                  { category: 'Financial', count: 38, color: '#4CAF50' },
                  { category: 'IT', count: 35, color: '#2196F3' },
                  { category: 'Operational', count: 28, color: '#FF9800' },
                  { category: 'Third Party', count: 13, color: '#9C27B0' },
                ].map((item) => (
                  <Box key={item.category} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.category}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.count} controls
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / 156) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#E0E0E0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: item.color,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Control Testing Schedule
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { period: 'This Week', count: 8, completed: 5 },
                  { period: 'This Month', count: 24, completed: 18 },
                  { period: 'Next Month', count: 32, completed: 0 },
                  { period: 'This Quarter', count: 85, completed: 24 },
                ].map((schedule) => (
                  <Box
                    key={schedule.period}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {schedule.period}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {schedule.completed}/{schedule.count} completed
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(schedule.completed / schedule.count) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Control Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Control</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Control Name"
                  placeholder="Enter control name"
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
                  <option value="security">Security</option>
                  <option value="financial">Financial</option>
                  <option value="it">IT</option>
                  <option value="operational">Operational</option>
                  <option value="third_party">Third Party</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Control Type"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select type</option>
                  <option value="preventive">Preventive</option>
                  <option value="detective">Detective</option>
                  <option value="corrective">Corrective</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Frequency"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select frequency</option>
                  <option value="continuous">Continuous</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner"
                  placeholder="Enter control owner"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  placeholder="Describe the control in detail"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Testing Procedure"
                  multiline
                  rows={3}
                  placeholder="Describe how to test this control"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch />}
                  label="Automated Control"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Create Control
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InternalControls