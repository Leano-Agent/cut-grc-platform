import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, FormGroup, Checkbox,
  FormLabel, Menu, MenuItem, Alert, Snackbar,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  MoreVert as MoreVertIcon, Security as SecurityIcon,
  Save as SaveIcon, Cancel as CancelIcon,
} from '@mui/icons-material'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Permission {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  approve: boolean
}

type ModuleKey =
  | 'riskManagement'
  | 'complianceTracking'
  | 'internalControls'
  | 'auditManagement'
  | 'userAdministration'
  | 'reports'
  | 'settings'

interface RolePermissions {
  riskManagement: Permission
  complianceTracking: Permission
  internalControls: Permission
  auditManagement: Permission
  userAdministration: Permission
  reports: Permission
  settings: Permission
}

interface Role {
  id: string
  name: string
  description: string
  usersCount: number
  isActive: boolean
  permissions: RolePermissions
}

/* ------------------------------------------------------------------ */
/*  Module / permission helpers                                        */
/* ------------------------------------------------------------------ */

const MODULE_LABELS: Record<ModuleKey, string> = {
  riskManagement: 'Risk Management',
  complianceTracking: 'Compliance Tracking',
  internalControls: 'Internal Controls',
  auditManagement: 'Audit Management',
  userAdministration: 'User Administration',
  reports: 'Reports',
  settings: 'Settings',
}

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve'] as const

const emptyPermission: Permission = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false,
}

const fullPermission: Permission = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
}

const createPermissions = (overrides: Partial<Record<ModuleKey, Partial<Permission>>>): RolePermissions => {
  const empty: RolePermissions = {
    riskManagement: { ...emptyPermission },
    complianceTracking: { ...emptyPermission },
    internalControls: { ...emptyPermission },
    auditManagement: { ...emptyPermission },
    userAdministration: { ...emptyPermission },
    reports: { ...emptyPermission },
    settings: { ...emptyPermission },
  }
  for (const [mod, perms] of Object.entries(overrides)) {
    if (perms) {
      ;(empty as any)[mod] = { ...empty[mod as ModuleKey], ...perms }
    }
  }
  return empty
}

/* ------------------------------------------------------------------ */
/*  Mock data — 4 roles                                                */
/* ------------------------------------------------------------------ */

const MOCK_ROLES: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full system access with all permissions',
    usersCount: 8,
    isActive: true,
    permissions: createPermissions({
      riskManagement: fullPermission,
      complianceTracking: fullPermission,
      internalControls: fullPermission,
      auditManagement: fullPermission,
      userAdministration: fullPermission,
      reports: fullPermission,
      settings: fullPermission,
    }),
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Most permissions except user administration and settings',
    usersCount: 24,
    isActive: true,
    permissions: createPermissions({
      riskManagement: fullPermission,
      complianceTracking: fullPermission,
      internalControls: fullPermission,
      auditManagement: { view: true, create: false, edit: true, delete: false, approve: true },
      userAdministration: { view: true, create: false, edit: false, delete: false, approve: false },
      reports: fullPermission,
      settings: { view: true, create: false, edit: false, delete: false, approve: false },
    }),
  },
  {
    id: 'role-auditor',
    name: 'Auditor',
    description: 'Read-only access with approval capability for audits',
    usersCount: 12,
    isActive: true,
    permissions: createPermissions({
      riskManagement: { view: true, create: false, edit: false, delete: false, approve: false },
      complianceTracking: { view: true, create: false, edit: false, delete: false, approve: true },
      internalControls: { view: true, create: false, edit: false, delete: false, approve: false },
      auditManagement: { view: true, create: false, edit: false, delete: false, approve: true },
      userAdministration: { view: true, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: true, edit: false, delete: false, approve: false },
      settings: { view: true, create: false, edit: false, delete: false, approve: false },
    }),
  },
  {
    id: 'role-user',
    name: 'User',
    description: 'Basic read-only access to assigned modules',
    usersCount: 112,
    isActive: true,
    permissions: createPermissions({
      riskManagement: { view: true, create: false, edit: false, delete: false, approve: false },
      complianceTracking: { view: true, create: false, edit: false, delete: false, approve: false },
      internalControls: { view: true, create: false, edit: false, delete: false, approve: false },
      auditManagement: { view: false, create: false, edit: false, delete: false, approve: false },
      userAdministration: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    }),
  },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const UserRoles = () => {
  /* ---------- roles state ---------- */
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES)

  /* ---------- dialog state ---------- */
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [permissions, setPermissions] = useState<RolePermissions>(() => createPermissions({}))

  /* ---------- menu state ---------- */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  /* ---------- snackbar ---------- */
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const [snackbarMessage, setSnackbarMessage] = useState('')

  /* ---------- derived ---------- */
  const totalRoles = roles.length
  const activeRoles = roles.filter((r) => r.isActive).length
  const totalUsers = roles.reduce((sum, r) => sum + r.usersCount, 0)

  /* ---------- helpers ---------- */

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const getPermissionChips = (perms: RolePermissions) => {
    const chips: string[] = []
    for (const [mod, perm] of Object.entries(perms)) {
      const p = perm as Permission
      if (p.view) chips.push(MODULE_LABELS[mod as ModuleKey])
    }
    return chips
  }

  const getPermissionColor = (roleName: string) => {
    switch (roleName) {
      case 'Admin':
        return '#F44336'
      case 'Manager':
        return '#2196F3'
      case 'Auditor':
        return '#FF9800'
      case 'User':
        return '#4CAF50'
      default:
        return '#9E9E9E'
    }
  }

  /* ---------- handlers ---------- */

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, roleId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedRoleId(roleId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRoleId(null)
  }

  const handleOpenAddDialog = () => {
    setDialogMode('add')
    setEditingRole(null)
    setRoleName('')
    setRoleDescription('')
    setPermissions(createPermissions({}))
    setOpenDialog(true)
  }

  const handleOpenEditDialog = () => {
    const role = roles.find((r) => r.id === selectedRoleId)
    if (role) {
      setDialogMode('edit')
      setEditingRole(role)
      setRoleName(role.name)
      setRoleDescription(role.description)
      setPermissions({ ...role.permissions })
      setOpenDialog(true)
    }
    handleMenuClose()
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRole(null)
  }

  const handlePermissionChange = (
    module: ModuleKey,
    action: 'view' | 'create' | 'edit' | 'delete' | 'approve',
    checked: boolean,
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: checked,
      },
    }))
  }

  const handleSaveRole = () => {
    if (!roleName.trim()) {
      showSnackbar('Role name is required', 'error')
      return
    }

    if (dialogMode === 'add') {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleName.trim(),
        description: roleDescription.trim(),
        usersCount: 0,
        isActive: true,
        permissions: { ...permissions },
      }
      setRoles((prev) => [...prev, newRole])
      showSnackbar(`Role "${newRole.name}" created successfully`, 'success')
    } else if (editingRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? {
                ...r,
                name: roleName.trim(),
                description: roleDescription.trim(),
                permissions: { ...permissions },
              }
            : r,
        ),
      )
      showSnackbar(`Role "${roleName.trim()}" updated successfully`, 'success')
    }

    handleCloseDialog()
  }

  const handleDeleteRole = () => {
    const roleId = selectedRoleId
    const role = roles.find((r) => r.id === roleId)
    handleMenuClose()
    if (!role || !roleId) return
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
    showSnackbar(`Role "${role.name}" deleted successfully`, 'success')
  }

  const handleToggleStatus = (roleId: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, isActive: !r.isActive } : r,
      ),
    )
    const role = roles.find((r) => r.id === roleId)
    if (role) {
      showSnackbar(
        `Role "${role.name}" is now ${role.isActive ? 'Inactive' : 'Active'}`,
        'success',
      )
    }
  }

  /* ---------- render ---------- */

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            User Roles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage roles and permissions for the platform
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Role
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Roles
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalRoles}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <SecurityIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {activeRoles} active
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Roles
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {activeRoles}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <SecurityIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  {totalRoles > 0 ? `${Math.round((activeRoles / totalRoles) * 100)}% active rate` : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
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
                <SecurityIcon sx={{ color: '#2196F3', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 600 }}>
                  across {totalRoles} roles
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Custom Roles
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalRoles - 4 > 0 ? totalRoles - 4 : 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <SecurityIcon sx={{ color: '#FF9800', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 600 }}>
                  added beyond defaults
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Roles Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Users Count</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={role.name}
                          size="small"
                          sx={{
                            bgcolor: `${getPermissionColor(role.name)}15`,
                            color: getPermissionColor(role.name),
                            fontWeight: 700,
                            minWidth: 70,
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{role.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {role.usersCount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 320 }}>
                        {getPermissionChips(role.permissions).map((perm) => (
                          <Chip
                            key={perm}
                            label={perm}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          size="small"
                          checked={role.isActive}
                          onChange={() => handleToggleStatus(role.id)}
                          color="primary"
                        />
                        <Chip
                          label={role.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: role.isActive ? '#4CAF5015' : '#9E9E9E15',
                            color: role.isActive ? '#4CAF50' : '#9E9E9E',
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, role.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenEditDialog}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Role
        </MenuItem>
        <MenuItem onClick={handleDeleteRole}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Role
        </MenuItem>
      </Menu>

      {/* Add / Edit Role Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Create New Role' : `Edit Role: ${editingRole?.name}`}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 2 }}>
            {/* Basic Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Compliance Officer"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Brief description of this role"
                />
              </Grid>
            </Grid>

            {/* Permissions by Module */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Permissions
            </Typography>

            {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((mod) => (
              <Box key={mod} sx={{ mb: 2.5 }}>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: 600, fontSize: 13, color: 'text.primary', mb: 0.5 }}
                >
                  {MODULE_LABELS[mod]}
                </FormLabel>
                <FormGroup row>
                  {PERMISSION_ACTIONS.map((action) => (
                    <FormControlLabel
                      key={action}
                      control={
                        <Checkbox
                          size="small"
                          checked={permissions[mod][action]}
                          onChange={(e) =>
                            handlePermissionChange(mod, action, e.target.checked)
                          }
                        />
                      }
                      label={action.charAt(0).toUpperCase() + action.slice(1)}
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<CancelIcon />}
            onClick={handleCloseDialog}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveRole}
          >
            {dialogMode === 'add' ? 'Create Role' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default UserRoles
