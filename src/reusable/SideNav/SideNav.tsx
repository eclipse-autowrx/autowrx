import React, { Fragment, useState } from "react"
import styles from "./SideNav.module.scss"
import clsx from "clsx";
import { Drawer } from "@mui/material";

interface SideNavProps {
    trigger: React.ReactElement
    children: React.ReactNode
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    width?: string
    className?: string
}

const SideNav = ({trigger, children, state, width, className}: SideNavProps) => {
    const selfManaged = useState(false)
    const [open, setOpen] = state ?? selfManaged
    return (
        <Fragment>
            <span
            className={styles.placeholder}
            onClick={() => setOpen(true)}
            style={{display: "contents"}}
            >{trigger}</span>
            <Drawer open={open} onClose={() => setOpen(false)} anchor="right">
                <div
                className={clsx(styles.ModalInner, className)}
                style={{width: width ?? "400px !important", minWidth: 10}}
                >
                    {children}
                </div>
            </Drawer>
        </Fragment>
    )
}

export default SideNav