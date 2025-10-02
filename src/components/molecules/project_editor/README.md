<!--
Copyright (c) 2025 Eclipse Foundation.

This program and the accompanying materials are made available under the
terms of the MIT License which is available at
https://opensource.org/licenses/MIT.

SPDX-License-Identifier: MIT
-->

# ProjectEditor Component

A full-featured code editor component with file tree navigation, syntax highlighting, and project management capabilities.

## Features

- **File Tree Navigation**: Hierarchical file and folder structure with expand/collapse functionality
- **Multi-tab Editor**: Edit multiple files simultaneously with tabbed interface
- **Syntax Highlighting**: Monaco Editor integration with support for multiple programming languages
- **File Operations**: Create, rename, delete files and folders
- **Context Menus**: Right-click context menus for file operations
- **Drag & Drop Resizing**: Resizable left panel for file tree
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + S`: Save current file
  - `Ctrl/Cmd + Shift + S`: Save all files
- **Import/Export**: ZIP file import/export functionality
- **Unsaved Changes Tracking**: Visual indicators for unsaved files

## Components

### ProjectEditor
The main component that orchestrates the entire editor experience.

### FileTree
Displays the file hierarchy with interactive elements for file operations.

### EditorComponent
Provides the Monaco Editor interface with tabs and save functionality.

### Introduction
Welcome screen shown when no file is selected.

## Usage

```tsx
import { ProjectEditor } from '@/components/molecules/project_editor';

const MyComponent = () => {
  const [projectData, setProjectData] = useState<string>(JSON.stringify([
    {
      type: 'folder',
      name: 'my-project',
      items: [
        {
          type: 'file',
          name: 'README.md',
          content: '# My Project\n\nThis is a sample project.'
        }
      ]
    }
  ]));

  const handleProjectChange = (newData: string) => {
    setProjectData(newData);
    // Handle the updated project data
  };

  return (
    <ProjectEditor 
      data={projectData} 
      onChange={handleProjectChange} 
    />
  );
};
```

## Data Structure

The component expects a JSON string representing the file system structure:

```typescript
interface File {
  type: 'file';
  name: string;
  content: string;
}

interface Folder {
  type: 'folder';
  name: string;
  items: FileSystemItem[];
}

type FileSystemItem = File | Folder;
```

## Dependencies

The component uses the following dependencies (already available in the project):
- `@monaco-editor/react` - Code editor
- `jszip` - ZIP file handling
- `react-icons/vsc` - VS Code style icons
- `react` - React framework

## Styling

The component uses Tailwind CSS classes for styling and is fully responsive.

## Browser Support

- Modern browsers with ES6+ support
- Requires DOM APIs for file operations and context menus

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast mode support through CSS variables
