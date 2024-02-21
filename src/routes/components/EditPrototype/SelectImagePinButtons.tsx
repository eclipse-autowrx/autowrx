import { MdWrongLocation } from "react-icons/md";
import { ImagePin, MediaFile } from "../../../apis/models";
import Button from "../../../reusable/Button";

interface SelectImagePinButtonsProps {
    loadingState: [boolean, (value: boolean) => void];
    selectedPinState: [ImagePin | undefined, (value: ImagePin | undefined) => void];
    confirmMedia: () => Promise<void>;
}
const SelectImagePinButtons = ({
    loadingState: [loading, setLoading],
    selectedPinState: [selectedPin, setSelectedPin],
    confirmMedia,
}: SelectImagePinButtonsProps) => {
    return loading ? (
        <div className="flex h-9 mt-auto justify-end">
            <Button disabled className="w-fit h-full">
                Loading
            </Button>
        </div>
    ) : (
        <>
            <div className="flex h-9 mt-auto justify-end">
                {selectedPin && (
                    <div
                        className="relative h-full flex w-fit px-2 select-none rounded transition cursor-pointer border border-gray-300 hover:border-aiot-blue mr-3"
                        onClick={() => setSelectedPin(undefined)}
                    >
                        <MdWrongLocation className="h-full w-fit" color="#c92a2a" style={{ transform: "scale(0.6)" }} />
                        <div className="mr-2 my-auto">Remove Pin</div>
                    </div>
                )}
                <Button variant="success" className="w-fit h-full" onClick={confirmMedia}>
                    Confirm
                </Button>
            </div>
        </>
    );
};

export default SelectImagePinButtons;
