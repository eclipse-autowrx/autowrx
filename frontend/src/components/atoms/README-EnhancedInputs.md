# Enhanced Input Components for Site Management

This document describes the specialized input components created for the site management system to provide user-friendly interfaces for different value types.

## Components Overview

### 1. ColorPicker (`ColorPicker.tsx`)
**Purpose**: Handle color values with visual color selection
**Features**:
- Color preview button with current color
- Text input for hex color codes
- Custom color picker (HTML5 color input)
- Predefined color palette (20 common colors)
- Dropdown interface with overlay
- Click-outside-to-close functionality

**Usage**:
```tsx
<ColorPicker
  value="#FF0000"
  onChange={(color) => setValue(color)}
/>
```

### 2. ImageUrlInput (`ImageUrlInput.tsx`)
**Purpose**: Handle image URLs with preview and file upload
**Features**:
- URL input field for image URLs
- Image preview with error handling
- File upload button (converts to base64 data URL)
- File type validation (images only)
- Preview with fallback for broken images
- Upload progress indication

**Usage**:
```tsx
<ImageUrlInput
  value="https://example.com/image.jpg"
  onChange={(url) => setValue(url)}
/>
```

### 3. DatePicker (`DatePicker.tsx`)
**Purpose**: Handle date/time values with proper formatting
**Features**:
- HTML5 datetime-local input
- ISO string conversion
- Date formatting for display
- Timezone handling
- ISO format preview

**Usage**:
```tsx
<DatePicker
  value="2023-12-25T10:30:00.000Z"
  onChange={(date) => setValue(date)}
/>
```

### 4. JsonEditor (`JsonEditor.tsx`)
**Purpose**: Handle JSON objects and arrays with validation
**Features**:
- Syntax highlighting (monospace font)
- JSON validation with error messages
- Type-specific validation (object vs array)
- Format button for pretty-printing
- Validate button for manual validation
- Error highlighting with color coding

**Usage**:
```tsx
<JsonEditor
  value={{ key: "value" }}
  onChange={(obj) => setValue(obj)}
  valueType="object"
/>
```

## Value Type Mapping

| Value Type | Component | Input Method |
|------------|-----------|--------------|
| `string` | TextArea | Multi-line text input |
| `number` | Number Input | Numeric input with step support |
| `boolean` | Checkbox | True/false checkbox |
| `object` | JsonEditor | JSON editor with validation |
| `array` | JsonEditor | JSON editor with array validation |
| `date` | DatePicker | Date/time picker |
| `color` | ColorPicker | Visual color picker |
| `image_url` | ImageUrlInput | URL input with preview |

## Enhanced Features

### Smart Type Detection
The backend automatically detects value types based on content:
- Hex colors (`#FF0000`) → `color`
- Image URLs (ending in image extensions) → `image_url`
- Numbers → `number`
- Booleans → `boolean`
- Arrays → `array`
- Objects → `object`
- Dates → `date`
- Default → `string`

### Visual Feedback
- Color swatches for color values
- Image previews for image URLs
- Type badges with color coding
- Error states with helpful messages
- Loading states for async operations

### User Experience
- Intuitive interfaces for each data type
- Validation with clear error messages
- Preview functionality where applicable
- Keyboard shortcuts and accessibility
- Responsive design for all screen sizes

## Integration

All components integrate seamlessly with the SiteConfigForm:
- Consistent styling with Tailwind CSS
- Proper TypeScript typing
- Error handling and validation
- Form state management
- Accessibility compliance

## Future Enhancements

Potential improvements could include:
- Rich text editor for complex strings
- File upload with cloud storage integration
- Advanced JSON editor with syntax highlighting
- Date range picker for date ranges
- Multi-select for arrays of strings
- Markdown editor for documentation fields
