import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import html2canvas from "html2canvas";
import Button from "../Button";
import { VscClose } from "react-icons/vsc";
import { BiEraser } from "react-icons/bi";

type RectangleType = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
};

interface HighlightScreenshotProps {
    className?: string;
    isDrawingGlobal: boolean;
    onClose: () => void;
    onEndHighlighting: (dataUrl: string) => void;
}

const HighlightScreenshot: React.FC<HighlightScreenshotProps> = ({
    className,
    isDrawingGlobal,
    onEndHighlighting,
    onClose,
}) => {
    const [isDrawing, setIsDrawing] = useState(isDrawingGlobal);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [rectangles, setRectangles] = useState<RectangleType[]>([]);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [isMouseOverTool, setIsMouseOverTool] = useState(false);
    const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);

    // Handle press left click to get set start position
    const handleMouseDown = (e) => {
        setIsDrawing(true);
        setIsMouseDown(true);

        const pos = e.target.getStage().getPointerPosition();
        setRectangles([
            ...rectangles,
            {
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                color: "rgba(0,0,0,0)",
            },
        ]);
    };

    // Handle hold and drag left click to draw the rectangle Highlighting area
    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        if (tooltipRef.current) {
            tooltipRef.current.style.left = `${point.x + 15}px`;
            tooltipRef.current.style.top = `${point.y + 15}px`;
        }

        // If the mouse is down, start drawing
        if (isMouseDown) {
            // Modify last rectangle
            let lastRect = rectangles[rectangles.length - 1];
            lastRect.width = point.x - lastRect.x;
            lastRect.height = point.y - lastRect.y;

            rectangles.splice(rectangles.length - 1, 1, lastRect);
            lastRect.color = "rgba(255,255,255,1)";
            setRectangles([...rectangles]);
        }
    };

    const handleMouseUp = () => {
        setIsMouseDown(false);
    };

    const handleCompleteHighlighting = async () => {
        const dataUrl = await handleTakeScreenshot();
        onEndHighlighting(dataUrl); // Pass the screenshot data URL to the parent component
        handleClearHighlighting();
    };

    // const handleTakeScreenshot = async () => {
    //     setIsTakingScreenshot(true);

    //     // Get the current viewport size
    //     const viewportWidth = window.innerWidth;
    //     const viewportHeight = window.innerHeight;

    //     // Set the target resolution
    //     const targetWidth = 1920;
    //     const targetHeight = 1080;

    //     // Calculate the scale factors for width and height
    //     const scaleX = targetWidth / viewportWidth;
    //     const scaleY = targetHeight / viewportHeight;

    //     // Choose the smaller scale factor to maintain the aspect ratio
    //     const scale = Math.min(scaleX, scaleY);

    //     try {
    //         // Capture only the current viewport
    //         const canvas = await html2canvas(window.document.documentElement, {
    //             scale,
    //             x: 0,
    //             y: window.scrollY, // Consider the current vertical scroll position
    //             width: viewportWidth,
    //             height: viewportHeight,
    //             allowTaint: true,
    //             useCORS: true
    //         });
    //         const dataUrl = canvas.toDataURL();
    //         setIsTakingScreenshot(false);
    //         return dataUrl; // return the screenshot data URL
    //     } catch (error) {
    //         console.error("Failed to capture screenshot: ", error);
    //         setIsTakingScreenshot(false);
    //         return "";
    //     }
    // };

    const handleTakeScreenshot = async () => {
        setIsTakingScreenshot(true);
        try {
            alert("Please allow the current tab to be shared for screenshot purposes");

            // Ask the user to select a screen, window, or tab to capture
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({
                preferCurrentTab: true,
                video: { cursor: "always" },
                audio: false,
            });

            // Create a video element to play the captured stream
            const video = document.createElement("video");
            video.srcObject = stream;
            await video.play();

            // Create a canvas and draw the video frame
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Failed to get canvas context");
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert the canvas to a data URL
            const dataUrl = canvas.toDataURL("image/webp");

            // Stop all video tracks to release resources
            stream.getTracks().forEach((track) => track.stop());
            setIsTakingScreenshot(false);
            return dataUrl;
        } catch (error) {
            console.error("Error taking screenshot:", error);
            setIsTakingScreenshot(false);
            return "";
        }
    };

    const handleClearHighlighting = () => {
        setRectangles([]);
    };

    const handleCloseHighlighting = () => {
        setIsDrawing(false);
        handleClearHighlighting();
        onClose();
    };

    useEffect(() => {
        setIsDrawing(isDrawingGlobal);
    }, [isDrawingGlobal]);

    return (
        <div
            className={className}
            style={{ zIndex: 10000 }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsMouseOverTool(false)} // Move freely outside the button area -> allow the tooltip to show
        >
            <div
                ref={tooltipRef}
                className={`fixed p-2 bg-aiot-blue text-white rounded text-base z-50 ${
                    isMouseDown || isMouseOverTool || !isDrawing ? "invisible" : "visible"
                }`}
                style={{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }}
            >
                Click and drag to highlight issues areas
            </div>
            <div
                className="fixed bottom-10 right-8 z-auto w-48"
                onMouseEnter={() => {
                    setIsMouseOverTool(true);
                }} // Prevent the tooltip from showing when the mouse is over the button area
                onMouseLeave={() => setIsMouseOverTool(false)}
                style={{ zIndex: 10000 }}
            >
                {/* Conditionally render the buttons based on whether a screenshot is being taken */}
                {isDrawing && !isTakingScreenshot && (
                    <div className="bg-white p-2 rounded shadow-sm min-w-fit text-xs justify-center flex flex-col">
                        <div className="flex justify-between items-center pt-1 pb-3">
                            <h2 className="text-sm font-bold text-aiot-blue">Hightlight Areas</h2>
                            <div className="text-gray-400 hover:text-aiot-blue" onClick={handleCloseHighlighting}>
                                <VscClose className="w-6 h-auto"></VscClose>
                            </div>
                        </div>
                        <Button
                            variant="white"
                            className="bg-gray-100 text-gray-200 hover:text-gray-600 hover:bg-gray-200/70 py-1 px-2 rounded mb-2 items-center"
                            onClick={handleClearHighlighting}
                        >
                            <BiEraser className="w-3 h-auto mr-1 scale-110" />
                            Clear areas
                        </Button>

                        <Button
                            onClick={handleCompleteHighlighting}
                            variant="custom"
                            className="bg-aiot-blue/95 text-white hover:bg-aiot-blue/80 border border-aiot-blue py-1 px-2 rounded"
                        >
                            Back to issue report
                        </Button>

                        <div
                            className="fixed top-0 left-0 w-screen h-screen border-2 border-aiot-green"
                            style={{ pointerEvents: "none", zIndex: 9998 }}
                        >
                            {" "}
                        </div>
                    </div>
                )}
            </div>
            {isDrawing && (
                <Stage
                    style={{ position: "absolute", bottom: "0", right: "0" }}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <Layer>
                        <Rect
                            x={0}
                            y={0}
                            width={window.innerWidth}
                            height={window.innerHeight}
                            fill="rgba(0,0,0,0.3)"
                        />
                        {rectangles.map((rect, i) => (
                            <React.Fragment key={i}>
                                <Rect
                                    x={rect.x}
                                    y={rect.y}
                                    width={rect.width}
                                    height={rect.height}
                                    fill={rect.color} // Apply the rectangle's color
                                    globalCompositeOperation="destination-out" // This is crucial as it removes the dark layer color where this rectangle is drawn
                                />
                                <Rect
                                    x={rect.x}
                                    y={rect.y}
                                    width={rect.width}
                                    height={rect.height}
                                    stroke="#005072"
                                    strokeWidth={2}
                                />
                            </React.Fragment>
                        ))}
                    </Layer>
                </Stage>
            )}
        </div>
    );
};

export default HighlightScreenshot;
