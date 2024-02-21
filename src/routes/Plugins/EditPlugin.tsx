import { doc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { FC, useEffect, useState } from "react";
import { HiSelector } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { REFS } from "../../apis/firebase";
import { Model, Prototype } from "../../apis/models";
import { useCurrentModelPermissions } from "../../permissions/hooks";
import Button from "../../reusable/Button";
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Input from "../../reusable/Input/Input";
import InputContainer from "../../reusable/Input/InputContainer";
import SideNav from "../../reusable/SideNav/SideNav";
import LoginPopup from "../components/LoginPopup";
import SelectPrototype from "./SelectPrototype";
import { Plugin } from "../../apis/models";
import axios from "axios";
import { addLog } from "../../apis";

interface NewPluginProps {
    trigger?: React.ReactElement;
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    plugins?: Plugin[];
    plugin?: Plugin;
}

const EditPlugin: FC<NewPluginProps> = ({ state: statePassed, trigger, plugins, plugin }) => {
    const { profile } = useCurrentUser();

    const selfManaged = useState(false);
    const state = statePassed ?? selfManaged;
    const [loading, setLoading] = useState(false);
    const [displayError, setDisplayError] = useState<null | string>(null);

    const [editorUrl, setEditorUrl] = useState("");

    const { isLoggedIn, user } = useCurrentUser();
    const model = useCurrentModel() as Model;
    const modelPermissions = useCurrentModelPermissions();

    const [isNewPlugin, setIsNewPlugin] = useState(!plugin);

    const States = {
        Name: useState(plugin?.name ?? ""),
        Description: useState(plugin?.description ?? ""),
        JSCode: useState(plugin?.js_code_url ?? ""),
        Prototype: useState<Prototype | null>(null),
    };

    useEffect(() => {
        States.Name[1](plugin?.name ?? "");
        States.Description[1](plugin?.description ?? "");
        States.JSCode[1](plugin?.js_code_url ?? "");
    }, [plugin]);

    useEffect(() => {
        if (!States.JSCode[0]) {
            setEditorUrl("");
            return;
        }
        if (States.JSCode[0].startsWith("https://media.digitalauto.tech/data/files/")) {
            setEditorUrl(
                States.JSCode[0].replace(
                    "https://media.digitalauto.tech/data/files/",
                    "https://editor.digitalauto.tech/editor/"
                )
            );
        } else {
            setEditorUrl("");
        }
    }, [States.JSCode[0]]);

    const savePlugin = async () => {
        if (user === null) {
            return;
        }
        if (!States.Name[0]) {
            setDisplayError("Error: Name is required");
            return;
        }

        if (isNewPlugin) {
            if (plugins && plugins.find((plugin) => plugin.name.toLowerCase() === States.Name[0].toLowerCase())) {
                setDisplayError("Error: Plugin with this name already exists");
                return;
            }
            await createPlugin();
        } else {
            if (
                plugins &&
                plugins
                    .filter((p) => p.id != plugin?.id)
                    .find((plugin) => plugin.name.toLowerCase() === States.Name[0].toLowerCase())
            ) {
                setDisplayError("Error: Plugin with this name already exists");
                return;
            }
            await updatePLugin();
        }
    };

    const createPlugin = async () => {
        setDisplayError("");
        setLoading(true);

        const newDocRef = doc(REFS.plugin);

        try {
            const updateObj: any = {
                id: newDocRef.id,
                created: {
                    created_time: Timestamp.now(),
                    user_uid: user?.uid,
                },
                description: States.Description[0],
                image_file: "",
                model_id: model.id,
                name: States.Name[0],
                js_code_url: States.JSCode[0],
            };

            if (States.Prototype[0] !== null) {
                updateObj.prototype_id = States.Prototype[0].id;
            }

            await setDoc(newDocRef, updateObj);

            // add plugin log
            if (profile) {
                const username = profile.name || profile.email || "Anonymous";
                await addLog(
                    `User '${username}' add plugin with id ${updateObj.id} under model '${model.id}'`,
                    `User '${username}' add plugin with id ${updateObj.id} under model '${model.id}'`,
                    "add",
                    profile.uid,
                    null,
                    updateObj.id,
                    "plugin",
                    null
                );
            }
        } catch (err) {
            setDisplayError((err as any).message);
        }
        setLoading(false);
        window.location.reload();
    };

    const updatePLugin = async () => {
        if (!plugin) return;
        setDisplayError("");
        setLoading(true);
        try {
            await updateDoc(doc(REFS.plugin, plugin.id), {
                description: States.Description[0],
                name: States.Name[0],
                js_code_url: States.JSCode[0],
            });

            // edit plugin log
            if (profile) {
                const username = profile.name || profile.email || "Anonymous";
                await addLog(
                    `User '${username}' update plugin with id ${plugin.id} under model '${model.id}'`,
                    `User '${username}' update plugin with id ${plugin.id} under model '${model.id}'`,
                    "update",
                    profile.uid,
                    null,
                    plugin.id,
                    "plugin",
                    null
                );
            }
        } catch (err) {
            setDisplayError((err as any).message);
        }
        setLoading(false);
        window.location.reload();
    };

    return (
        <SideNav
            trigger={typeof trigger === "undefined" ? <></> : trigger}
            state={state}
            width="400px"
            className="h-full"
        >
            {modelPermissions.canEdit() ? (
                <div className="flex flex-col h-full w-full p-4">
                    <InputContainer label="Name" input={<Input state={States.Name} />} />
                    <InputContainer label="Description" input={<Input state={States.Description} />} />
                    <InputContainer label="JS Code (URL)" input={<Input state={States.JSCode} form="textarea" />} />

                    {!loading && (
                        <div className="flex">
                            <div className="grow"></div>
                            {editorUrl && (
                                <a
                                    href={editorUrl}
                                    target="_blank"
                                    className="hover:underline hover:font-semibold select-none cursor-pointer px-1 text-emerald-600"
                                    rel="noreferrer"
                                >
                                    Open JS code editor
                                </a>
                            )}
                            {!editorUrl && (
                                <div
                                    className="hover:underline hover:font-semibold select-none cursor-pointer px-1 text-aiot-blue"
                                    onClick={async () => {
                                        setLoading(true);
                                        let content = `
// This is a sample plugin
const plugin = ({widgets, simulator, vehicle}) => {


    // Simulator section ==================================================
        // Simulator provides a virtual environment to simulate, keep track and manipulate VSS api
        let autoBlinkLight = false
        let headLightState = false

        // When python code calls vehicle.Body.Lights.IsHighBeamOn.set(value), this function will be called
        simulator("Vehicle.Body.Lights.IsHighBeamOn", "get", () => {
            return headLightState
        })
        // When python code calls vehicle.Body.Lights.IsHighBeamOn.get(), this function will be called
        simulator("Vehicle.Body.Lights.IsHighBeamOn", "set", (value) => {
            headLightState = value
        })

        // blink the headlight every second if auto blink mode is enabled
        setInterval(async () => {
            if(autoBlinkLight) {
                headLightState = !headLightState
            }
        }, 1000)
    // End Simulator section ==============================================


    // Widget section =====================================================
        // widget provides an user interface to interact with simulator
        const container = document.createElement("div");
        container.setAttribute("style", "padding: 40px;");
        container.innerHTML = "Headlight State: <span id='headlight-state'></span>"
        let headlightState = container.querySelector("#headlight-state")

        // read the headlight state every second
        setInterval(async () => {
            let headLightStateFromApi = await vehicle["Body.Lights.IsHighBeamOn"].get();
            headlightState.innerHTML = headLightStateFromApi
        }, 1000)

        // register the widget
        widgets.register("HeadLight", (box) => {
            box.injectNode(container);
        });
    // End Widget section =================================================

    // Plugin returns a few functions to interact with the plugin, you can call it from python code
    return {
        call_me: (name) => { 
            return "Hello " + name + ", I am plugin."
        },
        turn_on_auto_blink_mode: () => {
            autoBlinkLight = true
        },
        turn_off_auto_blink_mode: () => {
            autoBlinkLight = false
        }
    }
}
export default plugin
`;
                                        try {
                                            let res = await axios.post("https://media.digitalauto.tech/file", {
                                                content: content,
                                                filename: (States.Name[0] || "plugin") + ".js",
                                                type: "javascript",
                                                uid: user?.uid,
                                            });
                                            let filename = "https://media.digitalauto.tech/data/files/" + res.data;
                                            States.JSCode[1](filename);
                                        } catch (err) {}
                                        setLoading(false);
                                    }}
                                >
                                    Create JS code file using our editor
                                </div>
                            )}
                        </div>
                    )}

                    {displayError !== null && <div className="text-red-500 text-sm my-3 pl-1">{displayError}</div>}
                    {/* <InputContainer label="Linked Prototype" input={
                        <div className="flex text-gray-500 py-1 items-center">
                            <SelectPrototype
                            trigger={
                                <div className="flex items-center w-full text-gray-500 transition cursor-pointer">
                                    <div>{States.Prototype[0] === null ? "Select Prototype" : States.Prototype[0].name}</div>
                                    <HiSelector className="ml-auto text-lg" />
                                </div>
                            }
                            selectPrototype={async (prototype) => {
                                States.Prototype[1](prototype)
                            }}
                            />
                            {States.Prototype[0] !== null && (
                                <IoClose className="ml-2 cursor-pointer text-2xl" onClick={() => States.Prototype[1](null)} />
                            )}
                        </div>
                    } /> */}
                    <div className="mt-auto">
                        <Button
                            disabled={loading}
                            className="py-1 w-fit ml-auto"
                            variant="success"
                            onClick={savePlugin}
                        >
                            {isNewPlugin ? "Create" : "Save"}
                        </Button>
                    </div>
                </div>
            ) : isLoggedIn ? (
                <div className="flex flex-col w-full h-full text-center px-4 pt-12 select-none text-gray-500">
                    <div>You don't have the required permissions to create/update a plugin in this model.</div>
                </div>
            ) : (
                <div className="flex flex-col w-full h-full text-center px-4 pt-12 select-none text-gray-500">
                    <div>
                        You must be{" "}
                        <LoginPopup trigger={<span className="cursor-pointer text-aiot-green/80">logged in</span>} /> to
                        create a prototype/plugin.
                    </div>
                </div>
            )}
        </SideNav>
    );
};

export default EditPlugin;
