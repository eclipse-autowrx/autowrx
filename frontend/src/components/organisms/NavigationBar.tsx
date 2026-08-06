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
  TbFileCode,
} from 'react-icons/tb'
import usePermissionHook from '@/hooks/usePermissionHook.ts'
import { PERMISSIONS } from '@/const/permission.ts'
import DaGlobalSearch from '../molecules/DaGlobalSearch'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
// import useCurrentModel from '@/hooks/useCurrentModel'
import { IoIosHelpBuoy } from 'react-icons/io'
import config from '@/configs/config'
import LearningIntegration from './LearningIntegration'

import { useState, useEffect, useMemo } from 'react'

// import useLastAccessedModel from '@/hooks/useLastAccessedModel'
import { useSiteConfig } from '@/utils/siteConfig'
import { Button } from '../atoms/button'
import { Wrench } from 'lucide-react'
import DOMPurify from 'dompurify'
import useAuthStore from '@/stores/authStore'
import {
  partitionNavBarActions,
  getNavBarActionOpenTarget,
  type NavBarAction,
} from '@/components/molecules/NavBarActionsEditor'

const SimpleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <button
    type="button"
    className={`${checked ? 'bg-blue-600' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
  >
    <span
      aria-hidden="true"
      className={`${checked ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
    />
  </button>
)

const NavigationBar = ({ }) => {
  const { data: user, isLoading, isFetching } = useSelfProfileQuery()
  const authBootstrapped = useAuthStore((state) => state.authBootstrapped)
  const isResolvingAuth = !authBootstrapped || (!user && (isLoading || isFetching))
  // const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.MANAGE_USERS])
  const [learningMode, setIsLearningMode] = useState(false)
  const siteTitle = useSiteConfig('SITE_TITLE', 'AutoWRX')
  const logoUrl = useSiteConfig('SITE_LOGO_WIDE', '/imgs/logo-wide.png')
  const enableLearningMode = useSiteConfig('ENABLE_LEARNING_MODE', false)
  const navBarActions = useSiteConfig('NAV_BAR_ACTIONS', [])
  const { left: leftNavBarActions, right: rightNavBarActions } = useMemo(
    () => partitionNavBarActions(Array.isArray(navBarActions) ? navBarActions : []),
    [navBarActions],
  )
  const allowNonAdminAddonConfig = useSiteConfig(
    'ALLOW_NON_ADMIN_ADDON_CONFIG',
    true,
  )
  const toolsMenuItems = useMemo(() => {
    if (isAuthorized) {
      return [
        { to: '/manage-users', icon: TbUsers, label: 'Manage Users' },
        { to: '/manage-features', icon: TbStack2, label: 'Manage Features' },
        { to: '/admin/site-config', icon: TbSettings, label: 'Site Config' },
        { to: '/admin/plugins', icon: TbApps, label: 'Plugins' },
        { to: '/admin/templates', icon: TbPalette, label: 'Model Templates' },
        { to: '/admin/dashboard-templates', icon: TbBuildingWarehouse, label: 'Dashboard Templates' },
        { to: '/admin/project-templates', icon: TbFileCode, label: 'Prototype Templates' },
      ]
    }
    if (allowNonAdminAddonConfig) {
      return [{ to: '/me/plugins', icon: TbApps, label: 'Plugins' }]
    }
    return []
  }, [isAuthorized, allowNonAdminAddonConfig])

  useEffect(() => {
    if (siteTitle) {
      document.title = siteTitle
    }
  }, [siteTitle])

  // const { lastAccessedModel } = useLastAccessedModel()

  const renderNavBarAction = (action: NavBarAction, index: number) => {
    const actionType = action.type || 'link'

    if (actionType === 'search') {
      return (
        <DaGlobalSearch
          key={index}
          trigger={
            <button
              type="button"
              className="da-primary-nav-action h-9 w-9 flex items-center justify-center cursor-pointer rounded-md transition-colors hover:bg-muted dark:hover:bg-muted/50"
              title={action.placeholder || action.label || 'Search'}
            >
              {action.icon ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(action.icon, {
                      USE_PROFILES: { svg: true, svgFilters: true }
                    })
                  }}
                  className="size-5 flex items-center justify-center"
                />
              ) : (
                <TbZoom className="size-5" />
              )}
            </button>
          }
        />
      )
    }

    const openTarget = getNavBarActionOpenTarget(action)

    return (
      <a
        key={index}
        href={action.url}
        target={openTarget}
        {...(openTarget === '_blank' ? { rel: 'noopener noreferrer' } : {})}
        className="da-primary-nav-action flex items-center gap-0 px-1 py-1 rounded-md text-sm font-medium transition-colors hover:bg-muted dark:hover:bg-muted/50"
        title={action.label}
      >
        {action.icon && (
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(action.icon, {
                USE_PROFILES: { svg: true, svgFilters: true }
              })
            }}
            className="w-6 h-6 flex items-center justify-center"
          />
        )}
        {action.label && <span className="ml-1">{action.label}</span>}
      </a>
    )
  }

  return (
    <header className="da-primary-nav-bar flex items-center w-full py-1.5 px-4 bg-background border-2">
      <Link to="/" className="shrink-0">
        <img
          src={logoUrl}
          alt="Logo"
          className="da-primary-nav-logo"
          style={{ height: '28px' }}
        />
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

      {leftNavBarActions.length > 0 && (
        <div className="ml-4 flex items-center gap-2 shrink-0">
          {leftNavBarActions.map(renderNavBarAction)}
        </div>
      )}

      <div className="flex-1 min-w-0"></div>

      {enableLearningMode && (
        <div className="mr-6 cursor-pointer flex items-center">
          <span className="mr-2 text-sm font-medium">Learning</span>
          <SimpleSwitch
            checked={learningMode}
            onChange={(v) => {
              if (v && (!user || isResolvingAuth)) {
                alert('Please Sign in to use learning mode')
                return
              }
              setIsLearningMode(v)
            }}
          />
        </div>
      )}

      {rightNavBarActions.length > 0 && (
        <div className="mr-2 flex items-center gap-2">
          {rightNavBarActions.map(renderNavBarAction)}
        </div>
      )}

      {/* {config && config.enableSupport && (
        <Link to="https://forms.office.com/e/P5gv3U3dzA">
          <div className="h-full flex text-gray-500 font-medium text-base items-center text-skye-600 mr-4 hover:underline">
            <IoIosHelpBuoy className="mr-1" size={22} />
            Support
          </div>
        </Link>
      )} */}

      {!isResolvingAuth && user && (
        <div className="flex items-center shrink-0">
          {toolsMenuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="da-primary-nav-action"
                >
                  <Wrench />
                  {isAuthorized ? 'Admin Tools' : 'Tools'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 text-sm font-medium"
              >
                {toolsMenuItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link
                      to={item.to}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <item.icon className="text-base" /> {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
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

      {learningMode && <LearningIntegration requestClose={() => setIsLearningMode(false)} />}
      {(isResolvingAuth || !user) && <div className="shrink-0"><DaNavUser /></div>}
    </header>
  )
}

export { NavigationBar }
export default NavigationBar
