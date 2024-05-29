import ActiveObjectManagement from '@/components/organisms/ActiveObjectManagement'
import { NavigationBar } from '@/components/organisms/NavigationBar'
import { SiteFooter } from '@/components/organisms/SiteFooter'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Outlet } from 'react-router-dom'

const RootLayout = () => {
  useSelfProfileQuery()
  return (
    <div className="flex flex-col h-screen">
      <ActiveObjectManagement />
      <NavigationBar />
      <div className="flex flex-col h-full overflow-y-auto">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  )
}

export default RootLayout
