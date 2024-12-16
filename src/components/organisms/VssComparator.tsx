import { useEffect, useMemo, useRef, useState } from 'react'
import { DaApiList } from '../molecules/DaApiList'
import { VehicleApi } from '@/types/model.type'
import useModelStore from '@/stores/modelStore'
import { shallow } from 'zustand/shallow'
import DaText from '../atoms/DaText'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import useCurrentModel from '@/hooks/useCurrentModel'
import ApiDetail from './ApiDetail'
import { DaButton } from '../atoms/DaButton'
import { TbArrowRight, TbPlayerPlayFilled } from 'react-icons/tb'
import clsx from 'clsx'
import Diff from 'diff-match-patch'
import _ from 'lodash'

interface DaVssCompareProps {}

const VssComparator = ({}: DaVssCompareProps) => {
  const CURRENT_MODEL = 'CURRENT_MODEL'

  const [collapsed, setCollapsed] = useState({
    new: false,
    deleted: false,
    modified: false,
  })

  const leftElement = useRef<HTMLDivElement>(null)
  const drag = useRef({
    x: 0,
    leftWidth: 720,
  })
  const [isActive, setActive] = useState(false)

  const [modelsApi, setModelsApi] = useState<VehicleApi[]>([])
  const [selectedApi, setSelectedApi] = useState<VehicleApi>()
  const [selectedCompareObj, setSelectedCompareObj] = useState<any>()
  const [activeTargetVer, setActiveTargetVer] = useState<string>('')
  const [activeCurrentVer, setActiveCurrentVer] = useState<string>('')
  const [mergedMap, setMergeMap] = useState<any>(null)

  const [newAPIs, setNewAPIs] = useState<any[]>([])
  const [deletedAPIs, setDeletedAPIs] = useState<any[]>([])
  const [modifiedAPIs, setModifiedAPIs] = useState<any[]>([])

  const [metadataDiff, setMetadataDiff] = useState<{
    current: any
    target: any
  } | null>(null)
  const dmp = useMemo(() => new Diff(), [])

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

    // console.log('currentVersion', currentVersion)
    // console.log('targetVersion', targetVersion)

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
        // console.log(existItem)
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

  const compareMetadata = (current: any, target: any) => {
    if (!current || !target) {
      return null
    }
    const resultCurrent: Record<string, any> = {}
    const resultTarget: Record<string, any> = {}
    try {
      for (const key of Object.keys(current)) {
        const currentValue = current[key]
        const targetValue = target[key]

        if (currentValue === targetValue) {
          continue
        }

        if (!targetValue) {
          resultCurrent[key] = { diff: 1 }
          continue
        }

        if (Array.isArray(currentValue) && Array.isArray(targetValue)) {
          resultCurrent[key] = {
            valueDiff: currentValue.map((i, index) => [
              targetValue.includes(i) ? 0 : 1,
              `${String(i) + (index === currentValue.length - 1 ? '' : ', ')}`,
            ]),
          }
          resultTarget[key] = {
            valueDiff: targetValue.map((i, index) => [
              currentValue.includes(i) ? 0 : -1,
              `${String(i) + (index === currentValue.length - 1 ? '' : ', ')}`,
            ]),
          }
          continue
        }

        if (
          typeof currentValue === 'string' &&
          typeof targetValue === 'string'
        ) {
          const diff = dmp.diff_main(currentValue, targetValue)
          dmp.diff_cleanupSemantic(diff)

          resultCurrent[key] = {
            valueDiff: diff.filter(([type]) => type === 1 || type === 0),
          }
          resultTarget[key] = {
            valueDiff: diff.filter(([type]) => type === -1 || type === 0),
          }
          continue
        }

        resultCurrent[key] = { valueDiff: 1 }
        resultTarget[key] = { valueDiff: -1 }
      }

      for (const key of Object.keys(target)) {
        if (!current[key]) {
          resultTarget[key] = { diff: -1 }
        }
      }
    } catch (error) {
      console.error('Error comparing metadata:', error)
    }

    return {
      current: _.isEmpty(resultCurrent) ? null : resultCurrent,
      target: _.isEmpty(resultTarget) ? null : resultTarget,
    }
  }

  useEffect(() => {
    if (
      !selectedCompareObj ||
      !selectedCompareObj.current ||
      !selectedCompareObj.target
    ) {
      return setMetadataDiff(null)
    }

    setMetadataDiff(
      compareMetadata(selectedCompareObj.current, selectedCompareObj.target),
    )
  }, [selectedCompareObj])

  const startResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setActive(true)
    drag.current = {
      ...drag.current,
      x: e.clientX,
    }
  }

  const resizeFrame = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { x, leftWidth } = drag.current
    if (isActive) {
      const xDiff = Math.abs(e.clientX - x)
      let newW = x > e.clientX ? leftWidth - xDiff : leftWidth + xDiff
      newW = Math.max(200, newW)
      newW = Math.min(800, newW)
      drag.current = {
        x: e.clientX,
        leftWidth: newW,
      }
      leftElement.current?.style.setProperty('width', `${newW}px`)
    }
  }

  const stopResize = () => {
    setActive(false)
  }

  return (
    <div
      className={clsx(
        'w-full h-full flex items-start',
        isActive && 'select-none',
      )}
      onMouseUp={stopResize}
      onMouseMove={resizeFrame}
    >
      <div className="w-full h-full hidden">
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

      <div className="flex-1 h-full w-full flex flex-col">
        <div className="bg-slate-100 p-2 flex items-center">
          <DaText variant="small-bold" className="mx-2">
            (new)
          </DaText>
          <select
            aria-label="deploy-select"
            className={`w-[280px] cursor-pointer transition border rounded font-semibold text-center da-label-small px-2 py-1 min-w-[90px] text-da-gray-dark bg-white shadow-small`}
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
          <TbArrowRight className="w-5 h-5 mx-4" />
          <DaText variant="small-bold" className="mr-2">
            (old)
          </DaText>
          <select
            aria-label="deploy-select"
            className={`w-[280px] cursor-pointer transition border rounded font-semibold da-label-small text-center px-2 py-1 min-w-[90px] text-da-gray-dark bg-white shadow-small`}
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
          <div ref={leftElement} className="h-full w-[720px] overflow-auto">
            <div className="mt-4 pl-2 bg-green-50">
              <div className="flex py-1 items-center gap-1">
                <DaButton
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      new: !prev.new,
                    }))
                  }
                  variant="plain"
                  size="sm"
                >
                  <TbPlayerPlayFilled
                    className={clsx(!collapsed.new && 'rotate-90')}
                  />
                </DaButton>
                <DaText className="flex-1" variant="regular-bold">
                  New Signals ({newAPIs.length}):
                </DaText>
              </div>
              {!collapsed.new && (
                <DaApiList
                  apis={newAPIs}
                  onApiClick={(api) => {
                    setSelectedApi(api)
                  }}
                  selectedApi={selectedApi}
                />
              )}
            </div>

            <div className="mt-4 pl-2 bg-red-50">
              <div className="flex py-1 items-center gap-1">
                <DaButton
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      deleted: !prev.deleted,
                    }))
                  }
                  variant="plain"
                  size="sm"
                >
                  <TbPlayerPlayFilled
                    className={clsx(!collapsed.deleted && 'rotate-90')}
                  />
                </DaButton>
                <DaText className="flex-1" variant="regular-bold">
                  Deleted Signals ({deletedAPIs.length}):
                </DaText>
              </div>

              {!collapsed.deleted && (
                <DaApiList
                  apis={deletedAPIs}
                  onApiClick={(api) => {
                    setSelectedApi(api)
                  }}
                  selectedApi={selectedApi}
                />
              )}
            </div>

            <div className="mt-4 pl-2 bg-orange-50">
              <div className="flex py-1 items-center gap-1">
                <DaButton
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      modified: !prev.modified,
                    }))
                  }
                  variant="plain"
                  size="sm"
                >
                  <TbPlayerPlayFilled
                    className={clsx(!collapsed.modified && 'rotate-90')}
                  />
                </DaButton>
                <DaText className="flex-1" variant="regular-bold">
                  Changed Signals ({modifiedAPIs.length}):
                </DaText>
              </div>

              {!collapsed.modified && (
                <DaApiList
                  apis={modifiedAPIs}
                  onApiClick={(api) => {
                    setSelectedApi(api)
                  }}
                  selectedApi={selectedApi}
                />
              )}
            </div>
          </div>

          <div
            className="h-full w-3 justify-center bg-slate-100 flex cursor-w-resize"
            onMouseDown={startResize}
          >
            <div className="w-[1px] h-full bg-da-gray-medium" />
          </div>

          <div className="flex-1 min-w-0 border-slate-100 gap-0.5 h-full overflow-y-auto flex">
            {selectedCompareObj && selectedCompareObj.current && (
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold py-1 px-4 text-slate-700 bg-slate-300">
                  New Version
                </div>
                <ApiDetail
                  apiDetails={selectedCompareObj?.current}
                  diffDetail={metadataDiff?.current}
                  forceSimpleMode={true}
                  syncHeight
                />
              </div>
            )}
            {selectedCompareObj && selectedCompareObj.target && (
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold py-1 px-4 text-slate-700 bg-slate-300">
                  Old Version
                </div>
                <ApiDetail
                  apiDetails={selectedCompareObj?.target}
                  diffDetail={metadataDiff?.target}
                  forceSimpleMode={true}
                  syncHeight
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
