import { useEffect, useState } from "react";
import { TbExclamationMark } from "react-icons/tb";

const SimpleGrid = ({ usedCells, onCellsPickedChanged, targetSelectionCells }) => {
    const [cells, setCells] = useState<any[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const [pickedCells, setPickedCells] = useState<any[]>([]);
    const [isWarning, setIsWarning] = useState(true);
    const [warningMessage, setWarningMessage] = useState("");

    const toggleCellSelection = (cell: any) => {
        if (pickedCells.includes(cell)) {
            setPickedCells(pickedCells.filter((c: any) => c != cell));
        } else {
            setPickedCells([...pickedCells, cell]);
        }
    };

    useEffect(() => {
        if (targetSelectionCells) {
            setPickedCells(targetSelectionCells);
            // console.log("targetSelectionCells", targetSelectionCells)
        }
    }, [targetSelectionCells]);

    useEffect(() => {
        if (onCellsPickedChanged) {
            onCellsPickedChanged(pickedCells || []);
        }
        // Logic to determine the warning message
        let warningMsg = "";
        let showWarning = false;
        if (usedCells.length === cells.length) {
            warningMsg = "All cells are selected";
            showWarning = true;
        } else if (pickedCells.length === 0) {
            warningMsg = "No cell is picked. Please select at least one cell";
            showWarning = true;
        }
        setIsWarning(showWarning);
        setWarningMessage(warningMsg);
    }, [pickedCells, usedCells, cells.length, onCellsPickedChanged]);

    const getCellColor = (cell: any) => {
        if (pickedCells.includes(cell)) {
            return "bg-aiot-blue/20 !text-aiot-blue";
        } else if (usedCells && usedCells.includes(cell)) {
            return "bg-gray-400 text-gray-600 cursor-not-allowed";
        } else {
            return "bg-gray-50";
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="w-full grid grid-cols-5 text-2xl text-gray-400 font-bold place-self-center cursor-pointer">
                {cells.map((cell: any) => (
                    <div
                        key={cell}
                        onClick={() => {
                            if (usedCells && usedCells.includes(cell)) return;
                            toggleCellSelection(cell);
                        }}
                        className={`px-2 py-2 border border-gray-200 text-gray-500 flex justify-center
                ${getCellColor(cell)}`}
                    >
                        {cell}
                    </div>
                ))}
            </div>
            {isWarning && (
                <div className="mt-4 grid place-items-center h-[60px] text-slate-400 bg-slate-50 italic rounded">
                    {/* <TbExclamationMark className='w-5 h-5 text-orange-500' /> */}
                    {warningMessage}
                </div>
            )}
        </div>
    );
};

export default SimpleGrid;
