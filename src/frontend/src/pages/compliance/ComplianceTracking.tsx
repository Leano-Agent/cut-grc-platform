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
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'

const ComplianceTracking = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Mock data
  const complianceItems = [
    {
      id: '1',
      regulation: 'POPIA',
      requirement: 'Data Protection Officer',
      status: 'Compliant',
      dueDate: '2024-03-31',
      lastAudit: '2024-03-15',
      complianceLevel: 95,
      owner: 'Sarah Smith',
    },
    {
      id: '2',
      regulation: 'FICA',
      requirement: 'Customer Due Diligence',
      status: 'Partially Compliant',
      dueDate: '2024-04-15',
      lastAudit: '2024-03-10',
      complianceLevel: 75,
      owner: 'John Doe',
    },
    {
      id: '3',
      regulation: 'GDPR',
      requirement: 'Data Subject Rights',
      status: 'Non-Compliant',
      dueDate: '2024-03-20',
      lastAudit: '2024-03-05',
      complianceLevel: 40,
      owner: 'Mike Johnson',
    },
    {
      id: '4',
      regulation: 'ISO 27001',
      requirement: 'Information Security Policy',
      status: 'Compliant',
      dueDate: '2024-06-30',
      lastAudit: '2024-03-01',
      complianceLevel: 100,
      owner: 'Lisa Brown',
    },
    {
      id: '5',
      regulation: 'King IV',
      requirement: 'Corporate Governance',
      status: 'In Progress',
      dueDate: '2024-05-31',
      lastAudit: '2024-02-28',
      complianceLevel: 60,
      owner: 'David Wilson',
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
      case 'Compliant': return '#4CAF50'
      case 'Partially Compliant': return '#FF9800'
      case 'Non-Compliant': return '#F44336'
      case 'In Progress': return '#2196F3'
      default: return '#9E9E9E'
    }
  }

  const getComplianceColor = (level: number) => {
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
            Compliance Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage regulatory compliance requirements
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add Requirement
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Compliance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                85%
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
                Compliant Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                24
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  65% of total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Non-Compliant
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
                Upcoming Deadlines
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                12
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
          placeholder="Search compliance items..."
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

      {/* Compliance Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Regulation</TableCell>
                  <TableCell>Requirement</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Compliance Level</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Last Audit</TableCell>
                  <TableCell>Owner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complianceItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GavelIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.regulation}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.requirement}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(item.status)}15`,
                          color: getStatusColor(item.status),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={item.complianceLevel}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getComplianceColor(item.complianceLevel),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getComplianceColor(item.complianceLevel),
                            minWidth: 40,
                          }}
                        >
                          {item.complianceLevel}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.dueDate}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.dueDate) > new Date() ? 'Due' : 'Overdue'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.lastAudit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {item.owner.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2">
                          {item.owner}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={complianceItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Regulation Overview */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Regulation Coverage
              </Typography>
              <Box sx={{ mt: 2 }}>
                {['POPIA', 'FICA', 'GDPR', 'ISO 27001', 'King IV'].map((regulation) => (
                  <Box key={regulation} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{regulation}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {Math.floor(Math.random() * 30) + 70}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.floor(Math.random() * 30) + 70}
                      sx={{ height: 6, borderRadius: 3 }}
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
                Recent Audit Findings
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { finding: 'Data encryption not implemented', severity: 'High', date: '2024-03-15' },
                  { finding: 'Access logs incomplete', severity: 'Medium', date: '2024-03-10' },
                  { finding: 'Policy documentation outdated', severity: 'Low', date: '2024-03-05' },
                  { finding: 'Training records missing', severity: 'Medium', date: '2024-02-28' },
                ].map((finding, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: finding.severity === 'High' ? '#F4433610' : 
                               finding.severity === 'Medium' ? '#FF980010' : '#4CAF5010',
                      borderLeft: `4px solid ${
                        finding.severity === 'High' ? '#F44336' : 
                        finding.severity === 'Medium' ? '#FF9800' : '#4CAF50'
                      }`,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {finding.finding}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip
                        label={finding.severity}
                        size="small"
                        sx={{
                          bgcolor: finding.severity === 'High' ? '#F4433615' : 
                                   finding.severity === 'Medium' ? '#FF980015' : '#4CAF5015',
                          color: finding.severity === 'High' ? '#F44336' : 
                                 finding.severity === 'Medium' ? '#FF9800' : '#4CAF50',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {finding.date}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ComplianceTracking