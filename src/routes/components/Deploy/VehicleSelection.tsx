import { useRef, useEffect, useState } from "react";
import VehicleCard from "./VehicleCard";
import { TbExternalLink, TbTerminal2 } from "react-icons/tb";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";

export interface VehicleData {
    type: string;
    imgSrc: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    isInDevelopment?: boolean;
}

export interface VehicleSelectionProps {
    allKit: any[];
    code: string;
    usedAPIs: string[];
}

function VehicleSelection({ allKit, code, usedAPIs }: VehicleSelectionProps) {
    const [activeKitId, setActiveKitId] = useState<string | undefined>(""); // State to keep track of the active kit ID in KitConnect

    const initialVehicles: VehicleData[] = [
        {
            type: "Cloud",
            imgSrc: "/imgs/cloud-server.png",
            icon: (
                <GeneralTooltip
                    content="Go to runtime manager"
                    delay={50}
                    space={3}
                    fixedPosition={true}
                    className="ml-1 !py-1"
                >
                    <div className="flex p-0.5 rounded bg-aiot-blue-md/5 hover:bg-aiot-blue-md/10 ml-1">
                        <TbTerminal2
                            className="flex w-4 h-4 text-aiot-blue-100 cursor-pointer text-aiot-blue-md"
                            onClick={() => {
                                let link = `/runtime-manager${
                                    activeKitIdRef.current ? "?rtid=" + activeKitIdRef.current : ""
                                }`;
                                window.open(link, "_blank");
                            }}
                        ></TbTerminal2>
                    </div>
                </GeneralTooltip>
            ),
        },
        {
            type: "Autoverse",
            imgSrc: "/imgs/cloud-verse1.png",
            icon: (
                <GeneralTooltip
                    content="Learn more about Autoverse"
                    delay={50}
                    space={3}
                    fixedPosition={true}
                    className="ml-1 !py-1"
                >
                    <div className="flex p-0.5 rounded bg-aiot-blue-md/5 hover:bg-aiot-blue-md/10 ml-1">
                        <TbExternalLink
                            className="flex w-4 h-4 text-aiot-blue-100 cursor-pointer text-aiot-blue-md"
                            onClick={() => {
                                window.open("https://www.digital-auto.org/verse", "_blank");
                            }}
                        />
                    </div>
                </GeneralTooltip>
            ),
        },
        {
            type: "dreamKIT",
            imgSrc: "/imgs/DreamKit.png",
            icon: (
                <GeneralTooltip
                    content="Learn more about dreamKIT"
                    delay={50}
                    space={3}
                    fixedPosition={true}
                    className="ml-1 !py-1"
                >
                    <div className="flex p-0.5 rounded bg-aiot-blue-md/5 hover:bg-aiot-blue-md/10 ml-1">
                        <TbExternalLink
                            className="flex w-4 h-4 text-aiot-blue-100 cursor-pointer text-aiot-blue-md"
                            onClick={() => {
                                window.open("https://digital-auto.github.io/playground/dreamkit/overview", "_blank");
                            }}
                        />
                    </div>
                </GeneralTooltip>
            ),
        },
        {
            type: "TestFleet",
            imgSrc: "/imgs/ProductionVehicle.png",
            icon: (
                <GeneralTooltip
                    content="Learn more about TestFleet"
                    delay={50}
                    space={3}
                    fixedPosition={true}
                    className="ml-1 !py-1"
                >
                    <div className="flex p-0.5 rounded bg-aiot-blue-md/5 hover:bg-aiot-blue-md/10 ml-1">
                        <TbExternalLink
                            className="flex w-4 h-4 text-aiot-blue-100 cursor-pointer text-aiot-blue-md"
                            onClick={() => {
                                window.open("https://www.digital-auto.org/#comp-lm8xcdpg", "_blank");
                            }}
                        />
                    </div>
                </GeneralTooltip>
            ),
        },
    ];

    const [vehicles] = useState<VehicleData[]>(initialVehicles);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(vehicles[0]);
    const activeKitIdRef = useRef(activeKitId); // Ref to keep track of the active kit ID in KitConnect

    useEffect(() => {
        activeKitIdRef.current = activeKitId;
    }, [activeKitId]);

    // document.onmousemove = function (e) {
    //   var x = e.pageX;
    //   var y = e.pageY;
    //   (e.target as HTMLElement).title = "X is " + x + " and Y is " + y;
    // };

    const [darkLinesVisibility, setDarkLinesVisibility] = useState<boolean[]>(vehicles.map((_, index) => index === 0));
    const [lightLinesVisibility, setLightLinesVisibility] = useState<boolean[]>(new Array(vehicles.length).fill(true));

    const [animatedVehicleId, setAnimatedVehicleId] = useState<number | null>(null);

    const topDivRef = useRef<HTMLDivElement>(null);
    const [topDivRect, setTopDivRect] = useState<DOMRect | null>(null);
    const vehicleDivRefs = useRef<HTMLDivElement[]>([]);

    const handleVehicleClick = (index: any) => {
        setAnimatedVehicleId(index); // Set the currently animated vehicle
    };

    useEffect(() => {
        const handleResize = () => {
            if (topDivRef.current) {
                setTopDivRect(topDivRef.current.getBoundingClientRect());
            }
        };
        handleResize();

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        const updatePaths = () => {
            if (topDivRef.current && topDivRect) {
                // getBoundingClientReact return size and position of the div relative to the window not the parent element
                // const topDivRect = topDivRef.current.getBoundingClientRect();

                // Then get the size and position of the parent element relative to the window
                const parentRect = topDivRef.current?.parentElement?.getBoundingClientRect();

                // Then calculate the X and Y position of the top div but relative to the parent element not the window
                const startX = topDivRect.left + topDivRect.width / 2 - window.scrollX - (parentRect?.left || 0);
                const startY = topDivRect.bottom - window.scrollY - (parentRect?.top || 0);

                const initialVerticalOffset = 50; // Distance to start the curve from the starting point
                const curveRadius = 25; // Radius for the rounded corner

                vehicleDivRefs.current.forEach((div, index) => {
                    // Loop through each vehicle div and calculate the end position for the path
                    if (!div) return;

                    const vehicleDivRect = div.getBoundingClientRect();
                    const endX = vehicleDivRect.left + vehicleDivRect.width / 2 - (parentRect?.left || 0); // Subtract the left position of the parent element

                    // Y position of the top of the vehicle div but relative to the parent element not the window
                    const endY = vehicleDivRect.top - (parentRect?.top || 0);

                    let d: string;
                    const isMiddleVehicle = vehicles.length % 2 !== 0 && index === Math.floor(vehicles.length / 2);
                    if (isMiddleVehicle) {
                        // If the vehicle is in the middle, draw a straight line to the top div
                        d = `M ${startX},${startY} V ${startY + initialVerticalOffset * 2}`;
                    } else {
                        // if the vehicle is not in the middle, draw a path with a rounded corner
                        d = [
                            `M ${startX},${startY}`, // Move to start point
                            `V ${startY + initialVerticalOffset - curveRadius}`, // Vertical line to start of curve
                            // Quadratic Bezier curve for rounded corner, control point is at the corner, end point is after the curve
                            `Q ${startX},${startY + initialVerticalOffset} ${
                                startX + (endX - startX > 0 ? curveRadius : -curveRadius)
                            },${startY + initialVerticalOffset}`,
                            `H ${endX - (endX - startX > 0 ? curveRadius : -curveRadius)}`, // Horizontal line to before the end curve
                            // Quadratic Bezier curve for rounded corner at the end, control point is at the corner, end point is the target
                            `Q ${endX},${startY + initialVerticalOffset} ${endX},${
                                startY + initialVerticalOffset + curveRadius
                            }`,
                            `V ${endY}`, // Final vertical line to the target
                        ].join(" ");
                    }
                    // Set the 'd' attribute for the path
                    ["light", "dark", "outer"].forEach((type) => {
                        const path = document.getElementById(`${type}-path-${index}`);
                        if (path) {
                            path.setAttribute("d", d);
                        }
                    });
                });
            }
        };
        updatePaths();

        //     const images = topDivRef.current?.querySelectorAll("img");
        //     let loadedImages = 0;

        //     const imageLoaded = () => {
        //         loadedImages++;
        //         if (images && loadedImages === images.length) {
        //             // All images are loaded, now it's safe to calculate the paths
        //             updatePaths();
        //         }
        //     };

        //     images?.forEach((img) => {
        //         if (img.complete) {
        //             // Image is already loaded, immediately trigger the handler
        //             imageLoaded();
        //         } else {
        //             // Wait for the image to load
        //             img.addEventListener("load", imageLoaded);
        //         }
        //     });

        //     // If there are no images or all images are already loaded, still need to call updatePaths
        //     if (!images || images.length === 0 || loadedImages === images.length) {
        //         updatePaths();
        //     }

        //     // ResizeObserver to monitor changes in the size of the topDivRef
        //     const resizeObserver = new ResizeObserver((entries) => {
        //         for (let entry of entries) {
        //             if (entry.target === topDivRef.current) {
        //                 updatePaths();
        //             }
        //         }
        //     });

        //     if (topDivRef.current) {
        //         resizeObserver.observe(topDivRef.current);
        //     }

        // Clean up event listeners, observer, and other effects
        // return () => {
        //     images?.forEach((img) => {
        //         img.removeEventListener("load", imageLoaded);
        //     });
        //     if (topDivRef.current) {
        //         resizeObserver.unobserve(topDivRef.current);
        //     }
        // };
    }, [vehicles, topDivRef, vehicleDivRefs, topDivRect]);

    return (
        <>
            <style>
                {`.animate {
  will-change: stroke-dashoffset;
  stroke-dasharray: 7.5 7.5; /* Adjust the dash length to match your path's total length for a smoother transition */
  animation: marchAnts 0.2s linear infinite; /* Adjust the duration to better match your path length and desired speed */
}

@keyframes marchAnts {
  to {
    stroke-dashoffset: -15; /* Make sure this matches the total length of your dasharray to create a seamless loop */
  }
}
`}
            </style>

            <div className="flex flex-col w-full h-full text-gray-600 relative">
                <div ref={topDivRef} className="flex flex-col w-full flex-shrink-0 h-[151px] items-center py-5">
                    <img className="flex w-24 h-auto" src="/imgs/code1.png" alt="logo" />
                    <div className="text-2xl font-bold text-aiot-gradient-500 pt-2">playground.digital.auto</div>
                </div>
                <svg
                    id="outer-lines"
                    style={{
                        background: "transparent",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                    }}
                >
                    <defs>
                        <mask id="lineMask">
                            {/* In the mask, black areas are transparent and white areas are opaque. 
          This black rectangle is the starting point for the mask, making everything 
          it covers initially transparent (invisible). */}
                            <rect x="0" y="0" width="100%" height="100%" fill="black" />
                            {/* The white paths drawn here represent the areas that will be fully visible 
          (opaque) under the mask. So, where the paths are, the masked elements will 
          show through. The strokeWidth here sets the thickness of the pipes. */}
                            {vehicles.map((_, index) => (
                                <path
                                    key={index}
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="15"
                                    strokeOpacity={1} // This ensures the mask's white areas are fully opaque.
                                    strokeLinecap="square"
                                    strokeLinejoin="round"
                                    id={`outer-path-${index}`}
                                    // The 'd' attribute would go here, defining the path's shape
                                />
                            ))}
                        </mask>
                    </defs>

                    {/* This rectangle is the actual element being masked. The mask is applied to it, so
      it will appear wherever the mask's white paths are. */}
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="#e4e4e7" // The color visible where the mask's white paths are
                        mask="url(#lineMask)" // The mask applied to this rectangle
                        opacity="0.3" // The opacity of the pipes; this affects the entire rectangle
                    />
                </svg>

                <svg
                    id="light-lines"
                    style={{
                        background: "transparent",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                    }}
                >
                    {vehicles.map((_, index) => (
                        <path
                            key={index}
                            id={`light-path-${index}`}
                            stroke="#4B5563"
                            fill="none"
                            strokeWidth="0.7"
                            strokeOpacity="0.1"
                            strokeDasharray="6 5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                display: lightLinesVisibility[index] ? "block" : "none",
                            }}
                        />
                    ))}
                </svg>

                <svg
                    id="dark-lines"
                    style={{
                        background: "transparent",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 5,
                    }}
                >
                    <defs>
                        {vehicles.map((_, index) => (
                            <linearGradient
                                key={index} // Adding a key here for good React list rendering practice
                                id={`gradient-${index}`}
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#005072" />
                                <stop offset="1" stopColor="#2c6c64" />
                            </linearGradient>
                        ))}
                    </defs>
                    {vehicles.map((_, index) => (
                        <path
                            key={index}
                            id={`dark-path-${index}`}
                            stroke={`url(#gradient-${index})`}
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={"7 9"}
                            className={index === animatedVehicleId ? "animate" : ""}
                            style={{
                                display: darkLinesVisibility[index] ? "block" : "none",
                            }}
                        />
                    ))}
                </svg>

                <div className="flex w-full h-full pt-24 z-10">
                    {vehicles.map((vehicle, index) => (
                        <div
                            key={index}
                            ref={(el) => (vehicleDivRefs.current[index] = el!)}
                            className="flex flex-col w-full h-full items-center justify-center"
                            onClick={() => {
                                setSelectedVehicle(vehicle);
                                setDarkLinesVisibility(vehicles.map((_, i) => i === index)); // Show dark lines for the selected vehicle
                                setLightLinesVisibility(vehicles.map((_, i) => i !== index)); // Hide light lines for the selected vehicle
                                setAnimatedVehicleId(null); // Stop the animation
                            }}
                        >
                            <VehicleCard
                                key={index}
                                vehicle={vehicle}
                                index={index}
                                selected={selectedVehicle === vehicle}
                                handleVehicleClick={handleVehicleClick}
                                icon={vehicle.icon}
                                children={vehicle.children}
                                allKit={allKit}
                                code={code}
                                usedAPIs={usedAPIs}
                                onActiveKitChange={setActiveKitId}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default VehicleSelection;
