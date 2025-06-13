import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ApiDetail from '@/components/organisms/ApiDetail'
import { VehicleApi } from '@/types/model.type'
import ModelApiList from '@/components/organisms/ModelApiList'
import { DaImage } from '@/components/atoms/DaImage'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaTreeView from '@/components/molecules/DaTreeView'
import DaLoadingWrapper from '@/components/molecules/DaLoadingWrapper'
import useModelStore from '@/stores/modelStore'
import {
  TbBinaryTree2,
  TbGitCompare,
  TbList,
  TbDownload,
  TbReplace,
  TbLoader,
  TbPlus,
  TbSearch
} from 'react-icons/tb'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaText from '@/components/atoms/DaText'
import VssComparator from '@/components/organisms/VssComparator'
import { getComputedAPIs, replaceAPIsService } from '@/services/model.service'
import { isAxiosError } from 'axios'
import { toast } from 'react-toastify'
import DaPopup from '@/components/atoms/DaPopup'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import { DaButton } from '@/components/atoms/DaButton'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { DaApiList } from '../molecules/DaApiList'
import { DaInput } from '../atoms/DaInput'
import DaFilter from '../atoms/DaFilter'
import { debounce } from '@/lib/utils'
import { shallow } from 'zustand/shallow'
import FormCreateWishlistApi from '../molecules/forms/FormCreateWishlistApi'
import DaLoading from '../atoms/DaLoading'
import { DaHierarchicalView } from '@/components/molecules/DaApiHierarchicalView'
import { DaCopy } from '../atoms/DaCopy'
import { GoDotFill } from "react-icons/go";
import DaTreeViewUSP from '../molecules/DaTreeViewUSP'
import { cn, getApiTypeClasses } from '@/lib/utils'

interface UspServiceListProps {
  services: any[];
  onServiceSelected: (service: any) => void;
  activeService: any;
}



const ServiceListItem = ({ service, onClick, isSelected }: { service: any, onClick: () => void, isSelected: boolean }) => {
  const { bgClass } = getApiTypeClasses(service.Type)
  return <div
    className={`w-full min-w-full justify-between py-3 text-da-gray-medium cursor-pointer hover:bg-da-primary-100 items-center px-2 rounded ${isSelected ? 'bg-da-primary-100 text-da-primary-500' : ''
      }`}
    onClick={onClick}
  // onMouseEnter={handleMouseEnter}
  // onMouseLeave={handleMouseLeave}
  >
    <div className="flex flex-1 truncate cursor-pointer items-center">
      <div
        className={`text-sm grow cursor-pointer ${isSelected ? 'font-bold' : 'font-medium'} truncate`}
      >
        <span className="mr-1">•</span>{service.Name}
      </div>
      <div
        className={cn(
          'flex h-6 items-center rounded-md px-2 py-0',
          bgClass,
        )}
      >
        <div className="uppercase text-xs text-da-white">
          {service.Type}
        </div>
      </div>
    </div>
    <div className='flex items-center text-xs text-da-gray-medium'>
      <span className='font-mono text-xs mr-2'>[{service.ServiceName}]</span> {service.ServiceDescription}
      <div className='grow'></div>
      <div className='ml-2 text-xs text-da-gray-medium w-[54px]'> Fields: <b>{Object.keys(service.Fields || {}).length}</b></div>
      <div className='ml-2 text-xs text-da-gray-medium w-[74px]'> Methods: <b>{Object.keys(service.Methods || {}).length}</b></div>
      <div className='ml-2 text-xs text-da-gray-medium min-w-[80px]'> Data Types: <b>{Object.keys(service.DataTypes || {}).length}</b></div>
    </div>
    
  </div>
}

const UspSeviceList = ({ services, onServiceSelected, activeService }: UspServiceListProps) => {

  const [localServices, setLocalServices] = useState(services);

  useEffect(() => {
    setLocalServices(services);
  }, [services]);


  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    if (term.trim().length <= 0) {
      setLocalServices(services);
      return;
    }
    const filteredServices = services.filter((service) => service.ServiceName.toLowerCase().includes(term.trim().toLowerCase()));
    console.log(filteredServices);
    setLocalServices(filteredServices);
  };

  const handleFilterChange = (selectedOptions: string[]) => {
    // Implement filter change logic here
    console.log('Filter changed:', selectedOptions);
  };

  return <div className='h-full w-full px-2'>
    <div className="mb-2 flex items-center">
      <div className='w-full py-2'>
        <DaInput
          placeholder="Search Service"
          className="mr-2 w-full"
          Icon={TbSearch}
          iconBefore={true}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      {/* <DaFilter
          categories={{
            Signal: ['Default', 'Wishlist'],
            Type: ['Branch', 'Sensor', 'Actuator', 'Attribute'],
          }}
          onChange={handleFilterChange}
          className="w-full"
        /> */}
    </div>
    {localServices && localServices.length > 0 ? (
      localServices.map((service, index) => (
        <ServiceListItem key={index} service={service} onClick={() => onServiceSelected(service)} isSelected={service === activeService} />
      ))
    ) : (
      <div className="flex justify-center items-center py-4 h-[200px]">
        <DaText variant="small" className="text-center text-gray-400">
          No services available
        </DaText>
      </div>
    )}
  </div>
}

interface ServiceDetailProps {
  service: any;
}

const ServiceDetail = ({ service }: ServiceDetailProps) => {
  const { bgClass } = getApiTypeClasses(service.Type)
  return <div className='w-full px-2 py-2 max-h-[calc(100vh-250px)] overflow-auto'>
    <div>
      <div>
        <DaImage
          src={`/misc/${service.ServiceName}.png`}
          className="object-contain max-h-[340px] min-h-[340px] w-full"
        />
      </div>

      <div className="flex h-fit w-full flex-row items-center justify-between space-x-2 bg-da-primary-100 py-2 pl-4 pr-2">
        <div className='grow'>
          <DaCopy textToCopy={service.Name}>
            <DaText
              variant="regular-bold"
              className="truncate text-da-primary-500"
            >
              {service.Name}
            </DaText>
          </DaCopy>
        </div>
        <div
          className={cn(
            'flex h-8 items-center rounded-md px-2',
            bgClass,
          )}
        >
          <DaText variant="small-bold" className="uppercase text-da-white">
            {service.Type}
          </DaText>
        </div>
      </div>
      <div className='px-2'>
      <div className="flex text-sm items-center">Short Name: <span className='ml-2 text-base font-bold'>{service.ServiceName}</span></div>
      <p className="text-sm text-gray-600">{service.ServiceDescription}</p>
      <div className="mt-6">
        <h3 className="text-lg font-semibold">Fields ({Object.keys(service.Fields || {}).length})</h3>
        <div className="overflow-auto">
          {Object.entries(service.Fields || {}).map(([key, field]) => (
            <div key={key} className='flex flex-col text-sm mb-1'>
              <div className='min-w-[280px] flex items-center'>
                <GoDotFill className="text-da-primary-500 mr-1" size={10} />
                <DaCopy showIcon={false} textToCopy={(field as { name: string }).name || ''}>
                  <span className="flex items-center text-da-accent-500">
                    <strong>{(field as any).name}</strong>
                  </span>

                </DaCopy>

                <div className="text-[12px] text-gray-500 ml-1 font-mono min-w-[200px]"> [{(field as any).field_type}]</div>
              </div>
              <div className="flex-1 text-[12px] ml-3 leading-tight">
                <div>
                  <div className="text-[12px] text-gray-500"> Ref Data Type: <strong>{(field as any).ref_data_type}</strong></div>
                </div>
                {(field as any).desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Methods ({Object.keys(service.Methods || {}).length})</h3>
        <div className="overflow-auto">
          {Object.entries(service.Methods || {}).map(([key, method]) => (
            <div key={key} className='flex flex-col text-sm mb-1'>
              <div className='min-w-[280px] flex items-center'>
                <GoDotFill className="text-da-primary-500 mr-1" size={10} />
                <DaCopy showIcon={false} textToCopy={(method as { name: string }).name || ''}>
                  <span className="flex items-center text-da-accent-500">
                    <strong>{(method as any).name}</strong>
                  </span>
                </DaCopy>
                <div className="text-[12px] text-gray-500 ml-1 font-mono min-w-[200px]"> [{(method as any).RPCType}]</div>
              </div>
              <div className="flex-1 text-[12px] ml-2 leading-none">
                {(method as any).desc}
              </div>
              <div className="flex-1 text-[12px] ml-3 leading-tight">
                <div>
                  <strong>Inputs:</strong>
                  <ul className="list-disc list-inside">
                    {(method as any).inputs.map((input: any, index: number) => (
                      <li key={index}>
                        <span className="text-gray-500">{input.name}:</span> {input.description}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2">
                  <strong>Outputs:</strong>
                  <ul className="list-disc list-inside">
                    {(method as any).outputs.map((output: any, index: number) => (
                      <li key={index}>
                        <span className="text-gray-500">{output.name}:</span> {output.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Data Types ({Object.keys(service.DataTypes || {}).length})</h3>
        <div className="overflow-auto">
          {Object.entries(service.DataTypes || {}).map(([key, dataType]) => (
            <div key={key} className='flex flex-col text-sm mb-1'>
              <div className='min-w-[280px] flex items-center'>
                <GoDotFill className="text-da-primary-500 mr-1" size={10} />
                <DaCopy showIcon={false} textToCopy={(dataType as { description: string }).description || ''}>
                  <span className="flex items-center text-da-accent-500">
                    <strong>{(dataType as any).description}</strong>
                  </span>
                </DaCopy>
                <div className="text-[12px] text-gray-500 ml-1 font-mono min-w-[200px]"> [{(dataType as any).category}]</div>
              </div>
              <div className="flex-1 text-[12px] ml-2 leading-none">
                Base Datatype: {(dataType as any).baseDatatype}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  </div>
}

const ViewApiUSP = () => {
  const { model_id } = useParams()
  const navigate = useNavigate()

  const [activeModelUspSevices, refreshModel] = useModelStore((state) => [
    state.activeModelUspSevices,
    state.refreshModel,
  ])

  const [activeService, setActiveService] = useState()


  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('list')

  return <div className='w-full min-h-[400px] flex flex-col'>
    <div className="flex w-full min-h-10 items-center justify-between">
      <div className="flex space-x-2 h-full">
        <DaTabItem
          active={activeTab === 'list'}
          onClick={() => setActiveTab('list')}
        >
          <TbList className="w-5 h-5 mr-2" />
          List View
        </DaTabItem>

        <DaTabItem
          active={activeTab === 'tree'}
          onClick={() => setActiveTab('tree')}
        >
          <TbBinaryTree2 className="w-5 h-5 mr-2 rotate-[270deg]" />
          Tree View
        </DaTabItem>
      </div>
    </div>

    {activeTab === 'list' && (
      <div className="grow w-full flex overflow-auto">
        <div className="flex-1 max-w-[680px] flex w-full h-full overflow-auto border-r">
          <UspSeviceList services={activeModelUspSevices || []}
            activeService={activeService}
            onServiceSelected={setActiveService} />
        </div>
        <div className="flex-1 flex w-full h-full overflow-auto">
          {activeService ? (
            <ServiceDetail service={activeService} />
          ) : (
            <div className="flex justify-center w-full h-full">
              <DaImage
                src="/misc/BO_Atm_FobKey.png"
                className="object-contain"
              />
            </div>
          )}
        </div>
      </div>
    )}
    {activeTab === 'tree' && (
      <div className="grow w-full h-[calc(100vh-100px)] flex overflow-auto">
        <DaTreeViewUSP />
      </div>
    )}
  </div>
}

export default ViewApiUSP
