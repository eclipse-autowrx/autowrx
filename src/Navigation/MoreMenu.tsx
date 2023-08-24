import { MenuItem } from "@mui/material"
import { FC } from "react"
import { FiExternalLink } from "react-icons/fi"
import { HiLockOpen, HiMenu, HiUsers } from "react-icons/hi"
import { HiTag } from "react-icons/hi2"
import { MdOutlineDashboardCustomize, MdPermMedia } from "react-icons/md"
import { Model } from "../apis/models"
import permissions from "../permissions"
import Dropdown from "../reusable/Dropdown"
import ExternalLink from "../reusable/ExternalLink"
import useCurrentUser from "../reusable/hooks/useCurrentUser"
import LinkWrap from "../reusable/LinkWrap"
import Tab from "../reusable/Tabs/Tab"

interface MoreMenuProps {
    model?: Model
}

const MoreMenu: FC<MoreMenuProps> = ({model}) => {
    const {profile} = useCurrentUser()

    return (
        <Dropdown trigger={
            <Tab label={<HiMenu/>} className="flex h-full text-xl items-center px-4 text-gray-400" />
        } >
            {typeof model !== "undefined" && (
                <LinkWrap to="/model/:model_id/plugins" activeClassName="!text-aiot-green" className="text-slate-500">
                    <MenuItem
                    className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{minHeight: 36}}
                    >
                        <MdOutlineDashboardCustomize className="text-3xl" style={{transform: "scale(0.6)", marginRight: "2px"}}/>
                        <div>Plugins</div>
                    </MenuItem>
                </LinkWrap>
            )}
            {(typeof model !== "undefined" && permissions.TENANT(profile).canEdit()) && (
                <LinkWrap to="/model/:model_id/permissions" activeClassName="!text-aiot-green" className="text-slate-500">
                    <MenuItem
                    className="!pl-2 !pr-5 !py-0 text-inherit" style={{minHeight: 36}}
                    >
                        <HiLockOpen className="text-3xl" style={{transform: "scale(0.6)", marginRight: "2px"}}/>
                        <div>Permissions</div>
                    </MenuItem>
                </LinkWrap>
            )}
            <LinkWrap to="/media" activeClassName="!text-aiot-green" className="text-slate-500">
                <MenuItem
                className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{minHeight: 36}}
                >
                    <MdPermMedia className="text-3xl" style={{transform: "scale(0.55)", marginRight: "2px"}}/>
                    <div>Media</div>
                </MenuItem>
            </LinkWrap>
            <LinkWrap to="/tags" activeClassName="!text-aiot-green" className="text-slate-500">
                <MenuItem
                className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{minHeight: 36}}
                >
                    <HiTag className="text-3xl" style={{transform: "scale(0.65)", marginRight: "2px"}}/>
                    <div>Tags</div>
                </MenuItem>
            </LinkWrap>
            <ExternalLink to="https://playground-plugins.netlify.app" target="_blank">
                <MenuItem
                className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{minHeight: 36}}
                >
                    <FiExternalLink className="text-3xl" style={{transform: "scale(0.65)", marginRight: "2px"}}/>
                    <div>Widgets</div>
                </MenuItem>
            </ExternalLink>
            {permissions.TENANT(profile).canEdit() && (
                <LinkWrap to="/manage-users" activeClassName="!text-aiot-green" className="text-slate-500">
                    <MenuItem
                    className="!pl-2 !pr-5 !py-0 text-inherit" style={{minHeight: 36}}
                    >
                        <HiUsers className="text-3xl" style={{transform: "scale(0.6)", marginRight: "2px"}}/>
                        <div>Users</div>
                    </MenuItem>
                </LinkWrap>
            )}
        </Dropdown>
    )
}

export default MoreMenu