import { useEffect, useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import PrototypeLibraryList from '@/components/organisms/PrototypeLibraryList'
import PrototypeLibraryPortfolio from '@/components/organisms/PrototypeLibraryPortfolio'
import { useParams } from 'react-router-dom'
import { TbChartScatter, TbListDetails } from 'react-icons/tb'
import { DaButton } from '@/components/atoms/DaButton'
import DaLoader from '@/components/atoms/DaLoader'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import { createPrototypeService } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { zipToPrototype } from '@/lib/zipUtils'
import { Prototype } from '@/types/model.type'
import DaPopup from '@/components/atoms/DaPopup'
import { TbFileImport, TbPlus, TbSearch } from 'react-icons/tb'
import FormCreatePrototype from '@/components/molecules/forms/FormCreatePrototype'
import { useNavigate } from 'react-router-dom'
import DaFilter from '@/components/atoms/DaFilter'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSkeleton } from '@/components/atoms/DaSkeleton'
import { cn } from '@/lib/utils'
import CustomDialog from '@/components/molecules/flow/CustomDialog'
import DaFileUpload from '@/components/atoms/DaFileUpload'

const PagePrototypeLibrary = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'portfolio'>('list')
  const { data: model } = useCurrentModel()
  const { model_id, tab } = useParams<{ model_id: string; tab?: string }>()
  const { refetch } = useListModelPrototypes(model ? model.id : '')
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
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prototypeName, setPrototypeName] = useState<string>('')
  const [extractedPrototype, setExtractedPrototype] =
    useState<Partial<Prototype> | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (tab) {
      setActiveTab(tab as 'list' | 'portfolio')
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
    }
    setSelectedFilters(option)
    localStorage.setItem(
      'prototypeLibrary-selectedFilter',
      JSON.stringify(option),
    )
  }

  const handleFileChange = async (file: File) => {
    setSelectedFile(file)
    setImportError(null)
    try {
      const prototype = await zipToPrototype(model?.id || '', file)
      if (prototype && prototype.name) {
        setExtractedPrototype(prototype)
        setPrototypeName(prototype.name)
      } else {
        setImportError('Invalid zip file. Could not extract prototype data.')
        setExtractedPrototype(null)
        setPrototypeName('')
      }
    } catch (error) {
      setImportError('Error processing the zip file.')
      setExtractedPrototype(null)
      setPrototypeName('')
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setExtractedPrototype(null)
    setPrototypeName('')
    setImportError(null)
  }

  const handleConfirmImport = async () => {
    if (
      !selectedFile ||
      !model ||
      !prototypeName.trim() ||
      !extractedPrototype
    ) {
      setImportError('Please select a valid file and provide a prototype name.')
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      const prototypePayload: Partial<Prototype> = {
        state: extractedPrototype.state || 'development',
        apis: { VSS: [], VSC: [] },
        code: extractedPrototype.code || '',
        widget_config: extractedPrototype.widget_config || '{}',
        description: extractedPrototype.description,
        tags: extractedPrototype.tags || [],
        image_file: extractedPrototype.image_file,
        model_id: model.id,
        name: prototypeName,
        complexity_level: extractedPrototype.complexity_level || '3',
        customer_journey: extractedPrototype.customer_journey || '{}',
        portfolio: extractedPrototype.portfolio || {},
      }

      await createPrototypeService(prototypePayload)
      await refetch()
      setIsOpenImportDialog(false)
      setSelectedFile(null)
      setExtractedPrototype(null)
      setPrototypeName('')
    } catch (error: any) {
      if (error.response?.data?.message) {
        setImportError(error.response.data.message)
      } else {
        setImportError('Failed to import prototype')
      }
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
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
                  className={`!hidden lg:!flex items-center`}
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
                  categories={{ 'Sort By': ['Newest', 'Oldest', 'Name A-Z'] }}
                  onChange={handleFilterChange}
                  className="w-fit mr-0 !h-8 !shadow !px-2 !text-sm"
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
                  <DaButton
                    variant="outline-nocolor"
                    size="sm"
                    className="flex"
                    onClick={() => setIsOpenImportDialog(true)}
                  >
                    <TbFileImport className="w-5 h-5 mr-2" />
                    Import Prototype
                  </DaButton>
                  <DaPopup
                    state={[open, setOpen]}
                    trigger={
                      <DaButton variant="solid" size="sm" className="flex ml-2">
                        <TbPlus className="w-5 h-5 mr-2" />
                        Create New Prototype
                      </DaButton>
                    }
                  >
                    <FormCreatePrototype onClose={() => setOpen(false)} />
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

      <CustomDialog
        open={isOpenImportDialog}
        onOpenChange={(open) => {
          setIsOpenImportDialog(open)
          if (!open) {
            setSelectedFile(null)
            setExtractedPrototype(null)
            setPrototypeName('')
            setImportError(null)
          }
        }}
        dialogTitle="Import Prototype"
        description="Upload a zip file containing the prototype."
        className="h-fit xl:h-fit overflow-hidden"
      >
        <div className="flex flex-col space-y-4">
          <DaFileUpload
            accept=".zip"
            label="Select or Drop Zip File"
            isImage={false}
            validate={async (file) => {
              await handleFileChange(file)
              return null
            }}
            onFileUpload={(url) => {
              if (url === '') {
                handleClearFile()
              }
            }}
          />
          {extractedPrototype && (
            <DaInput
              value={prototypeName}
              onChange={(e) => setPrototypeName(e.target.value)}
              placeholder={
                extractedPrototype ? extractedPrototype.name : 'Prototype Name'
              }
              className="w-full"
            />
          )}
          {importError && (
            <div className="text-red-500 text-sm">{importError}</div>
          )}
          <DaButton
            variant="solid"
            size="sm"
            disabled={
              !selectedFile ||
              !prototypeName.trim() ||
              isImporting ||
              !extractedPrototype
            }
            onClick={handleConfirmImport}
          >
            {isImporting ? (
              <div className="flex items-center">
                <DaLoader className="mr-2 size-4 animate-spin text-white" />
                Importing...
              </div>
            ) : (
              'Import'
            )}
          </DaButton>
        </div>
      </CustomDialog>
    </div>
  )
}

export default PagePrototypeLibrary
