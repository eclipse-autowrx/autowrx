import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Link, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import DaBreadcrumbBar from '@/components/molecules/DaBreadcrumbBar'
import { useLocation } from 'react-router-dom'
import config from '@/configs/config'
import routesConfig from '@/configs/routes'
import { RouteConfig } from '@/types/common.type'
import { retry } from '@/lib/retry'
import useGlobalStore from '@/stores/globalStore'

const ActiveObjectManagement = lazy(() =>
  retry(() => import('@/components/organisms/ActiveObjectManagement')),
)
const NavigationBar = lazy(() =>
  retry(() => import('@/components/organisms/NavigationBar')),
)

const traverse = (
  route: RouteConfig,
  results: Set<string>,
  parentPath?: string,
) => {
  const path = route.path?.startsWith('/')
    ? route.path
    : `${parentPath}${route.path || ''}`
  if (route.noBreadcrumbs) {
    results.add(path)
  }
  if (route.children) {
    route.children.forEach((child) => {
      traverse(child, results, path)
    })
  }
}

const getPathsWithoutBreadcrumb = (routes: RouteConfig[]) => {
  const paths = new Set<string>()
  routes.forEach((route) => traverse(route, paths))
  return paths
}

const RootLayout = () => {
  const [isChatShowed] = useGlobalStore((state) => [state.isChatShowed])
  const location = useLocation()

  // useEffect(() => {
  //   console.log(`isChatShowed`, isChatShowed)
  // }, [isChatShowed])

  const { data: currentUser } = useSelfProfileQuery()

  const pathsWithoutBreadcrumb = useMemo(
    () => getPathsWithoutBreadcrumb(routesConfig),
    [],
  )

  return (
    <div className="flex h-screen flex-col">
      <Suspense>
        <ActiveObjectManagement />
      </Suspense>
      <Suspense>
        <NavigationBar />
        {!pathsWithoutBreadcrumb.has(location.pathname) && (
          <div className="flex items-center justify-between bg-da-primary-500 da-secondary-nav-bar px-4">
            <DaBreadcrumbBar />
          </div>
        )}
      </Suspense>

      { isChatShowed?<>
        <div className="pl-[320px] overflow-y-auto">
          <Outlet />
        </div>
      </>:<>
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      </> 

      }
      

      {config && config.instance !== 'digitalauto' && (
        <div className="flex w-full sticky bottom-0 right-0 z-10 bg-da-gray-darkest px-4 py-0.5 text-end text-xs text-da-white da-footer-bar">
          {config.showPrivacyPolicy && (
            <Link
              to="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex h-fit"
            >
              Privacy Policy
            </Link>
          )}
          <div className="grow" />
          <a
            href="https://www.digital.auto/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex h-fit"
          >
            Powered by digital.auto
          </a>
        </div>
      )}

      <Toaster />
    </div>
  )
}

export default RootLayout
