## Layout Hierarchies

Root shell and model detail layout composition.

### RootLayout

```
RootLayout
  ├─ Suspense → ActiveObjectManagement
  │   ↳ useParams → setActiveModel/setActivePrototype (zustand modelStore)
  ├─ Suspense → NavigationBar
  │   ├─ DaImage, DaButton, DaMenu, DaTooltip (atoms)
  │   ├─ DaGlobalSearch, DaNavUser, ChatBox (molecules)
  │   └─ LearningIntegration (organism)
  ├─ [Conditional] DaBreadcrumbBar (molecule)
  ├─ Outlet (page content)
  └─ Toaster
```

Breadcrumb control

```
getPathsWithoutBreadcrumb(routesConfig) → Set<string>
  If current path not in set → show DaBreadcrumbBar
```

### ModelDetailLayout

```
ModelDetailLayout
  ├─ useModelStore(model)
  ├─ useListModelPrototypes(model.id)
  ├─ useLastAccessedModel() → persist last view
  ├─ Tabs (DaTabItem x4): Overview | Architecture | Vehicle API | Prototype Library
  └─ Outlet → renders nested model pages
```

ErrorBoundary (Fallback)

```
ErrorFallback
  ├─ Detect chunk load failure → soft reload once
  └─ Shows error message in dev mode
```


