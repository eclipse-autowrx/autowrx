import { Link } from "react-router-dom"
import { FC } from 'react'

interface DaTabItemProps {
    children: any
    active?: boolean
    to?: string
    small?: boolean
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const DaTabItem: FC<DaTabItemProps> = ({ children, active, to, small, onClick }) => {
    return (
        <Link to={to || ''} target={to && to.startsWith('http')?"_blank":'_self'} rel="noopener noreferrer">
            <div onClick={onClick}
                className={`flex items-center justify-center min-w-20 
                ${small?'py-0.5 px-2': 'py-1 px-4'}
              da-clickable hover:opacity-70 hover:border-b-2 hover:border-da-primary-500
              ${active ? 'da-label-regular-bold text-da-primary-500 border-b-2 border-da-primary-500' : 'text-da-gray-medium da-label-regular'}`}
            >
                {children}
            </div>
        </Link>
    )
}

export default DaTabItem