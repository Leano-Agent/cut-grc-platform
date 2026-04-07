# CUT GRC Platform - Frontend

Enterprise Governance, Risk & Compliance (GRC) platform frontend built with React, TypeScript, and Material-UI, designed with African design principles and sovereignty in mind.

## 🎯 Features

- **Modern Stack**: React 18, TypeScript, Vite, Material-UI v5
- **Enterprise UI**: Professional dashboard with African-inspired design
- **Modular Architecture**: Clean separation of concerns with feature-based organization
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile
- **Internationalization**: Support for multiple African languages
- **Security**: JWT authentication, role-based access control, security headers
- **Performance**: Code splitting, lazy loading, optimized bundles
- **Testing**: Comprehensive test suite with Jest and React Testing Library

## 🏗️ Architecture

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (routes)
├── layouts/       # Layout components
├── hooks/         # Custom React hooks
├── store/         # Redux store and slices
├── services/      # API services and clients
├── utils/         # Utility functions
├── styles/        # Global styles and theme
├── assets/        # Static assets
└── constants/     # Application constants
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Backend API running (see backend README)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
5. Update `.env.local` with your configuration

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Linting and Formatting

```bash
npm run lint        # ESLint check
npm run lint:fix    # ESLint auto-fix
npm run format      # Prettier formatting
npm run check       # Combined lint, type check, and test
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
npm run docker:build
```

### Run Docker Container

```bash
npm run docker:run
```

The application will be available at `http://localhost:5173`

### Docker Compose

Use the main project's docker-compose.yml for full stack deployment.

## 🌍 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Render

1. Create a new Static Site on Render
2. Connect your repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables

### Traditional Hosting

1. Build the application: `npm run build`
2. Serve the `dist` directory with a web server (nginx, Apache)
3. Configure reverse proxy for API calls

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available variables:

- `VITE_API_BASE_URL`: Backend API URL
- `VITE_APP_ENVIRONMENT`: Environment (development/production)
- `VITE_ENABLE_DEBUG`: Enable debug features
- `VITE_DEFAULT_LANGUAGE`: Default language
- `VITE_THEME_MODE`: Default theme (light/dark)

### Theme Customization

The theme is defined in `src/styles/theme.ts` with African-inspired colors:

- **Primary**: Indigo (#4B0082) - wisdom and royalty
- **Secondary**: Ochre (#CC7722) - earth and tradition
- **Success**: Baobab green (#228B22)
- **Warning**: Acacia gold (#DAA520)
- **Error**: Adinkra red (#8B0000)

## 📱 Features by Module

### Dashboard
- Real-time metrics and KPIs
- Risk trends visualization
- Compliance status overview
- Recent activities feed

### Risk Management
- Risk identification and assessment
- Risk matrix visualization
- Mitigation planning
- Risk reporting

### Compliance Tracking
- Regulatory requirement tracking
- Compliance status monitoring
- Audit trail
- Evidence management

### Internal Controls
- Control design and implementation
- Control testing and monitoring
- Deficiency management
- Control effectiveness assessment

### Audit Management
- Audit planning and scheduling
- Finding management
- Corrective action tracking
- Audit reporting

### User Administration
- User management
- Role-based access control
- Permission management
- Activity logging

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Secure password policies
- Two-factor authentication support
- Session management
- Security headers (CSP, HSTS, etc.)
- Input validation and sanitization

## 📊 Performance Optimization

- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Cache strategies
- CDN integration
- Compression (gzip/brotli)

## 🌐 Internationalization

Supported languages:
- English (en)
- French (fr)
- Portuguese (pt)
- Swahili (sw)
- Zulu (zu)
- Xhosa (xh)

## 🧪 Testing Strategy

- Unit tests: Jest + React Testing Library
- Component tests: Storybook
- Integration tests: Cypress (planned)
- E2E tests: Playwright (planned)
- Accessibility tests: axe-core (planned)

## 📈 Monitoring and Analytics

- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Audit logging
- Security monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Built with African design principles
- Inspired by African sovereignty and unity
- Dedicated to African technological independence

## 🆘 Support

For support, contact: support@cutgrc.co.za