import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { VscDebugStart, VscEdit, VscTrash } from "react-icons/vsc";
import { REFS } from "../../apis/firebase";
import { Plugin } from "../../apis/models";
import { useCurrentModelPermissions } from "../../permissions/hooks";
import Button from "../../reusable/Button";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import useGetPrototype from "../../reusable/hooks/useGetProtototype";
import LinkWrap from "../../reusable/LinkWrap";
import triggerConfirmPopup from "../../reusable/triggerPopup/triggerConfirmPopup";
import SelectMedia from "../components/EditPrototype/SelectMedia";
import DisplayImage from "../components/PrototypeOverview/DisplayImage";
import UserProfile from "../components/PrototypeOverview/UserProfile";
import EditPlugin from "./EditPlugin";
import { TbEdit, TbPhotoEdit, TbTrash } from "react-icons/tb";
import { addLog } from "../../apis";
import { useParams } from "react-router-dom";

interface PluginDisplayProps {
    plugin: Plugin;
    plugins: Plugin[];
}

const PluginDisplay = ({ plugin, plugins }: PluginDisplayProps) => {
    const { profile } = useCurrentUser();
    const { model_id } = useParams();

    const { isLoggedIn } = useCurrentUser();
    const { prototype } = useGetPrototype(plugin.prototype_id ?? "");
    const modelPermissions = useCurrentModelPermissions();

    return typeof plugin === "undefined" ? null : (
        <div className="flex flex-col">
            <div className="flex w-full h-full relative">
                {modelPermissions.canEdit() && (
                    <div className="absolute top-3 right-3 z-10">
                        <SelectMedia
                            filter={["image"]}
                            selectMedia={async (media) => {
                                await updateDoc(doc(REFS.plugin, plugin.id), {
                                    image_file: media.imageUrl,
                                });
                                window.location.reload();
                            }}
                            trigger={
                                <Button className="pl-3 px-1 text-sm text-gray-500 hover:text-aiot-blue">
                                    <TbPhotoEdit
                                        className="w-6 h-auto text-gray-500 hover:text-aiot-blue"
                                        style={{ strokeWidth: 1.7 }}
                                    />
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>
            <DisplayImage image_file={plugin.image_file} />
            <div className="flex bg-slate-50 select-none items-center ">
                {/* <WIPPopup trigger={
                    <div className="flex py-1.5 px-4 ml-auto justify-center items-center w-fit items-center text-aiot-blue hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer">
                        <VscEdit className="mr-2"/> Edit
                    </div>
                }/> */}
                {modelPermissions.canEdit() && (
                    <>
                        <div className="grow"></div>
                        <EditPlugin
                            plugins={plugins}
                            plugin={plugin}
                            trigger={
                                <div
                                    className="flex py-1.5 px-4 justify-center items-center 
                                            w-fit text-gray-500 hover:bg-gray-200 
                                            active:bg-red-100 transition cursor-pointer ml-auto"
                                >
                                    <TbEdit
                                        className="w-6 h-auto text-gray-500 hover:text-aiot-blue"
                                        style={{ strokeWidth: 1.7 }}
                                    />
                                </div>
                            }
                        />

                        <div
                            className="flex py-1.5 px-4 justify-center items-center 
                                        w-fit text-red-500 hover:bg-red-100 
                                        active:bg-red-100 transition cursor-pointer ml-auto"
                            onClick={() =>
                                triggerConfirmPopup("Are you sure you want to delete this plugin?", async () => {
                                    await deleteDoc(doc(REFS.plugin, plugin.id));

                                    // add plugin log
                                    if (profile) {
                                        const username = profile.name || profile.email || "Anonymous";
                                        await addLog(
                                            `User '${username}' delete plugin with id ${plugin.id} under model '${model_id}'`,
                                            `User '${username}' delete plugin with id ${plugin.id} under model '${model_id}'`,
                                            "delete",
                                            profile.uid,
                                            null,
                                            plugin.id,
                                            "plugin",
                                            null
                                        );
                                    }
                                    window.location.reload();
                                })
                            }
                        >
                            <TbTrash className="w-6 h-auto" style={{ strokeWidth: 1.7 }} />
                        </div>
                    </>
                )}
            </div>
            <div className="relative flex flex-col p-5">
                <div className="flex">
                    <div className="text-3xl mb-3">{plugin.name}</div>
                </div>
                <div className="mb-4 w-fit">
                    <UserProfile user_uid={plugin.created.user_uid} clickable={true} />
                </div>
                <div className="leading-relaxed mb-4">{plugin.description}</div>
                <div>
                    <strong className="select-none">JS Code (URL): </strong>
                    <a href={plugin.js_code_url} className="cursor-pointer" target="_blank" rel="noreferrer">
                        {plugin.js_code_url}
                    </a>
                    <div>
                        {plugin.js_code_url.startsWith("https://media.digitalauto.tech") && (
                            <a
                                href={plugin.js_code_url.replace(
                                    "https://media.digitalauto.tech/data/files/",
                                    "https://editor.digitalauto.tech/editor/"
                                )}
                                target="_blank"
                                className="hover:underline hover:font-semibold select-none cursor-pointer mt-1 px-1 text-emerald-600"
                                rel="noreferrer"
                            >
                                Open JS code editor
                            </a>
                        )}
                    </div>
                </div>
                {typeof prototype !== "undefined" && prototype !== null && (
                    <div className=" mt-4">
                        <strong>Prototype: </strong>
                        <LinkWrap to={`/model/edUM243LO9Z5ubLoScr7/library/prototype/${prototype.id}`}>
                            {prototype.name}
                        </LinkWrap>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PluginDisplay;
