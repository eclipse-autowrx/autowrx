// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// E2E environment bootstrap for the Playwright suite in this folder.
// Ensures, in order:
//   1. .env files exist (created from *.env.example when missing)
//   2. node_modules + Playwright chromium installed
//   3. backend (API_URL) and frontend (BASE_URL) dev servers running
//   4. admin account reachable (backend self-seeds ADMIN_EMAILS at startup)
//   5. site-config keys the suites depend on: E2E_TEST_ENABLED, PUBLIC_VIEWING
// Steps 3-5 are applied only to local targets unless E2E_ALLOW_ANY_ENV=1
// (same convention as e2e-env-guard.ts). Servers started here are left running.

import { spawn } from 'child_process'
import { appendFileSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import * as dotenvPkg from 'dotenv'

const here = dirname(fileURLToPath(import.meta.url))
const agentsDir = resolve(here, '..')
const repoDir = resolve(agentsDir, '..')
const LOG_DIR = join(agentsDir, '.setup-logs')

const log = (msg) => console.log(`[setup-env] ${msg}`)
const warn = (msg) => console.warn(`[setup-env] WARNING: ${msg}`)

dotenvPkg.config({ path: join(agentsDir, '.env') })

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210'
const API_URL = process.env.API_URL || 'http://localhost:3200'

const isLocal = (url) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(url)
const allowNonLocal = process.env.E2E_ALLOW_ANY_ENV === '1'
const mutateAllowed = isLocal(API_URL) || allowNonLocal

const fetchTimeout = (url, opts = {}, ms = 5000) =>
  fetch(url, { ...opts, signal: AbortSignal.timeout(ms) })

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function reachable(url) {
  try {
    const res = await fetchTimeout(url, { redirect: 'manual' })
    return res.status < 500
  } catch {
    return false
  }
}

async function waitFor(url, label, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await reachable(url)) return true
    await wait(1000)
  }
  warn(`${label} did not become reachable at ${url} within ${timeoutMs / 1000}s`)
  return false
}

const npmCmd = () => (process.platform === 'win32' ? 'npm.cmd' : 'npm')
const shellOpt = { shell: process.platform === 'win32' }

// Start a dev server detached so it outlives this script; output goes to a log.
function startDevServer(cwd, logFile) {
  mkdirSync(LOG_DIR, { recursive: true })
  const child = spawn(npmCmd(), ['run', 'dev'], {
    cwd,
    detached: true,
    stdio: ['ignore', openSync(logFile, 'a'), openSync(logFile, 'a')],
    ...shellOpt,
  })
  child.unref()
  return child.pid
}

function parseEnvFile(path) {
  const out = {}
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function ensureEnvFile(targetPath, examplePath, transform) {
  if (existsSync(targetPath)) return false
  if (!existsSync(examplePath)) {
    warn(`missing ${targetPath} and no example to copy from`)
    return false
  }
  const content = transform ? transform(readFileSync(examplePath, 'utf8')) : readFileSync(examplePath, 'utf8')
  writeFileSync(targetPath, content)
  log(`created ${targetPath} from example — review it if the defaults don't match your machine`)
  return true
}

function copyFallback(targetPath, examplePath) {
  if (existsSync(targetPath)) return false
  if (!existsSync(examplePath)) {
    warn(`missing ${targetPath} and no example to copy from`)
    return false
  }
  copyFileSync(examplePath, targetPath)
  log(`created ${targetPath} from example — review it if the defaults don't match your machine`)
  return true
}

function nodeModulesPresent(dir) {
  return existsSync(join(dir, 'node_modules'))
}

async function ensureDeps(label, dir) {
  if (nodeModulesPresent(dir)) return true
  log(`installing dependencies in ${label}/ ... (first run only)`)
  const child = spawn(npmCmd(), ['install'], { cwd: dir, stdio: 'inherit', ...shellOpt })
  return new Promise((ok) => child.on('exit', (code) => ok(code === 0)))
}

async function chromiumInstalled() {
  const cacheDir = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), '.cache', 'ms-playwright')
  try {
    return readdirSync(cacheDir).some((d) => d.startsWith('chromium'))
  } catch {
    return false
  }
}

async function main() {
  // 1. env files -------------------------------------------------------------
  const backendEnv = parseEnvFile(join(repoDir, 'backend', '.env'))
  ensureEnvFile(join(agentsDir, '.env'), join(agentsDir, '.env.example'), (content) => {
    // align admin creds with the backend's bootstrap values when available
    const email = backendEnv.ADMIN_EMAILS?.split(/[;,]/)[0]?.trim()
    const password = backendEnv.ADMIN_PASSWORD
    return content
      .replace(/^ADMIN_EMAIL=.*/m, `ADMIN_EMAIL=${email || 'your-admin@email.com'}`)
      .replace(/^ADMIN_PASSWORD=.*/m, `ADMIN_PASSWORD=${password || 'your-password'}`)
  })
  copyFallback(join(repoDir, 'backend', '.env'), join(repoDir, 'backend', '.env.example'))
  copyFallback(join(repoDir, 'frontend', '.env'), join(repoDir, 'frontend', '.env.example'))

  const env = parseEnvFile(join(agentsDir, '.env'))
  const email = process.env.ADMIN_EMAIL || env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD
  if (!email || !password) {
    warn('ADMIN_EMAIL/ADMIN_PASSWORD missing in .agents/.env — admin login and config keys will be skipped')
  }

  // 2. dependencies ----------------------------------------------------------
  if (!(await ensureDeps('backend', join(repoDir, 'backend')))) process.exit(1)
  if (!(await ensureDeps('frontend', join(repoDir, 'frontend')))) process.exit(1)
  if (!(await ensureDeps('.agents', agentsDir))) process.exit(1)
  if (!(await chromiumInstalled())) {
    log('installing Playwright chromium ... (first run only)')
    const child = spawn('npx', ['playwright', 'install', 'chromium'], { cwd: agentsDir, stdio: 'inherit', ...shellOpt })
    if (!(await new Promise((r) => child.on('exit', (c) => r(c === 0))))) process.exit(1)
  }

  // 3. servers ---------------------------------------------------------------
  // Probe a real API path: in dev the backend's `/` proxies to the Vite
  // frontend and 504s whenever the frontend is down, which would read as
  // "backend down" even while the API is serving fine.
  const backendHealthUrl = `${API_URL}/v2/site-config/public`
  const backendEnvPath = join(repoDir, 'backend', '.env')
  if (!(await reachable(backendHealthUrl))) {
    if (!existsSync(backendEnvPath)) {
      warn('backend/.env was just created from the example — set MONGODB_URI and ADMIN_EMAILS there, then re-run')
    }
    log(`backend not reachable at ${API_URL} — starting backend dev server (log: .setup-logs/backend.log) ...`)
    startDevServer(join(repoDir, 'backend'), join(LOG_DIR, 'backend.log'))
  }
  if (!(await waitFor(backendHealthUrl, 'backend', 90_000))) {
    warn(`see ${join(LOG_DIR, 'backend.log')} — hints: is MongoDB running? does backend/.env have a valid MONGODB_URI?`)
    process.exit(1)
  }

  if (!(await reachable(BASE_URL))) {
    log(`frontend not reachable at ${BASE_URL} — starting Vite dev server (log: .setup-logs/frontend.log) ...`)
    startDevServer(join(repoDir, 'frontend'), join(LOG_DIR, 'frontend.log'))
  }
  if (!(await waitFor(BASE_URL, 'frontend', 60_000))) {
    warn(`see ${join(LOG_DIR, 'frontend.log')}`)
    process.exit(1)
  }

  // 4. admin account ---------------------------------------------------------
  let token = null
  if (email && password) {
    for (let attempt = 1; attempt <= 3 && !token; attempt++) {
      try {
        const res = await fetchTimeout(`${API_URL}/v2/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (res.ok) {
          const data = await res.json()
          token = data?.tokens?.access?.token || data?.token
        } else if (res.status === 400 || res.status === 401) {
          break // wrong credentials — retrying won't help
        }
      } catch {
        /* transient — retry */
      }
      await wait(2000)
    }
    if (token) {
      log(`admin login OK (${email})`)
    } else {
      warn(`admin login failed for ${email}. The backend creates admins at startup from backend/.env ADMIN_EMAILS/ADMIN_PASSWORD — make sure they match .agents/.env, then restart the backend.`)
    }
  }

  // 5. site-config keys the suites require -----------------------------------
  if (!mutateAllowed) {
    warn(`API_URL ${API_URL} is not local and E2E_ALLOW_ANY_ENV != 1 — skipping site-config changes`)
  } else if (!token) {
    warn('skipping site-config setup (no admin token)')
  } else {
    for (const [key, value] of [
      ['E2E_TEST_ENABLED', true], // env guard aborts the whole run when not true
      ['PUBLIC_VIEWING', true], // guest-flow suites require public browsing
    ]) {
      try {
        const res = await fetchTimeout(`${API_URL}/v2/site-config/key/${key}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ value }),
        })
        log(`${key}=${value} -> ${res.ok ? 'OK' : res.status}`)
      } catch (e) {
        warn(`failed to set ${key}: ${e.message}`)
      }
    }
  }

  log('environment ready')
}

main().catch((e) => {
  warn(e?.stack || e?.message || String(e))
  process.exit(1)
})
