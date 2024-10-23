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

interface ApiCodeBlockProps {
  apiName: string
  sampleLabel: string
}

const ApiCodeBlock = ({ apiName, sampleLabel }: ApiCodeBlockProps) => {
  return (
    <div className="flex flex-col">
      <DaCopy
        textToCopy={`await ${apiName}`}
        className="flex h-6 items-center w-fit mt-3"
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
          <span className="text-blue-600 font-mono">await</span> {apiName}
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
                apiName={activeApi.name + '.get()'}
                sampleLabel="Sample code to get signal value"
              />
            )}
            {['actuator'].includes(activeApi.type) && (
              <ApiCodeBlock
                apiName={activeApi.name + '.set(value)'}
                sampleLabel="Sample code to set signal value"
              />
            )}
            {['actuator', 'sensor'].includes(activeApi.type) && (
              <ApiCodeBlock
                apiName={activeApi.name + '.subscribe(function_name)'}
                sampleLabel="Sample code to subscribe signal value"
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
  const [tab, setTab] = useState<'used-signals' | 'all-signals'>('used-signals')
  const { data: model } = useCurrentModel()

  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  const [useApis, setUseApis] = useState<any[]>([])
  const [activeApi, setActiveApi] = useState<any>()
  const popupApi = useState<boolean>(false)

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

  const onApiClicked = (api: any) => {
    if (!api) return
    setActiveApi(api)
    popupApi[1](true)
  }

  return (
    <div className="flex flex-col w-full h-full">
      <DaPopup state={popupApi} width={'800px'} trigger={<span></span>}>
        <APIDetails
          activeApi={activeApi}
          requestCancel={() => {
            popupApi[1](false)
          }}
        />
      </DaPopup>

      <div className="flex justify-between border-b mx-3 mt-2">
        <div className="flex">
          <DaTabItem
            onClick={() => setTab('used-signals')}
            active={tab === 'used-signals'}
          >
            Used Signals
          </DaTabItem>
          <DaTabItem
            onClick={() => setTab('all-signals')}
            active={tab === 'all-signals'}
          >
            All Signals
          </DaTabItem>
        </div>
        <DaText
          variant="small-bold"
          className="text-da-primary-500 py-0.5 mr-1"
        >
          COVESA VSS {(model && model.api_version) ?? 'v4.1'}
        </DaText>
      </div>

      {tab === 'used-signals' && (
        <>
          {useApis && useApis.length > 0 ? (
            <div className="flex flex-col w-full h-full px-4 overflow-y-auto">
              <div className="flex flex-col w-full min-w-fit mt-2">
                {useApis.map((item: any, index: any) => (
                  <DaApiListItem
                    key={index}
                    api={item}
                    onClick={() => {
                      onApiClicked(item)
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="items-center flex-1 justify-center flex">
              <p className="text-da-gray-medium">No signals was used.</p>
            </div>
          )}
        </>
      )}

      {tab === 'all-signals' && (
        <div className="flex w-full overflow-hidden">
          <ModelApiList onApiClick={onApiClicked} readOnly={true} />
        </div>
      )}
    </div>
  )
}

export default PrototypeTabCodeApiPanel
