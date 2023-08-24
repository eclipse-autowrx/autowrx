import React, { FC } from "react"

const ExternalLink: FC<{
    to: string
    children: React.ReactNode
    target?: "_blank"
}> = ({to, children, target}) => {
    return (
        <a className="text-slate-500" href={to} target={target}>{children}</a>
    )
}

export default ExternalLink