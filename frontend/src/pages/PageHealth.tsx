// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback } from 'react'
import { TbCircleCheck, TbCircleX, TbCircleDashed, TbRefresh, TbLoader } from 'react-icons/tb'
import { DaButton } from '@/components/atoms/DaButton'

type ServiceStatus = 'ok' | 'error' | 'skipped' | 'degraded'

interface ServiceResult {
  status: ServiceStatus
  message: string
}

interface HealthReport {
  status: ServiceStatus
  checkedAt: string
  services: {
    mongodb: ServiceResult
    jwt: ServiceResult
    auth: ServiceResult
    upload: ServiceResult
    runtimeServer: ServiceResult
    sso: ServiceResult
  }
}

const SERVICE_LABELS: Record<string, string> = {
  mongodb: 'MongoDB Database',
  jwt: 'JWT Authentication',
  auth: 'Login / Auth Flow',
  upload: 'Upload Service',
  runtimeServer: 'Runtime Server',
  sso: 'SSO (Microsoft Graph)',
}

const SERVICE_HINTS: Record<string, string> = {
  mongodb: 'Check MONGODB_URL in backend .env',
  jwt: 'Check JWT_SECRET in backend .env',
  auth: 'Check ADMIN_EMAILS and ADMIN_PASSWORD in backend .env',
  upload: 'Check that static/uploads directory exists and is writable',
  runtimeServer: 'Check RUNTIME_SERVER_URL site config or network connectivity',
  sso: 'Check outbound internet connectivity to graph.microsoft.com',
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === 'ok') return <TbCircleCheck className="size-5 text-green-500 shrink-0" />
  if (status === 'error') return <TbCircleX className="size-5 text-red-500 shrink-0" />
  return <TbCircleDashed className="size-5 text-yellow-500 shrink-0" />
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const styles: Record<ServiceStatus, string> = {
    ok: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    skipped: 'bg-yellow-100 text-yellow-700',
    degraded: 'bg-yellow-100 text-yellow-700',
  }
  const labels: Record<ServiceStatus, string> = {
    ok: 'OK',
    error: 'ERROR',
    skipped: 'SKIPPED',
    degraded: 'DEGRADED',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function ServiceCard({ name, result }: { name: string; result: ServiceResult }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${
      result.status === 'ok' ? 'border-green-200 bg-green-50/50' :
      result.status === 'error' ? 'border-red-200 bg-red-50/50' :
      'border-yellow-200 bg-yellow-50/50'
    }`}>
      <StatusIcon status={result.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-foreground">
            {SERVICE_LABELS[name] || name}
          </span>
          <StatusBadge status={result.status} />
        </div>
        <p className="text-sm text-muted-foreground">{result.message}</p>
        {result.status === 'error' && SERVICE_HINTS[name] && (
          <p className="text-xs text-red-600 mt-1">
            💡 Hint: {SERVICE_HINTS[name]}
          </p>
        )}
      </div>
    </div>
  )
}

const PageHealth = () => {
  const [report, setReport] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null)

  const runCheck = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/v2/health')
      const data: HealthReport = await res.json()
      setReport(data)
      setSecondsAgo(0)
    } catch (err) {
      setError('Failed to reach health endpoint. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    runCheck()
  }, [runCheck])

  // Update "X seconds ago" counter
  useEffect(() => {
    if (secondsAgo === null) return
    const timer = setInterval(() => setSecondsAgo(s => (s ?? 0) + 1), 1000)
    return () => clearInterval(timer)
  }, [secondsAgo])

  const overallColor =
    !report ? 'text-muted-foreground' :
    report.status === 'ok' ? 'text-green-600' :
    report.status === 'error' ? 'text-red-600' :
    'text-yellow-600'

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4 py-8 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Checks backend services and external connections
          </p>
        </div>
        <DaButton
          onClick={runCheck}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading
            ? <TbLoader className="size-4 animate-spin" />
            : <TbRefresh className="size-4" />
          }
          {loading ? 'Checking...' : 'Run Check'}
        </DaButton>
      </div>

      {/* Overall status */}
      {report && (
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
          <StatusIcon status={report.status} />
          <div>
            <span className={`font-bold text-lg ${overallColor}`}>
              {report.status === 'ok' ? 'All systems operational' :
               report.status === 'error' ? 'One or more services are down' :
               'System degraded — some services skipped'}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last checked:{' '}
              {secondsAgo !== null && secondsAgo < 5
                ? 'just now'
                : secondsAgo !== null
                ? `${secondsAgo}s ago`
                : new Date(report.checkedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !report && (
        <div className="flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Service cards */}
      {report && (
        <div className="flex flex-col gap-3">
          {Object.entries(report.services).map(([name, result]) => (
            <ServiceCard key={name} name={name} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}

export default PageHealth
