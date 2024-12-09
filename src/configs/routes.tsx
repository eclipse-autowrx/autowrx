import { lazy } from 'react'
import RootLayout from '@/layouts/RootLayout'
import SuspenseProvider from '@/providers/SuspenseProvider'
import { RouteConfig } from '@/types/common.type'
import PageAuthSuccess from '@/pages/PageAuthSuccess'
import { retry } from '@/lib/retry'

const PageHome = lazy(() => retry(() => import('@/pages/PageHome')))
const PageAbout = lazy(() => retry(() => import('@/pages/PageAbout')))
const PageModelList = lazy(() => retry(() => import('@/pages/PageModelList')))
const ModelDetailLayout = lazy(() =>
  retry(() => import('@/layouts/ModelDetailLayout')),
)
const PageModelDetail = lazy(() =>
  retry(() => import('@/pages/PageModelDetail')),
)
const PageModelArchitecture = lazy(
  () => import('@/pages/PageModelArchitecture'),
)
const PageVehicleApi = lazy(() => retry(() => import('@/pages/PageVehicleApi')))
const PagePrototypeDetail = lazy(() =>
  retry(() => import('@/pages/PagePrototypeDetail')),
)
const PageComponent = lazy(() =>
  retry(() => import('@/pages/test-ui/PageComponent')),
)
const PageMolecules = lazy(() =>
  retry(() => import('@/pages/test-ui/PageMolecules')),
)
const PageOrganisms = lazy(() =>
  retry(() => import('@/pages/test-ui/PageOrganisms')),
)
const PageTestHome = lazy(() =>
  retry(() => import('@/pages/test-ui/PageTestHome')),
)
const PageTestForm = lazy(() =>
  retry(() => import('@/pages/test-ui/PageTestForm')),
)
const PagePrototypeLibrary = lazy(() =>
  retry(() => import('@/pages/PagePrototypeLibrary')),
)
const PageResetPassword = lazy(() =>
  retry(() => import('@/pages/PageResetPassword')),
)
const PageManageUsers = lazy(() =>
  retry(() => import('@/pages/PageManageUsers')),
)
const PageDiscussions = lazy(() =>
  retry(() => import('@/pages/test-ui/PageDiscussions')),
)
const PageUserProfile = lazy(() =>
  retry(() => import('@/pages/PageUserProfile')),
)
const PageMyAssets = lazy(() =>
  retry(() => import('@/pages/PageMyAssets')),
)
const PageManageFeatures = lazy(() =>
  retry(() => import('@/pages/PageManageFeatures')),
)
const PageGenAIWizard = lazy(() =>
  retry(() => import('@/pages/PageGenAIWizard')),
)
const PagePrivacyPolicy = lazy(() =>
  retry(() => import('@/pages/PagePrivacyPolicy')),
)

const routesConfig: RouteConfig[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/',
        noBreadcrumbs: true,
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageHome />
              </SuspenseProvider>
            ),
            noBreadcrumbs: true,
          },
          {
            path: 'manage-users',
            element: (
              <SuspenseProvider>
                <PageManageUsers />
              </SuspenseProvider>
            ),
            noBreadcrumbs: true,
          },
          {
            path: 'manage-features',
            element: (
              <SuspenseProvider>
                <PageManageFeatures />
              </SuspenseProvider>
            ),
            noBreadcrumbs: true,
          },
        ],
      },
      {
        path: '/about',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageAbout />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/reset-password',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageResetPassword />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/model',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageModelList />
              </SuspenseProvider>
            ),
          },
          {
            path: ':model_id',
            element: (
              <SuspenseProvider>
                <ModelDetailLayout />
              </SuspenseProvider>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <PageModelDetail />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'api',
                element: (
                  <SuspenseProvider>
                    <PageVehicleApi />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'api/:api',
                element: (
                  <SuspenseProvider>
                    <PageVehicleApi />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'library',
                element: (
                  <SuspenseProvider>
                    <PagePrototypeLibrary />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'library/:tab',
                element: (
                  <SuspenseProvider>
                    <PagePrototypeLibrary />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'library/:tab/:prototype_id',
                element: (
                  <SuspenseProvider>
                    <PagePrototypeLibrary />
                  </SuspenseProvider>
                ),
              },

              {
                path: 'architecture',
                element: (
                  <SuspenseProvider>
                    <PageModelArchitecture />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: ':model_id/library/prototype/:prototype_id',
            element: (
              <SuspenseProvider>
                <PagePrototypeDetail />
              </SuspenseProvider>
            ),
          },
          {
            path: ':model_id/library/prototype/:prototype_id/:tab',
            element: (
              <SuspenseProvider>
                <PagePrototypeDetail />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/profile',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageUserProfile />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/my-assets',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageMyAssets />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/genai-wizard',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageGenAIWizard />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/privacy-policy',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PagePrivacyPolicy />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/auth/:provider/success',
        element: <PageAuthSuccess />,
      },
      {
        path: '/test-ui/forms',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageTestForm />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/test-ui/home',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageTestHome />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/test-ui/components',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageComponent />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/test-ui/molecules',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageMolecules />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/test-ui/organisms',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageOrganisms />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/test-ui/discussion',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageDiscussions />
              </SuspenseProvider>
            ),
          },
        ],
      },
    ],
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
