#!/bin/bash

# Mobile App Setup Script
# This script sets up the mobile app for development

set -e

echo "🚀 Setting up CUT GRC Mobile Field App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if React Native CLI is installed
if ! command -v react-native &> /dev/null; then
    echo "📦 Installing React Native CLI..."
    npm install -g react-native-cli
fi

# Navigate to mobile app directory
cd "$(dirname "$0")/src/mobile-app"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install CocoaPods for iOS (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Setting up iOS dependencies..."
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        echo "⚠️  CocoaPods is not installed. Please install CocoaPods:"
        echo "   sudo gem install cocoapods"
        exit 1
    fi
    
    # Install iOS dependencies
    cd ios && pod install && cd ..
fi

# Create environment file
echo "🔧 Creating environment file..."
if [ ! -f .env ]; then
    cat > .env << EOF
# API Configuration
API_BASE_URL=https://api.cut-grc.com
API_TIMEOUT=30000

# Firebase Configuration (Push Notifications)
# FIREBASE_API_KEY=your_firebase_key
# FIREBASE_AUTH_DOMAIN=your_firebase_domain
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_STORAGE_BUCKET=your_storage_bucket
# FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# FIREBASE_APP_ID=your_app_id

# Payment Gateway Configuration
# PAYFAST_MERCHANT_ID=your_merchant_id
# PAYFAST_MERCHANT_KEY=your_merchant_key

# Map Configuration
# GOOGLE_MAPS_API_KEY=your_google_maps_key
EOF
    echo "⚠️  Please update .env file with your configuration"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p src/screens/auth
mkdir -p src/components/common
mkdir -p src/services
mkdir -p src/utils

# TypeScript check
echo "🔍 Running TypeScript check..."
npx tsc --noEmit || echo "⚠️  TypeScript errors found. Please fix them before building."

echo ""
echo "✅ Mobile App setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. For Android:"
echo "   - Set up Android Studio"
echo "   - Configure Android SDK"
echo "   - Run: npm run android"
echo ""
echo "3. For iOS (macOS only):"
echo "   - Install Xcode"
echo "   - Configure iOS development certificate"
echo "   - Run: npm run ios"
echo ""
echo "Development commands:"
echo "• npm start - Start Metro bundler"
echo "• npm run android - Run on Android"
echo "• npm run ios - Run on iOS (macOS)"
echo "• npm test - Run tests"
echo "• npm run type-check - TypeScript check"
echo ""
echo "⚠️  Note: Mobile app development requires additional setup:"
echo "   - Android Studio for Android development"
echo "   - Xcode for iOS development (macOS only)"
echo "   - Physical device or emulator"