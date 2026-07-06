import { createTheme } from '@mui/material/styles'

// ── Ngome Brand Palette ───────────────────────────────────────────
// The Fortress for African Governance
// Source: Ngome-Brand-Guidelines.md (Jul 2026)

const brand = {
  // Primary
  fortressNavy: '#1B2A5E',   // Primary brand color, text, dark backgrounds
  deepCitadel: '#0D1A3E',    // Gradients, shadows, battlements
  // Accent
  africanGold: '#D4A017',    // Accents, gates, highlights, buttons
  terracotta: '#C1440E',     // Action items, taglines, Ndebele band
  // Neutrals
  slateCharcoal: '#2A3441',  // Secondary text, borders
  savannaSand: '#F5F2EB',    // App backgrounds, light sections
  white: '#FFFFFF',
}

// Create theme with African design principles
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.fortressNavy,
      light: '#3A4A7E',
      dark: brand.deepCitadel,
      contrastText: brand.white,
    },
    secondary: {
      main: brand.africanGold,
      light: '#E6B840',
      dark: '#B8890F',
      contrastText: brand.deepCitadel,
    },
    background: {
      default: brand.savannaSand,
      paper: brand.white,
    },
    text: {
      primary: brand.deepCitadel,
      secondary: brand.slateCharcoal,
    },
    success: {
      main: '#228B22', // Baobab green
    },
    warning: {
      main: brand.africanGold,
    },
    error: {
      main: brand.terracotta,
    },
    info: {
      main: '#1E88E5',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#2C3E50',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: brand.savannaSand,
          borderRight: `1px solid ${brand.savannaSand}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F8F9FA',
        },
      },
    },
  },
})

export default theme