import { useEffect, useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import PrototypeLibraryList from '@/components/organisms/PrototypeLibraryList'
import PrototypeLibraryPortfolio from '@/components/organisms/PrototypeLibraryPortfolio'
import DaTabItem from '@/components/atoms/DaTabItem'
import { useParams } from 'react-router-dom'
import { TbChartScatter, TbListDetails } from 'react-icons/tb'

const PagePrototypeLibrary = () => {
  const [activeTab, setActiveTab] = useState('list')
  const { model_id, tab } = useParams()

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
    }
  }, [tab])

  return (
    <div className="flex flex-col w-full h-full">
      <div className="col-span-12 flex w-full min-h-10 items-center bg-da-gray-light sticky top-0 z-20">
        <div className="flex space-x-2 h-full ">
          <DaTabItem
            active={activeTab === 'list'}
            to={`/model/${model_id}/library/list`}
          >
            <TbListDetails className="w-5 h-5 mr-2" />
            List View
          </DaTabItem>
          <DaTabItem
            active={activeTab === 'portfolio'}
            to={`/model/${model_id}/library/portfolio`}
          >
            <TbChartScatter className="w-5 h-5 mr-2" />
            Portfolio View
          </DaTabItem>
        </div>
      </div>
      <div className="flex h-full w-full overflow-y-auto">
        {activeTab === 'list' && <PrototypeLibraryList />}
        {activeTab === 'portfolio' && <PrototypeLibraryPortfolio />}
      </div>
    </div>
  )
}

export default PagePrototypeLibrary
