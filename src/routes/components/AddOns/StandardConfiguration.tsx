import React, { useState, useEffect } from "react";
import Button from "../../../reusable/Button";
import CustomInput from "../../../reusable/Input/CustomInput";
import { AddOn } from "../../../apis/models";
import { TbEdit, TbTrashX, TbChevronDown, TbChevronRight, TbCodeDots, TbTerminal2 } from "react-icons/tb";
import triggerConfirmPopup from "../../../reusable/triggerPopup/triggerConfirmPopup";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { REFS } from "../../../apis/firebase";
import SyntaxHighlighter from "react-syntax-highlighter";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";

export const customStyle = {
    ...githubGist,
    hljs: {
        ...githubGist.hljs,
        background: "#f9fafb", // Change the background color as needed
    },
};

export const languageLookup = {
    GenAI_Python: "python",
    GenAI_Dashboard: "json",
    GenAI_Widget: "htmlbars",
};

const StandardConfig = ({ addOn, onSaved }) => {
    // Local state for editable fields
    const [name, setName] = useState(addOn.name);
    const [description, setDescription] = useState(addOn.description);
    const [endpointUrl, setEndpointUrl] = useState(addOn.endpointUrl);
    const [apiKey, setApiKey] = useState(addOn.apiKey);
    const [requestMessage, setRequestMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isChanged, setIsChanged] = useState(false); // State to track if any fields have been changed
    const [isValid, setIsValid] = useState(false);

    // State for integration testing
    const [rawResponseMessage, setRawResponseMessage] = useState("");
    const [showSampleRequest, setShowSampleRequest] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [formattedResponseMessage, setFormattedResponseMessage] = useState("");

    // State to switch between view raw response or formated response
    const [activeTab, setActiveTab] = useState<"Raw Response" | "Formatted Response">("Raw Response");

    // Handle updating the add-on
    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            // Update the add-on
            await updateDoc(doc(REFS.addOns, addOn.id), {
                name,
                description,
                endpointUrl,
                apiKey,
            });
            onSaved(); // Callback to parent component to update the add-on list
            setIsChanged(false);
        } catch (error) {
            // Error handling
        }
        setIsLoading(false);
    };

    // Handle deleting the add-on
    const handleDelete = async () => {
        setIsLoading(true);
        try {
            triggerConfirmPopup("Are you sure you want to delete this add-on?", async () => {
                await deleteDoc(doc(REFS.addOns, addOn.id));
                onSaved();
            });
        } catch (error) {
            // Error handling
        }
        setIsLoading(false);
    };

    // Function to handle API call and set rawResponseMessage (simplified version)
    const handleTestIntegration = async () => {
        setIsRequesting(true);
        try {
            const response = await fetch(addOn.endpointUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${addOn.apiKey}`,
                },
                body: JSON.stringify({ message: requestMessage }), // Sending the custom message in the request body
            });
            console.log(response);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json(); // Parse the JSON response
            setFormattedResponseMessage(data.message);
            setRawResponseMessage(JSON.stringify(data, null, 2)); // Update the state with the formatted JSON string
        } catch (error) {
            console.error("Failed to fetch from server:", error);
            setRawResponseMessage(`Error: ${error}`); // Update the state with the error message
        }
        setIsRequesting(false);
    };

    const SampleRequestDisplay = () => {
        const sampleRequest = generateSampleRequest();
        return (
            <div className="flex flex-col w-full h-fit pt-1">
                <button className="flex items-center" onClick={() => setShowSampleRequest(!showSampleRequest)}>
                    {showSampleRequest ? <TbChevronDown /> : <TbChevronRight />}
                    <div className="flex ml-1 text-gray-600">Show sample request</div>
                </button>
                {showSampleRequest && (
                    <div className="mt-1 text-sm border rounded">
                        <SyntaxHighlighter
                            language="javascript"
                            style={customStyle}
                            className="text-xs scroll-gray scroll-gray"
                        >
                            {sampleRequest}
                        </SyntaxHighlighter>
                    </div>
                )}
            </div>
        );
    };

    const ResponseDisplay = () => {
        return (
            <SyntaxHighlighter
                language="json"
                style={customStyle}
                className="flex text-xs scroll-gray"
                wrapLongLines={true}
            >
                {rawResponseMessage}
            </SyntaxHighlighter>
        );
    };

    const FormattedResponseDisplay = () => {
        const language = languageLookup[addOn.type] || "text";

        return (
            <SyntaxHighlighter
                language={language} // Use the determined language here
                style={customStyle}
                className="flex text-xs scroll-gray"
                wrapLongLines={true}
            >
                {formattedResponseMessage}
            </SyntaxHighlighter>
        );
    };

    const generateSampleRequest = () => {
        const headers = {
            "Content-Type": "application/json",
            ...(addOn.apiKey && { Authorization: `Bearer ${addOn.apiKey}` }), // Conditionally add Authorization header
        };

        const sampleRequest = `fetch("${addOn.endpointUrl}", {
    method: "POST",
    headers: ${JSON.stringify(headers, null, 4)},
    body: ${JSON.stringify({ message: requestMessage }, null, 4)}});`;
        return sampleRequest;
    };

    // On addOn change (selected addOn changes), update the local state
    useEffect(() => {
        setName(addOn.name);
        setDescription(addOn.description);
        setEndpointUrl(addOn.endpointUrl);
        setApiKey(addOn.apiKey);
        setRequestMessage("");
        setRawResponseMessage("");
        setFormattedResponseMessage("");
    }, [addOn]);

    useEffect(() => {
        // Check if any of the required fields have changed and are not empty
        const hasChanged =
            name !== addOn.name ||
            description !== addOn.description ||
            endpointUrl !== addOn.endpointUrl ||
            apiKey !== addOn.apiKey;

        // Check for the validity of required fields (excluding description)
        const currentIsValid = name.trim() !== "" && endpointUrl.trim() !== "" && apiKey.trim() !== "";

        setIsChanged(hasChanged);
        setIsValid(currentIsValid);
    }, [name, description, endpointUrl, apiKey, addOn]);

    return (
        <div className="flex w-full h-full select-none">
            <div className="flex w-full h-full select-none">
                <div className="flex flex-col w-1/2 h-full px-4 text-gray-600 text-sm border-r border-gray-100 overflow-y-auto scroll-gray">
                    <div className="flex font-bold text-lg text-gray-800">Add-ons Configuration</div>
                    {/* <div className="pt-1 mb-4 pb-4 text-gray-600 leading-relaxed border-b">
                        Configure your add-on with essential settings. Ideal for getting started quickly and
                        efficiently. For more tailored options, switch to{" "}
                        <span className="bg-gray-100 px-1 py-0.5 rounded">Detailed Configuration</span>
                    </div> */}
                    <div className="pt-1 mb-4 pb-4 text-gray-600 leading-relaxed border-b">
                        Configure your add-on with essential settings. Ideal for getting started quickly and
                        efficiently.
                    </div>
                    <div className="flex justify-between w-full">
                        <div className="flex text-base font-bold mb-3 text-gray-800">{addOn.type}</div>
                        <div className="flex w-full justify-end pr-2">
                            <div className="flex w-fit">
                                <Button
                                    variant="white"
                                    className="flex h-7 mr-2 hover:border-red-500 hover:bg-red-500 hover:text-white"
                                    icon={TbTrashX}
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                                <Button
                                    variant="blue"
                                    className="h-7 w-[75px]"
                                    onClick={handleUpdate}
                                    icon={TbEdit}
                                    iconClassName="text-base"
                                    iconStrokeWidth={1.8}
                                    showProgress={isLoading}
                                    disabled={!isChanged || !isValid}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex font-bold">Name</div>
                    <CustomInput
                        className="h-4 text-sm"
                        containerClassName={`my-1 !pl-1.5 !bg-white border`}
                        state={[name, setName]}
                        placeholder="Name"
                    />
                    <div className="flex pt-3 font-bold">Description</div>
                    <CustomInput
                        className="h-4 text-sm"
                        form="textarea"
                        defaultRows={3}
                        containerClassName={`my-1 !pl-1.5 !bg-white border`}
                        state={[description, setDescription]}
                        placeholder="Description"
                    />
                    <div className="flex pt-3 font-bold">Endpoint URL</div>
                    <CustomInput
                        className="h-4 text-sm"
                        containerClassName={`my-1 !pl-1.5 !bg-white border`}
                        state={[endpointUrl, setEndpointUrl]}
                        placeholder="Endpoint URL"
                    />
                    <div className="flex pt-3 font-bold">Key/Token</div>
                    <CustomInput
                        className="h-4 text-sm"
                        containerClassName={`my-1 !pl-1.5 !bg-white border`}
                        state={[apiKey, setApiKey]}
                        placeholder="Key/Token"
                    />
                </div>
                <div className="flex w-1/2 h-full flex-col px-4 pb-2 text-gray-800 text-sm overflow-y-auto scroll-gray">
                    <div className="flex font-bold text-lg">Request Message</div>
                    <div className="pt-1 pb-3 text-gray-600 leading-relaxed">
                        The request message will be sent to your API endpoint when a user requests this add-on.
                    </div>
                    <CustomInput
                        className="h-4 text-sm"
                        form="textarea"
                        defaultRows={3}
                        containerClassName="my-1 !pl-1.5 !bg-white"
                        state={[requestMessage, setRequestMessage]}
                        placeholder="Request Message"
                    />
                    <SampleRequestDisplay />
                    <Button
                        className="flex !h-7 py-2 my-2"
                        variant="white"
                        onClick={handleTestIntegration}
                        showProgress={isRequesting}
                        progressColor="#4b5563"
                    >
                        Send request
                    </Button>
                    <div className="flex font-bold text-lg">Response</div>
                    <div className="pt-1 pb-2 text-gray-600 leading-relaxed">
                        The response from your API will be displayed here. The add-on will use the data found within the
                        'message' key of the JSON response as its output.
                    </div>
                    <div className="flex flex-col w-full h-fit">
                        <div className="flex mb-2 w-fit rounded bg-gray-100 !text-sm mt-2">
                            <Button
                                className={`my-1 ml-1 mr-0.5 border ${
                                    activeTab === "Raw Response"
                                        ? "bg-white !text-gray-800  !border-gray-200"
                                        : "bg-gray-100 text-gray-400"
                                }`}
                                onClick={() => setActiveTab("Raw Response")}
                                icon={TbCodeDots}
                            >
                                Raw
                            </Button>
                            <Button
                                className={`my-1 ml-1 mr-1 border ${
                                    activeTab === "Formatted Response"
                                        ? "bg-white !text-gray-800  !border-gray-200"
                                        : "bg-gray-100 text-gray-400"
                                }`}
                                onClick={() => setActiveTab("Formatted Response")}
                                icon={TbTerminal2}
                            >
                                Formatted
                            </Button>
                        </div>
                        {activeTab == "Raw Response" && (
                            <div className="flex w-full h-full min-h-[100px] rounded border bg-white border-gray-200">
                                <ResponseDisplay />
                            </div>
                        )}
                        {activeTab == "Formatted Response" && (
                            <div className="flex w-full h-full min-h-[100px] rounded border bg-white border-gray-200">
                                <FormattedResponseDisplay />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StandardConfig;
