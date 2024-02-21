import { useState, useEffect } from "react";

interface PaginateProps {
    itemsPerPage: number;
    items: any[];
    setItemsOffset: (offset: number) => void;
    className?: string;
    customCssStyle?: React.CSSProperties;
}

function CustomPaginate({ itemsPerPage, items, setItemsOffset, className, customCssStyle }: PaginateProps) {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const offset = (currentPage - 1) * itemsPerPage;
        setItemsOffset(offset);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage, itemsPerPage, setItemsOffset]);

    const pageCount = Math.ceil(items.length / itemsPerPage);

    const getDisplayedPages = () => {
        if (currentPage <= 3) {
            return [1, 2, 3, 4, 5].slice(0, pageCount);
        }

        if (currentPage >= pageCount - 2) {
            return [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount].slice(0, pageCount);
        }

        return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    };

    // Return null (don't render the component) if there are no items
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="flex justify-center" style={customCssStyle}>
            <div className={className}>
                <div className="m-auto flex justify-between items-center pl-0 text-aiot-blue/50 border rounded shadow max-w-m">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className="w-24 border-r flex justify-center items-center text-aiot-blue/90 text-sm font-semibold"
                    >
                        Previous
                    </button>
                    {getDisplayedPages().map((pageNumber) => (
                        <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`flex-grow items-center justify-center flex w-10 h-10 hover:bg-aiot-blue/10 ${
                                currentPage === pageNumber
                                    ? "text-slate-950 border border-aiot-blue/75 font-medium"
                                    : ""
                            }`}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                        className="w-24 border-l flex justify-center items-center text-aiot-blue/90 text-sm font-semibold"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CustomPaginate;
