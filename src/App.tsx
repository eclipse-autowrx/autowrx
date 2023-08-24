import {
    Route,
  Routes,
} from "react-router-dom";
import useAsyncRefresh from "./reusable/hooks/useAsyncRefresh";
import { getModels, getTagCategories } from "./apis";
import LoadingPage from "./routes/components/LoadingPage";
import { CurrentModelProvider } from "./reusable/hooks/useCurrentModel";
import Navigation from "./Navigation";
import routes from "./routes";
import { useParamsX } from "./reusable/hooks/useUpdateNavigate";
import { CurrentTenantModelsProvider } from "./reusable/hooks/useCurrentTenantModels";
import { CurrentUserAndProfileProvider } from "./reusable/hooks/useCurrentUser";
import useLoadCurrentUser from "./reusable/hooks/useLoadCurrentUser";
import permissions from "./permissions";
import UnsupportedBrowsers from "./apis/utils/UnsupportedBrowsers";
import { CurrentTenantTagCategoriesProvider } from "./reusable/hooks/useCurrentTenantTagCategories";

const Inner = () => {
    const {model_id = ""} = useParamsX()

    const [userLoading, currentUser] = useLoadCurrentUser()

    const {value: models} = useAsyncRefresh(async () => {
        if (userLoading) {
            return undefined
        }
        const models = await getModels()
        return models.filter(model => permissions.MODEL(currentUser.profile, model).canRead())
    }, [userLoading, currentUser.profile,])

    const {value: tagCategories} = useAsyncRefresh(async () => {
        return await getTagCategories()
    }, [])

    if (typeof models === "undefined") {
        return <LoadingPage/>
    }

    const currentModel = model_id === "" ? undefined : models.find(model => model.id === model_id)

    if (userLoading) {
        return <LoadingPage/>
    }
    const RouteAny = Route as any

    return (
        <main className="flex flex-col h-full">
            <CurrentUserAndProfileProvider value={currentUser}>
                <Navigation model={currentModel} />
                <CurrentTenantModelsProvider value={models.filter(model => permissions.MODEL(currentUser.profile, model).canRead())}>
                    <CurrentTenantTagCategoriesProvider value={tagCategories ?? []}>
                        <CurrentModelProvider value={currentModel}>
                                <div style={{height: "calc(100% - 64px)"}}>
                                    {model_id !== "" && typeof currentModel === "undefined" ? (
                                        <div className="flex flex-col justify-center items-center h-full pb-36 select-none px-12 text-center">
                                            <div className="text-9xl text-gray-400 leading-normal">404</div>
                                            <div className="text-2xl text-gray-400">Model doesn't exist. Check if you have permissions to view this model.</div>
                                        </div>
                                    ) : (
                                        <Routes>
                                            {routes.map(route => <RouteAny key={route.path} {...route} />)}
                                        </Routes>
                                    )}
                                </div>
                        </CurrentModelProvider>
                    </CurrentTenantTagCategoriesProvider>
                </CurrentTenantModelsProvider>
            </CurrentUserAndProfileProvider>
        </main>
    )
}

function App() {
    return (
        <div className="flex flex-col h-full">
            <UnsupportedBrowsers/>
            <Inner/>
        </div>
    );
}

export default App;
