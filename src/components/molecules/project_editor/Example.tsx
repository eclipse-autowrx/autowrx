// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';
import { ProjectEditor } from './index';

// Example 1: Simple project editor
export const SimpleProjectEditor: React.FC = () => {
  const [data, setData] = useState<string>(JSON.stringify([
    {
      type: 'folder',
      name: 'simple-project',
      items: [
        {
          type: 'file',
          name: 'index.html',
          content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Simple Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>'
        }
      ]
    }
  ]));

  return (
    <div className="h-96 border rounded-lg">
      <ProjectEditor data={data} onChange={setData} />
    </div>
  );
};

// Example 2: Project editor with initial data
export const ProjectEditorWithData: React.FC<{ initialData: string }> = ({ initialData }) => {
  const [data, setData] = useState<string>(initialData);

  return (
    <div className="h-screen">
      <div className="bg-gray-100 p-4 border-b">
        <h2 className="text-lg font-semibold">Project Editor</h2>
        <p className="text-sm text-gray-600">Edit your project files below</p>
      </div>
      <ProjectEditor data={data} onChange={setData} />
    </div>
  );
};

// Example 3: Project editor with save callback
export const ProjectEditorWithSave: React.FC = () => {
  const [data, setData] = useState<string>(JSON.stringify([
    {
      type: 'folder',
      name: 'configurable-project',
      items: [
        {
          type: 'file',
          name: 'config.json',
          content: '{\n  "name": "My Project",\n  "version": "1.0.0"\n}'
        }
      ]
    }
  ]));

  const handleSave = (newData: string) => {
    setData(newData);
    // Here you could save to a database, API, or local storage
    console.log('Project saved:', newData);
    
    // Example: Save to localStorage
    try {
      localStorage.setItem('project-data', newData);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  return (
    <div className="h-96 border rounded-lg">
      <ProjectEditor data={data} onChange={handleSave} />
    </div>
  );
};

// Example 4: Project editor with validation
export const ProjectEditorWithValidation: React.FC = () => {
  const [data, setData] = useState<string>(JSON.stringify([
    {
      type: 'folder',
      name: 'validated-project',
      items: []
    }
  ]));

  const handleChange = (newData: string) => {
    try {
      const parsed = JSON.parse(newData);
      
      // Validate the structure
      if (!Array.isArray(parsed) || parsed.length === 0) {
        console.warn('Invalid project structure: must be a non-empty array');
        return;
      }

      const root = parsed[0];
      if (root.type !== 'folder') {
        console.warn('Invalid project structure: first item must be a folder');
        return;
      }

      setData(newData);
    } catch (error) {
      console.error('Invalid JSON data:', error);
    }
  };

  return (
    <div className="h-96 border rounded-lg">
      <ProjectEditor data={data} onChange={handleChange} />
    </div>
  );
};
