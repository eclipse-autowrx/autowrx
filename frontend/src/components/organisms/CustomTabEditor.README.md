# CustomTabEditor Component

A reusable dialog component for managing custom tabs with drag-and-drop reordering, label editing, and removal capabilities.

## Features

- **Drag and Drop Reordering**: Reorder tabs by dragging them
- **Inline Label Editing**: Click the pencil icon to edit tab labels
- **Remove Tabs**: Click the trash icon to remove tabs
- **Visual Feedback**: Hover states and drag indicators for better UX
- **Keyboard Support**: Press Enter to save, Escape to cancel when editing

## Installation

The component uses `@hello-pangea/dnd` for drag-and-drop functionality:

```bash
yarn add @hello-pangea/dnd
```

## Usage

### For Prototype Tabs

```tsx
import CustomTabEditor from '@/components/organisms/CustomTabEditor'
import { updateModelService } from '@/services/model.service'

const handleSavePrototypeTabs = async (updatedTabs: Array<{ label: string; plugin: string }>) => {
  if (!model_id || !model) return

  const currentTemplate = model.custom_template || {
    model_tabs: [],
    prototype_tabs: [],
  }

  const updatedTemplate = {
    ...currentTemplate,
    prototype_tabs: updatedTabs,
  }

  await updateModelService(model_id, {
    custom_template: updatedTemplate,
  })

  toast.success('Prototype tabs updated successfully')
  window.location.reload()
}

// In your component
<CustomTabEditor
  open={openDialog}
  onOpenChange={setOpenDialog}
  tabs={model?.custom_template?.prototype_tabs || []}
  onSave={handleSavePrototypeTabs}
  title="Manage Prototype Tabs"
  description="Edit labels, reorder, and remove custom prototype tabs"
/>
```

### For Plugin/Model Tabs

```tsx
const handleSaveModelTabs = async (updatedTabs: Array<{ label: string; plugin: string }>) => {
  if (!model_id || !model) return

  const currentTemplate = model.custom_template || {
    model_tabs: [],
    prototype_tabs: [],
  }

  const updatedTemplate = {
    ...currentTemplate,
    model_tabs: updatedTabs, // Use model_tabs instead
  }

  await updateModelService(model_id, {
    custom_template: updatedTemplate,
  })

  toast.success('Model tabs updated successfully')
  window.location.reload()
}

// In your component
<CustomTabEditor
  open={openDialog}
  onOpenChange={setOpenDialog}
  tabs={model?.custom_template?.model_tabs || []}
  onSave={handleSaveModelTabs}
  title="Manage Model Tabs"
  description="Edit labels, reorder, and remove custom model tabs"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |
| `tabs` | `CustomTab[]` | Yes | - | Array of tab objects with `label` and `plugin` properties |
| `onSave` | `(updatedTabs: CustomTab[]) => Promise<void>` | Yes | - | Async callback to save updated tabs |
| `title` | `string` | No | `"Manage Custom Tabs"` | Dialog title |
| `description` | `string` | No | `"Edit, reorder, and remove custom tabs"` | Dialog description |

## CustomTab Interface

```typescript
interface CustomTab {
  label: string   // Display name for the tab
  plugin: string  // Plugin slug identifier (used as unique key)
}
```

## User Interactions

### Reordering Tabs
1. Click and hold the grip icon (☰) on the left side of a tab
2. Drag the tab to the desired position
3. Release to drop

### Editing Tab Label
1. Click the pencil icon
2. Edit the label in the input field
3. Press Enter or click the checkmark to save
4. Press Escape or click the X to cancel

### Removing a Tab
1. Click the trash icon
2. The tab is immediately removed from the list (changes not saved until you click "Save Changes")

### Saving Changes
1. Click "Save Changes" button to persist all changes
2. Click "Cancel" to discard all changes and close the dialog

## Implementation Details

- Uses `@hello-pangea/dnd` for accessible drag-and-drop
- Maintains local state for optimistic updates
- Resets to original state when dialog is opened or cancelled
- Shows loading state during save operation
- Uses shadcn/ui components for consistent styling
