import clsx from "clsx";
import React, { CSSProperties, useMemo, useState } from "react";
import { TbChevronDown } from "react-icons/tb";
import UpdateVehiclePropertyModal from "./UpdateVehiclePropertyModal";
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel";
import { Model } from "../../../../apis/models";
import { convertJSONToProperty } from "../../../../utils/vehiclePropertyUtils";
import ViewVehicleProperty from "../../VehicleCategory/ViewVehicleProperty";

const ModelVehicleProperty = () => {
    const model = useCurrentModel() as Model;
    const [show, setShow] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    const vehicleCategory = model?.vehicle_category;
    const propertyJSON = model?.property;

    const customProperties = useMemo(() => {
        if (propertyJSON) return convertJSONToProperty(propertyJSON);
        else return [];
    }, [propertyJSON]);

    if (!model) return null;

    return (
        <div className="rounded border mb-4 px-4 py-1 border-gray-300 text-gray-500 bg-gray-50">
            <div
                className="flex rounded items-center select-none"
                style={
                    {
                        "--line-limit": 1,
                    } as CSSProperties
                }
            >
                <p>Vehicle Properties</p>

                <button
                    className="flex-shrink-0 hover:underline transition px-2 py-1 cursor-pointer rounded ml-auto font-bold text-sm flex text-aiot-blue items-end justify-center gap-1"
                    onClick={() => setShowEdit(true)}
                >
                    Update property
                </button>
                <button
                    className="flex-shrink-0 cursor-pointer transition ml-2 rounded px-2 py-1 font-bold text-sm flex hover:text-gray-900 items-end justify-center gap-1 -mr-2"
                    onClick={() => setShow((prev) => !prev)}
                >
                    Show <TbChevronDown className={clsx("text-lg transition", show && "rotate-180")} />
                </button>
            </div>

            {show && (
                <>
                    <div className="border-t border-t-gray-200 -mx-0.5 mt-1 mb-2" />
                    <ViewVehicleProperty vehicleCategory={vehicleCategory} customProperties={customProperties} />
                </>
            )}
            <UpdateVehiclePropertyModal isOpen={showEdit} onClose={() => setShowEdit(false)} />
        </div>
    );
};

export default ModelVehicleProperty;
