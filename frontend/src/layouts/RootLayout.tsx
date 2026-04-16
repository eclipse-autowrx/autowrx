// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Link, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/molecules/toaster/toaster'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import DaBreadcrumbBar from '@/components/molecules/DaBreadcrumbBar'
import { useLocation } from 'react-router-dom'
import config from '@/configs/config'
import routesConfig from '@/configs/routes'
import { RouteConfig } from '@/types/common.type.ts'
import useGlobalStore from '@/stores/globalStore.ts'
import ActiveObjectManagement from '@/components/organisms/ActiveObjectManagement.tsx'
import packageInfo from '@/../package.json'
import axios from 'axios'
import useAuthStore from '@/stores/authStore.ts'

// const ActiveObjectManagement = lazy(() =>
//   retry(() => import('@/components/organisms/ActiveObjectManagement')),
// )
// const NavigationBar = lazy(() =>
//   retry(() => import('@/components/organisms/NavigationBar.tsx')),
// )
import { NavigationBar } from '@/components/organisms/NavigationBar.tsx'
import { useSiteConfig } from '@/utils/siteConfig'

const traverse = (
  route: RouteConfig,
  results: Set<string>,
  parentPath?: string,
) => {
  const path = route.path?.startsWith('/')
    ? route.path
    : `${parentPath}${route.path || ''}`
  if (route.noBreadcrumbs) {
    results.add(path)
  }
  if (route.children) {
    route.children.forEach((child) => {
      traverse(child, results, path)
    })
  }
}

const getPathsWithoutBreadcrumb = (routes: RouteConfig[]) => {
  const paths = new Set<string>()
  routes.forEach((route) => traverse(route, paths))
  return paths
}

const RootLayout = () => {
  const [isChatShowed] = useGlobalStore((state) => [state.isChatShowed])
  const location = useLocation()

  // useEffect(() => {
  //   console.log(`isChatShowed`, isChatShowed)
  // }, [isChatShowed])

  const bootstrappingRef = useRef(false)
  const [authBootstrapped, setAuthBootstrapped, setAccess] = useAuthStore((state) => [
    state.authBootstrapped,
    state.setAuthBootstrapped,
    state.setAccess,
  ])

  useEffect(() => {
    if (authBootstrapped || bootstrappingRef.current) {
      return
    }

    bootstrappingRef.current = true

    const refreshAxios = axios.create({
      baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
      withCredentials: true,
    })

    refreshAxios
      .post('/auth/refresh-tokens', {})
      .then((res) => {
        const access = res?.data?.access
        if (access?.token) {
          setAccess(access)
        }
      })
      .catch(() => {
        // No refresh cookie or refresh rejected; treat as signed out.
      })
      .finally(() => {
        setAuthBootstrapped(true)
        bootstrappingRef.current = false
      })
  }, [authBootstrapped, setAccess, setAuthBootstrapped])
  const gradientHeader = useSiteConfig('GRADIENT_HEADER', false)
  const privacyPolicyUrl = useSiteConfig('PRIVACY_POLICY_URL', '')

  const pathsWithoutBreadcrumb = useMemo(
    () => getPathsWithoutBreadcrumb(routesConfig),
    [],
  )

  return <>

    <div className={`flex h-screen flex-col ${isChatShowed && 'pr-[430px]'}`}>
      <Suspense>
        <ActiveObjectManagement />
      </Suspense>
      <Suspense>
        <NavigationBar />
        {!pathsWithoutBreadcrumb.has(location.pathname) && (
          <div
            className="flex items-center justify-between bg-primary h-[52px] px-4 da-secondary-nav-bar"
            style={gradientHeader ? {
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
              color: 'var(--primary-foreground)',
            } : undefined}
          >
            <DaBreadcrumbBar />
          </div>
        )}
      </Suspense>

      <div className="h-full overflow-y-auto">
        <Outlet />
      </div>

      {config && config.instance !== 'digitalauto' && (
        <div className="flex w-full justify-center sticky bottom-0 right-0 z-10 bg-gray-100 px-4 py-1 text-xs border-t gap-5">
          <a
            href="https://www.digital.auto/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex h-fit"
          >
            Powered by digital.auto
          </a>
          {privacyPolicyUrl && (
            <Link
              to={privacyPolicyUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex h-fit"
            >
              Privacy Policy
            </Link>
          )}
          {packageInfo.version && <span>
            Version {packageInfo.version}
          </span>}
        </div>
      )}

      <Toaster />
    </div>
  </>
}

export default RootLayout
