# Webapp and Coder workspace integration
_Exported on 1/20/2026 at 17:28:21 GMT+7 from Cursor (2.3.41)_

---

**User**

@guide.md base on what we have setup coder here, I have a few questions. I have a webapp, where each project is a repo(python or C++). We need a workspace with vscode online exactly the way coder do here, But coder have its own user management, and mechanism. In my webapp, I need UI to do more thing like idea generation, customer journey, code, demo and homologation.... So We only have one phase for code and debug. Then how can we combine my app with what coder have. For example, We alread have a default template, when user open my app, and open code tab, workspace will be created auto and each app(project) have it own git repo. Then workspace will be created and user can start to code and debug right away.

---

**Cursor**

To integrate Coder into your custom web application while maintaining your own user flow (Idea -> Journey -> Code), you should treat Coder as a **backend infrastructure service** rather than a standalone portal.

Here is the architectural blueprint to achieve your goal:

### 1. High-Level Architecture

Your webapp acts as the "Orchestrator," and Coder acts as the "IDE Engine."

1.  **Identity (SSO):** Your app manages users. Coder trusts your app (or your Auth provider) via OIDC.
2.  **Orchestration (API):** When a user enters the "Code" phase, your app's backend talks to Coder's API to provision a workspace silently.
3.  **Presentation (Embed):** Once ready, your app embeds the VS Code Web interface (served by Coder) directly into your "Code" tab.

### 2. Step-by-Step Implementation Plan

#### A. Authentication: "Invisible" Login
You don't want users to log in twice. Configure Coder to use **OpenID Connect (OIDC)**.
*   **If you use Auth0/Keycloak/Cognito:** Point both your Webapp and Coder to the same provider.
*   **If you have custom Auth:** You can expose a simple OIDC-compliant endpoint from your app, or generate a Coder session token via API for the user on the backend.

When the user opens your "Code" tab, if they aren't authenticated with Coder, your iframe/redirect flow will automatically log them in via the OIDC handshake.

#### B. Automated Workspace Creation (The "Code" Tab Logic)
When a user navigates to a project's "Code" tab in your app, your backend should trigger this logic:

1.  **Check for existing workspace:** Call Coder API to see if a workspace named `proj-{project_id}-{user_id}` exists.
2.  **If Missing (Create):** Call the Create Workspace API with the **Git Repo URL**.
3.  **If Stopped (Start):** Call the Build API to start the workspace.
4.  **If Running:** Get the URL.

**API Call Example (Node.js/Python pseudocode):**

To pass the Git Repo URL dynamically to your existing `docker-template.tf`, you use `rich_parameter_values`.

```json
POST /api/v2/organizations/{default}/members/{user_id}/workspaces
{
  "name": "project-alpha-123",
  "template_id": "YOUR_TEMPLATE_UUID",
  "rich_parameter_values": [
    {
      "name": "git_repo",
      "value": "https://github.com/your-org/project-alpha.git"
    }
  ]
}
```

*Note: This utilizes the `data "coder_parameter" "git_repo"` block already defined in your `docker-template.tf`.*

#### C. Embedding the IDE
Once the workspace is `Running`, the Coder API returns the workspace details. You need the URL for the `code-server` app you defined in your template.

Your `docker-template.tf` outputs this as:
```hcl
resource "coder_app" "code-server" {
  url = "http://localhost:13337/?folder=/home/coder/project"
  # ...
}
```

In your webapp's frontend:
```html
<!-- Inside your Code Tab -->
<iframe 
  src="https://coder.your-domain.com/@username/project-alpha-123/apps/code-server"
  width="100%" 
  height="100%"
  frameborder="0"
></iframe>
```

*Tip: You may need to configure Coder's environment variable `CODER_BROWSER_ONLY=true` or adjust HTTP headers to allow `iframe` embedding if you encounter "X-Frame-Options" errors.*

### 3. Modifications Required to Your Files

Your current `docker-template.tf` is well-setup for this. It already asks for the Git Repo.

I recommend adding an **Auto-Stop TTL** to your template so workspaces don't run forever if a user closes the tab (saving you money/resources).

**Suggested edit for `docker-template.tf`:**

```hcl
data "coder_workspace" "me" {}

# Add this resource to auto-stop after 1 hour of inactivity
resource "coder_metadata" "workspace_info" {
  count       = data.coder_workspace.me.start_count
  resource_id = docker_container.workspace[0].id
  item {
    key   = "last_used"
    value = "Active"
  }
}

# (Existing coder_parameter block is perfect)
data "coder_parameter" "git_repo" {
  name         = "git_repo"
  display_name = "Git Repository URL"
  default      = "https://github.com/coder/coder" 
}
```

### Summary of Workflow

1.  **User** clicks "Create Project" in your App (Idea Phase).
2.  **Your App** creates a Git Repo for this project.
3.  **User** clicks "Code Tab".
4.  **Your Backend** calls Coder API: "Create workspace for User X with Git Repo Y".
5.  **Coder** clones the repo and starts VS Code.
6.  **Your App** displays the VS Code interface in an iframe.
7.  **User** codes, commits, and pushes (all inside the iframe).
8.  **User** clicks "Demo" in your App -> Your app deploys the code from the Git Repo.

This allows you to keep Coder completely hidden as a "power engine" while your app controls the entire lifecycle.

---

**User**

Create a plan document for this, we will dive deep on this, I love it

---

**Cursor**

I've created the plan document for you! It's saved as `integration-plan.md` in your project folder.

This document dives deep into the architecture we discussed, including:

1.  **Architecture Diagram**: A visual flow of how your App, the Identity Provider, and Coder interact.
2.  **Authentication (OIDC)**: How to make the login "invisible" to the user.
3.  **Backend Orchestration**: The API calls your app needs to make to create/start workspaces silently.
4.  **Template Strategy**: How to handle both **Python** and **C++** environments (Custom Docker images vs. Startup scripts).
5.  **Frontend**: How to embed the IDE safely using iframes.

You can read it by opening `@integration-plan.md`. Let me know if you want to start implementing any specific phase!

---

**User**

Our project codebase here: /Users/nhan/Desktop/dav3/autowrx we have usermanagement in backend at backend dir, let make a more detail plan how can we achieve this authentication

We only try to create and validate idea first, and output is the @integration-plan.md , we will implement later base on this plan file.

I have no idea what is OIDC, can you explain me more before I make decision, right now I think we have user module with JWT token

---

**Cursor**

An explanation of OIDC and how it compares to your current setup:

### What is OIDC (OpenID Connect)?



Think of **OIDC** like a **digital passport**.
*   **Without OIDC (Your current setup):** Your app allows users to log in, and you issue them a "ticket" (JWT). This ticket only works inside your app. Coder doesn't know about your tickets and won't accept them.
*   **With OIDC:** You use a central "Passport Office" (like Auth0, Keycloak, or Google). When a user logs in, the Passport Office gives them a passport. Both **Your App** and **Coder** trust this Passport Office.

### Why does this matter for you?
Since Coder is a separate piece of software running on your server, it has its own user database. It doesn't know your users exist.

To let your users access Coder without logging in again, you have two main options:

#### Option A: The "Passport" Method (OIDC)
You set up a dedicated Identity Server (like Keycloak).
*   **Pros:** Industry standard, very secure.
*   **Cons:** High complexity. You'd likely have to rewrite your current login system to delegate to Keycloak.

#### Option B: The "Vouching" Method (Impersonation) - **Recommended for you**
Since you already have a working user module with JWTs, we can make your Backend "vouch" for the user.
1.  User logs into **Your App** (as they do now).
2.  User clicks "Code".
3.  **Your Backend** (which is an Admin in Coder) calls Coder's API: *"I have verified this is User 'Alice'. Give me a session token for her."*
4.  Coder gives your backend a token.
5.  Your App opens the Coder iframe using that token.

This allows you to **keep your current login system** without changing anything.



---

**User**

How heavy it is to implement OIDC, sounds good since we can do integration with 3rd app. And does it change the way user perform login now, or the way user SSO to my app with difference SSO. And compare Keycloak with others, we want to have situation that our app run 100% inside an offline LAN network to protect data.

---

**Cursor**

### OIDC Implementation & Offline Capability Analysis

Since you require **10

0% offline LAN operation**, your choices are limited to **Self-Hosted Identity Providers**. Cloud options like Auth0, Google, or Azure AD are immediately disqualified because they require internet access.

Here is the breakdown of migrating to an OIDC architecture using a self-hosted provider (like Keycloak).

#### 1. How "Heavy" is the Implementation?
**Complexity: High Initial Setup / Low Long-term Maintenance**

*   **Current State:** Your app handles everything: database lookup, password hashing, token generation.
*   **OIDC State:** You delegate this to the IdP.
    *   **Backend Change:** You must replace your `login` endpoint logic. Instead of checking passwords, your backend will redirect the user to the IdP and verify the returned token.
    *   **Frontend Change:** The login form moves **out** of your app. When users click "Login," they are redirected to the IdP's login page, then redirected back to your app.
    *   **Infrastructure:** You must deploy and manage a new server (Keycloak). This is a Java-based application that requires its own database (PostgreSQL is recommended).

#### 2. How it Changes User Experience & SSO
*   **Login Flow:** Users will no longer see a login form *inside* your webapp's homepage. They will be redirected to a central "Login Portal" (which you can brand with your logo).
*   **Multiple Apps:** If you add a second app later (e.g., a Wiki or Dashboard), users log in once and are instantly logged into all of them.
*   **Existing SSO:** OIDC acts as a "Broker." If you have clients who want to use *their* Corporate SSO (like Microsoft AD), you configure that inside Keycloak, not your app. Your app just trusts Keycloak, and Keycloak handles the complex translation.

#### 3. Keycloak vs. Alternatives (for Offline LAN)

For a strictly offline, self-hosted environment, here are the top contenders:

| Feature | **Keycloak** (The Standard) | **Authentik** (The Modern Challenger) | **Zitadel** (The Lightweight) |
| :--- | :--- | :--- | :--- |
| **Offline/LAN** | ✅ Excellent. Designed for enterprise on-prem. | ✅ Excellent. Docker-native. | ✅ Good. Single binary option. |
| **Complexity** | 🔴 **High.** Enterprise-grade java app. Heavy on resources. | 🟡 **Medium.** Python/Go based. Easier config than Keycloak. | 🟢 **Low.** Very easy to deploy. |
| **Performance** | Slower startup, requires ~1GB+ RAM min. | Faster, lighter weight. | Very fast, serverless-ready. |
| **Features** | Massive. Can do anything (LDAP, Kerberos, SAML). | Focuses on usability and container workflows. | Focuses on multi-tenancy. |
| **Popularity** | Industry Standard. Huge community. | Rising star in DevOps community. | Newer, gaining traction. |

### Recommendation for Your Use Case

**Scenario: "Webapp + Coder + Offline LAN"**

1.  **If you want the "Industry Standard"**: Go with **Keycloak**. Coder has explicit documentation and support for Keycloak. It is the safest bet for "enterprise" offline setups, even if it is a bit heavy to run.
2.  **If you want Simplicity**: Stick with **Option B (Impersonation)**.
    *   You keep your current lightweight JWT system.
    *   You write ~50 lines of code to "bridge" your user to Coder.
    *   **Why?** Running a full Keycloak instance just for 1 app + Coder might be overkill (over-engineering). Keycloak is like buying a bus when you just need to transport 2 people.

### Decision Point

If we choose **Keycloak (OIDC)**, I will add a "Phase 0" to the plan for deploying Keycloak in your docker stack.
If we choose **Impersonation**, I will detail the API bridge in "Phase 3".



---

**User**

then update this file base on our plan @integration-plan.md 

---

**Cursor**

I have updated `@integration-plan.md` to reflect our decision to use the **Impersonation/Vouching** method instead of OIDC.

**Summary of changes:**
1.  **Phase 1 (Authentication):** Now describes using a `CODER_ADMIN_TOKEN` to generate session tokens for users on the fly. This keeps your existing JWT login system intact.
2.  **Phase 3 (Backend Orchestration):** Updated the pseudocode to show how to generate a token for a user before creating/accessing their workspace.
3.  **Checklist:** Removed OIDC requirements and added steps for Admin Token generation and User Sync logic.

You can review the updated plan here: `@integration-plan.md`

---

**User**

I still see OIDC some where in the mermaid

---

**Cursor**

I've updated the Mermaid diagram in `@integration-plan.md` to remove the OIDC reference. It now correctly visualizes the **Impersonation/Token Exchange** flow:

1.  **Login:** User logs into your App (JWT).
2.  **Request:** Your Backend asks Coder for a session token (Impersonation).
3.  **Response:** Coder returns the token.
4.  **Access:** Frontend uses the token to load the iframe.

---

**User**

Oki next, let's discuss about git, where can we have git repo for each project/app in the workspace. Should it is in external git like github/gitlab or our internal git system? If external, how can we manage permission and access token for each user so that we have permission to clone and push back, for private repo case.

Hey, are you still working?

---

**Cursor**

Yes, I am here. I apologize for the delay. I was trying to ask you a question about your Git strategy, but the tool failed.

Since you have an **Offline LAN** requirement, the decision for Git hosting is critical:

1.  **Git Strategy:**
    *   **Option A: Internal Git (Recommended):** Host a local Git server (like Gitea or GitLab CE) inside your LAN. This is secure and doesn't require internet.
    *   **Option B: External Git:** Bridge to GitHub.com. This is very hard in a strict offline LAN (requires a proxy).

2.  **Permission Model:**
    *   **Option A: Simple (1 Project = 1 Git User):** We create a generic "bot" user for each project.
    *   **Option B: Complex (1 Dev = 1 Git User):** We map every developer to their own real Git account.

**My recommendation for your plan:**
I suggest we use **Gitea (Internal)** and the **Simple Permission Model** to start. This keeps everything self-contained in your Docker stack.

Shall I update the plan to include **Gitea** as the Git provider?

---

**User**

Agree with Gitea for offline on-premise and default. But we also allow user to add their github token to perform pull/push their external git.

---

**Cursor**

I have updated the `@integration-plan.md` to include our **Hybrid Git Strategy**:

1.  **Architecture Diagram:** Added **Gitea** (Internal) and **GitHub** (External) nodes to visualize the flow.
2.  **Phase 5 (Git Integration):**
    *   **Gitea (Default):** Runs locally in the Docker stack. Your backend creates repos here automatically.
    *   **GitHub (Optional):** Users can provide a PAT (Personal Access Token). This token is injected into the workspace so they can push/pull from GitHub without re-authenticating.

You can review the updated plan here: `@integration-plan.md`

---

**User**

then, for git, how can we handle repo/app sharing for our mulitple user collaborate in the same project 

hey hey, are you still there process my request

---

**Cursor**

Yes, I am here! I was trying to ask a clarification question about "Real-time" vs "Async" collaboration, but the tool failed.

Based on your question about **"repo/app sharing for multiple users"**, here is the strategy:

### 1. The "Repo Sharing" Strategy (Git-based)
Since Coder workspaces are single-user by design, "Sharing" happens at the **Git level**, not the Workspace level.

*   **Workflow:**
    1.  **Project Creation:** When you create a Project in your App, your Backend calls Gitea API to create an **Organization** (e.g., `org-project-alpha`) and a **Repo**.
    2.  **Team Management:** When you add a user to the Project in your App, your Backend calls Gitea API to add that user to the **Gitea Team**.
    3.  **Workspace Isolation:** User A and User B each get their *own* Coder workspace. Both clone the *same* Gitea repo.
    4.  **Collaboration:** They push/pull code to the shared Gitea repo to collaborate.

### 2. The "App Sharing" Strategy (Preview)
If User A runs a web server (e.g., port 3000) and wants User B to see it:
*   Coder automatically generates a URL like: `https://3000--user-a--workspace.coder.com`.
*   User A can share this URL with User B.
*   **Permissions:** By default, only User A can access it. You can configure Coder to allow "Shared Port Access" (requires `coder_app` sharing settings).

### Action Plan
I will update `@integration-plan.md` to include:
1.  **Phase 6: Collaboration Architecture**: Detailing the Gitea Organization/Team mapping.
2.  **Phase 7: Backend Logic**: Adding the Gitea API calls (Create Org, Add Member) to your Orchestrator service.

Shall I proceed with updating the plan?

---

**User**

check the backend at /Users/nhan/Desktop/dav3/autowrx, this is our code base, then. a model is equal to a Organization in Gitea, and in model we add user in to have contributor or reader only right, then it fall to Gitea team, make sense. And each prototype in Model, it is an repo.

---

**Cursor**

I have updated `@integration-plan.md` to include:

1.  **Phase 6 (Collaboration & Permissions):**
    *   **Mapping:** Defined how your "Models" map to Gitea "Organizations" and "Teams".
    *   **Logic:** Explained the API calls your backend needs to make to Gitea when users create Models/Prototypes.
    *   **Sync:** Added a "Lazy Sync" strategy to ensure permissions are always up-to-date.

2.  **Next Steps:** Added tasks for creating `gitea.service.js` and `orchestrator.service.js`.

The plan is now complete and covers:
*   Authentication (Impersonation)
*   Workspace Templates (Python/C++)
*   Git Strategy (Internal Gitea + External GitHub)
*   Collaboration (Gitea Teams)

You can review the full plan in `@integration-plan.md`. Are you ready to proceed with implementation?

---

**User**

oki, now plan is here and code base is in ../autowrx, move out plans dir there and we will be ready to implement 

---

**Cursor**

I have successfully moved the `plans` directory into `/Users/nhan/Desktop/dav3/autowrx/plans`.

We are now ready to start the implementation in the `autowrx` codebase.
I recommend we switch to the `autowrx` directory for all future commands.

How would you like to proceed? Should we start with **Phase 1: Docker/Gitea Infrastructure** or jump into the **Backend Coder Service**?

