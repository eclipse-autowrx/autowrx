import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'
import { Suspense, lazy } from 'react'

const ActiveObjectManagement = lazy(
  () => import('@/components/organisms/ActiveObjectManagement'),
)
const NavigationBar = lazy(() => import('@/components/organisms/NavigationBar'))

const RootLayout = () => {
  useSelfProfileQuery()
  return (
    <div className="flex flex-col h-screen">
      <Suspense>
        <ActiveObjectManagement />
      </Suspense>
      <Suspense>
        <NavigationBar />
      </Suspense>
      {/* "grid grid-cols-12 auto-cols-max" */}
      <div className="h-full overflow-y-auto ">
        <Outlet />
      </div>
      {/* <SiteFooter /> */}
      <Toaster />
    </div>
  )
}

export default RootLayout
