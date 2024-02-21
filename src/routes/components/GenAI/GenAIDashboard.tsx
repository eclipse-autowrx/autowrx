import React, { useEffect, useCallback, useState, useRef } from "react";
import CustomInput from "../../../reusable/Input/CustomInput";
import Button from "../../../reusable/Button";
import _ from "lodash";
import { AddOn, Model } from "../../../apis/models";
import { getDocs, query, where } from "@firebase/firestore";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { REFS } from "../../../apis/firebase";
import {
    TbCheck,
    TbChevronDown,
    TbChevronRight,
    TbLayoutGridAdd,
    TbSelector,
    TbSquare,
    TbSquareCheck,
    TbStarFilled,
} from "react-icons/tb";
import SyntaxHighlighter from "react-syntax-highlighter";
import { customStyle } from "../AddOns/StandardConfiguration";
import { BsStars } from "react-icons/bs";
import DashboardEditor from "../Widget/DashboardEditor";
import { any } from "prop-types";
import axios from "axios";

type GenAIDashboardProps = {
    marketplaceAddOns: AddOn[];
    onDashboardConfigChanged?: (config: any) => void;
};

const GenAIDashboard = ({ marketplaceAddOns, onDashboardConfigChanged }: GenAIDashboardProps) => {
    const model = useCurrentModel();
    const [inputPrompt, setInputPrompt] = useState<string>("");
    // Fetch the list of generators (Add Ons)
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    const [isExpandGenerator, setIsExpandGenerator] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [genDashboardConfig, setGenDashboardConfig] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [loadingAddOns, setLoadingAddOns] = useState<boolean>(true); // New state for loading add-ons
    // State related to loading line animation
    const [linePosition, setLinePosition] = useState(0);
    const [direction, setDirection] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxLeft, setMaxLeft] = useState(0);

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

    // const [showResponse, setShowResponse] = useState<boolean>(false);
    // // Syntax Highlighter for displaying code
    // const ResponseDisplay = () => {
    //     return (
    //         <div className="block w-full h-full">
    //             <SyntaxHighlighter language="json" style={customStyle} className="flex text-xs w-full scroll-gray">
    //                 {genDashboardConfig}
    //             </SyntaxHighlighter>
    //         </div>
    //     );
    // };

    // State related to loading add-ons
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
        // Filter the snapshot to only include add-ons type = "GenAI_Python"
        querySnapshot.forEach((doc) => {
            const addOn = doc.data() as AddOn;
            if (addOn.type === "GenAI_Dashboard") {
                addOns.push(addOn);
            }
        });
        setAddOns(addOns);
        setSelectedAddOn(addOns[0]);
        setLoadingAddOns(false);
    };

    useEffect(() => {
        fetchAddOns();
    }, [model]);

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

    const genDashboard = async () => {
        if (!selectedAddOn) {
            alert("Please select an add-on.");
            return;
        }
        setGenDashboardConfig("");
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
            // setTimeout(() => {
            //     setGenDashboardConfig(data.message);
            //     setLoading(false);
            // }, 3000);

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
            setTimeout(() => {
                setGenDashboardConfig(result);
                setLoading(false);
            }, 2000);


        } catch (error) {
            console.error("Failed to fetch from server:", error);
            setGenDashboardConfig(`Error: ${error}`);
            setLoading(false);
        }
    };

    const handleDashboardConfigChanged = () => {
        if (onDashboardConfigChanged) {
            onDashboardConfigChanged(genDashboardConfig);
        }
    };

    return (
        <div className="flex w-full h-full rounded">
            <div className="flex flex-col w-[50%] h-full pr-2 pt-3 border-r border-gray-100">
                <div>
                    <div className="flex select-none">
                        <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                            1
                        </div>
                        <div className="flex ml-1 text-gray-600 font-bold">Prompting</div>
                    </div>
                    <div className="flex mt-2 mb-4 w-full h-fit">
                        <CustomInput
                            state={[inputPrompt, setInputPrompt]}
                            form={"textarea"}
                            className="text-sm"
                            containerClassName="!shadow-sm !bg-white"
                            defaultRows={4}
                            disabled={loading}
                            placeholder="Ask AI to generate a dashboard based on this prompt..."
                        ></CustomInput>
                    </div>
                </div>
                <div className="flex mt-2 select-none">
                    <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                        2
                    </div>
                    <div className="flex ml-1 text-gray-600 font-bold">Select Generator</div>
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
                {!inputPrompt && (
                    <div className="flex w-full mt-auto justify-center text-gray-400 select-none">
                        You need to enter prompt and select generator
                    </div>
                )}
                <Button
                    variant="blue"
                    disabled={!inputPrompt}
                    className={`!h-8 w-full mt-auto ${!inputPrompt ? "!mt-2" : "mt-auto"}`}
                    onClick={genDashboard}
                >
                    <BsStars className={`inline-block mr-1 mb-0.5 ${loading ? "animate-pulse" : ""}`} />
                    {!loading && <div>Generate</div>}
                </Button>
            </div>
            <div className="flex flex-col w-1/2 h-full pt-3 pl-2">
                <div className="flex mb-2 select-none">
                    <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                        3
                    </div>
                    <div className="flex ml-1 text-gray-600 font-bold">Preview Config</div>
                </div>
                <div className="flex w-full h-full overflow-y-auto overflow-x-hidden scroll-gray max-h-[350px]">
                    {genDashboardConfig ? (
                        <div className="flex flex-col w-full h-full">
                            <DashboardEditor
                                entireWidgetConfig={genDashboardConfig}
                                onDashboardConfigChanged={handleDashboardConfigChanged}
                                editable={false}
                            />
                        </div>
                    ) : (
                        <div
                            ref={containerRef}
                            className="bg-gray-50 shadow-sm border border-gray-200 rounded flex-1 flex items-center justify-center relative select-none"
                        >
                            {!loading ? (
                                <div>There&apos;s no dashboard config here</div>
                            ) : (
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
                    )}
                </div>
                <div className="flex flex-col w-full mt-auto pt-3 select-none">
                    <Button
                        variant="white"
                        className="!h-8 w-full"
                        onClick={handleDashboardConfigChanged}
                        disabled={!(genDashboardConfig && genDashboardConfig.length > 0)}
                        icon={TbLayoutGridAdd}
                        iconClassName="w-4 h-4"
                    >
                        Add new generated config
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GenAIDashboard;
