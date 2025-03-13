import clsx from 'clsx'
import { useState } from 'react'
import { TbChevronDown } from 'react-icons/tb'

// Start: Common/Shared types
export type Node = {
  id: string
  name: string
  children?: Node[]
  color?: string
}
// End: Common/Shared types

// Component Props
type DaTreeBrowserProps = {
  data: Node[]
  selected?: string
  onSelected?: (node: Node) => void
  nodeElementsRef?: React.RefObject<{ [key: string]: HTMLDivElement }>
}

const DaTreeBrowser = ({
  data,
  selected,
  onSelected,
  nodeElementsRef,
}: DaTreeBrowserProps) => {
  return (
    <div className="flex flex-col gap-1">
      {data.map((node) => (
        <TreeNode
          selected={selected}
          onSelected={onSelected}
          key={node.id}
          node={node}
          nodeElementsRef={nodeElementsRef}
        />
      ))}
    </div>
  )
}

type TreeNodeProps = {
  node: Node
  selected?: string
  onSelected?: (node: Node) => void
  nodeElementsRef?: React.RefObject<{ [key: string]: HTMLDivElement }>
}

const TreeNode = ({
  node,
  selected,
  onSelected,
  nodeElementsRef,
}: TreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(true)

  const toggle = () => setIsOpen(!isOpen)
  return (
    <div>
      <div
        ref={(el) => {
          if (nodeElementsRef?.current && el) {
            nodeElementsRef.current[node.id] = el
          }
        }}
        className="text-sm flex"
      >
        <button
          className={clsx(
            'w-5 mr-2',
            node.children &&
              'border hover:bg-da-primary-100 transition rounded-full flex items-center justify-center',
          )}
          disabled={!node.children}
          onClick={toggle}
        >
          {node.children && (
            <span>
              <TbChevronDown className={clsx(isOpen && 'rotate-180')} />
            </span>
          )}
        </button>
        <button
          onClick={() => {
            onSelected?.(node)
          }}
          className={clsx(
            'hover:underline',
            selected === node.id && 'font-bold underline',
          )}
          style={{
            color: node.color,
          }}
        >
          {node.name}
        </button>
      </div>
      {isOpen && node.children && (
        <div className="ml-6 mt-1">
          <DaTreeBrowser
            onSelected={onSelected}
            selected={selected}
            data={node.children || []}
            nodeElementsRef={nodeElementsRef}
          />
        </div>
      )}
    </div>
  )
}

export default DaTreeBrowser
