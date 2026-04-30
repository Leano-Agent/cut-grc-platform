# CUT GRC Mobile Field Worker App

React Native mobile application for field workers to collect data, manage service requests, and communicate with the office.

## Features

### Field Data Collection
- Offline data collection and sync
- GPS integration for service locations
- Photo/document capture in field
- Barcode/QR code scanning

### Real-time Communication
- Real-time chat with office staff
- Push notifications for new assignments
- Status updates and reporting
- File sharing capabilities

### Service Management
- Service request assignment and tracking
- Work order management
- Time tracking and reporting
- Customer signature capture

### Offline Capabilities
- Offline data storage with SQLite
- Background sync when connectivity returns
- Conflict resolution for data updates
- Local caching of maps and resources

## Technology Stack

- **Framework:** React Native with TypeScript
- **Navigation:** React Navigation 6
- **State Management:** Redux Toolkit
- **Database:** SQLite for offline storage
- **Maps:** React Native Maps
- **Camera:** React Native Camera/Image Picker
- **Push Notifications:** Firebase Cloud Messaging
- **Offline Sync:** WatermelonDB or custom sync engine

## Development

### Prerequisites
- Node.js 18+
- React Native CLI or Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup
```bash
cd src/mobile-app
npm install
# For iOS
cd ios && pod install && cd ..
npm run ios
# For Android
npm run android
```

### Building for Production
```bash
# Android
npm run build:android
# iOS
npm run build:ios
```

## Architecture

### Data Flow
1. Field worker collects data offline
2. Data stored locally in SQLite
3. When connectivity available, sync with backend
4. Conflict resolution handles simultaneous updates
5. Real-time updates pushed to field workers

### Security
- JWT token authentication
- Encrypted local storage
- Secure API communication (HTTPS)
- Biometric authentication support
- Role-based access control

### Performance
- Lazy loading of components
- Image optimization and caching
- Efficient data synchronization
- Background processing for large uploads

## Testing

- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox
- Offline scenario testing
- Network condition simulation