// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useMemo, useState } from 'react';
import { Config, configManagementService } from '../../services/configManagement.service';
import { DaText } from '../atoms/DaText';
import { DaButton } from '../atoms/DaButton';
import { DaTag } from '../atoms/DaTag';
import DaLoader from '../atoms/DaLoader';
import { useToast } from '@/components/molecules/toaster/use-toast';
import { uploadFileService } from '@/services/upload.service';
import { DaInput } from '../atoms/DaInput';
import { DaTextarea } from '../atoms/DaTextarea';
import DaCheckbox from '../atoms/DaCheckbox';
import DaImportFile from '../atoms/DaImportFile';
import DatePicker from '../atoms/DatePicker';

interface ConfigListProps {
  configs: Config[];
  onEdit: (config: Config) => void; // kept for compatibility, unused for inline edit
  onDelete: (config: Config) => void; // kept for compatibility, delete hidden per request
  isLoading?: boolean;
  onUpdated?: () => void; // optional callback to refresh parent list
}

const ConfigList: React.FC<ConfigListProps> = ({
  configs,
  onEdit,
  onDelete,
  isLoading = false,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const formatValue = (value: any, valueType: string): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (valueType) {
      case 'object':
      case 'array':
        return JSON.stringify(value, null, 2);
      case 'boolean':
        return value ? 'True' : 'False';
      case 'date':
        return new Date(value).toLocaleString();
      case 'color':
        return value;
      case 'image_url':
        return value;
      default:
        return String(value);
    }
  };
  const startEdit = (config: Config) => {
    setEditingKey(config.key);
    setEditValue(localValues[config.key] ?? config.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue(null);
  };

  const parseEditedValue = (value: any, valueType: Config['valueType']) => {
    if (valueType === 'number') {
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (Number.isNaN(num)) {
        throw new Error('Please enter a valid number');
      }
      return num;
    }
    if (valueType === 'boolean') {
      return Boolean(value);
    }
    if (valueType === 'date') {
      const iso = new Date(value).toISOString();
      if (iso === 'Invalid Date') {
        throw new Error('Please enter a valid date');
      }
      return iso;
    }
    if (valueType === 'object' || valueType === 'array') {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (valueType === 'array' && !Array.isArray(parsed)) {
        throw new Error('Value must be a JSON array');
      }
      if (valueType === 'object' && (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object')) {
        throw new Error('Value must be a JSON object');
      }
      return parsed;
    }
    // string, color, image_url and default cases as string
    return value;
  };

  const saveEdit = async (config: Config, overrideValue?: any) => {
    try {
      setSavingKey(config.key);
      const candidate = overrideValue !== undefined ? overrideValue : editValue;
      const newValue = parseEditedValue(candidate, config.valueType);
      if (config.id) {
        await configManagementService.updateConfigById(config.id, { value: newValue });
      } else {
        await configManagementService.updateConfigByKey(config.key, { value: newValue });
      }
      setLocalValues((prev) => ({ ...prev, [config.key]: newValue }));
      toast({ title: 'Configuration updated', description: config.key });
      cancelEdit();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message || 'Could not update configuration',
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const getValueTypeVariant = (valueType: string): 'default' | 'secondary' => {
    // Use secondary for special types, default for common ones
    return ['object', 'array', 'color', 'image_url'].includes(valueType) ? 'secondary' : 'default';
  };

  // Delete is hidden per request; keeping handler for compatibility (unused)
  const handleDelete = (_config: Config) => { };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <DaLoader />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-8 flex flex-col">
        <DaText variant="sub-title" className="text-da-gray-medium">No configurations found</DaText>
        <DaText variant="small" className="text-da-gray-medium mt-1">Create your first configuration to get started</DaText>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {configs.map((config) => (
        <div
          key={config.id || config.key}
          className="bg-da-white rounded-lg p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Left: key and meta (1/3) */}
            <div className="md:col-span-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <DaText variant="sub-title" className="text-da-gray-dark truncate">
                  {config.key}
                </DaText>
                {config.secret && (
                  <DaTag variant="secondary" className="bg-red-100 text-red-800">
                    Secret
                  </DaTag>
                )}
              </div>
              {/* {config.description && (
                <DaText variant="small" className="text-da-gray-medium mb-2">{config.description}</DaText>
              )} */}
            </div>

            {/* Right: value (2/3) */}
            <div className="md:col-span-2">
              <div
                className="bg-da-gray-light rounded-md p-3 mb-2 cursor-pointer hover:ring-1 hover:ring-da-gray-medium"
                onClick={() => {
                  if (config.valueType !== 'image_url' && editingKey !== config.key) startEdit(config);
                }}
              >
                {editingKey === config.key ? (
                  <div className="space-y-3">
                    {config.valueType === 'image_url' ? (
                      <div className="space-y-3">
                        <DaTextarea
                          className="w-full "
                          textareaClassName="font-mono !text-xs !bg-white"
                          rows={2}
                          value={editValue ?? ''}
                          onChange={(e) => setEditValue((e.target as HTMLTextAreaElement).value)}
                        />
                        <div className="flex items-center gap-2">
                          <DaButton
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEdit(config);
                            }}
                            variant="solid"
                            size="sm"
                            disabled={savingKey === config.key}
                          >
                            {savingKey === config.key ? 'Saving...' : 'Save'}
                          </DaButton>
                          <DaButton
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}
                            variant="outline-nocolor"
                            size="sm"
                            disabled={savingKey === config.key}
                          >
                            Cancel
                          </DaButton>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-full border border-gray-200 rounded-md p-1 bg-white flex items-center justify-center overflow-hidden">
                            {editValue ? (
                              <img
                                src={editValue as any}
                                alt="Preview"
                                className="w-full max-w-[200px] h-fit max-h-[160px]  object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <DaText variant="small" className="text-da-gray-medium">No image URL</DaText>
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DaImportFile
                              accept="image/*"
                              onFileChange={async (file) => {
                                try {
                                  setUploadingKey(config.key);
                                  const { url } = await uploadFileService(file);
                                  setEditValue(url);
                                  await saveEdit(config, url);
                                } catch (err: any) {
                                  toast({ title: 'Upload failed', description: err?.message || 'Could not upload image', variant: 'destructive' });
                                } finally {
                                  setUploadingKey(null);
                                }
                              }}
                            >
                              <DaButton
                                variant="plain"
                                size="sm"
                                disabled={uploadingKey === config.key}
                              >
                                {uploadingKey === config.key ? 'Uploading...' : 'Upload Image'}
                              </DaButton>
                            </DaImportFile>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {config.valueType === 'boolean' && (
                      <DaCheckbox
                        checked={Boolean(editValue)}
                        onChange={() => setEditValue(!Boolean(editValue))}
                        label={String(Boolean(editValue))}
                      />
                    )}
                    {config.valueType === 'number' && (
                      <DaInput
                        type="number"
                        className="w-full"
                        inputClassName="text-sm"
                        value={editValue ?? ''}
                        onChange={(e) => setEditValue((e.target as HTMLInputElement).value)}
                      />
                    )}
                    {config.valueType === 'date' && (
                      <DatePicker
                        value={(editValue ?? config.value) as string}
                        onChange={(iso) => setEditValue(iso)}
                        className="w-full"
                      />
                    )}
                    {(config.valueType === 'string' || config.valueType === 'color') && (
                      <DaInput
                        type="text"
                        className="w-full"
                        inputClassName="text-sm"
                        value={editValue ?? ''}
                        onChange={(e) => setEditValue((e.target as HTMLInputElement).value)}
                      />
                    )}
                    {(config.valueType === 'object' || config.valueType === 'array') && (
                      <DaTextarea
                        className="w-full"
                        textareaClassName="font-mono text-sm bg-white"
                        rows={3}
                        value={typeof editValue === 'string' ? editValue : JSON.stringify(editValue, null, 2)}
                        onChange={(e) => setEditValue((e.target as HTMLTextAreaElement).value)}
                      />
                    )}
                    {/* For non-image types, keep actions directly under the editor */}
                    {config.valueType !== 'image_url' && (
                      <div className="flex items-center gap-2">
                        <DaButton
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEdit(config);
                          }}
                          variant="solid"
                          size="sm"
                          disabled={savingKey === config.key}
                        >
                          {savingKey === config.key ? 'Saving...' : 'Save'}
                        </DaButton>
                        <DaButton
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                          variant="outline-nocolor"
                          size="sm"
                          disabled={savingKey === config.key}
                        >
                          Cancel
                        </DaButton>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {config.valueType === 'color' ? (
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 border border-gray-300 rounded-md"
                          style={{ backgroundColor: (localValues[config.key] ?? config.value) as any }}
                        />
                        <DaText variant="small" className="font-mono">{(localValues[config.key] ?? config.value) as any}</DaText>
                      </div>
                    ) : config.valueType === 'image_url' ? (
                      <div className="space-y-3">
                        <div
                          className="cursor-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(config);
                          }}
                        >
                          <DaText variant="small" className="font-mono break-all">
                            {(localValues[config.key] ?? config.value) as any || 'Click to enter image URL'}
                          </DaText>
                        </div>
                        <div className="flex flex-col items-center gap-0">
                          <div className="w-full border border-gray-200 rounded-md p-1 bg-white flex items-center justify-center overflow-hidden">
                            {(localValues[config.key] ?? config.value) ? (
                              <img
                                src={(localValues[config.key] ?? config.value) as any}
                                alt="Preview"
                                className="w-full max-w-[200px] h-fit max-h-[160px] object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <DaText variant="small" className="text-da-gray-medium">No image URL</DaText>
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DaImportFile
                              accept="image/*"
                              onFileChange={async (file) => {
                                try {
                                  setUploadingKey(config.key);
                                  const { url } = await uploadFileService(file);
                                  setLocalValues((prev) => ({ ...prev, [config.key]: url }));
                                  await saveEdit(config, url);
                                } catch (err: any) {
                                  toast({ title: 'Upload failed', description: err?.message || 'Could not upload image', variant: 'destructive' });
                                } finally {
                                  setUploadingKey(null);
                                }
                              }}
                            >
                              <DaButton
                                variant="plain"
                                size="sm"
                                disabled={uploadingKey === config.key}
                              >
                                {uploadingKey === config.key ? 'Uploading...' : 'Upload Image'}
                              </DaButton>
                            </DaImportFile>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <DaText variant="small" className="text-da-gray-dark whitespace-pre-wrap break-words font-mono">
                        {formatValue(localValues[config.key] ?? config.value, config.valueType)}
                      </DaText>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConfigList;
