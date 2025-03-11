import { DaButton } from '@/components/atoms/DaButton'
import DaMenu from '@/components/atoms/DaMenu'
import DaPopup from '@/components/atoms/DaPopup'
import DaText from '@/components/atoms/DaText'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbBinaryTree,
  TbDots,
  TbEdit,
  TbExternalLink,
  TbEye,
  TbList,
  TbPlus,
  TbTrash,
} from 'react-icons/tb'
import InventoryItemList from './InventoryItemList'
import '@xyflow/react/dist/style.css'
import { InventoryItem } from '@/types/inventory.type'
import { instanceRelations, instances } from './data'
import useCurrentInventoryData from '@/hooks/useCurrentInventoryData'

type InventoryItemRelationshipsProps = {
  data: InventoryItem
}

const InventoryItemRelationships = ({
  data,
}: InventoryItemRelationshipsProps) => {
  const [maximized, setMaximized] = useState(false)
  const [mode, setMode] = useState<'tree' | 'list'>('tree')

  const [showSearchItem, setShowSearchItem] = useState(false)
  const [searchType, setSearchType] = useState<'parent' | 'child'>('parent')

  const handleNodeClick =
    (data: InventoryItem | undefined, x = 0, y = 0) =>
    () => {
      if (data) {
        addNodesAndEdges(data, instances, x, y)
      }
    }

  const initialNodes: Node[] = [
    // {
    //   id: '1', // required
    //   position: { x: 0, y: 0 }, // required
    //   data: { label: 'Hello', onCreateNodeClick: handleCreateNodeClick }, // required
    //   type: 'inventoryNode',
    // },
    // {
    //   id: '2', // required
    //   position: { x: 120, y: 0 }, // required
    //   data: {
    //     label: 'ADAS System',
    //     onCreateNodeClick: handleCreateNodeClick,
    //     highlight: true,
    //   }, // required
    //   type: 'inventoryNode',
    // },
    // {
    //   id: '3', // required
    //   position: { x: 280, y: 0 }, // required
    //   data: { label: 'Second', onCreateNodeClick: handleCreateNodeClick }, // required
    //   type: 'inventoryNode',
    // },
  ]
  const initialEdges: Edge[] = [
    // {
    //   id: 'e1-2', // required,
    //   target: '1', // required
    //   source: '2', // required
    //   markerStart: {
    //     type: MarkerType.Arrow,
    //     color: '#000',
    //   },
    // },
    // {
    //   id: 'e2-3', // required,
    //   target: '2', // required
    //   source: '3', // required
    //   markerStart: {
    //     type: MarkerType.Arrow,
    //     color: '#000',
    //   },
    // },
  ]

  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)

  const lastNodePos = useRef({ x: 0, y: 0 })
  const addedNodes = useRef<string[]>([])

  /**
   * Find related instances based on relations.
   */
  const findRelations = (data: any) => {
    return instanceRelations.filter((ir) => ir.source === data.id)
  }

  /**
   * Create a new node.
   */
  const createNode = (
    data: InventoryItem,
    x: number,
    y: number,
    highlight = false,
  ) => ({
    id: data.id,
    position: { x, y },
    data: {
      inventoryItem: data,
      onNodeClick: handleNodeClick(
        instances.find((i) => i.id == data.id),
        x,
        y,
      ),
      highlight,
    },
    type: 'inventoryNode',
  })

  /**
   * Create a new edge.
   */
  const createEdge = (source: string, target: string, type: string) => ({
    id: `e${source}-${target}`,
    target,
    source,
    markerStart: {
      type: MarkerType.Arrow,
      color: '#000',
    },
    data: {
      type,
    },
  })

  /**
   * Process and add nodes and edges.
   */
  const addNodesAndEdges = (
    data: any,
    instances: any[],
    currentX = 0,
    currentY = 0,
  ) => {
    const resultsNode: Node[] = []
    const resultsEdge: Edge[] = []

    let x = currentX,
      y = currentY

    lastNodePos.current.x = x

    if (!addedNodes.current.includes(data.id)) {
      // Create the main node
      resultsNode.push(createNode(data, x, y))
      addedNodes.current.push(data.id)
    }

    // Find and process related instances
    const relations = findRelations(data)
    const filterResults: { instanceItem: InventoryItem; relation: any }[] =
      instances.reduce((acc, curr) => {
        const relation = relations.find((r) => r.target === curr.id)
        if (relation) {
          acc.push({
            instanceItem: curr,
            relation,
          })
        }
        return acc
      }, [])
    filterResults.forEach(({ instanceItem, relation }, index) => {
      if (addedNodes.current.includes(instanceItem.id)) return

      x =
        lastNodePos.current.x +
        300 * (index - Math.round(filterResults.length / 2) + 1)
      y = lastNodePos.current.y + 100

      resultsNode.push(createNode(instanceItem, x, y, true))
      resultsEdge.push(createEdge(instanceItem.id, data.id, relation.type))

      addedNodes.current.push(instanceItem.id)
    })
    lastNodePos.current = { x: 0, y }

    setNodes((prev) => [
      ...prev,
      ...(resultsNode.filter(
        (node) => !prev.find((n) => n.id === node.id),
      ) as never[]),
    ])
    setEdges((prev) => [
      ...prev,
      ...(resultsEdge.filter(
        (edge) => !prev.find((e) => e.id === edge.id),
      ) as never[]),
    ])
  }

  useEffect(() => {
    addNodesAndEdges(data, instances)

    return () => {
      addedNodes.current = []
      lastNodePos.current = { x: 0, y: 0 }
    }
  }, [data])

  const [menu, setMenu] = useState<{
    id: string
    top: number
    left: number
  } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  )
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => {
        return addEdge(
          {
            ...connection,
            markerStart: {
              type: MarkerType.ArrowClosed,
              color: '#000',
            },
          },
          eds,
        ) as never[]
      }),
    [],
  )

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      inventoryNode: InventoryNode,
    }),
    [],
  )

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>, node: any) => {
      event.preventDefault()

      const PADDING_VERTICAL = 50
      const PADDING_HORIZONTAL = 200

      let { width, height, top, left } =
        ref.current?.getBoundingClientRect() ?? {}
      width = width ? width - PADDING_HORIZONTAL : 0
      height = height ? height - PADDING_VERTICAL : 0
      left = left ?? 0
      top = top ?? 0
      let { clientX, clientY } = event
      clientX -= left
      clientY -= top
      setMenu({
        id: node.id,
        top: clientY < height ? clientY : clientY - PADDING_VERTICAL,
        left: clientX < width ? clientX : clientX - PADDING_HORIZONTAL,
      })
    },
    [],
  )

  return (
    <div
      className={clsx(
        'bg-white -mt-1.5',
        maximized
          ? 'fixed top-0 left-0 bottom-0 right-0 z-10 p-8'
          : 'h-[440px]',
      )}
    >
      <div className="flex items-center">
        <DaText variant="regular-bold" className="text-da-gray-darkest">
          Relationships
        </DaText>

        <div className="flex-1" />
        <div className="border font-medium flex rounded-lg overflow-hidden">
          <button
            onClick={() => setMode('tree')}
            className={clsx(
              'h-8 px-3 flex gap-1.5 items-center',
              mode === 'tree' && 'bg-da-primary-500 text-white',
            )}
          >
            <TbBinaryTree className="h-4 w-4" /> Tree View
          </button>
          {/* <button
            onClick={() => setMode('list')}
            className={clsx(
              'h-8 px-3 flex gap-1.5 items-center',
              mode === 'list' && 'bg-da-primary-500 text-white',
            )}
          >
            <TbList className="h-4 w-4" /> List View
          </button> */}
        </div>
        <DaButton
          size="sm"
          variant="plain"
          className="ml-2"
          onClick={() => setMaximized((prev) => !prev)}
        >
          {maximized ? (
            <TbArrowsMinimize className="h-4 w-4" />
          ) : (
            <TbArrowsMaximize className="w-4 h-4" />
          )}
        </DaButton>
      </div>

      {/* Tree */}
      {mode === 'tree' && (
        <div className="h-[calc(100%-50px)] mt-4">
          <ReactFlow
            ref={ref}
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{
              maxZoom: 1.5,
            }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
          >
            <Background />
            {/* {menu && <ContextMenu onClose={() => setMenu(null)} {...menu} />} */}
          </ReactFlow>
        </div>
      )}

      {/* List */}
      {/* {mode === 'list' && (
        <div className="flex mt-4 gap-5 lg:flex-row flex-col">
          <div className="border flex-1 min-w-0 shadow rounded-lg flex flex-col">
            <div className="border-b h-[54px] flex items-center px-4">
              <DaText className="!text-da-gray-darkest" variant="regular-bold">
                Parents
              </DaText>
              <DaButton
                onClick={() => {
                  setShowSearchItem(true)
                  setSearchType('parent')
                }}
                variant="text"
                className="ml-auto"
                size="sm"
              >
                <TbPlus className="w-4 h-4 mr-1" />
                Add Parent
              </DaButton>
              <DaMenu
                trigger={
                  <DaButton variant="plain" size="sm">
                    <TbDots className="w-4 h-4" />
                  </DaButton>
                }
              >
                <div className="flex flex-col px-0.5 -my-0.5">
                  <DaButton
                    size="sm"
                    variant="plain"
                    className="text-left !justify-start w-[144px]"
                  >
                    <TbEye className="w-4 h-4 mr-2" />
                    View In List
                  </DaButton>
                  <DaButton
                    disabled
                    size="sm"
                    variant="plain"
                    className="text-left !justify-start w-[144px]"
                  >
                    <TbEdit className="w-4 h-4 mr-2" />
                    Edit Multiple
                  </DaButton>
                </div>
              </DaMenu>
            </div>
            <div className="px-4 py-2">
              <DaText variant="small" className="!block py-3">
                This item has no parents.
              </DaText>
            </div>
          </div>
          <div className="border flex-1 min-w-0 shadow rounded-lg flex flex-col">
            <div className="border-b h-[54px] flex items-center px-4">
              <DaText className="!text-da-gray-darkest" variant="regular-bold">
                Children (2)
              </DaText>
              <DaButton
                onClick={() => {
                  setShowSearchItem(true)
                  setSearchType('child')
                }}
                variant="text"
                className="ml-auto"
                size="sm"
              >
                <TbPlus className="w-4 h-4 mr-1" />
                Add Child
              </DaButton>
              <DaMenu
                trigger={
                  <DaButton variant="plain" size="sm">
                    <TbDots className="w-4 h-4" />
                  </DaButton>
                }
              >
                <div className="flex flex-col px-0.5 -my-0.5">
                  <DaButton
                    size="sm"
                    variant="plain"
                    className="text-left !justify-start w-[144px]"
                  >
                    <TbEye className="w-4 h-4 mr-2" />
                    View In List
                  </DaButton>
                  <DaButton
                    size="sm"
                    variant="plain"
                    disabled
                    className="text-left !justify-start w-[144px]"
                  >
                    <TbEdit className="w-4 h-4 mr-2" />
                    Edit Multiple
                  </DaButton>
                </div>
              </DaMenu>
            </div>
            <div className="px-4 py-2">
              <div className="group flex gap-2 -mx-4 px-4 h-[44px] items-center hover:bg-da-gray-light/20">
                <DaText
                  variant="small"
                  className="flex-1 text-da-gray-darkest truncate"
                >
                  hello World.
                </DaText>
                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="outline-nocolor"
                  size="sm"
                >
                  <TbExternalLink className="w-4 h-4 mr-1" /> View
                </DaButton>
                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="outline-nocolor"
                  size="sm"
                >
                  <TbEdit className="w-4 h-4 mr-1" /> Edit
                </DaButton>
              </div>
              <div className="group flex gap-2 -mx-4 px-4 h-[44px] items-center hover:bg-da-gray-light/20">
                <DaText
                  variant="small"
                  className="flex-1 text-da-gray-darkest truncate"
                >
                  hello World.
                </DaText>
                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="outline-nocolor"
                  size="sm"
                >
                  <TbExternalLink className="w-4 h-4 mr-1" /> View
                </DaButton>
                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="outline-nocolor"
                  size="sm"
                >
                  <TbEdit className="w-4 h-4 mr-1" /> Edit
                </DaButton>
              </div>
            </div>
          </div>
        </div>
      )} */}

      <DaPopup
        className="container !p-0"
        state={[showSearchItem, setShowSearchItem]}
        trigger={<></>}
      >
        <div className="container flex flex-col max-h-[90vh]">
          <div className="flex border-b -mx-8 px-8 py-4 justify-between">
            <DaText variant="regular-bold" className="text-da-primary-500">
              Attach {searchType === 'parent' ? 'Parents' : 'Children'}
            </DaText>
          </div>

          <div className="-mx-8 mt-5 overflow-y-auto flex-1">
            <InventoryItemList mode="select" />
          </div>

          <div className="flex gap-2 justify-end border-t -mx-8 px-8 py-4">
            <DaButton
              onClick={() => setShowSearchItem(false)}
              variant="outline-nocolor"
              className="!text-sm"
            >
              Cancel
            </DaButton>
            <DaButton className="!text-sm">Attach</DaButton>
          </div>
        </div>
      </DaPopup>
    </div>
  )
}

type TypeInventoryNode = Node<{
  onNodeClick?: () => void
  inventoryItem: InventoryItem
  highlight?: boolean
}>

const InventoryNode = ({ data, selected }: NodeProps<TypeInventoryNode>) => {
  const { data: inventoryData } = useCurrentInventoryData()

  return (
    <>
      {/* {selected && (
        <DaButton
          onClick={() => data.onCreateNodeClick?.('parent')}
          size="sm"
          variant="outline"
          className="absolute hover:bg-white bg-white/70 !border-da-gray-light right-[calc(100%+12px)] !rounded-full top-1/2 -translate-y-1/2 !text-xs !font-light"
        >
          <TbPlus className="mr-0.5" /> Parent
        </DaButton>
      )} */}
      <Handle type="source" position={Position.Top} className="opacity-0" />
      {selected && (
        <div className="flex gap-1 justify-center w-full absolute bottom-[calc(100%+4px)]">
          <DaButton
            size="sm"
            variant="outline-nocolor"
            className="!p-1 !h-5 !text-xs"
            onClick={() =>
              open(
                `${window.location.origin}/inventory/role/${inventoryData.roleData?.name}/item/${data.inventoryItem.id}`,
              )
            }
          >
            <TbExternalLink className="w-3 h-3" />
          </DaButton>
          <DaButton
            size="sm"
            variant="outline-nocolor"
            className="!p-1 !h-5 !text-xs"
          >
            <TbEdit className="w-3 h-3" />
          </DaButton>
        </div>
      )}
      <div
        onClick={data?.onNodeClick}
        className={clsx(
          'text-sm border flex flex-col shadow-sm rounded-md px-5 py-3',
          selected
            ? 'border-da-gray-darkest'
            : data?.highlight && 'border-da-gray-medium/50',
          !selected && 'hover:border-da-gray-medium/80',
          data?.highlight ? 'bg-da-gray-light text-black' : 'bg-white',
        )}
      >
        <span className="absolute px-1 border-b border-r border-da-gray-dark opacity-70 rounded-br-md top-0 left-0 text-xs">
          {data.inventoryItem.type}
        </span>
        <p className="mt-2">{data.inventoryItem?.data?.name}</p>
      </div>
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
      {/* {selected && (
        <DaButton
          onClick={() => {
            data.onCreateNodeClick?.('child')
          }}
          size="sm"
          variant="outline"
          className="absolute hover:bg-white bg-white/70 !border-da-gray-light left-[calc(100%+12px)] !rounded-full top-1/2 -translate-y-1/2 !text-xs !font-light"
        >
          <TbPlus className="mr-0.5" /> Child
        </DaButton>
      )} */}
    </>
  )
}

type ContextMenuProps = {
  id: string
  top: number
  left: number
  onClose: () => void
}

const ContextMenu = ({
  id,
  top,
  left,
  onClose,
  ...props
}: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { setNodes, setEdges } = useReactFlow()

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
    setEdges((edges) => edges.filter((edge) => edge.source !== id))
  }, [id, setNodes, setEdges])

  const wrapper = (fn: Function) => () => {
    fn()
    onClose()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose()
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div
      ref={ref}
      style={{ top, left }}
      className="absolute text-sm bg-white p-1 border shadow z-10 h-fit rounded-md w-[200px]"
      {...props}
    >
      <DaButton
        onClick={wrapper(deleteNode)}
        variant="plain"
        size="sm"
        className="w-full text-left !justify-start"
      >
        <TbTrash className="h-4 w-4 mr-2" />
        Delete Node
      </DaButton>
    </div>
  )
}

export default InventoryItemRelationships
