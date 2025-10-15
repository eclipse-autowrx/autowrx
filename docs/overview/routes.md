## Routing Tree (src/configs/routes.tsx)

```
/ (RootLayout)
  ├─ / (index)
  │   └─ PageHome
  ├─ /manage-users
  │   └─ PageManageUsers
  ├─ /manage-features
  │   └─ PageManageFeatures
  ├─ /about
  │   └─ PageAbout
  ├─ /reset-password
  │   └─ PageResetPassword
  ├─ /model
  │   ├─ (index) → PageModelList
  │   └─ /:model_id (ModelDetailLayout)
  │       ├─ (index) → PageModelDetail
  │       ├─ /api → PageVehicleApi
  │       ├─ /api/:api → PageVehicleApi
  │       ├─ /library → PagePrototypeLibrary
  │       ├─ /library/:tab → PagePrototypeLibrary
  │       ├─ /library/:tab/:prototype_id → PagePrototypeLibrary
  │       └─ /architecture → PageModelArchitecture
  │
  │   ├─ /:model_id/library/prototype/:prototype_id → PagePrototypeDetail
  │   └─ /:model_id/library/prototype/:prototype_id/:tab → PagePrototypeDetail
  │
  ├─ /profile → PageUserProfile
  ├─ /my-assets → PageMyAssets
  ├─ /inventory
  │   ├─ (index) → PageInventory (iframe)
  │   ├─ /role/:inventory_role → PageInventory
  │   │   ├─ (index)
  │   │   ├─ /item/:inventory_id → PageInventory
  │   │   └─ /item/:inventory_id/:tab → PageInventory
  │   ├─ /schema/* → PageInventory
  │   └─ /instance/* → PageInventory
  │
  ├─ /genai-wizard → PageGenAIWizard
  ├─ /privacy-policy → PagePrivacyPolicy
  ├─ /auth/:provider/success → PageAuthSuccess
  ├─ /test-m89 → PageTestM89
  └─ /test-ui → PageTestM89

  [development-only]
  ├─ /test-ui/forms → PageTestForm
  ├─ /test-ui/home → PageTestHome
  ├─ /test-ui/components → PageComponent
  ├─ /test-ui/molecules → PageMolecules
  ├─ /test-ui/organisms → PageOrganisms
  ├─ /test-ui/discussion → PageDiscussions
  └─ /test-ui/project-editor → PageProjectEditor
```

Special layout: `ModelDetailLayout`

```
/model/:model_id (ModelDetailLayout)
  ├─ Tabs (Overview, Architecture, Vehicle API, Prototype Library)
  └─ Outlet renders nested page per tab
```

Route wrappers

- Each page element is wrapped by `SuspenseProvider` (React.Suspense) in the route config for lazy-loaded modules.
- Root tree is wrapped by `RootLayout` which provides navigation, optional breadcrumbs, and content outlet.


