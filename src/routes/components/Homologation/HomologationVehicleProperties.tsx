import React, { useMemo } from "react";
import { TbExternalLink } from "react-icons/tb";
import { useParams } from "react-router-dom";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { Model } from "../../../apis/backend/modelApi";
import { convertJSONToProperty } from "../../../utils/vehiclePropertyUtils";
import ViewVehicleProperty from "../VehicleCategory/ViewVehicleProperty";

const HomologationVehicleProperties = () => {
    const { model_id } = useParams();

    const model = useCurrentModel() as Model | undefined;

    const customProperties = useMemo(() => {
        if (model?.property) {
            return convertJSONToProperty(model.property);
        }
        return [];
    }, [model?.property]);

    if (!model) return null;

    return (
        <div className="rounded-3xl h-full flex flex-col bg-gray-50 p-5">
            <div className="mb-1 flex justify-between flex-shrink-0 items-center">
                <h1 className="font-bold text-xl">Vehicle Properties</h1>
                <a
                    href={`/model/${model_id}`}
                    target="__blank"
                    className="hover:text-aiot-blue text-gray-700 transition text-sm flex items-center gap-1"
                >
                    <TbExternalLink />
                    Detail
                </a>
            </div>
            <div className="flex-1 min-h-0 h-full flex justify-center flex-col overflow-y-auto scroll-gray">
                <ViewVehicleProperty customProperties={customProperties} vehicleCategory={model.vehicle_category} />
            </div>
        </div>
    );
};

export default HomologationVehicleProperties;
