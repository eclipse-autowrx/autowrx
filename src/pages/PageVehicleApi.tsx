// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import useModelStore from '@/stores/modelStore'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaText from '@/components/atoms/DaText'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import ViewApiCovesa from '@/components/organisms/ViewApiCovesa'
import { ViewApiUSP } from '@/components/organisms/ViewApiUSP'

const PageVehicleApi = () => {
  const DEFAULT_API = 'COVESA'
  const [activeTab, setActiveTab] = useState<String>(DEFAULT_API)

  const [supportApis] = useModelStore((state) => [
    state.supportApis
  ])
  

  useEffect(() => {
    if(supportApis && supportApis.length>0) {
      setActiveTab(supportApis[0]?.code || DEFAULT_API)
    }
  }, [supportApis])

  return <div className='w-full h-full'>
    {<div className='flex items-center justify-start py-1 pl-4 bg-da-primary-500 text-white'>
      <DaText variant="small-bold" className='mr-2'>API: </DaText>
      {/* <DaSelect
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
      </DaSelect> */}
      
      <select className='min-w-[120px] text-xs px-2 py-0.5 text-white bg-transparent outline-none cursor-pointer rounded border border-white'
        onChange={(e: any) => setActiveTab(e.target.value)}
      >
        {(supportApis &&  supportApis.length>0) ? (
          supportApis.map((api: any) => (
            <option key={api.code} value={api.code} className='text-da-gray-medium'>{api.label}</option>
          ))
        ):(
          <option value={DEFAULT_API}>{DEFAULT_API}</option>
        )}
      </select>
    
      
    </div> }
    { (activeTab == 'COVESA' || !activeTab) && <ViewApiCovesa/> }
    { activeTab == 'USP' && <ViewApiUSP/> }

  </div>

}


export default PageVehicleApi
