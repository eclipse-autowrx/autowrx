// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import DaPopup from '../atoms/DaPopup'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { DaText } from '../atoms/DaText'
import { DaApiListItem } from '../molecules/DaApiList'
import ModelApiList from './ModelApiList'
import { getApiTypeClasses } from '@/lib/utils'
import { DaCopy } from '../atoms/DaCopy'
import DaTabItem from '../atoms/DaTabItem'
import useCurrentModel from '@/hooks/useCurrentModel'
import { UspSeviceList, ServiceDetail } from './ViewApiUSP'
import { V2CApiList, ApiDetail, DEFAULT_V2C } from './ViewApiV2C'
interface ApiCodeBlockProps {
  content: string
  sampleLabel: string
  dataId?: string
  copyClassName?: string
  onApiCodeCopy?: () => void
}

const ApiCodeBlock = ({
  content,
  sampleLabel,
  dataId,
  copyClassName,
  onApiCodeCopy,
}: ApiCodeBlockProps) => {
  return (
    <div className="flex flex-col" data-id={dataId}>
      <DaCopy
        textToCopy={content}
        className={`flex h-6 items-center w-fit mt-3 btn-copy ${copyClassName}`}
        onCopied={onApiCodeCopy}
      >
        <DaText
          variant="small"
          className="flex w-fit shrink-0 text-da-gray-medium"
        >
          {sampleLabel}
        </DaText>
      </DaCopy>

      <div className="flex flex-wrap w-full min-w-fit px-3 py-3 mt-2 bg-gray-100 rounded-lg justify-between border">
        <DaText
          variant="small"
          className="w-full font-mono text-da-gray-dark whitespace-pre-line"
        >
          {/* <span className="text-blue-600 font-mono">await self.</span> */}
          {content}
        </DaText>
      </div>
    </div>
  )
}

interface APIDetailsProps {
  activeApi: any
  requestCancel?: () => void
}

const APIDetails: FC<APIDetailsProps> = ({ activeApi, requestCancel }) => {
  useEffect(() => {
    if (activeApi) {
    }
  }, [activeApi])
  return (
    <div className="flex flex-col">
      {activeApi && (
        <div className="flex flex-col w-full">
          <div className="flex pb-2 items-center da-label-sub-title border-b border-da-gray-light justify-between">
            <DaCopy textToCopy={activeApi.name}>
              <DaText
                variant="sub-title"
                className="text-da-primary-500 cursor-pointer"
              >
                {activeApi.name}
              </DaText>
            </DaCopy>
            <div className={getApiTypeClasses(activeApi.type).textClass}>
              {activeApi.type.toUpperCase()}
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto scroll-gray">
            {['branch'].includes(activeApi.type) && (
              <div>
                <div className="mt-4 text-da-gray-dark py-1 flex items-center da-label-regular">
                  This is branch node, branch include a list of child API. You
                  can not call a branch in python code, please select its
                  children.
                </div>
              </div>
            )}
            {['attribute'].includes(activeApi.type) && (
              <div>
                <div className="mt-4 text-da-gray-dark py-1 flex items-center da-label-regular">
                  An attribute has a default value, but not all Vehicle Signal
                  Specification attributes include one. OEMs must define or
                  override defaults if needed to match the actual vehicle.
                </div>
              </div>
            )}
            {['actuator', 'sensor'].includes(activeApi.type) && (
              <ApiCodeBlock
                content={`value = (await self.${activeApi.name}.get()).value`}
                sampleLabel="Sample code to get signal value"
                copyClassName="btn-copy-get-code"
                onApiCodeCopy={() => {
                  if (requestCancel) {
                    requestCancel()
                  }
                }}
              />
            )}
            {['actuator'].includes(activeApi.type) && (
              <ApiCodeBlock
                content={`await self.${activeApi.name}.set(value)`}
                sampleLabel="Sample code to set signal value"
                copyClassName="btn-copy-set-code"
                onApiCodeCopy={() => {
                  if (requestCancel) {
                    requestCancel()
                  }
                }}
              />
            )}
            {['actuator', 'sensor'].includes(activeApi.type) && (
              <ApiCodeBlock
                content={`await self.${activeApi.name}.subscribe(function_name)`}
                sampleLabel="Sample code to subscribe signal value"
                copyClassName="btn-copy-subscribe-code"
                onApiCodeCopy={() => {
                  if (requestCancel) {
                    requestCancel()
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface PrototypeTabCodeApiPanelProps {
  code: string
}

const PrototypeTabCodeApiPanel: FC<PrototypeTabCodeApiPanelProps> = ({
  code,
}) => {
  const [tab, setTab] = useState<
    'used-signals' | 'all-signals' | 'usp' | 'v2c'
  >('used-signals')
  const { data: model } = useCurrentModel()

  const [availableApis, setAvailableApis] = useState<any>([])

  const [activeModelUspSevices, activeModelV2CApis, supportApis] =
    useModelStore((state) => [
      state.activeModelUspSevices,
      state.activeModelV2CApis,
      state.supportApis,
    ])

  useEffect(() => {
    if (!supportApis) {
      setAvailableApis([])
      return
    }
    let apis = supportApis.map((s) => s.code)
    setAvailableApis(apis || [])
  }, [supportApis])

  useEffect(() => {
    // if (model?.extend?.vehicle_api?.USP) {
    //   setTab('usp')
    // }
  }, [model])

  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  const [useApis, setUseApis] = useState<any[]>([])
  const [usedV2CApis, setUseV2CApis] = useState<any[]>([])
  const [activeApi, setActiveApi] = useState<any>()
  const popupApi = useState<boolean>(false)
  const [activeService, setActiveService] = useState<any>(null)
  const [activeV2CApi, setActiveV2CApi] = useState<any>(null)
  useEffect(() => {
    if (!code || !activeModelApis || activeModelApis.length === 0) {
      setUseApis([])
      return
    }
    let useList: any[] = []
    activeModelApis.forEach((item: any) => {
      if (code.includes(item.shortName)) {
        useList.push(item)
      }
    })
    setUseApis(useList)
  }, [code, activeModelApis])

  useEffect(() => {
    if (!code || !activeModelV2CApis || activeModelV2CApis.length === 0) {
      setActiveV2CApi([])
      return
    }
    let useV2CList: any[] = []
    activeModelV2CApis.forEach((item: any) => {
      if (code.includes(item.path)) {
        useV2CList.push(item)
      }
    })
    setUseV2CApis(useV2CList)
  }, [code, activeModelV2CApis])

  const onApiClicked = (api: any) => {
    if (!api) return
    setActiveApi(api)
    popupApi[1](true)
  }

  return (
    <div className="flex flex-col w-full h-full p-1">
      <DaPopup state={popupApi} width={'800px'} trigger={<span></span>}>
        <APIDetails
          activeApi={activeApi}
          requestCancel={() => {
            popupApi[1](false)
          }}
        />
      </DaPopup>

      <div className="flex justify-between border-b mx-3 mt-2">
        <>
          <div className="flex">
            <DaTabItem
              onClick={() => setTab('used-signals')}
              active={tab === 'used-signals'}
              dataId="used-signals-tab"
            >
              Used APIs
            </DaTabItem>
            <DaTabItem
              onClick={() => setTab('all-signals')}
              active={tab === 'all-signals'}
              dataId="all-signals-tab"
            >
              COVESA Signals
            </DaTabItem>
            {availableApis && (
              <>
                {availableApis.includes('USP') && (
                  <DaTabItem
                    onClick={() => setTab('usp')}
                    active={tab === 'usp'}
                  >
                    USP 2.0
                  </DaTabItem>
                )}
                {availableApis.includes('V2C') && (
                  <DaTabItem
                    onClick={() => setTab('v2c')}
                    active={tab === 'v2c'}
                  >
                    V2C
                  </DaTabItem>
                )}
              </>
            )}
          </div>
          {/* <DaText
            variant="small-bold"
            className="text-da-primary-500 py-0.5 mr-1"
          >
            COVESA VSS {(model && model.api_version) ?? 'v4.1'}
          </DaText> */}
        </>
      </div>

      {tab === 'used-signals' && (
        <>
          <div className="flex flex-col w-full h-full px-4 overflow-y-auto">
            <div className="flex flex-col w-full min-w-fit mt-2">
              <DaText variant='regular-bold'>COVESA:</DaText>
              {useApis &&
                useApis.map((item: any, index: any) => (
                  <DaApiListItem
                    key={index}
                    api={item}
                    onClick={() => {
                      onApiClicked(item)
                    }}
                  />
                ))}
              {/* Render list of used V2C APIs here if exists. */}
              <div className='mt-4'></div>
              <DaText variant='regular-bold'>V2C:</DaText>
              {usedV2CApis && usedV2CApis.length>0 && (
                <V2CApiList
                  hideSearch={true}
                  apis={usedV2CApis}
                  activeApi={null}
                  onApiSelected={() => {}}
                />
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'all-signals' && (
        <div className="flex w-full overflow-hidden">
          <ModelApiList onApiClick={onApiClicked} readOnly={true} />
        </div>
      )}

      {tab === 'usp' && (
        <div className="w-full">
          <div className="w-full h-[240px] overflow-y-auto">
            <UspSeviceList
              services={activeModelUspSevices || []}
              onServiceSelected={setActiveService}
              activeService={activeService}
            />
          </div>
          <div className="w-full h-[calc(100vh-460px)] overflow-y-auto">
            {activeService && (
              <ServiceDetail
                service={activeService}
                hideImage={true}
                hideTitle={true}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'v2c' && (
        <div className="w-full">
          <div className="w-full h-[240px] overflow-y-auto">
            <V2CApiList
              apis={DEFAULT_V2C}
              activeApi={activeV2CApi}
              onApiSelected={setActiveV2CApi}
            />
          </div>
          <div className="w-full h-[calc(100vh-460px)] overflow-y-auto">
            <ApiDetail api={activeV2CApi} />
          </div>
        </div>
      )}
    </div>
  )
}

export default PrototypeTabCodeApiPanel
