// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { validateVss } from '@/services/model.service'

const readFileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })

/**
 * Check a VSS JSON file before it is uploaded, so an invalid spec is never stored.
 * Returns null when valid, otherwise a message for the user. Blank-model exports
 * (an empty root branch) are accepted, matching what model create/replace accept.
 */
export const checkVssFile = async (file: File): Promise<string | null> => {
  let text: string
  try {
    text = await readFileText(file)
    JSON.parse(text)
  } catch (error) {
    console.error(error)
    return error instanceof SyntaxError
      ? 'Invalid JSON file'
      : 'Error reading file'
  }
  try {
    await validateVss(text, { allowEmptyRoot: true, context: 'import' })
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'Unable to validate VSS'
  }
}
