import { ImBooks } from "react-icons/im";
import { MdLogin, MdPerson } from "react-icons/md"
import LinkWrap from "../reusable/LinkWrap";
import Tab from "../reusable/Tabs/Tab";
import LoginPopup from "../routes/components/LoginPopup";
import Logo from "../assets/logo.png"
import { Model } from "../apis/models";
import useCurrentUser from "../reusable/hooks/useCurrentUser";
import MoreMenu from "./MoreMenu";
import MainMenuLink from "./MainMenuLink";
import SelectModelLink from "./SelectModelLink";
import { VscListTree } from "react-icons/vsc";

interface NavigationProps {
    model: Model | undefined
}

const Navigation = ({model}: NavigationProps) => {
    const {isLoggedIn, user, profile} = useCurrentUser()

    return (
        <header className="flex">
            <LinkWrap to="/">
                <img src={Logo} alt="Logo" className="h-8 m-4 select-none" />
            </LinkWrap>
            <div className="flex flex-1">
                <SelectModelLink model={model} className="ml-auto" />
                {typeof model !== "undefined" && (
                    <div className="flex">
                        <MainMenuLink name="Vehicle APIs" to="/model/:model_id/cvi" Icon={({...props}) => {
                            return <VscListTree {...props} className="mr-3" style={{transform: "scale(1.2)"}} />
                        }} />
                        <MainMenuLink name="Prototypes" to="/model/:model_id/library" Icon={ImBooks} />
                    </div>
                )}
                <MoreMenu model={model} />
                <LoginPopup trigger={
                    <Tab label={
                        isLoggedIn ? (
                            <MdPerson className="scale-110"/>
                        ) : (
                            <MdLogin className="scale-110"/>
                        )
                    } className="flex h-full text-xl items-center px-4 !w-fit" />
                } />
            </div>
        </header>
    )
}

export default Navigation