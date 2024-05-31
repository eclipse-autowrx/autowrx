import { FC, useEffect, useState } from 'react'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { DaButton } from '@/components/atoms/DaButton'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { DaText } from '@/components/atoms/DaText'

interface TabItemProps {
  children: any
  active?: boolean
  to?: string
}

const TabItem: FC<TabItemProps> = ({ children, active, to }) => {
  const { model_id, prototype_id } = useParams()
  return (
    <Link to={`/model/${model_id}/library/prototype/${prototype_id}/${to}`}>
      <div
        className={`text-da-primary-500 da-label-regular py-1 px-4 min-w-20 
            cursor-pointer hover:opacity-70 hover:border-b-2 hover:border-da-primary-500
            ${active && 'border-b-2 border-da-primary-500'}`}
      >
        {children}
      </div>
    </Link>
  )
}

interface ViewPrototypeProps {
  display?: 'tree' | 'list'
}

const PagePrototypeDetail: FC<ViewPrototypeProps> = ({}) => {
  const { tab } = useParams()
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [isDefaultTab, setIsDefaultTab] = useState(false)
  useEffect(() => {
    if(!tab || tab =='journey' || tab=='view' ) {
        setIsDefaultTab(true)
        return
    }
    setIsDefaultTab(false)
  }, [tab])

  if (!prototype) {
    return (
      <div className="container grid place-items-center">
        <div className="p-8 text-da-gray-dark da-label-huge">
          Prototype not found
        </div>
      </div>
    )
  }

  return (
    <div className="col-span-12">
      <div className="px-4 py-2 flex bg-da-primary-500 text-da-white da-label-sub-title">
        {prototype.name}
        <div className="grow"></div>
      </div>
      <div className="flex px-6 py-0 bg-da-gray-light min-h-8">
        <TabItem active={isDefaultTab} to="journey">
          Journey
        </TabItem>
        <TabItem active={tab == 'architecture'} to="architecture">
          Architecture
        </TabItem>
        <TabItem active={tab == 'code'} to="code">
          Code
        </TabItem>
        <TabItem active={tab == 'flow'} to="flow">
          Flow
        </TabItem>
        <TabItem active={tab == 'dashboard'} to="dashboard">
          Dashboard
        </TabItem>
        <TabItem active={tab == 'homologation'} to="homologation">
          Homologation
        </TabItem>
        <TabItem active={tab == 'feedback'} to="feedback">
          Feedback
        </TabItem>
      </div>
      <div className='w-full min-h-[400px] grid place-items-center'>
            {
                isDefaultTab && <div className='p-8'><DaText variant='huge'>Journey Page</DaText></div>
            }
            {
                tab=='architecture' && <div className='p-8'><DaText variant='huge'>Architecture Page</DaText></div>
            }
            {
                tab=='code' && <div className='p-8'><DaText variant='huge'>Code Page</DaText></div>
            }
            {
                tab=='flow' && <div className='p-8'><DaText variant='huge'>Flow Page</DaText></div>
            }
            {
                tab=='dashboard' && <div className='p-8'><DaText variant='huge'>Dashboard Page</DaText></div>
            }
            {
                tab=='homologation' && <div className='p-8'><DaText variant='huge'>Homologation Page</DaText></div>
            }
            {
                tab=='feedback' && <div className='p-8'><DaText variant='huge'>Feedback Page</DaText></div>
            }
        
      </div>
    </div>
    
  )
}

export default PagePrototypeDetail
