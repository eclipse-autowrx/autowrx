import { useEffect, useState, useRef } from "react";
import { BiArrowFromBottom } from "react-icons/bi";
import { newModel, addLog } from "../../apis";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Button from "../../reusable/Button";
import Input from "../../reusable/Input/Input";
import InputContainer from "../../reusable/Input/InputContainer";
import permissions from "../../permissions";
import Select from "../../reusable/Select";
import Popup from "../../reusable/Popup/Popup";
import { zipToModel } from "../../utils/zipUtils";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { REFS } from "../../apis/firebase";
import { TENANT_ID } from "../../constants";

interface ImportModelButtonProps {
    onModelCreated: (id: string | null) => void;
}

const ImportModelButton = ({ onModelCreated }: ImportModelButtonProps) => {
    const popupState = useState(false);
    const [loading, setLoading] = useState(false);
    const [displayError, setDisplayError] = useState<null | string>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const [importedModel, setImportedModel] = useState<any>(null);
    const [plugins, setPlugins] = useState<any[]>([]);
    const [prototypes, setProtoypes] = useState<any[]>([]);
    const [mode, setMode] = useState<"upload" | "confirm">("upload");

    const States = {
        Name: useState(""),
        Visibility: useState<"public" | "private">("private"),
    };

    useEffect(() => {
        setMode("upload");
    }, []);

    const triggerUploadMedia = () => {
        inputRef.current?.click();
    };

    const options: {
        value: "vss_api" | "scratch";
        name: string;
    }[] = [
        { value: "vss_api", name: "Start with the COVESA VSS API" },
        { value: "scratch", name: "Start from scratch" },
    ];

    const visibility_options: {
        value: "private" | "public";
        name: string;
    }[] = [
        { value: "private", name: "Private" },
        { value: "public", name: "Public" },
    ];

    const { user, profile } = useCurrentUser();
    if (!user) {
        return null;
    }

    const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const file = e.target.files?.[0];

        if (!file) return;
        let ret = await zipToModel(file);
        if (!ret) return;
        let newModel = ret.model;
        console.log("newModel", newModel);
        States["Name"][1](newModel.name);
        States["Visibility"][1](newModel.visibility);
        setImportedModel(newModel);
        setPlugins(ret.plugins || []);
        setProtoypes(ret.prototypes || []);
        if (newModel) setMode("confirm");
    };

    const createNewModel = async () => {
        if (!States.Name[0]) {
            setDisplayError("Error: please enter a name!");
            return;
        }
        setDisplayError("");
        setLoading(true);
        const newModelRef = doc(REFS.model);
        await setDoc(newModelRef, {
            id: newModelRef.id,
            custom_apis: importedModel.custom_apis || {},
            created: {
                created_time: Timestamp.now(),
                user_uid: user.uid,
            },
            cvi: importedModel.cvi || "",
            main_api: importedModel.main_api || "Vehicle",
            model_home_image_file:
                importedModel.model_home_image_file ||
                "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fcar_full_ed.PNG?alt=media&token=ea75b8c1-a57a-44ea-9edb-9816131f9905",
            model_files: importedModel.model_files || {},
            name: States.Name[0],
            visibility: States.Visibility[0],
            tenant_id: TENANT_ID,
        });
        addLog(
            `New model '${States.Name[0]}' with visibility: ${States.Visibility[0]}`,
            `New model '${States.Name[0]}' was created by ${user.email || user.displayName || user.uid}`,
            "new-model",
            user.uid,
            null,
            null,
            null,
            null
        );

        // save prototypes list and plugin list
        if (plugins.length > 0) {
            plugins.forEach(async (plugin) => {
                // console.log("plugin", plugin)
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
                        model_id: newModelRef.id,
                        name: plugin.name,
                        js_code_url: plugin.js_code_url,
                    };

                    await setDoc(newPluginRef, updateObj);
                } catch (err) {
                    console.log("Err on create plugin", err);
                }
            });
        }

        if (prototypes.length > 0) {
            prototypes.forEach(async (proto) => {
                // console.log("proto", proto)
                const newPrototypeRef = doc(REFS.prototype);
                try {
                    await setDoc(newPrototypeRef, {
                        id: newPrototypeRef.id,
                        state: proto.state || "development",
                        apis: {
                            VSS: [],
                            VSC: [],
                        },
                        code: proto.code || "",
                        widget_config: proto.widget_config || "",
                        created: {
                            created_time: Timestamp.now(),
                            user_uid: user.uid,
                        },
                        description: proto.description,
                        tags: proto.tags || [],
                        image_file: proto.image_file,
                        model_id: newModelRef.id,
                        name: proto.name,
                        portfolio: proto.portfolio || {
                            effort_estimation: 0,
                            needs_addressed: 0,
                            relevance: 0,
                        },
                        complexity_level: proto.complexity_level,
                        journey_image_file: proto.journey_image_file || "",
                        analysis_image_file: proto.analysis_image_file || "",
                        customer_journey: proto.customer_journey || "",
                        partner_logo: proto.partner_logo || "",
                        rated_by: {},
                    });
                } catch (err) {
                    console.log("Err on create prototype", err);
                }
            });
        }

        popupState[1](false);
        setLoading(false);
        onModelCreated(newModelRef?.id);
    };

    return (
        <Popup
            state={popupState}
            trigger={
                <div
                    className={`flex rounded-lg border-4 border-dashed items-center justify-center text-gray-300 hover:border-gray-400 hover:text-gray-400 cursor-pointer transition min`}
                    style={{ minHeight: 180 }}
                >
                    <div className="text-center flex flex-col items-center justify-center">
                        <BiArrowFromBottom className="text-5xl" />
                        <div className="text-gray-500">Import model</div>
                    </div>
                </div>
            }
            width="800px"
            className="p-4 h-[90vh] overflow-y-auto"
        >
            <div className="flex flex-col w-full h-full">
                <div className="text-2xl mb-6 text-emerald-600">Import model from ZIP file</div>

                {mode === "upload" && (
                    <div className="grid place-items-center h-full">
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
                        <InputContainer label="Name" input={<Input state={States.Name} />} />
                        <InputContainer
                            label="Visibility"
                            input={<Select state={States.Visibility as any} options={visibility_options} />}
                        />

                        {displayError !== null && (
                            <div className="text-red-500 text-sm mt-6 mb-3 pl-1">{displayError}</div>
                        )}

                        <Button
                            disabled={loading}
                            className="ml-auto mt-auto w-fit min-w-fit py-1"
                            variant="success"
                            onClick={() => {
                                createNewModel();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                )}
            </div>
        </Popup>
    );
};

export default ImportModelButton;
