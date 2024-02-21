import React, { useEffect, useState, useRef } from "react";
import CustomInput from "../../../reusable/Input/CustomInput";
import { TbChevronDown, TbPlus, TbSearch, TbUpload, TbX } from "react-icons/tb";
import Button from "../../../reusable/Button";
import { useCurrentModelPermissions } from "../../../permissions/hooks";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import CustomModal from "../../../reusable/Popup/CustomModal";
import { AddOn, Model } from "../../../apis/models";
import InputContainer from "../../../reusable/Input/InputContainer";
import { REFS } from "../../../apis/firebase";
import { Timestamp, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import UserProfile from "../PrototypeOverview/UserProfile";
import AddOnDetail from "./AddOnDetail";
import CustomAutoComplete from "../../../reusable/CustomAutoComplete";

const ModelAddOns = () => {
    const modelPermissions = useCurrentModelPermissions();
    const model = useCurrentModel() as Model;
    const { profile } = useCurrentUser();

    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    // Add-on search string
    const [renderedAddOns, setRenderedAddOns] = useState<AddOn[]>([]);

    const [searchStringState, setSearchStringState] = useState("");

    const [isNewAddOnModalOpen, setIsNewAddOnModalOpen] = useState(false);

    // Individual state hooks for each input field
    const [type, setType] = useState<AddOn["type"]>("GenAI_Widget");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [version, setVersion] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private">("private");
    const [apiKey, setApiKey] = useState("");
    const [endpointUrl, setEndpointUrl] = useState("");
    const [isValid, setIsValid] = useState(false); // None of the fields are empty
    const [loading, setLoading] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);

    const addOnTypeOptions = [
        { key: "GenAI_Widget", value: "GenAI_Widget" },
        { key: "GenAI_Python", value: "GenAI_Python" },
        { key: "GenAI_Dashboard", value: "GenAI_Dashboard" },
    ];

    // Check the search string against the add-on name
    useEffect(() => {
        setRenderedAddOns(
            addOns.filter((addOn) => {
                return addOn.name.toLowerCase().includes(searchStringState.toLowerCase());
            })
        );
    }, [searchStringState, addOns]);

    // Wrapper function that takes a string, checks if it's one of the allowed types, and then calls setType
    const handleTypeChange = (value: string) => {
        if (addOnTypeOptions.some((type) => type.key === value)) {
            setType(value as AddOn["type"]);
        } else {
            console.error("Invalid type value:", value);
        }
    };

    // Check if all input fields are filled
    useEffect(() => {
        if (type && name && apiKey && endpointUrl) {
            setIsValid(true);
            console.log("valid");
        } else {
            setIsValid(false);
        }
    }, [type, name, description, version, visibility, apiKey, endpointUrl]);

    // Function create add-on on Firebase
    const createAddOn = async () => {
        if (!model || !profile) return;

        const docRef = doc(REFS.addOns);
        // Create new add-on object
        const newAddOn: AddOn = {
            id: docRef.id,
            model_id: model.id,
            type: type,
            name: name,
            description: description,
            version: version,
            visibility: visibility,
            apiKey: apiKey,
            endpointUrl: endpointUrl,
            image_file: "",
            createdAt: Timestamp.now(),
            createdBy: profile.uid,
        };
        // Add new add-on to Firebase
        if (isValid) {
            setLoading(true);
            try {
                await setDoc(docRef, newAddOn);
                console.log("Add-on created successfully");
            } catch (err) {
                console.log("Error creating add-on");
                console.log(err);
            }
            setLoading(false);
            // Reload page
            fetchAddOns();
            setIsNewAddOnModalOpen(false);
            setApiKey("");
            setEndpointUrl("");
            setDescription("");
            setName("");
        } else {
            console.log("Invalid input");
        }
    };

    // Function fetch add-ons from Firebase
    const fetchAddOns = async () => {
        if (!model) return;
        const addOnsQuery = query(REFS.addOns, where("model_id", "==", model.id));
        const querySnapshot = await getDocs(addOnsQuery);
        const addOns: AddOn[] = [];
        querySnapshot.forEach((doc) => {
            addOns.push(doc.data() as AddOn);
        });
        setAddOns(addOns);
        setSelectedAddOn(addOns.find((addOn) => addOn.id === selectedAddOn?.id) || addOns[0]); // Keep the same add-on selected
    };

    useEffect(() => {
        fetchAddOns();
    }, [model]);

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex w-full h-11 bg-gray-50 items-center">
                <div className="text-base text-aiot-blue pl-4 font-bold select-none">Add-Ons</div>
            </div>
            <div className="flex w-full h-full" style={{ height: "calc(100% - 42px)" }}>
                <div className="flex flex-col h-full w-full max-w-[350px] shrink-0 border-r pt-1">
                    <div className="flex w-full items-center">
                        <div className="pl-2 w-full pr-2">
                            <CustomInput
                                className="text-gray-600 text-sm placeholder-gray-500 "
                                containerClassName="bg-white border-gray-300 !pl-1 my-2"
                                state={[searchStringState, setSearchStringState]}
                                placeholder="Search add-ons"
                                iconBefore
                                Icon={TbSearch}
                                iconClass="w-5 h-5 text-gray-600"
                            />
                        </div>
                    </div>
                    <div className="flex h-full overflow-y-auto">
                        <div className="flex flex-col w-full h-full overflow-x-hidden pt-1  scroll-gray">
                            {renderedAddOns.map((addOn) => (
                                <div
                                    key={addOn.id}
                                    className={`flex items-center w-full h-fittext-sm text-gray-600 cursor-pointer border-l-4 ${
                                        selectedAddOn?.id === addOn.id
                                            ? "bg-slate-100 border-aiot-blue"
                                            : " border-transparent"
                                    }`}
                                    onClick={() => {
                                        setSelectedAddOn(addOn);
                                    }}
                                >
                                    <div className="flex flex-col w-full h-fit pl-2 pr-2 pt-2 pb-1 items-center border-b border-gray-200">
                                        <div className="flex flex-col w-full p-2 mb-3">
                                            <div
                                                className={`flex items-center w-full text-base font-bold pb-2 ${
                                                    selectedAddOn?.id === addOn.id && "text-aiot-blue"
                                                } `}
                                            >
                                                <div className="flex w-full items-center flex-wrap">
                                                    <div className="flex text-wrap mr-2">{addOn.name}</div>
                                                    <div className="flex min-w-fit">
                                                        <div className="flex px-1 items-center h-5 text-[9px] bg-aiot-blue/5 text-aiot-blue rounded">
                                                            {addOn.type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <UserProfile user_uid={addOn.createdBy||''} clickable={false} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex w-full items-center mt-2 text-sm">
                        {modelPermissions.canEdit() && (
                            <div className="flex w-full px-2">
                                <Button
                                    variant="white"
                                    className="px-4 mx-2"
                                    icon={TbPlus}
                                    onClick={() => {
                                        setIsNewAddOnModalOpen(true);
                                    }}
                                >
                                    New Add-on
                                </Button>
                                <Button
                                    variant="white"
                                    className="px-4 mx-2"
                                    icon={TbUpload}
                                    onClick={() => {}}
                                    disabled={true}
                                >
                                    Import Add-on
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-grow flex-col h-full mt-2 pb-4">
                    {selectedAddOn && (
                        <AddOnDetail
                            addOn={selectedAddOn}
                            onSaved={() => {
                                fetchAddOns();
                            }}
                        />
                    )}
                </div>
            </div>

            <CustomModal
                ref={modalRef}
                isOpen={isNewAddOnModalOpen}
                onClose={() => setIsNewAddOnModalOpen(false)}
                className="w-[60%] max-w-[600px] !max-h-fit bg-white rounded"
            >
                <div className="flex flex-col w-full h-full p-4 rounded text-gray-600">
                    <div className="flex flex-col w-full h-fit">
                        <div className="text-aiot-blue font-bold text-lg">New Add-on</div>
                        <div className="text-sm pt-1">
                            Start building your features to enhance vehicle model development capabilities
                        </div>
                        <div className="flex flex-col w-full h-full pt-2">
                            <div className="flex pt-3 font-bold">Type</div>
                            <CustomAutoComplete
                                rootRef={modalRef}
                                textSize="sm"
                                value={type}
                                onChange={handleTypeChange}
                                placeholder="Select add-on type"
                                data={addOnTypeOptions}
                                filter={handleTypeChange}
                                className="w-full !h-4 focus:outline-none"
                                containerClassName="!mb-3 !mt-1 !py-1 !pl-1.5 !bg-white !h-[33.33px]"
                            />
                            <InputContainer
                                className="!mb-3"
                                label="Name"
                                labelClassName="font-bold"
                                input={
                                    <CustomInput
                                        className="h-4 text-sm"
                                        containerClassName="!pl-1.5 !bg-white shadow-sm"
                                        state={[name, setName]}
                                        placeholder="Enter name"
                                    />
                                }
                            />
                            <InputContainer
                                className="!mb-3"
                                label="Description"
                                labelClassName="font-bold"
                                input={
                                    <CustomInput
                                        className="h-4 text-sm"
                                        containerClassName="!pl-1.5 !bg-white shadow-sm"
                                        state={[description, setDescription]}
                                        placeholder="Describe your add-on features"
                                    />
                                }
                            />
                            <InputContainer
                                className="!mb-3"
                                label="Endpoint URL"
                                labelClassName="font-bold"
                                input={
                                    <CustomInput
                                        className="h-4 text-sm"
                                        containerClassName="!pl-1.5 !bg-white shadow-sm"
                                        state={[endpointUrl, setEndpointUrl]}
                                        placeholder="Enter Endpoint URL"
                                    />
                                }
                            />
                            <InputContainer
                                className="!mb-3"
                                label="API Key"
                                labelClassName="font-bold"
                                input={
                                    <CustomInput
                                        className="h-4 text-sm"
                                        containerClassName="!pl-1.5 !bg-white shadow-sm"
                                        state={[apiKey, setApiKey]}
                                        placeholder="Enter API key"
                                    />
                                }
                            />
                        </div>
                        <div className="flex w-full h-full mt-3 justify-end">
                            <Button
                                className="w-16 h-8 mr-2"
                                variant="white"
                                onClick={() => {
                                    setIsNewAddOnModalOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className={`w-16 h-8 ${isValid ? "opacity-100" : "opacity-20 pointer-events-none"}`}
                                variant="blue"
                                showProgress={loading}
                                onClick={() => {
                                    createAddOn();
                                }}
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            </CustomModal>
        </div>
    );
};

export default ModelAddOns;
