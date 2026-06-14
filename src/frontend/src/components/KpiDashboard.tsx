import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, Chip, IconButton,
  Tooltip, LinearProgress, CircularProgress,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'

interface KPI {
  id: string
  label: string
  value: string | number
  unit?: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color: string
  severity?: 'good' | 'warning' | 'critical'
}

interface KpiDashboardProps {
  kpis?: KPI[]
  refreshInterval?: number // seconds
  onRefresh?: () => Promise<KPI[]>
  loading?: boolean
}

const DEFAULT_KPIS: KPI[] = [
  { id: 'risk-score', label: 'Risk Score', value: 42, unit: 'avg', change: '-5', trend: 'down', icon: <SecurityIcon />, color: '#4CAF50', severity: 'good' },
  { id: 'compliance-rate', label: 'Compliance Rate', value: '92%', change: '+3%', trend: 'up', icon: <CheckCircleIcon />, color: '#2196F3', severity: 'good' },
  { id: 'open-risks', label: 'Open Risks', value: 18, change: '+4', trend: 'up', icon: <WarningIcon />, color: '#FF9800', severity: 'warning' },
  { id: 'overdue-audits', label: 'Overdue Audits', value: 3, change: '-2', trend: 'down', icon: <ScheduleIcon />, color: '#F44336', severity: 'critical' },
  { id: 'mitigation-rate', label: 'Mitigation Rate', value: '78%', change: '+8%', trend: 'up', icon: <TrendingUpIcon />, color: '#4CAF50', severity: 'good' },
  { id: 'total-controls', label: 'Active Controls', value: 124, change: '+12', trend: 'up', icon: <AssessmentIcon />, color: '#9C27B0', severity: 'good' },
]

const KpiDashboard: React.FC<KpiDashboardProps> = ({
  kpis: externalKpis,
  refreshInterval = 60,
  onRefresh,
  loading: externalLoading,
}) => {
  const [kpis, setKpis] = useState<KPI[]>(externalKpis || DEFAULT_KPIS)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doRefresh = useCallback(async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try {
      const freshData = await onRefresh()
      if (freshData && freshData.length > 0) {
        setKpis(freshData)
      }
      setLastRefresh(new Date())
    } catch {
      // Keep existing data
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  // Auto-refresh on interval
  useEffect(() => {
    if (onRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(doRefresh, refreshInterval * 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [onRefresh, refreshInterval, doRefresh])

  // Sync external KPI updates
  useEffect(() => {
    if (externalKpis) setKpis(externalKpis)
  }, [externalKpis])

  const displayKpis = kpis.length > 0 ? kpis : DEFAULT_KPIS
  const loading = externalLoading || refreshing

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Key Performance Indicators
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()} • Refreshes every {refreshInterval}s
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {loading && <CircularProgress size={16} />}
          <Tooltip title="Refresh now">
            <IconButton size="small" onClick={doRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        {displayKpis.map((kpi) => (
          <Grid item xs={6} sm={4} md={2} key={kpi.id}>
            <Card
              sx={{
                borderLeft: `4px solid ${kpi.color}`,
                transition: 'all 0.3s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                    {kpi.label}
                  </Typography>
                  <Box sx={{ color: kpi.color, opacity: 0.7, '& svg': { fontSize: 16 } }}>
                    {kpi.icon}
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {kpi.value}
                  {kpi.unit && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {kpi.unit}
                    </Typography>
                  )}
                </Typography>
                {kpi.change && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    {kpi.trend === 'up' ? (
                      <TrendingUpIcon sx={{ fontSize: 12, color: kpi.color, mr: 0.3 }} />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDownIcon sx={{ fontSize: 12, color: kpi.color, mr: 0.3 }} />
                    ) : null}
                    <Typography
                      variant="caption"
                      sx={{ color: kpi.color, fontWeight: 600, fontSize: 10 }}
                    >
                      {kpi.change}
                    </Typography>
                  </Box>
                )}
                {/* Severity indicator */}
                {kpi.severity === 'critical' && (
                  <Box sx={{ mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{ height: 2, borderRadius: 1, bgcolor: '#FFCDD2', '& .MuiLinearProgress-bar': { bgcolor: '#F44336' } }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default KpiDashboard
export type { KPI }
