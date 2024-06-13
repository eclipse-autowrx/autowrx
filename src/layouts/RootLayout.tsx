import ActiveObjectManagement from '@/components/organisms/ActiveObjectManagement'
import { NavigationBar } from '@/components/organisms/NavigationBar'
import { SiteFooter } from '@/components/organisms/SiteFooter'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'

const RootLayout = () => {
  useSelfProfileQuery()
  return (
    <div className="flex flex-col h-screen">
      <ActiveObjectManagement />
      <NavigationBar />
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
