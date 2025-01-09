import { useRef, useState } from 'react'
import DaText from './DaText'
import { TbLoader, TbUpload, TbX } from 'react-icons/tb'
import clsx from 'clsx'
import { DaButton } from './DaButton'
import { uploadFileService } from '@/services/upload.service'
import { toast } from 'react-toastify'

type DaFileUploadProps = {
  onStartUpload?: () => void
  onFileUpload?: (url: string) => void
  accept?: string
  className?: string
  sizeFormat?: 'KB' | 'MB'
}

const DaFileUpload = ({
  onStartUpload,
  onFileUpload,
  accept,
  className,
  sizeFormat = 'KB',
}: DaFileUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    if (file) return
    ref.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      onStartUpload?.()
      setUploading(true)
      const file = e.target.files?.[0]
      if (file) {
        setFile(file)
      }
      const data = await uploadFileService(file)
      onFileUpload?.(data.url)
    } catch (error) {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onClick={handleUploadClick}
      className={clsx(
        'relative border border-da-gray-medium rounded-md p-2 h-[120px] group',
        !file && 'border-dashed hover:border-black cursor-pointer',
        className,
      )}
    >
      <input
        onChange={handleFileChange}
        accept={accept}
        ref={ref}
        type="file"
        className="pointer-events-none hidden"
      />
      {uploading ? (
        <div className="h-full w-full flex items-center justify-center flex-col">
          <TbLoader className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          {file && (
            <DaButton
              onClick={() => {
                setFile(null)
                if (ref.current) {
                  ref.current.value = ''
                }
                onFileUpload?.('')
              }}
              className="group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none opacity-0 right-1 top-1 absolute"
              size="sm"
              variant="plain"
            >
              <TbX className="w-4 h-4" />
            </DaButton>
          )}

          {file ? (
            <div className="flex items-center justify-center h-full flex-col">
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
          ) : (
            <div className="w-full h-full flex flex-col gap-1 items-center justify-center">
              <TbUpload className="mb-1" />
              <DaText variant="small-bold">Click to upload</DaText>
              {accept && (
                <DaText variant="small">
                  Accept {accept.split(',').join(', ').toLowerCase()}
                </DaText>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DaFileUpload
