import { Navigate, RouteObject } from "react-router-dom"
import ModelHome from "./routes/components/core/Model/ModelHome"
import SelectModel from "./routes/components/core/Model/SelectModel"
import ViewInterface from "./routes/components/core/Model/VehicleInterface/ViewInterface"
import DynamicNavigate from "./routes/components/DynamicNavigate"
import EditProfile from "./routes/components/EditProfile"
import TagCategoryList from "./routes/components/Tags/TagCategoryList"
import UserProfilePage from "./routes/components/UserProfilePage"
import Home from "./routes/Home"
import Library from "./routes/Library"
import ManageUsers from "./routes/ManageUsers"
import Media from "./routes/Media"
import ModelPermissions from "./routes/Permissions/ModelPermissions"
import Plugins from "./routes/Plugins"
import ViewPrototype from "./routes/ViewPrototype"

const routes: RouteObject[] = [
    { path:"/", element: <Home /> },
    { path:"/edit-profile", element: <EditProfile /> },
    { path:"/media", element: <Media /> },
    { path:"/manage-users", element: <ManageUsers /> },
    { path:"/model/", element: <SelectModel /> },
    { path:"/model/:model_id", element: <ModelHome /> },
    { path:"/model/:model_id/cvi", element: <DynamicNavigate to="/model/:model_id/cvi/list" /> },
    { path:"/model/:model_id/cvi/list", element: <ViewInterface display="list" /> },
    { path:"/model/:model_id/cvi/list/:node_path", element: <ViewInterface display="list" /> },
    { path:"/model/:model_id/cvi/tree/", element: <ViewInterface display="tree" /> },

    { path:"/model/:model_id/permissions", element: <ModelPermissions /> },

    { path:"/model/:model_id/plugins", element: <Plugins tab="list" /> },
    { path:"/model/:model_id/plugins/plugin/:plugin_id", element: <Plugins tab="list"/> },

    { path:"/model/:model_id/plugins/dashboard", element: <Plugins tab="dashboard" /> },

    { path:"/model/:model_id/library", element: <Library tab="list" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id", element: <Library tab="list" /> },
    
    { path:"/model/:model_id/library/portfolio", element: <Library tab="portfolio" /> },

    { path:"/model/:model_id/library/prototype/:prototype_id/view", element: <Navigate to="journey" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/code", element: <ViewPrototype prototype_tab="code" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/run", element: <ViewPrototype prototype_tab="run" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/cvi/", element: <DynamicNavigate to="/model/:model_id/library/prototype/:prototype_id/view/cvi/list/" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/cvi/list/", element: <ViewPrototype prototype_tab="cvi" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/cvi/list/:node_path", element: <ViewPrototype prototype_tab="cvi" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/cvi/tree/", element: <ViewPrototype prototype_tab="cvi" display="tree" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/cvi/tree/", element: <ViewPrototype prototype_tab="cvi" display="tree" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/feedback", element: <ViewPrototype prototype_tab="feedback" /> },
    { path:"/model/:model_id/library/prototype/:prototype_id/view/journey", element: <ViewPrototype prototype_tab="journey" /> },

    { path:"/user/:user_id", element: <UserProfilePage/> },

    { path:"/tags", element: <TagCategoryList /> },
    { path:"/tags/:tag_category_id/", element: <TagCategoryList /> },
    { path:"/tags/:tag_category_id/:tag_name", element: <TagCategoryList /> },

    { path: "*", element: (
        <div className="flex flex-col justify-center items-center h-full pb-36 select-none">
            <div className="text-9xl text-gray-400 leading-normal">404</div>
            <div className="text-5xl text-gray-400">Nothing found</div>
        </div>
    ) },
]

export default routes