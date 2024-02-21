import React, { Fragment, useState, useRef, useEffect } from "react";
import styles from "./SideNav.module.scss";
import clsx from "clsx";
import { Drawer } from "@mui/material";

interface SideNavProps {
    trigger: React.ReactElement;
    children: React.ReactNode;
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    width?: string;
    className?: string;
    scrollToTopTrigger?: number;
}

const SideNav = ({ trigger, children, state, width, className, scrollToTopTrigger }: SideNavProps) => {
    const selfManaged = useState(false);
    const [open, setOpen] = state ?? selfManaged;

    // Create a reference to the SideNav component
    const sideNavRef = useRef<HTMLDivElement | null>(null);

    // Function to scroll to the top of the SideNav component
    const scrollToTop = () => {
        sideNavRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // In the useEffect that handles scrolling to top, listen for changes in scrollToTopTrigger
    useEffect(() => {
        scrollToTop();
    }, [scrollToTopTrigger]);

    return (
        <Fragment>
            <span className={styles.placeholder} onClick={() => setOpen(true)} style={{ display: "contents" }}>
                {trigger}
            </span>
            <Drawer open={open} onClose={() => setOpen(false)} anchor="right" style={{ zIndex: 99998 }}>
                <div
                    className={clsx(styles.ModalInner, className)}
                    style={{ width: width ?? "400px !important", minWidth: 10 }}
                    ref={sideNavRef} // Set the reference here
                >
                    {children}
                    {/* Button to scroll to top
                    <button
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-all duration-200"
                        onClick={scrollToTop}
                    >
                        Scroll to Top
                    </button> */}
                </div>
            </Drawer>
        </Fragment>
    );
};

export default SideNav;
