// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Per-deployment hook for kit socket messages.
 *
 * The backend serves /kit-hooks/hook.js (backend/kit-hooks/default.hook.js, a
 * pass-through by default; replace it per deployment). It may set
 * `window.autowrxKitHook = { name, transform(payload, ctx) }`, where transform
 * returns the list of `messageToKit` payloads to send in place of `payload`.
 *
 * A missing, invalid or failing hook never drops a message: the original
 * payload is sent unchanged.
 */

export interface KitHookContext {
  /** Which host code opened the socket (e.g. 'connector', 'plugin-helper') */
  source: string
  prototypeId?: string
  userId?: string
  userName?: string
}

interface KitHook {
  name?: string
  transform: (payload: Record<string, any>, ctx: KitHookContext) => unknown
}

const warned = new Set<string>()
const warnOnce = (key: string, ...args: unknown[]) => {
  if (warned.has(key)) return
  warned.add(key)
  console.warn('[kitMessageHook]', ...args)
}

const getHook = (): KitHook | null => {
  const hook = (window as any).autowrxKitHook
  if (!hook) return null
  if (typeof hook !== 'object' || typeof hook.transform !== 'function') {
    warnOnce(
      'invalid',
      'window.autowrxKitHook has no transform(); sending messages unchanged',
    )
    return null
  }
  return hook
}

/** Messages to send for `payload`: the hook's result, or `[payload]` on any problem. */
export const applyKitHook = (
  payload: Record<string, any>,
  ctx: KitHookContext,
): Record<string, any>[] => {
  const hook = getHook()
  if (!hook) return [payload]
  try {
    const result = hook.transform({ ...payload }, ctx)
    if (
      Array.isArray(result) &&
      result.length > 0 &&
      result.every(
        (m) => m !== null && typeof m === 'object' && !Array.isArray(m),
      )
    ) {
      return result as Record<string, any>[]
    }
    warnOnce(
      `result:${hook.name}`,
      `hook "${hook.name || 'unnamed'}" returned no messages; sending the original`,
    )
  } catch (err) {
    warnOnce(
      `throw:${hook.name}`,
      `hook "${hook.name || 'unnamed'}" failed; sending the original`,
      err,
    )
  }
  return [payload]
}

/**
 * Route the socket's `messageToKit` emits through the hook. Other events pass
 * through untouched. `getCtx` is read at emit time so it sees current values.
 */
export const withKitHook = <
  T extends { emit: (event: string, ...args: any[]) => any },
>(
  socket: T,
  getCtx: () => KitHookContext,
): T => {
  const emit = socket.emit.bind(socket)
  socket.emit = ((event: string, ...args: any[]) => {
    const payload = args[0]
    if (
      event !== 'messageToKit' ||
      args.length !== 1 ||
      !payload ||
      typeof payload !== 'object'
    ) {
      return emit(event, ...args)
    }
    let ret: any
    for (const message of applyKitHook(payload, getCtx()))
      ret = emit(event, message)
    return ret
  }) as T['emit']
  return socket
}
