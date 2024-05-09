import { Route, Routes, useLocation } from "react-router-dom";
import useAsyncRefresh from "./reusable/hooks/useAsyncRefresh";
import { addLog, getModels, getModel, getTagCategories } from "./apis";
import LoadingPage from "./routes/components/LoadingPage";
import { CurrentModelProvider } from "./reusable/hooks/useCurrentModel";
import Navigation from "./Navigation";
import routes from "./routes";
import { useParamsX } from "./reusable/hooks/useUpdateNavigate";
import { CurrentTenantModelsProvider } from "./reusable/hooks/useCurrentTenantModels";
import { CurrentUserAndProfileProvider } from "./reusable/hooks/useCurrentUser";
import useLoadCurrentUser from "./reusable/hooks/useLoadCurrentUser";
import { GetUserFeaturesProvider } from "./reusable/hooks/useGetUserFeatures";
import permissions from "./permissions";
import UnsupportedBrowsers from "./apis/utils/UnsupportedBrowsers";
import { CurrentTenantTagCategoriesProvider } from "./reusable/hooks/useCurrentTenantTagCategories";
import { useEffect, useState } from "react";
import axios from "axios";
import { Model } from "./apis/models";

const Inner = () => {
    const { model_id = "" } = useParamsX();
    const location = useLocation();
    const isHideMenu = location.pathname.includes("/standalone-present");

    const [userLoading, currentUser] = useLoadCurrentUser();

    useEffect(() => {
        if (!currentUser) {
            return;
        }
        // console.log("currentUser", currentUser)
        let userId = "anonymous";
        let userName = "Anonymous";
        if (currentUser.profile) {
            userId = currentUser.profile.uid;
            userName = currentUser.profile?.image_file || currentUser.profile?.email || "";
        }
        let lastAnonymousView = localStorage.getItem(`lastview-${userId}`);
        let lastVisitTime = new Date(Number(lastAnonymousView || 0));
        let now = new Date();
        if (now.getTime() - lastVisitTime.getTime() > 60000 * 60) {
            localStorage.setItem(`lastview-${userId}`, now.getTime().toString());
            addLog(`User ${userName} visited`, `User ${userName} visited`, "visit", userId, null, userId, "user", null);
        }
    }, [currentUser]);

    const { value: models } = useAsyncRefresh(async () => {
        if (userLoading) {
            return undefined;
        }
        // console.log('userLoading', userLoading)
        // console.log('currentUser.profile', currentUser.profile)
        let models: any[] = [];
        try {
            let res = await axios.get(`/.netlify/functions/listModelLite`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                // console.log(res.data)
                models = res.data;
            }
            // Cache only model.id and model.visibility
            const visibilityMap = models.reduce((acc, model) => {
                acc[model.id] = model.visibility;
                return acc;
            }, {});
            localStorage.setItem("modelVisibility", JSON.stringify(visibilityMap));
        } catch (err) {
            console.log(err);
        }
        // const models = await getModels()
        // models.forEach(model => {
        //     console.log(model.name, model.visibility)
        // })
        return models.filter((model) => permissions.MODEL(currentUser.profile, model).canRead());
    }, [userLoading, currentUser.profile]);

    const [tagCategories, setTagCategories] = useState<any[]>([]);

    const fetchCategories = async () => {
        let tags = await getTagCategories();
        // console.log(`fetchCategories`)
        setTagCategories(tags || []);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // const {value: tagCategories} = useAsyncRefresh(async () => {
    //     console.log("getTagCategories")
    //     let from = new Date().getTime()
    //     let tags =  await getTagCategories()
    //     console.log(`Get tags take ${new Date().getTime() - from} ms`)
    //     return tags || []
    // }, [])

    // const currentModel = model_id === "" ? undefined : models.find(model => model.id === model_id)

    const [currentModel, setCurrentModel] = useState<Model | undefined>(undefined);
    const [modelLoading, setModelLoading] = useState<boolean>(false);

    const fetchModel = async (model_id: string) => {
        if (!model_id) {
            setCurrentModel(undefined);
            return;
        }
        setModelLoading(true);
        let from = new Date().getTime();
        const model = await getModel(model_id);
        setCurrentModel(model);
        console.log(`Get Model take ${new Date().getTime() - from} ms`);
        setModelLoading(false);
    };
    useEffect(() => {
        fetchModel(model_id);
    }, [model_id]);

    if (typeof models === "undefined") {
        return <LoadingPage />;
    }

    if (userLoading || modelLoading) {
        return <LoadingPage />;
    }
    const RouteAny = Route as any;

    return (
        <main className="flex flex-col h-full">
            <CurrentUserAndProfileProvider value={currentUser}>
                <GetUserFeaturesProvider currentUser={currentUser.profile}>
                    <CurrentTenantModelsProvider
                        value={models.filter((model) => permissions.MODEL(currentUser.profile, model).canRead())}
                    >
                        <CurrentTenantTagCategoriesProvider value={tagCategories ?? []}>
                            {!isHideMenu && <Navigation model={currentModel} />}
                            <CurrentModelProvider value={currentModel}>
                                <div style={{ height: "calc(100% - 64px)" }}>
                                    {(model_id !== "" && typeof currentModel === "undefined") ||
                                    (currentModel &&
                                        !permissions.MODEL(currentUser.profile, currentModel as Model).canRead()) ? (
                                        <div className="flex flex-col justify-center items-center h-full pb-36 select-none px-12 text-center">
                                            <div className="text-9xl text-gray-400 leading-normal">404</div>
                                            <div className="text-2xl text-gray-400">
                                                Model doesn't exist. Check if you have permissions to view this model.
                                            </div>
                                        </div>
                                    ) : (
                                        <Routes>
                                            {routes.map((route) => (
                                                <RouteAny key={route.path} {...route} />
                                            ))}
                                        </Routes>
                                    )}
                                </div>
                            </CurrentModelProvider>
                        </CurrentTenantTagCategoriesProvider>
                    </CurrentTenantModelsProvider>
                </GetUserFeaturesProvider>
            </CurrentUserAndProfileProvider>
        </main>
    );
};

function App() {
    return (
        <div className="flex flex-col h-full">
            <UnsupportedBrowsers />
            <Inner />
        </div>
    );
}

export default App;
