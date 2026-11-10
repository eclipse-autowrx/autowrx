// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const FALLBACK = 'Check that the file contains valid VSS JSON and try again.'

/**
 * Turn the backend's "Invalid VSS at <path>: <reason>." message into a short,
 * actionable sentence for people importing a VSS file. Unknown messages are
 * passed through (first line only).
 */
export const describeVssError = (serverMessage: unknown): string => {
  const summary =
    typeof serverMessage === 'string' ? serverMessage.split('\n')[0].trim() : ''
  const match = summary.match(/^Invalid VSS at (.+?): (.+?)\.?$/)
  if (!match) return summary || FALLBACK
  const [, path, reason] = match
  if (reason === 'branch must contain children') {
    return `${path} is an empty branch. Add at least one signal, then upload the file again.`
  }
  if (reason === 'signal datatype is required') {
    return `${path} has no datatype. Set a datatype for the signal, then upload the file again.`
  }
  return summary
}
