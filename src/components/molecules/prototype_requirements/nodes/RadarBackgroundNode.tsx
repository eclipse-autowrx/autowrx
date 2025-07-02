// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'
import React from 'react'
import { useRequirementStore } from '../hook/useRequirementStore'

type RadarBackgroundNodeProps = {
  data: {
    size: number // radar radius in px
    spokes: number // number of radial lines
    rings?: number // total number of concentric rings (default 5)
  }
}

const SLATE = '#f3f4f6'
const WHITE = '#ffffff'
const SWEEP_COLOR = 'rgba(0, 80, 114, 0.2)'
// (Tailwind “green-500” at 30% alpha)

const RadarBackgroundNode: React.FC<RadarBackgroundNodeProps> = ({
  data: { size, spokes, rings = 5 },
}) => {
  // helper to decide fill colour for ring i (1 = innermost, rings = outermost)
  const fillColor = (i: number) => (i % 2 === 1 ? SLATE : WHITE)
  const { isScanning } = useRequirementStore()

  // build the sweep-wedge path once
  const beamAngleDeg = 20 // angular width of the wedge
  const beamAngleRad = (beamAngleDeg * Math.PI) / 180
  const r = size
  // angles centered on 12 o'clock, ± beamAngleRad/2
  // ‑90° = straight up, so:
  const startAngle = -Math.PI / 2 - beamAngleRad / 2
  const endAngle = -Math.PI / 2 + beamAngleRad / 2

  const x1 = size + Math.cos(startAngle) * r
  const y1 = size + Math.sin(startAngle) * r
  const x2 = size + Math.cos(endAngle) * r
  const y2 = size + Math.sin(endAngle) * r

  const sweepPath = `
    M ${size},${size}
    L ${x1},${y1}
    A ${r},${r} 0 0,1 ${x2},${y2}
    Z
  `

  return (
    <svg
      width={2 * size}
      height={2 * size}
      style={{
        pointerEvents: 'none',
      }}
      className={cn(isScanning ? 'animate-pulse' : '')}
    >
      {/* 1) Filled bands (out → in) */}
      {Array.from({ length: rings }).map((_, idx) => {
        const ringIndex = rings - idx // e.g. 5,4,3,2,1
        const radius = (ringIndex / rings) * size
        return (
          <circle
            key={`fill-${ringIndex}`}
            cx={size}
            cy={size}
            r={radius}
            fill={fillColor(ringIndex)}
          />
        )
      })}

      {/* 2) Stroke outlines of each ring */}
      {Array.from({ length: rings }).map((_, idx) => {
        const radius = ((idx + 1) / rings) * size
        return (
          <circle
            key={`ring-${idx}`}
            cx={size}
            cy={size}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1.5}
          />
        )
      })}

      {/* 3) Spokes */}
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (2 * Math.PI * i) / spokes - Math.PI / 2
        const x2 = size + Math.cos(angle) * size
        const y2 = size + Math.sin(angle) * size
        return (
          <line
            key={`spoke-${i}`}
            x1={size}
            y1={size}
            x2={x2}
            y2={y2}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1.5}
          />
        )
      })}

      {/* 4) Scanning sweep (if enabled) */}
      {isScanning && (
        <g transform={`rotate(0 ${size} ${size})`}>
          {/* animate this <g> from 0° → 360° around the center */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${size} ${size}`}
            to={`360 ${size} ${size}`}
            dur="3s"
            repeatCount="indefinite"
          />
          <path d={sweepPath} fill={SWEEP_COLOR} />
        </g>
      )}
    </svg>
  )
}

export default RadarBackgroundNode
