# GitHub Integration - Quick Start Guide

## Installation

### 1. Install Dependencies

Run the installation script:
```bash
./install-github-integration.sh
```

Or manually:
```bash
cd frontend
npm install js-cookie @types/js-cookie
cd ..
```

### 2. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: AutoWRX Editor
   - **Homepage URL**: `http://localhost:3210` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3210/github/callback`
4. Click **"Register application"**
5. Copy your **Client ID**
6. Click **"Generate a new client secret"** and copy the **Client Secret**

### 3. Configure Environment Variables

#### Backend (.env)
```bash
cd backend
# Create or edit .env file
echo "GITHUB_CLIENT_ID=your_client_id_here" >> .env
echo "GITHUB_CLIENT_SECRET=your_client_secret_here" >> .env
```

#### Frontend (.env)
```bash
cd frontend
# Create or edit .env file
echo "VITE_GITHUB_CLIENT_ID=your_client_id_here" >> .env
```

**Important**: Use the SAME Client ID for both frontend and backend!

### 4. Restart Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Usage

### 1. Connect GitHub Account

1. Open any prototype in the editor
2. Scroll to the bottom of the file tree panel
3. Click **"Connect to GitHub"**
4. Authorize the app in GitHub
5. You'll be redirected back with a success message

### 2. Link Repository to Prototype

1. After connecting, click **"Link Repository"**
2. Choose to:
   - **Select existing repo**: Pick from your GitHub repositories
   - **Create new repo**: Enter name and description
3. Click **"Link Repository"**
4. The repository toolbar will appear with git operations

### 3. Commit Changes

1. Make changes in the editor
2. Click the commit icon (cloud with up arrow)
3. Select branch (if multiple exist)
4. Enter commit message
5. Click **"Commit & Push"**
6. Changes are pushed to GitHub!

### 4. View History

1. Click the history icon (clock)
2. View recent commits with:
   - Commit messages
   - Author information
   - Timestamps
   - Commit SHAs

### 5. Start Prototype from GitHub

1. Click **"New Prototype"**
2. If GitHub is connected, you'll see a repo selector
3. Select a repository
4. The editor will load `project.json` from that repo
5. Continue with prototype creation

## Verification

Test the integration:

1. **Authentication Test**:
   - ✅ GitHub connect button appears
   - ✅ OAuth redirect works
   - ✅ Returns to editor after auth
   - ✅ Shows connected status

2. **Repository Test**:
   - ✅ Can link existing repository
   - ✅ Can create new repository
   - ✅ Repository appears in GitHub

3. **Commit Test**:
   - ✅ Make editor changes
   - ✅ Commit with message
   - ✅ Check GitHub - commit appears

4. **Create from GitHub Test**:
   - ✅ New prototype form shows repos
   - ✅ Selecting repo loads project
   - ✅ Prototype created successfully

## Troubleshooting

### "GitHub OAuth not configured"
- Check backend `.env` has `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Restart backend server
- Clear browser cache

### "Authentication Failed"
- Verify callback URL in GitHub OAuth App: `http://localhost:3210/github/callback`
- Check frontend `.env` has `VITE_GITHUB_CLIENT_ID`
- Ensure Client IDs match in both frontend and backend
- Clear cookies and try again

### "Failed to connect GitHub account"
- Check MongoDB is running
- Check backend logs for errors
- Verify user is logged into the app
- Check network console for API errors

### Changes not appearing in GitHub
- Verify repository is correctly linked
- Check you have write access to the repository
- Ensure commit message is not empty
- Check backend logs for GitHub API errors

## Architecture Overview

```
┌─────────────┐     OAuth      ┌─────────────┐
│   GitHub    │ ◄─────────────► │   Backend   │
│   OAuth     │                 │  (Express)  │
└─────────────┘                 └─────────────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │   MongoDB   │
                                │ Credentials │
                                └─────────────┘
                                       
┌─────────────┐                ┌─────────────┐
│  Frontend   │ ◄─────────────► │   GitHub    │
│  (React)    │    REST API    │     API     │
└─────────────┘                └─────────────┘
       │
       ▼
┌─────────────┐
│   Cookies   │
│   (Cache)   │
└─────────────┘
```

## Data Flow

1. **OAuth Flow**:
   ```
   User → Frontend → GitHub → Callback → Backend → MongoDB
   ```

2. **Commit Flow**:
   ```
   Editor → Frontend → Backend → GitHub API → Repository
   ```

3. **Load from GitHub**:
   ```
   Form → Frontend → Backend → GitHub API → File Content → Editor
   ```

## Security Notes

- ✅ Client Secret never exposed to frontend
- ✅ Tokens stored securely in MongoDB
- ✅ CSRF protection with state parameter
- ✅ All endpoints require authentication
- ✅ Cookies are httpOnly where possible

## Production Deployment

When deploying to production:

1. **Create Production OAuth App**:
   - Use production URLs
   - Different Client ID/Secret

2. **Update Environment Variables**:
   - Use production credentials
   - Update callback URL

3. **Enable HTTPS**:
   - Required for secure OAuth
   - Update all URLs to https://

4. **MongoDB Security**:
   - Use authentication
   - Restrict network access
   - Regular backups

## API Endpoints

All endpoints require authentication (`Authorization: Bearer <token>`):

- `POST /api/v2/git/github/callback` - OAuth callback
- `GET /api/v2/git/github/status` - Auth status
- `DELETE /api/v2/git/github/disconnect` - Disconnect
- `GET /api/v2/git/repositories` - List repos
- `POST /api/v2/git/repositories` - Create repo
- `POST /api/v2/git/repositories/link` - Link to prototype
- `GET /api/v2/git/repos/:owner/:repo/contents` - Get file
- `PUT /api/v2/git/repos/:owner/:repo/contents` - Commit file
- `GET /api/v2/git/repos/:owner/:repo/commits` - History
- `GET /api/v2/git/repos/:owner/:repo/branches` - Branches

## Support

- 📖 Full Documentation: `docs/github-integration.md`
- 📋 Implementation Details: `GITHUB_INTEGRATION_SUMMARY.md`
- 🔧 Environment Template: `.env.github.example`

For issues, check:
1. Backend logs (`backend/`)
2. Frontend console (browser DevTools)
3. MongoDB connection
4. GitHub OAuth App settings
