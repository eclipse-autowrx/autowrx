import { AnyNode, Branch, LeafTypes } from '@/types/api.type'
import Tree from 'react-d3-tree'
import { PathFunction } from 'react-d3-tree'
import { useNavigate } from 'react-router-dom'
import { Model } from '@/types/model.type'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { CustomNodeElementProps } from 'react-d3-tree'
import { NavigateFunction } from 'react-router-dom'
import useCurrentModel from '@/hooks/useCurrentModel'
import { useEffect } from 'react'
import { CVI } from '@/data/CVI'

export interface TreeNode {
  name: string
  type: 'branch'
  path: string
  children: TreeNode[]
}

const buildTreeNode = (name: string, path: string, node: Branch): TreeNode => {
  return {
    name,
    type: node.type,
    path,
    children: Object.entries(node.children)
      .filter(([sub_node_name, node]) => node.type === 'branch')
      .map(([sub_node_name, node]) =>
        buildTreeNode(
          sub_node_name,
          path === '' ? name : `${path}.${name}`,
          node as Branch,
        ),
      ),
  }
}

const RenderRectSvgNode = (
  { hierarchyPointNode, nodeDatum, toggleNode }: CustomNodeElementProps,
  navigate: NavigateFunction,
  prototype_id: string,
  model: Model,
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

  const nodeWidth = 8 * node.name.length + 45

  return (
    <g>
      <g
        onClick={() => {
          const cviLink = `/cvi/list/${(node as TreeNode).path}.${node.name}`
          const fullLink =
            prototype_id === ''
              ? `/model/${model.id}${cviLink}/`
              : `/model/${model.id}/library/prototype/${prototype_id}/view${cviLink}/`

          if (['sensor', 'actuator', 'attribute'].includes(node.type)) {
            navigate(fullLink)
          }
          toggleNode()
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
              style={{ fill: collapsed ? 'white' : COLORS[node.type] }}
            />
            <foreignObject width={nodeWidth} height={40} y={-20} x={-50}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                  color: collapsed ? 'rgb(131 148 154)' : 'white',
                }}
              >
                {node.name}
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
            const cviLink =
              node.path === ''
                ? `/cvi/list/${node.name}`
                : `/cvi/list/${node.path}.${node.name}`
            const fullLink =
              prototype_id === ''
                ? `/model/${model.id}${cviLink}/`
                : `/model/${model.id}/library/prototype/${prototype_id}/view${cviLink}/`

            navigate(fullLink)
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

const DaTreeView = () => {
  const navigate = useNavigate()
  const { data: prototype } = useCurrentPrototype()
  const { data: model } = useCurrentModel()

  if (!model) {
    return <div>Model is not available</div>
  }

  const cvi = JSON.parse(CVI) as {
    [key: string]: Branch
  }

  const orgChart = buildTreeNode(model.main_api, '', cvi[model.main_api])

  return (
    <div className="flex h-full w-full">
      <Tree
        data={orgChart}
        renderCustomNodeElement={(...args) =>
          RenderRectSvgNode(...args, navigate, prototype?.id ?? '', model)
        }
        nodeSize={{ x: 500, y: 70 }}
        collapsible={true}
        initialDepth={1}
        translate={{ x: 500, y: 500 }}
        pathClassFunc={getDynamicPathClass}
      />
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
