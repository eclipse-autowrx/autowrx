import { Link } from 'react-router-dom'
import { DaImage } from '../atoms/DaImage'
import { DaButton } from '../atoms/DaButton'
import DaMenu from '../atoms/DaMenu'
import DaNavUser from '../molecules/DaNavUser'
import { HiMenu } from 'react-icons/hi'
import { TbUsers, TbZoom, TbStack2 } from 'react-icons/tb'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaGlobalSearch from '../molecules/DaGlobalSearch'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { FaCar } from 'react-icons/fa'
import useCurrentModel from '@/hooks/useCurrentModel'

const NavigationBar = ({}) => {
  const { data: user } = useSelfProfileQuery()
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.MANAGE_USERS])

  return (
    <header className="da-nav-bar">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      </Link>

      <div className="grow"></div>

      {user && (
        <>
          <DaGlobalSearch>
            <DaButton
              variant="outline-nocolor"
              className="w-[250px] flex items-center !justify-start !border-gray-300 shadow-lg"
            >
              <TbZoom className="size-5 mr-2" />
              Search
            </DaButton>
          </DaGlobalSearch>{' '}
          {/* {model ? (
            <Link to={`/model/${model.id}`}>
              <DaButton variant="plain">
                <div className="flex items-center">
                  <FaCar style={{ transform: 'scale(1.4)' }} className="mr-3" />
                  <div className="truncate max-w-[180px]">
                    {model.name || 'Select Model'}
                  </div>
                </div>
              </DaButton>
            </Link>
          ) : (
            <Link to="/model">
              <DaButton variant="plain">
                <div className="flex items-center">
                  <FaCar style={{ transform: 'scale(1.5)' }} className="mr-3" />
                  Select Model
                </div>
              </DaButton>
            </Link>
          )} */}
        </>
      )}

      {isAuthorized && (
        <DaMenu
          trigger={
            <div className="cursor-pointer flex !h-10 items-center da-btn-sm text-da-gray-medium da-btn-plain ml-2">
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
