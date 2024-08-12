import { useLocation, Link } from 'react-router-dom'
import { DaImage } from '../atoms/DaImage'
import { DaButton } from '../atoms/DaButton'
import DaMenu from '../atoms/DaMenu'
import DaNavUser from '../molecules/DaNavUser'
import { FaCar } from 'react-icons/fa'
import { FiGrid } from 'react-icons/fi'
import { HiMenu } from 'react-icons/hi'
import { TbUsers, TbZoom, TbStack2 } from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { VscListTree } from 'react-icons/vsc'
import { ImBooks } from 'react-icons/im'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaGlobalSearch from '../molecules/DaGlobalSearch'

const NavigationBar = ({}) => {
  const { data: model } = useCurrentModel()
  const { data: user } = useSelfProfileQuery()
  const location = useLocation()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.MANAGE_USERS])

  const getClassNames = (
    exactPath?: string,
    lastSegment?: string,
    exceptionPath?: string,
  ) => {
    const segments = location.pathname.split('/')
    const lastPathSegment = segments[segments.length - 1]
    const pathIncludesException = location.pathname.includes(
      exceptionPath || '',
    )
    if (exceptionPath && pathIncludesException) {
      return '!text-da-primary-500'
    }
    if (lastSegment) {
      return lastPathSegment === lastSegment ? '!text-da-primary-500' : ''
    }
    if (exactPath) {
      return location.pathname === exactPath ? '!text-da-primary-500' : ''
    }

    return ''
  }

  return (
    <header className="da-nav-bar">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      </Link>

      <div className="grow"></div>

      {user && (
        <DaGlobalSearch>
          <DaButton variant="outline-nocolor" className="!pr-24 mr-2">
            <TbZoom className="w-4 h-4 mr-1" />
            Search
          </DaButton>
        </DaGlobalSearch>
      )}

      {isAuthorized && (
        <DaMenu
          trigger={
            <div className="cursor-pointer flex !h-10 items-center !mx-2 da-btn-sm text-da-gray-medium da-btn-plain">
              <HiMenu size={22} />
            </div>
          }
        >
          <Link
            to="/manage-users"
            className="flex items-center px-4 py-2 gap-2 da-menu-item da-label-regular"
          >
            <TbUsers className="text-base" /> Manage Users
          </Link>
          <Link
            to="/manage-features"
            className="flex items-center px-4 py-2 gap-2 da-menu-item da-label-regular"
          >
            <TbStack2 className="text-base" /> Manage Features
          </Link>
        </DaMenu>
      )}

      <DaNavUser />
    </header>
  )
}

export { NavigationBar }
export default NavigationBar
