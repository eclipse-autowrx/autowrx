// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from "react";
import DaText from "../atoms/DaText";
import { DaButton } from "../atoms/DaButton";
import CodeEditor from "../molecules/CodeEditor";
import { TbDownload, TbSend, TbPlayerPlay, TbPlayerStop } from "react-icons/tb";

interface iPropTabConfig {
    kitId: string;
}

const TabConfig = ({ kitId }: iPropTabConfig) => {
    const [config, setConfig] = useState('{}');

    const handleLoadFromDevice = () => {
        const sampleConfig = {
            "version": "1.0.0",
            "deviceName": "My Awesome IoT Device",
            "firmware": "v2.3.1",
            "network": {
                "ip": "192.168.1.100",
                "mac": "00:1A:2B:3C:4D:5E"
            },
            "ssh": {
                "enabled": true,
                "autostart": true,
                "sshkey": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..."
            }
        };
        setConfig(JSON.stringify(sampleConfig, null, 4));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex space-x-2 mb-4">
                <div className="flex-grow" />
                <DaButton variant="outline" onClick={handleLoadFromDevice}>
                    <TbDownload size={20} className="mr-2" />
                    Load from device
                </DaButton>
                <DaButton variant="solid">
                    <TbSend size={20} className="mr-2" />
                    Set to device
                </DaButton>
            </div>
            <div className="flex-grow">
                <CodeEditor
                    code={config}
                    setCode={setConfig}
                    language="json"
                    editable={true}
                    onBlur={() => {}}
                />
            </div>
        </div>
    );
};

interface iPropTabVSS {
    kitId: string;
}

const TabVSS = ({ kitId }: iPropTabVSS) => {
    const [vss, setVss] = useState('{}');
    const [message, setMessage] = useState('');

    const handleLoadFromDevice = () => {
        setMessage('There are 29 signals in json file');
        const sampleVss = {
            "Vehicle": {
                "children": {
                    "ADAS": {
                        "children": {
                            "ABS": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ABS is enabled. True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "cad374fbfdc65df9b777508f04d5b073"
                                    },
                                    "IsEngaged": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ABS is currently regulating brake pressure. True = Engaged. False = Not Engaged.",
                                        "type": "sensor",
                                        "uuid": "6dd21979a2225e31940dc2ece1aa9a04"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        setVss(JSON.stringify(sampleVss, null, 4));
    };

    return (
        <div className="flex flex-col h-full">
            {message && <div className="p-2 mb-2 text-green-800 bg-green-100 border border-green-200 rounded-md">{message}</div>}
            <div className="flex space-x-2 mb-4">
                <div className="flex-grow" />
                <DaButton variant="outline" onClick={handleLoadFromDevice}>
                    <TbDownload size={20} className="mr-2" />
                    Load from device
                </DaButton>
                <DaButton variant="solid">
                    <TbSend size={20} className="mr-2" />
                    Set to device
                </DaButton>
            </div>
            <div className="flex-grow">
                <CodeEditor
                    code={vss}
                    setCode={setVss}
                    language="json"
                    editable={true}
                    onBlur={() => {}}
                />
            </div>
        </div>
    );
};

interface iPropTabMonitor {
    kitId: string;
}

const TabMonitor = ({ kitId }: iPropTabMonitor) => {
    const [processes, setProcesses] = useState([
        { name: 'Kuksa DataBroker', running: true },
        { name: 'VSS provider', running: false },
        { name: 'Velocitas App', running: true },
    ]);

    const toggleProcess = (index: number) => {
        const newProcesses = [...processes];
        newProcesses[index].running = !newProcesses[index].running;
        setProcesses(newProcesses);
    };

    return (
        <div className="flex flex-col h-full">
            {processes.map((process, index) => (
                <div key={index} className="flex items-center p-4 border-b border-da-gray-light">
                    <div className={`w-4 h-4 rounded-full mr-4 ${process.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="flex-grow text-da-gray-dark font-semibold">{process.name}</div>
                    <div className="flex space-x-2">
                        {process.running ? (
                            <DaButton variant="outline" onClick={() => toggleProcess(index)}>
                                <TbPlayerStop size={20} className="mr-2" />
                                Stop
                            </DaButton>
                        ) : (
                            <DaButton variant="solid" onClick={() => toggleProcess(index)}>
                                <TbPlayerPlay size={20} className="mr-2" />
                                Start
                            </DaButton>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

interface iPropFormHardwareKitManager {
    kitId: string;
    kitName: string;
    onCancel: () => void;
}

const FormHardwareKitManager = ({ kitId, kitName, onCancel }: iPropFormHardwareKitManager) => {
    const [activeTab, setActiveTab] = useState('Config');

    return (
        <div className="flex flex-col w-[80vw] h-[80vh] p-4 bg-white">
            <DaText variant="title" className="mb-4">Manage Hardware Kit: <b>{kitName}</b></DaText>
            <div className="flex border-b border-da-gray-medium">
                <div
                    className={`px-4 py-2 cursor-pointer text-lg font-semibold ${activeTab === 'Config' ? 'border-b-2 border-da-primary-500 text-da-primary-500' : 'text-da-gray-dark hover:text-da-primary-400'}`}
                    onClick={() => setActiveTab('Config')}
                >
                    Config
                </div>
                <div
                    className={`px-4 py-2 cursor-pointer text-lg font-semibold ${activeTab === 'VSS' ? 'border-b-2 border-da-primary-500 text-da-primary-500' : 'text-da-gray-dark hover:text-da-primary-400'}`}
                    onClick={() => setActiveTab('VSS')}
                >
                    VSS
                </div>
                <div
                    className={`px-4 py-2 cursor-pointer text-lg font-semibold ${activeTab === 'Monitor' ? 'border-b-2 border-da-primary-500 text-da-primary-500' : 'text-da-gray-dark hover:text-da-primary-400'}`}
                    onClick={() => setActiveTab('Monitor')}
                >
                    Monitor
                </div>
            </div>
            <div className="flex-grow mt-4 overflow-auto">
                {activeTab === 'Config' && <TabConfig kitId={kitId} />}
                {activeTab === 'VSS' && <TabVSS kitId={kitId} />}
                {activeTab === 'Monitor' && <TabMonitor kitId={kitId} />}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
                <DaButton className="w-32" variant="outline" onClick={onCancel}>
                    Close
                </DaButton>
            </div>
        </div>
    );
};

export default FormHardwareKitManager;
