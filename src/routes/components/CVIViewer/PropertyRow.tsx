import clsx from "clsx";
import LinkWrap from "../../../reusable/LinkWrap";

const AttributeLabels = {
    comment: "Comment",
    datatype: "DataType",
    type: "Type",
    description: "Description",
    uuid: "UUID",
    unit: "Unit",
};

interface PropertyRowProps {
    property: string;
    value: any;
    isDynamicProp?: boolean;
    link?: boolean;
}

const PropertyRow = ({ property, value, isDynamicProp = false, link = false }: PropertyRowProps) => {
    return (
        <tr className="hover:bg-blue-50">
            <td
                className={clsx(
                    "pl-5 px-4 py-1 font-bold select-none align-top",
                    isDynamicProp ? "text-aiot-blue" : "text-aiot-green"
                )}
            >
                {(AttributeLabels as any)[property] ?? property}
            </td>
            <td className="px-4 py-1 align-top">
                {link ? (
                    <a href={value} target="_blank" rel="noreferrer">
                        {value}
                    </a>
                ) : (
                    value
                )}
            </td>
        </tr>
    );
};

export default PropertyRow;
