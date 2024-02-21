import { doc, setDoc, Timestamp } from "firebase/firestore";
import { FC, useState, useRef, useEffect } from "react";
import { REFS } from "../apis/firebase";
import { Model } from "../apis/models";
import Button from "../reusable/Button";
import Input from "../reusable/Input/Input";
import InputContainer from "../reusable/Input/InputContainer";
import SideNav from "../reusable/SideNav/SideNav";
import useCurrentUser from "../reusable/hooks/useCurrentUser";
import { useCurrentModel } from "../reusable/hooks/useCurrentModel";
import LoginPopup from "./components/LoginPopup";
import { useCurrentModelPermissions, useCurrentProtototypePermissions } from "../permissions/hooks";
import { Prototype } from "../apis/models";
import Select from "../reusable/Select";
import { addLog } from "../apis";
import Popup from "../reusable/Popup/Popup";
import { zipToPrototype } from "../utils/zipUtils";
import { getPlugins } from "../apis";
import plugin from "chartjs-plugin-datalabels";

interface ImportPrototypeProps {
    trigger?: React.ReactElement;
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    prototypes?: Prototype[];
}

const ImportPrototype: FC<ImportPrototypeProps> = ({ state: statePassed, trigger, prototypes }) => {
    const selfManaged = useState(false);
    const state = statePassed ?? selfManaged;

    const { isLoggedIn, user } = useCurrentUser();
    const model = useCurrentModel() as Model;
    const modelPermissions = useCurrentModelPermissions();
    const [loading, setLoading] = useState(false);
    const [displayError, setDisplayError] = useState<null | string>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [importedPrototype, setImportedPrototype] = useState<any>(null);
    const [plugins, setPlugins] = useState<any[]>([]);

    const [mode, setMode] = useState<"upload" | "confirm">("upload");

    useEffect(() => {
        if (!state || !state[0]) {
            setMode("upload");
        }
    }, [state]);

    const States = {
        Name: useState(""),
        Problem: useState(""),
        SaysWho: useState(""),
        Solution: useState(""),
        Status: useState(""),
        Complexity: useState(3),
    };

    const triggerUploadMedia = () => {
        inputRef.current?.click();
    };

    const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const file = e.target.files?.[0];

        if (!file) return;
        let newPrototype = await zipToPrototype(model, file);
        console.log("newPrototype", newPrototype);
        States["Name"][1](newPrototype.name);
        States["Problem"][1](newPrototype.description.problem);
        States["SaysWho"][1](newPrototype.description.says_who);
        States["Solution"][1](newPrototype.description.solution);
        States["Status"][1](newPrototype.state);
        States["Complexity"][1](Number(newPrototype.description.complexity));
        setImportedPrototype(newPrototype);
        setPlugins(newPrototype.plugins);
        if (newPrototype) setMode("confirm");
    };

    const createPrototype = async () => {
        if (user === null || !importedPrototype) {
            return;
        }

        if (!States.Name[0]) {
            setDisplayError("Error: Name is required");
            return;
        }

        if (
            prototypes &&
            prototypes.find((prototype) => prototype.name.toLowerCase() === States.Name[0].toLowerCase())
        ) {
            setDisplayError("Error: Prototype with this name already exists");
            return;
        }

        setLoading(true);
        setDisplayError("");
        const newDocRef = doc(REFS.prototype);
        try {
            await setDoc(newDocRef, {
                id: newDocRef.id,
                apis: {
                    VSS: [],
                    VSC: [],
                },
                state: importedPrototype.state || "development",
                code: importedPrototype.code,
                widget_config: importedPrototype.widget_config,
                customer_journey: importedPrototype.customer_journey,
                partner_logo: importedPrototype.partner_logo,
                journey_image_file: importedPrototype.journey_image_file,
                analysis_image_file: importedPrototype.analysis_image_file,
                created: {
                    created_time: Timestamp.now(),
                    user_uid: user.uid,
                },
                description: {
                    problem: States.Problem[0],
                    says_who: States.SaysWho[0],
                    solution: States.Solution[0],
                    status: States.Status[0],
                },
                image_file: importedPrototype.image_file,
                model_id: model.id,
                name: States.Name[0],
                portfolio: {
                    effort_estimation: 0,
                    needs_addressed: 0,
                    relevance: 0,
                },
                complexity_level: States.Complexity[0],
                rated_by: {},
            });
            await addLog(
                `New prototype '${States.Name[0]}' under model '${model.name}'`,
                `Prototype '${States.Name[0]}' was created by ${user.email || user.displayName || user.uid}`,
                "new-prototype",
                user.uid,
                null,
                newDocRef.id,
                "prototype",
                model.id
            );
            if (plugins.length > 0) {
                let allPlugins = ((await getPlugins(model.id)) || []) as any[];
                plugins.forEach(async (plugin: any) => {
                    let existPlugin = allPlugins.find((p) => p.name === plugin.name);
                    if (!existPlugin) {
                        const newPluginRef = doc(REFS.plugin);
                        try {
                            const updateObj: any = {
                                id: newPluginRef.id,
                                created: {
                                    created_time: Timestamp.now(),
                                    user_uid: user?.uid,
                                },
                                description: plugin.description,
                                image_file: plugin.image_file,
                                model_id: model.id,
                                name: plugin.name,
                                js_code_url: plugin.js_code_url,
                            };
                            await setDoc(newPluginRef, updateObj);
                        } catch (err) {
                            console.log("Err on create plugin", err);
                        }
                    }
                });
            }
        } catch (out_err) {
            console.log(out_err);
        }
        setLoading(false);
        window.location.href = `/model/${model.id}/library/prototype/${newDocRef.id}`;
        // window.location.reload()
    };

    return (
        <Popup
            trigger={typeof trigger === "undefined" ? <></> : trigger}
            state={state}
            width="800px"
            className="min-h-[300px]"
        >
            <div className="font-bold text-2xl mb-2 text-gray-600">Import Prototype From Zip File</div>
            {modelPermissions.canEdit() ? (
                <>
                    {mode === "upload" && (
                        <div className="grid place-items-center min-h-[180px]">
                            <div className="flex items-center mb-4 mt-8">
                                <div className="pr-2 mr-8">Pick a zip file</div>
                                <Button variant="success" className="py-1 px-4 text-sm" onClick={triggerUploadMedia}>
                                    Select Zip File
                                </Button>
                            </div>
                            <input
                                type="file"
                                style={{ display: "none" }}
                                ref={inputRef}
                                accept=".zip"
                                onChange={handleUploadMedia}
                            />
                        </div>
                    )}

                    {mode === "confirm" && (
                        <div>
                            <div className="flex flex-col max-h-[500px] overflow-y-auto w-full p-4">
                                <InputContainer label="Name *" input={<Input state={States.Name} />} />
                                <div className="mb-3 text-sm font-bold text-gray-400">Description</div>
                                <InputContainer label="Problem" input={<Input state={States.Problem} />} />
                                <InputContainer label="Says who?" input={<Input state={States.SaysWho} />} />
                                <InputContainer label="Solution" input={<Input state={States.Solution} />} />
                                <InputContainer label="Status" input={<Input state={States.Status} />} />

                                <div className="flex mt-2 items-center">
                                    <div className="w-[120px]">Complexity:</div>
                                    <select
                                        className="w-[80px] text-center bg-slate-100 px-4 py-2 rounded"
                                        value={States.Complexity[0]}
                                        onChange={(e) => States.Complexity[1](Number(e.target.value))}
                                    >
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                    </select>
                                </div>

                                <div className="mt-4">
                                    <img
                                        className="w-full max-h-[300px] object-contain"
                                        src={importedPrototype.image_file}
                                    />
                                </div>

                                <div className="mt-4">
                                    <div className="text-lg font-semibold text-slate-600 mb-1">Python code:</div>
                                    <div className="px-4 py-2 bg-slate-100 rounded whitespace-pre-wrap text-[12px] max-h-[160px] overflow-y-auto">
                                        {importedPrototype.code}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="text-lg font-semibold text-slate-600 mb-1">Dashboard config:</div>
                                    <div className="px-4 py-2 bg-slate-100 rounded whitespace-pre-wrap text-[12px] max-h-[160px] overflow-y-auto">
                                        {importedPrototype.widget_config}
                                    </div>
                                </div>
                            </div>

                            {displayError !== null && (
                                <div className="text-red-500 text-sm my-3 pl-1">{displayError}</div>
                            )}
                            <div className="mt-2">
                                <Button
                                    className="py-1 w-fit ml-auto"
                                    variant="success"
                                    disabled={loading}
                                    onClick={createPrototype}
                                >
                                    Create Prorotype
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col w-full h-full text-center px-4 pt-12 select-none text-gray-500">
                    <div>
                        You don't have permissions{" "}
                        <LoginPopup trigger={<span className="cursor-pointer text-aiot-green/80">logged in</span>} /> to
                        create a prototype.
                    </div>
                </div>
            )}
        </Popup>
    );
};

export default ImportPrototype;
