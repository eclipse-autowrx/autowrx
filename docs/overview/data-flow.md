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
  - access token, logOut, setAccess
modelStore
  - model, prototype, setActiveModel, setActivePrototype
globalStore
  - UI flags (e.g., isChatShowed)
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


