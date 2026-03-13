// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { WorkspaceAgentLog, WorkspaceStatus, WorkspaceTimings } from '@/services/coder.service'

interface CoderWorkspaceStatusProps {
  status: WorkspaceStatus
  error?: string | null
  timings?: WorkspaceTimings | null
  logs?: WorkspaceAgentLog[]
}

const CoderWorkspaceStatus: FC<CoderWorkspaceStatusProps> = ({
  status,
  error,
  timings,
  logs,
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="text-red-500 text-center">
          <p className="font-semibold mb-2">Failed to load workspace</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!status.exists) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <Spinner className="w-8 h-8" />
        <p className="text-muted-foreground">Creating workspace...</p>
      </div>
    )
  }

  const statusMessages: Record<string, string> = {
    pending: 'Preparing workspace...',
    starting: 'Workspace is starting...',
    running: 'Workspace is starting...',
    stopping: 'Stopping workspace...',
    stopped: 'Workspace is stopped',
    failed: 'Workspace failed to start',
    canceling: 'Canceling workspace...',
    canceled: 'Workspace creation canceled',
    unknown: 'Checking workspace status...',
    not_created: 'Creating workspace...',
  }

  const statusMessage =
    statusMessages[status.status || 'unknown'] || 'Checking workspace status...'

  const isReady = status.status === 'running'
  const isError = status.status === 'failed' || status.status === 'canceled'
  const isInProgress =
    status.status === 'pending' ||
    status.status === 'starting' ||
    status.status === 'not_created'

  const scriptTimings = Array.isArray((timings as any)?.agent_script_timings)
    ? ((timings as any).agent_script_timings as { display_name?: string; status?: string }[])
    : []
  const isCodeServerReady = scriptTimings.some(
    (t) => t.display_name === 'code-server' && t.status === 'ok',
  )
  const showTopSpinner = !isError && (!isReady || (isReady && !isCodeServerReady))

  return (
    <div className="flex flex-col h-full gap-6 p-6 max-w-5xl mx-auto">
      <div className="flex flex-col items-center justify-center gap-4">
        {showTopSpinner && <Spinner className="w-8 h-8" />}
        {isError && <div className="text-red-500 text-4xl mb-2">⚠️</div>}
        <p
          className={`text-center text-lg font-medium ${isError ? 'text-red-500' : isReady ? 'text-primary' : 'text-muted-foreground'}`}
        >
          {statusMessage}
        </p>
        {isInProgress && (
          <p className="text-sm text-muted-foreground text-center max-w-md">
            This may take a few minutes. The workspace is being created and
            configured...
          </p>
        )}
        {isError && status.status === 'failed' && (
          <p className="text-sm text-muted-foreground text-center max-w-md">
            The workspace failed to start. Please try refreshing the page or
            contact support if the issue persists.
          </p>
        )}
      </div>

      {timings && (
        <div className="mt-1 text-xs text-muted-foreground max-w-3xl text-left space-y-3 mx-auto w-full">
          {/* Provisioner timings (unique stages only) */}
          {Array.isArray((timings as any).provisioner_timings) &&
            (timings as any).provisioner_timings.length > 0 && (
              <div>
                <p className="font-semibold text-[11px] mb-1">
                  Provisioning stages
                </p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(
                    new Set(
                      (timings as any).provisioner_timings
                        .map((t: { stage?: string }) => t?.stage)
                        .filter(Boolean),
                    ),
                  ).map((stage: any, idx: number) => (
                    <span
                      key={`prov-${idx}-${stage}`}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide"
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Agent script timings - display_name + status */}
          {Array.isArray((timings as any).agent_script_timings) &&
            (timings as any).agent_script_timings.length > 0 && (
              <div>
                <p className="font-semibold text-[11px] mb-1">Agent scripts</p>
                <div className="flex flex-col gap-1">
                  {(timings as any).agent_script_timings.map(
                    (
                      t: {
                        display_name?: string
                        status?: string
                      },
                      idx: number,
                    ) =>
                      t?.display_name && (
                        <div
                          key={`script-${idx}-${t.display_name}`}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1"
                        >
                          <span className="text-[11px] font-medium">
                            {t.display_name}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wide ${
                              t.status === 'ok'
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {t.status || 'pending'}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              </div>
            )}

          {/* Agent connection timings - stage only */}
          {Array.isArray((timings as any).agent_connection_timings) &&
            (timings as any).agent_connection_timings.length > 0 && (
              <div>
                <p className="font-semibold text-[11px] mb-1">
                  Agent connection
                </p>
                <div className="flex flex-wrap gap-1">
                  {(timings as any).agent_connection_timings.map(
                    (t: { stage?: string }, idx: number) =>
                      t?.stage && (
                        <span
                          key={`conn-${idx}-${t.stage}`}
                          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide"
                        >
                          {t.stage}
                        </span>
                      ),
                  )}
                </div>
              </div>
            )}
        </div>
      )}
      {Array.isArray(logs) && logs.length > 0 && (
        <div className="mt-4 w-full max-w-4xl mx-auto flex-1 min-h-0">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Live logs
          </p>
          <div className="h-full max-h-[28rem] rounded-md bg-muted text-xs font-mono text-foreground overflow-y-auto border border-border/40 shadow-sm">
            <pre className="p-3 whitespace-pre-wrap">
              {logs.map((log, idx) => {
                const time = log.created_at
                  ? new Date(log.created_at).toISOString()
                  : ''
                const level = log.level ? log.level.toUpperCase() : ''
                const prefixParts = [time, level].filter(Boolean)
                const prefix = prefixParts.length > 0 ? `[${prefixParts.join(' ')}] ` : ''
                const output = (log.output || '').replace(/\u001b\[[0-9;]*m/g, '')

                return (
                  <div key={`${log.id ?? idx}-${idx}`}>
                    {output
                      .split('\n')
                      .filter((line) => line.trim().length > 0)
                      .map((line, lineIdx) => (
                        <div
                          key={`${log.id ?? idx}-${lineIdx}`}
                          className={
                            line.includes(
                              'Session server listening on /home/coder/.local/share/code-server/code-server-ipc.sock',
                            )
                              ? 'text-emerald-300'
                              : ''
                          }
                        >
                          {prefix}
                          {line}
                        </div>
                      ))}
                  </div>
                )
              })}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoderWorkspaceStatus
