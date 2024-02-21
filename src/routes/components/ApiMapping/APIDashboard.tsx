import React, { useState, useEffect } from "react";
import { TbPlus, TbFileExport, TbFileImport } from "react-icons/tb";
import MappingComponent from "./MappingComponent";
import Input from "../../../reusable/Input/Input";
import FileImport from "../../../reusable/FileImport";
import JSZip from "jszip";
import { saveAs } from "save-as";
import APIMappingKit from "./APIMappingKit";
import { useFetchApiList } from "./APIMappingFunctions";
import { Model } from "../../../apis/models";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";
import Button from "../../../reusable/Button";

interface APIDashboardProps {
    model: Model;
}

interface DeploymentConfig {
    ecuName: string;
    aliveMessageID: string;
    dbcFilename: string | undefined;
    mappingItems: any[]; // Define a more specific type if possible
}

interface MappingItem {
    id: string;
}

const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const APIDashboard = ({ model }: APIDashboardProps) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null); // State to hold the uploaded .dbc file
    const [mappings, setMappings] = useState<MappingItem[]>([{ id: generateUniqueId() }]);
    const [mappingData, setMappingData] = useState({}); // State to hold mapping data
    const [ecuName, setEcuName] = useState("");
    const [aliveMessageID, setAliveMessageID] = useState("");
    const [triggerDeploy, setTriggerDeploy] = useState(false);
    const [valid, setValid] = useState(true); // State to hold the validity of the dashboard-level inputs
    const { apiList } = useFetchApiList(model);
    const [mappingValidities, setMappingValidities] = useState({}); // State to hold the validity of each mapping
    const [canSignals, setCanSignals] = useState<string[]>([]); // Declare canSignals with string array type
    const [readyToDeployConfig, setReadyToDeployConfig] = useState<DeploymentConfig | null>(null); // State to hold the combined configuration for deployment
    const [justImported, setJustImported] = useState(false); // State to indicate if the user just imported a configuration
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [dbcName, setDbcName] = useState<string | undefined>(""); // State to hold the uploaded .dbc filename
    const [onReload, setOnReload] = useState(false); // State to disable edit when reload original config

    const handleImportButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Function to handle file upload
    const handleImport = (event) => {

        const file = event.target.files[0];
        if (!file) return;

        const zip = new JSZip();
        zip.loadAsync(file)
            .then((contents) => {
                setJustImported(true); // Set justImported to true to prevent mapping data from being overwritten
                // Extract and parse the config.json file
                const configPromise = contents.files["config.json"]
                    ? contents.files["config.json"].async("string").then(JSON.parse)
                    : Promise.resolve(null);

                // Extract the DBC file
                const dbcPromise = Promise.all(
                    Object.keys(contents.files)
                        .filter((filename) => filename.endsWith(".dbc"))
                        .map((filename) =>
                            contents.files[filename].async("blob").then((blob) => new File([blob], filename))
                        )
                );

                // Process both promises
                Promise.all([configPromise, dbcPromise])
                    .then(([config, dbcFiles]) => {
                        if (config) {
                            setEcuName(config.ecuName);
                            setAliveMessageID(config.aliveMessageID);
                            // Clear existing mappings and their validities
                            setMappings([]);
                            setMappingValidities({});
                            // Create mapping items based on the config data
                            const newMappings = config.mappingItems.map(() => ({ id: generateUniqueId() }));
                            setMappings(newMappings);
                            // console.log(config)
                            // Populate mappingData state based on the config data
                            const newMappingData = {};
                            newMappings.forEach((mapping, index) => {
                                const itemConfig = config.mappingItems[index];
                                newMappingData[mapping.id] = {
                                    vss: itemConfig.vss,
                                    canSignal: itemConfig.canSignal,
                                    mappingType: itemConfig.mappingType,
                                    canChannel: itemConfig.canChannel,
                                    dataType: itemConfig.dataType,
                                    isWishlist: itemConfig.isWishlist,
                                    isDeleted: itemConfig.isDeleted,
                                };
                            });
                            // console.log("import mapping data: ", newMappingData)
                            setMappingData(newMappingData);
                        }

                        // Set the first DBC file as the uploaded file
                        if (dbcFiles.length > 0) {
                            setUploadedFile(dbcFiles[0]);
                            setDbcName(dbcFiles[0].name);
                        }
                    })
                    .catch((error) => console.error("Error processing ZIP file", error));
            })
            .catch((error) => {
                console.error("Error reading ZIP file", error);
            });
        event.target.value = '';
    };

    const handleMappingDataChange = (id: string, data: any) => {
        if (!justImported) {
            setMappingData((prev) => ({ ...prev, [id]: data }));
        }
    };

    // Set justImported to false after 1 second after importing
    useEffect(() => {
        if (justImported) {
            const timeoutId = setTimeout(() => {
                setJustImported(false);
            }, 1000); // Delay of 1 second to prevent mapping data from being overwritten

            return () => clearTimeout(timeoutId);
        }
    }, [justImported, mappingData]);

    // Function to extract CAN signals from .dbc file content
    const extractCanSignals = (fileContent) => {
        const signals: string[] = []; // Specify the type for signals
        const regex = /SG_\s+(\w+)/g;
        let match;
        while ((match = regex.exec(fileContent)) !== null) {
            signals.push(match[1]);
        }
        return signals;
    };

    // Read .dbc file and extract CAN signals
    useEffect(() => {
        if (uploadedFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Check if the event target and its result property are not null
                if (e.target && e.target.result) {
                    const content = e.target.result;
                    setCanSignals(extractCanSignals(content.toString())); // Convert content to string
                }
            };
            reader.readAsText(uploadedFile);
        }
    }, [uploadedFile]);

    // Function to update the validity of an individual mapping
    const updateMappingValidity = (mappingId, isValid) => {
        setMappingValidities((prev) => ({ ...prev, [mappingId]: isValid }));
    };
    // Function to validate all inputs
    const validateDashboardInputs = () => {
        // Validate dashboard-level inputs
        const isDashboardValid = ecuName.trim() !== "" && aliveMessageID.trim() !== "";
        const isFileUploaded = uploadedFile !== null; // If file upload is mandatory

        // Validate each mapping
        const areAllMappingsValid = Object.values(mappingValidities).every(Boolean);
        //log all mappingValidities and its vss name
        // console.log("mappingValidities", mappingValidities)
        // console.log("mappings", mappings)
        // console.log("isDashboardValid", isDashboardValid, "isFileUploaded", isFileUploaded, "areAllMappingsValid", areAllMappingsValid)
        return isDashboardValid && isFileUploaded && areAllMappingsValid && mappings.length > 0;
    };

    // Update global valid state
    useEffect(() => {
        setValid(validateDashboardInputs());
    }, [ecuName, aliveMessageID, uploadedFile, mappingValidities, mappingData, mappings]);

    const addMapping = () => {
        const newId = generateUniqueId();
        setMappings((prev) => [...prev, { id: newId }]);
        setMappingData((prev) => ({ ...prev, [newId]: {} }));
    };

    const removeMapping = (idToRemove: string) => {
        setMappings((prev) => prev.filter((mapping) => mapping.id !== idToRemove));
        setMappingData((prev) => {
            const newData = { ...prev };
            delete newData[idToRemove];
            return newData;
        });
        // also remove mapping validity
        setMappingValidities((prev) => {
            const newValidities = { ...prev };
            delete newValidities[idToRemove];
            return newValidities;
        });
    };

    const exportConfiguration = async () => {
        // Directly construct the configuration object
        const configForExport = {
            ecuName: ecuName,
            aliveMessageID: aliveMessageID,
            dbcFilename: uploadedFile?.name,
            mappingItems: Object.values(mappingData),
        };

        const jsonConfigForExport = JSON.stringify(configForExport, null, 2);

        // Add JSON config to zip
        const zip = new JSZip();
        zip.file("config.json", jsonConfigForExport);
        if (uploadedFile) {
            zip.file(uploadedFile.name, uploadedFile);
        }
        // console.log("mappingData", mappingData)
        // console.log("jsonConfigForExport", jsonConfigForExport)
        // Generate zip and trigger download
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, "configuration.zip");
    };

    // Prepare the configuration for deployment when any of the direct sources change
    useEffect(() => {
        const newCombinedConfig: DeploymentConfig = {
            ecuName: ecuName,
            aliveMessageID: aliveMessageID,
            dbcFilename: uploadedFile?.name,
            mappingItems: Object.values(mappingData),
        };

        setReadyToDeployConfig(newCombinedConfig);
    }, [ecuName, aliveMessageID, uploadedFile, mappingData]);

    return (
        <div className="flex-col w-full h-full py-4 px-6 text-gray-700 text-sm whitespace-pre overflow-auto scroll-gray">
            <div className="flex-col w-full h-fit">
                <div className="flex font-bold text-base text-aiot-blue rounded px-2 py-1.5 bg-aiot-blue/5 mb-6 select-none">
                    Connection
                </div>
                <div className="flex w-full h-full pb-2">
                    <div className="flex flex-col w-1/2 h-full pb-4 items-center justify-center">
                        <img src="/imgs/DreamKit.png" className="flex w-1/3 h-1/3 pb-4 mr-1 select-none" />
                        <APIMappingKit
                            onDeploy={(value) => setTriggerDeploy(value)}
                            jsonConfig={readyToDeployConfig ? JSON.stringify(readyToDeployConfig, null, 2) : ""}
                            triggerDeploy={triggerDeploy}
                            uploadedFile={uploadedFile}
                            valid={valid}
                            onReloadOriginalConfig={setOnReload}
                        />
                    </div>
                    <div className="flex w-1/2 flex-col space-y-1 select-none">
                        <div className="flex font-bold text-base pb-1 text-gray-700">
                            VSS Version: <span className="font-normal ">3.0.0</span>
                        </div>
                        <div className="flex flex-col font-bold text-base pb-1 text-gray-700">
                            CAN Information
                            <div className="flex flex-col pl-6 pt-1 space-y-1.5 text-xs">
                                <p>
                                    CAN 0: <span className="font-normal">Classic CAN - 500Kbps</span>
                                </p>
                                <p>
                                    CAN 1: <span className="font-normal">ISO CAN FD - 500Kbps/2Mbps</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {
                <div
                    className={`flex w-full ${onReload ? "opacity-50 select-none pointer-events-none" : "opacity-100"}`}
                >
                    <div className="flex flex-col w-full h-auto">
                        <div className="flex text-base font-bold text-aiot-blue rounded px-2 py-1.5 bg-aiot-blue/5 mb-4 justify-between select-none">
                            Configuration
                        </div>
                        <div className="flex flex-col w-full h-full pb-4">
                            <div className="flex w-full h-fit items-center pb-4 px-2">
                                <FileImport
                                    onFileChange={(file) => setUploadedFile(file)}
                                    importFileName={dbcName}
                                    placeholderText="Drag a .dbc here or click to upload"
                                />
                            </div>
                            <div className="grid grid-cols-5 gap-2 items-center w-full space-y-1 font-bold">
                                <div className="col-span-1 ml-2 font-bold">ECU Name:</div>
                                <div className="col-span-4 font-normal">
                                    <Input
                                        state={[ecuName, setEcuName]}
                                        containerClassName="h-5 bg-white max-w-[24rem]"
                                        placeholder="Ultrasonic ECU"
                                    />
                                </div>
                                <div className="col-span-1 ml-2 font-bold">Alive Message ID:</div>
                                <div className="col-span-4 font-normal">
                                    <Input
                                        state={[aliveMessageID, setAliveMessageID]}
                                        containerClassName="h-5 bg-white max-w-[24rem]"
                                        placeholder="0x123"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex text-base font-bold text-aiot-blue rounded px-2 py-1.5 bg-aiot-blue/5 mb-4 items-center justify-between select-none">
                            Mapping
                            <span className="font-normal">
                                <GeneralTooltip className="" content="Import Configuration" delay={400} space={15}>
                                    <Button
                                        className="flex w-full !py-0.5 text-aiot-blue mr-1 hover:bg-aiot-blue/10"
                                        variant="custom"
                                        onClick={handleImportButtonClick}
                                        icon={TbFileImport}
                                    >
                                        Import
                                    </Button>
                                </GeneralTooltip>
                            </span>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".zip"
                            style={{ display: "none" }}
                        />

                        {mappings.map((mapping, index) => (
                            <MappingComponent
                                key={mapping.id}
                                id={mapping.id}
                                index={index} // Pass the index here
                                onDelete={() => removeMapping(mapping.id)}
                                onDataChange={handleMappingDataChange}
                                data={mappingData[mapping.id] || {}}
                                apiList={apiList}
                                onValidityChange={updateMappingValidity}
                                dbc={canSignals}
                                justImported={justImported}
                            />
                        ))}
                        <Button className="mt-2 h-8 w-full" variant="white" onClick={addMapping} icon={TbPlus}>
                            Add Mapping
                        </Button>
                        {valid ? (
                            <Button
                                className="mt-2 h-8"
                                variant="blue"
                                onClick={exportConfiguration}
                                icon={TbFileExport}
                            >
                                Export Configuration
                            </Button>
                        ) : (
                            <div className="flex w-full justify-center mt-4 text-gray-600 select-none">
                                You need to upload .dbc file and fill all the fields to export configuration
                            </div>
                        )}
                    </div>
                </div>
            }
        </div>
    );
};

export default APIDashboard;
