import { useEffect, useState } from 'react'
import useModelStore from '@/stores/modelStore'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaText from '@/components/atoms/DaText'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import ViewApiCovesa from '@/components/organisms/ViewApiCovesa'
import ViewApiUSP from '@/components/organisms/ViewApiUSP'

const PageVehicleApi = () => {
  const DEFAULT_API = 'COVESA'
  const { data: model, refetch } = useCurrentModel()
  const [activeTab, setActiveTab] = useState<String>(DEFAULT_API)

  const [supportApis] = useModelStore((state) => [
    state.supportApis
  ])
  

  useEffect(() => {
    if(supportApis && supportApis.length>0) {
      setActiveTab(supportApis[0]?.code || DEFAULT_API)
    }
  }, [supportApis])

  return <div>
    {<div className='flex items-center justify-start py-0.5 pl-4 bg-da-primary-500 text-white'>
      <DaText variant="small-bold" className='mr-2'>API: </DaText>
      <DaSelect
        wrapperClassName="mt-1 min-w-[180px] py-1"
        onValueChange={setActiveTab}
        defaultValue={DEFAULT_API}
      >
        {(supportApis &&  supportApis.length>0) ? (
          supportApis.map((api: any) => (
            <DaSelectItem key={api.code} value={api.code} className='min-w-[180px]'>
              {api.label}
            </DaSelectItem>
          ))
        ) : (
          <>
            <DaSelectItem value={DEFAULT_API} className='min-w-[180px]'>{DEFAULT_API}</DaSelectItem>
          </>
        )}
      </DaSelect>
    </div> }
    { (activeTab == 'COVESA' || !activeTab) && <ViewApiCovesa/> }
    { activeTab == 'USP' && <ViewApiUSP/> }

  </div>

}


export default PageVehicleApi
