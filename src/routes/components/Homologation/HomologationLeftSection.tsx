import React from "react";
import HomologationUsedAPIs from "./HomologationUsedAPIs";
import HomologationVehicleProperties from "./HomologationVehicleProperties";
import { API } from "../../../apis/backend/vehicleApi";
import { headerHeight } from "./constants";
import HomologationPoweredBy from "./HomologationPoweredBy";

type HomologationLeftSectionProps = {
    selectedAPIs: Set<API>;
    setSelectedAPIs: (apis: Set<API>) => void;
};

const HomologationLeftSection = ({ selectedAPIs, setSelectedAPIs }: HomologationLeftSectionProps) => {
    return (
        <div
            className="flex flex-1 flex-col pt-5 pl-5"
            style={{
                height: `calc(100vh - ${headerHeight}px)`,
            }}
        >
            <div className="flex-[3] min-h-0">
                <HomologationUsedAPIs selectedAPIs={selectedAPIs} setSelectedAPIs={setSelectedAPIs} />
            </div>
            <div className="flex-[2] mt-5 min-h-0">
                <HomologationVehicleProperties />
            </div>
            <div className="h-fit flex-shrink-0 mt-4 flex flex-col">
                <p className="text-[13px] text-center flex-shrink-0 text-gray-600">This prototype is powered by</p>
                <HomologationPoweredBy />
            </div>
        </div>
    );
};

export default HomologationLeftSection;
