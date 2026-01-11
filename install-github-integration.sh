#!/bin/bash
# Installation script for GitHub Integration dependencies

echo "Installing GitHub Integration Dependencies..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install js-cookie
npm install --save-dev @types/js-cookie

echo "✓ Frontend dependencies installed"

cd ..

# Backend dependencies (already included in package.json)
echo "✓ Backend dependencies already included"

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Create a GitHub OAuth App at https://github.com/settings/developers"
echo "2. Copy .env.github.example and add your credentials:"
echo "   - Backend: Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
echo "   - Frontend: Add VITE_GITHUB_CLIENT_ID"
echo "3. Restart both servers:"
echo "   - Backend: npm run dev (in backend directory)"
echo "   - Frontend: npm run dev (in frontend directory)"
echo ""
echo "For detailed setup instructions, see:"
echo "- docs/github-integration.md"
echo "- GITHUB_INTEGRATION_SUMMARY.md"
echo ""
