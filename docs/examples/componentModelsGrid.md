# Sample Molecule: `DaModelItem` (composing atoms)

A reference for a real **Molecule** — a composition of atoms with light logic.
Molecules sit between atoms and organisms in the atomic-design layering (see
[../architecture/frontend.md](../architecture/frontend.md)).

**File:** `frontend/src/components/molecules/DaModelItem.tsx`

A molecule imports atoms (here shadcn/Radix `Tooltip*` primitives) and other
small pieces, and renders a self-contained unit:

```typescript
import * as React from 'react'
import { ModelLite } from '@/types/model.type'
import { getModelStatsByIds } from '@/services/model.service'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/atoms/tooltip'
import { Link } from 'react-router-dom'
import { TbAffiliate, TbCode, TbUsers } from 'react-icons/tb'
import { cn } from '@/lib/utils'

type DaModelItemProps = { model: ModelLite; className?: string }

const DaModelItem = React.memo(({ model, className }: DaModelItemProps) => {
  // ...fetches stats, then renders an image + name + contributor count
  return (
    <div className={cn('group bg-background rounded-lg cursor-pointer', className)}>
      {/* ... */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="flex items-center font-semibold">
              <TbUsers className="text-primary size-4 mr-1" />
              {totalCount}
            </div>
          </TooltipTrigger>
          <TooltipContent>Contributors</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
})
export default DaModelItem
```

`DaModelItem` is used by the models list page
([pageModels.md](./pageModels.md)) and by `HomePrototypeRecent`/`Popular`.
