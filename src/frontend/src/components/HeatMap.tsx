import { useState } from 'react'
import {
  Box, Typography, Paper, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, IconButton, Chip, Grid,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

// 5x5 Matrix dimensions: Likelihood vs Impact
// Likelihood: Rare, Unlikely, Possible, Likely, Almost Certain
// Impact: Insignificant, Minor, Moderate, Major, Catastrophic

type Likelihood = 0 | 1 | 2 | 3 | 4
type Impact = 0 | 1 | 2 | 3 | 4

interface RiskCell {
  likelihood: Likelihood
  impact: Impact
  count: number
  risks: Array<{
    id: string
    title: string
    severity: string
    department: string
    owner: string
  }>
}

interface HeatMapProps {
  data: RiskCell[]
  onCellClick?: (cell: RiskCell) => void
}

const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']
const IMPACT_LABELS = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic']

// Risk rating matrix: 5x5 grid returns 1-25 score
// 1-4 = Low (green), 5-9 = Medium (yellow), 10-16 = High (orange), 17-25 = Critical (red)
const RISK_RATING = [
  [1, 2, 4, 7, 11],
  [2, 3, 5, 8, 12],
  [3, 4, 6, 9, 13],
  [5, 6, 8, 11, 14],
  [7, 8, 10, 12, 15],
]

const getRiskColor = (score: number): string => {
  if (score <= 3) return '#4CAF50'      // Low - Green
  if (score <= 6) return '#FFC107'      // Medium - Amber
  if (score <= 10) return '#FF9800'     // High - Orange
  return '#F44336'                       // Critical - Red
}

const getRiskLevel = (score: number): string => {
  if (score <= 3) return 'Low'
  if (score <= 6) return 'Medium'
  if (score <= 10) return 'High'
  return 'Critical'
}

const getTextColor = (score: number): string => {
  return score > 7 ? '#FFF' : '#333'
}

export const generateSampleHeatMap = (): RiskCell[] => {
  const cells: RiskCell[] = []
  for (let l = 0; l < 5; l++) {
    for (let i = 0; i < 5; i++) {
      const count = Math.floor(Math.random() * 4)
      cells.push({
        likelihood: l as Likelihood,
        impact: i as Impact,
        count,
        risks: Array.from({ length: count }, (_, idx) => ({
          id: `risk_${l}_${i}_${idx}`,
          title: `Sample risk (L:${LIKELIHOOD_LABELS[l]}, I:${IMPACT_LABELS[i]})`,
          severity: getRiskLevel(RISK_RATING[l][i]),
          department: ['IT', 'Finance', 'Operations', 'Compliance'][Math.floor(Math.random() * 4)],
          owner: 'System',
        })),
      })
    }
  }
  return cells
}

const HeatMap: React.FC<HeatMapProps> = ({ data, onCellClick }) => {
  const [selectedCell, setSelectedCell] = useState<RiskCell | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ l: number; i: number } | null>(null)

  const handleCellClick = (cell: RiskCell) => {
    setSelectedCell(cell)
    if (onCellClick) onCellClick(cell)
  }

  // Build grid lookup
  const cellMap = new Map<string, RiskCell>()
  data.forEach(cell => cellMap.set(`${cell.likelihood}-${cell.impact}`, cell))

  const getCell = (l: Likelihood, i: Impact): RiskCell => {
    const key = `${l}-${i}`
    return cellMap.get(key) || { likelihood: l, impact: i, count: 0, risks: [] }
  }

  return (
    <Box>
      {/* Matrix Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Column Headers (Impact) */}
        <Box sx={{ display: 'flex', ml: 14 }}>
          <Box sx={{ width: 140, flexShrink: 0 }} />
          {IMPACT_LABELS.map((label, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                textAlign: 'center',
                py: 1,
                fontSize: 11,
                fontWeight: 700,
                color: 'text.secondary',
                writingMode: { md: 'horizontal' },
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        {/* Rows */}
        {LIKELIHOOD_LABELS.map((ll, lIdx) => (
          <Box key={lIdx} sx={{ display: 'flex', alignItems: 'stretch', minHeight: 64 }}>
            {/* Row Header */}
            <Box
              sx={{
                width: 140,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 2,
                fontSize: 12,
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {ll}
            </Box>

            {/* Cells */}
            {[0, 1, 2, 3, 4].map((iIdx) => {
              const cell = getCell(lIdx as Likelihood, iIdx as Impact)
              const score = RISK_RATING[lIdx][iIdx]
              const bgColor = getRiskColor(score)
              const isHovered = hoveredCell?.l === lIdx && hoveredCell?.i === iIdx
              const fgColor = getTextColor(score)

              return (
                <Tooltip
                  key={iIdx}
                  title={
                    `${LIKELIHOOD_LABELS[lIdx]} / ${IMPACT_LABELS[iIdx]}\n` +
                    `Score: ${score} (${getRiskLevel(score)})\n` +
                    `Risks: ${cell.count}`
                  }
                  arrow
                >
                  <Box
                    sx={{
                      flex: 1,
                      m: 0.5,
                      borderRadius: 1,
                      bgcolor: bgColor,
                      opacity: cell.count > 0 ? 1 : 0.35,
                      cursor: cell.count > 0 ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: fgColor,
                      transition: 'all 0.2s',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isHovered ? `0 0 12px ${bgColor}66` : 'none',
                      '&:hover': cell.count > 0 ? { opacity: 0.9 } : {},
                      minHeight: 56,
                    }}
                    onMouseEnter={() => setHoveredCell({ l: lIdx, i: iIdx })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => cell.count > 0 && handleCellClick(cell)}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, lineHeight: 1, color: fgColor, fontSize: { xs: 14, md: 18 } }}
                    >
                      {cell.count}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: fgColor, opacity: 0.8, fontSize: 9, lineHeight: 1 }}
                    >
                      {getRiskLevel(score)}
                    </Typography>
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
        {[
          { label: 'Low (1-3)', color: '#4CAF50' },
          { label: 'Medium (4-6)', color: '#FFC107' },
          { label: 'High (7-10)', color: '#FF9800' },
          { label: 'Critical (11-25)', color: '#F44336' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: item.color }} />
            <Typography variant="caption">{item.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Risk List by Level */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        {['Critical', 'High', 'Medium', 'Low'].map((level) => {
          const levelCells = data.filter(
            (c) => getRiskLevel(RISK_RATING[c.likelihood][c.impact]) === level
          )
          const totalInLevel = levelCells.reduce((s, c) => s + c.count, 0)
          const color = getRiskColor(
            level === 'Critical' ? 20 : level === 'High' ? 10 : level === 'Medium' ? 6 : 2
          )
          return (
            <Grid item xs={6} md={3} key={level}>
              <Paper sx={{ p: 2, borderLeft: `4px solid ${color}` }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                  {totalInLevel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {level} Risks
                </Typography>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      {/* Cell Detail Dialog */}
      <Dialog open={!!selectedCell} onClose={() => setSelectedCell(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Risk Details
          <IconButton onClick={() => setSelectedCell(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedCell && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Likelihood:</strong> {LIKELIHOOD_LABELS[selectedCell.likelihood]}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Impact:</strong> {IMPACT_LABELS[selectedCell.impact]}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Risk Score:</strong> {RISK_RATING[selectedCell.likelihood][selectedCell.impact]}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Risks in this cell:</strong> {selectedCell.count}
              </Typography>

              <Box sx={{ mt: 2 }}>
                {selectedCell.risks.length > 0 ? (
                  selectedCell.risks.map((risk) => (
                    <Paper key={risk.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {risk.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip label={risk.department} size="small" />
                        <Chip label={risk.severity} size="small" color={risk.severity === 'Critical' ? 'error' : 'warning'} />
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No risks currently mapped to this cell.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCell(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HeatMap
