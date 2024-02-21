import React, { useEffect, useState } from "react";
import Button from "../../../reusable/Button";
import { AddOn } from "../../../apis/models";
import { TbArrowMoveRight, TbAdjustmentsHorizontal } from "react-icons/tb";
import StandardConfig from "./StandardConfiguration";

interface AddOnDetailProps {
    addOn: AddOn;
    onSaved: () => void;
}

const AddOnDetail: React.FC<AddOnDetailProps> = ({ addOn, onSaved }) => {
    const [activeTab, setActiveTab] = useState<"Standard Config" | "Detailed Config">("Standard Config");
    return (
        <div className="flex flex-col w-full h-full">
            {/* <DisplayImage image_file={addOn.image_file} maxHeight={300} /> */}
            {/* <div className="flex w-full px-4 py-1">
                <div className="flex mb-2 w-fit rounded bg-gray-100 !text-sm mt-2 shrink-0">
                    <Button
                        className={`my-1 ml-1 mr-0.5 border ${
                            activeTab === "Standard Config"
                                ? "bg-white !text-gray-800  !border-gray-200"
                                : "bg-gray-100 text-gray-400"
                        }`}
                        onClick={() => setActiveTab("Standard Config")}
                        icon={TbArrowMoveRight}
                    >
                        Standard Configuration
                    </Button>
                    <Button
                        className={`my-1 ml-1 mr-1 border ${
                            activeTab === "Detailed Config"
                                ? "bg-white !text-gray-800  !border-gray-200"
                                : "bg-gray-100 text-gray-400"
                        }`}
                        onClick={() => setActiveTab("Detailed Config")}
                        icon={TbAdjustmentsHorizontal}
                    >
                        Detailed Configuration
                    </Button>
                </div>
            </div> */}
            {activeTab == "Standard Config" && (
                <div className="flex w-full h-full py-3 overflow-auto">
                    <StandardConfig addOn={addOn} onSaved={onSaved} />
                </div>
            )}
        </div>
    );
};

export default AddOnDetail;
