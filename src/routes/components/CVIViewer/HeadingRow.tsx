import clsx from "clsx";

interface HeadingRowProps {
    heading: string;
}

const HeadingRow = ({ heading }: HeadingRowProps) => {
    return (
        <tr>
            <td className={clsx("pl-5 px-4 py-1 font-bold select-none align-top")} colSpan={2}>
                {heading}
            </td>
        </tr>
    );
};

export default HeadingRow;
