import { Model } from "../../../../apis/models";
import { useCurrentTenantModels } from "../../../../reusable/hooks/useCurrentTenantModels";
import LinkWrap from "../../../../reusable/LinkWrap";
import NewModelButton from "../../NewModelButton";
import ImportModelButton from "../../ImportModelButton";
import DisplayImage from "../../PrototypeOverview/DisplayImage";
import CustomDisplayImage from "../../PrototypeOverview/CustomDisplayImage";
import { useState, useEffect } from "react";
import clsx from "clsx";
import useCurrentUser from "../../../../reusable/hooks/useCurrentUser";
import permissions from "../../../../permissions";
import { useGetUserFeatures } from "../../../../reusable/hooks/useGetUserFeatures";

interface ModelDisplayProps {
    model: Model;
    myModel?: boolean | null;
}

const ModelDisplay = ({ model, myModel }: ModelDisplayProps) => {
    return (
        <LinkWrap to={`/model/${model.id}`} className="mr-2 w-full">
            <div className="flex flex-col w-full h-full rounded-lg overflow-hidden select-none border border-gray-200 hover:border-aiot-blue transition duration-300">
                <div className="flex items-center pt-2 pb-1 px-5 text-2xl text-aiot-blue leading-tight">
                    {model.name}
                </div>
                <CustomDisplayImage
                    image_file={model.model_home_image_file}
                    aspectRatio="4/3"
                    minHeight={200}
                    isBlur={false}
                />
                {/* <DisplayImage image_file={model.model_home_image_file} maxHeight={200} /> */}
                <div className="mt-1 mb-1 flex items-center px-4 text-[11px]">
                    {myModel && (
                        <div className="mr-2 px-3 py-0 rounded-full bg-slate-100 border border-slate-500 text-slate-700">
                            My Models
                        </div>
                    )}
                    {
                        <div className="mr-2 px-3 py-0 rounded-full bg-slate-100 border border-slate-500 text-slate-700">
                            {model.visibility || "public"}
                        </div>
                    }
                </div>
            </div>
        </LinkWrap>
    );
};

const MODEL_TYPES = ["My Contributions", "My Models", "Public", "All"];

const SelectModel = () => {
    const { isLoggedIn, user, profile } = useCurrentUser();
    const models = useCurrentTenantModels();
    // console.log(models)
    const [activeType, setActiveType] = useState("My Contributions" as string);
    const [displayModels, setDisplayModel] = useState([] as Model[]);
    const [myModels, setMyModels] = useState([] as Model[]);
    const [myContributeModels, setMyContributeModels] = useState([] as Model[]);
    const [publicModels, setPublicModels] = useState([] as Model[]);
    const [supportTypes, setSupportType] = useState<string[]>([]);

    const { hasAccessToFeature } = useGetUserFeatures();
    const [canCreateUnlimitedModels, setCanCreateUnlimitedModels] = useState(false);
    // Only allow free user create 3 models
    useEffect(() => {
        const unlimitedAccess = hasAccessToFeature("UNLIMITED_MODEL_CREATION");
        setCanCreateUnlimitedModels(unlimitedAccess || (!unlimitedAccess && myModels.length < 3));
        // console.log('canCreateUnlimitedModels', canCreateUnlimitedModels)
    }, [myModels, hasAccessToFeature]);

    useEffect(() => {
        if (!user) {
            setSupportType(["Public"]);
            setActiveType("Public");
            return;
        }
        setSupportType(MODEL_TYPES);
    }, [user]);

    useEffect(() => {
        let publicModels = models.filter((model) => model.visibility !== "private");

        if (!profile || !user) {
            console.log("no profile or user");
            setMyModels([]);
            setMyContributeModels([]);
        } else {
            let myModels = models.filter((model) => model.created && model.created.user_uid == user.uid);
            // console.log('myModels', myModels)
            setMyModels(myModels);

            let myContributeModels = models.filter(
                (model) =>
                    profile.roles &&
                    profile.roles.model_contributor &&
                    profile.roles.model_contributor.includes(model.id)
            );
            // myContributeModels = myContributeModels.filter((model) => model.created && model.created.user_uid != user.uid)
            setMyContributeModels(myContributeModels);

            // publicModels = publicModels.filter((model) => model.created && model.created.user_uid != user.uid)
            // publicModels = publicModels.filter((model) => !(profile.roles && profile.roles.model_contributor && profile.roles.model_contributor.includes(model.id)))
        }

        setPublicModels(publicModels);
    }, [models]);

    useEffect(() => {
        if (!models) {
            setDisplayModel([]);
            return;
        }
        switch (activeType) {
            case "All":
                // let allModels = [...myModels, ...myContributeModels, ...publicModels,];
                // allModels = [...allModels]

                // sort array by string name
                //allModels = allModels.sort((a,b) => {
                //    return a.name.localeCompare(b.name);
                //})

                let myModelsId = myModels.map((m) => m.id);
                let myContributeModelsId = myContributeModels.map((m) => m.id);
                let publicModelsId = publicModels.map((m) => m.id);

                let allModels = models.filter((model) => {
                    if (myModelsId.includes(model.id)) return true;
                    if (myContributeModelsId.includes(model.id)) return true;
                    if (publicModelsId.includes(model.id)) return true;

                    return false;
                });

                allModels = allModels.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });

                setDisplayModel(allModels);
                break;
            case "My Models":
                setDisplayModel(
                    myModels.sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    })
                );
                break;
            case "My Contributions":
                setDisplayModel(
                    myContributeModels.sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    })
                );
                break;
            case "Public":
                setDisplayModel(
                    publicModels.sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    })
                );
                break;
            default:
                break;
        }
    }, [activeType, publicModels, myModels, myContributeModels]);

    const handleModelCreated = (model_id: any) => {
        // console.log(`Model created: ${model_id}`)
        if (model_id) {
            window.location.href = `/model/${model_id}`;
        } else {
            window.location.reload();
        }
    };

    // tailwind no text select

    return (
        <div className="flex flex-col p-5">
            <div className="text-2xl mb-4 mt-2 text-aiot-blue flex items-center">
                <span className="font-bold text-aiot-gradient-800">Select Vehicle Models</span>
                <div className="grow"></div>
                {supportTypes &&
                    supportTypes.map((type) => (
                        <div
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={clsx(
                                "px-2 pt-1 pb-0.5 mx-1 border-b-2  text-sm cursor-pointer hover:bg-slate-100 select-none leading-tight",
                                activeType === type
                                    ? "border-aiot-blue text-aiot-blue"
                                    : "border-transparent text-gray-500"
                            )}
                        >
                            {type}
                        </div>
                    ))}
            </div>
            <div className="py-1">
                {displayModels && displayModels.length > 0 ? (
                    <div className="text-sm text-gray-500 mb-1">Select a vehicle model to start</div>
                ) : (
                    <div className="text-sm text-gray-500 mb-2 text-center px-6">
                        <i>There is no model available!</i>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-4 gap-4 w-full h-full">
                {displayModels &&
                    displayModels.map((model) => (
                        <ModelDisplay
                            key={model.id}
                            model={model}
                            myModel={user && model.created && model.created.user_uid == user.uid}
                        />
                    ))}
                {
                    // isLoggedIn && activeType == 'My Models'
                    // && (permissions.TENANT(profile).canEdit() || displayModels.length < 3)
                    // &&
                    isLoggedIn && activeType == "My Models" && canCreateUnlimitedModels && (
                        <>
                            <NewModelButton onModelCreated={handleModelCreated} />
                            <ImportModelButton onModelCreated={handleModelCreated} />
                        </>
                    )
                }
            </div>
            {!canCreateUnlimitedModels && activeType == "My Models" && (
                <div className="flex w-full justify-center text-sm text-gray-500 mt-6">
                    You have reached your limit of 3 model creations
                </div>
            )}
        </div>
    );
};

export default SelectModel;
