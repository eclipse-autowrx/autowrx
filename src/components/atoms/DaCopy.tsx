import { TbCopy } from 'react-icons/tb'
import { useToast } from '../molecules/toaster/use-toast'
import { DaText } from './DaText'

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

  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast({
          title: ``,
          description: (
            <div className="flex flex-col space-y-2">
              <DaText variant="small-bold" className="text-da-primary-500">
                {textToCopy}
              </DaText>
              <DaText variant="small" className="">
                Copied to clipboard
              </DaText>
            </div>
          ),
          duration: 1500,
        })
      })
      .catch((err) => {
        console.error('Failed to copy!', err)
      })
  }

  return (
    <div className="flex items-center cursor-pointer" onClick={handleCopyClick}>
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
  )
}

export { DaCopy }
