import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  InputAdornment, IconButton, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Paper,
  Avatar, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
  Menu, MenuItem, ListItemIcon, FormControlLabel, LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  People as PeopleIcon, Edit as EditIcon, Delete as DeleteIcon,
  MoreVert as MoreVertIcon, Lock as LockIcon, LockOpen as LockOpenIcon,
  Person as PersonIcon, AdminPanelSettings as AdminPanelSettingsIcon,
  Email as EmailIcon, ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material'
import { userService, SystemUser } from '../../services/userService'
import api from '../../services/apiClient'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user' as SystemUser['role'],
  department: '',
}

const UserAdministration = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try { const data = await userService.getUsers(); setUsers(data) }
      catch { /* API not available */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive).length
  const adminUsers = users.filter(u => u.role === 'admin').length
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  // Filter
  const filteredUsers = searchQuery
    ? users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedUserId(userId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUserId(null)
  }

  const handleEdit = () => {
    const user = users.find(u => u.id === selectedUserId)
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
        department: user.department || '',
      })
    }
    setDialogMode('edit')
    setOpenDialog(true)
    handleMenuClose()
  }

  const handleAdd = () => {
    setDialogMode('add')
    setFormData(emptyForm)
    setError('')
    setOpenDialog(true)
  }

  const handleCreate = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Use auth/register endpoint since backend has no POST /users
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      })
      const newUser = response.data.user || response.data
      setUsers(prev => [{
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        department: formData.department,
        isActive: true,
        createdAt: new Date().toISOString(),
      }, ...prev])
      setSuccessMsg('User created successfully')
      setOpenDialog(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const userId = selectedUserId
    handleMenuClose()
    if (!userId) return
    setSaving(true)
    try {
      await userService.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setSuccessMsg('User deleted successfully')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (userId: string) => {
    setSaving(true)
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return
      const updated = user.isActive
        ? await userService.suspendUser(userId)
        : await userService.activateUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: updated.isActive } : u))
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to toggle status')
    } finally {
      setSaving(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#F44336'
      case 'Manager': return '#2196F3'
      case 'User': return '#4CAF50'
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
                {totalUsers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <PeopleIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {totalUsers > 0 ? `${activeUsers} active` : 'No users yet'}
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
                {activeUsers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <PersonIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  {activeRate}% active rate
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
                {adminUsers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AdminPanelSettingsIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 600 }}>
                  {totalUsers > 0 ? `${Math.round((adminUsers / totalUsers) * 100)}% of total` : '0% of total'}
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
                —
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LockIcon sx={{ color: '#2196F3', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 600 }}>
                  Feature not yet available
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
                {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main', fontSize: 14 }}>
                          {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.firstName} {user.lastName}
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
                          checked={user.isActive}
                          onChange={() => handleToggleStatus(user.id)}
                          color="primary"
                        />
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: user.isActive ? '#4CAF5015' : '#9E9E9E15',
                            color: user.isActive ? '#4CAF50' : '#9E9E9E',
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
                      <LockOpenIcon sx={{ color: '#9E9E9E' }} />
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
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Role"
                  select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as SystemUser['role'] })}
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
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : dialogMode === 'add' ? 'Create User' : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserAdministration