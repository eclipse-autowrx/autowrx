import React, { useEffect, useMemo } from "react";
import { API } from "../../../apis/backend/vehicleApi";
import Button from "../../../reusable/Button";
import clsx from "clsx";
import { supportedCertivityApis } from "../../../apis/backend/certivityApi";
import { TbHelp, TbSquare, TbSquareCheck, TbX } from "react-icons/tb";
import { Tooltip } from "@mui/material";

type HomologationUsedAPIsHeaderProps = {
    selectedAPIs: Set<API>;
    setSelectedAPIs: (apis: Set<API>) => void;
    usedAPIs: API[];
};

const HomologationUsedAPIsHeader = ({ selectedAPIs, setSelectedAPIs, usedAPIs }: HomologationUsedAPIsHeaderProps) => {
    const currentSupportedAPIs = useMemo(() => {
        return usedAPIs.filter((api) => supportedCertivityApis.has(api.name));
    }, [usedAPIs]);

    const selectAllHandler = () => {
        if (selectedAPIs.size !== currentSupportedAPIs.length) {
            setSelectedAPIs(new Set(currentSupportedAPIs));
        } else {
            setSelectedAPIs(new Set([]));
        }
    };

    useEffect(() => {
        if (currentSupportedAPIs.length > 0) {
            setSelectedAPIs(new Set([currentSupportedAPIs[0]]));
        } else {
            setSelectedAPIs(new Set([]));
        }
    }, [setSelectedAPIs, currentSupportedAPIs]);

    return (
        <div className="items-center flex flex-shrink-0 mb-1">
            {/* Title */}
            <h1 className="font-bold text-xl text-black">
                Used APIs
                {usedAPIs.length > 0 && ` (${usedAPIs.length})`}
            </h1>

            {/* Select all button */}
            <Button
                className={clsx(
                    "ml-auto mb-0.5 hover:bg-gray-200 !text-[13px] rounded-lg px-2 transition",
                    selectedAPIs.size === currentSupportedAPIs.length && selectedAPIs.size > 0 && "bg-gray-300",
                    currentSupportedAPIs.length === 0 && "pointer-events-none opacity-50"
                )}
                onClick={selectAllHandler}
                variant="custom"
            >
                Select all
                {selectedAPIs.size === currentSupportedAPIs.length && selectedAPIs.size > 0 ? (
                    <TbSquareCheck className="ml-1 mt-0.5" />
                ) : (
                    <TbSquare className="ml-1 mt-0.5" />
                )}
            </Button>

            {/* Clear selections button */}
            <Button
                onClick={() => setSelectedAPIs(new Set([]))}
                className={clsx(
                    "ml-2 mb-0.5 hover:bg-gray-200 !text-[13px] rounded-lg px-2 transition",
                    selectedAPIs.size === 0 && "pointer-events-none opacity-50"
                )}
                variant="custom"
            >
                Clear {selectedAPIs.size !== 0 ? selectedAPIs.size : ""} selection{selectedAPIs.size > 1 && "s"}{" "}
                <TbX className="mt-0.5 text-sm ml-1" />
            </Button>

            {/* Help tooltip (show help about not supported APIs) */}
            <Tooltip
                title={`Some APIs are not yet supported (${
                    usedAPIs.filter((api) => !supportedCertivityApis.has("Vehicle" + api.shortName)).length
                })`}
            >
                <button className="ml-3 text-gray-500 text-xl hover:text-aiot-blue transition">
                    <TbHelp />
                </button>
            </Tooltip>
        </div>
    );
};

export default HomologationUsedAPIsHeader;
