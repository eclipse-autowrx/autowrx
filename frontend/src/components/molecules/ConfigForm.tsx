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
import { Button } from '../atoms/button';
import { Input } from '../atoms/input';
import { Textarea } from '../atoms/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../atoms/select';
import { Checkbox } from '../atoms/checkbox';
import { Label } from '../atoms/label';

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

  const handleValueTypeChange = (value: string) => {
    const newType = value as typeof valueType;
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
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.value === true || formData.value === 'true'}
                onCheckedChange={(checked) => handleValueChange(checked)}
              />
              <Label className="text-sm font-medium">True</Label>
            </div>
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
          <Input
            type="number"
            name="value"
            value={formData.value}
            onChange={(e) => handleValueChange(e.target.value)}
            step="any"
          />
        );
      default: // string
        return (
          <Textarea
            name="value"
            value={formData.value}
            onChange={(e) => handleValueChange(e.target.value)}
            rows={3}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col">
        <Label className="mb-1">Key *</Label>
        <Input
          name="key"
          value={formData.key}
          onChange={handleInputChange}
          disabled={!!config} // Can't change key when editing
          required
        />
      </div>

      {/* Scope and target_id are hidden for site scope - they're automatically set */}
      <input type="hidden" name="scope" value="site" />
      <input type="hidden" name="target_id" value="" />

      <div className="flex flex-col">
        <Label className="mb-1">Value Type</Label>
        <Select value={valueType} onValueChange={handleValueTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="object">Object (JSON)</SelectItem>
            <SelectItem value="array">Array (JSON)</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="color">Color</SelectItem>
            <SelectItem value="image_url">Image URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1 font-semibold">Value *</Label>
        {renderValueInput()}
        {valueError && (
          <p className="mt-1 text-sm text-destructive">{valueError}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={formData.secret}
          onCheckedChange={(checked) => handleInputChange({ target: { name: 'secret', type: 'checkbox', checked: checked as boolean } } as React.ChangeEvent<HTMLInputElement>)}
        />
        <Label>Secret (admin only)</Label>
      </div>

      <div className="flex flex-col">
        <Label className="mb-1">Category</Label>
        <Input
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          placeholder="e.g., branding, api, system"
        />
      </div>

      <div className="flex flex-col">
        <Label className="mb-1">Description</Label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={2}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (config ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
};

export default ConfigForm;
