// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Link, useMatch } from 'react-router-dom'
import { DaImage } from '../atoms/DaImage'
import { DaButton } from '../atoms/DaButton'
import DaMenu from '../atoms/DaMenu'
import DaNavUser from '../molecules/DaNavUser'
import { HiMenu } from 'react-icons/hi'
import {
  TbUsers,
  TbZoom,
  TbStack2,
  TbBuildingWarehouse,
  TbCar,
} from 'react-icons/tb'
import usePermissionHook from '@/hooks/usePermissionHook.ts'
import { PERMISSIONS } from '@/const/permission.ts'
// import DaGlobalSearch from '../molecules/DaGlobalSearch'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
// import useCurrentModel from '@/hooks/useCurrentModel'
import { IoIosHelpBuoy } from 'react-icons/io'
import config from '@/configs/config'
import DaTooltip from '../atoms/DaTooltip'
// import LearningIntegration from './LearningIntegration'

import Switch from 'react-switch'
import { useState, useEffect, useRef, Fragment } from 'react'

// import useLastAccessedModel from '@/hooks/useLastAccessedModel'
import { FaCar } from 'react-icons/fa'

const NavigationBar = ({}) => {

  const { data: user } = useSelfProfileQuery()
  // const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook(
    [PERMISSIONS.MANAGE_USERS]
  )
  const [learningMode, setIsLearningMode] = useState(false)

  // const { lastAccessedModel } = useLastAccessedModel()

  return (
    <header className="da-nav-bar">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      </Link>
      
      {config && config.enableBranding && (
        <div className="ml-4 text-sm text-white/90">
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

      <div className="grow"></div>

      {/* {config && config.learning && config.learning.url && (
        <div className="mr-6 cursor-pointer flex items-center">
          <span className="mr-1 da-txt-regular font-normal">Learning</span>{' '}
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
          <div className="h-full flex text-gray-500 font-medium da-txt-medium items-center text-skye-600 mr-4 hover:underline">
            <IoIosHelpBuoy className="mr-1" size={22} />
            Support
          </div>
        </Link>
      )} */}

      {user && (
        <>
          {/* <DaGlobalSearch>
            <DaButton
              variant="outline-nocolor"
              className="w-[140px] flex items-center !justify-start !border-gray-300 shadow-lg"
            >
              <TbZoom className="size-5 mr-2" />
              Search
            </DaButton>
          </DaGlobalSearch>{' '} */}
          {isAuthorized && (
            <DaMenu
              trigger={
                <div className="cursor-pointer flex !h-10 items-center da-btn-sm text-da-gray-medium da-btn-plain ml-2">
                  <HiMenu size={22} />
                </div>
              }
            >
              {/* Separate condition checking with component since MUI component does not accept Fragment as children */}
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

      {/* {learningMode && <LearningIntegration requestClose={() => setIsLearningMode(false)} />} */}
      <DaNavUser />
    </header>
  )
}

export { NavigationBar }
export default NavigationBar
