// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ModelCreate, Prototype } from '@/types/model.type'
import { createModelService } from '@/services/model.service'
import { listModelTemplates } from '@/services/modelTemplate.service'
import { createPrototypeService } from '@/services/prototype.service'
import { zipToModel } from '@/lib/zipUtils'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useToast } from '@/components/molecules/toaster/use-toast'

interface UseImportModelOptions {
  onSuccess?: () => void | Promise<void>
}

const useImportModel = (options?: UseImportModelOptions) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useSelfProfileQuery()
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)

  const createNewModel = useCallback(
    async (importedModel: any) => {
      if (!importedModel?.model) return
      try {
        const newModel: ModelCreate = {
          custom_apis: importedModel.model.custom_apis
            ? JSON.stringify(importedModel.model.custom_apis)
            : 'Empty',
          cvi: importedModel.model.cvi,
          main_api: importedModel.model.main_api || 'Vehicle',
          model_home_image_file:
            importedModel.model.model_home_image_file || '/ref/E-Car_Full_Vehicle.png',
          model_files: importedModel.model.model_files || {},
          name: importedModel.model.name || 'New Imported Model',
          extended_apis: importedModel.model.extended_apis || [],
          ...(importedModel.model.api_version && { api_version: importedModel.model.api_version }),
          visibility: 'private',
        }

        if (importedModel.model.custom_template) {
          ;(newModel as ModelCreate & { custom_template?: unknown }).custom_template =
            importedModel.model.custom_template
        } else {
          try {
            const templatesData = await listModelTemplates({ limit: 100, page: 1 })
            const defaultTemplate = templatesData?.results?.find(
              (t) => t.visibility === 'default',
            )
            if (defaultTemplate) {
              newModel.model_template_id = defaultTemplate.id
            }
          } catch (err) {
            console.warn('Could not fetch default model template:', err)
          }
        }
        const createdModel = await createModelService(newModel)
        addLog({
          name: `New model '${createdModel.name}' with visibility: ${createdModel.visibility}`,
          description: `New model '${createdModel.name}' was created by ${user?.email || user?.name || user?.id}`,
          type: 'new-model',
          create_by: user?.id!,
          ref_id: createdModel.id,
          ref_type: 'model',
        })

        if (importedModel.prototypes?.length > 0) {
          await Promise.all(
            importedModel.prototypes.map(async (proto: Partial<Prototype>) => {
              const newPrototype: Partial<Prototype> = {
                state: proto.state || 'development',
                apis: { VSS: [], VSC: [] },
                code: proto.code || '',
                widget_config: proto.widget_config || '{}',
                description: proto.description,
                tags: proto.tags || [],
                image_file: proto.image_file,
                model_id: createdModel,
                name: proto.name,
                complexity_level: proto.complexity_level || '3',
                customer_journey: proto.customer_journey || '{}',
                portfolio: proto.portfolio || {},
                extend: proto.extend || {},
              }
              return createPrototypeService(newPrototype)
            }),
          )
        }
        await options?.onSuccess?.()
        queryClient.invalidateQueries({ queryKey: ['modelsList', user?.id ?? 'anonymous'] })
        navigate(`/model/${createdModel}`)
      } catch (err) {
        console.error('Error creating model from zip: ', err)
        const description = isAxiosError(err)
          ? err.response?.data?.message ?? 'Something went wrong'
          : err instanceof Error
            ? err.message
            : 'Something went wrong'
        toast({
          title: 'Import failed',
          description,
          variant: 'destructive',
        })
      } finally {
        setIsImporting(false)
      }
    },
    [user, options?.onSuccess, navigate, queryClient, toast],
  )

  const handleImportModelZip = useCallback(
    async (file: File) => {
      try {
        setIsImporting(true)
        const model = await zipToModel(file)
        if (!model) {
          toast({
            title: 'Invalid model file',
            description: 'Could not read the selected zip file.',
            variant: 'destructive',
          })
          setIsImporting(false)
          return
        }
        await createNewModel(model)
      } catch (err) {
        console.error('Failed to import model zip: ', err)
        toast({
          title: 'Invalid model file',
          description:
            err instanceof Error
              ? err.message
              : 'Could not parse the selected file.',
          variant: 'destructive',
        })
        setIsImporting(false)
      }
    },
    [createNewModel, toast],
  )

  return { isImporting, handleImportModelZip }
}

export default useImportModel
