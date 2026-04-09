import { useEffect, useMemo, useRef } from 'react'
import { XIcon, CheckIcon } from 'lucide-react'
import { Spinner } from '@/components/atoms/spinner'
import { WorkspaceInfo } from '@/services/coder.service'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/molecules/toaster/use-toast'

interface CoderWorkspaceStatusProps {
  prepareResponse: WorkspaceInfo | null
  prepareError?: string | null
  watchEvents: any[]
  logEvents: any[]
  className?: string
}

const STAGE_PROGRESS_MAP: Record<string, number> = {
  'Setting up': 10,
  'Initializing Terraform Directory': 30,
  'Planning Infrastructure': 55,
  'Starting workspace': 80,
  'Cleaning Up': 95,
}

const CHECKPOINTS = [
  'Setting up',
  'Initializing Terraform Directory',
  'Planning Infrastructure',
  'Starting workspace',
  'Cleaning Up',
] as const

const CoderWorkspaceStatus = ({
  prepareResponse,
  prepareError,
  watchEvents,
  logEvents,
  className,
}: CoderWorkspaceStatusProps) => {
  const { toast } = useToast()
  const lastErrorToastRef = useRef<string | null>(null)
  const logsContainerRef = useRef<HTMLDivElement | null>(null)

  const model = useMemo(() => {
    const watchSocketEvents = watchEvents.filter(
      (event) => event?.type === 'socket' && typeof event?.event === 'string',
    )
    const logsSocketEvents = logEvents.filter(
      (event) => event?.type === 'socket' && typeof event?.event === 'string',
    )

    const watchSocketState = watchSocketEvents.at(-1)?.event ?? 'pending'
    const logsSocketState = logsSocketEvents.at(-1)?.event ?? 'pending'
    const watchCloseEvent = [...watchSocketEvents]
      .reverse()
      .find((event) => event?.event === 'close')
    const logsCloseEvent = [...logsSocketEvents]
      .reverse()
      .find((event) => event?.event === 'close')

    const latestWorkspace = watchEvents
      .filter((event) => event?.type === 'data' && event?.data)
      .at(-1)?.data

    const latestBuild = latestWorkspace?.latest_build
    const jobStatus = latestBuild?.job?.status ?? null
    const buildStatus = latestBuild?.status ?? null

    const agents =
      latestBuild?.resources?.flatMap((resource: any) => resource?.agents ?? []) ?? []
    const mainAgent = agents[0] ?? null

    const stageEvents = logEvents.filter(
      (event) => event?.stage && event?.type !== 'socket',
    )
    const latestStage = stageEvents.at(-1)?.stage ?? null
    const allLogLines = logEvents
      .filter((event) => event?.type !== 'socket')
      .map((event) => {
        const stage = event?.stage ? `[${event.stage}] ` : ''
        const output = typeof event?.output === 'string' ? event.output : ''
        const fallback = output || event?.message || ''
        const line = `${stage}${fallback}`.trim()
        const isError =
          event?.log_level === 'error' ||
          (typeof event?.output === 'string' && event.output.toLowerCase().includes('error'))
        return { text: line, isError }
      })
      .filter((line) => Boolean(line.text))
    const derivedErrorLines: Array<{ text: string; isError: boolean }> = []

    const hasBuildSucceeded =
      jobStatus === 'succeeded' || (buildStatus === 'running' && mainAgent?.status === 'connected')
    const hasBuildFailed = jobStatus === 'failed' || jobStatus === 'canceled'
    const hasErrorLog = logEvents.some(
      (event) =>
        event?.type !== 'socket' &&
        (event?.log_level === 'error' ||
          (typeof event?.output === 'string' &&
            event.output.toLowerCase().includes('error'))),
    )
    const hasSocketError =
      watchSocketState === 'error' ||
      logsSocketState === 'error' ||
      (watchCloseEvent && watchCloseEvent.code !== 1000) ||
      (logsCloseEvent &&
        logsCloseEvent.code !== 1000 &&
        logsCloseEvent.reason !== 'upstream closed')

    if (prepareError) {
      derivedErrorLines.push({
        text: `[ERROR] Prepare workspace failed: ${prepareError}`,
        isError: true,
      })
    }
    if (hasBuildFailed) {
      derivedErrorLines.push({
        text: `[ERROR] Build job status: ${jobStatus}`,
        isError: true,
      })
    }
    if (watchSocketState === 'error') {
      derivedErrorLines.push({ text: '[ERROR] watch-ws connection error', isError: true })
    }
    if (logsSocketState === 'error') {
      derivedErrorLines.push({ text: '[ERROR] logs-ws connection error', isError: true })
    }
    if (watchCloseEvent && watchCloseEvent.code !== 1000) {
      derivedErrorLines.push({
        text: `[ERROR] watch-ws closed unexpectedly (code=${watchCloseEvent.code}${watchCloseEvent.reason ? `, reason=${watchCloseEvent.reason}` : ''})`,
        isError: true,
      })
    }
    if (
      logsCloseEvent &&
      logsCloseEvent.code !== 1000 &&
      logsCloseEvent.reason !== 'upstream closed'
    ) {
      derivedErrorLines.push({
        text: `[ERROR] logs-ws closed unexpectedly (code=${logsCloseEvent.code}${logsCloseEvent.reason ? `, reason=${logsCloseEvent.reason}` : ''})`,
        isError: true,
      })
    }

    let progress = 5
    if (latestStage && STAGE_PROGRESS_MAP[latestStage]) {
      progress = STAGE_PROGRESS_MAP[latestStage]
    } else if (watchSocketState === 'open' || logsSocketState === 'open') {
      progress = 12
    }
    if (hasBuildSucceeded) progress = 100
    if (hasBuildFailed) progress = Math.max(progress, 95)

    const failureReason =
      prepareError ||
      (hasBuildFailed ? `Build job ${jobStatus}` : null) ||
      (hasErrorLog ? 'Error found in build logs' : null) ||
      (hasSocketError ? 'Realtime connection lost while workspace is starting' : null) ||
      (logsSocketState === 'skipped' ? 'Missing workspace build id for logs stream' : null)

    const phase = failureReason
      ? 'failed'
      : hasBuildSucceeded
        ? 'ready'
        : 'starting'

    const titleText =
      phase === 'ready'
        ? 'Workspace is ready'
        : phase === 'failed'
          ? 'Workspace startup failed'
          : 'Workspace is starting'

    const subtitleText =
      latestStage ??
      (watchSocketState !== 'open' || logsSocketState !== 'open'
        ? 'Connecting realtime channels...'
        : 'Waiting for first build updates...')

    const activeCheckpointIndex = latestStage
      ? CHECKPOINTS.indexOf(latestStage as (typeof CHECKPOINTS)[number])
      : -1

    return {
      watchSocketState,
      logsSocketState,
      jobStatus,
      buildStatus,
      mainAgent,
      allLogLines: [...derivedErrorLines, ...allLogLines],
      progress,
      phase,
      titleText,
      subtitleText,
      activeCheckpointIndex,
      failureReason,
    }
  }, [prepareResponse, prepareError, watchEvents, logEvents])

  useEffect(() => {
    if (!model.failureReason) return
    if (lastErrorToastRef.current === model.failureReason) return

    toast({
      title: 'Workspace startup failed',
      description: model.failureReason,
      variant: 'destructive',
    })
    lastErrorToastRef.current = model.failureReason
  }, [model.failureReason, toast])

  useEffect(() => {
    const container = logsContainerRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [model.allLogLines.length])

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
        <div className="relative px-6 pt-1">
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-primary/30" />
          <div className="absolute left-6 right-6 top-4 h-0.5">
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
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1"
                style={{
                  left: `${(index / (CHECKPOINTS.length - 1)) * 100}%`,
                }}
              >
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border',
                    model.phase === 'failed' && 'border-red-500 bg-red-50',
                    isDone && model.phase !== 'failed' && 'border-primary bg-background',
                    isActive && 'border-primary bg-background',
                    isFuture && 'border-primary/40 bg-background',
                  )}
                >
                  {model.phase === 'failed' ? (
                    <XIcon className="h-4 w-4 text-red-500" />
                  ) : isDone ? (
                    <CheckIcon className="h-4 w-4 text-primary" />
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