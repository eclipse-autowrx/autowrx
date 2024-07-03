import { RouteObject } from 'react-router-dom'
import RootLayout from '@/layouts/RootLayout'
import PageHome from '@/pages/PageHome'
import PageAbout from '@/pages/PageAbout'
import PageLogin from '@/pages/PageLogin'
import PageModelList from '@/pages/PageModelList'
import PageModelDetail from '@/pages/PageModelDetail'
import PageModelArchitecture from '@/pages/PageModelArchitecture'
import PageVehicleApi from '@/pages/PageVehicleApi'
import PagePrototypeDetail from '@/pages/PagePrototypeDetail'

// test-ui
import PageComponent from '@/pages/test-ui/PageComponent'
import PageMolecules from '@/pages/test-ui/PageMolecules'
import PageOrganisms from '@/pages/test-ui/PageOrganisms'
import PageTestHome from '@/pages/test-ui/PageTestHome'
import PageTestForm from '@/pages/test-ui/PageTestForm'
import PagePrototypeLibrary from '@/pages/PagePrototypeLibrary'
import PageResetPassword from '@/pages/PageResetPassword'
import PageManageUsers from '@/pages/PageManageUsers'
import PageDiscussions from '@/pages/test-ui/PageDiscussions'
import PageUserProfile from '@/pages/PageUserProfile'
import { Suspense, lazy } from 'react'

const PageAuthSuccess = lazy(() => import('@/pages/PageAuthSuccess'))

const routesConfig: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <PageHome /> },
      { path: 'manage-users', element: <PageManageUsers /> },
    ],
  },
  {
    path: '/about',
    element: <RootLayout />,
    children: [{ index: true, element: <PageAbout /> }],
  },
  {
    path: '/reset-password',
    element: <RootLayout />,
    children: [{ index: true, element: <PageResetPassword /> }],
  },
  {
    path: '/model',
    element: <RootLayout />,
    children: [
      { index: true, element: <PageModelList /> },
      { path: ':model_id', element: <PageModelDetail /> },
      { path: ':model_id/api', element: <PageVehicleApi /> },
      { path: ':model_id/api/:api', element: <PageVehicleApi /> },
      { path: ':model_id/library', element: <PagePrototypeLibrary /> },
      { path: ':model_id/library/:tab', element: <PagePrototypeLibrary /> },
      {
        path: ':model_id/library/:tab/:prototype_id',
        element: <PagePrototypeLibrary />,
      },
      { path: ':model_id/architecture', element: <PageModelArchitecture /> },
      {
        path: ':model_id/library/prototype/:prototype_id',
        element: <PagePrototypeDetail />,
      },
      {
        path: ':model_id/library/prototype/:prototype_id/:tab',
        element: <PagePrototypeDetail />,
      },
    ],
  },
  {
    path: '/profile',
    element: <RootLayout />,
    children: [{ index: true, element: <PageUserProfile /> }],
  },
  {
    path: '/test-ui/forms',
    element: <RootLayout />,
    children: [{ index: true, element: <PageTestForm /> }],
  },
  {
    path: '/test-ui/home',
    element: <RootLayout />,
    children: [{ index: true, element: <PageTestHome /> }],
  },
  {
    path: '/test-ui/components',
    element: <PageComponent />,
    children: [{ index: true, element: <PageComponent /> }],
  },
  {
    path: '/test-ui/molecules',
    element: <PageMolecules />,
    children: [{ index: true, element: <PageMolecules /> }],
  },
  {
    path: '/test-ui/organisms',
    element: <PageOrganisms />,
    children: [{ index: true, element: <PageOrganisms /> }],
  },
  {
    path: '/test-ui/discussion',
    element: <RootLayout />,
    children: [{ index: true, element: <PageDiscussions /> }],
  },
  {
    path: '/auth/github/success',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <PageAuthSuccess />
      </Suspense>
    ),
  },
]

export default routesConfig

// v1 route
// const routes: RouteObject[] = [
//   { path: "/", element: <Home /> },
//   { path: "/account-verification-success", element: <AccountVerifySuccessPage /> },
//   { path: "/edit-profile", element: <EditProfile /> },
//   { path: "/media", element: <Media /> },
//   { path: "/manage-users", element: <ManageUsers /> },
//   { path: "/manage-features", element: <ManageFeatures /> },
//   { path: "/dashboard", element: <Dashboard /> },
//   { path: "/system-logs", element: <SystemLogs /> },
//   { path: "/use-metrix", element: <UseMetrix /> },
//   { path: "/issues", element: <Report /> },
//   { path: "/issues/:issue_id", element: <Report /> },
//   { path: "/model/", element: <SelectModel /> },
//   { path: "/model/:model_id", element: <ModelHome /> },
//   { path: "/model/:model_id/cvi", element: <DynamicNavigate to="/model/:model_id/cvi/list" /> },
//   { path: "/model/:model_id/cvi/list", element: <ViewInterface display="list" /> },
//   { path: "/model/:model_id/cvi/list/:node_path", element: <ViewInterface display="list" /> },
//   { path: "/model/:model_id/cvi/tree/", element: <ViewInterface display="tree" /> },
//   { path: "/model/:model_id/cvi/api-mapping", element: <ViewInterface display="api-mapping" /> },
//   { path: "/model/:model_id/cvi/api-mapping/:node_path", element: <ViewInterface display="api-mapping" /> },
//   { path: "/model/:model_id/architect", element: <ModelSkeletonPage /> },
//   { path: "/model/:model_id/add-ons", element: <ModelAddOns /> },

//   { path: "/model/:model_id/permissions", element: <ModelPermissions /> },

//   { path: "/model/:model_id/plugins", element: <Plugins tab="list" /> },
//   { path: "/model/:model_id/plugins/plugin/:plugin_id", element: <Plugins tab="list" /> },

//   { path: "/model/:model_id/plugins/dashboard", element: <Plugins tab="dashboard" /> },

//   { path: "/model/:model_id/library", element: <Library tab="list" /> },
//   { path: "/model/:model_id/library/prototype/:prototype_id", element: <Library tab="list" /> },

//   { path: "/model/:model_id/library/portfolio", element: <Library tab="portfolio" /> },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view",
//       // element: <Navigate to="journey" />
//       element: <ViewPrototype prototype_tab="journey" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/code",
//       element: <ViewPrototype prototype_tab="code" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/run",
//       element: <ViewPrototype prototype_tab="run" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/standalone-present",
//       element: <ViewPrototype prototype_tab="run" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/flow",
//       element: <ViewPrototype prototype_tab="flow" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/cvi/",
//       element: <DynamicNavigate to="/model/:model_id/library/prototype/:prototype_id/view/cvi/list/" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/cvi/list/",
//       element: <ViewPrototype prototype_tab="cvi" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/cvi/list/:node_path",
//       element: <ViewPrototype prototype_tab="cvi" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/cvi/tree/",
//       element: <ViewPrototype prototype_tab="cvi" display="tree" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/discussion",
//       element: <ViewPrototype prototype_tab="discussion" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/feedback",
//       element: <ViewPrototype prototype_tab="feedback" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/journey",
//       element: <ViewPrototype prototype_tab="journey" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/architecture",
//       element: <ViewPrototype prototype_tab="architecture" />,
//   },
//   {
//       path: "/model/:model_id/library/prototype/:prototype_id/view/homologation",
//       element: <ViewPrototype prototype_tab="homologation" />,
//   },

//   { path: "/user/:user_id", element: <UserProfilePage /> },

//   { path: "/tags", element: <TagCategoryList /> },
//   { path: "/tags/:tag_category_id/", element: <TagCategoryList /> },
//   { path: "/tags/:tag_category_id/:tag_name", element: <TagCategoryList /> },

//   { path: "/runtime-manager", element: <KitManager /> },
//   {
//       path: "*",
//       element: (
//           <div className="flex flex-col justify-center items-center h-full pb-36 select-none">
//               <div className="text-9xl text-gray-400 leading-normal">404</div>
//               <div className="text-5xl text-gray-400">Nothing found</div>
//           </div>
//       ),
//   },
// ];
