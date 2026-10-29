// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Builds sandbox-plugin.html as ONE self-contained document (JS + CSS inlined).
 * The host loads it via iframe srcdoc: the opaque-origin iframe sends no
 * cookies, so behind an auth gateway any subresource request it issued would be
 * redirected to login. It must make zero network requests of its own.
 * Runs after the main build (see package.json), so it must not empty outDir.
 */
const inlineSandboxAssets = (): Plugin => ({
  name: 'inline-sandbox-assets',
  enforce: 'post',
  // Last: Vite's own import-analysis (__VITE_PRELOAD__ placeholders) must run first.
  generateBundle: {
    order: 'post',
    handler(_options, bundle) {
      const htmlKey = Object.keys(bundle).find((k) => k.endsWith('.html'))
      const htmlAsset = htmlKey ? bundle[htmlKey] : undefined
      if (!htmlKey || !htmlAsset || htmlAsset.type !== 'asset') {
        throw new Error('inline-sandbox-assets: no HTML asset in bundle')
      }
      let html = String(htmlAsset.source)

      // "</script" in inline code would end the element early ("<\/" is valid
      // wherever it can appear in JS: strings, templates and regex literals).
      const escapeScript = (code: string) =>
        code.replace(/<\/script/gi, '<\\/script')
      const escapeStyle = (css: string) =>
        css.replace(/<\/style/gi, '<\\/style')

      const inlined: string[] = []
      for (const [key, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk') {
          if (!chunk.isEntry) {
            throw new Error(
              `inline-sandbox-assets: unexpected extra chunk ${key} (use inlineDynamicImports)`,
            )
          }
          const tag = new RegExp(
            `<script\\b[^>]*\\bsrc="[^"]*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*></script>\\s*`,
          )
          if (!tag.test(html)) {
            throw new Error(`inline-sandbox-assets: no <script> tag for ${key}`)
          }
          html = html.replace(tag, '')
          if (chunk.code.includes('__VITE_PRELOAD__')) {
            throw new Error(
              'inline-sandbox-assets: unresolved __VITE_PRELOAD__',
            )
          }
          // Re-added at the end of <body> so #root exists when the module runs.
          const script = `<script type="module" nonce="__AUTOWRX_CSP_NONCE__">${escapeScript(chunk.code)}</script>`
          html = html.replace('</body>', () => `${script}\n</body>`)
          inlined.push(key)
        } else if (key.endsWith('.css')) {
          const link = new RegExp(
            `<link\\b[^>]*\\bhref="[^"]*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>\\s*`,
          )
          if (!link.test(html)) {
            throw new Error(`inline-sandbox-assets: no <link> tag for ${key}`)
          }
          html = html.replace(link, '')
          html = html.replace(
            '</head>',
            () =>
              `<style>${escapeStyle(String(chunk.source))}</style>\n</head>`,
          )
          inlined.push(key)
        }
      }

      htmlAsset.source = html
      for (const key of inlined) delete bundle[key]

      // Any leftover file besides the html means something was not inlined.
      // (Rolldown's bundle proxy records deletes without removing the key.)
      const leftovers = Object.keys(bundle).filter(
        (k) => k !== htmlKey && !inlined.includes(k),
      )
      if (leftovers.length) {
        throw new Error(
          `inline-sandbox-assets: not inlined: ${leftovers.join(', ')}`,
        )
      }
    },
  },
})

export default defineConfig({
  plugins: [react(), inlineSandboxAssets()],
  // Don't re-copy public/ into the dir the main build already populated.
  publicDir: false,
  build: {
    outDir: process.env.VITE_BUILD_OUT_DIR
      ? path.resolve(__dirname, process.env.VITE_BUILD_OUT_DIR)
      : path.resolve(__dirname, '../backend/static/frontend-dist'),
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    modulePreload: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'sandbox-plugin.html'),
      output: { codeSplitting: false },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
