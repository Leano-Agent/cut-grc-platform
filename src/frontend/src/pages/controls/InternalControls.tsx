import { useState } from 'react'
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

const InternalControls = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)

  // Mock data
  const controls = [
    {
      id: '1',
      name: 'Access Control Policy',
      category: 'Security',
      type: 'Preventive',
      frequency: 'Continuous',
      effectiveness: 95,
      status: 'Active',
      lastTested: '2024-03-15',
      owner: 'IT Security',
      automated: true,
    },
    {
      id: '2',
      name: 'Segregation of Duties',
      category: 'Financial',
      type: 'Detective',
      frequency: 'Monthly',
      effectiveness: 85,
      status: 'Active',
      lastTested: '2024-03-10',
      owner: 'Finance',
      automated: false,
    },
    {
      id: '3',
      name: 'Change Management',
      category: 'IT',
      type: 'Preventive',
      frequency: 'On Change',
      effectiveness: 90,
      status: 'Active',
      lastTested: '2024-03-05',
      owner: 'IT Operations',
      automated: true,
    },
    {
      id: '4',
      name: 'Backup Verification',
      category: 'Operational',
      type: 'Detective',
      frequency: 'Weekly',
      effectiveness: 75,
      status: 'Needs Review',
      lastTested: '2024-02-28',
      owner: 'IT Operations',
      automated: true,
    },
    {
      id: '5',
      name: 'Vendor Risk Assessment',
      category: 'Third Party',
      type: 'Preventive',
      frequency: 'Quarterly',
      effectiveness: 80,
      status: 'Active',
      lastTested: '2024-02-15',
      owner: 'Procurement',
      automated: false,
    },
  ]

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#4CAF50'
      case 'Needs Review': return '#FF9800'
      case 'Inactive': return '#9E9E9E'
      default: return '#9E9E9E'
    }
  }

  const getEffectivenessColor = (level: number) => {
    if (level >= 90) return '#4CAF50'
    if (level >= 70) return '#FF9800'
    return '#F44336'
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
                156
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
                88%
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
                42%
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
                18
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
                {controls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((control) => (
                  <TableRow key={control.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {control.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Frequency: {control.frequency}
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
                          bgcolor: control.type === 'Preventive' ? '#4CAF5015' : '#2196F315',
                          color: control.type === 'Preventive' ? '#4CAF50' : '#2196F3',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={control.effectiveness}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getEffectivenessColor(control.effectiveness),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getEffectivenessColor(control.effectiveness),
                            minWidth: 40,
                          }}
                        >
                          {control.effectiveness}%
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
                        {control.lastTested}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={control.automated}
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
            count={controls.length}
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