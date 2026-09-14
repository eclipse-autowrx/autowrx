// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useUrlQueryParam<T extends string>(
  key: string,
  validValues: readonly T[],
  defaultValue: T,
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const value = useMemo(() => {
    const raw = searchParams.get(key)
    return raw && (validValues as readonly string[]).includes(raw)
      ? (raw as T)
      : defaultValue
  }, [searchParams, key, validValues, defaultValue])

  const setValue = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === defaultValue) {
            params.delete(key)
          } else {
            params.set(key, next)
          }
          return params
        },
        { replace: true },
      )
    },
    [key, defaultValue, setSearchParams],
  )

  return [value, setValue]
}
