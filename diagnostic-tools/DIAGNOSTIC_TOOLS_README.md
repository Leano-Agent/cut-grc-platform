# CUT GRC Platform - Diagnostic Tools Suite

## Overview
A comprehensive set of diagnostic, monitoring, and testing tools for the CUT GRC platform. This suite provides real-time debugging, performance monitoring, automated testing, and deployment verification capabilities.

## Tools Included

### 1. Diagnostic Dashboard (`diagnostics.html`)
A standalone HTML dashboard that provides real-time monitoring of:
- **Console Error Catcher**: Captures all browser console errors, warnings, and logs
- **Network Request Monitor**: Tracks all HTTP requests and responses
- **Health Check System**: Monitors backend services and deployment status
- **Automated Test Suite**: Runs comprehensive platform tests
- **Performance Monitor**: Tracks memory usage, CPU, FPS, and load times
- **System Information**: Displays browser, screen resolution, connection type, and timezone

### 2. Comprehensive Test Suite (`test-suite.js`)
A JavaScript test suite that can be integrated into the React application:
- **Authentication Tests**: Login, token validation, logout, password reset
- **API Integration Tests**: Endpoint availability, error handling, rate limiting
- **UI Component Tests**: Component rendering, form validation, responsive design
- **Performance Tests**: Load times, memory usage, API response times
- **Security Tests**: HTTPS enforcement, CORS headers, XSS protection
- **Database Tests**: Connection, CRUD operations, data consistency

### 3. React Component Debugger (`react-debugger.js`)
A debugging tool specifically for React applications:
- **Component Tree Visualization**: Real-time component hierarchy display
- **Render Tracking**: Monitors component re-renders and state changes
- **Prop Inspection**: Shows component props in real-time
- **Floating Debug Panel**: Always-visible debug interface
- **Console Commands**: Easy access via `__reactDebug` object

### 4. Deployment Verification Suite (`deployment-verification.js`)
Validates deployment health and configuration:
- **Health Checks**: Frontend, backend, database, authentication services
- **Configuration Checks**: Environment variables, CORS, API versioning
- **Security Checks**: HTTPS, security headers, Content Security Policy
- **Performance Checks**: API response times, page load, memory usage
- **Integration Checks**: External service connectivity
- **Data Validation**: Database schema, migrations, sample data

## Installation & Integration

### Quick Start
1. Copy all diagnostic tool files to your project:
   ```
   diagnostics.html
   diagnostic-tools.js
   test-suite.js
   react-debugger.js
   deployment-verification.js
   ```

2. Open `diagnostics.html` in a browser to access the diagnostic dashboard

### React Application Integration

#### Option 1: Standalone Dashboard
Include the diagnostic dashboard as a separate page in your application:
```javascript
// In your React router
<Route path="/diagnostics" element={<DiagnosticsPage />} />

// DiagnosticsPage component
function DiagnosticsPage() {
  return (
    <iframe 
      src="/diagnostics.html" 
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Diagnostic Tools"
    />
  );
}
```

#### Option 2: Integrated Debugging
Add the React debugger to your main application:
```javascript
// In your main App.js or index.js
import './react-debugger.js';

// The debugger auto-initializes when React is detected
// Access debug commands via window.__reactDebug
```

#### Option 3: Automated Testing
Integrate the test suite into your CI/CD pipeline:
```javascript
// In your test setup file
import CUTGRCTestSuite from './test-suite.js';

// Run tests
const testSuite = new CUTGRCTestSuite();
await testSuite.runAllTests();
```

## Usage Examples

### Console Commands
```javascript
// Access diagnostic tools from browser console
__reactDebug.enable();      // Enable React component tracking
__reactDebug.getTree();     // Get component tree
__reactDebug.export();      // Export debug data

// Run deployment verification
runDeploymentVerification().then(report => {
  console.log('Deployment Status:', report.summary);
});

// Run test suite
const testSuite = new CUTGRCTestSuite();
testSuite.runAllTests();
```

### Automated Health Checks
```javascript
// Schedule periodic health checks
setInterval(async () => {
  const verifier = new DeploymentVerificationSuite();
  const results = await verifier.runFullVerification();
  
  if (results.summary.failed > 0) {
    // Send alert
    console.error('Health check failed:', results);
  }
}, 300000); // Every 5 minutes
```

### React Error Boundary Integration
```javascript
// Use the debugger's error boundary
import { ErrorBoundary } from './react-debugger.js';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Features

### Real-time Monitoring
- **Live Console Logs**: Capture all console output
- **Network Traffic**: Monitor all HTTP requests/responses
- **Component Updates**: Track React component renders
- **Performance Metrics**: Memory, CPU, FPS, load times

### Automated Testing
- **Comprehensive Coverage**: 100+ test cases across all platform features
- **CI/CD Ready**: Exportable results for integration pipelines
- **Performance Benchmarks**: Validate against performance thresholds
- **Security Validation**: Check for common security issues

### Debugging Tools
- **Component Inspection**: View React component hierarchy and props
- **State Tracking**: Monitor state changes in real-time
- **Render Optimization**: Identify unnecessary re-renders
- **Error Tracking**: Capture and log React errors

### Deployment Verification
- **Pre-deployment Checks**: Validate configuration before deployment
- **Post-deployment Validation**: Verify deployment success
- **Performance Validation**: Ensure performance standards are met
- **Security Compliance**: Check security headers and configurations

## Configuration

### Diagnostic Dashboard
Customize the dashboard by editing `diagnostic-tools.js`:
```javascript
const config = {
  apiBaseUrl: 'https://api.yourdomain.com',
  performanceThresholds: {
    apiResponseTime: 1000,
    pageLoadTime: 3000,
    memoryUsage: 500
  }
};
```

### Test Suite
Configure test parameters:
```javascript
const testSuite = new CUTGRCTestSuite({
  apiEndpoints: {
    auth: '/api/auth',
    users: '/api/users',
    audit: '/api/audit'
  },
  testTimeout: 10000
});
```

### Deployment Verification
Set verification thresholds:
```javascript
const verifier = new DeploymentVerificationSuite({
  apiBaseUrl: process.env.API_URL,
  performanceThresholds: {
    apiResponseTime: 500,  // 500ms max
    pageLoadTime: 2000,    // 2 seconds max
    memoryUsage: 300       // 300MB max
  }
});
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Deployment Verification
on: [deployment]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Deployment Verification
        run: |
          node -e "
            const { DeploymentVerificationSuite } = require('./deployment-verification.js');
            const verifier = new DeploymentVerificationSuite({
              apiBaseUrl: process.env.API_URL
            });
            verifier.runFullVerification().then(results => {
              if (results.summary.failed > 0) {
                console.error('Deployment verification failed');
                process.exit(1);
              }
            });
          "
        env:
          API_URL: ${{ secrets.API_URL }}
```

### Exporting Results
All tools support JSON export for integration with monitoring systems:
```javascript
// Export test results
const testSuite = new CUTGRCTestSuite();
const results = await testSuite.runAllTests();
const jsonResults = JSON.stringify(results, null, 2);

// Send to monitoring service
fetch('https://monitoring.yourdomain.com/api/results', {
  method: 'POST',
  body: jsonResults
});
```

## Best Practices

1. **Development Environment**: Enable all debug tools during development
2. **Staging Environment**: Run deployment verification before production deployment
3. **Production Environment**: Use health checks and performance monitoring only
4. **Regular Testing**: Schedule automated test runs daily or weekly
5. **Alerting**: Set up alerts for failed health checks or performance degradation

## Troubleshooting

### Common Issues

1. **React Debugger Not Working**
   - Ensure React is loaded before the debugger script
   - Check browser console for initialization errors
   - Verify React version compatibility (supports React 16.8+)

2. **Network Monitoring Not Capturing Requests**
   - Some libraries (axios, jQuery) may not use fetch/XHR
   - Check if requests are being made via other methods
   - Enable CORS if monitoring cross-origin requests

3. **Performance Metrics Unavailable**
   - Some browsers restrict performance.memory API
   - Use fallback simulation in those cases
   - Check browser compatibility

4. **Test Suite Failing**
   - Verify API endpoints are accessible
   - Check authentication tokens if required
   - Review test timeout settings

## Security Considerations

1. **Production Use**: Disable debug tools in production or restrict access
2. **Data Exposure**: Debug tools may expose sensitive data - use with caution
3. **Access Control**: Restrict diagnostic dashboard access to authorized users
4. **API Keys**: Never hardcode API keys in diagnostic tools

## Support

For issues, questions, or contributions:
1. Check the browser console for error messages
2. Review the tool configuration
3. Ensure all dependencies are properly loaded
4. Contact the development team for assistance

## License
These diagnostic tools are provided as part of the CUT GRC platform. Use them responsibly and in accordance with your organization's security policies.

---

**Last Updated**: April 8, 2026  
**Version**: 1.0.0  
**Compatibility**: React 16.8+, Modern Browsers, Node.js 14+