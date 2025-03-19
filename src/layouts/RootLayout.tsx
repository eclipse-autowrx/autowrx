import { Link, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import DaBreadcrumbBar from '@/components/molecules/DaBreadcrumbBar'
import { useLocation } from 'react-router-dom'
import config from '@/configs/config'
import routesConfig from '@/configs/routes'
import { RouteConfig } from '@/types/common.type'
import { retry } from '@/lib/retry'
import { toast } from 'react-toastify'
import { DaButton } from '@/components/atoms/DaButton'
import useAuthStore from '@/stores/authStore'

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

const SessionTimeoutToast = () => {
  return (
    <div className="p-2">
      <p className="text-sm text-da-gray-dark">
        Your session has expired. <br /> Please refresh the page to continue
        where you left off.
      </p>
      <DaButton
        onClick={() => (window.location.href = window.location.href)}
        className="mt-2"
        size="sm"
        variant="outline-nocolor"
      >
        Refresh
      </DaButton>
    </div>
  )
}

const RootLayout = () => {
  const location = useLocation()

  const expires = useAuthStore((state) => state.access?.expires)

  const pathsWithoutBreadcrumb = useMemo(
    () => getPathsWithoutBreadcrumb(routesConfig),
    [],
  )

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null
    if (expires) {
      try {
        const timeRemaining = new Date(expires).getTime() - Date.now()
        timeout = setTimeout(() => {
          toast.warn(<SessionTimeoutToast />, {
            className: 'w-[440px] max-w-[90vw] -ml-[64px]',
            autoClose: false,
            draggable: false,
            closeOnClick: false,
            theme: 'colored',
          })
        }, timeRemaining)
      } catch (error) {
        console.error('Error setting session timeout toast', error)
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = null
    }
  }, [expires])

  return (
    <div className="flex h-screen flex-col">
      <Suspense>
        <ActiveObjectManagement />
      </Suspense>
      <Suspense>
        <NavigationBar />
        {!pathsWithoutBreadcrumb.has(location.pathname) && (
          <div className="flex items-center justify-between bg-da-primary-500 px-4">
            <DaBreadcrumbBar />
          </div>
        )}
      </Suspense>

      <div className="h-full overflow-y-auto">
        <Outlet />
      </div>

      {config && config.instance !== 'digitalauto' && (
        <div className="flex w-full sticky bottom-0 right-0 z-10 bg-da-gray-darkest px-4 py-0.5 text-end text-xs text-da-white">
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
