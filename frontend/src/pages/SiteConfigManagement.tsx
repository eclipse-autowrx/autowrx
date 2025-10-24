// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';
import { Config, CreateConfigRequest, UpdateConfigRequest } from '../services/configManagement.service';
import { configManagementService } from '../services/configManagement.service';
import ConfigForm from '../components/molecules/ConfigForm';
import ConfigList from '../components/molecules/ConfigList';
import { DaText } from '../components/atoms/DaText';
import { DaButton } from '../components/atoms/DaButton';
import DaTabItem from '../components/atoms/DaTabItem';
import { useToast } from '@/components/molecules/toaster/use-toast';
import DaPopup from '../components/atoms/DaPopup';
import CodeEditor from '@/components/molecules/CodeEditor';
import DaLoader from '../components/atoms/DaLoader';
import useSelfProfileQuery from '@/hooks/useSelfProfile';

// Predefined site configurations with default values
const PREDEFINED_SITE_CONFIGS: CreateConfigRequest[] = [
  {
    key: 'SITE_LOGO_WIDE',
    scope: 'site',
    value: '/imgs/logo-wide.png',
    secret: false,
    valueType: 'image_url',
  },
  {
    key: 'SITE_TITLE',
    scope: 'site',
    value: 'Playground | digital.auto',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'SITE_DESCRIPTION',
    scope: 'site',
    value: 'Fast prototyping platform for vehicle QM applications',
    secret: false,
    valueType: 'string',
  },
  {
    key: "PRIVACY_POLICY_URL",
    scope: 'site',
    value: '/privacy-policy',
    secret: false,
    valueType: 'string',
  },
  {
    key: "TERMS_OF_SERVICE_URL",
    scope: 'site',
    value: '/terms-of-service',
    secret: false,
    valueType: 'string',
  },
  {
    key: "RUNTIME_SERVER_URL",
    scope: 'site',
    value: 'https://kit.digitalauto.tech',
    secret: false,
    valueType: 'string',
  },
  {
    key: "DEFAULT_MARKETPLACE_URL",
    scope: 'site',
    value: 'https://marketplace.digitalauto.tech',
    secret: false,
    valueType: 'string',
  },
  {
    key: "SUPPORT_CENTER_URL",
    scope: 'site',
    value: 'https://github.com/eclipse-autowrx/autowrx/issues',
    secret: false,
    valueType: 'string',
  }
];

const SiteConfigManagement: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery();
  const [activeTab, setActiveTab] = useState<'public' | 'style' | 'secrets'>('public');
  const [publicConfigs, setPublicConfigs] = useState<Config[]>([]);
  const [secretConfigs, setSecretConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | undefined>();
  const { toast } = useToast();
  const [globalCss, setGlobalCss] = useState<string>('');
  const [savingStyle, setSavingStyle] = useState<boolean>(false);

  const initializePredefinedConfigs = async () => {
    try {
      // Get existing configs to check which ones are missing
      const existingConfigs = await configManagementService.getConfigs({ 
        scope: 'site' as const, 
        limit: 100 
      });
      
      const existingKeys = new Set(existingConfigs.results.map(config => config.key));
      
      // Find missing predefined configs
      const missingConfigs = PREDEFINED_SITE_CONFIGS.filter(
        config => !existingKeys.has(config.key)
      );
      
      // Create missing configs
      if (missingConfigs.length > 0) {
        await configManagementService.bulkUpsertConfigs({ configs: missingConfigs });
      }
    } catch (error) {
      console.warn('Failed to initialize predefined configs:', error);
    }
  };

  const loadConfigs = async () => {
    setIsLoading(true);
    
    try {
      // First initialize predefined configs
      await initializePredefinedConfigs();
      
      const queryParams = {
        scope: 'site' as const,
        limit: 100,
      };
      
      const [publicData, secretData] = await Promise.all([
        configManagementService.getConfigs({ ...queryParams, secret: false }),
        configManagementService.getConfigs({ ...queryParams, secret: true }),
      ]);
      
      setPublicConfigs(publicData?.results || []);
      setSecretConfigs(secretData?.results || []);
    } catch (err) {
      console.error('Failed to load configurations:', err);
      toast({
        title: 'Load configurations failed',
        description: err instanceof Error ? err.message : 'Failed to load configurations',
        variant: 'destructive',
      });
      // Ensure we always have valid arrays even on error
      setPublicConfigs([]);
      setSecretConfigs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGlobalCss = async () => {
    try {
      const res = await configManagementService.getGlobalCss();
      setGlobalCss(res?.content || '');
    } catch (err) {
      toast({
        title: 'Load site style failed',
        description: err instanceof Error ? err.message : 'Failed to load site style',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    // Wait until self profile (and token refresh) completes to avoid 401s
    if (selfLoading) return;
    if (!self) return; // user not loaded yet or not authenticated
    loadConfigs();
    loadGlobalCss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self]);

  const handleCreateConfig = () => {
    setEditingConfig(undefined);
    setIsFormOpen(true);
  };

  const handleEditConfig = (config: Config) => {
    setEditingConfig(config);
    setIsFormOpen(true);
  };

  const handleDeleteConfig = async (config: Config) => {
    if (!window.confirm(`Are you sure you want to delete the configuration "${config.key}"?`)) {
      return;
    }

    try {
      if (config.id) {
        await configManagementService.deleteConfigById(config.id);
      } else {
        await configManagementService.deleteConfigByKey(config.key);
      }
      
      await loadConfigs();
    } catch (err) {
      toast({
        title: 'Delete configuration failed',
        description: err instanceof Error ? err.message : 'Failed to delete configuration',
        variant: 'destructive',
      });
    }
  };

  const handleSaveConfig = async (configData: CreateConfigRequest | UpdateConfigRequest) => {
    try {
      if (editingConfig) {
        // Update existing config
        if (editingConfig.id) {
          await configManagementService.updateConfigById(editingConfig.id, configData as UpdateConfigRequest);
        } else {
          await configManagementService.updateConfigByKey(editingConfig.key, configData as UpdateConfigRequest);
        }
      } else {
        // Create new config
        await configManagementService.createConfig(configData as CreateConfigRequest);
      }
      
      setIsFormOpen(false);
      setEditingConfig(undefined);
      await loadConfigs();
    } catch (err) {
      toast({
        title: 'Save configuration failed',
        description: err instanceof Error ? err.message : 'Failed to save configuration',
        variant: 'destructive',
      });
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingConfig(undefined);
  };

  const handleFactoryReset = async () => {
    if (!window.confirm('Factory reset will delete all site configurations and restore defaults. Continue?')) {
      return;
    }
    try {
      setIsLoading(true);
      // Fetch all existing site configs (increase limit to reduce paging risk)
      const all = await configManagementService.getConfigs({ scope: 'site', limit: 1000 });

      // Delete each config
      for (const cfg of all.results || []) {
        try {
          if (cfg.id) {
            await configManagementService.deleteConfigById(cfg.id);
          } else {
            await configManagementService.deleteConfigByKey(cfg.key);
          }
        } catch (e) {
          // Continue deleting others even if one fails
          console.warn('Failed to delete config', cfg.key, e);
        }
      }

      // Re-seed defaults
      await configManagementService.bulkUpsertConfigs({ configs: PREDEFINED_SITE_CONFIGS });

      await loadConfigs();
    } catch (err) {
      toast({
        title: 'Factory reset failed',
        description: err instanceof Error ? err.message : 'Failed to factory reset configurations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentConfigs = activeTab === 'public' ? (publicConfigs || []) : (activeTab === 'secrets' ? (secretConfigs || []) : []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col">
          <DaText variant="huge-bold" className="text-da-gray-dark">
            Site Management
          </DaText>
          <DaText variant="regular" className="mt-2 text-da-gray-medium">
            Manage site configurations and settings
          </DaText>
        </div>

        


        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-da-gray-light">
            <nav className="-mb-px flex space-x-8">
              <DaTabItem
                active={activeTab === 'public'}
                onClick={() => setActiveTab('public')}
                small={false}
              >
                Config ({publicConfigs?.length || 0})
              </DaTabItem>
              <DaTabItem
                active={activeTab === 'style'}
                onClick={() => setActiveTab('style')}
                small={false}
              >
                Site Style
              </DaTabItem>
              <DaTabItem
                active={activeTab === 'secrets'}
                onClick={() => setActiveTab('secrets')}
                small={false}
              >
                Secrets ({secretConfigs?.length || 0})
              </DaTabItem>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-da-white rounded-lg shadow">
          {activeTab !== 'style' ? (
            <div className="px-6 py-4 border-b border-da-gray-light">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <DaText variant="sub-title" className="text-da-gray-dark">
                    {activeTab === 'public' ? 'Configurations' : 'Secret Configurations'}
                  </DaText>
                </div>
                <div className="flex items-center space-x-2">
                  <DaButton
                    onClick={handleFactoryReset}
                    variant="destructive"
                    size="md"
                    disabled={isLoading}
                  >
                    Factory Reset
                  </DaButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-3 border-b border-da-gray-light flex items-center justify-between">
              <DaText variant="sub-title" className="text-da-gray-dark">Site Style (global.css)</DaText>
              <DaButton
                onClick={async () => {
                  try {
                    setSavingStyle(true);
                    await configManagementService.updateGlobalCss(globalCss);
                    toast({ title: 'Saved', description: 'Site style updated' });
                  } catch (err) {
                    toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Failed to save site style', variant: 'destructive' });
                  } finally {
                    setSavingStyle(false);
                  }
                }}
                variant="solid"
                size="md"
                disabled={savingStyle}
              >
                {savingStyle ? 'Saving...' : 'Save'}
              </DaButton>
            </div>
          )}

          <div className="p-6">
            {activeTab === 'style' ? (
              <div className="h-[70vh] flex flex-col">
                <CodeEditor
                  code={globalCss}
                  setCode={setGlobalCss}
                  editable={true}
                  language="css"
                  onBlur={() => {}}
                  fontSize={14}
                />
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center py-8">
                <DaLoader />
              </div>
            ) : (
              <ConfigList
                configs={currentConfigs}
                onEdit={handleEditConfig}
                onDelete={handleDeleteConfig}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Form Modal */}
        <DaPopup
          trigger={<div />}
          state={[isFormOpen, setIsFormOpen]}
          onClose={handleCancelForm}
        >
          <div className="w-[600px]">
            <div className="flex items-center justify-between mb-4">
              <DaText variant="sub-title" className="text-da-gray-dark">
                {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
              </DaText>
            </div>
            
            <ConfigForm
              config={editingConfig}
              onSave={handleSaveConfig}
              onCancel={handleCancelForm}
              isLoading={isLoading}
            />
          </div>
        </DaPopup>
      </div>
    </div>
  );
};

export default SiteConfigManagement;
