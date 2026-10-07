// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Copy the classic monaco build from node_modules into public/, so the editor
// loads it from the app's own origin instead of a CDN (@monaco-editor/loader
// defaults to jsdelivr, which is unreachable on offline/firewalled hosts).
// Runs on postinstall; safe to re-run.

import { cpSync, existsSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const src = join(root, 'node_modules', 'monaco-editor', 'min', 'vs')
const dest = join(root, 'public', 'monaco', 'vs')

if (!existsSync(src)) {
  console.warn('[vendor-monaco] monaco-editor is not installed; skipping')
  process.exit(0)
}

rmSync(dest, { recursive: true, force: true })
cpSync(src, dest, { recursive: true })
console.log('[vendor-monaco] copied monaco-editor/min/vs -> public/monaco/vs')
