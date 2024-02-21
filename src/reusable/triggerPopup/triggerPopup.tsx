import React, { createRef } from "react";
import ReactDOM from "react-dom";
import SingleUsePopup from "./SingleUsePopup";

const TriggerPopup = (text: string | React.ReactNode, className?: string) => {
    const closePopupRef = createRef<(() => void) | null>();

    const newWrapper = document.createElement("div");
    document.body.appendChild(newWrapper);

    const teardown = () => {
        newWrapper.remove();
    };

    ReactDOM.render(
        <React.StrictMode>
            <SingleUsePopup text={text} onClose={teardown} closePopupRef={closePopupRef} className={className} />
        </React.StrictMode>,
        newWrapper
    );

    return closePopupRef;
};

export default TriggerPopup;
