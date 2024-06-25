import { useEffect, useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import PrototypeLibraryList from '@/components/organisms/PrototypeLibraryList'
import PrototypeLibraryPortfolio from '@/components/organisms/PrototypeLibraryPortfolio'
import DaTabItem from '@/components/atoms/DaTabItem'
import { useParams } from 'react-router-dom'

const PagePrototypeLibrary = () => {
  const [activeTab, setActiveTab] = useState('list')
  const { model_id, tab } = useParams()

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
    }
  }, [tab])

  return (
    <div className="flex flex-col w-full h-[99%]">
      <div className="col-span-12 flex w-full min-h-12 items-center justify-between px-4 bg-da-primary-100 sticky top-0 z-20">
        <DaText variant="regular-bold" className="text-da-primary-500">
          Prototype Library
        </DaText>
        <div className="flex space-x-2">
          <DaTabItem
            active={activeTab === 'list'}
            to={`/model/${model_id}/library/list`}
          >
            List
          </DaTabItem>
          <DaTabItem
            active={activeTab === 'portfolio'}
            to={`/model/${model_id}/library/portfolio`}
          >
            Portfolio
          </DaTabItem>
        </div>
      </div>
      {activeTab === 'list' && <PrototypeLibraryList />}
      {activeTab === 'portfolio' && <PrototypeLibraryPortfolio />}
    </div>
  )
}

export default PagePrototypeLibrary
