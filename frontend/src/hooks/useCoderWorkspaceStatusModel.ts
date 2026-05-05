import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useToast } from '@/components/molecules/toaster/use-toast'

export const STAGE_PROGRESS_MAP: Record<string, number> = {
  'Setting up': 10,
  'Initializing Terraform Directory': 30,
  'Planning Infrastructure': 55,
  'Starting workspace': 80,
  'Cleaning Up': 95,
  'Loading VS Code': 98,
}

export const CHECKPOINTS = [
  'Setting up',
  'Initializing Terraform Directory',
  'Planning Infrastructure',
  'Starting workspace',
  'Cleaning Up',
  'Loading VS Code',
] as const

type CoderWorkspaceStatusModel = {
  allLogLines: Array<{ text: string; isError: boolean }>
  progress: number
  phase: 'failed' | 'ready' | 'starting'
  titleText: string
  activeCheckpointIndex: number
  failureReason: string | null
}

export default function useCoderWorkspaceStatusModel({
  prepareError,
  watchEvents,
  logEvents,
}: {
  prepareError?: string | null
  watchEvents: any[]
  logEvents: any[]
}): { model: CoderWorkspaceStatusModel; logsContainerRef: RefObject<HTMLDivElement> } {
  const { toast } = useToast()
  const lastErrorToastRef = useRef<string | null>(null)
  const logsContainerRef = useRef<HTMLDivElement>(null!)

  const model = useMemo<CoderWorkspaceStatusModel>(() => {
    const watchSocketEvents = watchEvents.filter(
      (event) => event?.type === 'socket' && typeof event?.event === 'string',
    )
    const logsSocketEvents = logEvents.filter(
      (event) => event?.type === 'socket' && typeof event?.event === 'string',
    )

    const watchSocketState = watchSocketEvents.at(-1)?.event ?? 'pending'
    const logsSocketState = logsSocketEvents.at(-1)?.event ?? 'pending'
    const watchCloseEvent = [...watchSocketEvents].reverse().find((event) => event?.event === 'close')
    const logsCloseEvent = [...logsSocketEvents].reverse().find((event) => event?.event === 'close')

    const latestWorkspace = watchEvents
      .filter((event) => event?.type === 'data' && event?.data)
      .at(-1)?.data

    const latestBuild = latestWorkspace?.latest_build
    const jobStatus = latestBuild?.job?.status ?? null
    const buildStatus = latestBuild?.status ?? null

    const agents =
      latestBuild?.resources?.flatMap((resource: any) => resource?.agents ?? []) ?? []

    const latestStage = logEvents.filter((event) => event?.stage && event?.type !== 'socket').at(-1)?.stage ?? null

    const allLogLines = logEvents
      .filter((event) => event?.type !== 'socket')
      .map((event) => {
        const stage = event?.stage ? `[${event.stage}] ` : ''
        const output = typeof event?.output === 'string' ? event.output : ''
        const fallback = output || event?.message || ''
        const text = `${stage}${fallback}`.trim()
        const isError =
          event?.log_level === 'error' ||
          (typeof event?.output === 'string' && event.output.toLowerCase().includes('error'))
        return { text, isError }
      })
      .filter((line) => Boolean(line.text))

    const derivedErrorLines: Array<{ text: string; isError: boolean }> = []

    const hasConnectedAgent = agents.some((agent: any) => agent?.status === 'connected')
    const hasBuildSucceeded = jobStatus === 'succeeded' && (hasConnectedAgent || buildStatus === 'running')
    const hasIframeLoaded = logEvents.some(
      (event) => event?.type === 'ui' && event?.event === 'iframe_loaded',
    )
    const isAgentConnectingAfterBuild = jobStatus === 'succeeded' && !hasConnectedAgent && buildStatus === 'running'
    const isWaitingForIframe = hasBuildSucceeded && !hasIframeLoaded
    const isWorkspaceReady = hasBuildSucceeded && hasIframeLoaded

    const effectiveStage =
      isAgentConnectingAfterBuild || isWaitingForIframe ? 'Loading VS Code' : latestStage

    const hasBuildFailed = jobStatus === 'failed' || jobStatus === 'canceled'

    const hasErrorLog = logEvents.some(
      (event) =>
        event?.type !== 'socket' &&
        (event?.log_level === 'error' ||
          (typeof event?.output === 'string' && event.output.toLowerCase().includes('error'))),
    )

    const hasSocketError =
      watchSocketState === 'error' ||
      logsSocketState === 'error' ||
      (watchCloseEvent && watchCloseEvent.code !== 1000) ||
      (logsCloseEvent && logsCloseEvent.code !== 1000 && logsCloseEvent.reason !== 'upstream closed')

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
    if (effectiveStage && STAGE_PROGRESS_MAP[effectiveStage]) progress = STAGE_PROGRESS_MAP[effectiveStage]
    else if (watchSocketState === 'open' || logsSocketState === 'open') progress = 12
    if (isWorkspaceReady) progress = 100
    if (hasBuildFailed) progress = Math.max(progress, 95)

    const failureReason =
      prepareError ||
      (hasBuildFailed ? `Build job ${jobStatus}` : null) ||
      (hasErrorLog ? 'Error found in build logs' : null) ||
      (hasSocketError ? 'Realtime connection lost while workspace is starting' : null) ||
      (logsSocketState === 'skipped' ? 'Missing workspace build id for logs stream' : null)

    const phase = failureReason ? 'failed' : isWorkspaceReady ? 'ready' : 'starting'
    const titleText = phase === 'ready' ? 'Workspace is ready' : phase === 'failed' ? 'Workspace startup failed' : 'Workspace is starting'

    const activeCheckpointIndex = effectiveStage ? CHECKPOINTS.indexOf(effectiveStage as (typeof CHECKPOINTS)[number]) : -1

    return {
      allLogLines: [...derivedErrorLines, ...allLogLines],
      progress,
      phase,
      titleText,
      activeCheckpointIndex,
      failureReason,
    }
  }, [prepareError, watchEvents, logEvents])

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
    container.scrollTop = container.scrollHeight
  }, [model.allLogLines.length])

  return { model, logsContainerRef }
}

