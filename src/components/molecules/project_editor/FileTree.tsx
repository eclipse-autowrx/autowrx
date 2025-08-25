// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileSystemItem, File, Folder } from './types';
import { 
  VscFile, 
  VscFolder, 
  VscEdit, 
  VscTrash,
  VscChevronRight,
  VscChevronDown,
  VscKebabVertical,
  VscJson,
  VscCode,
  VscFileCode,
  VscSymbolClass,
  VscFileMedia,
  VscSettings,
  VscNewFile,
  VscNewFolder,
  VscCopy,
  VscClippy
} from 'react-icons/vsc';

interface FileTreeProps {
  items: FileSystemItem[];
  onFileSelect: (file: File) => void;
  onDeleteItem: (item: FileSystemItem) => void;
  onRenameItem: (item: FileSystemItem, newName: string) => void;
  onAddItem: (parent: Folder, item: FileSystemItem) => void;
  allCollapsed: boolean;
  activeFile: File | null;
}

const FileTree: React.FC<FileTreeProps> = ({ items, onFileSelect, onDeleteItem, onRenameItem, onAddItem, allCollapsed, activeFile }) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right?: number; left?: number } | null>(null);
  const [renamingItem, setRenamingItem] = useState<FileSystemItem | null>(null);
  const [newName, setNewName] = useState('');
  const [creatingItem, setCreatingItem] = useState<{ parentPath: string; type: 'file' | 'folder' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [clipboard, setClipboard] = useState<{ item: FileSystemItem, operation: 'copy' | 'cut' } | null>(null);
  const [showRootMenu, setShowRootMenu] = useState(false);
  const [rootMenuPosition, setRootMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rootMenuRef = useRef<HTMLDivElement>(null);

  const sortItems = (items: FileSystemItem[]): FileSystemItem[] => {
    return [...items].sort((a, b) => {
      // First, sort by type (folders first)
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Then sort alphabetically by name (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  useEffect(() => {
    if (allCollapsed) {
      setExpandedFolders([]);
    }
  }, [allCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (rootMenuRef.current && !rootMenuRef.current.contains(event.target as Node)) {
        setShowRootMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      // JavaScript/TypeScript
      case 'js':
      case 'jsx':
      case 'mjs':
        return <VscCode className="mr-2 text-yellow-600 flex-shrink-0" size={16} />;
      case 'ts':
      case 'tsx':
        return <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      
      // Web Technologies
      case 'json':
        return <VscJson className="mr-2 text-green-600 flex-shrink-0" size={16} />;
      case 'html':
      case 'htm':
      case 'xhtml':
        return <VscFileCode className="mr-2 text-orange-600 flex-shrink-0" size={16} />;
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return <VscSymbolClass className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'xml':
      case 'svg':
        return <VscFileCode className="mr-2 text-orange-400 flex-shrink-0" size={16} />;
      
      // Markup & Documentation
      case 'md':
      case 'markdown':
        return <VscFileMedia className="mr-2 text-gray-700 flex-shrink-0" size={16} />;
      case 'rst':
        return <VscFileMedia className="mr-2 text-blue-700 flex-shrink-0" size={16} />;
      
      // Python
      case 'py':
      case 'pyw':
      case 'pyi':
      case 'pyx':
      case 'pxd':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      
      // Java & JVM
      case 'java':
      case 'class':
        return <VscCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />;
      case 'kt':
        return <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />;
      case 'scala':
        return <VscCode className="mr-2 text-red-500 flex-shrink-0" size={16} />;
      case 'groovy':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      
      // C/C++ & Related
      case 'c':
        return <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'c++':
      case 'h':
      case 'hpp':
      case 'hh':
      case 'hxx':
        return <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'cs':
        return <VscCode className="mr-2 text-purple-600 flex-shrink-0" size={16} />;
      case 'd':
        return <VscCode className="mr-2 text-red-600 flex-shrink-0" size={16} />;
      case 'swift':
        return <VscCode className="mr-2 text-orange-600 flex-shrink-0" size={16} />;
      case 'objc':
      case 'm':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      
      // Scripting Languages
      case 'php':
      case 'phtml':
        return <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />;
      case 'rb':
      case 'erb':
        return <VscCode className="mr-2 text-red-500 flex-shrink-0" size={16} />;
      case 'go':
      case 'mod':
        return <VscCode className="mr-2 text-cyan-500 flex-shrink-0" size={16} />;
      case 'rs':
        return <VscCode className="mr-2 text-orange-600 flex-shrink-0" size={16} />;
      case 'pl':
      case 'pm':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      case 'lua':
        return <VscCode className="mr-2 text-blue-400 flex-shrink-0" size={16} />;
      case 'r':
        return <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'jl':
        return <VscCode className="mr-2 text-purple-600 flex-shrink-0" size={16} />;
      case 'clj':
      case 'cljs':
        return <VscCode className="mr-2 text-green-500 flex-shrink-0" size={16} />;
      case 'hs':
      case 'lhs':
        return <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />;
      case 'fs':
      case 'fsx':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      case 'ml':
      case 'mli':
        return <VscCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />;
      case 'elm':
        return <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'ex':
      case 'exs':
        return <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />;
      case 'cr':
        return <VscCode className="mr-2 text-red-500 flex-shrink-0" size={16} />;
      case 'nim':
        return <VscCode className="mr-2 text-yellow-500 flex-shrink-0" size={16} />;
      case 'zig':
        return <VscCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />;
      case 'v':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      
      // Shell & Scripts
      case 'sh':
      case 'bash':
      case 'zsh':
      case 'fish':
        return <VscFileCode className="mr-2 text-green-500 flex-shrink-0" size={16} />;
      case 'bat':
      case 'cmd':
        return <VscFileCode className="mr-2 text-gray-600 flex-shrink-0" size={16} />;
      case 'ps1':
      case 'psm1':
        return <VscFileCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'vbs':
        return <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      
      // Database & Query
      case 'sql':
      case 'ddl':
      case 'dml':
        return <VscCode className="mr-2 text-blue-400 flex-shrink-0" size={16} />;
      case 'mongo':
        return <VscCode className="mr-2 text-green-600 flex-shrink-0" size={16} />;
      case 'cypher':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      
      // Configuration & Data
      case 'yaml':
      case 'yml':
        return <VscFileCode className="mr-2 text-purple-400 flex-shrink-0" size={16} />;
      case 'toml':
        return <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      case 'ini':
      case 'cfg':
      case 'conf':
        return <VscFileCode className="mr-2 text-gray-500 flex-shrink-0" size={16} />;
      case 'env':
        return <VscFileCode className="mr-2 text-green-600 flex-shrink-0" size={16} />;
      case 'properties':
        return <VscFileCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />;
      case 'csv':
      case 'tsv':
        return <VscFileCode className="mr-2 text-green-500 flex-shrink-0" size={16} />;
      
      // Build & Package Files
      case 'cmake':
      case 'cmake.in':
        return <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      case 'makefile':
      case 'mk':
        return <VscFileCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />;
      case 'dockerfile':
        return <VscFileCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'lock':
        return <VscJson className="mr-2 text-yellow-500 flex-shrink-0" size={16} />;
      
      // Assembly & Low-level
      case 'asm':
      case 's':
      case 'S':
        return <VscCode className="mr-2 text-gray-600 flex-shrink-0" size={16} />;
      case 'll':
        return <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      
      // Documentation & Help
      case 'tex':
      case 'ltx':
        return <VscFileMedia className="mr-2 text-blue-700 flex-shrink-0" size={16} />;
      case 'bib':
        return <VscFileMedia className="mr-2 text-green-700 flex-shrink-0" size={16} />;
      case 'adoc':
      case 'asciidoc':
        return <VscFileMedia className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      
      // Other Common Formats
      case 'log':
        return <VscFileMedia className="mr-2 text-gray-600 flex-shrink-0" size={16} />;
      case 'diff':
      case 'patch':
        return <VscFileMedia className="mr-2 text-orange-500 flex-shrink-0" size={16} />;
      case 'gitignore':
      case 'gitattributes':
      case 'gitmodules':
        return <VscFileMedia className="mr-2 text-red-500 flex-shrink-0" size={16} />;
      case 'editorconfig':
        return <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      case 'eslintrc':
      case 'prettierrc':
      case 'babelrc':
      case 'tsconfig':
      case 'jsconfig':
        return <VscJson className="mr-2 text-green-600 flex-shrink-0" size={16} />;
      case 'webpack.config':
      case 'rollup.config':
      case 'tailwind.config':
      case 'postcss.config':
        return <VscCode className="mr-2 text-yellow-600 flex-shrink-0" size={16} />;
      case 'vite.config':
        return <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />;
      case 'browserslist':
        return <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />;
      case 'nvmrc':
      case 'node-version':
        return <VscFile className="mr-2 text-green-500 flex-shrink-0" size={16} />;
      
      default:
        return <VscFile className="mr-2 text-gray-500 flex-shrink-0" size={16} />;
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderName) 
        ? prev.filter(name => name !== folderName)
        : [...prev, folderName]
    );
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom, left: rect.left });
    setOpenDropdown(item.name);
  };

  // const handleRootContextMenu = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
    
  //   const rect = e.currentTarget.getBoundingClientRect();
  //   setRootMenuPosition({ top: rect.bottom, left: rect.left });
  //   setShowRootMenu(true);
  // };

  const handleRename = (item: FileSystemItem) => {
    setRenamingItem(item);
    setNewName(item.name);
    setOpenDropdown(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingItem && newName.trim() && newName !== renamingItem.name) {
      onRenameItem(renamingItem, newName.trim());
    }
    setRenamingItem(null);
    setNewName('');
  };

  const handleCreateItem = (parent: Folder, type: 'file' | 'folder') => {
    setCreatingItem({ parentPath: parent.name, type });
    setNewItemName('');
    setOpenDropdown(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingItem && newItemName.trim()) {
      const newItem: FileSystemItem = creatingItem.type === 'file'
        ? { type: 'file', name: newItemName.trim(), content: '' }
        : { type: 'folder', name: newItemName.trim(), items: [] };
      
      onAddItem(creatingItem.parentPath === 'root' ? { type: 'folder', name: 'root', items: items } : 
        items.find(item => item.name === creatingItem.parentPath) as Folder, newItem);
    }
    setCreatingItem(null);
    setNewItemName('');
  };

  const handleCopy = (item: FileSystemItem) => {
    setClipboard({ item, operation: 'copy' });
    setOpenDropdown(null);
  };

  const handleCut = (item: FileSystemItem) => {
    setClipboard({ item, operation: 'cut' });
    setOpenDropdown(null);
  };

  const handlePaste = (targetFolder: Folder) => {
    if (clipboard) {
      const newItem = { ...clipboard.item };
      if (clipboard.operation === 'cut') {
        // Remove from original location
        onDeleteItem(clipboard.item);
      }
      // Add to target folder
      onAddItem(targetFolder, newItem);
      setClipboard(null);
    }
    setOpenDropdown(null);
  };

  const canPaste = (folder: Folder) => {
    return clipboard && folder.name !== clipboard.item.name;
  };

  const renderItem = (item: FileSystemItem, depth: number = 0) => {
    const isExpanded = expandedFolders.includes(item.name);
    const isActive = activeFile?.name === item.name;

    if (item.type === 'file') {
      return (
        <div
          key={item.name}
          className={`
            flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 group
            ${isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onFileSelect(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {getFileIcon(item.name)}
          <span className="truncate">{item.name}</span>
          
          {/* Context menu button */}
          <button
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, item);
            }}
          >
            <VscKebabVertical size={14} />
          </button>
        </div>
      );
    }

    if (item.type === 'folder') {
      return (
        <div key={item.name}>
          <div
            className={`
              flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 group
              ${isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}
            `}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => toggleFolder(item.name)}
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            <button
              className="mr-1 p-0.5 hover:bg-gray-200 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.name);
              }}
            >
              {isExpanded ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />}
            </button>
            {/* <VscFolder className="mr-2 text-blue-600 flex-shrink-0" size={16} /> */}
            <span className="truncate">{item.name}</span>
            
            {/* Context menu button */}
            <button
              className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, item);
              }}
            >
              <VscKebabVertical size={14} />
            </button>
          </div>
          
          {/* Inline creation input */}
          {creatingItem && creatingItem.parentPath === item.name && (
            <div className="flex items-center py-[1px] px-2 text-gray-700 text-[13px]" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
              <form onSubmit={handleCreateSubmit} className="w-full flex items-center">
                {creatingItem.type === 'folder' ? (
                  <VscNewFolder className="mr-2 text-gray-500 flex-shrink-0" size={16} />
                ) : (
                  <VscNewFile className="mr-2 text-gray-500 flex-shrink-0" size={16} />
                )}
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={() => {
                    if (!newItemName.trim()) {
                      setCreatingItem(null);
                      setNewItemName('');
                    }
                  }}
                  autoFocus
                  placeholder={`Enter ${creatingItem.type} name...`}
                  className="bg-white border border-blue-500 rounded px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </form>
            </div>
          )}
          
          {/* Inline rename input */}
          {renamingItem && renamingItem.name === item.name && (
            <div className="flex items-center py-[1px] px-2 text-gray-700 text-[13px]" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
              <form onSubmit={handleRenameSubmit} className="w-full flex items-center">
                <VscFolder className="mr-2 text-gray-500 flex-shrink-0" size={16} />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => {
                    if (!newName.trim() || newName === item.name) {
                      setRenamingItem(null);
                      setNewName('');
                    }
                  }}
                  autoFocus
                  placeholder="Enter new name..."
                  className="bg-white border border-blue-500 rounded px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </form>
            </div>
          )}
          
          {isExpanded && (
            <div>
              {sortItems(item.items).map(childItem => renderItem(childItem, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative">
      {/* Root context menu trigger */}
      {/* <div
        className="p-2 cursor-pointer hover:bg-gray-100 rounded"
        onContextMenu={handleRootContextMenu}
      >
        <div className="flex items-center text-gray-600">
          <VscSettings size={16} />
          <span className="ml-2 text-sm">Root Actions</span>
        </div>
      </div> */}

      {/* File tree items */}
      <div className="py-2">
        {sortItems(items).map(item => renderItem(item))}
      </div>

      {/* Context menu dropdown */}
      {openDropdown && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
            onClick={() => handleRename(items.find(item => item.name === openDropdown)!)}
          >
            <VscEdit className="mr-2" size={14} />
            Rename
          </button>
          
          {items.find(item => item.name === openDropdown)?.type === 'folder' && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={() => handleCreateItem(items.find(item => item.name === openDropdown) as Folder, 'file')}
              >
                <VscNewFile className="mr-2" size={14} />
                New File
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={() => handleCreateItem(items.find(item => item.name === openDropdown) as Folder, 'folder')}
              >
                <VscNewFolder className="mr-2" size={14} />
                New Folder
              </button>
            </>
          )}
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
            onClick={() => handleCopy(items.find(item => item.name === openDropdown)!)}
          >
            <VscCopy className="mr-2" size={14} />
            Copy
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
            onClick={() => handleCut(items.find(item => item.name === openDropdown)!)}
          >
            <VscClippy className="mr-2" size={14} />
            Cut
          </button>
          
          {clipboard && items.find(item => item.name === openDropdown)?.type === 'folder' && (
            <button
              className={`w-full px-3 py-2 text-left text-sm flex items-center ${
                canPaste(items.find(item => item.name === openDropdown) as Folder)
                  ? 'hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              onClick={() => canPaste(items.find(item => item.name === openDropdown) as Folder) && 
                handlePaste(items.find(item => item.name === openDropdown) as Folder)}
              disabled={!canPaste(items.find(item => item.name === openDropdown) as Folder)}
            >
              <VscClippy className="mr-2" size={14} />
              Paste
            </button>
          )}
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
            onClick={() => {
              onDeleteItem(items.find(item => item.name === openDropdown)!);
              setOpenDropdown(null);
            }}
          >
            <VscTrash className="mr-2" size={14} />
            Delete
          </button>
        </div>,
        document.body
      )}

      {/* Root context menu */}
      {showRootMenu && rootMenuPosition && createPortal(
        <div
          ref={rootMenuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32"
          style={{
            top: rootMenuPosition.top,
            left: rootMenuPosition.left,
          }}
        >
          {clipboard && (
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              onClick={() => handlePaste({ type: 'folder', name: 'root', items: items })}
            >
              <VscClippy className="mr-2" size={14} />
              Paste
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default FileTree;
