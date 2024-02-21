import React, { useState, useEffect } from "react";
import Input from "../../../reusable/Input/Input";
import CustomSelect from "../../../reusable/ReportTools/CustomSelect";
import { TbX, TbCheck } from "react-icons/tb";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";
import CustomCheckBox from "../../../reusable/CustomCheckBox";

interface MappingComponentProps {
    onDelete: (id: string) => void;
    id: string;
    index: number;
    onDataChange: (id: string, data: any) => void;
    data: any;
    apiList: any[];
    onValidityChange: (id: string, isValid: boolean) => void;
    dbc: string[];
    justImported: boolean;
}

const MappingComponent: React.FC<MappingComponentProps> = ({
    onDelete,
    id,
    onDataChange,
    data,
    apiList,
    onValidityChange,
    dbc,
    index,
    justImported,
}) => {
    const channel_options = [
        { value: "can0", label: "CAN 0" },
        { value: "can1", label: "CAN 1" },
    ];

    const mappingType_options = [
        { value: "dbc2vss", label: "DBC2VSS" },
        { value: "vss2dbc", label: "VSS2DBC" },
    ];
    const [canSignal, setCanSignal] = useState(data.canSignal || "");
    const [mappingType, setSelectedMappingType] = useState(data.mappingType || mappingType_options[0].value);
    const [canChannel, setSelectedChannel] = useState(data.canChannel || channel_options[0].value);
    const [vss, setVssAPI] = useState(data.vss || "");
    // Initialize other states similarly

    const [isCanSignalValid, setIsCanSignalValid] = useState(true);
    const [dataType, setApiDataType] = useState("");
    const [isWishlist, setApiIsWishlist] = useState(false);
    const [isVssApiValid, setIsVssApiValid] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isVssAPiBranch, setIsVssAPiBranch] = useState(false);

    useEffect(() => {
        if (justImported) {
            setCanSignal(data.canSignal || "");
            setSelectedMappingType(data.mappingType || mappingType_options[0].value);
            setSelectedChannel(data.canChannel || channel_options[0].value);
            setVssAPI(data.vss || "");
            setApiDataType(data.dataType || "");
            setApiIsWishlist(data.isWishlist || false);
            setIsDeleted(data.isDeleted || false);
            // console.log("just imported", data);
        }
    }, [justImported, data]); // During import 1s hold, pass data to mapping items else dont pass

    // Determine if the current data is valid based on the apiList
    useEffect(() => {
        const selectedApi = apiList.find((api) => api.name === vss);
        if (selectedApi) {
            setApiDataType(selectedApi.datatype || "N/A");
            setApiIsWishlist(!!selectedApi.isWishlist);
        } else {
            setApiDataType("");
            setApiIsWishlist(false);
        }
    }, [vss, apiList]);

    const handleDataChange = () => {
        onDataChange(id, {
            vss: vss,
            dataType: dataType,
            isWishlist: isWishlist,
            mappingType: mappingType,
            canSignal: canSignal,
            canChannel: canChannel,
            isDeleted: isDeleted,
        });
    };

    useEffect(() => {
        handleDataChange();
    }, [canChannel, mappingType, vss, canSignal, dataType, isDeleted]);

    const onChannelChange = (value: string | undefined) => {
        if (value !== undefined) {
            setSelectedChannel(value);
        } else {
            // Handle the undefined case, perhaps by setting a default value
            setSelectedChannel(channel_options[0].value);
        }
    };

    const onMappingTypeChange = (value: string | undefined) => {
        if (value !== undefined) {
            setSelectedMappingType(value);
        } else {
            setSelectedMappingType(mappingType_options[0].value);
        }
    };

    // Update validation logic
    const validateMapping = () => {
        let isVssAPIValid = vss?.trim() !== "" && apiList.some((api) => api.name === vss); // Prevent empty and wrong API name

        // Prevent API type = branch
        let isVssAPIBranch = apiList.some((api) => api.name === vss && api.type === "branch");

        let isCanSignalValid = true;
        if (canSignal.trim() !== "") {
            isCanSignalValid = dbc.includes(canSignal); // allow empty to delete mapping but if exist check for valid can signal
        }
        const isSelectedChannelValid = canChannel?.trim() !== ""; // Prevent empty channel
        setIsVssAPiBranch(isVssAPIBranch);
        setIsVssApiValid(isVssAPIValid);
        setIsCanSignalValid(isCanSignalValid);
        // console.log('isVssAPIValid', isVssAPIValid, 'isCanSignalValid', isCanSignalValid, 'isSelectedChannelValid', isSelectedChannelValid)
        // console.log("isVssAPIBranch", isVssAPIBranch)
        const isAllFieldsValid = isVssAPIValid && isCanSignalValid && isSelectedChannelValid && !isVssAPIBranch;
        onValidityChange(id, isAllFieldsValid);
    };

    useEffect(() => {
        validateMapping();
    }, [apiList, data, dbc]);

    return (
        <div className="grid grid-cols-5 gap-2 items-center w-full rounded border shadow-sm px-2 pb-2 relative mb-2 text-gay-600">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => onDelete(id)}>
                <TbX size={20} />
            </button>
            <GeneralTooltip content="Delete this API mapping on dreamKIT" delay={100} space={15}>
                <div className="absolute bottom-2 right-2 flex items-center text-gray-600">
                    <CustomCheckBox
                        isChecked={isDeleted}
                        onToggle={setIsDeleted}
                        label="Delete Mapping"
                        colorVariant="red"
                        iconClassName="w-4 h-4"
                    />
                </div>
            </GeneralTooltip>
            <div className="col-span-5 flex items-center font-bold text-aiot-blue">
                <div className="flex ml-2 mr-1 font-normal text-gray-400">#{index + 1}</div>
                <CustomSelect
                    options={mappingType_options}
                    customStyle="text-aiot-blue px-1 py-1 rounded border border-transparent text-gray-500 shadow-none hover:border-gray-300 text-sm w-48"
                    customDropdownItemStyle="font-normal text-sm"
                    selectedValue={mappingType}
                    onValueChange={(value) => {
                        if (typeof value === "string" || typeof value === "undefined") {
                            onMappingTypeChange(value);
                        }
                    }}
                />
            </div>

            <div className="col-span-1 ml-2 font-bold">CAN Signal:</div>
            <div className="col-span-4 flex items-center">
                <Input containerClassName="h-5 bg-white max-w-[24rem]" state={[canSignal, setCanSignal]} />
                {canSignal.trim() !== "" &&
                    (isCanSignalValid ? (
                        <TbCheck className="ml-1" color="green" />
                    ) : (
                        <TbX className="ml-1" color="red" />
                    ))}
            </div>

            <div className="col-span-1 ml-2 font-bold">VSS API:</div>
            <div className="col-span-4 flex items-center">
                <Input containerClassName="h-5 bg-white max-w-[24rem]" state={[vss, setVssAPI]} />
                {vss && (
                    <>
                        {isVssApiValid && !isVssAPiBranch ? (
                            <TbCheck className="ml-1" color="green" />
                        ) : (
                            <TbX className="ml-1" color="red" />
                        )}
                        <span className="ml-2 text-sm text-gray-400" style={{ opacity: 0.75 }}>
                            {`${!isVssAPiBranch ? `Data type: ${dataType}` : "You cannot map to a branch API"}`}
                        </span>
                    </>
                )}
            </div>

            <div className="col-span-1 ml-2 font-bold">CAN Channel:</div>
            <div className="col-span-4">
                <CustomSelect
                    options={channel_options}
                    customStyle="min-h-[26px] pl-1 border border-gray-200 shadow-none"
                    customDropdownItemStyle="min-w-[1rem]"
                    selectedValue={canChannel}
                    onValueChange={(value) => {
                        if (typeof value === "string" || typeof value === "undefined") {
                            onChannelChange(value);
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default MappingComponent;
