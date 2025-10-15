## App Overview (Structure and Call Graph)

Entry → Providers → Router → Layouts → Pages → Components (Organisms → Molecules → Atoms)

```
index.html #root
  ↳ src/main.tsx
    ↳ React.StrictMode
      ↳ DaAutomationControl (molecule)
      ↳ MsalProvider (SSO)
        ↳ BrowserRouter
          ↳ ErrorBoundary(Fallback=ErrorFallback)
            ↳ QueryProvider (React Query, 401 refresh)
              ↳ ToastContainer
              ↳ App
                ↳ useRoutes(routesConfig)
                  ↳ RootLayout (app shell)
                    ├─ Suspense → ActiveObjectManagement (organism)
                    ├─ Suspense → NavigationBar (organism)
                    │    ├─ DaImage, DaButton, DaMenu, DaTooltip (atoms)
                    │    ├─ DaGlobalSearch, DaNavUser, ChatBox (molecules)
                    │    └─ LearningIntegration (organism)
                    ├─ [optional] DaBreadcrumbBar (molecule)
                    ├─ Outlet → Routed Page
                    └─ Toaster
```

High-level data flow

```
Auth (MSAL) → QueryProvider(serverAxios 401→refresh) → Hooks (useSelfProfile, useCurrentModel)
  → Stores (Zustand: authStore, modelStore, globalStore) → Pages/Organisms render
```

Top-level pages under RootLayout (selected)

```
/: PageHome
/about: PageAbout
/model: PageModelList
/model/:model_id: ModelDetailLayout
  ↳ index: PageModelDetail
  ↳ api, api/:api: PageVehicleApi
  ↳ library[/...]: PagePrototypeLibrary
  ↳ architecture: PageModelArchitecture
/profile: PageUserProfile
/my-assets: PageMyAssets
/inventory[/...]: PageInventory (iframe integration)
/genai-wizard: PageGenAIWizard
/privacy-policy: PagePrivacyPolicy
/auth/:provider/success: PageAuthSuccess
```

Component layering conventions

```
Page* (route-level)
  ↳ organisms/* (page sections and complex compositions)
    ↳ molecules/* (reusable feature blocks)
      ↳ atoms/* (basic UI primitives)
```

Notes

- Tailwind CSS is used throughout for styling classes.
- SuspenseProvider wraps lazy-loaded pages; ErrorBoundary shows `ErrorFallback` on chunk failures.
- `ActiveObjectManagement` tracks URL params and updates `modelStore`/prototype in background.


