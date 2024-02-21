import { useEffect, useState } from "react";
import { MenuItem } from "@mui/material";
import { FC } from "react";
import { FiExternalLink } from "react-icons/fi";
import { HiLockOpen, HiMenu, HiUsers, HiTrendingUp, HiPresentationChartBar } from "react-icons/hi";
import { HiTag } from "react-icons/hi2";
import { MdOutlineDashboardCustomize, MdPermMedia } from "react-icons/md";
import { TbPuzzleFilled, TbReportAnalytics } from "react-icons/tb";
import { FaCubesStacked } from "react-icons/fa6";
import { Model } from "../apis/models";
import permissions from "../permissions";
import Dropdown from "../reusable/Dropdown";
import ExternalLink from "../reusable/ExternalLink";
import useCurrentUser from "../reusable/hooks/useCurrentUser";
import LinkWrap from "../reusable/LinkWrap";
import Tab from "../reusable/Tabs/Tab";
import { useGetUserFeatures } from "../reusable/hooks/useGetUserFeatures";

interface MoreMenuProps {
    model?: Model;
}

const MoreMenu: FC<MoreMenuProps> = ({ model }) => {
    const { profile } = useCurrentUser();

    const isAdmin = permissions.TENANT(profile).canEdit();

    const { hasAccessToFeature } = useGetUserFeatures();
    const [canViewUseMetrix, setCanViewUseMetrix] = useState(isAdmin);
    const [canViewSystemLogs, setCanViewSystemLogs] = useState(isAdmin);
    const [canManageUsers, setCanManageUsers] = useState(isAdmin);

    useEffect(() => {
        if (!isAdmin) {
            setCanViewUseMetrix(hasAccessToFeature("VIEW_USE_METRIX"));
            setCanViewSystemLogs(hasAccessToFeature("VIEW_SYSTEM_LOGS"));
            setCanManageUsers(hasAccessToFeature("MANAGE_USERS"));
        }
    }, [hasAccessToFeature, isAdmin]);

    return (
        <Dropdown trigger={<Tab label={<HiMenu />} className="flex h-full text-xl items-center px-4 text-gray-400" />}>
            {model && (
                <LinkWrap
                    to={`/model/${model.id}/plugins`}
                    activeClassName="!text-aiot-green"
                    className="text-slate-500"
                >
                    <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{ minHeight: 36 }}>
                        <MdOutlineDashboardCustomize
                            className="text-3xl"
                            style={{ transform: "scale(0.6)", marginRight: "2px" }}
                        />
                        <div>Plugins</div>
                    </MenuItem>
                </LinkWrap>
            )}
            {model && (
                <LinkWrap
                    to={`/model/${model.id}/add-ons`}
                    activeClassName="!text-aiot-green"
                    className="text-slate-500"
                >
                    <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{ minHeight: 36 }}>
                        <TbPuzzleFilled className="text-3xl" style={{ transform: "scale(0.6)", marginRight: "2px" }} />
                        <div>Add-ons</div>
                    </MenuItem>
                </LinkWrap>
            )}
            {model && permissions.TENANT(profile).canEdit() && (
                <LinkWrap
                    to={`/model/${model.id}/permissions`}
                    activeClassName="!text-aiot-green"
                    className="text-slate-500"
                >
                    <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}>
                        <HiLockOpen className="text-3xl" style={{ transform: "scale(0.6)", marginRight: "2px" }} />
                        <div>Permissions</div>
                    </MenuItem>
                </LinkWrap>
            )}
            {/* {typeof model !== "undefined" && (
                <LinkWrap to="/model/:model_id/plugins" activeClassName="!text-aiot-green" className="text-slate-500">
                    <MenuItem
                        className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{ minHeight: 36 }}
                    >
                        <MdOutlineDashboardCustomize className="text-3xl" style={{ transform: "scale(0.6)", marginRight: "2px" }} />
                        <div>Plugins</div>
                    </MenuItem>
                </LinkWrap>
            )}
            {(typeof model !== "undefined" && permissions.TENANT(profile).canEdit()) && (
                <LinkWrap to="/model/:model_id/permissions" activeClassName="!text-aiot-green" className="text-slate-500">
                    <MenuItem
                        className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}
                    >
                        <HiLockOpen className="text-3xl" style={{ transform: "scale(0.6)", marginRight: "2px" }} />
                        <div>Permissions</div>
                    </MenuItem>
                </LinkWrap>
            )}  */}
            <LinkWrap to="/media" activeClassName="!text-aiot-green" className="text-slate-500">
                <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{ minHeight: 36 }}>
                    <MdPermMedia className="text-3xl" style={{ transform: "scale(0.55)", marginRight: "2px" }} />
                    <div>Media</div>
                </MenuItem>
            </LinkWrap>
            <LinkWrap to="/tags" activeClassName="!text-aiot-green" className="text-slate-500">
                <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{ minHeight: 36 }}>
                    <HiTag className="text-3xl" style={{ transform: "scale(0.65)", marginRight: "2px" }} />
                    <div>Tags</div>
                </MenuItem>
            </LinkWrap>
            <ExternalLink to="https://playground-plugins.netlify.app" target="_blank">
                <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit border-l-2" style={{ minHeight: 36 }}>
                    <FiExternalLink className="text-3xl" style={{ transform: "scale(0.65)", marginRight: "2px" }} />
                    <div>Widgets</div>
                </MenuItem>
            </ExternalLink>
            {permissions.TENANT(profile).canEdit() && (
                <div>
                    <LinkWrap to="/manage-features" activeClassName="!text-aiot-green" className="text-slate-500">
                        <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}>
                            <FaCubesStacked
                                className="text-3xl"
                                style={{ transform: "scale(0.6)", marginRight: "2px" }}
                            />
                            <div>Features</div>
                        </MenuItem>
                    </LinkWrap>
                    <LinkWrap to="/dashboard" activeClassName="!text-aiot-green" className="text-slate-500">
                        <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}>
                            <HiTrendingUp
                                className="text-3xl"
                                style={{ transform: "scale(0.6)", marginRight: "2px" }}
                            />
                            <div>Statistics</div>
                        </MenuItem>
                    </LinkWrap>
                    <LinkWrap to="/issues" activeClassName="!text-aiot-green" className="text-slate-500">
                        <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}>
                            <TbReportAnalytics
                                className="text-3xl"
                                style={{ transform: "scale(0.6)", marginRight: "2px" }}
                            />
                            <div>Issues</div>
                        </MenuItem>
                    </LinkWrap>
                </div>
            )}
            <div>
                {canManageUsers && (
                    <LinkWrap to="/manage-users" activeClassName="!text-aiot-green" className="text-slate-500">
                        <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}>
                            <HiUsers className="text-3xl" style={{ transform: "scale(0.6)", marginRight: "2px" }} />
                            <div>Users</div>
                        </MenuItem>
                    </LinkWrap>
                )}
                {canViewSystemLogs && (
                    <LinkWrap to="/system-logs" activeClassName="!text-aiot-green" className="text-slate-500">
                        <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}>
                            <HiPresentationChartBar
                                className="text-3xl"
                                style={{ transform: "scale(0.6)", marginRight: "2px" }}
                            />
                            <div>System Logs</div>
                        </MenuItem>
                    </LinkWrap>
                )}
                {canViewUseMetrix && (
                    <LinkWrap to="/use-metrix" activeClassName="!text-aiot-green" className="text-slate-500">
                        <MenuItem className="!pl-2 !pr-5 !py-0 text-inherit" style={{ minHeight: 36 }}>
                            <HiPresentationChartBar
                                className="text-3xl"
                                style={{ transform: "scale(0.6)", marginRight: "2px" }}
                            />
                            <div>Use Metrix</div>
                        </MenuItem>
                    </LinkWrap>
                )}
            </div>
        </Dropdown>
    );
};

export default MoreMenu;
