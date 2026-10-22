// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useModelStore from '@/stores/modelStore'
import ViewApiCovesa from '@/components/organisms/ViewApiCovesa'
import ViewCustomApiSet from '@/components/organisms/ViewCustomApiSet'
import ModelApiTabs from '@/components/molecules/ModelApiTabs'
import CustomApiSetPicker from '@/components/organisms/CustomApiSetPicker'
import PluginPageRender from '@/components/organisms/PluginPageRender'
import { updateModelService } from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { useConfiguredPlugins } from '@/hooks/useConfiguredPlugins'
import { PERMISSIONS } from '@/data/permission'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { useSiteConfig } from '@/utils/siteConfig'

const PageVehicleApi = () => {
  const { model_id, instance_id, plugin_slug } = useParams<{
    model_id: string
    instance_id?: string
    api?: string
    plugin_slug?: string
  }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const customApiSetsEnabled = !useSiteConfig('DISABLE_CUSTOM_API_SETS', false)
  const modelApiPlugins = useConfiguredPlugins('MODEL_API_PLUGINS')
  const activePlugin = plugin_slug
    ? modelApiPlugins.find((p) => p.plugin === plugin_slug)
    : undefined

  const { data: model, refetch: refetchModel } = useCurrentModel()
  const [hasWritePermission] = usePermissionHook([
    PERMISSIONS.WRITE_MODEL,
    model_id,
  ])
  const [refreshModel, activeModelApis] = useModelStore((state) => [
    state.refreshModel,
    state.activeModelApis,
  ])

  // Get COVESA API count
  const covesaApiCount = activeModelApis?.length || 0

  // Determine active tab based on route
  // If instance_id is 'covesa' or not present (and api param exists for COVESA), show COVESA tab
  // Otherwise, show plugin instance tab
  const isCovesaTab = !instance_id || instance_id === 'covesa'

  // Redirect away from custom API set routes when the feature is disabled
  useEffect(() => {
    if (
      !customApiSetsEnabled &&
      instance_id &&
      instance_id !== 'covesa' &&
      model_id
    ) {
      navigate(`/model/${model_id}/api`, { replace: true })
    }
  }, [customApiSetsEnabled, instance_id, model_id, navigate])

  // Get custom_api_sets from model and normalize to strings
  const customApiSetIds = (model?.custom_api_sets || [])
    .map((id: any) => {
      if (typeof id === 'string') return id
      if (id && typeof id === 'object' && 'toString' in id) return id.toString()
      return String(id)
    })
    .filter((id: any): id is string => !!id && typeof id === 'string')

  // Filter out 'covesa' from set IDs if it somehow got added
  const validSetIds = customApiSetsEnabled
    ? customApiSetIds.filter((id) => id !== 'covesa')
    : []

  const handleAddInstance = async (instanceId: string) => {
    if (!model || !customApiSetsEnabled) return

    try {
      // Add set to model.custom_api_sets
      const currentSets = validSetIds || []
      if (currentSets.includes(instanceId)) {
        toast({
          title: 'Already added',
          description: 'This API set is already added to the model',
          variant: 'destructive',
        })
        return
      }

      // Ensure all IDs are strings before saving
      const updatedSets = [...currentSets, instanceId]
        .map((id: any) => {
          if (typeof id === 'string') return id
          // Check if id has toString method (handling potential object types)
          if (
            id &&
            typeof id === 'object' &&
            'toString' in id &&
            typeof id.toString === 'function'
          )
            return id.toString()
          return String(id)
        })
        .filter((id): id is string => !!id && typeof id === 'string')

      await updateModelService(model.id, {
        custom_api_sets: updatedSets,
      })

      // Refresh model data
      await Promise.all([refetchModel(), refreshModel()])
      queryClient.invalidateQueries({ queryKey: ['model', model_id] })

      // Navigate to the new tab
      navigate(`/model/${model_id}/api/${instanceId}`)

      toast({
        title: 'Added',
        description: 'API set added successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Add failed',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to add instance',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col da-page-vehicle-api">
      {/* Tab Bar */}
      {customApiSetsEnabled && (
        <div className="flex min-h-[52px] border-b border-muted-foreground/50 bg-background da-page-vehicle-api-tab-bar shrink-0">
          <div className="flex w-fit">
            <ModelApiTabs
              customApiSetIds={validSetIds}
              onAddInstance={() => setIsPickerOpen(true)}
              isModelOwner={hasWritePermission}
              covesaApiCount={covesaApiCount}
              plugins={modelApiPlugins}
            />
          </div>
          <div className="grow"></div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activePlugin ? (
          <PluginPageRender
            key={activePlugin.plugin}
            plugin_id={activePlugin.plugin}
            data={{ model: model || null, prototype: null }}
          />
        ) : isCovesaTab || !customApiSetsEnabled ? (
          <ViewApiCovesa />
        ) : instance_id ? (
          <ViewCustomApiSet key={instance_id} instanceId={instance_id} />
        ) : (
          <ViewApiCovesa />
        )}
      </div>

      {/* Instance Picker Dialog */}
      {hasWritePermission && customApiSetsEnabled && (
        <CustomApiSetPicker
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleAddInstance}
          excludeIds={validSetIds}
        />
      )}
    </div>
  )
}

export default PageVehicleApi
