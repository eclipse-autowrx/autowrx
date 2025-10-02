// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FileSystemItem, File, Folder } from '../components/molecules/project_editor/types';

/**
 * Checks if a string is valid JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if parsed JSON data is compatible with ProjectEditor
 * ProjectEditor expects an array of FileSystemItem objects
 */
export function isProjectEditorCompatible(data: any): data is FileSystemItem[] {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    if (typeof item !== 'object' || item === null) return false;
    
    if (item.type === 'file') {
      return typeof item.name === 'string' && typeof item.content === 'string';
    }
    
    if (item.type === 'folder') {
      return typeof item.name === 'string' && Array.isArray(item.items);
    }
    
    return false;
  });
}

/**
 * Converts a single file content to ProjectEditor format
 */
export function convertToProjectEditorFormat(
  content: string, 
  fileName: string = 'main.py', 
  language: string = 'python'
): FileSystemItem[] {
  // Create a simple project structure with the content as a single file
  return [
    {
      type: 'folder',
      name: 'project',
      items: [
        {
          type: 'file',
          name: fileName,
          content: content
        }
      ]
    }
  ];
}

/**
 * Extracts the main content from ProjectEditor format
 * If it's a single file project, returns the file content
 * If it's a multi-file project, returns the first file content or empty string
 */
export function extractMainContent(data: FileSystemItem[]): string {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const root = data[0];
  if (root.type === 'folder' && root.items.length > 0) {
    const firstFile = root.items.find(item => item.type === 'file');
    if (firstFile && firstFile.type === 'file') {
      return firstFile.content;
    }
  }
  
  return '';
}

/**
 * Determines the best editor to use based on the content
 */
export function getEditorType(content: string): 'project' | 'code' {
  if (!content || content.trim() === '') return 'code';
  
  // Try to parse as JSON first
  if (isValidJSON(content)) {
    return 'project';
  }
  return 'code';
}

/**
 * Converts sample project data to the format expected by ProjectEditor
 * Handles both string and FileSystemItem[] formats
 */
export function normalizeProjectData(data: string | FileSystemItem[]): FileSystemItem[] {
  if (typeof data === 'string') {
    // If it's a string, convert to single file project format
    return convertToProjectEditorFormat(data);
  }
  
  // If it's already FileSystemItem[], return as is
  if (Array.isArray(data)) {
    return data;
  }
  
  // Fallback to empty project
  return [];
}
