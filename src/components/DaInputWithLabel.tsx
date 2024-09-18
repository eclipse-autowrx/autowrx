import DaText from './atoms/DaText'
import { DaInput } from './atoms/DaInput'
import { DaTextarea } from './atoms/DaTextarea'
import { cn } from '@/lib/utils'

interface DaInputWithLabel {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  isTextarea?: boolean
}

const DaInputWithLabel = ({
  label,
  value,
  onChange,
  className,
  isTextarea = false,
}: DaInputWithLabel) => (
  <div className={cn('flex w-full items-center mb-4', className)}>
    <DaText className="flex min-w-[150px]" variant="small-bold">
      {label}
    </DaText>
    {isTextarea ? (
      <DaTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full"
        textareaClassName="!text-sm"
      />
    ) : (
      <DaInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full"
        inputClassName="text-sm"
      />
    )}
  </div>
)

export default DaInputWithLabel
