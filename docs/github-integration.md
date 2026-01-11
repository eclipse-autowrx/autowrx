# GitHub Integration Setup Guide

This guide explains how to set up GitHub OAuth integration for the AutoWRX project editor.

## Overview

The GitHub integration allows users to:
- Connect their GitHub account via OAuth
- Link GitHub repositories to prototypes
- Commit and push code changes directly from the online editor
- Pull existing projects from GitHub repositories
- View commit history and branches

## Prerequisites

1. A GitHub account
2. A registered GitHub OAuth App

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: AutoWRX Editor (or your preferred name)
   - **Homepage URL**: Your application URL (e.g., `http://localhost:3210` for development)
   - **Authorization callback URL**: `http://localhost:3210/github/callback` (or your production URL)
   - **Description**: (Optional) A description of your application

4. Click "Register application"
5. Note down the **Client ID**
6. Click "Generate a new client secret" and note down the **Client Secret**

## Step 2: Configure Environment Variables

### Backend Configuration

Add the following environment variables to your backend `.env` file:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

### Frontend Configuration

Add the following environment variable to your frontend `.env` file:

```env
# GitHub OAuth Configuration
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

**Note**: The frontend only needs the Client ID. The Client Secret should NEVER be exposed to the frontend.

## Step 3: Update Callback URL for Production

When deploying to production, make sure to:

1. Update the GitHub OAuth App's callback URL to your production URL:
   - Example: `https://yourdomain.com/github/callback`

2. Update the frontend environment variable to match your production domain

## Step 4: Add GitHub Callback Route

The GitHub callback route is already implemented in the codebase. Make sure your router includes the callback component:

```tsx
// In your App.tsx or routes configuration
import GitHubCallback from '@/components/molecules/github/GitHubCallback'

// Add the route
<Route path="/github/callback" element={<GitHubCallback />} />
```

## Features

### 1. GitHub Authentication

Users can connect their GitHub account through the ProjectEditor interface:

- Click the "Connect" button in the GitHub section
- Authorize the application in GitHub
- Credentials are stored in MongoDB and cookies for persistence

### 2. Repository Management

Once authenticated, users can:

- **Link existing repositories**: Select from their GitHub repositories
- **Create new repositories**: Create a new repository directly from the editor
- **View repository info**: See which repository is linked to the prototype

### 3. Git Operations

Available operations:

- **Commit & Push**: Commit changes with a message and push to GitHub
- **View History**: See commit history and branches
- **Pull**: (Future enhancement) Pull latest changes from GitHub

### 4. Create Prototype from GitHub

When creating a new prototype:

- Users can select an existing GitHub repository as the starting point
- The editor will load the `project.json` file from the repository
- This allows teams to quickly start new prototypes from existing codebases

## Security Considerations

1. **Client Secret**: Never expose the GitHub Client Secret in frontend code
2. **Token Storage**: Access tokens are stored in MongoDB with private fields that won't be exposed in API responses
3. **State Parameter**: OAuth flow uses state parameter to prevent CSRF attacks
4. **Token Expiration**: Consider implementing token refresh logic for long-lived sessions

## Data Persistence

### MongoDB Collections

Two new collections are created:

1. **gitcredentials**: Stores GitHub OAuth tokens and user information
   - Indexed by `user_id` for fast lookups
   - Access tokens marked as private fields

2. **gitrepositories**: Links prototypes to GitHub repositories
   - Indexed by `user_id` and `prototype_id`
   - Stores repository metadata (name, URL, default branch, etc.)

### Cookie Storage

GitHub authentication status is cached in cookies for:
- Faster UI updates on page reload
- Reduced API calls
- Better user experience

Cookie name: `github_auth`
Expiration: 365 days

## Troubleshooting

### "GitHub OAuth not configured" Error

- Verify that `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in backend `.env`
- Restart the backend server after adding environment variables

### "Invalid state parameter" Error

- This indicates a possible CSRF attack or session mismatch
- Clear browser cookies and try again
- Ensure you're using the correct callback URL

### Authentication Loop

- Check that the callback URL in GitHub OAuth App settings matches your application's callback route
- Verify that the frontend `VITE_GITHUB_CLIENT_ID` matches the backend `GITHUB_CLIENT_ID`

### "Failed to connect GitHub account" Error

- Check backend logs for detailed error messages
- Verify MongoDB connection is working
- Ensure user is authenticated in the application before connecting GitHub

## API Endpoints

### GitHub OAuth

- `POST /api/v2/git/github/callback` - Exchange OAuth code for access token
- `GET /api/v2/git/github/status` - Get authentication status
- `DELETE /api/v2/git/github/disconnect` - Disconnect GitHub account

### Repository Management

- `GET /api/v2/git/repositories` - List user's GitHub repositories
- `POST /api/v2/git/repositories` - Create a new GitHub repository
- `POST /api/v2/git/repositories/link` - Link repository to prototype
- `GET /api/v2/git/repositories/prototype/:prototypeId` - Get linked repository

### Git Operations

- `GET /api/v2/git/repos/:owner/:repo/contents` - Get file contents
- `PUT /api/v2/git/repos/:owner/:repo/contents` - Commit file changes
- `GET /api/v2/git/repos/:owner/:repo/commits` - Get commit history
- `GET /api/v2/git/repos/:owner/:repo/branches` - Get branches

## Future Enhancements

- [ ] Implement pull functionality to sync changes from GitHub
- [ ] Support for multiple files commit in a single operation
- [ ] Branch management (create, switch, merge)
- [ ] Conflict resolution UI
- [ ] Pull request creation from the editor
- [ ] GitHub Actions integration for CI/CD
- [ ] Collaboration features (real-time editing with GitHub sync)

## Support

For issues or questions:
1. Check the backend logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure MongoDB is running and accessible
4. Check GitHub OAuth App settings match your configuration
