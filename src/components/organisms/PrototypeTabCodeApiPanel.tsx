import { FC, useState, useEffect } from 'react'
import DaPopup from '../atoms/DaPopup'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { DaText } from '../atoms/DaText'
import { DaApiListItem } from '../molecules/DaApiList'
import ModelApiList from './ModelApiList'
import { TbCopy } from 'react-icons/tb'
import { getApiTypeClasses } from '@/lib/utils'
import { DaCopy } from '../atoms/DaCopy'

interface ApiCodeBlockProps {
  apiName: string
  sampleLabel: string
}

const ApiCodeBlock = ({ apiName, sampleLabel }: ApiCodeBlockProps) => {
  const [code, setCode] = useState<any>(null)
  useEffect(() => {
    setCode(`await v${apiName.substring(1)}`)
  }, [apiName])
  return (
    <div className="flex flex-col">
      <DaCopy textToCopy={code} className="items-center w-fit pt-3">
        <div className="flex w-full items-center">
          <DaText
            variant="regular-bold"
            className="w-fit shrink-0 text-da-gray-medium"
          >
            Sample code to subscribe API value
          </DaText>
        </div>
      </DaCopy>

      <div className="flex flex-wrap w-full min-w-fit px-3 py-3 mt-2 bg-gray-100 rounded justify-between">
        <DaText
          variant="regular"
          className="w-full font-mono whitespace-pre-line"
        >
          {code}
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
          <div className="flex py-1 items-center da-label-sub-title border-b border-da-gray-light justify-between">
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
            {['actuator', 'sensor'].includes(activeApi.type) && (
              <ApiCodeBlock
                apiName={activeApi.name + '.get()'}
                sampleLabel="Sample code to get API value"
              />
            )}
            {['actuator'].includes(activeApi.type) && (
              <ApiCodeBlock
                apiName={activeApi.name + '.set(value)'}
                sampleLabel="Sample code to set API value"
              />
            )}
            {['actuator', 'sensor'].includes(activeApi.type) && (
              <ApiCodeBlock
                apiName={activeApi.name + '.subscribe(function_name)'}
                sampleLabel="Sample code to subscribe API value"
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
      <DaText variant="regular-bold" className="px-4 mt-2">
        Used Signals({useApis.length})
      </DaText>
      {useApis && useApis.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-col w-full px-4">
            <div className="max-h-[150px] mt-2 overflow-y-auto scroll">
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
        </div>
      )}
      <DaText variant="regular-bold" className="px-4">
        All Signals
      </DaText>
      <div className="flex w-full min-h-[300px] overflow-hidden">
        <ModelApiList onApiClick={onApiClicked} readOnly={true} />
      </div>
    </div>
  )
}

export default PrototypeTabCodeApiPanel
