import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import { TbX, TbColumnInsertLeft, TbRowInsertTop, TbCheck, TbExclamationMark } from "react-icons/tb";
import triggerSnackbar from "../../../reusable/triggerSnackbar";
import Button from "../../../reusable/Button";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";

interface TableEditorProps {
    onSave: (data: string) => void;
    onCancel: () => void;
    onTriggerSave: boolean;
    defaultValue?: string;
}

export interface isTableValidForSave {
    isTableValidForSave: () => Promise<void>;
}

const TableEditor = React.forwardRef<isTableValidForSave, TableEditorProps>(
    ({ defaultValue, onSave, onCancel, onTriggerSave }, ref) => {
        const [tableData, setTableData] = useState<any[]>([]);
        const [columnNames, setColumnNames] = useState<string[]>([]);
        const [hoveredColumnIndex, setHoveredColumnIndex] = useState<number | null>(null);
        const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
        const [editingColumnHeader, setEditingColumnHeader] = useState<number | null>(null);
        const [editingRowHeader, setEditingRowHeader] = useState<number | null>(null);

        const [showAddRow, setShowAddRow] = useState(false);
        const [showAddColumn, setShowAddColumn] = useState(false);

        const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
        const [errorMessage, setErrorMessage] = useState<string | null>(null);

        const isValidHeader = (header: string) => {
            const isWord = /\w+/.test(header);
            const startsWithNumeric = /^\d/.test(header);
            return isWord && !startsWithNumeric;
        };

        const [isTableValid, setIsTableValid] = useState(false);

        useImperativeHandle(ref, () => ({
            isTableValidForSave: async () => {
                return new Promise<void>((resolve, reject) => {
                    if (isTableValid) {
                        resolve();
                    } else {
                        reject(new Error("Table is not valid"));
                    }
                });
            },
        }));

        useEffect(() => {
            if (!defaultValue) {
                // Generate 3 columns x 3 rows if there is no defaultValue
                setColumnNames(["Step 1", "Step 2", "Step 3"]);
                setTableData([
                    { rowName: "Who", "Step 1": "", "Step 2": "", "Step 3": "" },
                    { rowName: "What", "Step 1": "", "Step 2": "", "Step 3": "" },
                    { rowName: "Customer TouchPoints", "Step 1": "", "Step 2": "", "Step 3": "" },
                ]);
            } else {
                // Parse defaultValue and set table data and column names
                setTableData(parseTableData(defaultValue));
                setColumnNames(getTableColumns(defaultValue));
            }
        }, [defaultValue]);

        const addRow = () => {
            const newRow = { rowName: "" }; // Leave the rowName empty
            columnNames.forEach((columnName) => {
                newRow[columnName] = "";
            });
            setTableData((prevData) => [...prevData, newRow]);
        };

        const addColumn = () => {
            const newColumnName = ""; // Leave the column name blank

            setTableData((prevData) => {
                const newData = prevData.map((row) => {
                    const newRow = { ...row };
                    newRow[newColumnName] = "";
                    return newRow;
                });
                return newData;
            });

            setColumnNames((prevNames) => [...prevNames, newColumnName]);
        };

        const deleteRow = (rowIndex: number) => {
            setTableData((prevData) => {
                const newData = [...prevData];
                newData.splice(rowIndex, 1);
                return newData;
            });
        };

        const deleteColumn = (columnIndex: number) => {
            setTableData((prevData) => {
                const newData = prevData.map((row) => {
                    const newRow = { ...row };
                    delete newRow[columnNames[columnIndex]];
                    return newRow;
                });
                return newData;
            });
            setColumnNames((prevNames) => {
                const newNames = [...prevNames];
                newNames.splice(columnIndex, 1);
                return newNames;
            });
        };

        const handleCellChange = (rowIndex: number, columnName: string, value: string) => {
            setTableData((prevData) => {
                const newData = [...prevData];
                newData[rowIndex][columnName] = value;
                return newData;
            });
        };

        const saveTable = () => {
            const allValidHeaders =
                columnNames.every(isValidHeader) && tableData.every((row) => isValidHeader(row.rowName));

            if (columnNames.some((name) => /^\d/.test(name))) {
                triggerSnackbar("Column headers should not start with a number.");
                return;
            }

            if (tableData.some((row) => /^\d/.test(row.rowName))) {
                triggerSnackbar("Row headers should not start with a number.");
                return;
            }

            if (!allValidHeaders) {
                triggerSnackbar("All headers must contain at least one word and be unique.");
                return;
            }

            const formattedTable: string[] = [];
            columnNames.forEach((columnName) => {
                formattedTable.push(`#${columnName}`);
                tableData.forEach((row) => {
                    const rowName = row.rowName;
                    const cellValue = row[columnName] !== undefined ? row[columnName] : ""; // Check if value exists, if not set to empty string
                    formattedTable.push(`${rowName}: ${cellValue}`);
                });
            });
            const tableString = formattedTable.join("\n");
            onSave(tableString);
        };

        useEffect(() => {
            // List to hold error messages
            const errors: string[] = [];

            // Check for unique column names:
            const uniqueColumnNames = new Set(columnNames);
            const noDuplicateColumnNames = uniqueColumnNames.size === columnNames.length;

            // Check for unique row names:
            const rowNames = tableData.map((row) => row.rowName);
            const uniqueRowNames = new Set(rowNames);
            const noDuplicateRowNames = uniqueRowNames.size === rowNames.length;

            // Combine all checks:
            const allValidHeaders =
                columnNames.every(isValidHeader) &&
                tableData.every((row) => isValidHeader(row.rowName)) &&
                noDuplicateColumnNames &&
                noDuplicateRowNames;

            if (columnNames.some((name) => name === "") || tableData.some((row) => row.rowName === "")) {
                errors.push("Headers shouldn't be blank");
            }
            if (!noDuplicateRowNames || !noDuplicateColumnNames) {
                errors.push("Headers must be unique");
            }
            if (columnNames.some((name) => /^\d/.test(name)) || tableData.some((row) => /^\d/.test(row.rowName))) {
                errors.push("Headers shouldn't start with numbers");
            }

            // If there are errors, concatenate them separated by commas
            if (errors.length > 0) {
                setErrorMessage(errors.join(", "));
            } else {
                setErrorMessage(null);
            }

            setIsTableValid(allValidHeaders);

            // console.log("errorMessage: ", errorMessage);
            // console.log("Is table valid: ", allValidHeaders);
        }, [tableData, columnNames]);

        // Observing triggerSave:
        useEffect(() => {
            if (onTriggerSave) {
                // console.log("Trigger Save")
                saveTable();
            }
        }, [onTriggerSave]);
        let hideTimeout;
        const handleMouseMove = (e) => {
            const divBounds = e.currentTarget.getBoundingClientRect();
            const divHeight = divBounds.height;
            const divWidth = divBounds.width;

            // Check if cursor is in the bottom 25%
            if (e.clientY > divBounds.top + 0.75 * divHeight) {
                setShowAddRow(true);
            } else {
                setShowAddRow(false);
            }

            // Check if cursor is in the right 25%
            if (e.clientX > divBounds.left + 0.75 * divWidth) {
                setShowAddColumn(true);
            } else {
                setShowAddColumn(false);
            }
            // If there's an existing timeout, clear it.
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
        };

        const handleMouseLeave = () => {
            // Introduce a delay before hiding the button.
            hideTimeout = setTimeout(() => {
                setShowAddRow(false);
                setShowAddColumn(false);
            }, 500); // 500 milliseconds delay before hiding.
        };

        const columnColors = [
            "#005072",
            "#0d596e",
            "#1c6269",
            "#2c6c64",
            "#437a5c",
            "#558556",
            "#6c944e",
            "#91ab42",
            "#aebd38",
        ];

        useEffect(() => {
            const adjustTextareaHeights = () => {
                textareaRefs.current.forEach((textareaRef) => {
                    if (textareaRef) {
                        textareaRef.style.height = "auto";
                        textareaRef.style.height = `${textareaRef.scrollHeight}px`;
                    }
                });
            };

            adjustTextareaHeights();

            window.addEventListener("resize", adjustTextareaHeights);
            return () => {
                window.removeEventListener("resize", adjustTextareaHeights);
            };
        }, [tableData]);

        return (
            <div className="flex w-full h-full justify-center items-center relative">
                <div className="w-fit">
                    {!isTableValid && errorMessage !== null && (
                        <div className="absolute flex top-[-2rem] items-center">
                            <TbX className="w-5 h-5 text-red-500 mr-1" />
                            <div className="text-gray-600">{errorMessage}</div>
                        </div>
                    )}
                </div>
                <div className="flex w-fit relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                    <div className="flex-grow text-sm">
                        <table className="border-collapse">
                            <thead>
                                <tr>
                                    <th className="border px-4 py-2"></th>
                                    {columnNames.map((columnName, columnIndex) => (
                                        <th
                                            className="border w-[18rem] px-2 py-2 h-[4rem] text-white relative"
                                            key={columnIndex}
                                            style={{ backgroundColor: columnColors[columnIndex] }}
                                            onMouseEnter={() => setHoveredColumnIndex(columnIndex)}
                                            onMouseLeave={() => setHoveredColumnIndex(null)}
                                            onClick={() => setEditingColumnHeader(columnIndex)}
                                        >
                                            {editingColumnHeader === columnIndex ? (
                                                <input
                                                    type="textarea"
                                                    className="w-full bg-transparent outline-none"
                                                    value={columnNames[columnIndex]}
                                                    onChange={(e) => {
                                                        const newColumnName = e.target.value;
                                                        const oldColumnName = columnNames[columnIndex];

                                                        // Update columnNames state
                                                        const updatedColumnNames = [...columnNames];
                                                        updatedColumnNames[columnIndex] = newColumnName;
                                                        setColumnNames(updatedColumnNames);

                                                        // Update keys in tableData state
                                                        setTableData((prevData) => {
                                                            return prevData.map((row) => {
                                                                if (row.hasOwnProperty(oldColumnName)) {
                                                                    row[newColumnName] = row[oldColumnName];
                                                                    delete row[oldColumnName];
                                                                }
                                                                return row;
                                                            });
                                                        });
                                                    }}
                                                    onBlur={() => setEditingColumnHeader(null)}
                                                    autoFocus
                                                />
                                            ) : (
                                                columnName
                                            )}
                                            {hoveredColumnIndex !== null && hoveredColumnIndex === columnIndex && (
                                                <GeneralTooltip
                                                    content="Delete Column"
                                                    className="scale-100 font-normal"
                                                    delay={100}
                                                >
                                                    <button
                                                        className="m-1 text-white text-xs rounded absolute top-0 right-0 hover:text-red-500"
                                                        onClick={() => deleteColumn(columnIndex)}
                                                    >
                                                        <TbX className="w-5 h-5" />
                                                    </button>
                                                </GeneralTooltip>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td
                                            className="border h-full w-36 px-2 py-2 relative font-bold text-gray-700"
                                            onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                                            onMouseLeave={() => setHoveredRowIndex(null)}
                                            onClick={() => setEditingRowHeader(rowIndex)}
                                        >
                                            {editingRowHeader === rowIndex ? (
                                                <input
                                                    className="w-full h-full outline-none"
                                                    value={row.rowName}
                                                    onChange={(e) => {
                                                        const updatedTableData = [...tableData];
                                                        updatedTableData[rowIndex].rowName = e.target.value;
                                                        setTableData(updatedTableData);
                                                    }}
                                                    onBlur={() => setEditingRowHeader(null)}
                                                    autoFocus
                                                />
                                            ) : (
                                                row.rowName || "" // Display a cue if the row name is empty
                                            )}
                                            {hoveredRowIndex !== null && hoveredRowIndex === rowIndex && (
                                                <GeneralTooltip
                                                    content="Delete Row"
                                                    className="scale-100 font-normal"
                                                    delay={100}
                                                >
                                                    <button
                                                        className="m-1 text-gray-400 text-xs rounded absolute top-0 right-0 hover:text-red-500"
                                                        onClick={() => deleteRow(rowIndex)}
                                                    >
                                                        <TbX className="w-5 h-5" />
                                                    </button>
                                                </GeneralTooltip>
                                            )}
                                        </td>
                                        {columnNames.map((columnName, columnIndex) => (
                                            <td className="border px-4 py-2" key={columnIndex}>
                                                <textarea
                                                    value={row[columnName]}
                                                    onChange={(e) =>
                                                        handleCellChange(rowIndex, columnName, e.target.value)
                                                    }
                                                    className="w-full bg-transparent outline-none resize-vertical text-gray-700"
                                                    ref={(textareaRef) => {
                                                        if (textareaRef) {
                                                            textareaRef.style.height = `${textareaRef.scrollHeight}px`;
                                                            textareaRefs.current[
                                                                rowIndex * columnNames.length + columnIndex
                                                            ] = textareaRef;
                                                        }
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Row Button */}
                    <GeneralTooltip content="Add Row" className="scale-100" delay={100}>
                        <Button
                            variant="white"
                            className={`absolute bottom-[-2rem] left-0 w-full h-7 py-0.5 z-10 ${
                                showAddRow ? "block" : "hidden"
                            }`}
                            onClick={addRow}
                            icon={TbRowInsertTop}
                            iconClassName="w-5 h-5"
                            iconStrokeWidth={1.5}
                        ></Button>
                    </GeneralTooltip>
                    {/* Add Column Button */}
                    <GeneralTooltip content="Add Column" className="scale-100" delay={100}>
                        <Button
                            variant="white"
                            className={`absolute flex flex-col top-0 right-[-2rem] h-full w-7 !px-0 z-10 ${
                                showAddColumn ? "flex" : "hidden"
                            }`}
                            onClick={addColumn}
                            icon={TbColumnInsertLeft}
                            iconClassName="w-7 h-5"
                            iconStrokeWidth={1.5}
                        ></Button>
                    </GeneralTooltip>
                </div>
            </div>
        );
    }
);

function parseTableData(tableString: string | undefined) {
    if (!tableString) return [];

    const lines = tableString.split("\n");
    const tableData: any[] = [];

    let currentColumnName: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("#")) {
            currentColumnName = line.substr(1).trim();
        } else if (line.includes(":")) {
            const [rawRowName, cellValue] = line.split(":").map((item) => item.trim());
            const rowName = rawRowName.trim();
            const rowIndex = tableData.findIndex((row) => row.rowName === rowName);

            if (rowIndex === -1) {
                const newRow: any = { rowName: rowName };
                if (currentColumnName) {
                    newRow[currentColumnName] = cellValue;
                }
                tableData.push(newRow);
            } else {
                if (currentColumnName) {
                    tableData[rowIndex][currentColumnName] = cellValue;
                }
            }
        }
    }
    return tableData;
}

function getTableColumns(tableString: string | undefined) {
    if (!tableString) return [];
    const lines = tableString.split("\n");
    const columnNames: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("#")) {
            const columnName = line.substr(1).trim();
            columnNames.push(columnName);
        }
    }
    return columnNames;
}

export default TableEditor;
