import { XIcon, CheckIcon } from 'lucide-react'
import { Spinner } from '@/components/atoms/spinner'
import { cn } from '@/lib/utils'
import useCoderWorkspaceStatusModel, {
  CHECKPOINTS,
} from '@/hooks/useCoderWorkspaceStatusModel'

interface CoderWorkspaceStatusProps {
  prepareError?: string | null
  watchEvents: any[]
  logEvents: any[]
  className?: string
}

const CoderWorkspaceStatus = ({
  prepareError,
  watchEvents,
  logEvents,
  className,
}: CoderWorkspaceStatusProps) => {
  const { model, logsContainerRef } = useCoderWorkspaceStatusModel({ prepareError, watchEvents, logEvents })

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col p-3',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground">{model.titleText}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative px-3 pt-1">
          <div className="absolute left-3 right-3 top-4 h-0.5 bg-primary/30" />
          <div className="absolute left-3 right-3 top-4 h-0.5">
            <div
              className={cn(
                'h-full transition-all duration-500',
                model.phase === 'failed' ? 'bg-red-500' : 'bg-primary',
              )}
              style={{ width: `${model.progress}%` }}
            />
          </div>
          <div className="relative h-10 w-full">
          {CHECKPOINTS.map((checkpoint, index) => {
            const isDone =
              model.phase === 'ready' ||
              (model.activeCheckpointIndex >= 0 &&
                index < model.activeCheckpointIndex)
            const isActive =
              model.phase === 'starting' &&
              ((model.activeCheckpointIndex >= 0 &&
                index === model.activeCheckpointIndex) ||
                (model.activeCheckpointIndex < 0 && index === 0))
            const isFuture =
              model.phase === 'starting' &&
              model.activeCheckpointIndex >= 0 &&
              index > model.activeCheckpointIndex

            return (
              <div
                key={checkpoint}
                className={cn(
                  'absolute top-0 flex flex-col items-center gap-1',
                  index === 0
                    ? 'translate-x-0'
                    : index === CHECKPOINTS.length - 1
                      ? '-translate-x-full'
                      : '-translate-x-1/2',
                )}
                style={{
                  left: `${(index / (CHECKPOINTS.length - 1)) * 100}%`,
                }}
              >
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border',
                    model.phase === 'failed' && 'border-red-500 bg-red-50',
                    isDone && model.phase !== 'failed' && 'border-primary bg-primary',
                    isActive && 'border-primary bg-background',
                    isFuture && 'border-primary/40 bg-background',
                  )}
                >
                  {model.phase === 'failed' ? (
                    <XIcon className="h-4 w-4 text-red-500" />
                  ) : isDone ? (
                    <CheckIcon className="h-4 w-4 text-white" />
                  ) : isActive ? (
                    <Spinner size={12} />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                  )}
                </div>
                <div className="whitespace-nowrap text-center text-[10px] leading-3 text-muted-foreground">
                  {checkpoint}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-md border border-border bg-muted/20">
        <div className="border-b border-border px-2 py-1 text-[11px] text-muted-foreground">
          Build logs
        </div>
        <div ref={logsContainerRef} className="min-h-0 flex-1 overflow-y-auto p-2">
          {model.allLogLines.length > 0 ? (
            <div className="space-y-0.5 text-[11px] leading-5">
              {model.allLogLines.map((line, index) => (
                <div
                  key={`${index}-${line.text.slice(0, 24)}`}
                  className={cn(
                    'whitespace-pre-wrap break-words',
                    line.isError ? 'text-red-600' : 'text-foreground',
                  )}
                >
                  {line.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] leading-5 text-foreground">Waiting for logs...</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CoderWorkspaceStatus