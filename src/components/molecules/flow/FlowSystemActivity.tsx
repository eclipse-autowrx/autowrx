import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '@radix-ui/react-context-menu'
import { useSystemUI } from '@/hooks/useSystemUI'
import { cn } from '@/lib/utils'

const FlowSystemActivity: React.FC<{ text: string }> = ({ text }) => {
  const { showPrototypeFlowASIL } = useSystemUI()
  const safetyLevels = ['<ASIL-D>', '<ASIL-C>', '<ASIL-B>', '<ASIL-A>', '<QM>']
  const levelColors: Record<string, string> = {
    '<ASIL-D>': 'bg-red-500 border border-red-700',
    '<ASIL-C>': 'bg-orange-500 border border-orange-700',
    '<ASIL-B>': 'bg-yellow-500 border border-yellow-700',
    '<ASIL-A>': 'bg-green-500 border border-green-700',
    '<QM>': 'bg-blue-500 border border-blue-700',
  }

  const matchedLevel = safetyLevels.find((level) => {
    return text.includes(level)
  })

  if (matchedLevel) {
    const renderedText = text.replace(matchedLevel, '').trim()
    const levelShort = matchedLevel.startsWith('<ASIL-')
      ? matchedLevel.replace(/<ASIL-|>/g, '') // Extract "A", "B", etc.
      : matchedLevel.replace(/[<>]/g, '') // Handle "<QM>"

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="p-1 flex items-center justify-center gap-1 min-h-7">
            <span className="">{renderedText}</span>
            {showPrototypeFlowASIL && (
              <span
                className={cn(
                  'flex px-1 items-center justify-center font-bold rounded-md text-white',
                  levelColors[matchedLevel],
                )}
              >
                {levelShort}
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-white p-4">
          {renderedText}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return <div className="p-1 font-medium">{text}</div>
}

export default FlowSystemActivity
