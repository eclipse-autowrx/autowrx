import clsx from "clsx";
import { generatePath, Link, LinkProps, useMatch, useResolvedPath } from "react-router-dom";
import { useParamsX } from "./hooks/useUpdateNavigate";

export interface LinkWrapProps extends LinkProps {
    to: string;
    children?: React.ReactNode;
    className?: string;
    activeClassName?: string;
}

const LinkWrap = ({ to, children, className, activeClassName, ...props }: LinkWrapProps) => {
    const resolved = useResolvedPath(to);
    // console.log('resolved', resolved)
    const dynamicPath = generatePath(resolved.pathname, useParamsX());
    const active = useMatch({ path: dynamicPath + "/*", end: true });

    return (
        <Link {...props} to={dynamicPath} className={clsx(className, active && activeClassName)}>
            {children}
        </Link>
    );
};

export default LinkWrap;
