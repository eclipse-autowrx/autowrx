import React, { Fragment, useState } from "react"
import Modal from '@mui/material/Modal';
import styles from "./Popup.module.scss"
import clsx from "clsx";

interface PopupProps {
    trigger: React.ReactElement
    children: React.ReactNode
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    width?: string
    className?: string
}

const Popup = ({trigger, children, state, width, className}: PopupProps) => {
    const selfManaged = useState(false)
    const [open, setOpen] = state ?? selfManaged
    return (
        <Fragment>
            <span className={styles.placeholder} onClick={() => setOpen(true)}>{trigger}</span>
            <Modal open={open} onClose={() => setOpen(false)}>
                <div
                className={clsx(styles.ModalInner, className)}
                style={{width: width ?? "400px !important"}}
                >
                    {children}
                </div>
            </Modal>
        </Fragment>
    )
}

export default Popup