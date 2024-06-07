import { TbCopy } from 'react-icons/tb'
import { useToast } from '../molecules/toaster/use-toast'
import { DaText } from './DaText'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

interface DaCopyProps {
  textToCopy: string
  children: React.ReactNode
}

const DaCopy = ({ textToCopy, children }: DaCopyProps) => {
  const { toast } = useToast()
  const { refetch } = useSelfProfileQuery()

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
      <TbCopy className="text-da-primary-500 ml-2" />
    </div>
  )
}

export { DaCopy }
