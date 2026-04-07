import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  LinearProgress,
  Chip,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Button,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedUserIcon,
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

// Mock data for dashboard
const riskData = [
  { name: 'Jan', high: 12, medium: 8, low: 4 },
  { name: 'Feb', high: 9, medium: 10, low: 5 },
  { name: 'Mar', high: 7, medium: 12, low: 6 },
  { name: 'Apr', high: 10, medium: 9, low: 7 },
  { name: 'May', high: 8, medium: 11, low: 8 },
  { name: 'Jun', high: 6, medium: 13, low: 9 },
]

const complianceData = [
  { name: 'Q1', compliant: 85, nonCompliant: 15 },
  { name: 'Q2', compliant: 88, nonCompliant: 12 },
  { name: 'Q3', compliant: 92, nonCompliant: 8 },
  { name: 'Q4', compliant: 95, nonCompliant: 5 },
]

const auditStatusData = [
  { name: 'Completed', value: 65, color: '#4CAF50' },
  { name: 'In Progress', value: 20, color: '#FF9800' },
  { name: 'Pending', value: 10, color: '#9E9E9E' },
  { name: 'Overdue', value: 5, color: '#F44336' },
]

const recentActivities = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Updated risk assessment',
    module: 'Risk Management',
    time: '2 hours ago',
    avatar: 'JD',
  },
  {
    id: 2,
    user: 'Sarah Smith',
    action: 'Submitted compliance report',
    module: 'Compliance Tracking',
    time: '4 hours ago',
    avatar: 'SS',
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'Created new control',
    module: 'Internal Controls',
    time: '1 day ago',
    avatar: 'MJ',
  },
  {
    id: 4,
    user: 'Lisa Brown',
    action: 'Completed audit review',
    module: 'Audit Management',
    time: '2 days ago',
    avatar: 'LB',
  },
  {
    id: 5,
    user: 'David Wilson',
    action: 'Added new user',
    module: 'User Administration',
    time: '3 days ago',
    avatar: 'DW',
  },
]

const quickStats = [
  {
    title: 'Total Risks',
    value: '42',
    change: '+12%',
    trend: 'up',
    icon: <WarningIcon />,
    color: '#F44336',
  },
  {
    title: 'Compliance Rate',
    value: '92%',
    change: '+5%',
    trend: 'up',
    icon: <CheckCircleIcon />,
    color: '#4CAF50',
  },
  {
    title: 'Open Audits',
    value: '8',
    change: '-2',
    trend: 'down',
    icon: <ScheduleIcon />,
    color: '#FF9800',
  },
  {
    title: 'Active Users',
    value: '156',
    change: '+24',
    trend: 'up',
    icon: <PeopleIcon />,
    color: '#2196F3',
  },
]

const Dashboard = () => {
  const { user } = useAuth()
  const { showSuccess } = useUI()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Set current module
    // This would typically be done in a layout or route component
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false)
      showSuccess('Dashboard data refreshed')
    }, 1000)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            {getGreeting()}, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your GRC platform today.
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {stat.trend === 'up' ? (
                        <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: stat.trend === 'up' ? '#4CAF50' : '#F44336',
                          fontWeight: 600,
                        }}
                      >
                        {stat.change}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        from last month
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}15`,
                      color: stat.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Risk Trends */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Risk Trends"
              subheader="Monthly risk distribution by severity"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="high"
                      stroke="#F44336"
                      strokeWidth={2}
                      name="High Risk"
                    />
                    <Line
                      type="monotone"
                      dataKey="medium"
                      stroke="#FF9800"
                      strokeWidth={2}
                      name="Medium Risk"
                    />
                    <Line
                      type="monotone"
                      dataKey="low"
                      stroke="#4CAF50"
                      strokeWidth={2}
                      name="Low Risk"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Audit Status"
              subheader="Distribution of audit activities"
            />
            <CardContent>
              <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={auditStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {auditStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  {auditStatusData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          bgcolor: item.color,
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      <Typography variant="caption">{item.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Compliance Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Compliance Progress"
              subheader="Quarterly compliance rate improvement"
            />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="compliant" fill="#4CAF50" name="Compliant" />
                    <Bar dataKey="nonCompliant" fill="#F44336" name="Non-Compliant" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Compliance Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress
                    variant="determinate"
                    value={90}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ ml: 2, fontWeight: 600 }}>
                    90%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Recent Activity"
              subheader="Latest actions across the platform"
              action={
                <Button size="small" endIcon={<ArrowForwardIcon />}>
                  View All
                </Button>
              }
            />
            <CardContent>
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity) => (
                  <ListItem key={activity.id} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {activity.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {activity.user}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary">
                            {activity.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.module} • {activity.time}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={activity.module.split(' ')[0]}
                        size="small"
                        sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SecurityIcon />}
              sx={{ py: 2 }}
            >
              Add Risk
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GavelIcon />}
              sx={{ py: 2 }}
            >
              Compliance Check
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AssignmentIcon />}
              sx={{ py: 2 }}
            >
              New Control
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<VerifiedUserIcon />}
              sx={{ py: 2 }}
            >
              Start Audit
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default Dashboard