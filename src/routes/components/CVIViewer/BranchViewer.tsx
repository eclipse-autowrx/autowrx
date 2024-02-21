import { Fragment } from "react";
import LinkWrap from "../../../reusable/LinkWrap";
import { HiChevronRight } from "react-icons/hi";
import clsx from "clsx";
import styles from "./BranchViewer.module.scss";
import { useParamsX } from "../../../reusable/hooks/useUpdateNavigate";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { Model } from "../../../apis/models";
import { AnyNode } from "../core/Model/VehicleInterface/Spec";

interface BranchViewerProps {
    prefix?: string;
    name: string;
    node: AnyNode;
    activeNodePath: string;
    filter?: (node_name: string) => boolean;
    isCustom?: boolean;
    selectedRef: React.MutableRefObject<HTMLDivElement | null>;
    onClickApi?: (api: string) => Promise<void>;
    nodeType?: ("actuator" | "sensor" | "attribute" | "branch" | "defaultAPI" | "wishlistAPI")[];
    isDefault?: boolean;
    isWishlist?: boolean;
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

const BranchViewer = ({
    prefix = "",
    filter,
    name,
    node,
    activeNodePath,
    selectedRef,
    isCustom = false,
    onClickApi,
    nodeType = [],
    isDefault = true,
    isWishlist = true,
}: BranchViewerProps) => {
    const { prototype_id = "" } = useParamsX();

    const cviLink = `/cvi/list/${prefix + name}`;
    const fullLink =
        prototype_id === ""
            ? `/model/:model_id${cviLink}/`
            : `/model/:model_id/library/prototype/${prototype_id}/view${cviLink}/`;

    const model = useCurrentModel() as Model;

    const rowJsx = (
        <div
            ref={activeNodePath === `${prefix}${name}` ? selectedRef : null}
            className={clsx(
                "flex w-full text-slate-600 text-sm border-gray-100 px-2 leading-loose select-none cursor-pointer hover:bg-blue-50",
                activeNodePath === `${prefix}${name}` && "!bg-aiot-blue !text-slate-50 hover:!bg-aiot-blue",
                activeNodePath === `${prefix}${name}` && styles.selected,
                styles.Container
            )}
        >
            <span>
                {prefix}
                <strong>{name}</strong>
            </span>
            {isCustom && (
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
                    nodeTypeColor("text", node.type)
                )}
            >
                {node.type}
            </span>
            <HiChevronRight
                className="ml-auto h-full my-auto text-gray-300 hidden"
                style={{ transform: "scale(1.2)" }}
            />
        </div>
    );

    return (
        <Fragment>
            {(typeof filter === "undefined" || filter(prefix + name)) &&
                node.type &&
                nodeType.includes(node.type) && // Filter data type to render
                ((isCustom && isWishlist) || (!isCustom && isDefault)) && // Filter custom API to render
                (typeof onClickApi === "undefined" ? (
                    <LinkWrap to={fullLink}>{rowJsx}</LinkWrap>
                ) : (
                    <div onClick={() => onClickApi(prefix + name)}>{rowJsx}</div>
                ))}

            {node.type === "branch" &&
                Object.entries(model.custom_apis?.[`${prefix}${name}`] ?? {}).map(
                    // Filter data in backend
                    ([childName, subNode]) => {
                        return (
                            <BranchViewer
                                selectedRef={selectedRef}
                                prefix={`${prefix}${name}.`}
                                name={childName}
                                node={subNode}
                                key={`${prefix}${name}.${childName}`}
                                activeNodePath={activeNodePath}
                                filter={filter}
                                isCustom
                                onClickApi={onClickApi}
                                nodeType={nodeType}
                                isDefault={isDefault}
                                isWishlist={isWishlist}
                            />
                        );
                    }
                )}

            {node.type === "branch" &&
                Object.entries(node.children).map(([childName, subNode]) => {
                    return (
                        <BranchViewer
                            selectedRef={selectedRef}
                            prefix={`${prefix}${name}.`}
                            name={childName}
                            node={subNode}
                            key={`${prefix}${name}.${childName}`}
                            activeNodePath={activeNodePath}
                            filter={filter}
                            onClickApi={onClickApi}
                            nodeType={nodeType}
                            isDefault={isDefault}
                            isWishlist={isWishlist}
                        />
                    );
                })}
        </Fragment>
    );
};

export default BranchViewer;
