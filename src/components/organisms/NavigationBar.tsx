import { useState } from 'react'
import { DaImage } from '../atoms/DaImage'
import { DaButton } from '../atoms/DaButton'
import DaMenu from '../atoms/DaMenu'
import DaNavUser from '../molecules/DaNavUser'
import { Link } from 'react-router-dom'
import { FaCar } from 'react-icons/fa'
import { FiGrid } from 'react-icons/fi'
import { HiMenu } from 'react-icons/hi'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import { TbUsers } from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const NavigationBar = ({}) => {
  const [model] = useModelStore((state) => [state.model as Model])
  const { data: user } = useSelfProfileQuery()

  return (
    <header className="da-nav-bar ">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      </Link>

      <div className="grow"></div>
      {/* Model selection */}
      {model ? (
        <>
          <Link to="/model">
            <DaButton variant="plain">
              <div className="flex items-center">
                <FiGrid style={{ transform: 'scale(1.4)' }} className="" />
              </div>
            </DaButton>
          </Link>
          <Link to={`/model/${model.id}`}>
            <DaButton variant="plain">
              <div className="flex items-center">
                <FaCar style={{ transform: 'scale(1.4)' }} className="mr-3" />
                <div className="truncate max-w-[180px]">
                  {model.name || 'no-name'}
                </div>
              </div>
            </DaButton>
          </Link>
        </>
      ) : (
        <Link to="/model">
          <DaButton variant="plain">
            <div className="flex items-center">
              <FaCar style={{ transform: 'scale(1.5)' }} className="mr-3" />
              Select Model
            </div>
          </DaButton>
        </Link>
      )}

      {user?.role === 'admin' && (
        <DaMenu
          trigger={
            <div className="da-clickable flex h-full items-center px-4 text-da-gray-medium">
              <HiMenu size={22} />
            </div>
          }
        >
          <Link
            to="/manage-users"
            className="flex items-center px-4 py-2 gap-2 da-menu-item"
          >
            <TbUsers className="text-base" /> Manage Users
          </Link>
        </DaMenu>
      )}

      <DaNavUser />
    </header>
  )
}

export { NavigationBar }
