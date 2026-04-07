import { createTheme } from '@mui/material/styles'

// African-inspired color palette
const africanColors = {
  // Earth tones - inspired by African landscapes
  earth: {
    sand: '#E6D5B8',
    clay: '#C44536',
    soil: '#8B4513',
    ochre: '#CC7722',
  },
  // Nature tones - inspired by African flora
  nature: {
    savanna: '#8FBC8F',
    baobab: '#228B22',
    acacia: '#DAA520',
    desert: '#F5DEB3',
  },
  // Cultural tones - inspired by African textiles and art
  cultural: {
    kenteGold: '#FFD700',
    adinkraRed: '#8B0000',
    mudclothBrown: '#654321',
    indigo: '#4B0082',
  },
  // Modern accents
  modern: {
    techBlue: '#1E88E5',
    successGreen: '#4CAF50',
    warningOrange: '#FF9800',
    errorRed: '#F44336',
  },
}

// Create theme with African design principles
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: africanColors.cultural.indigo, // Indigo for primary - represents wisdom and royalty
      light: '#7B68EE',
      dark: '#191970',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: africanColors.earth.ochre, // Ochre for secondary - represents earth and tradition
      light: '#E6B325',
      dark: '#8B6914',
      contrastText: '#000000',
    },
    background: {
      default: '#FAF9F6', // Light sand color
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50', // Dark blue-grey for good readability
      secondary: '#546E7A',
    },
    success: {
      main: africanColors.nature.baobab, // Baobab green for success
    },
    warning: {
      main: africanColors.nature.acacia, // Acacia gold for warnings
    },
    error: {
      main: africanColors.cultural.adinkraRed, // Adinkra red for errors
    },
    info: {
      main: africanColors.modern.techBlue, // Tech blue for information
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
          backgroundColor: africanColors.earth.sand,
          borderRight: `1px solid ${africanColors.earth.sand}`,
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