#!/bin/bash

# Simple build script for CUT GRC Frontend
# This creates a minimal static version that can be deployed immediately

echo "Building minimal static version..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy the minimal index.html to dist
cp minimal-index.html dist/index.html

# Create a simple 404 page
cat > dist/404.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - CUT GRC Platform</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #4B0082; }
        a { color: #CC7722; text-decoration: none; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <p><a href="/">Return to Home</a></p>
</body>
</html>
EOF

# Create a health check endpoint
cat > dist/health.html << 'EOF'
{"status":"healthy","service":"frontend","timestamp":"'$(date -Iseconds)'"}
EOF

# Create a simple manifest.json for PWA
cat > dist/manifest.json << 'EOF'
{
  "name": "CUT GRC Platform",
  "short_name": "CUT GRC",
  "description": "Governance, Risk & Compliance Management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF9F6",
  "theme_color": "#4B0082",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF

echo "Build complete! Files in dist/:"
ls -la dist/

echo ""
echo "To test locally:"
echo "  cd dist && python3 -m http.server 8080"
echo "Then open http://localhost:8080 in your browser"