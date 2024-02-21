import clsx from "clsx";

interface TabProps {
    label: string | React.ReactNode;
    active?: boolean;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Tab = ({ label, className, onClick, active = false }: TabProps) => {
    return (
        <div
            onClick={onClick}
            className={clsx(
                className,
                "max-w-fit text-center text-gray-400 cursor-pointer py-2 border-b-2 border-transparent",
                active && "cursor-default !text-aiot-blue !border-aiot-blue"
            )}
        >
            {label}
        </div>
    );
};

export default Tab;
