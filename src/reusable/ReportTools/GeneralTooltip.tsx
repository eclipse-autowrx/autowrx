import React, { useState, useRef, ReactNode, RefObject } from "react";

interface GeneralTooltipProps {
    children: ReactNode;
    content: string | ReactNode;
    delay?: number;
    className?: string;
    targetRef?: RefObject<HTMLElement>;
    space?: number;
    fixedPosition?: boolean; // New property to determine if the tooltip should have a fixed position
}

const GeneralTooltip: React.FC<GeneralTooltipProps> = ({
    children,
    content,
    delay = 0,
    className = "",
    targetRef,
    space = 5,
    fixedPosition = false, // Default to false
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null); // Ref for the wrapper div

    const adjustPosition = (event?: React.MouseEvent) => {
        if (tooltipRef.current && wrapperRef.current) {
            const tooltipWidth = tooltipRef.current.offsetWidth;
            const tooltipHeight = tooltipRef.current.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let calculatedLeft = 0;
            let calculatedTop = 0;

            if (fixedPosition) {
                // Position tooltip above the child element at a fixed location
                const { top, left, width } = wrapperRef.current.getBoundingClientRect();
                calculatedLeft = left + width / 2 - tooltipWidth / 2;
                calculatedTop = top - tooltipHeight - space;
            } else if (targetRef && targetRef.current) {
                const { top, left, width } = targetRef.current.getBoundingClientRect();
                calculatedLeft = left + width / 2 - tooltipWidth / 2;
                calculatedTop = top - tooltipHeight - space;
            } else if (event) {
                calculatedLeft = event.clientX - tooltipWidth / 2;
                calculatedTop = event.clientY - tooltipHeight - space;

                // Adjust if tooltip goes beyond the right edge of the window
                if (calculatedLeft + tooltipWidth > windowWidth) {
                    calculatedLeft = windowWidth - tooltipWidth - 3; // Shift to the left
                }

                // Adjust if tooltip goes beyond the left edge of the window
                if (calculatedLeft < 0) {
                    calculatedLeft = 3; // Shift to the right
                }

                // Adjust if tooltip goes beyond the top edge of the window
                if (calculatedTop < 0) {
                    calculatedTop = event.clientY + 3; // Shift down
                }

                // Adjust if tooltip goes beyond the bottom edge of the window
                if (calculatedTop + tooltipHeight > windowHeight) {
                    calculatedTop = windowHeight - tooltipHeight - 3; // Shift up
                }
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

    const translateY = `translate-y-${(space / 5) * -1}`;

    const finalClassName = `bg-gray-800/90 text-white text-sm text-center rounded p-2 absolute z-50 transition-opacity duration-200 ease-in-out transition-transform ${className} ${
        showTooltip ? "opacity-100 translate-y-0" : `opacity-0 ${translateY}`
    }`;

    // Use useEffect to set tooltip position when using fixed position
    React.useEffect(() => {
        if (fixedPosition) {
            adjustPosition();
        }
    }, [fixedPosition]);

    return (
        <div
            ref={wrapperRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
        >
            {children}
            <div
                className={finalClassName}
                ref={tooltipRef}
                style={{ position: "fixed", visibility: showTooltip ? "visible" : "hidden" }}
            >
                {content}
            </div>
        </div>
    );
};

export default GeneralTooltip;
