# Sample Page: `PageHome` (config-driven)

A reference for a real page. Pages hold **layout**, not business logic — they
compose organisms/molecules and read server state via hooks. The home page is
**config-driven**: it renders whatever ordered set of sections an admin has
configured. See [Dynamic / config-driven UI](../reference/component-design/dynamic-components.md).

**File:** `frontend/src/pages/PageHome.tsx`

```typescript
const getComponent = (elementType: string) => {
  switch (elementType) {
    case 'hero':         return HomeHeroSection
    case 'feature-list': return HomeFeatureList
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

The page does not know ahead of time which sections exist — it maps the
configured `type` to a real component and spreads the element's props into it.
Unknown types are skipped.

> **Relevant Principles:**
> *   [Clarity & Maintainability](../principles/principle.md#1-clarity-and-maintainability)
