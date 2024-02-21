import React, { useState, useRef, ReactNode, RefObject } from "react";

interface GeneralTooltipProps {
    children: ReactNode;
    content: string | ReactNode;
    delay?: number;
    className?: string;
    targetRef?: RefObject<HTMLElement>;
    space?: number;
}

const GeneralTooltip: React.FC<GeneralTooltipProps> = ({
    children,
    content,
    delay = 0,
    className = "",
    targetRef,
    space = 5,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    const adjustPosition = (event?: React.MouseEvent) => {
        // Only adjust position if the tooltip ref is available
        if (tooltipRef.current) {
            const tooltipWidth = tooltipRef.current.offsetWidth;
            const tooltipHeight = tooltipRef.current.offsetHeight;

            let calculatedLeft = 0;
            let calculatedTop = 0;

            if (targetRef && targetRef.current) {
                // If provided, use targetRef to position tooltip
                // Position tooltip based on targetRef element
                const { top, left, width } = targetRef.current.getBoundingClientRect();
                calculatedLeft = left + width / 2 - tooltipWidth / 2;
                calculatedTop = top - tooltipHeight - space;
            } else if (event) {
                // If not provided, use mouse cursor to position tooltip
                // Position tooltip based on mouse cursor
                calculatedLeft = event.clientX - tooltipWidth / 2;
                calculatedTop = event.clientY - tooltipHeight - space;
            }

            // Apply calculated positions to tooltip
            tooltipRef.current.style.left = `${calculatedLeft}px`;
            tooltipRef.current.style.top = `${calculatedTop}px`;
        }
    };

    const handleMouseEnter = (event: React.MouseEvent) => {
        adjustPosition(event);
        setTimer(window.setTimeout(() => setShowTooltip(true), delay));
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
        if (timer) {
            window.clearTimeout(timer);
        }
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        adjustPosition(event);
    };

    const finalClassName = `bg-gray-800/90 text-white text-sm text-center rounded p-2 absolute z-50 ${className} ${
        showTooltip ? "visible" : "invisible"
    }`;

    return (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove}>
            {children}
            <div className={finalClassName} ref={tooltipRef} style={{ position: "fixed" }}>
                {content}
            </div>
        </div>
    );
};

export default GeneralTooltip;
