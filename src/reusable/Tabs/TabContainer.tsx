import clsx from "clsx"

interface TabContainerProps {
    className?: string
    children: React.ReactNode
}

const TabContainer = ({className, children}: TabContainerProps) => {
    return (
        <div className={clsx(className, "flex w-full bg-slate-50 select-none text-xl")}>
            {children}
        </div>
    )
}

export default TabContainer