import React, { useEffect, useRef, useState } from "react";
import CustomModal from "../../../../reusable/Popup/CustomModal";
import Button from "../../../../reusable/Button";
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel";
import { Model } from "../../../../apis/models";
import VehicleCategory from "../../VehicleCategory";
import { Property } from "../../VehicleCategory/VehicleProperty";
import {
    checkInvalidCategory,
    checkInvalidCustomProperties,
    convertJSONToProperty,
    convertPropertyToJSON,
} from "../../../../utils/vehiclePropertyUtils";
import { updateModelService } from "../../../../apis/backend/modelApi";

type UpdateVehiclePropertyModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const UpdateVehiclePropertyModal = ({ isOpen = false, onClose }: UpdateVehiclePropertyModalProps) => {
    const model = useCurrentModel() as Model;

    const [vehicleCategory, setVehicleCategory] = useState<string>("");
    const [customProperties, setCustomProperties] = useState<Property[]>([]);

    const modalRef = useRef<HTMLDivElement | null>(null);

    const [loading, setLoading] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Close and reset states
    const handleClose = () => {
        onClose();
        setCustomProperties([]);
    };

    useEffect(() => {
        if (isOpen) {
            setVehicleCategory(model.vehicle_category ?? "");
            if (model.property) {
                setCustomProperties(convertJSONToProperty(model.property));
            } else {
                setCustomProperties([]);
            }
        }
    }, [isOpen, model.property, model.vehicle_category]);

    useEffect(() => {
        if (model.vehicle_category !== vehicleCategory || model.property !== convertPropertyToJSON(customProperties)) {
            setDisabled(false);
        } else {
            setDisabled(true);
        }
    }, [customProperties, model.property, model.vehicle_category, vehicleCategory]);

    // Save update data
    const handleSave = async () => {
        setLoading(true);
        try {
            let err = checkInvalidCategory(vehicleCategory);
            if (err) {
                return setErrorMessage(err);
            }
            err = checkInvalidCustomProperties(customProperties);
            if (err) {
                return setErrorMessage(err);
            }
            setErrorMessage("");
            await updateModelService(model.id, {
                vehicle_category: vehicleCategory,
                property: convertPropertyToJSON(customProperties),
            });
            setDisabled(true);
            window.location.reload();
        } catch (error) {
            console.log("Update model service error", error);
        } finally {
            setLoading(false);
        }
    };

    if (!model) {
        console.log("Model not found");
        return null;
    }

    return (
        <CustomModal ref={modalRef} isOpen={isOpen}>
            <div className="bg-white rounded-md px-6 pt-6 pb-4 max-h-[90vh] overflow-y-auto scroll-gray w-[650px] max-w-[90vw]">
                <h2 className="text-lg font-semibold mb-4">Change Vehicle Properties</h2>
                <VehicleCategory
                    showLabel={false}
                    vehicleCategory={vehicleCategory}
                    setVehicleCategory={setVehicleCategory}
                    customProperties={customProperties}
                    setCustomProperties={setCustomProperties}
                />
                {errorMessage && <p className="text-red-500 text-sm mt-6 mb-3 pl-1">{errorMessage}</p>}
                <div className="flex mt-6 gap-4 mb-2 items-center justify-end">
                    <Button onClick={handleClose} variant="white" className="px-4 h-8">
                        <p className="text-sm">Cancel</p>
                    </Button>
                    <Button
                        showProgress={loading}
                        onClick={handleSave}
                        disabled={disabled}
                        variant="blue"
                        className="px-4 h-8"
                    >
                        <p className="text-sm">Save</p>
                    </Button>
                </div>
            </div>
        </CustomModal>
    );
};

export default UpdateVehiclePropertyModal;
