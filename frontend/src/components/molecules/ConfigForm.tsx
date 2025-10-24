// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';
import { Config, CreateConfigRequest, UpdateConfigRequest } from '../../services/configManagement.service';
import ColorPicker from '../atoms/ColorPicker';
import ImageUrlInput from '../atoms/ImageUrlInput';
import DatePicker from '../atoms/DatePicker';
import JsonEditor from '../atoms/JsonEditor';
import { DaText } from '../atoms/DaText';
import { DaButton } from '../atoms/DaButton';
import { DaInput } from '../atoms/DaInput';
import { DaTextarea } from '../atoms/DaTextarea';
import { DaSelect } from '../atoms/DaSelect';
import DaCheckbox from '../atoms/DaCheckbox';

interface ConfigFormProps {
  config?: Config;
  onSave: (config: CreateConfigRequest | UpdateConfigRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  config,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    key: config?.key || '',
    scope: 'site', // Always site scope for this form
    target_id: '', // Always empty for site scope
    value: config?.value || '',
    secret: config?.secret || false,
    description: config?.description || '',
    category: config?.category || 'general',
  });

  const [valueType, setValueType] = useState<'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'color' | 'image_url'>('string');
  const [valueError, setValueError] = useState<string>('');

  useEffect(() => {
    if (config) {
      setFormData({
        key: config.key,
        scope: 'site', // Always site scope
        target_id: '', // Always empty for site scope
        value: config.value,
        secret: config.secret,
        description: config.description || '',
        category: config.category || 'general',
      });
      setValueType(config.valueType);
    }
  }, [config]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleValueTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as typeof valueType;
    setValueType(newType);
    
    // Reset value when type changes
    setFormData(prev => ({ ...prev, value: '' }));
  };

  const handleValueChange = (newValue: any) => {
    setFormData(prev => ({ ...prev, value: newValue }));
    setValueError('');
  };

  const parseValue = (value: string, type: string): any => {
    try {
      switch (type) {
        case 'number':
          return parseFloat(value);
        case 'boolean':
          return value.toLowerCase() === 'true';
        case 'object':
        case 'array':
          return JSON.parse(value);
        case 'date':
          return new Date(value).toISOString();
        default:
          return value;
      }
    } catch (error) {
      throw new Error(`Invalid ${type} value: ${error}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const parsedValue = parseValue(formData.value, valueType);
      
      const configData = {
        ...formData,
        value: parsedValue,
      };

      await onSave(configData);
    } catch (error) {
      setValueError(error instanceof Error ? error.message : 'Invalid value format');
    }
  };

  const renderValueInput = () => {
    switch (valueType) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.value === true || formData.value === 'true'}
                onChange={(e) => handleValueChange(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">True</span>
            </label>
          </div>
        );
      case 'object':
      case 'array':
        return (
          <JsonEditor
            value={formData.value}
            onChange={handleValueChange}
            valueType={valueType}
          />
        );
      case 'date':
        return (
          <DatePicker
            value={formData.value}
            onChange={handleValueChange}
          />
        );
      case 'color':
        return (
          <ColorPicker
            value={formData.value}
            onChange={handleValueChange}
          />
        );
      case 'image_url':
        return (
          <ImageUrlInput
            value={formData.value}
            onChange={handleValueChange}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={(e) => handleValueChange(e.target.value)}
            step="any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      default: // string
        return (
          <textarea
            name="value"
            value={formData.value}
            onChange={(e) => handleValueChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DaInput
        label="Key *"
        name="key"
        value={formData.key}
        onChange={handleInputChange}
        disabled={!!config} // Can't change key when editing
        required
      />

      {/* Scope and target_id are hidden for site scope - they're automatically set */}
      <input type="hidden" name="scope" value="site" />
      <input type="hidden" name="target_id" value="" />

      <DaSelect
        label="Value Type"
        value={valueType}
        onValueChange={(value) => handleValueTypeChange({ target: { value } } as any)}
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
        <option value="object">Object (JSON)</option>
        <option value="array">Array (JSON)</option>
        <option value="date">Date</option>
        <option value="color">Color</option>
        <option value="image_url">Image URL</option>
      </DaSelect>

      <div>
        <DaText variant="small-bold" className="mb-1 text-da-gray-dark">
          Value *
        </DaText>
        {renderValueInput()}
        {valueError && (
          <DaText variant="small" className="mt-1 text-da-destructive">{valueError}</DaText>
        )}
      </div>

      <DaCheckbox
        checked={formData.secret}
        onChange={() => handleInputChange({ target: { name: 'secret', type: 'checkbox', checked: !formData.secret } } as any)}
        label="Secret (admin only)"
      />

      <DaInput
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleInputChange}
        placeholder="e.g., branding, api, system"
      />

      <DaTextarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        rows={2}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <DaButton
          type="button"
          onClick={onCancel}
          variant="outline-nocolor"
          size="md"
        >
          Cancel
        </DaButton>
        <DaButton
          type="submit"
          disabled={isLoading}
          variant="solid"
          size="md"
        >
          {isLoading ? 'Saving...' : (config ? 'Update' : 'Create')}
        </DaButton>
      </div>
    </form>
  );
};

export default ConfigForm;
