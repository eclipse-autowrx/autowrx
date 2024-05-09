import React, { useEffect, useRef, useState } from "react";
import Button from "../../../reusable/Button";
import { TbSelector, TbStarFilled, TbCheck } from "react-icons/tb";
import { AddOn } from "../../../apis/models";

type GeneratorSelectorProps = {
    generatorList: AddOn[];
    onSelectedGeneratorChange: (addOn: AddOn) => void;
};

const GeneratorSelector = ({ generatorList, onSelectedGeneratorChange }: GeneratorSelectorProps) => {
    const [isExpandGenerator, setIsExpandGenerator] = useState(false);
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsExpandGenerator(false);
        }
    };

    useEffect(() => {
        document.addEventListener("click", handleClickOutside, true);
        return () => {
            document.removeEventListener("click", handleClickOutside, true);
        };
    }, []);

    useEffect(() => {
        if (generatorList.length > 0 && !selectedAddOn) {
            setSelectedAddOn(generatorList[0]);
            onSelectedGeneratorChange(generatorList[0]);
        }
    }, [generatorList]);

    useEffect(() => {
        const fetchTimeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false); // Stop loading after 5s if still loading
            }
        }, 5000);

        return () => clearTimeout(fetchTimeout);
    }, [isLoading]);

    const handleAddOnSelect = (addOn: AddOn) => {
        setSelectedAddOn(addOn);
        onSelectedGeneratorChange(addOn);
        setIsExpandGenerator(false);
    };

    return (
        <div ref={dropdownRef} className="flex flex-col mb-auto relative">
            <Button
                variant="white"
                className="flex w-full h-8 mt-2 bg-white hover:bg-gray-100"
                onClick={() => setIsExpandGenerator(!isExpandGenerator)}
                showProgress={isLoading}
                progressColor="#4b5563"
                disabled={isLoading}
            >
                <div className="flex w-full items-center justify-between">
                    {selectedAddOn ? selectedAddOn.name : "Select generator"}
                    <TbSelector className="w-4 h-4 text-gray-400" />
                </div>
            </Button>
            {isExpandGenerator && (
                <div className="absolute flex flex-col top-11 left-0 w-full z-10 min-h-[30px] rounded border bg-white border-gray-200 shadow-sm p-1 text-sm space-y-1">
                    <div className="flex flex-col max-h-[150px] overflow-y-auto scroll-gray">
                        {generatorList.map((addOn) => (
                            <div
                                key={addOn.id}
                                className="flex rounded py-0.5 items-center justify-between cursor-pointer hover:bg-gray-100"
                                onClick={() => handleAddOnSelect(addOn)}
                            >
                                <div className="flex w-full h-full p-1 items-center justify-between">
                                    <div className="flex w-full items-center jus">
                                        {addOn.name}
                                        {addOn.team && (
                                            <div className="text-xs px-1 py-0 ml-2 rounded-full bg-aiot-blue/10 text-aiot-blue">
                                                GenAI Awards
                                            </div>
                                        )}
                                        {addOn.rating && (
                                            <div className="flex items-center justify-center text-xs text-gray-400 ml-3">
                                                <TbStarFilled className="w-3 h-3 mr-0.5 text-yellow-400" />
                                                {addOn.rating.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    <TbCheck
                                        className={`w-4 h-4 text-gray-600 ${
                                            selectedAddOn?.id === addOn.id ? "" : "hidden"
                                        }`}
                                    />
                                </div>
                            </div>
                        ))}
                        {generatorList.length === 0 && <div className="text-gray-400 p-1">No generator found</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratorSelector;
