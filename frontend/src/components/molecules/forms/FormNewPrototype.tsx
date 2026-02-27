// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import DaCheckbox from '@/components/atoms/DaCheckbox'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { Label } from '@/components/atoms/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/atoms/select'
import { useToast } from '@/components/molecules/toaster/use-toast'
import default_journey from '@/data/default_journey'
import { SAMPLE_PROJECTS } from '@/data/sampleProjects'
import useListModelLite from '@/hooks/useListModelLite'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { createModelService } from '@/services/model.service'
import { listModelTemplates } from '@/services/modelTemplate.service'
import { createPrototypeService } from '@/services/prototype.service'
import { ModelLite, Prototype } from '@/types/model.type'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { FormEvent, useEffect, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

const DEFAULT_LANGUAGE = SAMPLE_PROJECTS[0]?.language ?? 'python'
const DEFAULT_CODE =
    typeof SAMPLE_PROJECTS[0]?.data === 'string'
        ? SAMPLE_PROJECTS[0].data
        : JSON.stringify(SAMPLE_PROJECTS[0]?.data ?? '')

interface FormNewPrototypeProps {
    onClose?: () => void
    code?: string
    widget_config?: string
    title?: string
    buttonText?: string
    onModelChange?: (modelId: string | null) => void
    onSuccess?: (modelId: string, prototypeId: string, prototypeName: string) => void
}

const FormNewPrototype = ({
    onClose,
    code,
    widget_config,
    title,
    buttonText,
    onModelChange,
    onSuccess,
}: FormNewPrototypeProps) => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { data: currentUser } = useSelfProfileQuery()
    const { data: allModels, isLoading: isFetchingModels } = useListModelLite()

    const [prototypeName, setPrototypeName] = useState('')
    const [selectedModelId, setSelectedModelId] = useState<string>('')
    const [isCreatingNewModel, setIsCreatingNewModel] = useState(false)
    const [newModelName, setNewModelName] = useState('')
    const [newModelApiVersion, setNewModelApiVersion] = useState('v4.1')
    const [newModelApiDataUrl, setNewModelApiDataUrl] = useState<string | undefined>(undefined)
    const [newModelTemplateId, setNewModelTemplateId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [signalExploration, setSignalExploration] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { data: vssVersions } = useListVSSVersions()
    const { data: templatesData } = useQuery({
        queryKey: ['model-templates'],
        queryFn: () => listModelTemplates({ limit: 100, page: 1 }),
        enabled: isCreatingNewModel,
    })

    const { data: fetchedPrototypes } = useListModelPrototypes(
        isCreatingNewModel ? '' : selectedModelId,
    )

    // Set default to last model once models are loaded
    useEffect(() => {
        if (allModels && !isFetchingModels && allModels.results.length > 0) {
            const last = allModels.results[allModels.results.length - 1]
            setSelectedModelId(last.id)
            onModelChange?.(last.id)
        } else if (allModels && !isFetchingModels && allModels.results.length === 0) {
            setIsCreatingNewModel(true)
            setSelectedModelId('new')
            onModelChange?.(null)
        }
    }, [allModels, isFetchingModels])

    // Check for duplicate prototype name
    useEffect(() => {
        if (fetchedPrototypes && selectedModelId && prototypeName) {
            const nameExists = fetchedPrototypes.some(
                (p: Prototype) => p.name.toLowerCase() === prototypeName.toLowerCase(),
            )
            if (nameExists) {
                setError(
                    'A prototype with this name already exists. Please choose a different name.',
                )
            } else if (
                error ===
                'A prototype with this name already exists. Please choose a different name.'
            ) {
                setError('')
            }
        }
    }, [fetchedPrototypes, prototypeName, selectedModelId])

    const disabled =
        loading ||
        uploading ||
        !prototypeName.trim() ||
        (isCreatingNewModel ? !newModelName.trim() : !selectedModelId) ||
        !!error

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            let modelId: string

            if (isCreatingNewModel) {
                if (!newModelName.trim()) throw new Error('Please enter a model name')
                const newModelBody: any = {
                    main_api: 'Vehicle',
                    name: newModelName.trim(),
                    api_version: newModelApiVersion,
                    model_template_id: newModelTemplateId || null,
                }
                if (newModelApiDataUrl) newModelBody.api_data_url = newModelApiDataUrl
                modelId = await createModelService(newModelBody)
            } else {
                if (!selectedModelId) throw new Error('Please select a model')
                modelId = selectedModelId
            }

            const body = {
                model_id: modelId,
                name: prototypeName.trim(),
                language: DEFAULT_LANGUAGE,
                state: 'development',
                apis: { VSC: [], VSS: [] },
                code: code ?? DEFAULT_CODE,
                complexity_level: 3,
                customer_journey: default_journey,
                description: { problem: '', says_who: '', solution: '', status: '' },
                image_file: '/imgs/default_prototype_cover.jpg',
                skeleton: '{}',
                tags: [],
                widget_config: widget_config ?? '[]',
                autorun: true,
                extend: { signal_exploration: signalExploration },
            }

            const response = await createPrototypeService(body)

            await addLog({
                name: `New prototype '${prototypeName}'`,
                description: `Prototype '${prototypeName}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
                type: 'new-prototype',
                create_by: currentUser?.id!,
                ref_id: response.id,
                ref_type: 'prototype',
                parent_id: modelId,
            })

            toast({
                description: `Prototype "${prototypeName}" created successfully`,
                duration: 3000,
            })

            if (onSuccess) {
                onSuccess(modelId, response.id, prototypeName.trim())
            } else {
                if (onClose) onClose()
                await navigate(`/model/${modelId}/library/prototype/${response.id}`)
            }
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.message || 'Something went wrong')
            } else if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Something went wrong')
            }
        } finally {
            setLoading(false)
        }
    }

    const modelList = allModels?.results ?? []

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col overflow-y-auto"
        >
            <DaText variant="title" className="text-da-primary-500">
                {title ?? 'New Prototype'}
            </DaText>

            {/* Model selector */}
            {isFetchingModels ? (
                <div className="mt-4">
                    <DaText variant="regular-medium">Model</DaText>
                    <div className="flex h-10 border px-2 rounded-md shadow-sm mt-2 items-center">
                        <TbLoader className="size-4 animate-spin mr-2" /> Loading models...
                    </div>
                </div>
            ) : (
                <DaSelect
                    value={isCreatingNewModel ? 'new' : selectedModelId}
                    label="Model"
                    wrapperClassName="mt-4"
                    onValueChange={(value) => {
                        if (value === 'new') {
                            setIsCreatingNewModel(true)
                            setSelectedModelId('new')
                            onModelChange?.(null)
                        } else {
                            setIsCreatingNewModel(false)
                            setSelectedModelId(value)
                            onModelChange?.(value)
                        }
                    }}
                >
                    <DaSelectItem value="new">+ Create New Model</DaSelectItem>
                    {modelList.map((model: ModelLite) => (
                        <DaSelectItem key={model.id} value={model.id}>
                            {model.name}
                        </DaSelectItem>
                    ))}
                </DaSelect>
            )}

            {isCreatingNewModel && (
                <div className="mt-4 flex flex-col gap-3 border rounded-lg p-3">
                    {/* Model Name */}
                    <DaInput
                        name="newModelName"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="Model name"
                        label="Model Name *"
                        inputClassName="bg-white"
                    />

                    {/* Signal */}
                    <div>
                        <Label className="text-sm font-medium">Signal *</Label>
                        <div className="border rounded-lg px-2 pb-2 pt-1 mt-1">
                            {!newModelApiDataUrl && (
                                <>
                                    <p className="text-xs text-muted-foreground mb-1">Select VSS version</p>
                                    <Select
                                        value={newModelApiVersion}
                                        onValueChange={setNewModelApiVersion}
                                    >
                                        <SelectTrigger className="w-full h-9">
                                            <SelectValue placeholder="Select VSS version" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vssVersions && Array.isArray(vssVersions) ? (
                                                vssVersions.map((v: any) => (
                                                    <SelectItem key={v.name} value={v.name}>
                                                        COVESA VSS {v.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <>
                                                    <SelectItem value="v5.0">COVESA VSS v5.0</SelectItem>
                                                    <SelectItem value="v4.1">COVESA VSS v4.1</SelectItem>
                                                    <SelectItem value="v4.0">COVESA VSS v4.0</SelectItem>
                                                    <SelectItem value="v3.1">COVESA VSS v3.1</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </>
                            )}
                            <p className="text-xs text-muted-foreground mt-2 mb-1">Or upload a file</p>
                            <DaFileUpload
                                onStartUpload={() => setUploading(true)}
                                onFileUpload={(url) => {
                                    setNewModelApiDataUrl(url)
                                    setUploading(false)
                                }}
                                accept=".json"
                            />
                        </div>
                    </div>

                    {/* Template */}
                    <div>
                        <Label className="text-sm font-medium">Start from Template (Optional)</Label>
                        <div className="mt-1 space-y-1.5 max-h-36 overflow-y-auto">
                            <div
                                onClick={() => setNewModelTemplateId(null)}
                                className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${newModelTemplateId === null
                                    ? 'border-primary bg-primary/5'
                                    : 'border-input hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium">Start from scratch</p>
                                </div>
                                <input
                                    type="radio"
                                    readOnly
                                    checked={newModelTemplateId === null}
                                    className="w-3.5 h-3.5 text-primary"
                                />
                            </div>
                            {templatesData?.results?.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => setNewModelTemplateId(template.id)}
                                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${newModelTemplateId === template.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-input hover:border-primary/50'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded border border-input bg-background flex items-center justify-center shrink-0 overflow-hidden">
                                        <img
                                            src={template.image || '/imgs/plugin.png'}
                                            alt={template.name}
                                            className="w-full h-full object-contain p-0.5"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{template.name}</p>
                                    </div>
                                    <input
                                        type="radio"
                                        readOnly
                                        checked={newModelTemplateId === template.id}
                                        className="w-3.5 h-3.5 text-primary shrink-0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <DaInput
                name="prototypeName"
                value={prototypeName}
                onChange={(e) => {
                    setPrototypeName(e.target.value)
                    setError('')
                }}
                placeholder="Prototype Name"
                label="Prototype Name"
                className="mt-4"
                data-id="prototype-name-input"
            />

            <div className="mt-4 select-none">
                <DaCheckbox
                    checked={signalExploration}
                    onChange={() => setSignalExploration((prev) => !prev)}
                    label="Enable Signal Exploration"
                />
                <DaText variant="small" className="text-gray-500 ml-6 text-sm">
                    Generate custom signals based on your requirements
                </DaText>
            </div>

            {error && (
                <DaText variant="small" className="mt-4 text-red-500">
                    {error}
                </DaText>
            )}

            <Button
                disabled={disabled}
                type="submit"
                className="mt-8 w-full"
            >
                {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
                {buttonText ?? 'Confirm'}
            </Button>


        </form>
    )
}

export default FormNewPrototype
