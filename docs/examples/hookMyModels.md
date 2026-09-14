# Sample Hook: `useCurrentModel` (TanStack Query)

A reference for a real data hook. Hooks under `frontend/src/hooks/` wrap
`@tanstack/react-query` (`useQuery`/`useMutation`) around a service function —
**not** `useState`/`useEffect`. See [../architecture/frontend.md](../architecture/frontend.md).

**File:** `frontend/src/hooks/useCurrentModel.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { Model } from '@/types/model.type'
import { getModel } from '@/services/model.service'

const useCurrentModel = () => {
  const { model_id: pathModelId } = useParams<{ model_id: string }>()
  const [searchParams] = useSearchParams()
  const model_id = pathModelId || searchParams.get('model_id') || undefined

  return useQuery<Model>({
    queryKey: ['model', model_id],
    queryFn: () => getModel(model_id!),
    enabled: !!model_id,
  })
}

export default useCurrentModel
```

The pattern: a stable **query key** (here `['model', model_id]`), a `queryFn`
that calls a `services/*.service` function, and `enabled` to gate the request
until the id is known. The hook returns `{ data, isLoading, error, ... }`.

For an authenticated-profile example with the same shape, see
`useSelfProfile.ts` (`enabled: authBootstrapped && !!accessToken`). The models
list uses `useListAllModels` (`useInfiniteQuery` for paginated fetching).

This hook is used by the [**Sample Models Page**](./pageModels.md).
