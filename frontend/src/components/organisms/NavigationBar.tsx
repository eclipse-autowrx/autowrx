// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Link, useMatch } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../atoms/dropdown-menu'
import DaNavUser from '../molecules/DaNavUser'
import { HiMenu } from 'react-icons/hi'
import {
  TbUsers,
  TbZoom,
  TbStack2,
  TbBuildingWarehouse,
  TbCar,
  TbSettings,
  TbMenu2,
  TbPalette,
  TbApps,
} from 'react-icons/tb'
import usePermissionHook from '@/hooks/usePermissionHook.ts'
import { PERMISSIONS } from '@/const/permission.ts'
// import DaGlobalSearch from '../molecules/DaGlobalSearch'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
// import useCurrentModel from '@/hooks/useCurrentModel'
import { IoIosHelpBuoy } from 'react-icons/io'
import config from '@/configs/config'
// import LearningIntegration from './LearningIntegration'

import { useState, useEffect } from 'react'

// import useLastAccessedModel from '@/hooks/useLastAccessedModel'
import { useSiteConfig } from '@/utils/siteConfig'
import { Button } from '../atoms/button'

const NavigationBar = ({}) => {
  const { data: user } = useSelfProfileQuery()
  // const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.MANAGE_USERS])
  const [learningMode, setIsLearningMode] = useState(false)
  const siteTitle = useSiteConfig('SITE_TITLE', 'AutoWRX')
  const logoUrl = useSiteConfig('SITE_LOGO_WIDE', '/imgs/logo-wide.png')

  useEffect(() => {
    if (siteTitle) {
      document.title = siteTitle
    }
  }, [siteTitle])

  // const { lastAccessedModel } = useLastAccessedModel()

  return (
    <header className="flex items-center w-full py-1 px-3 border-2">
      <Link to="/" className="shrink-0">
        <img src={logoUrl} alt="Logo" className="h-7" />
      </Link>

      {config && config.enableBranding && (
        <div className="ml-4 text-sm text-white/90 shrink-0">
          <a
            href="https://digital.auto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white no-underline"
          >
            digital.auto
          </a>
        </div>
      )}

      <div className="flex-1 min-w-0"></div>

      {/* {config && config.learning && config.learning.url && (
        <div className="mr-6 cursor-pointer flex items-center">
          <span className="mr-1 text-base font-normal">Learning</span>{' '}
          <Switch
            onChange={(v) => {
              if (v) {
                if (!user) {
                  alert('Please Sign in to use learning mode')
                  return
                }
              }
              setIsLearningMode(v)
            }}
            checked={learningMode}
            width={40}
            borderRadius={30}
            height={20}
          />
        </div>
      )} */}

      {/* {config && config.enableSupport && (
        <Link to="https://forms.office.com/e/P5gv3U3dzA">
          <div className="h-full flex text-gray-500 font-medium text-base items-center text-skye-600 mr-4 hover:underline">
            <IoIosHelpBuoy className="mr-1" size={22} />
            Support
          </div>
        </Link>
      )} */}

      {user && (
        <div className="flex items-center shrink-0">
          {/* <DaGlobalSearch>
            <DaButton
              variant="outline-nocolor"
              className="w-[140px] flex items-center justify-start! border-gray-300! shadow-lg"
            >
              <TbZoom className="size-5 mr-2" />
              Search
            </DaButton>
          </DaGlobalSearch>{' '} */}
          {isAuthorized && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-10">
                  <TbMenu2 className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-42 text-sm font-medium"
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/manage-users"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TbUsers className="text-base" /> Manage Users
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/manage-features"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TbStack2 className="text-base" /> Manage Features
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/admin/site-config"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TbSettings className="text-base" /> Site Config
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/admin/plugins"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TbApps className="text-base" /> Plugins
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/admin/templates"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TbPalette className="text-base" /> Templates
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
          <DaNavUser />
        </div>
      )}

      {/* {learningMode && <LearningIntegration requestClose={() => setIsLearningMode(false)} />} */}
      {!user && <div className="shrink-0"><DaNavUser /></div>}
    </header>
  )
}

export { NavigationBar }
export default NavigationBar
