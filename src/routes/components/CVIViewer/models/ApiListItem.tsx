import styles from "./ApiListItem.module.scss";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { HiChevronRight } from "react-icons/hi";
import LinkWrap from "../../../../reusable/LinkWrap";
import { Fragment } from "react";
import { useParamsX } from "../../../../reusable/hooks/useUpdateNavigate";

interface ApiListItemProps {
    activeApi: string;
    item: any;
    onClickApi?: (api: string) => Promise<void>;
    className?: string;
}

export const nodeTypeColor = (classType: "bg" | "text", type: "actuator" | "sensor" | "attribute" | "branch") => {
    switch (classType) {
        case "bg":
            switch (type) {
                case "actuator":
                    return "bg-yellow-500";
                case "sensor":
                    return "bg-emerald-500";
                case "attribute":
                    return "bg-blue-500";
                case "branch":
                    return "bg-violet-600";
                default:
                    throw new Error();
            }
        case "text":
            switch (type) {
                case "actuator":
                    return "text-yellow-500";
                case "sensor":
                    return "text-emerald-500";
                case "attribute":
                    return "text-blue-500";
                case "branch":
                    return "text-violet-600";
                default:
                    throw new Error();
            }
        default:
            throw new Error();
    }
};

const ApiListItem = ({ activeApi, item, onClickApi, className }: ApiListItemProps) => {
    const [prefix, setPrefix] = useState("");
    const [name, setName] = useState("");
    const [fullLink, setFullLink] = useState("");

    const { prototype_id = "" } = useParamsX();

    useEffect(() => {
        if (!item.name) return;
        let nameArray = item.name.split(".");
        if (nameArray.length <= 0) return;
        setName(nameArray[nameArray.length - 1] || item.name);
        if (nameArray.length > 1) {
            setPrefix(nameArray.slice(0, nameArray.length - 1).join(".") + ".");
        }

        // Determine the current path context (list or api-mapping)
        const pathname = window.location.pathname;
        let pathContext = "";
        if (pathname.includes("/list")) {
            pathContext = "list";
        } else if (pathname.includes("/api-mapping")) {
            pathContext = "api-mapping";
        }

        // Construct the full link based on the path context
        let cvi = `/cvi/${pathContext}/${item.name}`;
        setFullLink(
            prototype_id === ""
                ? `/model/:model_id${cvi}/`
                : `/model/:model_id/library/prototype/${prototype_id}/view${cvi}/`
        );
    }, [item]);

    const rowJsx = (
        <div
            className={clsx(
                "flex w-full text-slate-600 text-sm border-gray-100 px-2 leading-loose select-none cursor-pointer hover:bg-blue-50",
                activeApi === item.name && "!bg-aiot-blue !text-slate-50 hover:!bg-aiot-blue",
                activeApi === item.name && styles.selected,
                styles.Container,
                className
            )}
        >
            <span>
                {prefix}
                <strong>{name}</strong>
            </span>
            {item.isWishlist && (
                <div
                    className="flex m-auto items-center justify-center bg-fuchsia-500 text-white rounded-xl w-4 h-4 ml-2 font-bold p-2"
                    style={{ fontSize: "0.6rem", lineHeight: 0 }}
                >
                    W
                </div>
            )}
            <span
                className={clsx(
                    "uppercase text-xs ml-auto pt-1 my-auto font-bold",
                    styles.nodeType,
                    nodeTypeColor("text", item.type)
                )}
            >
                {item.type}
            </span>
            <HiChevronRight
                className="ml-auto h-full my-auto text-gray-300 hidden"
                style={{ transform: "scale(1.2)" }}
            />
        </div>
    );

    if (!name && !prefix) return <></>;

    return (
        <Fragment>
            {item.type &&
                (typeof onClickApi === "undefined" ? (
                    <LinkWrap to={fullLink}>{rowJsx}</LinkWrap>
                ) : (
                    <div
                        onClick={() => {
                            onClickApi(item);
                        }}
                    >
                        {rowJsx}
                    </div>
                ))}
        </Fragment>
    );
};

export default ApiListItem;
