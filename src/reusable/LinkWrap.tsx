import clsx from "clsx";
import { generatePath, Link, useMatch, useResolvedPath } from "react-router-dom"
import { useParamsX } from "./hooks/useUpdateNavigate";

interface LinkWrapProps {
    to: string
    children: React.ReactNode
    className?: string
    activeClassName?: string
}

const LinkWrap = ({to, children, className, activeClassName}: LinkWrapProps) => {
    const resolved = useResolvedPath(to);
    const dynamicPath = generatePath(resolved.pathname, useParamsX())
    const active = useMatch({ path: dynamicPath + "/*", end: true });

    return (
        <Link to={dynamicPath} className={clsx(className, active && activeClassName)}>
            {children}
        </Link>
    )
}

export default LinkWrap