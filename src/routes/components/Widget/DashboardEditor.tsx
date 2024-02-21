import { useState, useEffect, useRef } from "react";
import Button from "../../../reusable/Button";
import {
    TbEdit,
    TbTrash,
    TbX,
    TbCheck,
    TbExclamationMark,
    TbCategoryPlus,
    TbSelector,
    TbCopy,
    TbExternalLink,
    TbCategory,
} from "react-icons/tb";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";
import CodeEditor from "../CodeViewer/CodeEditor";
import CustomModal from "../../../reusable/Popup/CustomModal";
import triggerConfirmPopup from "../../../reusable/triggerPopup/triggerConfirmPopup";
import WidgetLibrary from "../WidgetLibrary";
import copyText from "../../../reusable/copyText";
import BUILT_IN_WIDGETS from "../../../utils/buildInWidget";

interface DashboardEditorProps {
    widgetConfigString?: string;
    entireWidgetConfig?: string;
    onDashboardConfigChanged: (config: any) => void;
    editable?: boolean;
    usedAPIs?: any[];
}

export interface WidgetConfig {
    plugin: string;
    widget: string;
    options: any;
    boxes: number[];
}

export const isContinuousRectangle = (pickedCells: number[]): boolean => {
    // console.log("pickedCells", pickedCells);
    const numCols = 5;
    if (pickedCells.length <= 1) return true; // Single cell is always valid
    // Convert cell number to grid position
    const toGridPosition = (cell: number): [number, number] => {
        let row = Math.floor((cell - 1) / numCols);
        let col = (cell - 1) % numCols;
        return [row, col];
    };
    // Create a matrix to represent the grid
    let grid = Array(2)
        .fill(null)
        .map(() => Array(5).fill(false));
    // Mark the selected cells in the grid
    pickedCells.forEach((cell) => {
        const [row, col] = toGridPosition(cell);
        grid[row][col] = true;
    });
    // Find the bounding box of the selected cells
    let minRow = 2,
        maxRow = -1,
        minCol = 5,
        maxCol = -1;
    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                minRow = Math.min(minRow, rowIndex);
                maxRow = Math.max(maxRow, rowIndex);
                minCol = Math.min(minCol, colIndex);
                maxCol = Math.max(maxCol, colIndex);
            }
        });
    });
    // Check all cells within the bounding box are selected
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            if (!grid[row][col]) {
                return false; // Found a cell in the bounding box that is not selected
            }
        }
    }
    return true; // All cells within the bounding box are selected
};

const DashboardEditor = ({
    widgetConfigString,
    entireWidgetConfig,
    onDashboardConfigChanged,
    editable,
    usedAPIs,
}: DashboardEditorProps) => {
    const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([]);
    const [selectedWidgetIndex, setSelectedWidgetIndex] = useState<number | null>(null);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<any>(null); // Hold the widget config string
    const [warningMessage, setWarningMessage] = useState<string | null>(null);
    const [warningMessage2, setWarningMessage2] = useState<string | null>(null); // New warning message for widget library
    const [isConfigValid, setIsConfigValid] = useState(true); // Prevent crash during editting
    const [selectedCells, setSelectedCells] = useState<number[]>([]); // New state to track selected cells
    const [selectedCellValid, setSelectedCellValid] = useState<boolean>(false);
    const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState<boolean>(false);
    const [targetSelectionCells, setTargetSelectionCells] = useState<number[]>([]); // New state to track selected cells
    const [isExpanded, setIsExpanded] = useState<boolean>(false); // Expand used APIs dropdown list
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [buildinWidgets, setBuildinWidgets] = useState<any[]>(BUILT_IN_WIDGETS);

    const doesOverlap = (updatedWidgetConfig: WidgetConfig, index: number): boolean => {
        const otherWidgets = widgetConfigs.filter((_, idx) => idx !== index);
        const updatedBoxes = new Set(updatedWidgetConfig.boxes);
        for (const widget of otherWidgets) {
            for (const box of widget.boxes) {
                if (updatedBoxes.has(box)) {
                    return true; // Found an overlap
                }
            }
        }
        return false; // No overlap found
    };

    useEffect(() => {
        if (entireWidgetConfig) {
            try {
                const config = JSON.parse(entireWidgetConfig);
                const widgetArray = config.widgets || config; // Fallback to config if widgets key is absent
                setWidgetConfigs(widgetArray);
                let message = "";
                let isConfigValidLocal = true;
                // Check each widget in the array
                for (let i = 0; i < widgetArray.length; i++) {
                    const widget = widgetArray[i];
                    // Check for continuous rectangle
                    if (!isContinuousRectangle(widget.boxes)) {
                        message = "One or more widgets have discrete cell placement. Please check the configuration.";
                        isConfigValidLocal = false;
                        break;
                    }
                    // Check for overlaps
                    const otherWidgets = widgetArray.filter((_, idx) => idx !== i);
                    const doesOverlapResult = otherWidgets.some((otherWidget) =>
                        otherWidget.boxes.some((box) => widget.boxes.includes(box))
                    );
                    if (doesOverlapResult) {
                        message = "One or more widgets are overlapping. Please check the configuration.";
                        isConfigValidLocal = false;
                        break;
                    }
                }
                setIsConfigValid(isConfigValidLocal);
                setWarningMessage2(message);
            } catch (e) {
                setIsConfigValid(false);
                setWarningMessage2("The raw configuration text is not valid. Please check the configuration.");
            }
        }
    }, [entireWidgetConfig]);

    const handleDeleteWidget = (widgetIndex: number) => {
        triggerConfirmPopup("Are you sure you want to delete this widget?", () => {
            const updatedWidgets = widgetConfigs.filter((_, index) => index !== widgetIndex);
            const newConfigs = { ...JSON.parse(entireWidgetConfig || ""), widgets: updatedWidgets };
            setWidgetConfigs(updatedWidgets);
            onDashboardConfigChanged(JSON.stringify(newConfigs, null, 2));
        });
    };

    const handleUpdateWidget = () => {
        if (selectedWidgetIndex !== null) {
            try {
                const updatedWidgetConfig = JSON.parse(selectedWidget);
                if (
                    isContinuousRectangle(updatedWidgetConfig.boxes) &&
                    !doesOverlap(updatedWidgetConfig, selectedWidgetIndex)
                ) {
                    const updatedWidgets = [...widgetConfigs];
                    updatedWidgets[selectedWidgetIndex] = updatedWidgetConfig;
                    const newConfigs = { ...JSON.parse(entireWidgetConfig || ""), widgets: updatedWidgets };
                    setWidgetConfigs(updatedWidgets);
                    onDashboardConfigChanged(JSON.stringify(newConfigs, null, 2));
                    setWarningMessage(null);
                } else {
                    let message = "";
                    if (!isContinuousRectangle(updatedWidgetConfig.boxes)) {
                        message = "The cells placement is discrete. Please try again.";
                    }
                    if (doesOverlap(updatedWidgetConfig, selectedWidgetIndex)) {
                        message = "The cells placement is overlapping. Please try again.";
                    }
                    setWarningMessage(message);
                }
            } catch (e) {
                console.error("Failed to parse the updated widget configuration", e);
            }
        } else {
            console.error("No widget is selected for updating");
        }
    };

    //Timeout for warning message
    useEffect(() => {
        (async () => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            setWarningMessage(null);
        })();
    }, [warningMessage]);

    const handleAddWidget = () => {
        setTargetSelectionCells(selectedCells);
        setIsWidgetLibraryOpen(true);
    };

    const handleSelectCell = (cell: number) => {
        let updatedSelectedCells = selectedCells.includes(cell)
            ? selectedCells.filter((c) => c !== cell)
            : [...selectedCells, cell].sort((a, b) => a - b);

        const isValidSelection = isContinuousRectangle(updatedSelectedCells);
        setSelectedCells(updatedSelectedCells);
        setSelectedCellValid(isValidSelection);
        setSelectedWidgetIndex(null); // unselect placed widget
        if (!isValidSelection) {
            // Optional: Notify user of invalid selection
        }
    };
    const handleWidgetClick = (index: number) => {
        setSelectedWidgetIndex(index);
        // Deselect any selected cells
        setSelectedCells([]);
    };

    // Handle open widget in Widget Studio
    const handleOpenWidget = (index: number) => {
        const widgetConfig = widgetConfigs[index];
        if (widgetConfig.options.url.includes("bewebstudio")) {
            // Extract the project ID and file name from the URL
            const urlParts = widgetConfig.options.url.split("/data/projects/")[1].split("/");
            const projectId = urlParts[0];
            const fileName = urlParts.slice(1).join("/");
            // Construct the new URL
            const newUrl = `https://studio.digitalauto.tech/project/${projectId}?fileName=/${encodeURIComponent(
                fileName
            )}`;
            // Open the new URL
            window.open(newUrl);
        }
    };

    // Calculate the rowSpan and colSpan of widget box to merge the cells
    const calculateSpans = (boxes) => {
        let minCol = Math.min(...boxes.map((box) => ((box - 1) % 5) + 1));
        let maxCol = Math.max(...boxes.map((box) => ((box - 1) % 5) + 1));
        let minRow = Math.ceil(Math.min(...boxes) / 5);
        let maxRow = Math.ceil(Math.max(...boxes) / 5);

        let colSpan = maxCol - minCol + 1;
        let rowSpan = maxRow - minRow + 1;

        return { rowSpan, colSpan };
    };

    const widgetItem = (widgetConfig: WidgetConfig, index: number, cell: number) => {
        const { rowSpan, colSpan } = calculateSpans(widgetConfig.boxes);
        return (
            <div
                className={`group flex relative border border-gray-300 select-none cursor-pointer col-span-${colSpan} row-span-${rowSpan} text-gray-600 text-sm ${
                    selectedWidgetIndex === index && `!border-aiot-blue border-2 !text-aiot-blue !bg-slate-50 `
                } bg-gray-100 hover:bg-gray-100`}
                key={`${index}-${cell}`}
                onClick={() => handleWidgetClick(index)}
            >
                <div className="hidden group-hover:block w-fit absolute right-1 top-1 bg-white/90 rounded">
                    <div className="flex items-center">
                        <GeneralTooltip className="py-1" content="Delete widget" space={20} delay={500}>
                            <Button
                                icon={TbTrash}
                                className="!px-0"
                                iconClassName="ml-2 mr-2 w-5 h-5 text-red-500 hover:text-red-400"
                                onClick={() => handleDeleteWidget(index)}
                            />
                        </GeneralTooltip>
                        {widgetConfig.options?.url && widgetConfig.options.url.includes("bewebstudio") && (
                            <GeneralTooltip className="py-1" content="Open widget in Studio" space={20} delay={500}>
                                <Button
                                    icon={TbExternalLink}
                                    className="!px-0 hover:text-aiot-blue"
                                    iconClassName="mr-2 w-5 h-5"
                                    onClick={() => handleOpenWidget(index)}
                                />
                            </GeneralTooltip>
                        )}

                        <GeneralTooltip className="py-1" content="Edit widget" space={20} delay={500}>
                            <Button
                                icon={TbEdit}
                                className="!px-0 hover:text-aiot-blue"
                                iconClassName="mr-2 w-5 h-5"
                                onClick={() => {
                                    setSelectedWidget(JSON.stringify(widgetConfig, null, 2));
                                    setShowCodeEditor(true);
                                }}
                            />
                        </GeneralTooltip>
                    </div>
                </div>
                <div className="flex flex-col w-full p-3 justify-center items-center">
                    <div className="flex flex-col justify-center items-center overflow-hidden">
                        <div className="flex w-full min-w-[100px] max-w-[300px] h-3/4 max-h-[200px] justify-center">
                            {(() => {
                                const imageUrl =
                                    widgetConfig.options && widgetConfig.options.iconURL
                                        ? widgetConfig.options.iconURL
                                        : buildinWidgets.find((widget) => widget.widget === widgetConfig?.widget)?.icon;
                                if (imageUrl) {
                                    return (
                                        <img
                                            src={imageUrl}
                                            alt="widget icon"
                                            className="flex rounded-lg object-contain"
                                        />
                                    );
                                } else {
                                    return <TbCategory className="w-full text-aiot-blue h-full pb-2 stroke-[1.8]" />;
                                }
                            })()}
                        </div>
                        <div className="w-full text-center !text-xs font-semibold pt-2">
                            {widgetConfig.options?.url && widgetConfig.options.url.includes("/store-be/")
                                ? widgetConfig.options.url.split("/store-be/")[1].split("/")[0].replace(/%20/g, " ")
                                : widgetConfig.widget}
                        </div>
                    </div>
                    {/* <div className="text-xs rounded-full bg-gray-100 px-2 lease">
                        {widgetConfig.boxes
                            .sort((a, b) => a - b)
                            .map((box) => `${box},`)
                            .join("")
                            .replace(/,\s*$/, "")}
                    </div> */}
                </div>
            </div>
        );
    };

    const widgetGrid = () => {
        if (!isConfigValid) {
            return (
                <div className="flex col-span-5 row-span-2 justify-center items-center w-full h-full">
                    <div className="flex items-center text-gray-500">
                        <TbExclamationMark className="w-5 h-5 mr-0.5 text-orange-500" />
                        {warningMessage2
                            ? warningMessage2
                            : "The configuration is not valid. Please check the configuration."}
                    </div>
                </div>
            );
        }

        const renderedWidgets = new Set();
        // Render blank cells
        return CELLS.map((cell) => {
            const widgetIndex = widgetConfigs.findIndex((w) => w.boxes?.includes(cell));
            const isCellSelected = selectedCells.includes(cell);

            if (selectedCellValid && isCellSelected) {
                // Calculate position and spans
                const { rowSpan, colSpan } = calculateSpans(selectedCells);

                // Render merged cell with button if it's the first cell in selection
                if (cell === Math.min(...selectedCells)) {
                    return (
                        <div
                            key={`merged-${cell}`}
                            className={`flex relative border border-gray-300 col-span-${colSpan} row-span-${rowSpan} cursor-pointer !bg-white border-2 border-gray-500 items-center justify-center text-gray-400`}
                        >
                            <GeneralTooltip
                                content="Add widget from marketplace or built-in library"
                                className="!py-1"
                                space={30}
                                delay={500}
                            >
                                <Button
                                    icon={TbCategoryPlus}
                                    variant="white"
                                    onClick={() => handleAddWidget()}
                                    className="hover:text-gray-600"
                                    iconClassName="w-4 h-4"
                                >
                                    Add widget
                                </Button>
                            </GeneralTooltip>

                            <GeneralTooltip content="Cancel place widget" className="!py-1" space={30} delay={500}>
                                <Button
                                    className="mr-0 absolute top-2 right-0 hover:text-red-500"
                                    icon={TbX}
                                    iconClassName="w-5 h-5"
                                    onClick={() => setSelectedCells([])}
                                />
                            </GeneralTooltip>
                        </div>
                    );
                }
                return null; // Skip rendering for other cells in valid selection
            }

            if (widgetIndex !== -1 && !renderedWidgets.has(widgetIndex)) {
                renderedWidgets.add(widgetIndex);
                return widgetItem(widgetConfigs[widgetIndex], widgetIndex, cell);
            } else if (widgetIndex === -1) {
                return (
                    <div
                        key={`empty-${cell}`}
                        className={`flex border border-gray-300 justify-center items-center select-none text-sm text-gray-300 font-bold cursor-pointer ${
                            selectedCells.includes(cell) && "bg-gray-200 text-gray-600"
                        }`}
                        onClick={() => handleSelectCell(cell)}
                    >
                        {cell}
                    </div>
                );
            }
        });
    };

    return (
        <div className="flex flex-col w-full p-1 items-center justify-center">
            <div
                className={`grid w-full grid-cols-5 grid-rows-2 border border-gray-300 ${
                    editable ? "cursor-pointer" : "!pointer-events-none"
                } `}
                style={{ gridTemplateRows: "repeat(2, 120px)" }}
            >
                {widgetGrid()}
            </div>
            {editable && (
                <div className="italic py-0.5 text-slate-400 font-thin text-[14px]">
                    Click on empty cell to place new widget
                </div>
            )}
            {warningMessage && (
                <div className="flex w-fit mt-3 rounded py-1 px-2 justify-center items-center border border-gray-100 shadow-sm select-none">
                    <TbExclamationMark className="flex w-5 h-5 text-red-500 mr-1" />
                    <div className="flex text-gray-600">{warningMessage}</div>
                </div>
            )}
            <CustomModal
                isOpen={showCodeEditor}
                onClose={() => setShowCodeEditor(false)}
                className="flex w-[90%] max-w-[880px] h-[500px] bg-white rounded"
            >
                <div className="flex flex-col w-full h-full">
                    <div className="flex relative w-full justify-between items-center p-4">
                        <div className="flex items-center text-aiot-blue">
                            <TbEdit className="w-6 h-6 mr-1.5" />
                            <div className="flex text-lg font-bold">Edit widget</div>
                        </div>
                        {usedAPIs && usedAPIs.length > 0 && (
                            <div ref={dropdownRef} className="flex flex-col relative">
                                <div className="flex w-full justify-end">
                                    <Button
                                        variant="white"
                                        className="flex bg-white justify-end hover:bg-gray-50 w-fit"
                                        icon={TbSelector}
                                        onClick={() => {
                                            setIsExpanded(!isExpanded);
                                        }}
                                    >
                                        Recently used APIs
                                    </Button>
                                </div>
                                {isExpanded && (
                                    <div className="absolute flex flex-col top-9 right-0 bg-white z-10 rounded border border-gray-200 shadow-sm cursor-pointer">
                                        {usedAPIs.map((api) => (
                                            <div
                                                onClick={() => copyText(api.name, `Copied "${api.name}" to clipboard.`)}
                                                className="flex h-50% rounded hover:bg-gray-50 items-center text-gray-600 group justify-between px-2 py-1 m-1"
                                                key={api.name}
                                            >
                                                <div className="flex text-sm mr-2">{api.name}</div>
                                                {
                                                    <TbCopy
                                                        className={`w-4 h-4 cursor-pointer invisible group-hover:visible`}
                                                    />
                                                }
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <CodeEditor
                        language="json"
                        editable={true}
                        code={selectedWidget}
                        setCode={(e) => {
                            setSelectedWidget(e);
                        }}
                        onBlur={() => {}}
                    />
                    <div className="flex w-full space-x-2 justify-end p-4">
                        <Button icon={TbX} variant="white" className="" onClick={() => setShowCodeEditor(false)}>
                            Close
                        </Button>
                        <Button
                            icon={TbCheck}
                            variant="blue"
                            className=""
                            onClick={() => {
                                handleUpdateWidget();
                                setShowCodeEditor(false);
                            }}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </CustomModal>

            <WidgetLibrary
                usedAPIs={usedAPIs}
                targetSelectionCells={targetSelectionCells}
                entireWidgetConfig={entireWidgetConfig}
                updateDashboardCfg={onDashboardConfigChanged}
                openPopup={isWidgetLibraryOpen}
                onClose={() => {
                    setIsWidgetLibraryOpen(false);
                    setSelectedCells([]);
                }}
            />
        </div>
    );
};

export default DashboardEditor;
