// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useRef, useState } from 'react'
import { TbLoader, TbUpload, TbX } from 'react-icons/tb'
import clsx from 'clsx'
import { uploadFileService } from '@/services/upload.service'
import { toast } from 'react-toastify'

type DaFileUploadButtonProps = {
    onStartUpload?: () => void
    onFileUpload?: (url: string) => void
    label?: string
    accept?: string
    className?: string
    validate?: (file: File) => Promise<string | null>
}

const DaFileUploadButton = ({
    onStartUpload,
    onFileUpload,
    label = 'Upload File',
    accept,
    className,
    validate,
}: DaFileUploadButtonProps) => {
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const ref = useRef<HTMLInputElement>(null)

    const clearFile = () => {
        setFile(null)
        if (ref.current) ref.current.value = ''
        onFileUpload?.('')
    }

    const processFile = async (selected: File) => {
        try {
            onStartUpload?.()
            setUploading(true)
            const errorMessage = validate ? await validate(selected) : null
            if (errorMessage === null) {
                setFile(selected)
                const data = await uploadFileService(selected)
                onFileUpload?.(data.url)
            } else {
                toast.error(`Invalid file: ${errorMessage}`)
            }
        } catch (error) {
            toast.error('Error uploading file')
            console.error(`Error uploading file: ${error}`)
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (selected) processFile(selected)
    }

    return (
        <div className={clsx('flex items-center gap-2', className)}>
            <input
                ref={ref}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />

            {file ? (
                <div className="flex items-center gap-1.5 text-sm border rounded-md px-2.5 py-1.5 bg-muted/50 min-w-0">
                    <span className="truncate flex-1 min-w-0 text-xs">{file.name}</span>
                    <button
                        type="button"
                        onClick={clearFile}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <TbX className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    disabled={uploading}
                    className="w-full cursor-pointer flex items-center gap-1.5 text-sm border border-dashed rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <TbLoader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <TbUpload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploading ? 'Uploading…' : label}</span>
                </button>
            )}
        </div>
    )
}

export default DaFileUploadButton
