// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from 'react'
import DaText from './DaText'
import { TbLoader, TbUpload, TbX } from 'react-icons/tb'
import clsx from 'clsx'
import { DaButton } from './DaButton'
import { uploadFileService } from '@/services/upload.service'
import { toast } from 'react-toastify'
import { createPortal } from 'react-dom'

type DaFileUploadProps = {
  onStartUpload?: () => void
  onFileUpload?: (url: string) => void
  label?: string
  accept?: string
  className?: string
  imgClassName?: string
  sizeFormat?: 'KB' | 'MB'
  validate?: (file: File) => Promise<string | null>
  isImage?: boolean
  image?: string // This must go with isImage = true
}

const MIN_HEIGHT = '120px'

const DaFileUpload = ({
  onStartUpload,
  onFileUpload,
  label,
  accept,
  className,
  imgClassName,
  sizeFormat = 'KB',
  validate,
  isImage,
  image,
}: DaFileUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  const [dragging, setDragging] = useState(false)
  const dragAreaRef = useRef<HTMLDivElement>(null)

  const handleUploadClick = () => {
    if (file) return
    ref.current?.click()
  }

  const clearFile = () => {
    setFile(null)
    if (ref.current) {
      ref.current.value = ''
    }
  }

  const processFile = async (file: File) => {
    try {
      onStartUpload?.()
      setUploading(true)
      // Validate file
      const errorMessage = validate ? await validate(file) : null
      if (errorMessage === null) {
        setFile(file)
        const data = await uploadFileService(file)
        onFileUpload?.(data.url)
      } else {
        clearFile()
        toast.error(`Invalid file: ${errorMessage}`)
      }
    } catch (error) {
      clearFile()
      toast.error(`Error uploading file`)
      console.error(`Error uploading file: ${error}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Drag and drop
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      const isFileTransfer = e.dataTransfer?.types?.includes('Files')
      if (isFileTransfer) {
        setDragging(true)
      }
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
    }
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)

      let file = null
      if (e.dataTransfer?.items) {
        file = [...e.dataTransfer.items]
          .find((item) => item.kind === 'file')
          ?.getAsFile()
      } else {
        file = e.dataTransfer?.files?.[0]
      }

      if (file) {
        processFile(file)
      }
    }

    const handleEscapeDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDragging(false)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('drop', handleDrop)
    dragAreaRef.current?.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('keydown', handleEscapeDown)
    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('drop', handleDrop)
      dragAreaRef.current?.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('keydown', handleEscapeDown)
    }
  }, [])

  return (
    <div
      onClick={handleUploadClick}
      className={clsx(
        'relative border border-da-gray-medium rounded-md h-fit overflow-hidden group',
        !file && 'border-dashed hover:border-black cursor-pointer',
        !isImage && 'p-2',
        className,
      )}
      style={{
        minHeight: MIN_HEIGHT,
      }}
    >
      {createPortal(
        <div
          ref={dragAreaRef}
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            'z-[9999] bg-gradient-to-r from-da-gradient-from to-da-gradient-to transition flex fixed top-0 left-0 right-0 bottom-0',
            dragging ? 'opacity-90' : 'opacity-0 pointer-events-none',
          )}
        >
          <DaText
            className="m-auto pointer-events-none text-black tracking-wider"
            variant="huge-bold"
          >
            Drop file anywhere
          </DaText>
        </div>,
        document.body,
      )}

      <input
        onChange={handleFileChange}
        accept={accept}
        ref={ref}
        type="file"
        className="pointer-events-none hidden"
      />
      {uploading ? (
        <div
          style={{
            minHeight: MIN_HEIGHT,
          }}
          className="w-full h-full flex items-center justify-center flex-col"
        >
          <TbLoader className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          {file && (
            <DaButton
              onClick={() => {
                clearFile()
                onFileUpload?.('')
              }}
              className="group-hover:opacity-50 !h-7 !w-7 !p-0 !rounded-full hover:!opacity-100 group-hover:pointer-events-auto pointer-events-none opacity-0 right-1 top-1 absolute"
              size="sm"
              variant="outline-nocolor"
            >
              <TbX className="w-4 h-4" />
            </DaButton>
          )}

          {/* Image Preview */}
          {isImage && (file || image) && (
            <div className="flex h-full" style={{ minHeight: MIN_HEIGHT }}>
              <img
                src={file ? URL.createObjectURL(file) : image}
                alt="preview"
                className={clsx(
                  'text-sm flex h-fit w-fit m-auto',
                  imgClassName,
                )}
              />
            </div>
          )}

          {/* File Information */}
          {!isImage && file && (
            <div
              className="flex items-center justify-center flex-col h-full"
              style={{
                minHeight: MIN_HEIGHT,
              }}
            >
              <DaText
                variant="small-bold"
                className="max-h-[40px] line-clamp-2 text-ellipsis break-all text-center"
              >
                {file.name}
              </DaText>
              <div className="space-x-2">
                <DaText variant="small">
                  {(
                    (file.size || 0) /
                    (sizeFormat === 'MB' ? 1024 * 1024 : 1024)
                  ).toFixed(2) + sizeFormat}
                </DaText>
                <DaText variant="small">{file.type}</DaText>
              </div>
            </div>
          )}

          {!file && !image && (
            <div
              style={{
                minHeight: MIN_HEIGHT,
              }}
              className="w-full h-full flex flex-col gap-1 items-center justify-center"
            >
              <TbUpload className="mb-1" />
              <DaText variant="small-bold">
                {label || 'Drag drop or click here'}
              </DaText>
              {accept && (
                <DaText variant="small">
                  Accept {accept.split(',').join(', ').toLowerCase()}
                </DaText>
              )}
            </div>
          )}

          {!file && image && (
            <div className="absolute top-0 flex left-0 hover:bg-opacity-50 bg-opacity-0 z-[1] w-full h-full bg-black transition">
              <DaText
                variant="small-bold"
                className="text-white m-auto opacity-0 group-hover:opacity-100 transition"
              >
                Change
              </DaText>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DaFileUpload
