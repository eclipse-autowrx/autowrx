import { useEffect, useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import PrototypeLibraryList from '@/components/organisms/PrototypeLibraryList'
import PrototypeLibraryPortfolio from '@/components/organisms/PrototypeLibraryPortfolio'
import { useParams } from 'react-router-dom'
import { TbChartScatter, TbListDetails } from 'react-icons/tb'
import DaImportFile from '@/components/atoms/DaImportFile'
import { DaButton } from '@/components/atoms/DaButton'
import DaLoader from '@/components/atoms/DaLoader'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import { createPrototypeService } from '@/services/prototype.service'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { zipToPrototype } from '@/lib/zipUtils'
import { Prototype } from '@/types/model.type'
import DaPopup from '@/components/atoms/DaPopup'
import { TbFileImport, TbPlus, TbSearch } from 'react-icons/tb'
import FormCreatePrototype from '@/components/molecules/forms/FormCreatePrototype'
import { useNavigate } from 'react-router-dom'
import DaFilter from '@/components/atoms/DaFilter'
import { DaInput } from '@/components/atoms/DaInput'
import DaErrorDisplay from '@/components/molecules/DaErrorDisplay'
import { DaSkeleton } from '@/components/atoms/DaSkeleton'
import { cn } from '@/lib/utils'

const PagePrototypeLibrary = () => {
  const [activeTab, setActiveTab] = useState('list')
  const { data: model } = useCurrentModel()
  const { model_id, tab } = useParams()
  const { data: currentUser } = useSelfProfileQuery()
  const { refetch } = useListModelPrototypes(model ? model.id : '')
  const [isLoading, setIsLoading] = useState(false)
  const { data: user } = useSelfProfileQuery()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model_id])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [selectedFilters, setSelectedFilters] = useState<string[]>(() =>
    JSON.parse(
      localStorage.getItem('prototypeLibrary-selectedFilter') || '["Newest"]',
    ),
  )
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
    }
  }, [tab])

  const handleTabChange = () => {
    const newTab = activeTab === 'list' ? 'portfolio' : 'list'
    setActiveTab(newTab)
    navigate(`/model/${model_id}/library/${newTab}`)
  }

  const handleFilterChange = (option: string[]) => {
    if (option.length === 0) {
      option = ['Newest']
    } else {
      setSelectedFilters(option)
      localStorage.setItem(
        'prototypeLibrary-selectedFilter',
        JSON.stringify(option),
      ) // Save filter to localStorage
    }
  }

  const handleImportPrototypeZip = async (file: File) => {
    if (!file) return
    if (!model) return
    setIsLoading(true)
    const prototype = await zipToPrototype(model.id, file)
    try {
      if (prototype) {
        const prototypePayload: Partial<Prototype> = {
          state: prototype.state || 'development',
          apis: { VSS: [], VSC: [] },
          code: prototype.code || '',
          widget_config: prototype.widget_config || '{}',
          description: prototype.description,
          tags: prototype.tags || [],
          image_file: prototype.image_file,
          model_id: model.id,
          name: prototype.name,
          complexity_level: prototype.complexity_level || '3',
          customer_journey: prototype.customer_journey || '{}',
          portfolio: prototype.portfolio || {},
        }
        const data = await createPrototypeService(prototypePayload)
        await addLog({
          name: `New prototype '${data.name}' under model '${model.name}'`,
          description: `Prototype '${data.name}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
          type: 'new-prototype',
          create_by: currentUser?.id!,
          ref_id: data.id,
          ref_type: 'prototype',
          parent_id: model.id,
        })
        await refetch()
        setIsLoading(false)
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Failed to import prototype:', error)
    }
  }

  return (
    <div className="flex flex-col w-full h-full rounded-md overflow-y-auto bg-white">
      <div className="flex flex-col w-full h-full px-6 lg:container">
        <div className="flex w-full items-center">
          {user ? (
            <div className="flex py-6 h-full w-full items-center">
              {activeTab === 'list' && (
                <DaText
                  variant="small-medium"
                  className="text-da-primary-500 flex-shrink-0 hidden xl:flex"
                >
                  Select a prototype to start
                </DaText>
              )}
              <div className="xl:grow"></div>
              <div className="flex w-full items-center justify-end space-x-2">
                <DaInput
                  type="text"
                  Icon={TbSearch}
                  iconBefore={true}
                  placeholder="Search prototypes"
                  className="w-full xl:max-w-[200px] !text-da-gray-dark"
                  wrapperClassName="h-8 shadow"
                  inputClassName="h-6 text-sm placeholder:text-da-gray-medium font-medium"
                  iconSize={20}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <DaButton
                  variant="outline-nocolor"
                  size="sm"
                  className={`!hidden lg:!flex items-center ${activeTab === 'list' ? '' : ''}`}
                  onClick={handleTabChange}
                >
                  {activeTab === 'list' ? (
                    <>
                      <TbChartScatter className="w-5 h-5 mr-2" />
                      Portfolio View
                    </>
                  ) : (
                    <>
                      <TbListDetails className="w-5 h-5 mr-2" />
                      List View
                    </>
                  )}
                </DaButton>
                <DaFilter
                  categories={{
                    'Sort By': ['Newest', 'Oldest', 'Name A-Z'],
                  }}
                  onChange={(option) => handleFilterChange(option)}
                  className="w-fit mr-0 !h-8 !shadow !px-2 !text-sm "
                  singleSelect={true}
                  defaultValue={selectedFilters}
                  label="Sort By"
                />

                <div
                  className={cn(
                    'flex h-fit bg-white opacity-50 pointer-events-none',
                    isAuthorized && 'opacity-100 pointer-events-auto',
                  )}
                >
                  <DaImportFile
                    accept=".zip"
                    onFileChange={handleImportPrototypeZip}
                    className="flex w-full"
                  >
                    <DaButton
                      variant="outline-nocolor"
                      size="sm"
                      className="flex"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <DaLoader className="mr-2" />
                          Importing...
                        </div>
                      ) : (
                        <>
                          <TbFileImport className="w-5 h-5 mr-2" />
                          Import Prototype
                        </>
                      )}
                    </DaButton>
                  </DaImportFile>

                  <DaPopup
                    state={[open, setOpen]}
                    trigger={
                      <DaButton variant="solid" size="sm" className="flex ml-2">
                        <TbPlus className="w-5 h-5 mr-2" />
                        Create New Prototype
                      </DaButton>
                    }
                  >
                    <FormCreatePrototype
                      onClose={() => {
                        setOpen(false)
                      }}
                    />
                  </DaPopup>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex w-full py-6 items-center">
              <DaSkeleton className="w-[210px] h-[32px]" />
              <div className="flex-grow" />
              <DaSkeleton className="w-[125px] h-[32px] mr-2" />
              <DaSkeleton className="w-[157px] h-[32px]" />
            </div>
          )}
        </div>
        <div className="flex h-full w-full">
          {activeTab === 'list' && (
            <PrototypeLibraryList
              selectedFilters={selectedFilters}
              searchInput={searchInput}
            />
          )}
          {activeTab === 'portfolio' && <PrototypeLibraryPortfolio />}
        </div>
      </div>
    </div>
  )
}

export default PagePrototypeLibrary
