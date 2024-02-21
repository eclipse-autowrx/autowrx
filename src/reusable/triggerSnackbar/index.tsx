import { Snackbar } from "@mui/material";
import React, { FC, useEffect } from "react";
import { useState } from "react";
import ReactDOM from "react-dom";
import styles from "./triggerSnackbar.module.scss";

const SingleUseSnackbar: FC<{
    text: string;
    onClose: () => void;
}> = ({ text, onClose }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(true);
    }, []);

    return (
        <Snackbar
            style={{ zIndex: 99999 }}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            className={styles.SnackbarRoot}
            autoHideDuration={3000}
            open={open}
            message={text}
            onClose={() => {
                setOpen(false);
                onClose();
            }}
        />
    );
};

const triggerSnackbar = (text: string) => {
    const newWrapper = document.createElement("div");
    document.body.appendChild(newWrapper);

    const teardown = () => {
        newWrapper.remove();
    };

    ReactDOM.render(
        <React.StrictMode>
            <SingleUseSnackbar text={text} onClose={teardown} />
        </React.StrictMode>,
        newWrapper
    );
};

export default triggerSnackbar;
