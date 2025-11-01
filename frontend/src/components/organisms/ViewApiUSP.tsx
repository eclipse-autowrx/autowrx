// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DaImage } from '@/components/atoms/DaImage'
import DaTabItem from '@/components/atoms/DaTabItem'
import useModelStore from '@/stores/modelStore'
import {
  TbBinaryTree2,
  TbList,
  TbSearch
} from 'react-icons/tb'
import { DaCopy } from '../atoms/DaCopy'
import { GoDotFill } from "react-icons/go";
import DaTreeViewUSP from '../molecules/DaTreeViewUSP'
import { cn, getApiTypeClasses } from '@/lib/utils'
import { Input } from '@/components/atoms/input'

interface UspServiceListProps {
  services: any[];
  onServiceSelected: (service: any) => void;
  activeService: any;
}



const ServiceListItem = ({ service, onClick, isSelected }: { service: any, onClick: () => void, isSelected: boolean }) => {
  const { bgClass } = getApiTypeClasses(service.Type)
  return <div
    className={`w-full min-w-full border-b border-border justify-between py-1 text-muted-foreground cursor-pointer hover:bg-primary/10 items-center px-2 rounded ${isSelected ? 'bg-primary/10 text-primary' : ''
      }`}
    onClick={onClick}
  >
    <div className="flex flex-1 truncate cursor-pointer items-center">
      <div
        className={`text-sm grow cursor-pointer ${isSelected ? 'font-medium' : 'font-normal'} truncate`}
      >
        <span className="mr-1">•</span>{service.Name}
      </div>
      <div
        className={cn(
          'flex items-center rounded-md px-2 py-0.5 w-[110px]',
          bgClass,
        )}
      >
        <div className="uppercase text-xs text-white w-full text-center">
          {service.Type}
        </div>
      </div>
    </div>
    <div className='flex items-center text-xs text-muted-foreground'>
      <span className='font-mono text-xs mr-2'>[{service.ServiceName}]</span>
      <div className='grow'></div>
      <div className='ml-2 text-xs text-muted-foreground w-[54px]'> Fields: <span className="font-medium">{Object.keys(service.Fields || {}).length}</span></div>
      <div className='ml-2 text-xs text-muted-foreground w-[74px]'> Methods: <span className="font-medium">{Object.keys(service.Methods || {}).length}</span></div>
      <div className='ml-2 text-xs text-muted-foreground min-w-[80px]'> Data Types: <span className="font-medium">{Object.keys(service.DataTypes || {}).length}</span></div>
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
    setLocalServices(filteredServices);
  };

  const handleFilterChange = (selectedOptions: string[]) => {
    // Implement filter change logic here
  };

  return <div className='h-full w-full px-2'>
    <div className="mb-2 flex items-center">
      <div className='w-full pt-2 pb-0'>
        <Input
          placeholder="Search Service"
          className="mr-2 w-full"
          value={searchTerm}
          onChange={(e: any) => handleSearchChange(e.target.value)}
        />
      </div>
    </div>
    {localServices && localServices.length > 0 ? (
      localServices.map((service, index) => (
        <ServiceListItem key={index} service={service} onClick={() => onServiceSelected(service)} isSelected={service === activeService} />
      ))
    ) : (
      <div className="flex justify-center items-center py-4 h-[200px]">
        <div className="text-sm font-medium text-center text-gray-400">
          No services available
        </div>
      </div>
    )}
  </div>
}

interface ServiceDetailProps {
  service: any;
  hideImage?: boolean;
  hideTitle?: boolean;
}

const ServiceDetail = ({ service, hideImage = false, hideTitle = false }: ServiceDetailProps) => {
  const { bgClass } = getApiTypeClasses(service.Type)
  return <div className='w-full px-2 py-2 max-h-[calc(100vh-250px)] overflow-auto'>
    <div>
      {!hideImage && (
        <div>
          <DaImage
            src={`/misc/${service.ServiceName}.png`}
            className="object-contain max-h-[340px] min-h-[340px] w-full"
          />
        </div>
      )}

      {!hideTitle && <div className="flex h-fit w-full flex-row items-center justify-between space-x-2 bg-primary/10 py-2 pl-4 pr-2">
        <div className='grow'>
          <DaCopy textToCopy={service.Name}>
            <div className="text-sm font-medium truncate text-primary">
              {service.Name}
            </div>
          </DaCopy>
        </div>
        <div
          className={cn(
            'flex h-8 items-center rounded-md px-2',
            bgClass,
          )}
        >
          <div className="text-xs font-medium uppercase text-white">
            {service.Type}
          </div>
        </div>
      </div>
      }


      <div className='px-2'>
        <div className="flex text-sm items-center">Short Name: <span className='ml-2 text-base font-medium'>{service.ServiceName}</span></div>
        <p className="text-sm text-muted-foreground">{service.ServiceDescription}</p>
        <div className="mt-6">
          <h3 className="text-sm font-medium">Fields ({Object.keys(service.Fields || {}).length})</h3>
          <div className="overflow-auto">
            {Object.entries(service.Fields || {}).map(([key, field]) => (
              <div key={key} className='flex flex-col text-sm mb-1'>
                <div className='min-w-[280px] flex items-center'>
                  <GoDotFill className="text-primary mr-1" size={10} />
                  <DaCopy showIcon={false} textToCopy={(field as { name: string }).name || ''}>
                    <span className="flex items-center text-primary">
                      <span className="font-medium">{(field as any).name}</span>
                    </span>

                  </DaCopy>

                  <div className="text-xs text-muted-foreground ml-1 font-mono min-w-[200px]"> [{(field as any).field_type}]</div>
                </div>
                <div className="flex-1 text-xs ml-3 leading-tight">
                  <div>
                    <div className="text-xs text-muted-foreground"> Ref Data Type: <span className="font-medium">{(field as any).ref_data_type}</span></div>
                  </div>
                  {(field as any).desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium">Methods ({Object.keys(service.Methods || {}).length})</h3>
          <div className="overflow-auto">
            {Object.entries(service.Methods || {}).map(([key, method]) => (
              <div key={key} className='flex flex-col text-sm mb-1'>
                <div className='min-w-[280px] flex items-center'>
                  <GoDotFill className="text-primary mr-1" size={10} />
                  <DaCopy showIcon={false} textToCopy={(method as { name: string }).name || ''}>
                    <span className="flex items-center text-primary">
                      <span className="font-medium">{(method as any).name}</span>
                    </span>
                  </DaCopy>
                  <div className="text-xs text-muted-foreground ml-1 font-mono min-w-[200px]"> [{(method as any).RPCType}]</div>
                </div>
                <div className="flex-1 text-xs ml-2 leading-none">
                  {(method as any).desc}
                </div>
                <div className="flex-1 text-xs ml-3 leading-tight">
                  <div>
                    <span className="font-medium">Inputs:</span>
                    <ul className="list-disc list-inside">
                      {(method as any).inputs.map((input: any, index: number) => (
                        <li key={index}>
                          <span className="text-muted-foreground">{input.name}:</span> {input.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2">
                    <span className="font-medium">Outputs:</span>
                    <ul className="list-disc list-inside">
                      {(method as any).outputs.map((output: any, index: number) => (
                        <li key={index}>
                          <span className="text-muted-foreground">{output.name}:</span> {output.description}
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
          <h3 className="text-sm font-medium">Data Types ({Object.keys(service.DataTypes || {}).length})</h3>
          <div className="overflow-auto">
            {Object.entries(service.DataTypes || {}).map(([key, dataType]) => (
              <div key={key} className='flex flex-col text-sm mb-1'>
                <div className='min-w-[280px] flex items-center'>
                  <GoDotFill className="text-primary mr-1" size={10} />
                  <DaCopy showIcon={false} textToCopy={(dataType as { description: string }).description || ''}>
                    <span className="flex items-center text-primary">
                      <span className="font-medium">{(dataType as any).description}</span>
                    </span>
                  </DaCopy>
                  <div className="text-xs text-muted-foreground ml-1 font-mono min-w-[200px]"> [{(dataType as any).category}]</div>
                </div>
                <div className="flex-1 text-xs ml-2 leading-none">
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

export { ViewApiUSP, UspSeviceList, ServiceDetail }
