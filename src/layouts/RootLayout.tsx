import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'
import { Suspense, lazy } from 'react'
import DaBreadcrumbBar from '@/components/molecules/DaBreadcrumbBar'
import { useLocation } from 'react-router-dom'

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
            <div className="flex space-x-2 w-1/2 justify-end">
              {/* <DaPopup
              trigger={
                <DaButton
                  variant="plain"
                  className="!text-da-white !bg-transparent hover:opacity-75"
                  size="sm"
                >
                  <TbMessage className="w-5 h-5 mr-2" />
                  Discussion
                </DaButton>
              }
            >
              <DaDiscussions refId={prototype.id} refType="prototype" />
            </DaPopup> */}
            </div>
          </div>
        )}
      </Suspense>

      <div className="h-full overflow-y-auto ">
        <Outlet />
      </div>

      <Toaster />
    </div>
  )
}

export default RootLayout
