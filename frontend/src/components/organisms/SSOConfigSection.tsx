// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Spinner } from '@/components/atoms/spinner'
import { TbPlus, TbEdit, TbTrash, TbToggleLeft, TbToggleRight } from 'react-icons/tb'
import { v4 as uuidv4 } from 'uuid'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import config from '@/configs/config'

interface SSOProvider {
  id: string
  name: string
  type: 'MSAL' | 'GITHUB'
  enabled: boolean
  clientId: string
  authority?: string
  clientSecret?: string
  scopes?: string[]
}

const SSOConfigSection: React.FC = () => {
  const { data: user, isLoading: isUserLoading } = useSelfProfileQuery()
  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<SSOProvider>({
    id: '',
    name: '',
    type: 'MSAL',
    enabled: true,
    clientId: '',
    authority: '',
    clientSecret: '',
    scopes: ['User.Read'],
  })

  // Only load providers after user is authenticated
  useEffect(() => {
    if (isUserLoading || !user) return
    loadProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, !!user])

  const loadProviders = async () => {
    try {
      setIsLoading(true)
      const response = await configManagementService.getConfigs({
        key: 'SSO_PROVIDERS',
        category: 'sso',
        scope: 'site',
      })
      
      if (response.results && response.results.length > 0) {
        setProviders(response.results[0].value || [])
      } else {
        setProviders([])
      }
    } catch (error) {
      console.error('Failed to load SSO providers:', error)
      toast({
        title: 'Load failed',
        description: 'Failed to load SSO providers',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProvider = () => {
    setEditingProvider(null)
    setFormData({
      id: uuidv4(),
      name: '',
      type: 'MSAL',
      enabled: true,
      clientId: '',
      authority: '',
      clientSecret: '',
      scopes: ['User.Read'],
    } as SSOProvider)
    setIsFormOpen(true)
  }

  const handleEditProvider = (provider: SSOProvider) => {
    setEditingProvider(provider)
    setFormData({ ...provider })
    setIsFormOpen(true)
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!window.confirm('Delete this SSO provider? Users will no longer be able to sign in using this provider.')) {
      return
    }

    try {
      setIsSaving(true)
      const updatedProviders = providers.filter(p => p.id !== providerId)
      await saveProviders(updatedProviders)
      
      toast({
        title: 'Deleted',
        description: 'SSO provider deleted successfully. Reloading page...',
      })
      
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete SSO provider',
        variant: 'destructive',
      })
      setIsSaving(false)
    }
  }

  const handleToggleEnabled = async (provider: SSOProvider) => {
    try {
      setIsSaving(true)
      const updatedProviders = providers.map(p =>
        p.id === provider.id ? { ...p, enabled: !p.enabled } : p
      )
      await saveProviders(updatedProviders)
      
      toast({
        title: 'Updated',
        description: `SSO provider ${!provider.enabled ? 'enabled' : 'disabled'}. Reloading page...`,
      })
      
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update SSO provider',
        variant: 'destructive',
      })
      setIsSaving(false)
    }
  }

  const handleSaveProvider = async () => {
    if (!formData.name || !formData.clientId || !formData.clientSecret) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    if (formData.type === 'MSAL' && !formData.authority) {
      toast({
        title: 'Validation error',
        description: 'Authority URL is required for MSAL',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      let updatedProviders: SSOProvider[]
      
      const toSave = formData.type === 'GITHUB'
        ? { ...formData, authority: undefined, scopes: (formData.scopes && formData.scopes.length) ? formData.scopes : ['user:email'] }
        : { ...formData, authority: formData.authority || '', scopes: formData.scopes || ['User.Read'] }
      if (editingProvider) {
        updatedProviders = providers.map(p =>
          p.id === editingProvider.id ? toSave : p
        )
      } else {
        updatedProviders = [...providers, toSave]
      }

      await saveProviders(updatedProviders)
      
      toast({
        title: editingProvider ? 'Updated' : 'Created',
        description: `SSO provider ${editingProvider ? 'updated' : 'created'} successfully. Reloading page...`,
      })
      
      setIsFormOpen(false)
      
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save SSO provider',
        variant: 'destructive',
      })
      setIsSaving(false)
    }
  }

  const saveProviders = async (updatedProviders: SSOProvider[]) => {
    const response = await configManagementService.getConfigs({
      key: 'SSO_PROVIDERS',
      category: 'sso',
      scope: 'site',
    })

    const valueBefore =
      response.results && response.results.length > 0
        ? response.results[0].value
        : undefined

    if (response.results && response.results.length > 0) {
      // Update existing config
      await configManagementService.updateConfigById(response.results[0].id!, {
        value: updatedProviders,
      })
    } else {
      // Create new config
      await configManagementService.createConfig({
        key: 'SSO_PROVIDERS',
        scope: 'site',
        category: 'sso',
        value: updatedProviders,
        valueType: 'array',
        secret: false,
      })
    }

    pushSiteConfigEdit({
      key: 'SSO_PROVIDERS',
      valueBefore,
      valueAfter: updatedProviders,
      valueType: 'array',
      section: 'sso',
    })
  }

  // Show loading spinner while authenticating user or loading providers
  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
      </div>
    )
  }

  // If user is not authenticated, show message (shouldn't happen as page is protected)
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Please sign in to manage SSO providers.</p>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            SSO Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Single Sign-On (SSO) providers for your organization
          </p>
        </div>
        <Button size="sm" onClick={handleAddProvider} disabled={isSaving}>
          <TbPlus className="mr-2" size={18} />
          Add Provider
        </Button>
      </div>

      <div className="p-6">
        {providers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No SSO providers configured. Add your first provider to enable SSO authentication.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="border border-border rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{provider.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        provider.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {provider.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Type:</dt>
                      <dd className="font-medium">{provider.type}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Client ID:</dt>
                      <dd className="font-mono text-xs">{provider.clientId}</dd>
                    </div>
                    {provider.type === 'MSAL' && (
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Authority:</dt>
                        <dd className="font-mono text-xs break-all">{provider.authority || '—'}</dd>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Scopes:</dt>
                      <dd className="text-xs">{(provider.scopes || []).join(', ')}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleEnabled(provider)}
                    disabled={isSaving}
                    title={provider.enabled ? 'Disable' : 'Enable'}
                  >
                    {provider.enabled ? <TbToggleRight size={18} /> : <TbToggleLeft size={18} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditProvider(provider)}
                    disabled={isSaving}
                  >
                    <TbEdit size={18} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProvider(provider.id)}
                    disabled={isSaving}
                  >
                    <TbTrash size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {editingProvider ? 'Edit SSO Provider' : 'Add SSO Provider'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Provider Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bosch SSO, Company SSO"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'MSAL' | 'GITHUB'
                    setFormData({
                      ...formData,
                      type: newType,
                      ...(newType === 'GITHUB' ? { scopes: ['user:email'], authority: undefined } : { scopes: formData.scopes?.length ? formData.scopes : ['User.Read'], authority: formData.authority || '' }),
                    })
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="MSAL">MSAL / Azure AD</option>
                  <option value="GITHUB">GitHub</option>
                </select>
              </div>

              <div>
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder={formData.type === 'GITHUB' ? 'GitHub OAuth App Client ID' : 'Azure AD Application (client) ID'}
                  className="font-mono text-sm"
                />
              </div>

              {formData.type === 'MSAL' && (
                <div>
                  <Label htmlFor="authority">Authority URL *</Label>
                  <Input
                    id="authority"
                    value={formData.authority || ''}
                    onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                    placeholder="https://login.microsoftonline.com/{tenant-id}"
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="clientSecret">Client Secret *</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={formData.clientSecret || ''}
                  onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  placeholder={formData.type === 'GITHUB' ? 'GitHub OAuth App Client Secret' : 'Client secret from Azure AD'}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Secret will be encrypted before storage
                </p>
              </div>

              {formData.type === 'GITHUB' && (
                <>
                  <div>
                    <Label htmlFor="github-scopes">Scopes (comma or space-separated)</Label>
                    <Input
                      id="github-scopes"
                      value={(formData.scopes && formData.scopes.length) ? formData.scopes.join(', ') : 'user:email'}
                      onChange={(e) => setFormData({
                        ...formData,
                        scopes: e.target.value.split(/[\s,]+/).map(s => s.trim()).filter(Boolean),
                      })}
                      placeholder="user:email, read:user"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      e.g. user:email (required for login), read:user. Leave default for sign-in.
                    </p>
                  </div>
                  <div>
                    <Label>Callback URL (add this in GitHub OAuth App settings)</Label>
                    <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                      {`${config.serverBaseUrl}/${config.serverVersion}/auth/github-sso/callback`}
                    </p>
                  </div>
                </>
              )}

              {formData.type === 'MSAL' && (
                <div>
                  <Label htmlFor="scopes">Scopes (comma-separated)</Label>
                  <Input
                    id="scopes"
                    value={(formData.scopes || []).join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      scopes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                    })}
                    placeholder="User.Read, email, profile"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                  Enable this provider
                </Label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProvider} disabled={isSaving}>
                {isSaving && <Spinner className="mr-2" size={16} />}
                {editingProvider ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SSOConfigSection

