# Coder Integration Setup Checklist

Quick reference checklist for setting up and testing the Coder integration.

## Initial Setup

- [ ] Run `./setup-coder.sh` or manually start services
- [ ] Verify Coder is accessible at http://localhost:7080
- [ ] Verify Gitea is accessible at http://localhost:3000
- [ ] Create Coder admin user
- [ ] Generate Coder admin API token
- [ ] Create Coder template named `docker-template` from `docker-template.tf`
- [ ] Complete Gitea installation
- [ ] Generate Gitea admin API token
- [ ] Add environment variables to `backend/.env`
- [ ] Restart backend to load new environment variables

## Backend Configuration

Add to `backend/.env`:
```bash
CODER_URL=http://localhost:7080
CODER_ADMIN_API_KEY=<token>
GITEA_URL=http://localhost:3000
GITEA_ADMIN_USERNAME=<username>
GITEA_ADMIN_PASSWORD=<password>
GITEA_ADMIN_TOKEN=<token>
```

## Testing Steps

### API Testing
- [ ] Test GET `/v2/system/coder/workspace/:prototypeId/status` (should return `not_created`)
- [ ] Test POST `/v2/system/coder/workspace/:prototypeId/prepare` (creates workspace)
- [ ] Test GET `/v2/system/coder/workspace/:prototypeId` (returns workspace URL)
- [ ] Verify workspace status changes from `starting` to `running`

### Frontend Testing
- [ ] Navigate to a Prototype's Code tab
- [ ] Verify loading state appears
- [ ] Verify workspace loads in iframe after 1-2 minutes
- [ ] Verify repository is cloned in workspace
- [ ] Test opening files in VS Code
- [ ] Test terminal in workspace

### Git Integration Testing
- [ ] Verify Gitea organization created for Model
- [ ] Verify Gitea repository created for Prototype
- [ ] Test `git status` in workspace terminal
- [ ] Test `git commit` in workspace
- [ ] Test `git push` to Gitea
- [ ] Verify commit appears in Gitea web interface

### Permission Testing
- [ ] Add user to Model with Contributor role
- [ ] Verify user added to Gitea team
- [ ] Remove user from Model
- [ ] Verify user removed from Gitea team
- [ ] Test lazy sync (open Code tab, verify permissions sync)

### GitHub Integration (Optional)
- [ ] Add GitHub token in user profile
- [ ] Create new workspace
- [ ] Verify GitHub token is injected
- [ ] Test cloning private GitHub repository

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Services won't start | Check Docker is running, check ports 7080 and 3000 are free |
| Coder workspace fails | Check Coder logs, verify template is correct, check Docker socket access |
| Gitea API errors | Verify Gitea is running, check admin token, test API manually |
| Iframe won't load | Check CORS settings, verify session token, check browser console |
| Git operations fail | Verify repository exists, check user permissions, verify network |
| Permissions not syncing | Check backend logs, verify UserRole records, test manual sync |

## Verification Commands

```bash
# Check services are running
docker compose -f coder-docker-compose.yml ps

# View Coder logs
docker compose -f coder-docker-compose.yml logs coder -f

# View Gitea logs
docker compose -f coder-docker-compose.yml logs gitea -f

# Test Coder API (replace TOKEN)
curl -H "Coder-Session-Token: TOKEN" http://localhost:7080/api/v2/users

# Test Gitea API (replace TOKEN)
curl -H "Authorization: token TOKEN" http://localhost:3000/api/v1/user

# Check workspace containers
docker ps | grep coder-
```

## Next Steps After Testing

- [ ] Update URLs for production environment
- [ ] Configure HTTPS/SSL
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Review security settings
- [ ] Document production deployment process
