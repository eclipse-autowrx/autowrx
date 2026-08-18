// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useMemo, useState } from 'react'
import { TbCircleCheckFilled, TbFileImport } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Spinner } from '@/components/atoms/spinner'
import DaImportFile from '@/components/atoms/DaImportFile'
import DaDuplicateNameHint from '@/components/atoms/DaDuplicateNameHint'
import CustomDialog from '@/components/molecules/CustomDialog'
import { useToast } from '../toaster/use-toast'
import useCurrentModel from '@/hooks/useCurrentModel'
import {
  invalidatePrototypeListQueries,
  useListModelPrototypes,
} from '@/hooks/usePrototypeQueries'
import useDuplicateNameCheck from '@/hooks/useDuplicateNameCheck'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { buildPrototypeImportPayload, zipToPrototype } from '@/lib/zipUtils'
import { addLog } from '@/services/log.service'
import { createPrototypeService } from '@/services/prototype.service'
import { Prototype } from '@/types/model.type'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

const FormImportPrototype = () => {
  const { data: model } = useCurrentModel()
  const { data: modelPrototypes } = useListModelPrototypes(
    model ? model.id : '',
  )
  const { data: currentUser } = useSelfProfileQuery()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prototypeName, setPrototypeName] = useState<string>('')
  const [extractedPrototype, setExtractedPrototype] =
    useState<Partial<Prototype> | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isParsingImport, setIsParsingImport] = useState(false)

  const existingPrototypeNames = useMemo(
    () => modelPrototypes?.map((p) => p.name) ?? [],
    [modelPrototypes],
  )

  const {
    isDuplicate: isDuplicatePrototypeName,
    suggestedName: suggestedPrototypeName,
  } = useDuplicateNameCheck(prototypeName, existingPrototypeNames)

  const isDuplicateImportError = Boolean(
    importError?.includes('already in use for model'),
  )

  const apiSuggestedPrototypeName = useMemo(() => {
    if (!importError) return null
    const match = importError.match(/like:\s*([^.,]+)/)
    return match?.[1]?.trim() ?? null
  }, [importError])

  const handleFileChange = async (file: File) => {
    setSelectedFile(file)
    setImportError(null)
    try {
      const prototype = await zipToPrototype(model?.id || '', file)
      if (prototype && prototype.name) {
        setExtractedPrototype(prototype)
        setPrototypeName(prototype.name)
      } else {
        setImportError('Invalid zip file. Could not extract prototype data.')
        setExtractedPrototype(null)
        setPrototypeName('')
      }
    } catch (error) {
      setImportError('Error processing the zip file.')
      setExtractedPrototype(null)
      setPrototypeName('')
    }
  }

  const handleImportFileSelected = async (file: File) => {
    setImportError(null)
    setSelectedFile(null)
    setExtractedPrototype(null)
    setPrototypeName('')

    const maxFileSize = 10 * 1024 * 1024
    if (!file.name.endsWith('.zip')) {
      setImportError('Only .zip files are allowed.')
      setIsOpenImportDialog(true)
      return
    }
    if (file.size > maxFileSize) {
      setImportError('File size must be less than 10 MB.')
      setIsOpenImportDialog(true)
      return
    }

    setIsParsingImport(true)
    try {
      await handleFileChange(file)
    } finally {
      setIsParsingImport(false)
    }
    setIsOpenImportDialog(true)
  }

  const handleConfirmImport = async () => {
    if (
      !selectedFile ||
      !model ||
      !prototypeName.trim() ||
      !extractedPrototype
    ) {
      setImportError('Please select a valid file and provide a prototype name.')
      return
    }

    if (isDuplicatePrototypeName) {
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      const prototypePayload = buildPrototypeImportPayload(
        extractedPrototype,
        model.id,
        prototypeName,
      )

      const response = await createPrototypeService(prototypePayload)

      await addLog({
        name: `New prototype '${prototypeName}' under model '${model.name}'`,
        description: `Prototype '${prototypeName}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
        type: 'new-prototype',
        create_by: currentUser?.id!,
        ref_id: response.id,
        ref_type: 'prototype',
        parent_id: model.id,
      })

      toast({
        title: ``,
        description: (
          <p className="flex items-center text-sm">
            <TbCircleCheckFilled className="mr-2 h-4 w-4 text-green-500" />
            Prototype "{prototypeName}" imported successfully
          </p>
        ),
        duration: 3000,
      })

      await navigate(`/model/${model.id}/library/prototype/${response.id}`)

      setIsOpenImportDialog(false)
      setSelectedFile(null)
      setExtractedPrototype(null)
      setPrototypeName('')

      await invalidatePrototypeListQueries(queryClient)
    } catch (error: any) {
      if (error.response?.data?.message) {
        setImportError(error.response.data.message)
      } else {
        setImportError('Failed to import prototype')
      }
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpenImportDialog(open)
    if (!open) {
      setSelectedFile(null)
      setExtractedPrototype(null)
      setPrototypeName('')
      setImportError(null)
    }
  }

  return (
    <>
      <DaImportFile
        accept=".zip"
        disabled={isParsingImport || isImporting}
        onFileChange={(file) => void handleImportFileSelected(file)}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex"
          disabled={isParsingImport || isImporting}
        >
          {isParsingImport ? (
            <Spinner className="w-5 h-5" />
          ) : (
            <TbFileImport className="w-5 h-5" />
          )}
          Import Prototype
        </Button>
      </DaImportFile>

      <CustomDialog
        open={isOpenImportDialog}
        onOpenChange={handleDialogOpenChange}
        dialogTitle="Import Prototype"
        description="Confirm the prototype name before importing."
        className="h-fit xl:h-fit overflow-hidden"
      >
        <div className="flex flex-col space-y-4">
          {selectedFile && (
            <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
          )}
          {extractedPrototype && (
            <div className="flex flex-col">
              <Input
                value={prototypeName}
                onChange={(e) => {
                  setPrototypeName(e.target.value)
                  setImportError(null)
                }}
                placeholder={
                  extractedPrototype ? extractedPrototype.name : 'Prototype Name'
                }
                className="w-full"
              />
              {(isDuplicatePrototypeName || isDuplicateImportError) && (
                <DaDuplicateNameHint
                  message={
                    isDuplicatePrototypeName
                      ? `The prototype name '${prototypeName}' is already in use for model '${model?.name}'`
                      : importError || 'This prototype name is already in use'
                  }
                  suggestedName={
                    suggestedPrototypeName ?? apiSuggestedPrototypeName
                  }
                  onApplySuggestion={(name) => {
                    setPrototypeName(name)
                    setImportError(null)
                  }}
                  className="mt-2"
                />
              )}
            </div>
          )}
          {importError && !isDuplicatePrototypeName && !isDuplicateImportError && (
            <div className="text-red-500 text-sm">{importError}</div>
          )}
          <Button
            variant="default"
            size="sm"
            disabled={
              !selectedFile ||
              !prototypeName.trim() ||
              isImporting ||
              !extractedPrototype ||
              isDuplicatePrototypeName
            }
            onClick={handleConfirmImport}
          >
            {isImporting ? (
              <div className="flex items-center">
                <Spinner className="mr-2 size-4" />
                Importing...
              </div>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </CustomDialog>
    </>
  )
}

export default FormImportPrototype
