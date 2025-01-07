import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { ImageAreaEdit, ImageAreaPreview } from 'image-area-lib'
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

  const [isFullscreen, setFullscreen] = useState(false)

  // 1) State for sidebar expand/collapse
  const [isExpand, setIsExpand] = useState(false)

  // 2) Parse skeleton from model/prototype
  useEffect(() => {
    const inputSkeleton =
      displayMode === 'model' ? model?.skeleton : prototype?.skeleton

    // Start with a default skeleton that definitely has a nodes array
    let skele: { nodes: any[] } = { nodes: [] }

    if (inputSkeleton) {
      try {
        const parsed = JSON.parse(inputSkeleton)
        // Ensure the final object always has 'nodes', whether or not parsed includes it
        skele = {
          ...parsed,
          nodes: Array.isArray(parsed?.nodes) ? parsed.nodes : [],
        }
      } catch (err) {
        console.error('Failed to parse skeleton:', err)
      }
    }

    setSkeleton(skele)
  }, [displayMode, model, prototype])

  // 3) If skeleton is loaded but empty => create a new node
  useEffect(() => {
    if (
      skeleton &&
      Array.isArray(skeleton.nodes) &&
      skeleton.nodes.length === 0
    ) {
      createNewNode()
    }
  }, [skeleton])

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
  const handleNameSave = async () => {
    if (tmpNodeName.length <= 0) return
    let tmpSkele = JSON.parse(JSON.stringify(skeleton))
    if (!tmpSkele.nodes) tmpSkele.nodes = []
    let nodes = tmpSkele.nodes
    let node = nodes.find((n: any) => n.id == activeNodeId)
    if (node) {
      node.name = tmpNodeName
      setSkeleton(tmpSkele)
      await callSave(tmpSkele)
    }
    setIsEditName(false)
  }

  // Debug
  useEffect(() => {
    console.log('Skeleton: ', skeleton)
  }, [skeleton])

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
    <div className="flex w-full h-full bg-da-white text-da-gray-medium select-none">
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

      {/** MAIN CONTENT AREA */}
      {activeNode && (
        <div
          className={clsx(
            'flex flex-1 flex-col h-full w-full overflow-y-auto',
            isFullscreen && 'fixed top-0 left-0 right-0 bottom z-30 bg-white',
          )}
        >
          <div className="flex w-full p-3 bg-white items-center justify-between">
            <div className="flex items-center">
              <DaButton
                variant="plain"
                size="sm"
                onClick={() => setIsExpand((prev) => !prev)}
                className="mr-2"
              >
                {isExpand ? (
                  <TbLayoutSidebarLeftCollapse className="w-5 h-5" />
                ) : (
                  <TbLayoutSidebarLeftExpand className="w-5 h-5" />
                )}
              </DaButton>

              {!isEditName && (
                <div className="flex items-center">
                  <DaText variant="title" className="text-da-primary-500">
                    {activeNode.name}
                  </DaText>
                  {isAuthorized && (
                    <DaButton
                      onClick={() => {
                        setTmpNodeName(activeNode.name)
                        setIsEditName(true)
                      }}
                      size="sm"
                      variant="plain"
                      className="ml-2"
                    >
                      <TbEdit className="w-4 h-4 mr-2" />
                      Edit Name
                    </DaButton>
                  )}
                </div>
              )}
              {isEditName && (
                <div className="flex items-center">
                  <DaInput
                    value={tmpNodeName}
                    onChange={(e) => setTmpNodeName(e.target.value)}
                    className="h-8 min-w-[300px]"
                    inputClassName="h-6"
                  />
                  <div className="space-x-2">
                    <DaButton
                      variant="plain"
                      size="sm"
                      className="ml-4"
                      onClick={() => setIsEditName(false)}
                    >
                      Cancel
                    </DaButton>
                    <DaButton
                      variant="solid"
                      size="sm"
                      className="ml-4"
                      onClick={handleNameSave}
                    >
                      Save
                    </DaButton>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <DaButton
                className={`${
                  !isEditMode
                    ? '!border-da-primary-500 !text-da-primary-500 bg-da-primary-100'
                    : 'text-da-gray-medium'
                }`}
                onClick={() => {
                  setIsEditMode(false)
                }}
                size="sm"
                variant="plain"
              >
                View Mode
              </DaButton>
              {isAuthorized && (
                <DaButton
                  className={` ${
                    isEditMode
                      ? '!border-da-primary-500 !text-da-primary-500 bg-da-primary-100'
                      : 'text-da-gray-medium'
                  }`}
                  onClick={() => {
                    setIsEditMode(true)
                  }}
                  size="sm"
                  variant="plain"
                >
                  Edit Mode
                </DaButton>
              )}
              <DaButton
                onClick={() => setFullscreen((prev) => !prev)}
                size="sm"
                variant="plain"
              >
                {isFullscreen ? (
                  <TbArrowsMinimize className="w-5 h-5" />
                ) : (
                  <TbArrowsMaximize className="w-5 h-5" />
                )}
              </DaButton>
            </div>
          </div>

          <div className="flex w-full h-full items-center justify-center">
            <div
              className={cn(
                'flex w-full h-full  overflow-x-hidden',
                isExpand ? 'max-w-[75%]' : 'max-w-[50%]',
              )}
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
                />
              )}
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
