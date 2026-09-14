// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

type SelectDismissListener = () => void

const listeners = new Set<SelectDismissListener>()

/** Register a Select instance to close when dismissAllOpenSelects() is called. */
export function subscribeSelectDismiss(listener: SelectDismissListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Close all registered open Selects via React state (not DOM click hacks). */
export function dismissAllOpenSelects() {
  listeners.forEach((listener) => listener())
}
