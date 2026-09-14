# Sample Page: `PageHome` (config-driven)

A reference for a real page. Pages hold **layout**, not business logic — they
compose organisms/molecules and read server state via hooks. The home page is
**config-driven**: it renders whatever ordered set of sections an admin has
configured. See [Dynamic / config-driven UI](../reference/component-design/dynamic-components.md).

**File:** `frontend/src/pages/PageHome.tsx`

```typescript
import { getHomeComponent } from '@/utils/homeComponentMap'

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
        const Component = getHomeComponent(element.type)   // type → real component map
        if (!Component) return null
        return <Component key={index} {...element} />
      })}
    </div>
  )
}
```

`getHomeComponent` (in `frontend/src/utils/homeComponentMap.ts`) is a `Record<string, ComponentType>` lookup — `hero`, `feature-list`, `button-list`, `news`, `recent`, `popular`, `partner-list`, `home-footer`. To add a section you add a component and one entry in that map; `PageHome` itself never changes.

The page does not know ahead of time which sections exist — it maps the
configured `type` to a real component and spreads the element's props into it.
Unknown types are skipped.

> **Relevant Principles:**
> *   [Clarity & Maintainability](../principles/principle.md#1-clarity-and-maintainability)
