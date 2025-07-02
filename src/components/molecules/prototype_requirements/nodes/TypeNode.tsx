// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { Node, NodeProps, Handle, Position } from '@xyflow/react'

interface TypeNodeData extends Record<string, unknown> {
  label: string
  color?: string
  ratingAvg?: number
  handlePositions?: string[]
}

type TypeNodeType = Node<TypeNodeData>

const TypeNode = ({ data, isConnectable }: NodeProps<TypeNodeType>) => {
  const baseSize = 10
  const size = baseSize + (data.ratingAvg || 3) * 20

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div
        className="rounded-full flex justify-center items-center p-[10px] text-center text-sm font-bold shadow-md text-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: data.color || '#666',
        }}
      ></div>
      <p
        className="absolute w-[200px] whitespace-nowrap overflow-hidden text-ellipsis text-center mt-2 text-sm font-bold text-da-gray-dark"
        style={{ top: `${size}px` }}
      >
        {data.label}
      </p>
    </div>
  )
}

export default TypeNode
