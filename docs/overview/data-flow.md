## Data Flow and State

Top-level providers and side effects

```
MsalProvider → auth (SSO)
QueryProvider (React Query)
  - queryCache.onError(401) → refreshAuthToken()
  - serverAxios.post('/auth/refresh-tokens') → setAccess(authStore)
ErrorBoundary → ErrorFallback (chunk reload logic)
ToastContainer → global toasts
```

Global stores (Zustand)

```
authStore
  - access?: Token|null
  - user: any
  - openLoginDialog: boolean
  - setAccess(Token), setUser(user, access), logOut(), setOpenLoginDialog(boolean)

modelStore
  - model?: Model|null
  - prototype?: Prototype|null
  - activeModelApis: VehicleApi[] (parsed & shortName enriched)
  - activeModelUspSevices: any[]
  - activeModelV2CApis: any[]
  - supportApis: {label, code}[] (COVESA ensured)
  - prototypeHasUnsavedChanges: boolean
  - setActiveModel(model) → fetch getComputedAPIs(model.id) → parseCvi() → enrich → set
  - setActivePrototype(prototype)
  - refreshModel()
  - setPrototypeHasUnsavedChanges(boolean)

runtimeStore
  - apisValue: { [name]: any }
  - traceVars: { [name]: any }
  - appLog: string
  - setActiveApis(values), setTraceVars(values), setAppLog(string)

globalStore
  - UI flags (e.g., isChatShowed)

socketStore
  - socket: Map<string, Socket>
  - getSocketIO(url, accessToken?) → Socket

refStore
  - value: Record<string, any>
  - setValue(key, value)

githubAuthStore (persisted)
  - access?: Token|null
  - setAccess(Token), clear()

useDiscussionIdentifier
  - identifier?: { refId: string; refType: DISCUSSION_REF_TYPE }
  - setIdentifier(refId, refType)
```

Route-driven model/prototype activation

```
ActiveObjectManagement
  useParams(model_id, prototype_id)
  useGetModel(model_id) → setActiveModel(modelStore)
  useGetPrototype(prototype_id) → setActivePrototype(modelStore)
```

Model-level layout state

```
ModelDetailLayout
  - useListModelPrototypes(model.id)
  - useLastAccessedModel() persists last model id to localStorage
  - tab counts derived from fetched data
```

Inventory integration (host ↔ iframe)

```
PageInventory
  - posts MSAL access token to iframe (window.postMessage)
  - syncs route between host router and iframe router
  - src = config.inventory.frontend.url + current route
```

User telemetry

```
App
  useSelfProfileQuery → user
  On hourly threshold: addLog('User <name> visited')
```

Deep data flow (ASCII graph)

```
MsalProvider
  └─ auth tokens (MSAL cache)
     └─ QueryProvider (React Query)
        ├─ queryCache.onError(401) → refreshAuthToken()
        │   └─ serverAxios.post('/auth/refresh-tokens') → authStore.setAccess()
        └─ children → App
           └─ useRoutes(routes)
              └─ RootLayout
                 ├─ ActiveObjectManagement
                 │   ├─ useParams(model_id, prototype_id)
                 │   ├─ useGetModel(model_id) → modelStore.setActiveModel(model)
                 │   └─ useGetPrototype(prototype_id) → modelStore.setActivePrototype(prototype)
                 ├─ NavigationBar (uses useSelfProfileQuery, permissions)
                 ├─ DaBreadcrumbBar (uses model/prototype/inventory data)
                 └─ Outlet (pages)

modelStore.setActiveModel(model)
  ├─ getComputedAPIs(model.id) (fallback → model.main_api or Vehicle)
  ├─ parseCvi() → flat list with .shortName
  ├─ merge wishlist custom_apis if no api_version
  ├─ sort by hierarchical name
  └─ compute supportApis (USP/V2C + ensure COVESA)

Prototype Detail (selected)
  ├─ code tab → edits setActivePrototype(newPrototype) + updatePrototypeService(code)
  │   └─ runtime: DaRuntimeControl observes runtimeStore (apisValue, traceVars, appLog)
  ├─ dashboard tab → DaDashboard (widget_config JSON)
  │   ├─ edit: DaDashboardEditor → write JSON
  │   └─ run: DaDashboardGrid → WidgetItem iframes ← postMessage('vss-sync', apisValue)
  └─ flow tab → PrototypeTabFlow
      ├─ view matrix (FlowInterface/FlowItem)
      └─ edit (DaFlowEditor) → updatePrototypeService(flow)

Inventory (iframe)
  Host PageInventory
    ├─ on load: postMessage { type: 'userToken', token }
    ├─ on route change: postMessage { type: 'syncRoute', route }
    └─ on message 'syncRoute' from iframe → navigate(host)
```

Request/response lifecycles

```
React Query hooks → serverAxios → (401) → QueryProvider.refreshAuthToken
  → setAccess → retry/invalidates → components re-render with fresh data

Model APIs → getComputedAPIs(model.id)
  → modelStore.activeModelApis (with .shortName) → used by API views, code helpers

Runtime values → runtimeStore.apisValue/traceVars/appLog
  → DaDashboardGrid WidgetItem iframes (vss-sync/app-log)
  → PrototypeVarsWatch (if enabled) and DaRuntimeControl side panel
```


