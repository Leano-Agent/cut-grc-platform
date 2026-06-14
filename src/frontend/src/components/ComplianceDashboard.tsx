import { useState } from 'react'
import {
  Box, Typography, Paper, Grid, Chip, LinearProgress, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton, Button, Card, CardContent, TextField,
  InputAdornment, Tooltip, Alert,
} from '@mui/material'
import {
  KeyboardArrowDown, KeyboardArrowUp, Gavel as GavelIcon,
  CheckCircle, Warning, Schedule, Search as SearchIcon,
  Download as DownloadIcon, Assessment as AssessmentIcon,
} from '@mui/icons-material'

// Regulation data model
interface RegulationRequirement {
  id: string
  regulation: string
  requirement: string
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'pending_review' | 'not_applicable'
  complianceLevel: number
  dueDate: string
  lastAudit: string
  owner: string
  evidenceFiles: number
  gaps: string[]
}

// Sample data — will be replaced by API calls
const SAMPLE_REGULATIONS: RegulationRequirement[] = [
  { id: '1', regulation: 'POPIA', requirement: 'Data Protection Officer Appointment', status: 'compliant', complianceLevel: 95, dueDate: '2024-03-31', lastAudit: '2024-03-15', owner: 'Sarah Smith', evidenceFiles: 8, gaps: [] },
  { id: '2', regulation: 'POPIA', requirement: 'Data Subject Access Request Process', status: 'in_progress', complianceLevel: 65, dueDate: '2024-04-30', lastAudit: '2024-03-10', owner: 'John Doe', evidenceFiles: 3, gaps: ['No automated request system', 'Response SLA not defined'] },
  { id: '3', regulation: 'POPIA', requirement: 'Data Breach Notification Procedure', status: 'compliant', complianceLevel: 90, dueDate: '2024-02-28', lastAudit: '2024-02-20', owner: 'Sarah Smith', evidenceFiles: 5, gaps: [] },
  { id: '4', regulation: 'FICA', requirement: 'Customer Due Diligence', status: 'compliant', complianceLevel: 88, dueDate: '2024-04-15', lastAudit: '2024-03-10', owner: 'Mike Johnson', evidenceFiles: 12, gaps: [] },
  { id: '5', regulation: 'FICA', requirement: 'Beneficial Ownership Identification', status: 'non_compliant', complianceLevel: 35, dueDate: '2024-05-01', lastAudit: '2024-03-01', owner: 'Mike Johnson', evidenceFiles: 1, gaps: ['No central registry', 'Manual process only', 'No verification workflow'] },
  { id: '6', regulation: 'King IV', requirement: 'Board Composition & Independence', status: 'compliant', complianceLevel: 100, dueDate: '2024-06-30', lastAudit: '2024-02-15', owner: 'Lisa Brown', evidenceFiles: 15, gaps: [] },
  { id: '7', regulation: 'King IV', requirement: 'Risk Governance Framework', status: 'in_progress', complianceLevel: 72, dueDate: '2024-07-31', lastAudit: '2024-03-05', owner: 'David Wilson', evidenceFiles: 6, gaps: ['Risk appetite statement pending board approval'] },
  { id: '8', regulation: 'ISO 27001', requirement: 'Information Security Policy', status: 'compliant', complianceLevel: 97, dueDate: '2024-06-30', lastAudit: '2024-03-01', owner: 'IT Security', evidenceFiles: 20, gaps: [] },
  { id: '9', regulation: 'ISO 27001', requirement: 'Access Control Policy', status: 'pending_review', complianceLevel: 82, dueDate: '2024-05-15', lastAudit: '2024-02-28', owner: 'IT Security', evidenceFiles: 9, gaps: ['Quarterly review overdue', 'Privileged access audit incomplete'] },
  { id: '10', regulation: 'ISO 27001', requirement: 'Incident Response Procedure', status: 'compliant', complianceLevel: 93, dueDate: '2024-04-30', lastAudit: '2024-03-20', owner: 'IT Security', evidenceFiles: 7, gaps: [] },
]

const getStatusColor = (s: string) => {
  switch (s) {
    case 'compliant': return '#4CAF50'
    case 'in_progress': return '#FF9800'
    case 'non_compliant': return '#F44336'
    case 'pending_review': return '#2196F3'
    default: return '#9E9E9E'
  }
}

const getStatusLabel = (s: string) => {
  switch (s) {
    case 'compliant': return 'Compliant'
    case 'in_progress': return 'In Progress'
    case 'non_compliant': return 'Non-Compliant'
    case 'pending_review': return 'Pending Review'
    case 'not_applicable': return 'N/A'
    default: return s
  }
}

const getComplianceColor = (level: number) => {
  if (level >= 90) return '#4CAF50'
  if (level >= 70) return '#FF9800'
  return '#F44336'
}

interface ComplianceDashboardProps {
  data?: RegulationRequirement[]
  onExport?: () => void
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ data, onExport }) => {
  const regulations = data || SAMPLE_REGULATIONS
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Filter by search
  const filtered = searchQuery
    ? regulations.filter(r =>
        r.regulation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : regulations

  // Calculate stats
  const totalRegs = regulations.length
  const uniqueRegs = [...new Set(regulations.map(r => r.regulation))]
  const compliant = regulations.filter(r => r.status === 'compliant').length
  const nonCompliant = regulations.filter(r => r.status === 'non_compliant').length
  const inProgress = regulations.filter(r => r.status === 'in_progress' || r.status === 'pending_review').length
  const overallRate = totalRegs > 0 ? Math.round((compliant / totalRegs) * 100) : 0
  const totalEvidence = regulations.reduce((s, r) => s + r.evidenceFiles, 0)
  const allGaps = regulations.flatMap(r => r.gaps)
  const gapCount = allGaps.length

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedRows(next)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Compliance Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={onExport}
        >
          Export Report
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2.4}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {uniqueRegs.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Regulations</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
              {compliant}
            </Typography>
            <Typography variant="caption" color="text.secondary">Compliant</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>
              {inProgress}
            </Typography>
            <Typography variant="caption" color="text.secondary">In Progress</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#F44336' }}>
              {nonCompliant}
            </Typography>
            <Typography variant="caption" color="text.secondary">Non-Compliant</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#9C27B0' }}>
              {gapCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">Gap Items</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Regulation Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {uniqueRegs.map((reg) => {
          const regItems = regulations.filter(r => r.regulation === reg)
          const regCompliant = regItems.filter(r => r.status === 'compliant').length
          const regLevel = Math.round(regItems.reduce((s, r) => s + r.complianceLevel, 0) / regItems.length)
          return (
            <Grid item xs={12} sm={6} md={4} key={reg}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{reg}</Typography>
                    <Chip label={`${regCompliant}/${regItems.length}`} size="small"
                      color={regCompliant === regItems.length ? 'success' : 'warning'} />
                  </Box>
                  <LinearProgress variant="determinate" value={regLevel}
                    sx={{ height: 6, borderRadius: 3,
                      bgcolor: '#E0E0E0',
                      '& .MuiLinearProgress-bar': { bgcolor: getComplianceColor(regLevel) }
                    }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {regLevel}% overall compliance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Search */}
      <TextField
        placeholder="Search regulations, requirements, or owners..."
        fullWidth size="small" sx={{ mb: 2 }}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          },
        }}
      />

      {/* Expandable Requirements Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Regulation</TableCell>
              <TableCell>Requirement</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Compliance</TableCell>
              <TableCell>Evidence</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Due Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((req) => (
              <>
                <TableRow key={req.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => toggleRow(req.id)}>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => toggleRow(req.id)}>
                      {expandedRows.has(req.id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Chip label={req.regulation} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {req.requirement}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(req.status)}
                      size="small"
                      sx={{ bgcolor: `${getStatusColor(req.status)}18`, color: getStatusColor(req.status), fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 60 }}>
                        <LinearProgress variant="determinate" value={req.complianceLevel}
                          sx={{ height: 6, borderRadius: 3, bgcolor: '#E0E0E0',
                            '& .MuiLinearProgress-bar': { bgcolor: getComplianceColor(req.complianceLevel) }
                          }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: getComplianceColor(req.complianceLevel) }}>
                        {req.complianceLevel}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip icon={<AssessmentIcon />} label={req.evidenceFiles} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{req.owner}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{req.dueDate}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow key={`${req.id}-detail`}>
                  <TableCell colSpan={8} sx={{ p: 0, border: 'none' }}>
                    <Collapse in={expandedRows.has(req.id)}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              <CheckCircle sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              Evidence Files
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {req.evidenceFiles} file(s) attached • Last audit: {req.lastAudit}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              <Warning sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: 'warning.main' }} />
                              Gap Analysis
                            </Typography>
                            {req.gaps.length > 0 ? (
                              req.gaps.map((gap, i) => (
                                <Alert key={i} severity="warning" icon={<Warning fontSize="inherit" />}
                                  sx={{ py: 0, px: 1.5, mb: 0.5, fontSize: '0.8rem' }}>
                                  {gap}
                                </Alert>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No gaps identified
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ComplianceDashboard
export type { RegulationRequirement }
