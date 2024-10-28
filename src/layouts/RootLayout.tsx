import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Link, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import DaBreadcrumbBar from '@/components/molecules/DaBreadcrumbBar'
import { useLocation } from 'react-router-dom'
import config from '@/configs/config'
import routesConfig from '@/configs/routes'
import { RouteConfig } from '@/types/common.type'

const ActiveObjectManagement = lazy(
  () => import('@/components/organisms/ActiveObjectManagement'),
)
const NavigationBar = lazy(() => import('@/components/organisms/NavigationBar'))

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
  const location = useLocation()

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
          <div className="flex h-14 items-center justify-between bg-da-primary-500 px-4 py-2">
            <DaBreadcrumbBar />
          </div>
        )}
      </Suspense>

      <div className="h-full overflow-y-auto">
        <Outlet />
      </div>

      {config && config.instance !== 'digitalauto' && (
        <div className="flex w-full sticky bottom-0 right-0 z-10 bg-da-gray-darkest px-4 py-0.5 text-end text-xs text-da-white">
          {config.showPrivacyPolicy && currentUser && (
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
