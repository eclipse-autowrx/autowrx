import React from "react";

const TableToolbar = ({ position, onAdd, onDelete }) => {
    return (
        <div
            className=" w-auto h-auto absolute bg-gray-500 px-4 py-2 rounded shadow"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <button className="px-2 py-1 bg-blue-500 text-white rounded mr-2" onClick={onAdd}>
                Add
            </button>
            <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={onDelete}>
                Delete
            </button>
        </div>
    );
};

export default TableToolbar;
