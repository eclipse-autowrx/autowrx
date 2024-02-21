import { FC } from "react";
import Button from "../Button";
import TriggerPopup from "./triggerPopup";

const triggerConfirmPopup = (text: string, onConfirm: () => void) => {
    const closePopupRef = TriggerPopup(
        <div className="flex flex-col">
            <div className="text-gray-600">{text}</div>
            <div className="flex mt-4">
                <Button
                    className="py-1 ml-auto"
                    variant="white"
                    onClick={() => {
                        console.log(closePopupRef);
                        if (closePopupRef.current === null) {
                            return;
                        }
                        closePopupRef.current();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    className="py-1 ml-2"
                    variant="blue"
                    onClick={() => {
                        if (closePopupRef.current === null) {
                            return;
                        }
                        closePopupRef.current();
                        onConfirm();
                    }}
                >
                    Confirm
                </Button>
            </div>
        </div>,
        "!min-w-fit !w-fit"
    );
};

export default triggerConfirmPopup;
