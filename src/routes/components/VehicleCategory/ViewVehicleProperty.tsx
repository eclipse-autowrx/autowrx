import React, { useCallback } from "react";
import { Property } from "./VehicleProperty";
import clsx from "clsx";

type ViewVehiclePropertyProps = {
    vehicleCategory?: string;
    customProperties?: Property[];
    textSize?: string;
};

const ViewVehicleProperty = ({ vehicleCategory, customProperties, textSize = "text-sm" }: ViewVehiclePropertyProps) => {
    const getDisplayValue = useCallback((value: string, type: Property["type"]) => {
        switch (type) {
            case "string":
                return `"${value}"`;
            case "number":
                return value;
            case "boolean":
                return value;
            default:
                return "null";
        }
    }, []);

    if (!vehicleCategory) {
        return (
            <div className={clsx("flex italic items-center justify-center py-6 text-gray-600", textSize)}>
                {"<"}Properties not set yet{">"}
            </div>
        );
    }

    return (
        <div className={clsx("space-y-1 pb-1 h-full text-gray-600", textSize)}>
            <p className="font-bold">
                Category: <span>{vehicleCategory}</span>
            </p>
            {customProperties &&
                customProperties.map((property, index) => (
                    <p key={index}>
                        {property.name}: <span>{getDisplayValue(property.value, property.type)}</span>
                    </p>
                ))}
        </div>
    );
};

export default ViewVehicleProperty;
