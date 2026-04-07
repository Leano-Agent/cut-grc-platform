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
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
} from '@mui/icons-material'

const AuditManagement = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)

  // Mock data
  const audits = [
    {
      id: '1',
      title: 'Q1 2024 IT Security Audit',
      type: 'Internal',
      scope: 'IT Security',
      status: 'Completed',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      findings: 12,
      criticalFindings: 2,
      auditor: 'John Doe',
      progress: 100,
    },
    {
      id: '2',
      title: 'POPIA Compliance Audit',
      type: 'External',
      scope: 'Data Protection',
      status: 'In Progress',
      startDate: '2024-03-01',
      endDate: '2024-04-30',
      findings: 8,
      criticalFindings: 1,
      auditor: 'Sarah Smith',
      progress: 65,
    },
    {
      id: '3',
      title: 'Financial Controls Review',
      type: 'Internal',
      scope: 'Finance Department',
      status: 'Planned',
      startDate: '2024-04-15',
      endDate: '2024-05-31',
      findings: 0,
      criticalFindings: 0,
      auditor: 'Mike Johnson',
      progress: 0,
    },
    {
      id: '4',
      title: 'Vendor Risk Assessment',
      type: 'Third Party',
      scope: 'Key Vendors',
      status: 'In Progress',
      startDate: '2024-02-01',
      endDate: '2024-03-31',
      findings: 15,
      criticalFindings: 3,
      auditor: 'Lisa Brown',
      progress: 85,
    },
    {
      id: '5',
      title: 'ISO 27001 Surveillance Audit',
      type: 'External',
      scope: 'Information Security',
      status: 'Completed',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      findings: 5,
      criticalFindings: 0,
      auditor: 'David Wilson',
      progress: 100,
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
      case 'Completed': return '#4CAF50'
      case 'In Progress': return '#2196F3'
      case 'Planned': return '#FF9800'
      case 'Cancelled': return '#9E9E9E'
      default: return '#9E9E9E'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Internal': return '#4CAF50'
      case 'External': return '#2196F3'
      case 'Third Party': return '#9C27B0'
      default: return '#9E9E9E'
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Audit Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Plan, execute, and track audit activities
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Schedule Audit
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Audits
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                8
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <VerifiedUserIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  4 internal, 4 external
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Open Findings
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                42
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 600 }}>
                  12 critical
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Audit Completion
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                68%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  +8% this quarter
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upcoming Audits
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                5
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <ScheduleIcon sx={{ color: '#FF9800', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 600 }}>
                  Next 30 days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search audits..."
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

      {/* Audits Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Audit Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Findings</TableCell>
                  <TableCell>Auditor</TableCell>
                  <TableCell>Timeline</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {audits.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((audit) => (
                  <TableRow key={audit.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {audit.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {audit.startDate} to {audit.endDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={audit.type}
                        size="small"
                        sx={{
                          bgcolor: `${getTypeColor(audit.type)}15`,
                          color: getTypeColor(audit.type),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {audit.scope}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={audit.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(audit.status)}15`,
                          color: getStatusColor(audit.status),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={audit.progress}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: audit.progress === 100 ? '#4CAF50' : '#2196F3',
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: audit.progress === 100 ? '#4CAF50' : '#2196F3',
                            minWidth: 40,
                          }}
                        >
                          {audit.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {audit.findings} total
                        </Typography>
                        {audit.criticalFindings > 0 && (
                          <Typography variant="caption" color="error">
                            {audit.criticalFindings} critical
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {audit.auditor.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2">
                          {audit.auditor}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {audit.startDate}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        to {audit.endDate}
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
            count={audits.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Audit Dashboard */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audit Findings by Severity
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { severity: 'Critical', count: 12, color: '#F44336' },
                  { severity: 'High', count: 18, color: '#FF9800' },
                  { severity: 'Medium', count: 24, color: '#FFC107' },
                  { severity: 'Low', count: 32, color: '#4CAF50' },
                ].map((item) => (
                  <Box key={item.severity} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.severity}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.count} findings
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / 86) * 100}
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
                Recent Audit Activities
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { activity: 'IT Security audit completed', date: '2024-03-15', auditor: 'John Doe' },
                  { activity: '3 critical findings identified', date: '2024-03-14', auditor: 'Sarah Smith' },
                  { activity: 'POPIA audit in progress', date: '2024-03-10', auditor: 'Mike Johnson' },
                  { activity: 'Vendor assessment started', date: '2024-03-05', auditor: 'Lisa Brown' },
                ].map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {activity.activity}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        By {activity.auditor}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.date}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Schedule Audit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schedule New Audit</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Audit Title"
                  placeholder="Enter audit title"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Audit Type"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select type</option>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                  <option value="third_party">Third Party</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Scope"
                  placeholder="Enter audit scope"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lead Auditor"
                  placeholder="Enter lead auditor name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Audit Team"
                  placeholder="Enter audit team members (comma separated)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Objectives"
                  multiline
                  rows={3}
                  placeholder="Describe audit objectives"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Scope Description"
                  multiline
                  rows={3}
                  placeholder="Describe audit scope in detail"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Schedule Audit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AuditManagement