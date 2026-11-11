// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const FALLBACK = 'Check that the file contains valid VSS JSON and try again.'

/**
 * 'import': the user is uploading a VSS file.
 * 'build': the VSS is about to be sent to a runtime/kit to build the vehicle model.
 */
export type VssErrorContext = 'import' | 'build'

/**
 * Turn the backend's "Invalid VSS at <path>: <reason>." message into a short,
 * actionable sentence. Unknown messages are passed through (first line only).
 */
export const describeVssError = (
  serverMessage: unknown,
  context: VssErrorContext = 'import',
): string => {
  const summary =
    typeof serverMessage === 'string' ? serverMessage.split('\n')[0].trim() : ''
  const match = summary.match(/^Invalid VSS at (.+?): (.+?)\.?$/)
  if (!match) return summary || FALLBACK
  const [, path, reason] = match
  const build = context === 'build'
  const prefix = build ? 'The vehicle model cannot be built: ' : ''
  const next = build ? 'then try again.' : 'then upload the file again.'
  if (reason === 'branch must contain children') {
    return `${prefix}${path} is an empty branch. Add at least one signal to it, ${next}`
  }
  if (reason === 'signal datatype is required') {
    return `${prefix}${path} has no datatype. Set a datatype for the signal, ${next}`
  }
  return `${prefix}${summary}`
}
