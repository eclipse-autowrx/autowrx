
# Feature Breakdown

The following list breaks down the platform's features into `Core` and `[Plugin]` categories.

- **Base Platform (Core)**
    - **User & Authentication**
        - Signin/Signup/Register/Forgot Password(Core)
        - User Management(Core)
        - User Profile Management(Core)
        - **SSO Providers:** [Plugin] (e.g., Google, SAML, GitHub)
    - **System Logging** (Core)
    - **SiteConfiguration** (Core)
        - **ModuleConfig**
        - **HomeConfig**
        - **StyleConfig**
        - **PrototypeUIConfig**

- **Model Manager**
    - Create/Edit/Delete Model (Core)
    - Create/Edit/Delete API (Core)
        - COVESA Manager (Core)
        - USP Manager [Plugin]
        - V2C(REST) Manager [Plugin]
        - **Other API Standards:** [Plugin]
    - **Additional Model Features:** [Plugin]

- **Prototype Manager**
    - Create/Edit/Delete Prototype (Core)
    - Customer Journey Designer [Plugin]
    - Flow Designer [Plugin]
    - **Project Editor** [Plugin]
        - Git Sync
        - Code Agent
    - **Dashboard Renderer** (Core)
        - Core Widget Rendering Engine (Core)
        - **Widget Generator (e.g., Replit):** [Plugin]
        - **Widget Marketplace:** [Plugin]
    - **Runner** (Core)
        - Runtime Connector
        - Debugger
    - **Deployer** (Core)
        - **Deploy to Marketplace:** [Plugin]
        - **Deploy to HW Kit:** [Plugin]
        - **Deploy to EPAM:** [Plugin]
    - **Staging Environments:** [Plugin]
    - **Other Prototype Features:** [Plugin]
- **Plugin Manager**(Core)
    - PluginInstaller(Core)
    - PluginLoader(Core)
    

## Project Structure
```
autowrx/                            # monorepo root
- frontend/                         # Vite + React 18 SPA
    - src/
        - components/{atoms,molecules,organisms}
        - pages  layouts  hooks  services  stores  providers
        - configs  types  const  data  lib  utils
        - configs/routes.tsx        # route table
- backend/                          # Express 4 + Mongoose 8 API
    - src/
        - routes/v2/{user-management,vehicle-data,content,system}
        - controllers  services  models  validations  middlewares
        - config  utils  decorators  typedefs  scripts
    - static/                       # served at /static (global.css, plugin/, builtin-widgets/, images/)
    - Dockerfile
- instance-setup/                   # production Docker Compose + env sample + up.sh/down.sh
- dev-stage/  scripts/  docs/  .github/workflows/
```


## Builtin Page
```
- /                                 PageHome
- /profile                          PageUserProfile
- /privacy-policy                   PagePrivacyPolicy
- /my-assets                        PageMyAssets
- /admin/manage-users               PageManageUsers
- /admin/site-config                SiteConfigManagement
- /model                            PageModelList
- /model/:model_id                  PageModelDetail
- /model/:model_id/library          PagePrototypeLibrary
- /model/:model_id/library/prototype/:prototype_id   PagePrototypeDetail
...
```
    