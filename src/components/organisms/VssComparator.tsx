import { useEffect, useState } from "react"
import ModelApiList from "./ModelApiList"
import { DaApiList } from "../molecules/DaApiList"
import { VehicleApi } from "@/types/model.type"
import useModelStore from '@/stores/modelStore'
import { shallow } from 'zustand/shallow'
import DaText from "../atoms/DaText"
import useListVSSVersions from "@/hooks/useListVSSVersions"

interface DaVssCompareProps {

}

const VssComparator = ({ }: DaVssCompareProps) => {

  const [modelsApi, setModelsApi] = useState<VehicleApi[]>([])
  const [selectedApi, setSelectedApi] = useState<VehicleApi>()
  const [activeTargetVer, setActiveTargetVer] = useState<string>('')
  const [activeCurrentVer, setActiveCurrentVer] = useState<string>('my-model')

  const [newAPIs, setNewAPIs] = useState<any[]>([])
  const [deletedAPIs, setDeletedAPIs] = useState<any[]>([])
  const [modifiedAPIs, setModifiedAPIs] = useState<any[]>([])


  const { data: versions } = useListVSSVersions()

  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  useEffect(() => {
    setModelsApi(activeModelApis as VehicleApi[])
  }, [activeModelApis])

  useEffect(() => {
    console.log("versions", versions)
  }, [versions])

  const convertTree2List = (vssTree: any, VSS_MAP: any) => {
    // let VSS_MAP = new Map()
    const traverse: any = (
      node: any,
      prefix ='Vehicle',
    ) => {
      let result = []
      if(node.type != "branch") {
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
    if(!activeTargetVer || !versions) {
      return
    }

    console.log("activeTargetVer", activeTargetVer)
    let version = versions.find(v => v.name == activeTargetVer)
    if(!version || !version.browser_download_url) return
    console.log("version", version)
    console.log(version.browser_download_url)
    downloadaAndProcessVssData(version.browser_download_url)

  }, [activeTargetVer])

  const downloadaAndProcessVssData = async (url: string) => {
    let newAPIs = [] as any
    let deletedAPIs = [] as any
    let modifiedAPIs = [] as any
    try {
      if(!url) throw "No URL"
      let newUrl = url.replace('https://github.com/COVESA/vehicle_signal_specification/releases/download/', '/vss/')
      let response = await fetch(newUrl)
      let VSS_TREE = await response.json()
      let VSS_MAP = new Map()
      let VSS_LIST = convertTree2List(VSS_TREE, VSS_MAP)
      // console.log("VSS_LIST")
      // console.log(VSS_LIST)
      // console.log("VSS_MAP")
      // console.log(VSS_MAP)

      modelsApi.forEach((api: any) => {
        if(!VSS_MAP.get(api.name)) {
          console.log(api)
          if(api.type!='branch') {
            deletedAPIs.push(api)
          }
        }
      })
      

      let myModelMap = new Map()
      modelsApi.forEach((api:any) => {
        myModelMap.set(api.name, api)
      })

      VSS_LIST.forEach((api: any) => {
        if(!myModelMap.get(api.name)) {
          if(api.type!='branch') {
            newAPIs.push(api)
          }
        }
      })
    } catch(err) {
      console.log("downloadaAndProcessVssData")
      console.log(err)
    }
    setNewAPIs(newAPIs)
    setDeletedAPIs(deletedAPIs)
    setModifiedAPIs(modifiedAPIs)
  }

  return <div className="w-full h-full flex">
    <div className="flex-1 h-full flex flex-col">
      <div className="bg-slate-100 pl-2 mt-1">
        <DaText variant='sub-title'>Model:</DaText>
        <select
          aria-label="deploy-select"
          className={`w-[220px] ml-2 border rounded font-semibold text-center px-2 py-1 min-w-[90px] text-da-gray-dark bg-white`}
          value={activeCurrentVer}
          onChange={(e) => {
            setActiveCurrentVer(e.target.value)
          }}
        >
          <option value="current-model">Current Model</option>
          { versions && versions?.length>0  && versions.map((version: any, vIndex:number) => <option key={vIndex} value={version.name}
            className="px-2 py-1">
            {version.name.toUpperCase()}
          </option> )}
        </select>
      </div>
      <div className="grow overflow-y-auto">
         <DaApiList
          apis={modelsApi}
          onApiClick={() => { }}
          selectedApi={selectedApi}
        /> 
      </div>
    </div>
    <div className="flex-1 h-full">
      <div className="bg-slate-100 px-2 mt-1 flex items-center border-l-2 border-slate-200">
        <DaText variant='sub-title'>Compare with:</DaText>
          <select
            aria-label="deploy-select"
            className={`w-[220px] ml-2 border rounded font-semibold text-center px-2 py-1 min-w-[90px] text-da-gray-dark bg-white`}
            value={activeTargetVer}
            onChange={(e) => {
              setActiveTargetVer(e.target.value)
            }}
          >
            <option value="">Select a version</option>
            { versions && versions?.length>0  && versions.map((version: any, vIndex:number) => <option key={vIndex} value={version.name}
              className="px-2 py-1">
              {version.name.toUpperCase()}
            </option> )}
          </select>
      </div>
      <div className="mt-4 pl-2">
        <DaText variant='sub-title'>New Signals ({newAPIs.length}):</DaText>
        <div className="max-h-[200px] overflow-y-auto">
          <DaApiList
            apis={newAPIs}
            onApiClick={() => { }}
            // selectedApi={selectedApi}
          /> 
        </div>
      </div>

      <div className="mt-4 pl-2">
        <DaText variant='sub-title'>Deleted Signals ({deletedAPIs.length}):</DaText>
        <div className="max-h-[200px] overflow-y-auto">
          <DaApiList
            apis={deletedAPIs}
            onApiClick={() => { }}
            // selectedApi={selectedApi}
          /> 
        </div>
      </div>

      <div className="mt-4 pl-2">
        <DaText variant='sub-title'>Metadata changed Signals ({modifiedAPIs.length}):</DaText>
        <div className="max-h-[200px] overflow-y-auto">
          <DaApiList
            apis={modifiedAPIs}
            onApiClick={() => { }}
            // selectedApi={selectedApi}
          /> 
        </div>
      </div>


    </div>
  </div>
}

export default VssComparator