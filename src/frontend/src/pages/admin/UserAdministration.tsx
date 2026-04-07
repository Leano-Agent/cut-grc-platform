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
  Avatar,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  ManageAccounts as ManageAccountsIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material'

const UserAdministration = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')

  // Mock data
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@cutgrc.co.za',
      role: 'Admin',
      department: 'IT',
      status: 'Active',
      lastLogin: '2024-03-15 14:30',
      avatar: 'JD',
      twoFactor: true,
    },
    {
      id: '2',
      name: 'Sarah Smith',
      email: 'sarah.smith@cutgrc.co.za',
      role: 'Manager',
      department: 'Compliance',
      status: 'Active',
      lastLogin: '2024-03-15 10:15',
      avatar: 'SS',
      twoFactor: false,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@cutgrc.co.za',
      role: 'User',
      department: 'Finance',
      status: 'Active',
      lastLogin: '2024-03-14 16:45',
      avatar: 'MJ',
      twoFactor: true,
    },
    {
      id: '4',
      name: 'Lisa Brown',
      email: 'lisa.brown@cutgrc.co.za',
      role: 'Manager',
      department: 'Risk',
      status: 'Inactive',
      lastLogin: '2024-03-10 09:20',
      avatar: 'LB',
      twoFactor: false,
    },
    {
      id: '5',
      name: 'David Wilson',
      email: 'david.wilson@cutgrc.co.za',
      role: 'User',
      department: 'Operations',
      status: 'Active',
      lastLogin: '2024-03-15 08:45',
      avatar: 'DW',
      twoFactor: true,
    },
  ]

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(userId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const handleEdit = () => {
    setDialogMode('edit')
    setOpenDialog(true)
    handleMenuClose()
  }

  const handleAdd = () => {
    setDialogMode('add')
    setOpenDialog(true)
  }

  const handleDelete = () => {
    // Delete user
    handleMenuClose()
  }

  const handleToggleStatus = (userId: string) => {
    // Toggle user status
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#F44336'
      case 'Manager': return '#2196F3'
      case 'User': return '#4CAF50'
      default: return '#9E9E9E'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#4CAF50'
      case 'Inactive': return '#9E9E9E'
      case 'Suspended': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            User Administration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage user accounts, roles, and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add User
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                156
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <PeopleIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
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
                Active Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                142
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <PersonIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  91% active rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Admin Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                8
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AdminPanelSettingsIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 600 }}>
                  5% of total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                2FA Enabled
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                85%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LockIcon sx={{ color: '#2196F3', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 600 }}>
                  Security score: 92
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search users..."
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

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.avatar}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          bgcolor: `${getRoleColor(user.role)}15`,
                          color: getRoleColor(user.role),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          size="small"
                          checked={user.status === 'Active'}
                          onChange={() => handleToggleStatus(user.id)}
                          color="primary"
                        />
                        <Chip
                          label={user.status}
                          size="small"
                          sx={{
                            bgcolor: `${getStatusColor(user.status)}15`,
                            color: getStatusColor(user.status),
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastLogin}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.twoFactor ? (
                        <LockIcon sx={{ color: '#4CAF50' }} />
                      ) : (
                        <LockOpenIcon sx={{ color: '#9E9E9E' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={users.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* User Distribution */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Distribution by Role
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { role: 'Admin', count: 8, color: '#F44336' },
                  { role: 'Manager', count: 24, color: '#2196F3' },
                  { role: 'User', count: 124, color: '#4CAF50' },
                ].map((item) => (
                  <Box key={item.role} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.role}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.count} users ({Math.round((item.count / 156) * 100)}%)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(item.count / 156) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#E0E0E0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: item.color,
                            },
                          }}
                        />
                      </Box>
                      <Chip
                        label={item.role}
                        size="small"
                        sx={{
                          bgcolor: `${item.color}15`,
                          color: item.color,
                          minWidth: 60,
                        }}
                      />
                    </Box>
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
                Recent User Activities
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { activity: 'New user registered', user: 'John Doe', time: '2 hours ago' },
                  { activity: 'Password reset requested', user: 'Sarah Smith', time: '4 hours ago' },
                  { activity: 'Role changed to Manager', user: 'Mike Johnson', time: '1 day ago' },
                  { activity: 'Account deactivated', user: 'Lisa Brown', time: '2 days ago' },
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
                        By {activity.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit User
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          Send Reset Email
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          Manage Permissions
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete User
        </MenuItem>
      </Menu>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  placeholder="Enter first name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  placeholder="Enter last name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  placeholder="Enter email address"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Role"
                  select
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select role</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  placeholder="Enter department"
                />
              </Grid>
              {dialogMode === 'add' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      placeholder="Enter password"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type="password"
                      placeholder="Confirm password"
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch />}
                  label="Require password change on first login"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch />}
                  label="Enable Two-Factor Authentication"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            {dialogMode === 'add' ? 'Create User' : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserAdministration