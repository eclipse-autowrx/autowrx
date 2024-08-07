import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'
import { Suspense, lazy } from 'react'
import DaBreadcrumbBar from '@/components/molecules/DaBreadcrumbBar'
import { useLocation } from 'react-router-dom'
import config from '@/configs/config'

const ActiveObjectManagement = lazy(
  () => import('@/components/organisms/ActiveObjectManagement'),
)
const NavigationBar = lazy(() => import('@/components/organisms/NavigationBar'))

const RootLayout = () => {
  const location = useLocation()
  useSelfProfileQuery()
  return (
    <div className="flex flex-col h-screen">
      <Suspense>
        <ActiveObjectManagement />
      </Suspense>
      <Suspense>
        <NavigationBar />
        {location.pathname !== '/' && (
          <div className="flex px-4 py-2 h-14 bg-da-primary-500 justify-between items-center">
            <DaBreadcrumbBar />
          </div>
        )}
      </Suspense>

      <div className="h-full overflow-y-auto ">
        <Outlet />
      </div>

      {config && config.instance !== 'digitalauto' && (
        <div className="absolute w-full bottom-0 right-0 bg-da-gray-dark text-da-white px-4 py-0.5 text-xs text-end z-10">
          <a
            href="https://www.digital.auto/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
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
