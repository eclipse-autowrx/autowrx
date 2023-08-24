import { FC } from "react"
import { IconType } from "react-icons/lib"
import LinkWrap from "../reusable/LinkWrap"
import Tab from "../reusable/Tabs/Tab"

interface MainMenuLinkProps {
    name: string
    to: string
    Icon: IconType
}

const MainMenuLink: FC<MainMenuLinkProps> = ({name, to, Icon}) => {
    return (
        <LinkWrap to={to} className="text-gray-400" activeClassName="!text-aiot-green">
            <Tab label={
                <>
                    <Icon className="mr-2"/>{name}
                </>
            } className="flex h-full text-xl items-center px-3 text-inherit" />
        </LinkWrap>
    )
}

export default MainMenuLink