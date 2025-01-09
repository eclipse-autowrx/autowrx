import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { ImageAreaEdit, ImageAreaPreview } from '@digital-auto/image-area-lib'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { updateModelService } from '@/services/model.service'
import { updatePrototypeService } from '@/services/prototype.service'
import { DaCopy } from '@/components/atoms/DaCopy'
import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { DaInput } from '../atoms/DaInput'
import DaLoading from '../atoms/DaLoading'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbEdit,
  TbPlus,
  TbLayoutSidebarLeftExpand,
  TbLayoutSidebarLeftCollapse,
} from 'react-icons/tb'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { cn } from '@/lib/utils'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import clsx from 'clsx'

const MASTER_ITEM = 'MASTER_ITEM'

interface ArchitectureProps {
  displayMode: 'model' | 'prototype'
}

const Architecture = ({ displayMode }: ArchitectureProps) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { data: model, refetch: refetchModel } = useCurrentModel()
  const { data: prototype, refetch: refetchPrototype } = useCurrentPrototype()

  const [skeleton, setSkeleton] = useState<any>(null)
  const [activeNodeId, setActiveNodeId] = useState<any>(null)
  const [activeNode, setActiveNode] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [isEditName, setIsEditName] = useState<boolean>(false)
  const [tmpNodeName, setTmpNodeName] = useState<string>('')
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const [pendingSkeletonUpdate, setPendingSkeletonUpdate] = useState<any>(null)

  const [isFullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // 1) State for sidebar expand/collapse
  const [isExpand, setIsExpand] = useState(false)

  // 2) Parse skeleton from model/prototype
  useEffect(() => {
    const inputSkeleton =
      displayMode === 'model' ? model?.skeleton : prototype?.skeleton

    setSkeleton((prevSkeleton: any) => {
      // If we already have a skeleton with nodes, don't recreate it
      if (prevSkeleton?.nodes?.length > 0) return prevSkeleton

      let skele: { nodes: any[] } = { nodes: [] }
      if (inputSkeleton) {
        try {
          const parsed = JSON.parse(inputSkeleton)
          skele = {
            ...parsed,
            nodes: Array.isArray(parsed?.nodes) ? parsed.nodes : [],
          }
        } catch (err) {
          console.error('Failed to parse skeleton:', err)
        }
      }
      return skele
    })
  }, [displayMode, model, prototype])

  // 3) If skeleton is loaded but empty => create a new node
  useEffect(() => {
    const createInitialNode = async () => {
      if (
        skeleton &&
        Array.isArray(skeleton.nodes) &&
        skeleton.nodes.length === 0 &&
        !activeNodeId // Make sure we don't have an active node
      ) {
        await createNewNode()
      }
    }

    createInitialNode()
  }, [skeleton, activeNodeId])

  // 4) Read "id" from URL query params -> activeNodeId
  useEffect(() => {
    let id = searchParams.get('id')
    setActiveNodeId(id || null)
  }, [searchParams])

  // 5) Find activeNode by ID in skeleton
  useEffect(() => {
    setIsEditName(false)
    let nodeToSet = null

    if (skeleton && skeleton.nodes && skeleton.nodes.length > 0) {
      // If there's no ID, pick the first node
      if (!activeNodeId) {
        navigate(`${window.location.pathname}?id=${skeleton.nodes[0].id}`, {
          replace: true,
        })
        return
      }
      nodeToSet = skeleton.nodes.find((n: any) => n.id == activeNodeId)
    }
    setActiveNode(nodeToSet)
  }, [activeNodeId, skeleton, navigate])

  // 6) If activeNode changes, exit Edit Mode
  useEffect(() => {
    if (activeNode) {
      setIsEditMode(false)
    }
  }, [activeNode])

  // 7) Exiting name-edit mode whenever we toggle isEditMode
  useEffect(() => {
    setIsEditName(false)
  }, [isEditMode])

  // 8) Save skeleton to server
  const callSave = async (skele: any) => {
    if (!skele) return

    try {
      if (displayMode === 'model') {
        await updateModelService(model?.id ?? '', {
          skeleton: JSON.stringify(skele),
        })
        await refetchModel()
      } else {
        await updatePrototypeService(prototype?.id ?? '', {
          skeleton: JSON.stringify(skele),
        })
        await refetchPrototype()
      }
    } catch (err) {
      console.error('Failed to save skeleton:', err)
    }
  }

  // 9) Create a brand new node
  const createNewNode = async () => {
    let tmpSkele = JSON.parse(JSON.stringify(skeleton))
    if (!tmpSkele.nodes) tmpSkele.nodes = []
    let nodes = tmpSkele.nodes
    let id = new Date().getTime()
    nodes.push({
      id: id,
      name: 'Node ' + (nodes.length + 1),
      type: 'node',
      parent_id: tmpSkele.nodes.length <= 0 ? MASTER_ITEM : 'NAN',
      content: {
        bgImage: '',
        shapes: [],
      },
      bgImage: 'https://placehold.co/1024x576?text=Empty+Architecture',
    })
    setSkeleton(tmpSkele)
    setActiveNodeId(id)
    await callSave(tmpSkele)
  }

  // 10) Callback from ImageAreaEdit -> Save shapes + bgImage
  const onSaveRequested = async (data: any) => {
    if (!data) return

    let tmpSkele = JSON.parse(JSON.stringify(skeleton))
    if (!tmpSkele.nodes) tmpSkele.nodes = []
    let nodes = tmpSkele.nodes
    let node = nodes.find((n: any) => n.id == activeNodeId)
    if (node) {
      node.shapes = data.shapes
      node.bgImage = data.bgImage
      setSkeleton(tmpSkele)
      await callSave(tmpSkele)
    }
  }

  // 11) Handling hyperlinks from shapes
  const handleNavigate = (url: string) => {
    url.toLowerCase().startsWith('http')
      ? window.open(url, '_blank')
      : navigate(url)
  }

  // 12) Upload background image
  const handleUploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('path', `/${file.name}`)
    formData.append('uploaded_file', file)
    try {
      let data = (await axios.post(
        'https://bewebstudio.digitalauto.tech/project/TxV9WvrPjKrg/upload-file?excludeRoot=false&&force=true',
        formData,
        { headers: { 'Content-Type': 'form-data/multipart' } },
      )) as any
      if (!data || !data.data || !data.data.fileLink) return
      let tmpSkele = JSON.parse(JSON.stringify(skeleton))
      if (!tmpSkele.nodes) tmpSkele.nodes = []
      let nodes = tmpSkele.nodes
      let node = nodes.find((n: any) => n.id == activeNodeId)
      if (node) {
        node.bgImage = data.data.fileLink
        setSkeleton(tmpSkele)
        await callSave(tmpSkele)
      }
    } catch (err) {
      console.error('Failed to upload image:', err)
    }
  }

  // 13) Delete a node
  const handleDeleteNode = async (nodeId: string) => {
    let tmpSkele = JSON.parse(JSON.stringify(skeleton))
    if (!tmpSkele.nodes) tmpSkele.nodes = []
    tmpSkele.nodes = tmpSkele.nodes.filter((n: any) => n.id != nodeId)
    setSkeleton(tmpSkele)
    if (activeNodeId == nodeId) {
      setActiveNodeId(null)
    }
    callSave(tmpSkele)
  }

  // 14) Save name edits
  const handleSave = async (data?: any, newName?: string) => {
    let tmpSkele = JSON.parse(JSON.stringify(skeleton))
    if (!tmpSkele.nodes) tmpSkele.nodes = []
    let nodes = tmpSkele.nodes
    let node = nodes.find((n: any) => n.id == activeNodeId)

    if (node) {
      // Handle shape and background image updates
      if (data) {
        node.shapes = data.shapes
        node.bgImage = data.bgImage
      }

      // Handle name updates
      if (newName && newName.length > 0) {
        node.name = newName
        setIsEditName(false)
      }

      setSkeleton(tmpSkele)
      await callSave(tmpSkele)
    }
  }

  useEffect(() => {
    const calculateResponsiveDimensions = () => {
      if (!containerRef.current) return

      // Header heights configuration
      const HEADER_HEIGHT = 244
      const TOOLBAR_HEIGHT = 60

      // Don't subtract offsets in fullscreen mode
      const totalHeaderOffset = isFullscreen
        ? isEditMode
          ? TOOLBAR_HEIGHT * 2
          : TOOLBAR_HEIGHT // 120px or 60px
        : isEditMode
          ? HEADER_HEIGHT + TOOLBAR_HEIGHT
          : HEADER_HEIGHT // 304px or 244px

      // Available space calculations
      const viewportHeight = window.innerHeight
      const availableVerticalSpace = viewportHeight - totalHeaderOffset
      const availableHorizontalSpace = containerRef.current.offsetWidth

      // Target aspect ratio (16:9)
      const targetAspectRatio = 16 / 9

      // Initial size based on height
      let containerHeight = availableVerticalSpace
      let containerWidth = availableVerticalSpace * targetAspectRatio

      // Adjust if width exceeds available space
      if (containerWidth > availableHorizontalSpace) {
        containerWidth = availableHorizontalSpace
        containerHeight = availableHorizontalSpace / targetAspectRatio
      }

      setDimensions({
        width: containerWidth,
        height: containerHeight,
      })
    }

    calculateResponsiveDimensions()
    window.addEventListener('resize', calculateResponsiveDimensions)

    return () =>
      window.removeEventListener('resize', calculateResponsiveDimensions)
  }, [isEditMode, isFullscreen, activeNode]) // Add isFullScreen to dependencies

  // 15) If still loading
  if (!skeleton)
    return (
      <DaLoading
        text={`Loading ${
          displayMode === 'model' ? 'Model' : 'Prototype'
        } Architecture...`}
        timeoutText={`Failed to load ${
          displayMode === 'model' ? 'model' : 'prototype'
        } architecture. Please try again.`}
      />
    )

  return (
    <div
      className={cn(
        'flex w-full h-full bg-da-white text-da-gray-medium select-none',
        isFullscreen && 'fixed top-0 left-0 right-0 bottom z-30 bg-white',
      )}
    >
      <div
        className={clsx(
          ' flex-col p-3 h-full border-r transition-all duration-300',
          isExpand ? 'flex w-[40%] max-w-[350px]' : 'hidden overflow-hidden',
        )}
      >
        <div className="flex w-full mb-2 items-center justify-between space-x-2">
          <DaText variant="title" className="text-da-primary-500">
            Architecture Mapping
          </DaText>

          {isAuthorized && (
            <DaButton onClick={createNewNode} size="sm" variant="solid">
              <TbPlus className="w-4 h-4 mr-1" /> New Node
            </DaButton>
          )}
        </div>
        {skeleton && skeleton.nodes && skeleton.nodes.length > 0 ? (
          <div className="w-full grow overflow-auto pr-2 space-y-2">
            {skeleton.nodes.map((node: any) => (
              <div
                key={node.id}
                onClick={() =>
                  navigate(`${window.location.pathname}?id=${node.id}`)
                }
                className={cn(
                  'flex flex-col px-3 py-2 border border-da-gray-light hover:border-da-primary-500 cursor-pointer rounded-lg',
                  node.id == activeNodeId && '!border-da-primary-500',
                )}
              >
                <DaText
                  variant="small-bold"
                  className={cn(
                    'text-da-gray-medium',
                    node.id == activeNodeId && 'text-da-primary-500',
                  )}
                >
                  {node.name}
                </DaText>
                <div className="flex w-full justify-between items-center">
                  <DaText variant="small" className="mr-2">
                    ID: {node.id}
                  </DaText>
                  <div className="flex text-xs font-bold space-x-2">
                    {isAuthorized && (
                      <DaConfirmPopup
                        title="Delete Node"
                        label="Are you sure you want to delete this node?"
                        onConfirm={() => handleDeleteNode(node.id)}
                      >
                        <DaButton
                          variant="destructive"
                          size="sm"
                          className="text-destructive cursor-pointer"
                        >
                          Delete
                        </DaButton>
                      </DaConfirmPopup>
                    )}

                    <DaCopy
                      textToCopy={`${window.location.pathname}?id=${node.id}`}
                      showIcon={false}
                    >
                      <DaButton
                        variant="plain"
                        size="sm"
                        className="hover:bg-da-primary-100"
                      >
                        Copy link
                      </DaButton>
                    </DaCopy>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex w-full h-full items-center justify-center">
            <DaText variant="title">No node found.</DaText>
          </div>
        )}
      </div>

      {activeNode && (
        <div
          className={clsx('flex flex-1 flex-col h-full w-full overflow-y-auto')}
        >
          <div className="flex w-full p-3 bg-white items-center justify-between">
            <div className="flex items-center">
              <DaButton
                variant="editor"
                size="sm"
                onClick={() => setIsExpand((prev) => !prev)}
                className="mr-2 w-fit h-[34px] !px-1.5"
              >
                {isExpand ? (
                  <TbLayoutSidebarLeftCollapse className="size-5" />
                ) : (
                  <TbLayoutSidebarLeftExpand className="size-5" />
                )}
              </DaButton>

              {isEditMode ? (
                <DaInput
                  value={tmpNodeName}
                  onChange={(e) => setTmpNodeName(e.target.value)}
                  className="h-8 min-w-[300px]"
                  inputClassName="h-6"
                />
              ) : (
                <DaText variant="title" className="text-da-primary-500">
                  {activeNode.name}
                </DaText>
              )}
            </div>
            <div className="flex">
              {!isEditMode ? (
                <DaButton
                  variant="editor"
                  size="sm"
                  className="!justify-start"
                  onClick={() => {
                    setIsEditMode(true)
                    setTmpNodeName(activeNode.name)
                  }}
                >
                  <TbEdit className="size-4 mr-1" />
                  Edit
                </DaButton>
              ) : (
                <div className="flex items-center space-x-2 mr-2">
                  <DaButton
                    variant="outline-nocolor"
                    size="sm"
                    className="w-16"
                    onClick={() => setIsEditMode(false)}
                  >
                    Cancel
                  </DaButton>
                  <DaButton
                    variant="solid"
                    size="sm"
                    className="w-16"
                    onClick={() => {
                      handleSave(pendingSkeletonUpdate, tmpNodeName)
                    }}
                  >
                    Save
                  </DaButton>
                </div>
              )}
              <DaButton
                onClick={() => setFullscreen((prev) => !prev)}
                size="sm"
                variant="editor"
              >
                {isFullscreen ? (
                  <TbArrowsMinimize className="size-4" />
                ) : (
                  <TbArrowsMaximize className="size-4" />
                )}
              </DaButton>
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex w-full h-full justify-center overflow-x-hidden"
          >
            <div className="w-full flex justify-center">
              <div
                style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                }}
              >
                {!isEditMode && (
                  <ImageAreaPreview
                    shapes={activeNode?.shapes}
                    bgImage={activeNode?.bgImage}
                    navigate={handleNavigate}
                  />
                )}
                {isEditMode && (
                  <ImageAreaEdit
                    shapes={activeNode?.shapes}
                    bgImage={activeNode?.bgImage}
                    onSave={onSaveRequested}
                    handleUploadImage={handleUploadImage}
                    onUpdate={(data: any) => setPendingSkeletonUpdate(data)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {!activeNode && (
        <DaText
          variant="title"
          className="flex w-full h-full items-center justify-center"
        >
          No node selected.
        </DaText>
      )}
    </div>
  )
}

export default Architecture
