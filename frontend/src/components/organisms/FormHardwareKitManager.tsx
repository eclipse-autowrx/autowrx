// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useSiteConfig } from '@/utils/siteConfig'
import { useEffect, useRef, useState } from 'react'
import { TbDownload, TbLoader, TbSend } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import DaTabItem from '@/components/atoms/DaTabItem'
import CodeEditor from '@/components/molecules/CodeEditor'
import DaRuntimeConnector from '@/components/molecules/DaRuntimeConnector'
import { toast } from 'react-toastify'
import { validateVss } from '@/services/model.service'
import type { BuildModelReply, WriteFileReply } from '@/utils/kitReply'

const WRITE_REPLY_TIMEOUT_MS = 10000
// Rebuilding restarts the databroker and the mock service, which takes longer.
const BUILD_REPLY_TIMEOUT_MS = 60000

interface iPropTabConfig {
  hidden?: boolean
  settingToDevice: boolean
  edgeConfig?: any
  sendConfigToDevice?: (config: string) => void
  requestReadConfigFromDevice?: () => void
}

const TabConfig = ({
  hidden,
  settingToDevice,
  edgeConfig,
  sendConfigToDevice,
  requestReadConfigFromDevice,
}: iPropTabConfig) => {
  const [configContent, setConfigContent] = useState('')
  const [loadingFromDevice, setLoadingFromDevice] = useState(false)

  useEffect(() => {
    if (edgeConfig && edgeConfig !== configContent) {
      setConfigContent(edgeConfig)
    }
  }, [edgeConfig])

  const handleLoadFromDevice = () => {
    if (requestReadConfigFromDevice) {
      setLoadingFromDevice(true)
      requestReadConfigFromDevice()
      setTimeout(() => {
        setLoadingFromDevice(false)
      }, 3000)
    }
  }

  const handleSetToDevice = () => {
    if (sendConfigToDevice) {
      sendConfigToDevice(configContent)
    }
  }

  return (
    <div className={`${hidden ? 'hidden' : 'flex flex-col'} h-full`}>
      <div className="flex space-x-2 mb-4">
        <div className="grow" />
        <Button
          variant="outline"
          onClick={handleLoadFromDevice}
          disabled={loadingFromDevice || settingToDevice}
        >
          {loadingFromDevice ? (
            <TbLoader size={20} className="mr-2 animate-spin" />
          ) : (
            <TbDownload size={20} className="mr-2" />
          )}
          {loadingFromDevice ? 'Loading...' : 'Load from device'}
        </Button>
        <Button
          onClick={handleSetToDevice}
          disabled={loadingFromDevice || settingToDevice}
        >
          {settingToDevice ? (
            <TbLoader size={20} className="mr-2 animate-spin" />
          ) : (
            <TbSend size={20} className="mr-2" />
          )}
          {settingToDevice ? 'Setting...' : 'Set to device'}
        </Button>
      </div>
      <div className="grow">
        <CodeEditor
          code={configContent}
          setCode={setConfigContent}
          language="json"
          editable={true}
          onBlur={() => {}}
        />
      </div>
    </div>
  )
}

interface iPropTabVSS {
  hidden?: boolean
  settingToDevice: boolean
  edgeVss?: any
  sendVssToDevice?: (vss: string) => void
  requestReadVssFromDevice?: () => void
}

const TabVSS = ({
  hidden,
  settingToDevice,
  edgeVss,
  sendVssToDevice,
  requestReadVssFromDevice,
}: iPropTabVSS) => {
  const [vss, setVss] = useState('')
  const [loadingFromDevice, setLoadingFromDevice] = useState(false)

  useEffect(() => {
    if (edgeVss && edgeVss !== vss) {
      setVss(edgeVss)
    }
  }, [edgeVss])

  const handleLoadFromDevice = () => {
    if (requestReadVssFromDevice) {
      setLoadingFromDevice(true)
      requestReadVssFromDevice()
      setTimeout(() => {
        setLoadingFromDevice(false)
      }, 3000)
    }
  }

  const handleSetToDevice = () => {
    if (sendVssToDevice) {
      sendVssToDevice(vss)
    }
  }

  return (
    <div className={`${hidden ? 'hidden' : 'flex flex-col'} h-full`}>
      <div className="flex space-x-2 mb-4">
        <div className="grow" />
        <Button
          variant="outline"
          onClick={handleLoadFromDevice}
          disabled={loadingFromDevice || settingToDevice}
        >
          {loadingFromDevice ? (
            <TbLoader size={20} className="mr-2 animate-spin" />
          ) : (
            <TbDownload size={20} className="mr-2" />
          )}
          {loadingFromDevice ? 'Loading...' : 'Load from device'}
        </Button>
        <Button
          onClick={handleSetToDevice}
          disabled={loadingFromDevice || settingToDevice}
        >
          {settingToDevice ? (
            <TbLoader size={20} className="mr-2 animate-spin" />
          ) : (
            <TbSend size={20} className="mr-2" />
          )}
          {settingToDevice ? 'Setting...' : 'Set to device'}
        </Button>
      </div>
      <div className="grow">
        <CodeEditor
          code={vss}
          setCode={setVss}
          language="json"
          editable={true}
          onBlur={() => {}}
        />
      </div>
    </div>
  )
}

interface iPropFormHardwareKitManager {
  kitId: string
  kitName: string
  onCancel: () => void
}

const FormHardwareKitManager = ({
  kitName,
  onCancel,
}: iPropFormHardwareKitManager) => {
  const [activeTab, setActiveTab] = useState('Config')
  const [edgeConfig, setEdgeConfig] = useState<any>(null)
  const [edgeVss, setEdgeVss] = useState<any>(null)
  const runTimeRef = useRef<any>()
  const runtimeServerUrl = useSiteConfig('RUNTIME_SERVER_URL')

  const CONFIG_PATH = '/app/remote_access/signal-config.json'
  const VSS_PATH = '/app/remote_access/vss.json'

  const [settingToDevice, setSettingToDevice] = useState(false)
  const writeTimerRef = useRef<ReturnType<typeof setTimeout>>()
  // VSS waiting to be rebuilt once its file is written.
  const pendingVssRef = useRef<string | null>(null)
  const rebuildingRef = useRef(false)
  useEffect(() => () => clearTimeout(writeTimerRef.current), [])

  const finishSetting = () => {
    clearTimeout(writeTimerRef.current)
    pendingVssRef.current = null
    rebuildingRef.current = false
    setSettingToDevice(false)
  }

  const writeFile = (filePath: string, fileContent: string, vss?: string) => {
    runTimeRef.current?.writeFile(filePath, fileContent)
    setSettingToDevice(true)
    pendingVssRef.current = vss ?? null
    rebuildingRef.current = false
    clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      const pendingVss = pendingVssRef.current
      // Not an error: older kits save the file without replying.
      toast.warning(
        'No reply from the device. The file may not have been saved.',
      )
      if (pendingVss !== null) triggerRebuildVehicleModel(pendingVss)
      else finishSetting()
    }, WRITE_REPLY_TIMEOUT_MS)
  }

  const onWriteFileResponse = (reply: WriteFileReply) => {
    if (rebuildingRef.current) return
    const pendingVss = pendingVssRef.current
    if (reply.hasError) {
      finishSetting()
      toast.error(`WRITE_FILE ERROR: ${reply.error}`)
      return
    }
    const fileName = reply.filePath.split('/').pop() || 'File'
    toast.success(`${fileName} saved to the device`)
    if (pendingVss !== null) triggerRebuildVehicleModel(pendingVss)
    else finishSetting()
  }

  const triggerRebuildVehicleModel = (vss: string) => {
    pendingVssRef.current = null
    rebuildingRef.current = true
    setSettingToDevice(true)
    clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      finishSetting()
      toast.warning(
        'The device did not report the result of the vehicle model rebuild.',
      )
    }, BUILD_REPLY_TIMEOUT_MS)
    toast.info('Rebuilding the vehicle model on the device...')
    void runTimeRef.current?.builldVehicleModel(vss).catch((error: Error) => {
      finishSetting()
      toast.error(error.message)
    })
  }

  const onBuildModelResponse = (reply: BuildModelReply) => {
    // Kits without a prototype get both command spellings; take the first reply.
    if (!rebuildingRef.current) return
    finishSetting()
    if (reply.hasError) {
      toast.error(
        `Vehicle model rebuild failed: ${reply.message || 'no details'}`,
      )
      return
    }
    toast.success('Vehicle model rebuilt on the device')
  }

  const readFile = (filePath: string) => {
    runTimeRef.current?.readFile(filePath)
  }

  const activeTabRef = useRef(activeTab)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  const onReadFileResponse = (filePath: string, fileContent: string) => {
    const currentTab = activeTabRef.current
    if (currentTab === 'Config') {
      setEdgeConfig(fileContent)
    }
    if (currentTab === 'VSS') {
      setEdgeVss(fileContent)
    }
  }

  return (
    <div className="flex flex-col h-[80vh] p-4 bg-background w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-foreground">
          Manage Hardware Kit: <span className="font-bold">{kitName}</span>
        </h2>
        <DaRuntimeConnector
          isDeployMode={true}
          targetPrefix={['Kit-', 'PilotCar-']}
          kitServerUrl={runtimeServerUrl}
          ref={runTimeRef}
          forceKitId={kitName}
          usedAPIs={[]}
          onActiveRtChanged={() => {}}
          onLoadedMockSignals={() => {}}
          onNewLog={() => {}}
          onError={(error: string) => {
            toast.error(error)
          }}
          onAppRunningStateChanged={() => {}}
          onRuntimeInfoReceived={() => {}}
          onReadFileResponse={onReadFileResponse}
          onWriteFileResponse={onWriteFileResponse}
          onBuildModelResponse={onBuildModelResponse}
        />
      </div>

      <div className="flex border-b border-border">
        {['Config', 'VSS'].map((tab) => (
          <DaTabItem
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </DaTabItem>
        ))}
      </div>

      <div className="grow mt-4 overflow-auto">
        <TabConfig
          hidden={activeTab !== 'Config'}
          settingToDevice={settingToDevice}
          edgeConfig={edgeConfig}
          sendConfigToDevice={(cfg) => writeFile(CONFIG_PATH, cfg)}
          requestReadConfigFromDevice={() => readFile(CONFIG_PATH)}
        />
        <TabVSS
          hidden={activeTab !== 'VSS'}
          settingToDevice={settingToDevice}
          edgeVss={edgeVss}
          sendVssToDevice={async (vss: string) => {
            try {
              await validateVss(vss)
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Unable to validate VSS',
              )
              return
            }
            writeFile(VSS_PATH, vss, vss)
          }}
          requestReadVssFromDevice={() => readFile(VSS_PATH)}
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button className="w-32" variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  )
}

export default FormHardwareKitManager
