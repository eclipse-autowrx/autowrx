import React from "react";

interface ProgressBarProps {
    progress: number;
    indicatorPosition?: "moving" | "end";
    indicator?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, indicatorPosition = "moving", indicator }) => {
    return (
        <div className="mt-1.5 flex items-center justify-center">
            <div className="relative w-[80px] h-[3px] rounded-full bg-gray-200/80 z-10">
                <div
                    className="absolute left-0 h-[3px] bg-aiot-gradient-6 rounded-full transition-width"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {indicator &&
                progress !== 100 &&
                (indicatorPosition === "moving" ? (
                    <MovingIndicator progress={progress} />
                ) : (
                    <EndIndicator progress={progress} />
                ))}
        </div>
    );
};

const MovingIndicator: React.FC<{ progress: number }> = ({ progress }) => {
    return (
        <div
            className="absolute text-xs text-gray-700"
            style={{
                bottom: "-0.05rem",
                fontSize: "0.4rem",
                left: `calc(50% + ${progress / 2 - 30}px)`,
                transform: "translateX(-50%)",
            }}
        >
            <span>{progress}%</span>
        </div>
    );
};

const EndIndicator: React.FC<{ progress: number }> = ({ progress }) => {
    return (
        <div className="ml-1 text-xs text-gray-700" style={{ fontSize: "0.4rem" }}>
            <span>{progress}%</span>
        </div>
    );
};

export default ProgressBar;
