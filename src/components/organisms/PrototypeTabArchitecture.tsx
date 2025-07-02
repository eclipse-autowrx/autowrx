// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import Architecture from './Architecture'

const PrototypeTabArchitecture = () => {
  return (
    <div className="flex flex-col w-full h-full bg-slate-200 p-2">
      <div className="flex flex-col w-full h-full bg-white rounded-lg overflow-hidden">
        <Architecture displayMode="prototype" />
      </div>
    </div>
  )
}

export default PrototypeTabArchitecture
