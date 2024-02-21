import React, { useState } from "react";
import { API } from "../../../apis/backend/vehicleApi";
import HomologationLeftSection from "./HomologationLeftSection";
import HomologationRegulationResult from "./HomologationRegulationResult";

const Homologation = () => {
    const [selectedAPIs, setSelectedAPIs] = useState<Set<API>>(new Set([]));

    return (
        <div className="w-full overflow-y-auto scroll-gray">
            <div className="flex gap-5 min-h-[calc(100%-20px)]">
                {/* Left section */}
                <HomologationLeftSection selectedAPIs={selectedAPIs} setSelectedAPIs={setSelectedAPIs} />

                {/* Divider */}
                <div className="border-r mt-5 mb-2  border-r-gray-200" />

                {/* Right section */}
                <HomologationRegulationResult selectedAPIs={selectedAPIs} />
            </div>
        </div>
    );
};

export default Homologation;
