import React, { FC, useEffect, useRef } from "react";
import TriggerPopup from "../../../reusable/triggerPopup/triggerPopup";
import { WidgetType } from "../pluginTypes";
import { GridItem } from "./types";

const HTMLNodeElement: FC<{
    node: Node;
}> = ({ node }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const container = ref.current;
        if (!container) {
            return;
        }
        container.innerText = "";
        container.appendChild(node);
    }, []);

    return <div className="flex w-full h-full" ref={ref}></div>;
};

interface InjectableIframeProps {
    gridItem: GridItem;
    widget: WidgetType;
}

const InjectableIframeUnmemoized: FC<InjectableIframeProps> = ({ gridItem, widget }) => {
    const ref = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        try {
            const deactivate = widget.onActivate({
                triggerPopup: (node: Node, className?: string) => {
                    const closePopupRef = TriggerPopup(<HTMLNodeElement node={node} />, className);
                    return () => {
                        if (closePopupRef.current !== null) {
                            closePopupRef.current();
                        }
                    };
                },
                window: ref.current?.contentWindow ?? null,
                injectHTML(html) {
                    if (ref.current === null) {
                        return;
                    }
                    const iframe = ref.current;
                    const body = iframe.contentDocument?.body;
                    if (typeof body === "undefined") {
                        return;
                    }
                    body.style.margin = "0px";
                    body.innerHTML = html;
                },
                injectNode(node) {
                    if (ref.current === null) {
                        return;
                    }
                    const iframe = ref.current;
                    const body = iframe.contentDocument?.body;
                    if (typeof body === "undefined") {
                        return;
                    }
                    body.style.margin = "0px";
                    body.textContent = "";
                    body.appendChild(node);
                },
                options: gridItem.options,
            });
            return () => {
                try {
                    deactivate && deactivate();
                } catch (error) {
                    //alert(`${widget.plugin_name + "::" + widget.name}'s deactivation function threw an error. Check console for the error.`)
                    console.error(error);
                }
            };
        } catch (error) {
            alert(
                `${
                    widget.plugin_name + "::" + widget.name
                }'s onActivate function threw an error. Check console for the error.`
            );
            console.error(error);
        }
    }, [ref.current]);

    return (
        <iframe
            ref={ref}
            className="w-full h-full m-0"
            allow="camera;microphone"
            title={widget.plugin_name + "::" + widget.name}
        ></iframe>
    );
};

const InjectableIframe = React.memo(InjectableIframeUnmemoized, (prevProps, nextProps) => {
    return (
        JSON.stringify(prevProps.gridItem.boxes) === JSON.stringify(nextProps.gridItem.boxes) &&
        prevProps.widget.plugin_name === nextProps.widget.plugin_name &&
        prevProps.widget.name === nextProps.widget.name
    );
});

export default InjectableIframe;
