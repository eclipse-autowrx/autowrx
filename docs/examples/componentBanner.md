# Sample Component: an Organism (`HomeHeroSection`)

A reference for a real **Organism**-level component. Organisms are full feature
sections composed from molecules and atoms (see
[Dynamic / config-driven UI](../reference/component-design/dynamic-components.md)
and [../architecture/frontend.md](../architecture/frontend.md)).

**File:** `frontend/src/components/organisms/HomeHeroSection.tsx`

Project components are `Da`-prefixed; lowercase files are shadcn/Radix
primitives. A component is a plain React function with a typed props contract:

```typescript
type HomeHeroSectionProps = {
  title?: string
  description?: string
  image?: string
  minHeight?: string
  maxHeight?: string
  imageObjectFit?: 'cover' | 'contain' | 'fill' | 'none'
  imagePosition?: string
  imageWidth?: string
  imageHeight?: string
  imageAlign?: 'left' | 'center' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  overlay?: OverlayConfig
  textPosition?: 'left' | 'right' | 'center'
  textColor?: string
  children?: React.ReactNode
}

const HomeHeroSection = ({ title, description, image, children, ...rest }: HomeHeroSectionProps) => {
  // ...renders an image + heading/description + children using atoms/molecules
}
export default HomeHeroSection
```

It is consumed by `PageHome.tsx`, which selects it from the home config via the
`hero` case in `getComponent` (see [pageHome.md](./pageHome.md)).

> **Relevant Principles:**
> *   [Clarity & Maintainability](../principles/principle.md#1-clarity-and-maintainability)
