import { useEffect, useState } from 'react'
import ModelApiList from './ModelApiList'
import { DaApiList } from '../molecules/DaApiList'
import { VehicleApi } from '@/types/model.type'
import useModelStore from '@/stores/modelStore'
import { shallow } from 'zustand/shallow'
import DaText from '../atoms/DaText'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import useCurrentModel from '@/hooks/useCurrentModel'
import ApiDetail from './ApiDetail'

interface DaVssCompareProps {}

const VssComparator = ({}: DaVssCompareProps) => {
  const CURRENT_MODEL = 'CURRENT_MODEL'

  const [modelsApi, setModelsApi] = useState<VehicleApi[]>([])
  const [selectedApi, setSelectedApi] = useState<VehicleApi>()
  const [selectedCompareObj, setSelectedCompareObj] = useState<any>()
  const [activeTargetVer, setActiveTargetVer] = useState<string>('')
  const [activeCurrentVer, setActiveCurrentVer] = useState<string>('')
  const [mergedMap, setMergeMap] = useState<any>(null)

  const [newAPIs, setNewAPIs] = useState<any[]>([])
  const [deletedAPIs, setDeletedAPIs] = useState<any[]>([])
  const [modifiedAPIs, setModifiedAPIs] = useState<any[]>([])

  const { data: versions } = useListVSSVersions()
  const { data: model } = useCurrentModel()

  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  useEffect(() => {
    setModelsApi(activeModelApis as VehicleApi[])
  }, [activeModelApis])

  useEffect(() => {
    if (!selectedApi || !mergedMap) {
      setSelectedCompareObj(null)
      return
    }
    let obj = mergedMap.get(selectedApi?.name)
    setSelectedCompareObj(obj)
  }, [selectedApi])

  useEffect(() => {
    setSelectedApi(undefined)
  }, [newAPIs, deletedAPIs, modifiedAPIs])

  useEffect(() => {
    // console.log("versions", versions)
    if (versions) {
      setActiveTargetVer(model?.api_version || 'v4.1')
      setActiveCurrentVer(CURRENT_MODEL)
    }
  }, [versions])

  const convertTree2List = (vssTree: any, VSS_MAP: any) => {
    // let VSS_MAP = new Map()
    const traverse: any = (node: any, prefix = 'Vehicle') => {
      let result = []
      if (node.type != 'branch') {
        VSS_MAP.set(prefix, { ...node, name: prefix })
        result.push({ ...node, name: prefix })
      }

      if (node.children) {
        for (const [key, child] of Object.entries(node.children)) {
          const newPrefix = `${prefix}.${key}`
          node.children[key].name = newPrefix
          result = result.concat(traverse(child, newPrefix))
        }
      }

      return result
    }

    return traverse(vssTree.Vehicle)
  }

  useEffect(() => {
    if (!activeTargetVer || !activeCurrentVer || !versions) {
      return
    }

    // console.log("activeTargetVer", activeTargetVer)
    // console.log("activeCurrentVer", activeCurrentVer)
    let targetVersion = null
    if (activeTargetVer == CURRENT_MODEL) {
      targetVersion = {
        name: CURRENT_MODEL,
      }
    } else {
      targetVersion = versions.find((v) => v.name == activeTargetVer)
    }

    let currentVersion = null
    if (activeCurrentVer == CURRENT_MODEL) {
      currentVersion = {
        name: CURRENT_MODEL,
      }
    } else {
      currentVersion = versions.find((v) => v.name == activeCurrentVer)
    }

    // console.log("currentVersion", currentVersion)
    // console.log("targetVersion", targetVersion)

    downloadaAndProcessVssData(currentVersion, targetVersion)
  }, [activeTargetVer, activeCurrentVer])

  const downloadaAndProcessVssData = async (
    currentVersion: any,
    targetVersion: any,
  ) => {
    let newAPIs = [] as any
    let deletedAPIs = [] as any
    let modifiedAPIs = [] as any
    let _mergeMap = new Map()
    try {
      let CURRENT_TREE = null
      let CURRENT_MAP = new Map()
      let CURRENT_LIST = null
      let TARGET_TREE = null
      let TARGET_MAP = new Map()
      let TARGET_LIST = null

      if (targetVersion?.name == CURRENT_MODEL) {
        TARGET_LIST = modelsApi
        TARGET_MAP = new Map()
        modelsApi.forEach((api: any) => {
          TARGET_MAP.set(api.name, api)
        })
      } else {
        if (!targetVersion?.browser_download_url) {
          throw 'No target URL'
        }
        let newUrl = targetVersion?.browser_download_url.replace(
          'https://github.com/COVESA/vehicle_signal_specification/releases/download/',
          '/vss/',
        )
        let response = await fetch(newUrl)
        TARGET_TREE = await response.json()
        TARGET_MAP = new Map()
        TARGET_LIST = convertTree2List(TARGET_TREE, TARGET_MAP)
      }

      if (currentVersion?.name == CURRENT_MODEL) {
        CURRENT_LIST = modelsApi
        CURRENT_MAP = new Map()
        modelsApi.forEach((api: any) => {
          CURRENT_MAP.set(api.name, api)
        })
      } else {
        if (!currentVersion?.browser_download_url) {
          throw 'No current URL'
        }
        let newUrl = currentVersion?.browser_download_url.replace(
          'https://github.com/COVESA/vehicle_signal_specification/releases/download/',
          '/vss/',
        )
        let response = await fetch(newUrl)
        CURRENT_TREE = await response.json()
        CURRENT_MAP = new Map()
        CURRENT_LIST = convertTree2List(CURRENT_TREE, CURRENT_MAP)
      }

      // console.log("CURRENT_LIST")
      // console.log(CURRENT_LIST)
      // console.log("CURRENT_MAP")
      // console.log(CURRENT_MAP)

      // console.log("TARGET_LIST")
      // console.log(TARGET_LIST)
      // console.log("TARGET_MAP")
      // console.log(TARGET_MAP)

      CURRENT_LIST.forEach(async (api: any) => {
        if (!TARGET_MAP.get(api.name)) {
          // console.log(api?.name)
          if (api.type != 'branch') {
            newAPIs.push(api)
          }
        }
        let existItem = _mergeMap.get(api.name) || {
          current: null,
          target: null,
          isMetaChanged: false,
        }
        existItem.current = api
        _mergeMap.set(api.name, existItem)
      })

      // console.log("_mergeMap 001", _mergeMap)

      // console.log("EXIST API")

      TARGET_LIST.forEach(async (api: any) => {
        if (!CURRENT_MAP.get(api.name)) {
          if (api.type != 'branch') {
            deletedAPIs.push(api)
          }
        }
        let existItem = _mergeMap.get(api.name) || {
          current: null,
          target: null,
          isMetaChanged: false,
        }
        existItem.target = api
        if (existItem.current) {
          if (
            existItem.current?.datatype != api?.datatype ||
            existItem.current?.description != api?.description ||
            existItem.current?.type != api?.type ||
            existItem.current?.unit != api?.unit
          ) {
            existItem.isMetaChanged = true
            modifiedAPIs.push(api)
          }
        }
        console.log(existItem)
        _mergeMap.set(api.name, existItem)
      })
      // console.log("_mergeMap 002", _mergeMap)
    } catch (err) {
      console.log('downloadaAndProcessVssData')
      console.log(err)
    }
    setNewAPIs(newAPIs)
    setDeletedAPIs(deletedAPIs)
    setModifiedAPIs(modifiedAPIs)
    setMergeMap(_mergeMap)
  }

  const compareMetadata = (current: any, target: any) => {}

  return (
    <div className="w-full h-full flex items-start">
      <div className="flex-1 h-full hidden">
        <div className="bg-slate-100 pl-2 mt-1">
          {/* <DaText variant='sub-title'>Model:</DaText>
        <select
          aria-label="deploy-select"
          className={`w-[220px] ml-2 border rounded font-semibold text-center px-2 py-1 min-w-[90px] text-da-gray-dark bg-white`}
          value={activeCurrentVer}
          onChange={(e) => {
            setActiveCurrentVer(e.target.value)
          }}
        >
          <option value="CURRENT_MODEL">Current Model</option>
          { versions && versions?.length>0  && versions.map((version: any, vIndex:number) => <option key={vIndex} value={version.name}
            className="px-2 py-1">
            {version.name.toUpperCase()}
          </option> )}
        </select> */}
        </div>
        <div className="grow overflow-y-auto">
          <DaApiList
            apis={modelsApi}
            onApiClick={(api) => {
              setSelectedApi(api)
            }}
            selectedApi={selectedApi}
          />
        </div>
      </div>

      <div className="flex-1 h-full flex flex-col">
        <div className="bg-slate-100 px-2 pt-4 pb-2 flex items-center border-l-2 border-slate-200">
          <DaText variant="regular-bold" className="mx-2">
            Compare
          </DaText>
          <select
            aria-label="deploy-select"
            className={`w-[280px] ml-2 border rounded font-semibold text-center px-2 py-1 min-w-[90px] text-da-gray-dark bg-lime-200`}
            value={activeCurrentVer}
            onChange={(e) => {
              setActiveCurrentVer(e.target.value)
            }}
          >
            <option value={CURRENT_MODEL}>
              Current Model (base on {(model && model.api_version) || 'v4.1'})
            </option>
            {versions &&
              versions?.length > 0 &&
              versions.map((version: any, vIndex: number) => (
                <option key={vIndex} value={version.name} className="px-2 py-1">
                  {version.name.toUpperCase()}
                </option>
              ))}
          </select>
          <DaText variant="regular-bold" className="mx-4">
            with
          </DaText>
          <select
            aria-label="deploy-select"
            className={`w-[280px] ml-2 border rounded font-semibold text-center px-2 py-1 min-w-[90px] text-da-gray-dark bg-lime-200`}
            value={activeTargetVer}
            onChange={(e) => {
              setActiveTargetVer(e.target.value)
            }}
          >
            <option value={CURRENT_MODEL}>
              Current Model (base on {(model && model.api_version) || 'v4.1'})
            </option>
            {versions &&
              versions?.length > 0 &&
              versions.map((version: any, vIndex: number) => (
                <option key={vIndex} value={version.name} className="px-2 py-1">
                  {version.name.toUpperCase()}
                </option>
              ))}
          </select>
        </div>

        <div className="w-full grow flex overflow-auto">
          <div className="w-[720px] min-w-[720px] border-r-2 border-slate-200 h-full overflow-auto">
            <div className="mt-4 pl-2">
              <DaText variant="sub-title">
                New Signals ({newAPIs.length}):
              </DaText>
              <div className="max-h-[180px] overflow-y-auto bg-green-50">
                <DaApiList
                  apis={newAPIs}
                  onApiClick={(api) => {
                    setSelectedApi(api)
                  }}
                  selectedApi={selectedApi}
                />
              </div>
            </div>

            <div className="mt-4 pl-2">
              <DaText variant="sub-title">
                Deleted Signals ({deletedAPIs.length}):
              </DaText>
              <div className="max-h-[180px] overflow-y-auto bg-red-50">
                <DaApiList
                  apis={deletedAPIs}
                  onApiClick={(api) => {
                    setSelectedApi(api)
                  }}
                  selectedApi={selectedApi}
                />
              </div>
            </div>

            <div className="mt-4 pl-2">
              <DaText variant="sub-title">
                Metadata changed Signals ({modifiedAPIs.length}):
              </DaText>
              <div className="max-h-[180px] overflow-y-auto bg-orange-50">
                <DaApiList
                  apis={modifiedAPIs}
                  onApiClick={(api) => {
                    setSelectedApi(api)
                  }}
                  selectedApi={selectedApi}
                />
              </div>
            </div>
          </div>

          <div className="grow border-slate-100 h-full overflow-auto flex">
            {selectedCompareObj && selectedCompareObj.current && (
              <div className="flex-1">
                <div className="text-xl font-semibold py-1 px-4 text-slate-700 bg-slate-300 border-r-2 border-slate-100">
                  New Version
                </div>
                <ApiDetail
                  apiDetails={selectedCompareObj?.current}
                  forceSimpleMode={true}
                />
              </div>
            )}
            {selectedCompareObj && selectedCompareObj.target && (
              <div className="flex-1">
                <div className="text-xl font-semibold py-1 px-4 text-slate-700 bg-slate-300">
                  Old Version
                </div>
                <ApiDetail
                  apiDetails={selectedCompareObj?.target}
                  forceSimpleMode={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VssComparator
