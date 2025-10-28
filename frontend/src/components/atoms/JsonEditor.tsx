// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';

interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  valueType: 'object' | 'array';
  className?: string;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, valueType, className = '' }) => {
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    try {
      const formatted = JSON.stringify(value, null, 2);
      setJsonString(formatted);
      setError(null);
      setIsValid(true);
    } catch {
      setJsonString(String(value));
    }
  }, [value]);

  const handleJsonChange = (newJsonString: string) => {
    setJsonString(newJsonString);
    setError(null);
    setIsValid(true);

    try {
      const parsed = JSON.parse(newJsonString);
      
      // Validate type
      if (valueType === 'array' && !Array.isArray(parsed)) {
        setError('Value must be an array');
        setIsValid(false);
        return;
      }
      
      if (valueType === 'object' && (Array.isArray(parsed) || parsed === null)) {
        setError('Value must be an object');
        setIsValid(false);
        return;
      }

      onChange(parsed);
    } catch (parseError) {
      setError('Invalid JSON format');
      setIsValid(false);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
    } catch {
      // If parsing fails, don't format
    }
  };

  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (valueType === 'array' && !Array.isArray(parsed)) {
        setError('Value must be an array');
        setIsValid(false);
        return;
      }
      
      if (valueType === 'object' && (Array.isArray(parsed) || parsed === null)) {
        setError('Value must be an object');
        setIsValid(false);
        return;
      }

      setError(null);
      setIsValid(true);
    } catch (parseError) {
      setError('Invalid JSON format');
      setIsValid(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          JSON {valueType === 'array' ? 'Array' : 'Object'}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={formatJson}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          >
            Format
          </button>
          <button
            type="button"
            onClick={validateJson}
            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200"
          >
            Validate
          </button>
        </div>
      </div>
      
      <textarea
        value={jsonString}
        onChange={(e) => handleJsonChange(e.target.value)}
        rows={8}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
          error ? 'border-red-300' : isValid ? 'border-gray-300' : 'border-yellow-300'
        }`}
        placeholder={valueType === 'array' ? '["item1", "item2"]' : '{"key": "value"}'}
      />
      
      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}
      
      {!error && !isValid && (
        <div className="mt-1 text-sm text-yellow-600">
          JSON is valid but may not match the expected type
        </div>
      )}
    </div>
  );
};

export default JsonEditor;
