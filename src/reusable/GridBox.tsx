import LinkWrap from "./LinkWrap"

interface GridBox {
    title: string
    description: string
    to: string
}

const GridBox = ({title, description, to}: GridBox) => {
    return (
        <div className="flex flex-col w-full h-full mx-2 pt-3 pb-3 px-3 rounded border border-gray-300 select-none">
            <div className="flex items-center justify-center text-lg mt-1">{title}</div>
            <div className="p-3 text-sm">{description}</div>
            <LinkWrap to={to} className="mt-auto mx-auto w-fit">
                <div className="border border-gray-300 px-3 py-2 rounded text-aiot-blue font-bold mb-1 hover:bg-aiot-blue/10 hover:border-aiot-blue transition duration-300 cursor-pointer">Get Started</div>
            </LinkWrap>
        </div>
    )
}

export default GridBox