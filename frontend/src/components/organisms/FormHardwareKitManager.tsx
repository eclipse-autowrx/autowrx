// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import config from '@/configs/config'
import { useEffect, useRef, useState } from 'react'
import {
    TbDownload,
    TbLoader,
    TbSend
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import DaTabItem from '@/components/atoms/DaTabItem'
import CodeEditor from '@/components/molecules/CodeEditor'
import DaRuntimeConnector from '@/components/molecules/DaRuntimeConnector'

interface iPropTabConfig {
    hidden?: boolean
    edgeConfig?: any
    sendConfigToDevice?: (config: string) => void
    requestReadConfigFromDevice?: () => void
}

const TabConfig = ({
    hidden,
    edgeConfig,
    sendConfigToDevice,
    requestReadConfigFromDevice,
}: iPropTabConfig) => {
    const [configContent, setConfigContent] = useState('')
    const [loadingFromDevice, setLoadingFromDevice] = useState(false)
    const [settingToDevice, setSettingToDevice] = useState(false)

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
            setSettingToDevice(true)
            sendConfigToDevice(configContent)
            setTimeout(() => {
                setSettingToDevice(false)
            }, 3000)
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
                    onBlur={() => { }}
                />
            </div>
        </div>
    )
}

interface iPropTabVSS {
    hidden?: boolean
    edgeVss?: any
    sendVssToDevice?: (vss: string) => void
    requestReadVssFromDevice?: () => void
}

const TabVSS = ({
    hidden,
    edgeVss,
    sendVssToDevice,
    requestReadVssFromDevice,
}: iPropTabVSS) => {
    const [vss, setVss] = useState('')
    const [loadingFromDevice, setLoadingFromDevice] = useState(false)
    const [settingToDevice, setSettingToDevice] = useState(false)

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
            setSettingToDevice(true)
            sendVssToDevice(vss)
            setTimeout(() => {
                setSettingToDevice(false)
            }, 3000)
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
                    onBlur={() => { }}
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
    kitId,
    kitName,
    onCancel,
}: iPropFormHardwareKitManager) => {
    const [activeTab, setActiveTab] = useState('Config')
    const [edgeConfig, setEdgeConfig] = useState<any>(null)
    const [edgeVss, setEdgeVss] = useState<any>(null)
    const runTimeRef = useRef<any>()

    const CONFIG_PATH = '/app/remote_access/signal-config.json'
    const VSS_PATH = '/app/remote_access/vss.json'

    const writeFile = (filePath: string, fileContent: string) => {
        runTimeRef.current?.writeFile(filePath, fileContent)
    }

    const triggerRebuildVehicleModel = (vss: string) => {
        console.log('triggerRebuildVehicleModel')
        runTimeRef.current?.builldVehicleModel(vss)
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
                    kitServerUrl={config?.runtime?.url}
                    ref={runTimeRef}
                    usedAPIs={[]}
                    onActiveRtChanged={() => { }}
                    onLoadedMockSignals={() => { }}
                    onNewLog={() => { }}
                    onAppRunningStateChanged={() => { }}
                    onRuntimeInfoReceived={() => { }}
                    onReadFileResponse={onReadFileResponse}
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
                    edgeConfig={edgeConfig}
                    sendConfigToDevice={(cfg) => writeFile(CONFIG_PATH, cfg)}
                    requestReadConfigFromDevice={() => readFile(CONFIG_PATH)}
                />
                <TabVSS
                    hidden={activeTab !== 'VSS'}
                    edgeVss={edgeVss}
                    sendVssToDevice={(vss: string) => {
                        writeFile(VSS_PATH, vss)
                        setTimeout(() => {
                            triggerRebuildVehicleModel(vss)
                        }, 3000)
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
