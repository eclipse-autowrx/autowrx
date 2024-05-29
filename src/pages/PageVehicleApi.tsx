import { useEffect, useState } from 'react'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import ApiList from '@/components/organisms/ApiList'
import ApiDetail from '@/components/organisms/ApiDetail'

interface Node {
  api: string
  datatype?: string
  description: string
  type: string
  uuid: string
  allowed?: string[]
  comment?: string
  unit?: string
  max?: number
  min?: number
  children?: { [key: string]: Node }
}

interface Cvi {
  Vehicle: Node
}

interface ApiItem {
  api: string
  type: string
  details: any
}

const parseCvi = (cvi: Cvi) => {
  const traverse = (
    node: Node,
    prefix: string = 'Vehicle',
  ): { api: string; type: string; details: Node }[] => {
    let result: { api: string; type: string; details: Node }[] = []
    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`
        node.children[key].api = newPrefix
        result.push({ api: newPrefix, type: child.type, details: child })
        result = result.concat(traverse(child, newPrefix))
      }
    }
    return result
  }
  return traverse(cvi.Vehicle)
}

const PageVehicleApi = () => {
  const [apiList, setApiList] = useState<ApiItem[]>([])
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null)

  useEffect(() => {
    const cviData: Cvi = JSON.parse(CVI_v4_1)
    const parsedApiList = parseCvi(cviData)
    setApiList(parsedApiList)
    console.log('CVI_v4_1', cviData)
  }, [])

  // const handleApiClick = (apiDetails: ApiItem) => {
  //   // console.log("Selected API", apiDetails);
  //   setSelectedApi(apiDetails);
  // };

  return (
    <>
      <div className="flex col-span-6  w-full overflow-auto border-r">
        <ApiList
          apiList={apiList}
          onApiClick={setSelectedApi}
          selectedApi={selectedApi}
        />
      </div>
      <div className="flex col-span-6 w-full h-full overflow-auto">
        {selectedApi && <ApiDetail apiDetails={selectedApi} />}
      </div>
    </>
  )
}

export default PageVehicleApi
