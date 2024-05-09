import React, { useState, useEffect, useRef } from "react";

const LoadingLineAnimation = ({ loading, content }) => {
    const [linePosition, setLinePosition] = useState(0);
    const [direction, setDirection] = useState(1);
    const [maxLeft, setMaxLeft] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            setMaxLeft(containerRef.current.offsetWidth);
        }
    }, [containerRef]);

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setLinePosition((prevPosition) => {
                    let newPosition = prevPosition + 2 * direction;
                    if (newPosition >= maxLeft - 2 || newPosition <= 0) {
                        setDirection(-direction);
                    }
                    return newPosition;
                });
            }, 8);
            return () => clearInterval(interval);
        }
    }, [loading, direction, maxLeft]);

    return (
        <div
            ref={containerRef}
            className="bg-gray-100 shadow-sm border border-gray-200 rounded flex-1 flex items-center justify-center relative select-none"
        >
            {!loading ? (
                <div>{content}</div>
            ) : (
                <div
                    className="overflow-hidden"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: `${linePosition}px`,
                        height: "100%",
                        width: "2px",
                        backgroundColor: "#005072",
                        boxShadow: "0px 0px 20px #005072",
                    }}
                />
            )}
        </div>
    );
};

export default LoadingLineAnimation;
