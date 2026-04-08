// DiagnosticsPage.tsx - Diagnostic Tools Interface
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import { HealthAndSafety, BugReport, Speed, Storage } from '@mui/icons-material';

const DiagnosticsPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runHealthCheck = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthStatus({ status: 'error', message: 'Health check failed' });
    }
  };

  const runTests = async () => {
    setIsRunningTests(true);
    try {
      // Load and run test suite
      const TestSuite = (window as any).CUTGRCTestSuite;
      if (TestSuite) {
        const suite = new TestSuite();
        const results = await suite.runAllTests();
        setTestResults(results);
      } else {
        // Fallback to API test
        const response = await fetch('/api/tests/run', { method: 'POST' });
        const data = await response.json();
        setTestResults(data);
      }
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const openDiagnosticsDashboard = () => {
    window.open('/diagnostics.html', '_blank');
  };

  const openReactDebugger = () => {
    if ((window as any).__reactDebug) {
      (window as any).__reactDebug.enable();
      alert('React Debugger enabled. Check console for commands.');
    } else {
      alert('React Debugger not loaded. Make sure react-debugger.js is included.');
    }
  };

  useEffect(() => {
    runHealthCheck();
    
    // Load diagnostic scripts
    const scripts = [
      '/diagnostic-tools.js',
      '/test-suite.js',
      '/react-debugger.js',
      '/deployment-verification.js'
    ];
    
    scripts.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🛠️ Platform Diagnostics
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive monitoring, debugging, and testing tools for the CUT GRC platform.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HealthAndSafety sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Health Status</Typography>
          </Box>
          {healthStatus ? (
            <Alert severity={healthStatus.status === 'healthy' ? 'success' : 'error'}>
              {healthStatus.status === 'healthy' ? 'All systems operational' : healthStatus.message}
            </Alert>
          ) : (
            <CircularProgress size={24} />
          )}
          <Button variant="outlined" onClick={runHealthCheck} sx={{ mt: 2 }}>
            Refresh Health Check
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BugReport sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="h6">Testing Suite</Typography>
          </Box>
          <Typography variant="body2" paragraph>
            Run comprehensive platform tests to verify functionality.
          </Typography>
          <Button 
            variant="contained" 
            onClick={runTests} 
            disabled={isRunningTests}
            sx={{ mr: 2 }}
          >
            {isRunningTests ? <CircularProgress size={24} /> : 'Run All Tests'}
          </Button>
          {testResults && (
            <Alert severity={testResults.summary.failed === 0 ? 'success' : 'error'} sx={{ mt: 2 }}>
              {testResults.summary.passed}/{testResults.summary.total} tests passed
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Speed sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">Performance Tools</Typography>
          </Box>
          <Typography variant="body2" paragraph>
            Monitor performance and debug issues in real-time.
          </Typography>
          <Button variant="outlined" onClick={openDiagnosticsDashboard} sx={{ mr: 2, mb: 1 }}>
            Open Dashboard
          </Button>
          <Button variant="outlined" onClick={openReactDebugger}>
            Enable React Debugger
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Storage sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6">Deployment Verification</Typography>
          </Box>
          <Typography variant="body2" paragraph>
            Validate deployment configuration and performance.
          </Typography>
          <Button 
            variant="contained" 
            color="info"
            onClick={() => {
              if ((window as any).runDeploymentVerification) {
                (window as any).runDeploymentVerification().then((report: any) => {
                  alert(`Deployment Verification: ${report.summary.passed}/${report.summary.total} checks passed`);
                });
              } else {
                alert('Deployment verification tools not loaded.');
              }
            }}
          >
            Verify Deployment
          </Button>
        </Paper>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => window.open('/diagnostics.html', '_blank')}>
            📊 Full Diagnostic Dashboard
          </Button>
          <Button variant="outlined" onClick={() => console.log('🚀 Diagnostic tools loaded:', window)}>
            🐛 Check Console
          </Button>
          <Button variant="outlined" onClick={() => {
            if ((window as any).__reactDebug) {
              (window as any).__reactDebug.visualizeTree();
            }
          }}>
            🌳 Visualize Component Tree
          </Button>
          <Button variant="outlined" onClick={() => {
            const data = JSON.stringify({
              timestamp: new Date().toISOString(),
              url: window.location.href,
              userAgent: navigator.userAgent
            }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diagnostic-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
          }}>
            💾 Export Snapshot
          </Button>
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Diagnostic tools are for development and debugging purposes. 
          Some features may impact performance. Disable in production or restrict access to authorized users.
        </Typography>
      </Alert>
    </Box>
  );
};

export default DiagnosticsPage;
