// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { Node, NodeProps, Handle, Position } from '@xyflow/react'

interface CentralNodeData {
  label: string
  [key: string]: unknown // Add index signature
}

type CentralNodeType = Node<CentralNodeData>

const CentralNode = ({ data, isConnectable }: NodeProps<CentralNodeType>) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div className="w-[120px] h-[120px] rounded-full bg-da-primary-100 text-da-primary-500 flex justify-center items-center text-sm font-bold shadow-lg">
        {data.label}
      </div>
    </div>
  )
}

export default CentralNode
