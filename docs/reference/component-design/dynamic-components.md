# Dynamic / config-driven UI

> ℹ️ This describes the **current** implementation. AutoWRX does **not** use a
> central component registry; pages compose real components directly, and the
> home page is config-driven through a small type→component map.

## Home page: config-driven rendering

`frontend/src/pages/PageHome.tsx` reads a site config (`CFG_HOME_CONTENT`) — an
ordered list of element descriptors — and maps each element's `type` to a real
component via `getHomeComponent` from `frontend/src/utils/homeComponentMap.ts`
(a `Record<string, ComponentType>`, not a runtime registry):

```typescript
// frontend/src/utils/homeComponentMap.ts
const homeComponentMap: Record<string, React.ComponentType<any>> = {
  'hero':          HomeHeroSection,
  'feature-list':  HomeFeatureList,
  'button-list':   HomeButtonList,
  'news':          HomeNews,
  'recent':        HomePrototypeRecent,
  'popular':       HomePrototypePopular,
  'partner-list':  HomePartners,
  'home-footer':   HomeFooterSection,
}

export const getHomeComponent = (elementType: string) => homeComponentMap[elementType] ?? null
```

`PageHome` loads the config asynchronously (with an `isLoading` state) and renders each element:

```typescript
const PageHome = () => {
  const [homeElements, setHomeElements] = useState<any[]>([])
  // ... loads CFG_HOME_CONTENT via configManagementService.getPublicConfig(...)
  return (
    <div className="space-y-12">
      {homeElements.map((element, index) => {
        const Component = getHomeComponent(element.type)
        return Component ? <Component key={index} {...element} /> : null
      })}
    </div>
  )
}
```

So the "dynamic" part is **data-driven ordering and selection of real
components** — not a runtime registry. To add a home section you add a component
and an entry in `homeComponentMap`.

## Route-level code splitting

Heavy pages are lazy-loaded with `React.lazy()` plus a `retry()` helper (again,
not a registry). From `frontend/src/configs/routes.tsx`:

```typescript
import { lazy } from 'react'
import { retry } from '@/lib/retry'

const PageModelList = lazy(() => retry(() => import('@/pages/PageModelList')))
const PageVehicleApi = lazy(() => retry(() => import('@/pages/PageVehicleApi')))
```

`retry()` (`frontend/src/lib/retry.ts`) re-tries the dynamic import a few times
(to recover from a stale deploy); each lazy page is wrapped in
`<SuspenseProvider>`.

## Plugin-provided UI (the one truly dynamic path)

The only place a component is loaded dynamically from a **remote URL** is the
plugin loader, `organisms/PluginPageRender.tsx`, which injects a plugin bundle
as a `<script>` tag and polls for its registration. See
[../../architecture/plugin-system.md](../../architecture/plugin-system.md) and
[../../guides/plugin/README.md](../../guides/plugin/README.md).
