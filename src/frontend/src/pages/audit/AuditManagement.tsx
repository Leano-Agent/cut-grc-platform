import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  InputAdornment, IconButton, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Paper,
  LinearProgress, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  VerifiedUser as VerifiedUserIcon, Warning as WarningIcon,
  Schedule as ScheduleIcon, TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { auditService, Audit } from '../../services/auditService'

const AuditManagement = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await auditService.getAudits()
        setAudits(data)
      } catch { /* API not available */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const activeAudits = audits.filter(a => a.status === 'in_progress').length
  const totalFindings = audits.reduce((sum, a) => sum + (a.findings || 0), 0)
  const completedAudits = audits.filter(a => a.status === 'completed').length
  const completionRate = audits.length > 0 ? Math.round((completedAudits / audits.length) * 100) : 0
  const upcomingAudits = audits.filter(a => a.status === 'planned').length

  const filteredAudits = searchQuery
    ? audits.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.auditor.toLowerCase().includes(searchQuery.toLowerCase()))
    : audits

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'completed': return '#4CAF50'
      case 'in_progress': return '#2196F3'
      case 'planned': return '#FF9800'
      case 'overdue': return '#F44336'
      default: return '#9E9E9E'
    }
  }
  const getTypeColor = (t: string) => {
    switch (t.toLowerCase()) {
      case 'internal': return '#4CAF50'
      case 'external': return '#2196F3'
      case 'compliance': case 'financial': return '#9C27B0'
      case 'operational': return '#FF9800'
      default: return '#9E9E9E'
    }
  }
  const progressValue = (a: Audit): number =>
    a.status === 'completed' ? 100 : a.status === 'in_progress' ? 65 : a.status === 'overdue' ? 75 : 0

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', py:8 }}><Typography>Loading audits...</Typography></Box>

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight:700, mb:1 }}>Audit Management</Typography>
          <Typography variant="body1" color="text.secondary">Plan, execute, and track audit activities</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>Schedule Audit</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb:4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Active Audits</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{activeAudits}</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <VerifiedUserIcon sx={{ color:'primary.main', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'primary.main', fontWeight:600 }}>In progress</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Open Findings</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{totalFindings}</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <WarningIcon sx={{ color:'#F44336', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'#F44336', fontWeight:600 }}>Total across audits</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Audit Completion</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{completionRate}%</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <TrendingUpIcon sx={{ color:'#4CAF50', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'#4CAF50', fontWeight:600 }}>Completed audits</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Upcoming Audits</Typography>
            <Typography variant="h4" sx={{ fontWeight:700 }}>{upcomingAudits}</Typography>
            <Box sx={{ display:'flex', alignItems:'center', mt:1 }}>
              <ScheduleIcon sx={{ color:'#FF9800', fontSize:16, mr:0.5 }} />
              <Typography variant="body2" sx={{ color:'#FF9800', fontWeight:600 }}>Planned</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Box sx={{ display:'flex', gap:2, mb:3 }}>
        <TextField placeholder="Search audits..." fullWidth
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
        <IconButton><FilterIcon /></IconButton>
      </Box>

      <Card><CardContent>
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
              {filteredAudits.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight:600 }}>{a.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.scheduledStart} to {a.scheduledEnd}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.type} size="small" sx={{ bgcolor:`${getTypeColor(a.type)}15`, color:getTypeColor(a.type) }} />
                  </TableCell>
                  <TableCell><Typography variant="body2">{a.scope}</Typography></TableCell>
                  <TableCell>
                    <Chip label={a.status.replace('_', ' ')} size="small"
                      sx={{ bgcolor:`${getStatusColor(a.status)}15`, color:getStatusColor(a.status), fontWeight:600 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Box sx={{ flexGrow:1 }}>
                        <LinearProgress variant="determinate" value={progressValue(a)}
                          sx={{ height:8, borderRadius:4, bgcolor:'#E0E0E0',
                            '& .MuiLinearProgress-bar':{ bgcolor: progressValue(a) === 100 ? '#4CAF50' : '#2196F3' } }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight:600, color: progressValue(a) === 100 ? '#4CAF50' : '#2196F3', minWidth:40 }}>
                        {progressValue(a)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight:600 }}>{a.findings || 0} total</Typography>
                    {a.priority === 'critical' && <Typography variant="caption" color="error">Critical priority</Typography>}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center' }}>
                      <Avatar sx={{ width:32, height:32, mr:1 }}>{a.auditor.split(' ').map(n => n[0]).join('')}</Avatar>
                      <Typography variant="body2">{a.auditor}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{a.scheduledStart}</Typography>
                    <Typography variant="caption" color="text.secondary">to {a.scheduledEnd}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[5,10,25]} component="div" count={filteredAudits.length}
          rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
      </CardContent></Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schedule New Audit</DialogTitle>
        <DialogContent>
          <Box sx={{ pt:2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Audit Title" placeholder="Enter audit title" /></Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Audit Type" select SelectProps={{ native:true }}>
                  <option value="">Select type</option>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                  <option value="compliance">Compliance</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Scope" placeholder="Enter audit scope" /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Start Date" type="date" slotProps={{ inputLabel: { shrink:true } }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="End Date" type="date" slotProps={{ inputLabel: { shrink:true } }} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Auditor" placeholder="Enter auditor name" /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={3} placeholder="Describe the audit scope and objectives" /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>Schedule Audit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AuditManagement
