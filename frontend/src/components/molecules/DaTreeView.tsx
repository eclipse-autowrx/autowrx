// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { AnyNode } from '@/types/api.type'
import Tree from 'react-d3-tree'
import { PathFunction } from 'react-d3-tree'
import { useNavigate } from 'react-router-dom'
import { Model } from '@/types/model.type'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { CustomNodeElementProps } from 'react-d3-tree'
import { NavigateFunction } from 'react-router-dom'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentModelApi from '@/hooks/useCurrentModelApi'
import { getTypeColor } from '@/utils/typeColors'

export interface TreeNode {
  name: string
  type: string
  path: string
  children: TreeNode[]
}

const buildTreeNode = (name: string, path: string, node: AnyNode): TreeNode => {
  const nodeChildren = 'children' in node ? node.children : undefined
  const children = nodeChildren
    ? Object.entries(nodeChildren)
        // Keep attributes hidden, but include custom element types.
        .filter(
          ([_sub_node_name, node]) =>
            node.type?.toLowerCase().trim() !== 'attribute',
        )
        // Sort: branches first, then sensors/actuators, both alphabetically within their group
        .sort(([nameA, nodeA], [nameB, nodeB]) => {
          const branchA =
            nodeA.type?.toLowerCase().trim() === 'branch' ||
            ('children' in nodeA && !!nodeA.children)
          const branchB =
            nodeB.type?.toLowerCase().trim() === 'branch' ||
            ('children' in nodeB && !!nodeB.children)

          // Branches come first
          if (branchA && !branchB) return -1
          if (!branchA && branchB) return 1

          // Within same type group, sort alphabetically
          return nameA.localeCompare(nameB)
        })
        .map(([sub_node_name, node]) =>
          buildTreeNode(
            sub_node_name,
            path === '' ? name : `${path}.${name}`,
            node,
          ),
        )
    : []

  return {
    name,
    type: node.type?.toLowerCase().trim() || 'branch',
    path,
    children,
  }
}

const RenderRectSvgNode = (
  { nodeDatum, toggleNode }: CustomNodeElementProps,
  navigate: NavigateFunction,
  prototype_id: string,
  model: Model,
  onNodeClick?: () => void,
): JSX.Element => {
  const node = nodeDatum as unknown as TreeNode
  const collapsed = nodeDatum.__rd3t.collapsed

  const COLORS: Record<string, string> = {
    sensor: '#10b981',
    branch: '#7c3aed',
    actuator: '#eab308',
    attribute: '#3b82f6',
    'aiot-blue': '#005072',
    'aiot-green': '#aebd38',
  }

  const nodeColor = COLORS[node.type] || getTypeColor(node.type)

  // Account for the expand indicator on nodes with children.
  const nameWidth = 8 * node.name.length
  const hasChildren = node.children && node.children.length > 0
  const indicatorWidth = hasChildren ? 15 : 0
  const nodeWidth = nameWidth + indicatorWidth + 45

  return (
    <g>
      <g
        onClick={() => {
          if (hasChildren) {
            toggleNode()
          }
        }}
      >
        {
          <>
            <rect
              width={nodeWidth}
              height={40}
              y={-20}
              x={-50}
              rx={10}
              strokeWidth="0"
              style={{
                fill:
                  collapsed && !hasChildren
                    ? nodeColor
                    : collapsed
                      ? 'white'
                      : nodeColor,
              }}
            />
            <foreignObject width={nodeWidth} height={40} y={-20} x={-50}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                  color:
                    collapsed && !hasChildren
                      ? 'white'
                      : collapsed
                        ? 'rgb(131 148 154)'
                        : 'white',
                }}
              >
                {node.name}
                {hasChildren && ' >'}
              </div>
            </foreignObject>
          </>
        }
      </g>
      {(hasChildren || !['sensor', 'actuator'].includes(node.type)) &&
        (!hasChildren || !collapsed) && (
          <circle
            cx={-50}
            cy={20}
            fill={COLORS['aiot-green']}
            r={12}
            strokeWidth={3}
            stroke={'white'}
            onClick={() => {
              // Use correct path with /api/covesa/ prefix
              const apiPath =
                node.path === '' ? node.name : `${node.path}.${node.name}`
              const fullLink =
                prototype_id === ''
                  ? `/model/${model.id}/api/covesa/${apiPath}`
                  : `/model/${model.id}/library/prototype/${prototype_id}/view/api/${apiPath}/`

              navigate(fullLink)
              onNodeClick?.()
            }}
          />
        )}
    </g>
  )
}

const getDynamicPathClass: PathFunction = ({ target }, _orientation) => {
  const targetData: any = target.data

  if (!target.data.__rd3t.collapsed) {
    switch (targetData.type) {
      case 'branch':
        return 'Node branch'

      case 'sensor':
        return 'Node sensor'

      case 'actuator':
        return 'Node actuator'

      case 'attribute':
        return 'Node attribute'

      case 'aggregator':
        switch (targetData.aggregatorType) {
          case 'branch':
            return 'Node branch'

          case 'sensor':
            return 'Node sensor'

          case 'actuator':
            return 'Node actuator'

          case 'attribute':
            return 'Node attribute'

          default:
            return 'Node selected'
        }

      default:
        return 'Node'
    }
  }

  return 'Node'
}

type DaTreeViewProps = {
  onNodeClick?: () => void
}

const DaTreeView = ({ onNodeClick }: DaTreeViewProps) => {
  const navigate = useNavigate()
  const { data: prototype } = useCurrentPrototype()
  const { data: model } = useCurrentModel()
  const { data: cvi } = useCurrentModelApi()

  if (!model) {
    return (
      <div className="text-sm font-medium text-muted-foreground">
        Model is not available
      </div>
    )
  }

  console.log('cvi', cvi)

  const orgChart = cvi
    ? buildTreeNode(model.main_api, '', cvi[model.main_api])
    : null
  if (!orgChart) {
    return (
      <div className="text-sm font-medium text-muted-foreground">
        Tree view is not available
      </div>
    )
  }

  return (
    <div className="flex h-full w-full">
      <Tree
        data={orgChart}
        renderCustomNodeElement={(...args) =>
          RenderRectSvgNode(
            ...args,
            navigate,
            prototype?.id ?? '',
            model,
            onNodeClick,
          )
        }
        nodeSize={{ x: 500, y: 70 }}
        collapsible={true}
        initialDepth={1}
        translate={{ x: 500, y: 500 }}
        pathClassFunc={getDynamicPathClass}
      />
      {/*
        WARNING: These inline styles are known to cause global CSS issues
        when navigating to this component. This is a react-d3-tree limitation
        that requires global CSS selectors. Needs investigation.
      */}
      <style>
        {`
          .Node {
            stroke: #98B0B8 !important;
            stroke-width: 3px;
          }

          .Node.selected {
            stroke: #AEBD38 !important;
          }

          .Node.branch {
            stroke: #7c3aed !important;
          }

          .Node.sensor {
            stroke: #10b981 !important;
          }

          .Node.actuator {
            stroke: #eab308 !important;
          }

          .Node.attribute {
            stroke: #3b82f6 !important;
          }
        `}
      </style>
    </div>
  )
}

export default DaTreeView
