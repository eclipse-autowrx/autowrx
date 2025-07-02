// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export const retry = <T>(
  fn: () => Promise<T>,
  retries = 3,
  interval = 500,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error) => {
        if (retries <= 0) {
          return reject(error)
        }

        setTimeout(() => {
          retry(fn, retries - 1, interval).then(resolve, reject)
        }, interval)
      })
  })
}
