// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Suspense } from 'react'

type SuspenseProps = {
  children?: React.ReactNode
}

const SuspenseProvider = ({ children }: SuspenseProps) => {
  return <Suspense>{children}</Suspense>
}

export default SuspenseProvider
