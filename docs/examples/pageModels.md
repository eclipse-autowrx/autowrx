# Sample Page: `PageModelList`

A reference for a real, fixed-layout page. Unlike the config-driven
[HomePage](./pageHome.md), the models page has a fixed structure but still
follows the rule that **pages compose components and read server state via
hooks** — they don't hold business logic. See [../architecture/frontend.md](../architecture/frontend.md).

**File:** `frontend/src/pages/PageModelList.tsx` · **Route:** `/model`

```typescript
const PageModelList = () => {
  const navigate = useNavigate()
  const { data: user } = useSelfProfileQuery()
  const { authBootstrapped, setOpenLoginDialog } = useAuthStore()
  const { authConfigs } = useAuthConfigs()

  const {
    ownedModels, contributedModels, publicReleasedModels,
    totalResults, isLoading, error, refetch, isFetchingNextPage,
  } = useListAllModels()

  // ...filtering / search / create-import dialog wiring...

  return (
    <div className="flex flex-col w-full h-full">
      {/* sticky tab bar with counts */}
      <div className="...">
        {/* My Models / Contributed / Public tabs */}
      </div>
      {/* sections compose the DaModelItem molecule (see componentModelsGrid.md) */}
      {user && <ModelSection title="My Models" models={filterModels(ownedModels)} ... />}
      {/* contributed + public sections ... */}
    </div>
  )
}
```

Composition in action: the page pulls server state from the
`useListAllModels` hook (TanStack Query — see [hookMyModels.md](./hookMyModels.md))
and renders each model through the `DaModelItem` molecule
([componentModelsGrid.md](./componentModelsGrid.md)).
