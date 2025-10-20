
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
- public
- src
    . routes.tsx
    - components
        - atoms
        - molecules
        - organisms 
    - hooks
    - layouts
    - lib
    - pages                             <= contain all pages serve for routes.tsx
    - services??
    - stores                            <= global state
    . App.tsx
    . main.tsx
    . index.html
. .env
. docker-compose.dev.yml
. docker-compose.yml
. Dockerfile
. Dockerfile.dev
```


## Builtin Page
```
- /                                 HomePage
- /privacy                          PrivacyPage
- /user/profile                     UserProfilePage
- /user/asset                       USerAssetPage
- /admin/manage-user                UserManagerPage
- /admin/site-config                SiteConfigPage
- /models                           ModelsPage
- /models/:mid                      ModelPage
- /models/:mid/prototypes           PrototypesPage
- /models/:mid/prototypes/:pid      PrototypePage
...
```
    