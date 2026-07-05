import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material'
import {
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Api as ApiIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'

/* ------------------------------------------------------------------ */
/*  Tab helpers                                                        */
/* ------------------------------------------------------------------ */

interface TabPanelProps {
  children: React.ReactNode
  value: number
  index: number
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
)

/* ------------------------------------------------------------------ */
/*  Default / mock state                                               */
/* ------------------------------------------------------------------ */

interface GeneralSettings {
  organizationName: string
  timezone: string
  language: string
  dateFormat: string
}

interface SecuritySettings {
  minPasswordLength: number
  requireSpecialChars: boolean
  sessionTimeout: string
  mfaEnabled: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  inAppNotifications: boolean
  dailyDigest: boolean
  weeklyReport: boolean
}

interface IntegrationSettings {
  apiBaseUrl: string
  webhookUrl: string
  apiKey: string
}

const defaultGeneral: GeneralSettings = {
  organizationName: 'Ngome GRC Platform',
  timezone: 'Africa/Johannesburg',
  language: 'en',
  dateFormat: 'YYYY-MM-DD',
}

const defaultSecurity: SecuritySettings = {
  minPasswordLength: 12,
  requireSpecialChars: true,
  sessionTimeout: '1hr',
  mfaEnabled: false,
}

const defaultNotifications: NotificationSettings = {
  emailNotifications: true,
  inAppNotifications: true,
  dailyDigest: false,
  weeklyReport: true,
}

const defaultIntegration: IntegrationSettings = {
  apiBaseUrl: 'https://api.ngome.example.com/v1',
  webhookUrl: 'https://hooks.ngome.example.com/events',
  apiKey: 'ngm_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
}

const TIMEZONES = [
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Cairo',
  'Africa/Casablanca',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'pt', label: 'Portuguese (Português)' },
  { value: 'sw', label: 'Swahili (Kiswahili)' },
  { value: 'zu', label: 'Zulu (isiZulu)' },
  { value: 'xh', label: 'Xhosa (isiXhosa)' },
]

const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD.MM.YYYY']

const SESSION_TIMEOUTS = [
  { value: '15min', label: '15 minutes' },
  { value: '30min', label: '30 minutes' },
  { value: '1hr', label: '1 hour' },
  { value: '4hr', label: '4 hours' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SystemSettings = () => {
  const [tabValue, setTabValue] = useState(0)

  /* ---------- form state ---------- */
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral)
  const [security, setSecurity] = useState<SecuritySettings>(defaultSecurity)
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications)
  const [integration, setIntegration] = useState<IntegrationSettings>(defaultIntegration)

  /* ---------- ui state ---------- */
  const [showApiKey, setShowApiKey] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveSeverity, setSaveSeverity] = useState<'success' | 'info'>('success')
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  /* ---------- handlers ---------- */

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSave = (section: string) => {
    setSaveMessage(`${section} settings saved successfully.`)
    setSaveSeverity('success')
    setSnackbarOpen(true)
  }

  const handleRegenerateKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const newKey = `ngm_sk_${Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
    setIntegration((prev) => ({ ...prev, apiKey: newKey }))
    setSaveMessage('API key regenerated successfully.')
    setSaveSeverity('info')
    setSnackbarOpen(true)
  }

  /* ---------- render ---------- */

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure global platform settings and preferences
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ pb: 0 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<SettingsIcon />} label="General" iconPosition="start" />
            <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
            <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
            <Tab icon={<ApiIcon />} label="Integration" iconPosition="start" />
          </Tabs>
        </CardContent>
      </Card>

      {/* ---------- General Tab ---------- */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              General Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={general.organizationName}
                  onChange={(e) => setGeneral({ ...general, organizationName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={general.timezone}
                    label="Timezone"
                    onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                  >
                    {TIMEZONES.map((tz) => (
                      <MenuItem key={tz} value={tz}>
                        {tz}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={general.language}
                    label="Language"
                    onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                  >
                    {LANGUAGES.map((lang) => (
                      <MenuItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={general.dateFormat}
                    label="Date Format"
                    onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}
                  >
                    {DATE_FORMATS.map((fmt) => (
                      <MenuItem key={fmt} value={fmt}>
                        {fmt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('General')}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ---------- Security Tab ---------- */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Security Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Password Length"
                  type="number"
                  value={security.minPasswordLength}
                  onChange={(e) =>
                    setSecurity({ ...security, minPasswordLength: parseInt(e.target.value, 10) || 8 })
                  }
                  inputProps={{ min: 6, max: 64 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={security.requireSpecialChars}
                      onChange={(e) =>
                        setSecurity({ ...security, requireSpecialChars: e.target.checked })
                      }
                    />
                  }
                  label="Require special characters in passwords"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Session Timeout</InputLabel>
                  <Select
                    value={security.sessionTimeout}
                    label="Session Timeout"
                    onChange={(e) =>
                      setSecurity({ ...security, sessionTimeout: e.target.value })
                    }
                  >
                    {SESSION_TIMEOUTS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={security.mfaEnabled}
                      onChange={(e) =>
                        setSecurity({ ...security, mfaEnabled: e.target.checked })
                      }
                    />
                  }
                  label="Enable Multi-Factor Authentication (MFA)"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('Security')}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ---------- Notifications Tab ---------- */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Notification Preferences
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.emailNotifications}
                      onChange={(e) =>
                        setNotifications({ ...notifications, emailNotifications: e.target.checked })
                      }
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.inAppNotifications}
                      onChange={(e) =>
                        setNotifications({ ...notifications, inAppNotifications: e.target.checked })
                      }
                    />
                  }
                  label="In-App Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.dailyDigest}
                      onChange={(e) =>
                        setNotifications({ ...notifications, dailyDigest: e.target.checked })
                      }
                    />
                  }
                  label="Daily Digest Email"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.weeklyReport}
                      onChange={(e) =>
                        setNotifications({ ...notifications, weeklyReport: e.target.checked })
                      }
                    />
                  }
                  label="Weekly Report"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('Notification')}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ---------- Integration Tab ---------- */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Integration Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Base URL"
                  value={integration.apiBaseUrl}
                  onChange={(e) =>
                    setIntegration({ ...integration, apiBaseUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/v1"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={integration.webhookUrl}
                  onChange={(e) =>
                    setIntegration({ ...integration, webhookUrl: e.target.value })
                  }
                  placeholder="https://hooks.example.com/events"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  value={integration.apiKey}
                  onChange={(e) =>
                    setIntegration({ ...integration, apiKey: e.target.value })
                  }
                  type={showApiKey ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                          size="small"
                        >
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRegenerateKey}
                  >
                    Regenerate Key
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('Integration')}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ---------- Snackbar ---------- */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={saveSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {saveMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SystemSettings
