// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import path from 'path'
import { createRequire } from 'module'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: !process.env.CI && process.env.NODE_ENV !== 'production',
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    // Output directory - relative to vite.config.ts location (frontend/)
    // For Docker builds, this should be ../backend/static/frontend-dist
    // For local development, you can change this to 'dist' if needed
    outDir: process.env.VITE_BUILD_OUT_DIR ? path.resolve(__dirname, process.env.VITE_BUILD_OUT_DIR) : path.resolve(__dirname, '../backend/static/frontend-dist'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/v2': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        secure: false,
      },
      '/d': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        secure: false,
      },
      '/plugin': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        secure: false,
      },
      '/images': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        secure: false,
      },
      '/builtin-widgets': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        secure: false,
      },
      '/vss': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
