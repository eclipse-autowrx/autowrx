// src/molecules/prototype_requirements/DaRequirementExplorer.tsx
import React, { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useNodesState,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import RequirementNode from './nodes/RequirementNode'
import RadarBackgroundNode from './nodes/RadarBackgroundNode'
import { useRequirementStore } from './hook/useRequirementStore'

const nodeTypes = {
  radarBackground: RadarBackgroundNode,
  requirementNode: RequirementNode,
}

const MAX_RADIUS = 600 // maximum radar radius in px
const MIN_RADIUS = 50 // never go inside this ring
const MAX_RATING = 5 // rating scale 1…5
const NODE_SIZE = 60 // diameter in px
const DIST_COEFF = 1.5 // spread factor

interface DaRequirementExplorerProps {
  onDelete: (id: string) => void
  onEdit?: (id: string) => void
}

const Legend: React.FC = () => (
  <div className="border border-gray-200 bg-white p-3 text-da-gray-dark rounded-md shadow-md text-xs">
    <h4 className="font-semibold mb-2">Legend</h4>
    <div className="mb-3  ">
      <div className="flex items-center mb-2">
        <div
          className="w-4 h-4 rounded-full mr-2"
          style={{ backgroundColor: '#005072' }}
        />
        <span>Local Requirements</span>
      </div>
      <div className="flex items-center">
        <div
          className="w-4 h-4 rounded-full mr-2"
          style={{ backgroundColor: '#aebd38' }}
        />
        <span>Global Requirements</span>
      </div>
    </div>
    <div className="space-y-1  ">
      <div>Larger circles = Higher impact</div>
      <div>Closer to center = More relevant</div>
    </div>
  </div>
)

function safeScore(raw: any): number {
  // 1) if it’s already a number, use it
  if (typeof raw === 'number' && raw >= 1 && raw <= MAX_RATING) {
    return raw
  }
  // 2) if it’s a string that parses to an integer, use it
  if (typeof raw === 'string') {
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= MAX_RATING) {
      return parsed
    }
  }
  // 3) fallback: random integer from 1…MAX_RATING
  return Math.floor(Math.random() * MAX_RATING) + 1
}

const DaRequirementExplorer: React.FC<DaRequirementExplorerProps> = ({
  onDelete,
  onEdit,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const { requirements } = useRequirementStore()

  const initialNodes = useMemo(() => {
    const reqs = requirements
    const total = reqs.length

    // 1) ALWAYS build the radar‐background node
    const bgNode = {
      id: 'radar-bg',
      type: 'radarBackground',
      position: { x: -MAX_RADIUS, y: -MAX_RADIUS },
      data: { size: MAX_RADIUS, spokes: 8, rings: 5 },
      style: { pointerEvents: 'none' },
    }

    // 2) if no requirements, return just the background
    if (total === 0) {
      return [bgNode]
    }

    // 3) compute spacing & minimum radius so nodes don't overlap
    const angleStep = (2 * Math.PI) / total
    const safeMinByAngle =
      total > 1 ? NODE_SIZE / (2 * Math.sin(angleStep / 2)) : 0
    const effectiveMinRadius = Math.max(MIN_RADIUS, safeMinByAngle)

    // 4) map each requirement → a positioned node
    const reqNodes = reqs.map((req, i) => {
      // polar angle (start at 12 o'clock)
      const angle = i * angleStep - Math.PI / 2

      // safely coerce priority/relevance/impact into 1…5
      const raw = req.rating || {}
      const pr = safeScore(raw.priority)
      const rl = safeScore(raw.relevance)
      const im = safeScore(raw.impact)

      // average & normalize your 1…5 score → 0…1
      const avgScore = (pr + rl + im) / 3
      const norm = avgScore / MAX_RATING

      // invert: high score = small r, low score = big r
      const baseR = (1 - norm) * MAX_RADIUS
      const scaledR = baseR * DIST_COEFF
      const radius = Math.max(effectiveMinRadius, Math.min(scaledR, MAX_RADIUS))

      // polar → cartesian
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)

      // color by source
      const color =
        (req.source?.type || 'external') === 'internal' ? '#005072' : '#aebd38'

      return {
        id: `req-${req.id || req.title}`,
        type: 'requirementNode',
        position: { x, y },
        data: {
          id: req.id || req.title,
          title: req.title,
          description: req.description,
          type: req.type,
          ratingAvg: avgScore,
          // override with your sanitized scores
          rating: { priority: pr, relevance: rl, impact: im },
          source: req.source,
          creatorUserId: req.creatorUserId,
          color,
          showHandles: false,
          requirement: req,
          onDelete,
          onEdit,
        },
      }
    })

    return [bgNode, ...reqNodes]
  }, [requirements, onDelete, onEdit])

  // push into ReactFlow state
  useEffect(() => {
    setNodes(initialNodes as any)
  }, [initialNodes, setNodes])

  return (
    <div className="flex w-full h-full max-h-[calc(100%-10px)] rounded-xl overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background gap={16} color="#f8f8f8" />
          {/* Optional controls */}
          {/* <Controls /> */}
          {/* Always show legend in bottom-left */}
          <Panel position="bottom-left">
            <Legend />
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

export default DaRequirementExplorer
