import { useState, useEffect, useRef } from "react";
import Button from "../../../reusable/Button";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";
import { TbTerminal, TbLayoutGridAdd, TbSelector, TbCheck, TbStarFilled } from "react-icons/tb";
import CustomInput from "../../../reusable/Input/CustomInput";
import axios from "axios";
import { createNewWidgetByProtoPilot } from "../../../services/webStudio";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { WidgetConfig } from "../Widget/DashboardEditor";
import copyText from "../../../reusable/copyText";
import { AddOn, Model } from "../../../apis/models";
import { getDocs, query, where } from "@firebase/firestore";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { REFS } from "../../../apis/firebase";
import { BsStars } from "react-icons/bs";
import { fetchMarketAddOns } from "../Widget/WidgetServices";

interface GenAI_WidgetProps {
    widgetConfig?: any;
    onDashboardConfigChanged?: (config: any) => void;
    onClose: () => void;
    outerSetiWidgetUrl?: React.Dispatch<React.SetStateAction<string>>;
    modalRef?: React.RefObject<HTMLDivElement>;
}

const GenAI_Widget = ({ modalRef, outerSetiWidgetUrl }: GenAI_WidgetProps) => {
    const { user } = useCurrentUser();
    const model = useCurrentModel();
    // State related to the prompt and associate API
    const [inputPrompt, setInputPrompt] = useState("");
    const [isValid, setIsValid] = useState(true);

    // State related to generator options
    const [isExpandGenerator, setIsExpandGenerator] = useState(false);
    const [loading, setLoading] = useState(false);

    // State related to generated widget code
    const [genWidgetCode, setGenWidgetCode] = useState("");
    const [iframeSrc, setIframeSrc] = useState("");
    const [widgetUrl, setWidgetUrl] = useState("");
    const [studioUrl, setStudioUrl] = useState("");
    const [isCreatingWidget, setIsCreatingWidget] = useState(false);

    // State related to loading line animation
    const [linePosition, setLinePosition] = useState(0);
    const [direction, setDirection] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxLeft, setMaxLeft] = useState(0);

    // Fetch the list of generators (Add Ons)
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    const [marketplaceAddOns, setMarketplaceAddOns] = useState<AddOn[]>([]);

    const dropdownRef = useRef<HTMLDivElement>(null); // Step 1: Create a ref

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsExpandGenerator(false); // Close the dropdown if click is outside
        }
    };

    useEffect(() => {
        // Attach the handler to the click event
        document.addEventListener("click", handleClickOutside, true);
        return () => {
            // Clean up the event listener
            document.removeEventListener("click", handleClickOutside, true);
        };
    }, []);

    // State related to loading add-ons
    const [loadingAddOns, setLoadingAddOns] = useState(true);
    useEffect(() => {
        const fetchTimeout = setTimeout(() => {
            if (loadingAddOns) {
                setLoadingAddOns(false); // Stop loading after 5s if still loading
            }
        }, 5000);

        return () => clearTimeout(fetchTimeout);
    }, [loadingAddOns]);

    // Function fetch add-ons from Firebase
    const fetchAddOns = async () => {
        if (!model) return;
        const addOnsQuery = query(REFS.addOns, where("model_id", "==", model.id));
        const querySnapshot = await getDocs(addOnsQuery);

        const addOns: AddOn[] = [];
        // Filter the snapshot to only include add-ons type = "GenAI_Widget"
        querySnapshot.forEach((doc) => {
            const addOn = doc.data() as AddOn;
            if (addOn.type === "GenAI_Widget") {
                addOns.push(addOn);
            }
        });
        setAddOns(addOns);
        setSelectedAddOn(addOns[0]);
        setLoadingAddOns(false);
    };

    useEffect(() => {
        fetchAddOns();
        fetchMarketAddOns("GenAI_Widget").then((res) => {
            if (res) {
                setMarketplaceAddOns(res);
                console.log(res);
            }
        });
    }, [model]);

    // Check if the prompt is valid
    useEffect(() => {
        if (inputPrompt) {
            setIsValid(true);
        } else {
            setIsValid(false);
        }
    }, [inputPrompt]);

    // Animate the loading line
    useEffect(() => {
        if (containerRef.current) {
            setMaxLeft(containerRef.current.offsetWidth);
        }
    }, [containerRef]);

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setLinePosition((prevPosition) => {
                    let newPosition = prevPosition + 2 * direction;
                    if (newPosition >= maxLeft - 2 || newPosition <= 0) {
                        // Subtract the width of the line itself
                        setDirection(-direction);
                    }
                    return newPosition;
                });
            }, 8);
            return () => clearInterval(interval);
        }
    }, [loading, direction, maxLeft]);

    // Update the iframe source with the generated widget code
    useEffect(() => {
        // Update the iframe source whenever genWidgetCode changes
        if (genWidgetCode) {
            const blob = new Blob([genWidgetCode], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            setIframeSrc(url);
            // Clean up the blob URL after the component unmounts
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [genWidgetCode]);

    const handleCreateWidget = async (code) => {
        setIsCreatingWidget(true);
        const [linkUrl, linkStudio] = await createNewWidgetByProtoPilot("ProtoPilot", user?.uid, code);
        outerSetiWidgetUrl && outerSetiWidgetUrl(linkUrl);
        setIsCreatingWidget(false);
        setWidgetUrl(linkUrl);
        setStudioUrl(linkStudio);
        // console.log("linkUrl: ", linkUrl);
        // console.log("linkStudio: ", linkStudio);
    };

    const GenCode = async () => {
        if (!selectedAddOn) {
            alert("Please select an add-on.");
            return;
        }
        setStudioUrl("");
        setWidgetUrl("");
        setGenWidgetCode("");
        setLoading(true);
        try {
            // Use selectedAddOn details here
            // const response = await fetch(selectedAddOn.endpointUrl, {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         Authorization: `Bearer ${selectedAddOn.apiKey}`,
            //     },
            //     body: JSON.stringify({ message: inputPrompt }), // Adjust according to your API requirements
            // });

            // if (!response.ok) {
            //     throw new Error("Network response was not ok");
            // }

            // const data = await response.json();
            // setGenWidgetCode(data.message);
            // handleCreateWidget(data.message);
            const res = await axios.post(
                selectedAddOn.endpointUrl,
                {
                    prompt: `${selectedAddOn.samples?selectedAddOn.samples+'\r`\n':''} ${inputPrompt}`,
                    // prompt: `${guide}`,
                    max_tokens: 5000,
                    temperature: 0.75,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                    top_p: 1,
                    best_of: 1,
                    stop: ["#"],
                },
                {
                    headers: {
                        "api-key": selectedAddOn.apiKey,
                        Authorization: `Bearer ${selectedAddOn.apiKey}`,
                    },
                }
            );
            let result = ''
            console.log("res", res.data.choices);
            if (res.data && res.data.choices && res.data.choices.length > 0) {
                result = res.data.choices[0].text;
            }
            setGenWidgetCode(result);
            handleCreateWidget(result);
        } catch (error) {
            console.error("Failed to fetch from server:", error);
            setGenWidgetCode(`Error: ${error}`);
        }
        setLoading(false);
    };

    return (
        <div className="flex w-full h-full rounded">
            <div className="flex flex-col w-[50%] h-full border-r pr-2 border-gray-100">
                <div className="flex select-none items-center">
                    <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                        1
                    </div>
                    <div className="flex ml-1 text-gray-600 font-bold">Prompting</div>
                </div>
                <div className="flex mt-2 w-full mb-4" ref={modalRef}>
                    <CustomInput
                        state={[inputPrompt, setInputPrompt]}
                        form={"textarea"}
                        className="text-sm"
                        containerClassName="!shadow-sm !bg-white min-h-[100px]"
                        defaultRows={4}
                        placeholder="Ask AI to generate a widget based on this prompt..."
                    ></CustomInput>
                </div>
                <div className="flex flex-col select-none mb-2 border-gray-100 pt-2">
                    <div className="flex w-full items-center">
                        <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100">
                            2
                        </div>
                        <div className="flex ml-1 text-gray-600 font-bold"> Select Generator</div>
                    </div>
                    <div ref={dropdownRef} className="flex flex-col mb-auto relative">
                        <Button
                            variant="white"
                            className={"flex w-full h-8 mt-2 bg-white hover:bg-gray-100"}
                            onClick={() => setIsExpandGenerator(!isExpandGenerator)}
                            showProgress={loadingAddOns}
                            progressColor="#4b5563"
                            disabled={loading}
                        >
                            <div className="flex w-full items-center justify-between">
                                {selectedAddOn ? selectedAddOn.name : loadingAddOns ? "" : "No generator found"}
                                <TbSelector className="w-4 h-4 text-gray-400" />
                            </div>
                        </Button>
                        {isExpandGenerator && (
                            <div className="absolute flex flex-col top-11 left-0 w-full z-10 min-h-[30px] rounded border bg-white border-gray-200 shadow-sm p-2 text-sm space-y-1">
                                <div className="font-bold text-gray-500 text-xs pl-1">Built-in</div>
                                <div className="flex flex-col max-h-[100px] overflow-y-auto scroll-gray">
                                    {addOns.map((addOn) => (
                                        <div
                                            key={addOn.id}
                                            className={`flex rounded py-0.5 items-center justify-between cursor-pointer hover:bg-gray-100`}
                                            onClick={() => {
                                                setSelectedAddOn(addOn);
                                                setIsExpandGenerator(false);
                                            }}
                                        >
                                            <div className="flex w-full h-full p-1 items-center justify-between">
                                                {addOn.name}
                                                <TbCheck
                                                    className={`w-4 h-4 text-gray-600 ${
                                                        selectedAddOn?.id === addOn.id ? "text-aiot-blue" : "hidden"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {addOns.length === 0 && (
                                    <div className="flex w-full h-full p-1 items-center justify-between">
                                        <div className="text-gray-400">No generator found</div>
                                    </div>
                                )}
                                <div className="font-bold text-gray-500 pl-1 pt-2 pb-1 text-xs  border-t border-gray-100">
                                    Marketplace
                                </div>
                                <div className="flex flex-col max-h-[100px] overflow-y-auto scroll-gray">
                                    {marketplaceAddOns.map((addOn) => (
                                        <div
                                            key={addOn.id}
                                            className={`flex rounded py-0.5 items-center justify-between cursor-pointer hover:bg-gray-100`}
                                            onClick={() => {
                                                setSelectedAddOn(addOn);
                                                setIsExpandGenerator(false);
                                            }}
                                        >
                                            <div className="flex w-full h-full p-1 items-center justify-between">
                                                <div className="flex w-full items-center">
                                                    {addOn.name}
                                                    {addOn.rating && (
                                                        <div className="flex items-center justify-center text-xs text-gray-400 ml-3">
                                                            <TbStarFilled className="w-3 h-3 mr-0.5 text-yellow-400" />
                                                            {addOn.rating.toFixed(1)}
                                                        </div>
                                                    )}
                                                </div>
                                                <TbCheck
                                                    className={`w-4 h-4 text-gray-600 ${
                                                        selectedAddOn?.id === addOn.id ? "text-aiot-blue" : "hidden"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {marketplaceAddOns.length === 0 && (
                                    <div className="flex w-full h-full p-1 items-center justify-between">
                                        <div className="text-gray-400">No generator found</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-grow"></div>
                <div className="flex flex-col relative w-full h-full justify-end">
                    <Button
                        variant="blue"
                        className={`flex w-full mt-1 h-8 ${!isValid ? "opacity-50 pointer-events-none" : ""} `}
                        onClick={() => {
                            GenCode();
                        }}
                    >
                        <BsStars className={`inline-block mr-1 mb-0.5 ${loading ? "animate-pulse" : ""}`} />
                        {!loading && <div>Generate</div>}
                    </Button>
                </div>
            </div>
            <div className="flex flex-col w-1/2 h-full pl-2">
                <div className="flex select-none mb-2 items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                            3
                        </div>
                        <div className="flex ml-1 text-gray-600 font-bold"> Preview Widget</div>
                    </div>
                </div>
                <div
                    ref={containerRef}
                    className="flex w-full h-full border bg-gray-50 border-gray-200 select-none shadow-sm rounded overflow-hidden relative items-center justify-center"
                >
                    {genWidgetCode ? (
                        <iframe
                            src={iframeSrc}
                            title="Widget Preview"
                            className="w-full h-full"
                            sandbox="allow-scripts allow-same-origin"
                        ></iframe>
                    ) : (
                        !loading && <div className="text-gray-400">There's no widget here</div>
                    )}
                    {loading && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: `${linePosition}px`,
                                height: "100%",
                                width: "2px",
                                backgroundColor: "#005072",
                                boxShadow: "0px 0px 20px #005072",
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenAI_Widget;
