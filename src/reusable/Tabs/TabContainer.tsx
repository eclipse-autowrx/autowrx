import clsx from "clsx";

interface TabContainerProps {
    className?: string;
    children: React.ReactNode;
}

const TabContainer = ({ className, children }: TabContainerProps) => {
    return <div className={clsx("flex max-w-fit bg-slate-50 select-none text-xl", className)}>{children}</div>;
};

export default TabContainer;
