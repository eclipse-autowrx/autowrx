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
    <div className="flex flex-col h-screen relative">
      <Suspense>
        <ActiveObjectManagement />
      </Suspense>
      <Suspense>
        <NavigationBar />
      </Suspense>
      {/* "grid grid-cols-12 auto-cols-max" */}
      <div className=" h-full overflow-y-auto ">
        <Outlet />
      </div>
      {/* <SiteFooter /> */}
      <div className="absolute w-full bottom-0 right-0 bg-da-gray-dark text-da-white px-4 py-0.5 text-xs text-end">
        <a href="https://www.digital.auto/" target="_blank" rel="noreferrer">
          Powered by digital.auto
        </a>
      </div>
      <Toaster />
    </div>
  )
}

export default RootLayout
