import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { ImageAreaEdit, ImageAreaPreview } from 'image-area-lib'
import useCurrentModel from '@/hooks/useCurrentModel'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { updateModelService } from '@/services/model.service'
import { DaCopy } from '@/components/atoms/DaCopy'
import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { TbEdit, TbPlus } from 'react-icons/tb'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { DaInput } from '@/components/atoms/DaInput'
import { cn } from '@/lib/utils'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaLoading from '@/components/atoms/DaLoading'
import { isArray } from 'lodash'

const MASTER_ITEM = 'master'

const PageModelArchitecture = () => {
  const [searchParams] = useSearchParams()
  const { data: profile } = useSelfProfileQuery()
  const { data: model, refetch } = useCurrentModel()
  const [skeleton, setSkeleton] = useState<any>(null)
  const [activeNodeId, setActiveNodeId] = useState<any>(null)
  const [activeNode, setActiveNode] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isEditName, setIsEditName] = useState<boolean>(false)
  const [tmpNodeName, setTmpNodeName] = useState<string>('')
  const navigate = useNavigate()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])

  useEffect(() => {
    if (!model) return
    let skele = { nodes: [] }
    if (model.skeleton) {
      try {
        skele = JSON.parse(model.skeleton)
      } catch (err) {
        console.error(err)
      }
    }
    setSkeleton(skele)
  }, [model])

  useEffect(() => {
    let id = searchParams.get('id')
    setActiveNodeId(id || null)
  }, [searchParams])

  useEffect(() => {
    setIsEditName(false)
    let activeNode = null
    if (skeleton && skeleton.nodes && skeleton.nodes.length > 0) {
      if (!activeNodeId) {
        navigate(`${window.location.pathname}?id=${skeleton.nodes[0].id}`, {
          replace: true,
        })
        return
      }
      activeNode = skeleton.nodes.find((n: any) => n.id == activeNodeId)
    }

    setActiveNode(activeNode)
  }, [activeNodeId, skeleton])

  useEffect(() => {
    if (activeNode) {
      setIsEditMode(false)
    }
  }, [activeNode])

  useEffect(() => {
    setIsEditName(false)
  }, [isEditMode])

  const callSave = async (skele: any) => {
    if (!model) return
    try {
      await updateModelService(model.id, { skeleton: JSON.stringify(skele) })
      await refetch()
    } catch (err) {
      console.log('error on save skeleton', err)
    }
  }

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
        bgImage: '', // Don't know why this exist
        shapes: [],
      },
      bgImage: 'https://placehold.co/1024x576?text=Empty+Architecture',
    })
    setSkeleton(tmpSkele)
    setActiveNodeId(id)
    await callSave(tmpSkele)
  }

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

  const handleNavigate = (url: string) => {
    console.log('Navigate to:', url)
    url.toLowerCase().startsWith('http')
      ? window.open(url, '_blank')
      : navigate(url)
  }

  const handleUploadImage = async (file: File) => {
    setIsLoading(true)

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
      } else {
        console.log('Node not found')
      }
    } catch (err) {
      console.log(err)
    }
    setIsLoading(false)
  }

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

  if (!skeleton)
    return (
      <DaLoading
        text="Loading Model Architecture..."
        timeoutText="Failed to load model architecture. Please try again."
      />
    )

  return (
    <div className="flex w-full h-full bg-da-white text-da-gray-medium select-none pt-6">
      <div className="flex flex-col min-w-[400px] px-4 h-full border-r">
        <div className="flex py-1 mb-2 items-center justify-between">
          <DaText variant="sub-title">Architecture Mapping</DaText>
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
                className={`flex flex-col px-3 py-2 border border-da-gray-light hover:border-da-primary-500 cursor-pointer rounded-lg
                    ${node.id == activeNodeId && '!border-da-primary-500'}`}
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
                  <DaText variant="small" className="">
                    ID: {node.id}
                  </DaText>
                  <div className="flex text-xs font-bold space-x-2">
                    {isAuthorized && (
                      <DaConfirmPopup
                        label="Are you sure you want to delete this node?"
                        onConfirm={() => handleDeleteNode(node.id)}
                      >
                        <DaButton
                          variant="destructive"
                          size="sm"
                          className="text-destructive da-clickable"
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
        <div className="flex flex-col h-full w-full px-4">
          <div className="flex w-full items-center justify-between pb-2 flex-wrap">
            <div className="flex items-center">
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
                <>
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
                </>
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
            </div>
          </div>

          <div className="flex w-full max-w-[99%]">
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

export default PageModelArchitecture
