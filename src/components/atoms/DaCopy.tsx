import { TbCopy } from 'react-icons/tb'

interface DaCopyProps {
  textToCopy: string
  children: React.ReactNode
}

const DaCopy = ({ textToCopy, children }: DaCopyProps) => {
  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log('Copied to clipboard!')
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
