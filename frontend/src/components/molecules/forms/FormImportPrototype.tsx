// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useRef, useState } from 'react'
import { TbCircleCheckFilled, TbFileImport, TbLoader } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Spinner } from '@/components/atoms/spinner'
import DaImportFile from '@/components/atoms/DaImportFile'
import DaDuplicateNameHint from '@/components/atoms/DaDuplicateNameHint'
import DaDialog from '@/components/molecules/DaDialog'
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
  const nameInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!isOpenImportDialog || !extractedPrototype) return
    const frame = requestAnimationFrame(() => {
      nameInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpenImportDialog, extractedPrototype])

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
    if (isImporting && !open) return
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

      <DaDialog
        open={isOpenImportDialog}
        onOpenChange={handleDialogOpenChange}
        dialogTitle="Import Prototype"
        description="Please choose a name for the imported prototype."
        hideHeaderDivider
        preventOutsideClose={isImporting}
        className="w-115 max-w-[calc(100vw-40px)]"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                !selectedFile ||
                !prototypeName.trim() ||
                isImporting ||
                !extractedPrototype ||
                isDuplicatePrototypeName
              }
              onClick={() => void handleConfirmImport()}
            >
              {isImporting ? (
                <TbLoader className="mr-1 text-lg animate-spin" />
              ) : null}
              Import
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          {extractedPrototype ? (
            <>
              <Label>Prototype Name</Label>
              <Input
                ref={nameInputRef}
                value={prototypeName}
                onChange={(e) => {
                  setPrototypeName(e.target.value)
                  setImportError(null)
                }}
                onKeyDown={(e) =>
                  e.key === 'Enter' && void handleConfirmImport()
                }
                placeholder="Prototype Name"
                disabled={isImporting}
                autoFocus
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
                />
              )}
            </>
          ) : null}
          {importError &&
            !isDuplicatePrototypeName &&
            !isDuplicateImportError && (
              <div className="text-sm text-destructive">{importError}</div>
            )}
        </div>
      </DaDialog>
    </>
  )
}

export default FormImportPrototype
