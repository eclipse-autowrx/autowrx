import React from "react";
import VehicleProperty, { Property } from "./VehicleProperty";
import Button from "../../../reusable/Button";

type CustomPropertiesProps = {
    properties: Property[];
    setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
};

const CustomVehicleProperties = ({ properties, setProperties }: CustomPropertiesProps) => {
    const isEmpty = () => {
        return properties.length === 0;
    };

    const addPropertyHandler = () => {
        setProperties([...properties, { name: "", type: "string", value: "" }]);
    };

    const deletePropertyHandler = (index: number) => () => {
        setProperties(properties.filter((_, i) => i !== index));
    };

    const onPropertyChangeHandler = (index: number) => (property: Property) => {
        setProperties(properties.map((p, i) => (i === index ? property : p)));
    };

    return (
        <>
            <p className="text-sm -mt-3 flex text-gray-600 items-center py-2 gap-x-1 px-4 -mx-4">
                Custom Properties (optional)
            </p>

            <div className="text-gray-600">
                {/* Label */}

                {isEmpty() ? (
                    <div className="h-11 rounded-md bg-gray-100 text-sm flex items-center px-3 text-gray-400">
                        There{"'"}s no custom properties yet.
                    </div>
                ) : (
                    <div className="flex text-sm mb-1 justify-center gap-1">
                        <div className="flex-1 grid gap-x-2 gap-y-1 grid-cols-12 items-center">
                            <p className="col-span-4">Name</p>
                            <p className="col-span-2">Type</p>
                            <p className="col-span-5">Value</p>
                        </div>
                        <div className="w-8" />
                    </div>
                )}

                <ul className="text-sm space-y-2">
                    {properties.map((property, index) => (
                        <VehicleProperty
                            onPropertyChange={onPropertyChangeHandler(index)}
                            onDelete={deletePropertyHandler(index)}
                            key={index}
                            property={property}
                        />
                    ))}
                </ul>

                <Button onClick={addPropertyHandler} variant="white" className="mt-3 text-sm bg-white w-fit">
                    Add property
                </Button>
            </div>
        </>
    );
};

export default CustomVehicleProperties;
