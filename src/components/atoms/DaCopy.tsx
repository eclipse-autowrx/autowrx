import { TbCopy } from 'react-icons/tb'
import { useToast } from '../molecules/toaster/use-toast'
import { Suspense, lazy } from 'react'
const DaText = lazy(() => import('./DaText'))

interface DaCopyProps {
  textToCopy: string
  children?: React.ReactNode
  showIcon?: boolean
  label?: string
}

const DaCopy = ({
  textToCopy,
  children,
  showIcon = true,
  label,
}: DaCopyProps) => {
  const { toast } = useToast()

  const handleCopyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation() // Ensure the event does not propagate
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast({
          title: ``,
          description: (
            <div className="flex flex-col space-y-2">
              <DaText variant="regular-bold" className="text-da-primary-500">
                {textToCopy}
              </DaText>
              <DaText variant="regular-medium" className="">
                Copied to clipboard
              </DaText>
            </div>
          ),
          duration: 2000,
        })
      })
      .catch((err) => {
        console.error('Failed to copy!', err)
      })
  }

  return (
    <Suspense>
      <div
        className="flex items-center cursor-pointer"
        onClick={handleCopyClick}
      >
        {children}
        <div className="flex items-center">
          {label && (
            <DaText
              variant="small"
              className="ml-1 text-da-primary-500 cursor-pointer"
            >
              {label}
            </DaText>
          )}
          {showIcon && <TbCopy className="text-da-primary-500 ml-1" />}
        </div>
      </div>
    </Suspense>
  )
}

export { DaCopy }
