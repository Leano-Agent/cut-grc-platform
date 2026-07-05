import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemButton, ListItemText, Divider, Alert,
  Snackbar, Paper,
} from '@mui/material'
import {
  Add as AddIcon, Save as SaveIcon, Preview as PreviewIcon,
  Email as EmailIcon, Edit as EditIcon,
} from '@mui/icons-material'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmailTemplate {
  id: string
  name: string
  description: string
  subject: string
  body: string
  lastModified: string
}

/* ------------------------------------------------------------------ */
/*  Available variables for insertion                                  */
/* ------------------------------------------------------------------ */

const AVAILABLE_VARIABLES = [
  { label: '{{user.name}}', description: 'Recipient full name' },
  { label: '{{org.name}}', description: 'Organisation name' },
  { label: '{{link}}', description: 'Action / confirmation link' },
  { label: '{{user.email}}', description: 'Recipient email address' },
  { label: '{{audit.date}}', description: 'Audit due date' },
  { label: '{{compliance.deadline}}', description: 'Compliance deadline' },
  { label: '{{risk.level}}', description: 'Risk severity level' },
  { label: '{{report.name}}', description: 'Generated report name' },
  { label: '{{report.link}}', description: 'Link to generated report' },
  { label: '{{org.support_email}}', description: 'Support contact email' },
]

/* ------------------------------------------------------------------ */
/*  Mock data — 6 email templates                                     */
/* ------------------------------------------------------------------ */

const MOCK_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-welcome',
    name: 'Welcome Email',
    description: 'Sent to new users upon account creation',
    subject: 'Welcome to {{org.name}}, {{user.name}}!',
    body:
      'Hi {{user.name}},\n\n'
      + 'Welcome to {{org.name}}! We are excited to have you on board.\n\n'
      + 'To get started, please verify your account by clicking the link below:\n'
      + '{{link}}\n\n'
      + 'If you have any questions, feel free to reach out to our support team at {{org.support_email}}.\n\n'
      + 'Best regards,\nThe {{org.name}} Team',
    lastModified: '2026-06-28 14:30',
  },
  {
    id: 'tmpl-password-reset',
    name: 'Password Reset',
    description: 'Sent when a user requests a password reset',
    subject: 'Reset your {{org.name}} password',
    body:
      'Hi {{user.name}},\n\n'
      + 'We received a request to reset the password for your {{org.name}} account.\n\n'
      + 'Click the link below to reset your password:\n'
      + '{{link}}\n\n'
      + 'This link will expire in 24 hours. If you did not request a password reset, please ignore this email.\n\n'
      + 'Best regards,\nThe {{org.name}} Team',
    lastModified: '2026-07-01 09:15',
  },
  {
    id: 'tmpl-audit-notification',
    name: 'Audit Notification',
    description: 'Notifies users of upcoming or scheduled audits',
    subject: 'Audit Notification — {{audit.date}}',
    body:
      'Hi {{user.name}},\n\n'
      + 'This is a notification regarding an upcoming audit scheduled for {{audit.date}}.\n\n'
      + 'Please review the relevant documentation and ensure all records are up to date.\n\n'
      + 'If you have any questions, please contact your audit coordinator.\n\n'
      + 'Best regards,\nThe {{org.name}} Team',
    lastModified: '2026-06-25 11:00',
  },
  {
    id: 'tmpl-compliance-reminder',
    name: 'Compliance Reminder',
    description: 'Reminder for approaching compliance deadlines',
    subject: 'Compliance Deadline Reminder — {{compliance.deadline}}',
    body:
      'Hi {{user.name}},\n\n'
      + 'This is a reminder that the compliance deadline for {{compliance.deadline}} is approaching.\n\n'
      + 'Please ensure all required submissions and documentation are completed on time to avoid any compliance issues.\n\n'
      + 'Thank you for your attention to this matter.\n\n'
      + 'Best regards,\nThe {{org.name}} Team',
    lastModified: '2026-06-30 16:45',
  },
  {
    id: 'tmpl-risk-alert',
    name: 'Risk Alert',
    description: 'Alert sent when a risk exceeds defined thresholds',
    subject: '[{{risk.level}}] Risk Alert — Action Required',
    body:
      'Hi {{user.name}},\n\n'
      + 'A risk has been identified that exceeds the defined threshold.\n\n'
      + 'Risk Level: {{risk.level}}\n\n'
      + 'Please review the details and take appropriate action at your earliest convenience.\n\n'
      + 'Best regards,\nThe {{org.name}} Team',
    lastModified: '2026-07-02 08:20',
  },
  {
    id: 'tmpl-report-ready',
    name: 'Report Ready',
    description: 'Notification that a requested report is available',
    subject: 'Your report "{{report.name}}" is ready',
    body:
      'Hi {{user.name}},\n\n'
      + 'The report "{{report.name}}" you requested is now ready.\n\n'
      + 'You can access it using the link below:\n'
      + '{{report.link}}\n\n'
      + 'Best regards,\nThe {{org.name}} Team',
    lastModified: '2026-07-03 10:10',
  },
]

/* ------------------------------------------------------------------ */
/*  Default new template shape                                         */
/* ------------------------------------------------------------------ */

const emptyTemplate = (): EmailTemplate => ({
  id: '',
  name: '',
  description: '',
  subject: '',
  body: '',
  lastModified: new Date().toISOString().slice(0, 16).replace('T', ' '),
})

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const EmailTemplates = () => {
  /* ---------- state ---------- */
  const [templates, setTemplates] = useState<EmailTemplate[]>(MOCK_TEMPLATES)
  const [selectedId, setSelectedId] = useState<string>(MOCK_TEMPLATES[0].id)
  const [editing, setEditing] = useState<EmailTemplate>({ ...MOCK_TEMPLATES[0] })
  const [isDirty, setIsDirty] = useState(false)

  /* ---------- add dialog ---------- */
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<EmailTemplate>(emptyTemplate())

  /* ---------- preview dialog ---------- */
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState({ subject: '', body: '' })

  /* ---------- snackbar ---------- */
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const [snackbarMessage, setSnackbarMessage] = useState('')

  /* ---------- derived ---------- */
  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null
  const totalTemplates = templates.length

  /* ---------- helpers ---------- */

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /* ---------- editor sync ---------- */

  const handleSelectTemplate = (id: string) => {
    const tmpl = templates.find((t) => t.id === id)
    if (tmpl) {
      setSelectedId(id)
      setEditing({ ...tmpl })
      setIsDirty(false)
    }
  }

  const handleEditChange = (field: keyof EmailTemplate, value: string) => {
    setEditing((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const insertVariable = (variable: string) => {
    setEditing((prev) => ({ ...prev, body: prev.body + variable }))
    setIsDirty(true)
  }

  /* ---------- save ---------- */

  const handleSave = () => {
    if (!editing.name.trim()) {
      showSnackbar('Template name is required', 'error')
      return
    }

    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editing.id
          ? {
              ...editing,
              lastModified: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          : t,
      ),
    )
    setIsDirty(false)
    showSnackbar(`Template "${editing.name}" saved successfully`, 'success')
  }

  /* ---------- preview ---------- */

  const handlePreview = () => {
    setPreviewContent({
      subject: editing.subject,
      body: editing.body,
    })
    setPreviewOpen(true)
  }

  /* ---------- add new template ---------- */

  const handleOpenAddDialog = () => {
    setNewTemplate(emptyTemplate())
    setAddDialogOpen(true)
  }

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false)
  }

  const handleNewTemplateChange = (field: keyof EmailTemplate, value: string) => {
    setNewTemplate((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      showSnackbar('Template name is required', 'error')
      return
    }

    const created: EmailTemplate = {
      ...newTemplate,
      id: `tmpl-${Date.now()}`,
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim(),
      lastModified: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }

    setTemplates((prev) => [...prev, created])
    setSelectedId(created.id)
    setEditing({ ...created })
    setIsDirty(false)
    setAddDialogOpen(false)
    showSnackbar(`Template "${created.name}" created successfully`, 'success')
  }

  /* ---------- render ---------- */

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Email Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system email templates and their content
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Template
        </Button>
      </Box>

      {/* Stats Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Templates
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalTemplates}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <EmailIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  system templates
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main — left list + right editor */}
      <Grid container spacing={3}>
        {/* ---- Left: template list ---- */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, px: 2, pt: 2, pb: 1 }}
              >
                Templates
              </Typography>
              <Divider />
              <List dense disablePadding>
                {templates.map((tmpl) => (
                  <ListItem key={tmpl.id} disablePadding>
                    <ListItemButton
                      selected={selectedId === tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderLeft: selectedId === tmpl.id ? 3 : 0,
                        borderColor: 'primary.main',
                        bgcolor: selectedId === tmpl.id ? 'action.selected' : 'transparent',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {tmpl.name}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {tmpl.description}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                              {formatDate(tmpl.lastModified)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* ---- Right: template editor ---- */}
        <Grid item xs={12} md={8}>
          {selectedTemplate ? (
            <Card>
              <CardContent>
                {/* Editor header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Edit Template
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PreviewIcon />}
                      onClick={handlePreview}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={!isDirty}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={2.5}>
                  {/* Template Name */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Template Name"
                      value={editing.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      size="small"
                    />
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={editing.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      size="small"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  {/* Subject line */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject Line"
                      value={editing.subject}
                      onChange={(e) => handleEditChange('subject', e.target.value)}
                      size="small"
                      placeholder="e.g. Welcome to {{org.name}}, {{user.name}}!"
                      helperText={
                        <Typography variant="caption" color="text.secondary">
                          Use variables like{' '}
                          <Chip label="{{user.name}}" size="small" variant="outlined" sx={{ height: 18, fontSize: 11, cursor: 'pointer' }} />
                          ,{' '}
                          <Chip label="{{org.name}}" size="small" variant="outlined" sx={{ height: 18, fontSize: 11, cursor: 'pointer' }} />
                          ,{' '}
                          <Chip label="{{link}}" size="small" variant="outlined" sx={{ height: 18, fontSize: 11, cursor: 'pointer' }} />
                        </Typography>
                      }
                    />
                  </Grid>

                  {/* Email Body */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Body"
                      value={editing.body}
                      onChange={(e) => handleEditChange('body', e.target.value)}
                      multiline
                      rows={14}
                      size="small"
                      sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
                    />
                  </Grid>
                </Grid>

                {/* Available Variables */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Available Variables
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Click a variable to insert it at the end of the email body
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {AVAILABLE_VARIABLES.map((v) => (
                      <Chip
                        key={v.label}
                        label={v.label}
                        size="small"
                        variant="outlined"
                        color="primary"
                        title={v.description}
                        onClick={() => insertVariable(v.label)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <EmailIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a template to edit
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Choose a template from the left panel or create a new one
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* ---- Add Template Dialog ---- */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={newTemplate.name}
              onChange={(e) => handleNewTemplateChange('name', e.target.value)}
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newTemplate.description}
              onChange={(e) => handleNewTemplateChange('description', e.target.value)}
              size="small"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Subject Line"
              value={newTemplate.subject}
              onChange={(e) => handleNewTemplateChange('subject', e.target.value)}
              size="small"
              placeholder="e.g. Welcome to {{org.name}}"
            />
            <TextField
              fullWidth
              label="Email Body"
              value={newTemplate.body}
              onChange={(e) => handleNewTemplateChange('body', e.target.value)}
              size="small"
              multiline
              rows={8}
              sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTemplate}>
            Create Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Preview Dialog ---- */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Subject
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {previewContent.subject}
              </Typography>
            </Paper>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Body
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', minHeight: 200 }}>
              {previewContent.body.split('\n').map((line, i) => (
                <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {line}
                </Typography>
              ))}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Snackbar ---- */}
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

export default EmailTemplates
