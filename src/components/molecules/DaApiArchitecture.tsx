import { ImageAreaEdit, ImageAreaPreview } from 'image-area-lib'
import axios, { AxiosError } from 'axios'
import { DaButton } from '../atoms/DaButton'
import { useEffect, useState } from 'react'
import { TbArrowLeft, TbEdit } from 'react-icons/tb'
import { CircularProgress } from '@mui/material'
import DaTooltip from '../atoms/DaTooltip'
import usePermissionHook from '@/hooks/usePermissionHook'
import { useNavigate } from 'react-router-dom'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaLoading from '../atoms/DaLoading'
import {
  getExtendedApi,
  updateExtendedApi,
  createExtendedApi,
} from '@/services/extendedApis.service'
import { ExtendedApi, ExtendedApiCreate, Skeleton } from '@/types/api.type'

const MASTER_ITEM = 'master'

const DaApiArchitecture = ({ apiName: apiName }: { apiName: string }) => {
  const [skeleton, setSkeleton] = useState<any>({})
  const [extendedApi, setExtendedApi] = useState<ExtendedApi>()
  const [activeSkeleton, setActiveSkeleton] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>('view')
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])
  const navigate = useNavigate()

  if (!model)
    return (
      <DaLoading
        text="Loading API architecture"
        timeout={10}
        timeoutText="Failed to load API architecture"
      />
    )

  const handleNavigate = (url: string) => {
    if (!model) return
    if (url.toLowerCase().startsWith('http')) {
      window.open(url, '_blank')
    } else {
      if (url.includes('/')) {
        navigate(url)
      } else {
        navigate(`/model/${model.id}/api/${url}`)
      }
    }
  }

  const createNodeWithImage = async (imageFileUrl?: string) => {
    let tmpSkele: Skeleton = { nodes: [] } // Create a new skeleton object
    let id = new Date().getTime()
    tmpSkele.nodes.push({
      id: id,
      name: 'Node 1',
      type: 'node',
      parent_id: MASTER_ITEM,
      content: {
        bgImage: '',
        shapes: [],
      },
      bgImage: imageFileUrl
        ? imageFileUrl
        : 'https://placehold.co/1024x576?text=Empty+Architecture',
    })
    setSkeleton(tmpSkele)
    return tmpSkele
  }

  const ensureRootVehicleApiExist = async (
    modelID: string,
    modelHomeImageFile: string,
  ) => {
    try {
      const vehicleRes = await getExtendedApi('Vehicle', modelID)
      if (!vehicleRes || !vehicleRes.skeleton || vehicleRes.skeleton === '{}') {
        const vehicleSkeleton = await createNodeWithImage(modelHomeImageFile)
        const vehiclePayload: ExtendedApiCreate = {
          apiName: 'Vehicle',
          model: modelID,
          skeleton: JSON.stringify(vehicleSkeleton),
        }
        await createExtendedApi(vehiclePayload)
      }
    } catch (err) {
      const vehicleError = err as AxiosError
      if (vehicleError.response && vehicleError.response.status === 404) {
        const vehicleSkeleton = await createNodeWithImage(modelHomeImageFile)
        const vehiclePayload: ExtendedApiCreate = {
          apiName: 'Vehicle',
          model: modelID,
          skeleton: JSON.stringify(vehicleSkeleton),
        }
        await createExtendedApi(vehiclePayload)
      } else {
        throw new Error('Error checking or creating Vehicle API')
      }
    }
  }

  // Fetch the API skeleton from the database
  const fetchAPISkeleton = async (modelID: string, apiName: string) => {
    if (!modelID || !apiName) return
    setIsFetching(true)

    try {
      // Fetch the current selected API skeleton
      const res = await getExtendedApi(apiName, modelID)
      if (res && res.skeleton && res.skeleton !== '{}') {
        setExtendedApi(res)
        const parsedSkeleton: Skeleton = JSON.parse(res.skeleton)
        // If the skeleton is found but empty, fetch the parent API skeleton
        if (!parsedSkeleton.nodes || parsedSkeleton.nodes.length === 0) {
          // console.log("Extended API existed but didn't have any nodes")
          // Get the bgImage from the parent API
          const parentSkeletonObject = await fetchParentAPISkeleton(
            apiName,
            modelID,
          )
          if (
            !parentSkeletonObject ||
            !parentSkeletonObject.nodes ||
            parentSkeletonObject.nodes.length === 0
          ) {
            throw new Error('Parent skeleton not found or empty')
          }
          const tmpSkele = await createNodeWithImage(
            parentSkeletonObject.nodes[0].bgImage,
          )
          setSkeleton(tmpSkele)
        } else {
          // If the skeleton is found and not empty, set the skeleton
          // console.log('Fetched skeleton:', parsedSkeleton)
          setSkeleton(parsedSkeleton)
        }
      } else {
        throw new Error('Skeleton not found or empty')
      }
    } catch (err) {
      // The selected API skeleton is not found, create a new one
      const error = err as AxiosError
      if (error.response && error.response.status === 404) {
        // console.log('Extended API not found, creating new one.')
        // Get the bgImage from the parent API
        const parentSkeletonObject = await fetchParentAPISkeleton(
          apiName,
          modelID,
        )
        if (
          !parentSkeletonObject ||
          !parentSkeletonObject.nodes ||
          parentSkeletonObject.nodes.length === 0
        ) {
          throw new Error('Parent skeleton not found or empty')
        }
        const tmpSkele = await createNodeWithImage(
          parentSkeletonObject.nodes[0].bgImage,
        )
        // console.log('Skeleton object', tmpSkele)
        const createPayload: ExtendedApiCreate = {
          apiName: apiName,
          model: modelID,
          skeleton: JSON.stringify(tmpSkele),
        }
        const res = await createExtendedApi(createPayload)
        // console.log('Created extendedAPI', res)
        // The ImageArea lib will trigger onSaveRequested to save the skeleton so no need to set it here
        setExtendedApi(res)
        setSkeleton(tmpSkele)
      } else {
        console.error('Error fetching extended API:', error)
      }
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch the skeleton of the parent API if the current API's skeleton is not found
  const fetchParentAPISkeleton = async (
    apiName: string,
    modelID: string,
  ): Promise<any> => {
    if (!apiName || apiName === 'Vehicle') return null

    const parentApiName = apiName.substring(0, apiName.lastIndexOf('.'))

    try {
      const res = await getExtendedApi(parentApiName, modelID)
      if (res && res.skeleton) {
        return JSON.parse(res.skeleton)
      }
    } catch (error) {
      console.error(`Error fetching parent API ${parentApiName}:`, error)
    }

    return fetchParentAPISkeleton(parentApiName, modelID) // Recursive call to fetch the next parent if the current one is not found
  }

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
      let tmpSkele =
        typeof skeleton === 'string' ? JSON.parse(skeleton) : skeleton
      if (!tmpSkele.nodes) tmpSkele.nodes = []
      let nodes = tmpSkele.nodes
      let node = nodes[0]
      if (node) {
        node.bgImage = data.data.fileLink
        setSkeleton(tmpSkele)
        await saveAPISkeleton(tmpSkele)
      } else {
        console.log('Node not found')
      }
    } catch (err) {
      console.log(err)
    }
  }

  const saveAPISkeleton = async (skele: any) => {
    try {
      if (!extendedApi) return
      const createPayload: Partial<ExtendedApiCreate> = {
        skeleton: JSON.stringify(skele),
      }
      await updateExtendedApi(createPayload, extendedApi.id)
      await fetchAPISkeleton(model.id, apiName)
    } catch (error) {
      console.error('Error saving extended API:', error)
    }
  }

  const onSaveRequested = async (data: any) => {
    if (!data) return
    let tmpSkele = JSON.parse(JSON.stringify(skeleton)) || { nodes: [] }
    let nodes = tmpSkele.nodes
    let node = nodes[0]

    node.shapes = data.shapes
    node.bgImage = data.bgImage
    await saveAPISkeleton(tmpSkele)
    setSkeleton(tmpSkele)
    setActiveTab('view')
  }

  // Fetch api skeleton when changing API
  useEffect(() => {
    setActiveSkeleton(null)
    setSkeleton({})
    setActiveTab('view')
    fetchAPISkeleton(model.id, apiName)
  }, [model, apiName])

  // Set active skeleton when changing skeleton
  useEffect(() => {
    if (skeleton) {
      setActiveSkeleton(skeleton)
    }
  }, [skeleton])

  // Ensure 'Vehicle' API exists when the model becomes available
  useEffect(() => {
    if (model && model.model_home_image_file) {
      ensureRootVehicleApiExist(model.id, model.model_home_image_file)
    }
  }, [model])

  return (
    <div className={`flex flex-col w-full h-fit items-center`}>
      <div className={`flex flex-col w-full h-fit items-center`}>
        {isFetching ? (
          <div className="flex w-full items-center justify-center py-2">
            <CircularProgress size="1rem" style={{ color: '#4b5563' }} />
            <div className="ml-2 text-gray-600 min-h-[400px]"></div>
          </div>
        ) : (
          <div
            className={`flex w-full justify-end py-2 ${isAuthorized ? 'visible' : 'hidden'}`}
          >
            <DaTooltip
              content={`Switch to ${activeTab === 'view' ? 'Edit' : 'View'} mode`}
              space={20}
            >
              <DaButton
                variant="outline-nocolor"
                size="sm"
                onClick={() =>
                  setActiveTab(activeTab === 'view' ? 'edit' : 'view')
                }
              >
                {activeTab === 'view' ? <TbEdit /> : <TbArrowLeft />}
                <span className="ml-2">
                  {activeTab === 'view' ? 'Edit Mapping' : 'Exit Edit Mode'}{' '}
                </span>
              </DaButton>
            </DaTooltip>
          </div>
        )}
      </div>
      {!isFetching &&
        activeSkeleton &&
        activeSkeleton.nodes &&
        activeSkeleton.nodes.length > 0 && (
          <div className="flex w-full h-auto">
            {activeTab === 'view' ? (
              <ImageAreaPreview
                shapes={activeSkeleton?.nodes[0]?.shapes}
                bgImage={activeSkeleton?.nodes[0]?.bgImage}
                navigate={handleNavigate}
              />
            ) : (
              <ImageAreaEdit
                shapes={activeSkeleton?.nodes[0]?.shapes}
                bgImage={activeSkeleton?.nodes[0]?.bgImage}
                onSave={onSaveRequested}
                handleUploadImage={handleUploadImage}
              />
            )}
          </div>
        )}
    </div>
  )
}

export default DaApiArchitecture
