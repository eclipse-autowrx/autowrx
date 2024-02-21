import React, { Fragment, forwardRef, useState } from "react";
import Modal from "@mui/material/Modal";
import styles from "./Popup.module.scss";
import clsx from "clsx";

interface PopupProps {
    trigger: React.ReactElement;
    children: React.ReactNode;
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    width?: string;
    className?: string;
}

const Popup = forwardRef<HTMLDivElement, PopupProps>(({ trigger, children, state, width, className }, ref) => {
    const selfManaged = useState(false);
    const [open, setOpen] = state ?? selfManaged;
    return (
        <Fragment>
            <span className={styles.placeholder} onClick={() => setOpen(true)}>
                {trigger}
            </span>
            <Modal ref={ref} open={open} onClose={() => setOpen(false)} style={{ zIndex: 99999 }}>
                <div className={clsx(styles.ModalInner, className)} style={{ width: width ?? "400px !important" }}>
                    {children}
                </div>
            </Modal>
        </Fragment>
    );
});

Popup.displayName = "Popup";

export default Popup;
