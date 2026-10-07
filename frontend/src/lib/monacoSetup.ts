// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { loader } from '@monaco-editor/react'

// Load Monaco from the app's own origin instead of a CDN. @monaco-editor/loader
// defaults to jsdelivr, which never loads on offline/firewalled hosts — the
// prototype Code tab's editor pane stayed empty forever ("Loading…" in the
// project editor, blank in CodeEditor). public/monaco/vs is populated from
// node_modules by scripts/vendor-monaco.mjs (postinstall).
loader.config({ paths: { vs: '/monaco/vs' } })
