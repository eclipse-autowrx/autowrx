// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Runs the two Playwright shards concurrently: the shared-state shard (1
// worker, serial) and the isolated shard (2 workers). Exit code is non-zero
// when either shard fails. Same environment guarantees as `yarn test`
// (setup-env.mjs runs first via the pretest hook of this script's caller).

import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const here = dirname(fileURLToPath(import.meta.url))
const agentsDir = resolve(here, '..')
const shell = process.platform === 'win32'
const npxCmd = shell ? 'npx.cmd' : 'npx'

const shards = [
  { name: 'shared-state ', config: 'playwright.shared-state.config.ts' },
  { name: 'isolated(1w)', config: 'playwright.isolated.config.ts' },
]

const children = shards.map(({ name, config }) => {
  const child = spawn(npxCmd, ['playwright', 'test', `--config=${config}`], {
    cwd: agentsDir,
    shell,
    env: process.env,
  })
  const tag = `[${name}]`
  let pipe = child.stdout
  pipe.setEncoding?.('utf8')
  let buffer = ''
  pipe.on('data', (chunk) => {
    buffer += chunk
    let idx
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      if (line.trim()) console.log(`${tag} ${line}`)
    }
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`${tag} ${chunk}`)
  })
  return { name, child }
})

const results = await Promise.all(
  children.map(
    ({ name, child }) =>
      new Promise((done) =>
        child.on('exit', (code) => done({ name, code: code ?? 1 })),
      ),
  ),
)

let failed = false
for (const { name, code } of results) {
  console.log(`[runner] ${name} exit=${code}`)
  if (code !== 0) failed = true
}
process.exit(failed ? 1 : 0)
