# Dynamic / config-driven UI

> ℹ️ This describes the **current** implementation. AutoWRX does **not** use a
> central component registry; pages compose real components directly, and the
> home page is config-driven through a small `switch`.

## Home page: config-driven rendering

`frontend/src/pages/PageHome.tsx` reads a site config (`CFG_HOME_CONTENT`) — an
ordered list of element descriptors — and maps each element's `type` to a real
component with a `switch`:

```typescript
const getComponent = (elementType: string) => {
  switch (elementType) {
    case 'hero':         return HomeHeroSection
    case 'feature-list': return HomeFeatureList
    case 'button-list':  return HomeButtonList
    case 'news':         return HomeNews
    case 'recent':       return HomePrototypeRecent
    case 'popular':      return HomePrototypePopular
    case 'partner-list': return HomePartners
    case 'home-footer':  return HomeFooterSection
    default:             return null
  }
}

const PageHome = () => {
  const [homeElements, setHomeElements] = useState<any[]>([])
  useEffect(() => {
    configManagementService
      .getPublicConfig('CFG_HOME_CONTENT', 'site')
      .then((res) => { if (res.value && Array.isArray(res.value)) setHomeElements(res.value) })
  }, [])
  return (
    <div className="space-y-12">
      {homeElements.map((element, index) => {
        const Component = getComponent(element.type) as any
        if (!Component) return null
        return <Component key={index} {...element} />
      })}
    </div>
  )
}
```

So the "dynamic" part is **data-driven ordering and selection of real
components** — not a runtime registry. To add a home section you add a component
and a `case` in `getComponent`.

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
[../../guides/plugin/02-architecture.md](../../guides/plugin/02-architecture.md).
