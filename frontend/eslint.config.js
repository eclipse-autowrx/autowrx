// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// ESLint 9 flat config. Ports the former .eslintrc.cjs (eslint:recommended, @typescript-eslint/recommended,
// react-hooks, react, jsx-a11y, prettier) and keeps linting limited to .ts/.tsx like `--ext ts,tsx` did.

import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-plugin-prettier'

const files = ['**/*.{ts,tsx}']

export default [
  { ignores: ['dist', 'dist-e2e', 'eslint.config.js'] },
  { ...js.configs.recommended, files },
  ...tsPlugin.configs['flat/recommended'].map((config) => ({ ...config, files })),
  { ...react.configs.flat.recommended, files },
  // The project uses the automatic JSX runtime ("jsx": "react-jsx"), so React need not be in scope.
  { ...react.configs.flat['jsx-runtime'], files },
  { ...jsxA11y.flatConfigs.recommended, files },
  {
    files,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      // Classic hooks rules (what plugin:react-hooks/recommended enabled before eslint-plugin-react-hooks v6+ added
      // the React Compiler rules to "recommended").
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'prettier/prettier': 'error',
      // Allow intentionally-unused identifiers to be marked with a leading underscore (args, vars, catch bindings,
      // and destructured siblings).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]
