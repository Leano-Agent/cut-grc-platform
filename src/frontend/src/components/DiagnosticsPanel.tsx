// DiagnosticsPanel.tsx - Simple diagnostic panel for React app
import React, { useEffect } from 'react';
import { Button, Paper, Typography, Box, Alert } from '@mui/material';

const DiagnosticsPanel: React.FC = () => {
  useEffect(() => {
    // Load diagnostic tools
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // Load diagnostic tools if not already loaded
    if (!(window as any).CUTGRCTestSuite) {
      loadScript('/diagnostic-tools/diagnostic-tools.js').catch(console.error);
    }
    if (!(window as any).__reactDebug) {
      loadScript('/diagnostic-tools/react-debugger.js').catch(console.error);
    }
  }, []);

  const openDiagnostics = () => {
    window.open('/diagnostic-tools/', '_blank');
  };

  const runQuickTest = () => {
    if ((window as any).CUTGRCTestSuite) {
      const TestSuite = (window as any).CUTGRCTestSuite;
      const suite = new TestSuite();
      suite.runAllTests();
    } else {
      alert('Test suite not loaded. Please refresh the page.');
    }
  };

  const enableDebugger = () => {
    if ((window as any).__reactDebug) {
      (window as any).__reactDebug.enable();
      alert('React debugger enabled. Check console for commands.');
    } else {
      alert('React debugger not loaded. Please refresh the page.');
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        🛠️ Diagnostic Tools
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Access comprehensive monitoring, debugging, and testing tools for the platform.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button variant="contained" onClick={openDiagnostics}>
          Open Diagnostic Dashboard
        </Button>
        
        <Button variant="outlined" onClick={runQuickTest}>
          Run Quick Test
        </Button>
        
        <Button variant="outlined" onClick={enableDebugger}>
          Enable React Debugger
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Diagnostic tools are loaded from <code>/diagnostic-tools/</code> directory.
          Open browser console to access debug commands.
        </Typography>
      </Alert>
      
      <Box sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
        <Typography variant="body2">
          <strong>Console Commands:</strong>
        </Typography>
        <code style={{ display: 'block', background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
          __reactDebug.enable()<br/>
          __reactDebug.getTree()<br/>
          new CUTGRCTestSuite().runAllTests()<br/>
          runDeploymentVerification()
        </code>
      </Box>
    </Paper>
  );
};

export default DiagnosticsPanel;
