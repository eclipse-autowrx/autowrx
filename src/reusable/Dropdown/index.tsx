import { Menu } from "@mui/material";
import { FC, useState } from "react";
import styles from "./Dropdown.module.scss";

interface DropdownProps {
    trigger: React.ReactElement;
    children: React.ReactNode;
    onHover?: boolean;
}

const Dropdown: FC<DropdownProps> = ({ trigger, children, onHover = false }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLSpanElement>(null);

    const handleClose = () => setAnchorEl(null);

    return (
        <div className="inline-flex" style={{ zIndex: 9999 }}>
            <span
                style={{ display: "flex" }}
                onClick={(event) => {
                    if (anchorEl) {
                        setAnchorEl(null); // if dropdown is already open, close it
                    } else {
                        setAnchorEl(event.currentTarget); // else open the dropdown
                    }
                }}
                onMouseEnter={onHover ? (event) => setAnchorEl(event.currentTarget) : undefined}
            >
                {trigger}
            </span>
            <Menu
                dir="right"
                anchorEl={anchorEl}
                open={!!anchorEl}
                onClose={handleClose}
                MenuListProps={{
                    "aria-labelledby": "basic-button",
                }}
                onClick={handleClose}
                className={styles.Menu}
            >
                {children}
            </Menu>
        </div>
    );
};

export default Dropdown;
