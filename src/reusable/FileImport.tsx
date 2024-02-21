import { useState, useRef, useEffect } from "react";
import { TbFileImport } from "react-icons/tb";

interface FileImportProps {
    onFileChange: (file: File | null) => void;
    importFileName?: string;
    placeholderText?: string;
}

const FileImport = ({ onFileChange, importFileName, placeholderText }: FileImportProps) => {
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragIn = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragOut = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setDragging(true);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setFileName(file.name);
            onFileChange(file);
            e.dataTransfer.clearData();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && (file.name.endsWith(".dbc") || file.name.endsWith(".json") || file.name.endsWith(".txt"))) {
            setFileName(file.name);
            onFileChange(file);
        }
    };

    useEffect(() => {
        if (importFileName) {
            setFileName(importFileName);
        }
    }, [importFileName]);

    return (
        <div
            className={`flex text-xs flex-col items-center justify-center w-full min-h-[80px] py-2 border ${
                dragging ? "border-aiot-blue bg-aiot-blue/5 text-aiot-blue" : "border-gray-400 text-gray-600"
            } border-dashed rounded cursor-pointer`}
            onClick={handleFileClick}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".dbc"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            <TbFileImport className="flex h-6 w-6" style={{ strokeWidth: 1 }} />
            <div className="mt-2 select-none">{placeholderText}</div>
            {fileName && <div className="mt-2 text-aiot-blue">{fileName}</div>}
        </div>
    );
};

export default FileImport;
