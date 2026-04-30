#!/bin/bash

# Public Portal Setup Script
# This script sets up the public portal for development

set -e

echo "🚀 Setting up CUT GRC Public Portal..."

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

# Navigate to public portal directory
cd "$(dirname "$0")/src/public-portal"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file
echo "🔧 Creating environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p src/i18n/locales

# Create placeholder translation files
echo "🌍 Creating placeholder translation files..."
for lang in en af zu xh nso tn st ts ss ve nr; do
    if [ ! -f "src/i18n/locales/${lang}.json" ]; then
        echo '{}' > "src/i18n/locales/${lang}.json"
    fi
done

# Copy English translations to other languages as placeholders
if [ -f "src/i18n/locales/en.json" ]; then
    for lang in af zu xh nso tn st ts ss ve nr; do
        if [ "$lang" != "en" ]; then
            cp "src/i18n/locales/en.json" "src/i18n/locales/${lang}.json"
        fi
    done
fi

# Build the project
echo "🔨 Building project..."
npm run build

echo ""
echo "✅ Public Portal setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Add actual translations to src/i18n/locales/"
echo "3. Run 'npm run dev' to start development server"
echo "4. Run 'npm run build' to create production build"
echo ""
echo "Development server: http://localhost:3000"
echo "Production build: dist/ directory"