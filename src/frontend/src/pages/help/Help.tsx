import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  MenuBook as DocsIcon,
  VideoLibrary as VideoIcon,
  Code as CodeIcon,
  Keyboard as KeyboardIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Help as HelpIcon
} from '@mui/icons-material'
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FaqItem {
  question: string
  answer: string
}

interface QuickLink {
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

interface ContactForm {
  subject: string
  message: string
  priority: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides and API documentation for the Ngome GRC Platform',
    icon: <DocsIcon sx={{ fontSize: 40 }} />,
    color: '#1976d2',
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video walkthroughs covering all platform features',
    icon: <VideoIcon sx={{ fontSize: 40 }} />,
    color: '#e91e63',
  },
  {
    title: 'API Reference',
    description: 'Full API endpoint reference with examples and response schemas',
    icon: <CodeIcon sx={{ fontSize: 40 }} />,
    color: '#388e3c',
  },
  {
    title: 'Keyboard Shortcuts',
    description: 'Boost your productivity with keyboard shortcuts and navigation tips',
    icon: <KeyboardIcon sx={{ fontSize: 40 }} />,
    color: '#f57c00',
  },
]

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I create a new risk assessment?',
    answer:
      'Navigate to Risk Management from the sidebar, then click the "New Risk Assessment" button in the top-right corner. Fill in the required fields including risk title, description, category, likelihood, and impact, then click Save to create the assessment.',
  },
  {
    question: 'What is the difference between a control and a policy?',
    answer:
      'A control is a specific measure (technical or procedural) implemented to mitigate a risk, such as a firewall rule or access review process. A policy is a high-level document that defines the rules and guidelines an organization follows. Controls are the practical implementation of policies.',
  },
  {
    question: 'How are compliance scores calculated?',
    answer:
      'Compliance scores are calculated based on the percentage of applicable controls that are passing against a given framework or standard. Each control is weighted equally by default, but administrators can adjust weightings in Settings. Scores are updated in real-time as control statuses change.',
  },
  {
    question: 'Can I export reports to PDF or Excel?',
    answer:
      'Yes. Open any report page and click the Export button in the top-right toolbar. You can choose between PDF and Excel formats. PDF exports include all charts and tables in a print-friendly layout, while Excel exports provide raw data for further analysis.',
  },
  {
    question: 'How do I assign users to a specific role?',
    answer:
      'Go to Administration > User Administration from the sidebar. Find the user you want to modify, click the Edit button, then select the desired role from the Role dropdown. The role change takes effect immediately. Note that only administrators can assign roles.',
  },
  {
    question: 'What notification types are available?',
    answer:
      'The platform supports email notifications and in-app bell notifications. You can configure which events trigger notifications in Settings > Notifications. Available triggers include: risk threshold breaches, audit due dates, compliance status changes, and system announcements.',
  },
  {
    question: 'How do I set up a recurring audit schedule?',
    answer:
      'Navigate to Audit Management and click "Schedule Audit". Set the frequency (weekly, monthly, quarterly, or annually), the start date, and assign an audit lead. The system will automatically create new audit instances at the specified interval and send reminders.',
  },
  {
    question: 'Is the platform SOC 2 compliant?',
    answer:
      'Yes, the Ngome GRC Platform is built with SOC 2 compliance in mind. We undergo annual Type II audits by an independent third party. Our security practices include encryption at rest and in transit, multi-factor authentication, audit logging, and regular penetration testing.',
  },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const DEFAULT_CONTACT_FORM: ContactForm = {
  subject: '',
  message: '',
  priority: 'normal',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Help = () => {
  /* ---------- state ---------- */
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contactForm, setContactForm] = useState<ContactForm>(DEFAULT_CONTACT_FORM)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  /* ---------- handlers ---------- */

  const handleFaqChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false)
  }

  const handleDialogOpen = () => {
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setContactForm(DEFAULT_CONTACT_FORM)
  }

  const handleContactSubmit = () => {
    setDialogOpen(false)
    setContactForm(DEFAULT_CONTACT_FORM)
    setSnackbarOpen(true)
  }

  const handleFormChange = (field: keyof ContactForm, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }))
  }

  /* ---------- derived ---------- */

  const filteredFaqs = FAQ_ITEMS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  /* ---------- render ---------- */

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Help & Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers, browse guides, and get in touch with our support team
        </Typography>
      </Box>

      {/* Search bar */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search help articles, FAQs, and documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Quick Links
      </Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {QUICK_LINKS.map((link) => (
          <Grid item xs={12} sm={6} md={3} key={link.title}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    bgcolor: `${link.color}14`,
                    color: link.color,
                    mb: 2,
                  }}
                >
                  {link.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {link.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {link.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAQ Section */}
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Frequently Asked Questions
      </Typography>
      <Card sx={{ mb: 5 }}>
        {filteredFaqs.length === 0 ? (
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HelpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No results found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Try adjusting your search query or browse all categories above
              </Typography>
            </Box>
          </CardContent>
        ) : (
          filteredFaqs.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expandedFaq === `faq-${index}`}
              onChange={handleFaqChange(`faq-${index}`)}
              disableGutters
              sx={{
                '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
                boxShadow: 'none',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 3,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500 }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Card>

      {/* Contact Support Section */}
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Contact Support
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    support@ngome.io
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Our team typically responds within 24 hours
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Average response: 4 hours" size="small" color="primary" variant="outlined" />
                <Chip label="Available: Mon–Fri, 08:00–18:00 GMT+2" size="small" color="primary" variant="outlined" />
                <Chip label="Emergency support: 24/7" size="small" color="error" variant="outlined" />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleDialogOpen}
              >
                Contact Us
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Contact Support
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              fullWidth
              label="Subject"
              placeholder="Brief description of your issue"
              value={contactForm.subject}
              onChange={(e) => handleFormChange('subject', e.target.value)}
            />
            <TextField
              fullWidth
              label="Message"
              placeholder="Describe your issue in detail..."
              value={contactForm.message}
              onChange={(e) => handleFormChange('message', e.target.value)}
              multiline
              rows={5}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={contactForm.priority}
                label="Priority"
                onChange={(e) => handleFormChange('priority', e.target.value)}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleContactSubmit}
            disabled={!contactForm.subject || !contactForm.message}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Your message has been sent. Our support team will respond within 24 hours.
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Help
