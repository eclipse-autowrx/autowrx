import React, { useState } from "react";

type TooltipProps = {
    children: React.ReactNode;
    preText: string;
    postText: string;
    email: string;
};

const Tooltip: React.FC<TooltipProps> = ({ children, preText, postText, email }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [emailCopied, setEmailCopied] = useState(false);

    const handleEmailClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.preventDefault();
        navigator.clipboard.writeText(email);
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 1250); // Reset after 2 seconds
    };

    return (
        <div className="relative">
            <div
                className="rounded-full h-5 w-5 bg-aiot-blue-m/80 flex items-center justify-center text-white cursor-pointer"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {children}
            </div>
            {showTooltip && (
                <div
                    className="overflow-hidden w-60 absolute bottom-5 right-0 transform translate-y bg-white text-gray-700 py-4 px-4 border rounded shadow-md flex flex-col items-start space-y-1 text-sm"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <div className="flex items-center space-x-1 ">
                        <div className="">{preText}</div>
                        <div className="">
                            <span className="underline text-blue-500 cursor-pointer" onClick={handleEmailClick}>
                                {email}
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0">{postText}</div>
                    {emailCopied && (
                        <div className="w-52 inline-flex justify-end">
                            <div className="text-aiot-blue-m text-xs font-semibold mr-3">Email is copied!</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
