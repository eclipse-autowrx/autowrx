// src/molecules/prototype_requirements/DaRequirementExplorer.tsx
// 
// React Flow Node Animation Examples:
// 
// 1. Default appear animation:
// <DaRequirementExplorer onDelete={handleDelete} />
// 
// 2. Bounce animation with custom delay:
// <DaRequirementExplorer 
//   onDelete={handleDelete} 
//   animationType="bounce" 
//   animationDelay={200} 
// />
// 
// 3. Slide-in animation:
// <DaRequirementExplorer 
//   onDelete={handleDelete} 
//   animationType="slide-in" 
// />
// 
// 4. No animation:
// <DaRequirementExplorer 
//   onDelete={handleDelete} 
//   animationType="none" 
// />

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
const MIN_RADIUS = 20 // never go inside this ring
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
  // 1) if it's already a number, use it
  if (typeof raw === 'number' && raw >= 1 && raw <= MAX_RATING) {
    return raw
  }
  // 2) if it's a string that parses to an integer, use it
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

    // 1) ALWAYS build the radar-background node
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
      const angle = req.angle || i * angleStep - Math.PI / 2

      // safely coerce priority/relevance/impact into 1…5
      const raw = req.rating || {}

      const pr = safeScore(raw.priority)
      const rl = safeScore(raw.relevance)
      const im = safeScore(raw.impact)

      // Make avgScore directly proportional to radius:
      // - Small radius (near center) means high avgScore
      // - Large radius (far from center) means low avgScore
      // So, radius = norm * MAX_RADIUS, where norm = 1 - (avgScore / MAX_RATING)
      const avgScore = (pr + rl + im) / 3
      const norm = 1 - (avgScore / MAX_RATING) // norm=0 (center, high score), norm=1 (edge, low score)

      // 1. For position: higher scores are closer to center (smaller radius)
      const baseR = norm * MAX_RADIUS
      const scaledR = baseR * DIST_COEFF
      // The bigger avgScore, the smaller the radius (closer to center)
      // So, radius = effectiveMinRadius + (MAX_RADIUS - effectiveMinRadius) * (1 - avgScore / MAX_RATING)
      // Linear mapping: avgScore = 1 → MAX_RADIUS, avgScore = 5 → MIN_RADIUS
      const radius =
        MIN_RADIUS +
        ((MAX_RADIUS - MIN_RADIUS) * (MAX_RATING - avgScore)) /
          (MAX_RATING - 1)

      // 2. For node size: interpolate between min and max node size based on norm (higher norm = bigger node)
      const MIN_NODE_SIZE = 12
      const MAX_NODE_SIZE = 70
      const nodeSize = MIN_NODE_SIZE + (MAX_NODE_SIZE - MIN_NODE_SIZE) * norm

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
          isHidden: req.isHidden,
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
