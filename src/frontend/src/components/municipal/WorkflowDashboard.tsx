/**
 * Municipal Workflow Dashboard Component
 * Main dashboard for municipal workflow management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Paper,
} from '@mui/material';
import {
  MeetingRoom as MeetingIcon,
  Assignment as AssignmentIcon,
  Description as DocumentIcon,
  Gavel as ComplianceIcon,
  People as CommitteeIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  PlayCircle as PlayIcon,
  PauseCircle as PauseIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface WorkflowStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  pendingAction: number;
}

interface WorkflowInstance {
  id: string;
  title: string;
  workflowType: string;
  status: string;
  priority: string;
  currentStep: number;
  createdAt: string;
  dueDate?: string;
}

const WorkflowDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0,
    pendingAction: 0,
  });
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowInstance[]>([]);
  const [attentionRequired, setAttentionRequired] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, these would be API calls
      // For now, we'll use mock data
      const mockStats: WorkflowStats = {
        total: 42,
        active: 18,
        completed: 22,
        overdue: 3,
        pendingAction: 5,
      };

      const mockRecentWorkflows: WorkflowInstance[] = [
        {
          id: '1',
          title: 'Council Budget Approval Meeting',
          workflowType: 'council-meeting-management',
          status: 'active',
          priority: 'high',
          currentStep: 3,
          createdAt: '2024-04-18T10:00:00Z',
          dueDate: '2024-04-25T14:00:00Z',
        },
        {
          id: '2',
          title: 'Pothole Repair Request - Main Street',
          workflowType: 'service-request-management',
          status: 'active',
          priority: 'medium',
          currentStep: 2,
          createdAt: '2024-04-19T09:30:00Z',
          dueDate: '2024-04-21T17:00:00Z',
        },
        {
          id: '3',
          title: 'POPIA Compliance Audit Q2 2024',
          workflowType: 'compliance-workflow',
          status: 'active',
          priority: 'high',
          currentStep: 4,
          createdAt: '2024-04-15T08:00:00Z',
          dueDate: '2024-04-30T23:59:59Z',
        },
      ];

      const mockAttentionRequired: WorkflowInstance[] = [
        {
          id: '4',
          title: 'Document Approval: Procurement Policy',
          workflowType: 'document-workflow',
          status: 'active',
          priority: 'medium',
          currentStep: 2,
          createdAt: '2024-04-17T11:00:00Z',
          dueDate: '2024-04-20T12:00:00Z',
        },
        {
          id: '5',
          title: 'Committee Report: Infrastructure Development',
          workflowType: 'committee-workflow',
          status: 'active',
          priority: 'high',
          currentStep: 1,
          createdAt: '2024-04-16T14:00:00Z',
          dueDate: '2024-04-19T16:00:00Z',
        },
      ];

      setStats(mockStats);
      setRecentWorkflows(mockRecentWorkflows);
      setAttentionRequired(mockAttentionRequired);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getWorkflowIcon = (workflowType: string) => {
    switch (workflowType) {
      case 'council-meeting-management':
        return <MeetingIcon />;
      case 'committee-workflow':
        return <CommitteeIcon />;
      case 'service-request-management':
        return <AssignmentIcon />;
      case 'document-workflow':
        return <DocumentIcon />;
      case 'compliance-workflow':
        return <ComplianceIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getWorkflowTypeLabel = (workflowType: string) => {
    switch (workflowType) {
      case 'council-meeting-management':
        return 'Council Meeting';
      case 'committee-workflow':
        return 'Committee';
      case 'service-request-management':
        return 'Service Request';
      case 'document-workflow':
        return 'Document';
      case 'compliance-workflow':
        return 'Compliance';
      default:
        return workflowType;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'overdue':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Municipal Workflows Dashboard
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchDashboardData} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />}>
            New Workflow
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Workflows
              </Typography>
              <Typography variant="h4" component="div">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                All municipal workflows
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Currently in progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Successfully closed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ position: 'relative' }}>
              {stats.overdue > 0 && (
                <WarningIcon
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'error.main',
                  }}
                />
              )}
              <Typography color="textSecondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" component="div" color={stats.overdue > 0 ? 'error' : 'textPrimary'}>
                {stats.overdue}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                SLA breaches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Requires Attention
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {stats.pendingAction}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Awaiting your action
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Attention Required */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Requires Your Attention
                </Typography>
                <Chip label={attentionRequired.length} color="warning" size="small" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {attentionRequired.length > 0 ? (
                <List>
                  {attentionRequired.map((workflow) => (
                    <React.Fragment key={workflow.id}>
                      <ListItem
                        secondaryAction={
                          <Button size="small" variant="outlined" startIcon={<PlayIcon />}>
                            Take Action
                          </Button>
                        }
                      >
                        <ListItemIcon>{getWorkflowIcon(workflow.workflowType)}</ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" component="span">
                                {workflow.title}
                              </Typography>
                              <Chip
                                label={getWorkflowTypeLabel(workflow.workflowType)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={workflow.priority}
                                size="small"
                                color={getPriorityColor(workflow.priority) as any}
                              />
                              <Chip
                                label={`Step ${workflow.currentStep + 1}`}
                                size="small"
                                variant="outlined"
                              />
                              {workflow.dueDate && (
                                <>
                                  <TimeIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                  <Typography variant="caption" color="textSecondary">
                                    Due: {formatDate(workflow.dueDate)}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography color="textSecondary">
                    No workflows require your attention at this time.
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Workflows */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Recent Workflows
                </Typography>
                <Button size="small" variant="text">
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List>
                {recentWorkflows.map((workflow) => (
                  <React.Fragment key={workflow.id}>
                    <ListItem>
                      <ListItemIcon>{getWorkflowIcon(workflow.workflowType)}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" component="span">
                              {workflow.title}
                            </Typography>
                            <Chip
                              label={workflow.status}
                              size="small"
                              color={getStatusColor(workflow.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={getWorkflowTypeLabel(workflow.workflowType)}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="textSecondary">
                              Created: {formatDate(workflow.createdAt)}
                            </Typography>
                            {workflow.dueDate && (
                              <>
                                <TimeIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                <Typography variant="caption" color="textSecondary">
                                  Due: {formatDate(workflow.dueDate)}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<MeetingIcon />}
                    sx={{ height: 100, flexDirection: 'column' }}
                  >
                    <Typography variant="body2">Schedule Meeting</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AssignmentIcon />}
                    sx={{ height: 100, flexDirection: 'column' }}
                  >
                    <Typography variant="body2">New Service Request</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DocumentIcon />}
                    sx={{ height: 100, flexDirection: 'column' }}
                  >
                    <Typography variant="body2">Create Document</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ComplianceIcon />}
                    sx={{ height: 100, flexDirection: 'column' }}
                  >
                    <Typography variant="body2">Compliance Check</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CommitteeIcon />}
                    sx={{ height: 100, flexDirection: 'column' }}
                  >
                    <Typography variant="body2">Committee Report</Typography>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Role Info */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="body2" color="textSecondary">
          Logged in as: <strong>{user?.email}</strong> | Role: <strong>{user?.role}</strong> | 
          Municipal Department: <strong>Administration</strong>
        </Typography>
      </Paper>
    </Box>
  );
};

export default WorkflowDashboard;