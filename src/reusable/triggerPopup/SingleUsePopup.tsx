import clsx from "clsx";
import { useEffect, useState } from "react";
import Popup from "../Popup/Popup";
import styles from "./SingleUsePopup.module.scss";

interface SingleUsePopupProps {
    text: string | React.ReactNode;
    onClose: () => void;
    closePopupRef?: React.RefObject<(() => void) | null>;
    className?: string;
}

const SingleUsePopup = ({ text, onClose, closePopupRef, className }: SingleUsePopupProps) => {
    const selfManagedOpenState = useState(true);
    const [open, setOpen] = selfManagedOpenState;
    typeof closePopupRef !== "undefined" &&
        ((closePopupRef as any).current = () => {
            setOpen(false);
        });

    useEffect(() => {
        if (!open) onClose();
    }, [open, onClose]);

    return (
        <Popup
            state={selfManagedOpenState}
            trigger={<span></span>}
            width={"80%"}
            className={clsx(styles.Popup, className)}
        >
            {typeof text === "string" ? <div className="whitespace-pre">{text}</div> : text}
        </Popup>
    );
};

export default SingleUsePopup;
