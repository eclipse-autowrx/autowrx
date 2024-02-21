import { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";

interface PaginateProps {
    itemsPerPage: number;
    items: any[];
    setItemsOffset: (offset: number) => void;
    className?: string;
}

function Paginate({ itemsPerPage, items, setItemsOffset, className }: PaginateProps) {
    const [itemOffset, setItemOffset] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        setItemsOffset(itemOffset);
    }, [itemOffset, setItemsOffset]);

    const pageCount = Math.ceil(items.length / itemsPerPage);

    const handlePageClick = (data) => {
        const selected = data.selected;
        const offset = Math.ceil(selected * itemsPerPage);

        if (offset !== itemOffset) {
            setCurrentPage(selected);
            setItemOffset(offset);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="flex justify-center">
            <div className={className}>
                <ReactPaginate
                    nextLabel="Next"
                    pageCount={pageCount}
                    onPageChange={handlePageClick}
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                    previousLabel="Previous"
                    pageClassName="flex-grow flex w-10 h-10 hover:bg-gray-100"
                    pageLinkClassName="inline-flex w-full h-full justify-center items-center"
                    previousClassName="w-28 border-r flex justify-center items-center text-gray-600 text-sm font-semibold"
                    nextClassName="w-28 border-l flex justify-center items-center text-gray-600 text-sm font-semibold"
                    disabledClassName="text-gray-300"
                    breakLabel="..."
                    breakClassName="flex justify-center items-center mb-2"
                    containerClassName="m-auto flex justify-between items-center pl-0 text-gray-400 border rounded shadow max-w-md"
                    activeClassName="text-slate-950 border border-gray-600 font-medium"
                    renderOnZeroPageCount={null}
                    forcePage={currentPage}
                />
            </div>
        </div>
    );
}

export default Paginate;
