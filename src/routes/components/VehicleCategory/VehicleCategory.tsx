import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { TbExternalLink } from "react-icons/tb";
import CustomAutoComplete from "../../../reusable/CustomAutoComplete";
import InputContainer from "../../../reusable/Input/InputContainer";
import { vehicleClasses as vehicleCategoriesData } from "../../../data/vehicleClassification";
import Input from "../../../reusable/Input/Input";
import CustomVehicleProperties from "./CustomVehicleProperties";
import { Property } from "./VehicleProperty";

type VehicleCategoryProps = {
    vehicleCategory?: string;
    setVehicleCategory: Dispatch<SetStateAction<string>>;
    customProperties: Property[];
    setCustomProperties: Dispatch<SetStateAction<Property[]>>;
    showLabel?: boolean;
};

const VehicleCategory = ({
    showLabel = true,
    vehicleCategory,
    setVehicleCategory,
    customProperties,
    setCustomProperties,
}: VehicleCategoryProps) => {
    const [vehicleCategories, setVehicleCategories] = useState(vehicleCategoriesData);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");

    useEffect(() => {
        if (vehicleCategory) {
            if (vehicleCategoriesData.some((vCategory) => vCategory.name === vehicleCategory)) {
                return setSelectedCategory(vehicleCategory);
            } else {
                setSelectedCategory("Other");
                setCustomCategory(vehicleCategory);
            }
        }
    }, [vehicleCategory]);

    // Map data to proper format for CustomAutoComplete props
    const mappedVehicleCategories = useMemo(() => {
        const list = vehicleCategories.map((vCategory) => ({
            key: vCategory.name,
            value: `${vCategory.name} (${vCategory.numberOfAxles} axles)`,
        }));
        list.push({
            key: "Other",
            value: "Other",
        });
        return list;
    }, [vehicleCategories]);

    const filterVehicleCategories = (value: string) => {
        setVehicleCategories(
            vehicleCategoriesData.filter((vCategory) => vCategory.name.toLowerCase().includes(value.toLowerCase()))
        );
    };

    const onChangeHandler = (value: string) => {
        setSelectedCategory(value);
        if (value === "Other") {
            return setVehicleCategory(customCategory);
        }
        if (vehicleCategoriesData.some((vCategory) => vCategory.name === value)) {
            return setVehicleCategory(value);
        }
        setVehicleCategory("");
    };

    const onCustomChangeHandler = (value: string) => {
        if (selectedCategory === "Other") {
            setCustomCategory(value);
            setVehicleCategory(value);
        }
    };

    return (
        <>
            {showLabel && <h1 className="font-bold">Vehicle Properties</h1>}
            {/* Category */}
            <div className="flex w-full mt-2 items-center justify-between text-sm text-gray-600">
                <p>Category</p>
                <a
                    href="/public/imgs/vehicle_classification.png"
                    target="__blank"
                    className="text-[13px] text-gray-500 flex items-center gap-1"
                >
                    <TbExternalLink /> Learn more about vehicle categories
                </a>
            </div>
            <div className="flex mt-1 mb-6 justify-center items-center">
                <div className="flex-1">
                    <CustomAutoComplete
                        dropdownAlign="right"
                        containerClassName="!bg-gray-100"
                        textSize="base"
                        placeholder="Select a vehicle category"
                        value={selectedCategory}
                        onChange={onChangeHandler}
                        data={mappedVehicleCategories}
                        filter={filterVehicleCategories}
                    />
                </div>
            </div>

            {/* Custom Category */}
            {selectedCategory === "Other" && (
                <InputContainer
                    label="Custom Category"
                    input={
                        <Input
                            placeholder="Enter custom category name"
                            state={[customCategory, onCustomChangeHandler]}
                        />
                    }
                />
            )}

            <div className="w-full border-t border-t-gray-200 -mt-2 mb-4" />
            <CustomVehicleProperties properties={customProperties} setProperties={setCustomProperties} />
        </>
    );
};

export default VehicleCategory;
