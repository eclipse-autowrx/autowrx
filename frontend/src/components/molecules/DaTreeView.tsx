// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { AnyNode, Branch, LeafTypes } from '@/types/api.type'
import Tree from 'react-d3-tree'
import { PathFunction } from 'react-d3-tree'
import { useNavigate } from 'react-router-dom'
import { Model } from '@/types/model.type'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { CustomNodeElementProps } from 'react-d3-tree'
import { NavigateFunction } from 'react-router-dom'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentModelApi from '@/hooks/useCurrentModelApi'

export interface TreeNode {
  name: string
  type: 'branch' | 'sensor' | 'actuator'
  path: string
  children: TreeNode[]
}

const buildTreeNode = (name: string, path: string, node: Branch): TreeNode => {
  const children = node.children
    ? Object.entries(node.children)
        // Include branches, sensors, and actuators (exclude attributes)
        .filter(([sub_node_name, node]) => ['branch', 'sensor', 'actuator'].includes(node.type))
        // Sort: branches first, then sensors/actuators, both alphabetically within their group
        .sort(([nameA, nodeA], [nameB, nodeB]) => {
          const typeA = nodeA.type || 'branch'
          const typeB = nodeB.type || 'branch'
          
          // Branches come first
          if (typeA === 'branch' && typeB !== 'branch') return -1
          if (typeA !== 'branch' && typeB === 'branch') return 1
          
          // Within same type group, sort alphabetically
          return nameA.localeCompare(nameB)
        })
        .map(([sub_node_name, node]) =>
          buildTreeNode(
            sub_node_name,
            path === '' ? name : `${path}.${name}`,
            node as Branch,
          ),
        )
    : []
  
  return {
    name,
    type: node.type || 'branch',
    path,
    children,
  }
}

const RenderRectSvgNode = (
  { hierarchyPointNode, nodeDatum, toggleNode }: CustomNodeElementProps,
  navigate: NavigateFunction,
  prototype_id: string,
  model: Model,
  onNodeClick?: () => void,
): JSX.Element => {
  const node = nodeDatum as unknown as TreeNode
  const collapsed = nodeDatum.__rd3t.collapsed

  const COLORS: {
    [key in LeafTypes | 'aiot-blue' | 'aiot-green']: string
  } = {
    sensor: '#10b981',
    branch: '#7c3aed',
    actuator: '#eab308',
    attribute: '#3b82f6',
    'aiot-blue': '#005072',
    'aiot-green': '#aebd38',
  }

  // Calculate width accounting for " >" indicator on branches (only if branch has children)
  const nameWidth = 8 * node.name.length
  const hasChildren = node.children && node.children.length > 0
  const indicatorWidth = node.type === 'branch' && hasChildren ? 15 : 0
  const nodeWidth = nameWidth + indicatorWidth + 45
  
  return (
    <g>
      <g
        onClick={() => {
          // Only toggle expand/collapse, don't navigate for sensors/actuators
          // Branches can be clicked to navigate via the green circle button
          if (node.type === 'branch') {
            toggleNode()
          }
          // Sensors and actuators don't navigate - they're leaf nodes
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
              style={{ fill: collapsed && node.type !== 'branch' ? COLORS[node.type] : collapsed ? 'white' : COLORS[node.type] }}
            />
            <foreignObject width={nodeWidth} height={40} y={-20} x={-50}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                  color: collapsed && node.type !== 'branch' ? 'white' : collapsed ? 'rgb(131 148 154)' : 'white',
                }}
              >
                {node.name}
                {node.type === 'branch' && node.children && node.children.length > 0 && ' >'}
              </div>
            </foreignObject>
          </>
        }
      </g>
      {node.type === 'branch' && !collapsed && (
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
              node.path === ''
                ? node.name
                : `${node.path}.${node.name}`
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

const getDynamicPathClass: PathFunction = ({ source, target }, orientation) => {
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
        return 'Node selected'
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
    return <div className="text-sm font-medium text-muted-foreground">Model is not available</div>
  }

  console.log('cvi', cvi)

  const orgChart = cvi
    ? buildTreeNode(model.main_api, '', cvi[model.main_api])
    : null
  if (!orgChart) {
    return <div className="text-sm font-medium text-muted-foreground">Tree view is not available</div>
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
