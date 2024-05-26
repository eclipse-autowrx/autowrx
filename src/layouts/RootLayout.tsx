import ActiveObjectManagement from '@/components/organisms/ActiveObjectManagement'
import { NavigationBar } from '@/components/organisms/NavigationBar'
import { SiteFooter } from '@/components/organisms/SiteFooter'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Outlet } from 'react-router-dom'

const RootLayout = () => {
    useSelfProfileQuery()
    return <div>
            <ActiveObjectManagement/>
            <NavigationBar/>
            <div className="w-full h-full min-h-[90vh] bg-white"><Outlet /></div>
            <SiteFooter/>
        </div>
}

export default RootLayout
