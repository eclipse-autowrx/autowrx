// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { WorkspaceStatus } from '@/services/coder.service'

interface CoderWorkspaceStatusProps {
  status: WorkspaceStatus
  error?: string | null
}

const CoderWorkspaceStatus: FC<CoderWorkspaceStatusProps> = ({ status, error }) => {
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
    starting: 'Starting workspace...',
    running: 'Workspace is ready',
    stopping: 'Stopping workspace...',
    stopped: 'Workspace is stopped',
    failed: 'Workspace failed to start',
    canceling: 'Canceling workspace...',
    canceled: 'Workspace creation canceled',
    unknown: 'Checking workspace status...',
    not_created: 'Creating workspace...',
  }

  const statusMessage = statusMessages[status.status || 'unknown'] || 'Checking workspace status...'

  const isReady = status.status === 'running'
  const isError = status.status === 'failed' || status.status === 'canceled'
  const isInProgress = status.status === 'pending' || status.status === 'starting' || status.status === 'not_created'

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      {!isReady && !isError && <Spinner className="w-8 h-8" />}
      {isError && (
        <div className="text-red-500 text-4xl mb-2">⚠️</div>
      )}
      <p className={`text-center text-lg font-medium ${isError ? 'text-red-500' : isReady ? 'text-primary' : 'text-muted-foreground'}`}>
        {statusMessage}
      </p>
      {isInProgress && (
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This may take a few minutes. The workspace is being created and configured...
        </p>
      )}
      {status.transition && (
        <p className="text-sm text-muted-foreground">Transition: {status.transition}</p>
      )}
      {isError && status.status === 'failed' && (
        <p className="text-sm text-muted-foreground text-center max-w-md">
          The workspace failed to start. Please try refreshing the page or contact support if the issue persists.
        </p>
      )}
    </div>
  )
}

export default CoderWorkspaceStatus
