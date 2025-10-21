// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import clsx from 'clsx'
import { TbLoader } from 'react-icons/tb'

interface DaLoaderProps {
  className?: string
}

const DaLoader = ({ className }: DaLoaderProps) => {
  return (
    <TbLoader
      className={clsx(
        'text-2xl text-primary animate-spin',
        className,
      )}
    />
  )
}

export default DaLoader
