import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Outfit', sans-serif",
    h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 900 },
    h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 900 },
    h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 900 },
    h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    button: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.05em' },
  },
  palette: {
    mode: 'dark',
    primary: { main: '#00b4ff' },
    secondary: { main: '#FFD700' },
    background: {
      default: '#000d22',
      paper: '#001a3a',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
