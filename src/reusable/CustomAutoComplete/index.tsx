import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { TbCheck, TbX } from "react-icons/tb";
import clsx from "clsx";
import { createPortal } from "react-dom";

type FilterFunc = ((value: string) => void) | (() => void);

type RowData = {
    key: string;
    value: React.ReactNode;
};

export type CustomAutoCompleteProps = Omit<JSX.IntrinsicElements["input"], "onChange"> & {
    state?: "loading" | "error";
    filter: FilterFunc;
    data: RowData[];
    rootRef?: React.RefObject<HTMLDivElement>;
    errorMessage?: string;
    dropdownDirection?: "top" | "bottom";
    dropdownAlign?: "left" | "right";
    containerClassName?: string;
    emptyMessage?: string;
    onChange?: (value: string) => void;
    inputClassName?: string;
    textSize?: "sm" | "base" | "lg";
};

function CustomAutoComplete({
    filter,
    state,
    rootRef,
    data,
    errorMessage,
    dropdownDirection = "bottom",
    dropdownAlign = "left",
    containerClassName,
    inputClassName,
    emptyMessage,
    textSize = "base",
    ...props
}: CustomAutoCompleteProps) {
    // Inner state of component
    const [focus, setFocus] = useState(false);

    // Ref
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownRef, setDropdownRef] = useState<HTMLUListElement | null>(null);

    // Handle change
    const innerHandleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        filter(event.target.value);
        props.onChange?.(event.target.value);
    };

    const handleBlur = useCallback(() => {
        setFocus(false);
        filter("");
    }, [filter]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node) &&
                !dropdownRef?.contains(event.target as Node)
            ) {
                handleBlur();
            }
        };

        const rootElement = (rootRef?.current ?? document) as HTMLElement;

        rootElement.addEventListener("mousedown", handleOutsideClick);
        return () => rootElement.removeEventListener("mousedown", handleOutsideClick);
    }, [dropdownRef, handleBlur, rootRef]);

    const handleDropdownItemClick = (value: string) => () => {
        handleBlur();
        props.onChange?.(value);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        filter("");
        props.onChange?.("");
    };

    // Dropdown top based on dropdown direction
    const calculatedDropdownTop = useMemo(() => {
        if (!wrapperRef.current || !dropdownRef) return 0;

        const wrapperTop = wrapperRef.current.getBoundingClientRect().top;

        if (dropdownDirection === "bottom") {
            const wrapperHeight = wrapperRef.current.getBoundingClientRect().height;
            return wrapperTop + wrapperHeight + 5;
        } else {
            const dropdownHeight = dropdownRef.getBoundingClientRect().height;
            return wrapperTop - dropdownHeight - 5;
        }
    }, [dropdownDirection, dropdownRef]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Tab") {
            handleBlur();
        }
        props.onKeyDown?.(e);
    };

    return (
        <>
            <div
                onClick={() => inputRef.current?.focus()}
                ref={wrapperRef}
                className={clsx(
                    "relative w-full text-sm inline-flex shadow-sm px-3 bg-white border rounded items-center justify-center gap-2 transition-background motion-reduce:transition-none duration-150 outline-none h-10 py-2",
                    {
                        "border-red-500": state === "error",
                        "border-gray-200": state !== "error",
                        "border-gray-400": state !== "error" && focus,
                    },
                    containerClassName
                )}
            >
                <input
                    ref={inputRef}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocus(true)}
                    className={clsx(
                        "flex-1 min-w-0 font-normal bg-transparent outline-none placeholder:text-foreground-500 focus-visible:outline-none",
                        state === "error" && "text-red-500",
                        {
                            "text-sm": textSize === "sm",
                            "text-base": textSize === "base",
                            "text-lg": textSize === "lg",
                        },
                        inputClassName
                    )}
                    type="text"
                    {...props}
                    onChange={innerHandleChange}
                />
                <div className="w-fit flex-shrink-0 flex items-center justify-center h-full">
                    {state === "loading" && <AiOutlineLoading className="text-lg animate-spin" />}
                    {state === "error" && <TbX className="text-lg text-red-500" />}
                    {props.value && (
                        <TbX
                            onClick={handleClear}
                            className={clsx("cursor-pointer font-semibold text-gray-600", {
                                "text-base": textSize === "sm",
                                "text-lg": textSize === "base",
                                "text-xl": textSize === "lg",
                            })}
                        />
                    )}
                </div>
            </div>
            {state === "error" && <p className="text-xs ml-3 -mt-1 text-red-500">{errorMessage}</p>}

            {/* Dropdown */}
            {focus &&
                createPortal(
                    <ul
                        ref={(node) => setDropdownRef(node)}
                        className={clsx(
                            "overflow-y-auto scroll-gray text-sm h-fit fixed z-[100000] rounded bg-white border border-gray-200 shadow-md p-1 max-h-[200px] w-fit"
                        )}
                        style={{
                            top: calculatedDropdownTop,
                            ...(dropdownAlign === "left"
                                ? { left: wrapperRef.current?.getBoundingClientRect().left }
                                : {
                                      right:
                                          window.innerWidth - (wrapperRef.current?.getBoundingClientRect().right ?? 0),
                                  }),
                            minWidth: wrapperRef.current?.getBoundingClientRect().width,
                        }}
                    >
                        {data.length === 0 ? (
                            <div className="h-[80px] flex items-center justify-center">
                                <p>{emptyMessage ?? "Nothing found"}</p>
                            </div>
                        ) : (
                            data.map((item) => (
                                <li
                                    key={item.key}
                                    onClick={handleDropdownItemClick(item.key)}
                                    className="flex gap-2 px-2 py-1.5 cursor-pointer transition duration-150 items-center bg-white hover:bg-gray-200 rounded"
                                >
                                    <p
                                        className={clsx("flex-1", {
                                            "text-sm": textSize === "sm",
                                            "text-base": textSize === "base",
                                            "text-lg": textSize === "lg",
                                        })}
                                    >
                                        {item.value}
                                    </p>
                                    {item.key === props.value && <TbCheck className="text-lg text-gray-500 ml-auto" />}
                                </li>
                            ))
                        )}
                    </ul>,
                    document.body
                )}
        </>
    );
}

export default memo(CustomAutoComplete);
