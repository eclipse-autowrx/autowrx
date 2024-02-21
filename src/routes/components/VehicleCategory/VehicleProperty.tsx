import React from "react";
import CustomSelect from "../../../reusable/ReportTools/CustomSelect";
import { TbX } from "react-icons/tb";
import AltCustomInput from "../../../reusable/Input/AltCustomInput";
import clsx from "clsx";

export type Property = {
    name: string;
    type: "string" | "number" | "boolean" | "null";
    value: string;
};

const dataTypes: { label: Property["type"]; value: Property["type"] }[] = [
    {
        label: "string",
        value: "string",
    },
    {
        label: "number",
        value: "number",
    },
    {
        label: "boolean",
        value: "boolean",
    },
    {
        label: "null",
        value: "null",
    },
];

const booleanValues = [
    { label: "true", value: "true" },
    { label: "false", value: "false" },
];

type VehiclePropertyProps = {
    property: Property;
    onPropertyChange: (property: Property) => void;
    onDelete: () => void;
};

const VehicleProperty = ({ property, onPropertyChange, onDelete }: VehiclePropertyProps) => {
    // Change type of property
    const typeChangeHandler = (type: string | number | undefined) => {
        let newValue: Property["value"] = "null";
        if (type === "string") {
            newValue = "";
        } else if (type === "number") {
            newValue = "0";
        } else if (type === "boolean") {
            newValue = "false";
        }

        onPropertyChange({ ...property, value: newValue, type: type as Property["type"] });
    };

    // Currying function for handy function call
    const onChangeHandler = (key: keyof Property) => (s: string) => {
        onPropertyChange({ ...property, [key]: s });
    };

    return (
        <div className="flex items-center justify-center gap-1">
            <div className="grid gap-x-2 w-full gap-y-1 grid-cols-12 items-center">
                {/* Name */}
                <AltCustomInput
                    value={property.name}
                    setValue={onChangeHandler("name")}
                    placeholder="prop_name"
                    className="text-sm"
                    containerClassName="!bg-gray-100 h-8 col-span-4"
                />

                {/* Type */}
                <div className="col-span-2">
                    <CustomSelect
                        onValueChange={typeChangeHandler}
                        fullWidth
                        customDropdownItemStyle="h-8"
                        customContainerClassName="bg-gray-100 h-8 px-1 border shadow-none"
                        selectedValue={property.type}
                        options={dataTypes}
                    />
                </div>

                {/* Value */}
                {property.type === "boolean" ? (
                    // If type is boolean, let user select true or false
                    <div className="col-span-6">
                        <CustomSelect
                            fullWidth
                            customDropdownItemStyle="h-8"
                            customContainerClassName="bg-gray-100 h-8 px-2 border shadow-none"
                            selectedValue={property.value}
                            options={booleanValues}
                            onValueChange={(s) => onChangeHandler("value")(s as string)}
                        />
                    </div>
                ) : (
                    // Else, let user type input value
                    <AltCustomInput
                        disabled={property.type === "null"}
                        onKeyPress={(event) => {
                            if (
                                property.type === "number" &&
                                !/(^-?([0-9]*[.])?[0-9]*)$/.test(property.value + event.key)
                            ) {
                                event.preventDefault();
                            }
                        }}
                        value={property.value}
                        setValue={(s) => onPropertyChange({ ...property, value: s })}
                        className={clsx("text-sm", property.type === "number" && "text-blue-600")}
                        containerClassName="!bg-gray-100 h-8 col-span-6"
                    />
                )}
            </div>

            {/* Button delete */}
            <button
                onClick={onDelete}
                className="text-xl w-8 h-8 flex-shrink-0 text-gray-600 hover:text-gray-900 transition flex items-center justify-center"
            >
                <TbX />
            </button>
        </div>
    );
};

export default VehicleProperty;
