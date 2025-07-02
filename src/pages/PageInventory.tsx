// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import config from '@/configs/config'
import useAuthStore from '@/stores/authStore'
import { forwardRef, memo, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const PageInventory = () => {
  const ref = useRef<HTMLIFrameElement>(null)
  const access = useAuthStore((state) => state.access)
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  useEffect(() => {
    // Authentication
    const sendToken = () => {
      if (!ref.current) return
      if (access?.token === null) {
        ref.current.contentWindow?.postMessage(
          { type: 'userToken', token: null },
          '*',
        )
      } else if (access?.token) {
        ref.current.contentWindow?.postMessage(
          { type: 'userToken', token: access.token },
          '*',
        )
      }
    }

    const syncRoute = (route: string) => {
      if (typeof route !== 'string') return
      const newRoute = new URL(`/inventory${route}`, window.location.origin)
      if (pathname !== newRoute.pathname || search !== newRoute.search) {
        navigate(`${newRoute.pathname}${newRoute.search}`)
      }
    }

    const handleMessageFromIframe = (event: MessageEvent) => {
      if (event.data === 'requestUserToken') {
        sendToken()
      }
      if (typeof event.data === 'object' && event.data?.type === 'syncRoute') {
        syncRoute(event.data.route)
      }
    }

    sendToken()

    window.addEventListener('message', handleMessageFromIframe)

    return () => {
      window.removeEventListener('message', handleMessageFromIframe)
    }
  }, [access, navigate, pathname, search])

  useEffect(() => {
    // Send route
    ref.current?.contentWindow?.postMessage(
      {
        type: 'syncRoute',
        route: `${pathname.replace('/inventory', '')}${search}`,
      },
      '*',
    )
  }, [pathname, search])

  return (
    <div className="flex h-[calc(100vh-108px)]">
      <IframeInventory ref={ref} />
    </div>
  )
}

// Avoid re-rendering causing the iframe to reload due to pathname changes
const IframeInventory = memo(
  forwardRef<HTMLIFrameElement>((_, ref) => {
    return (
      <iframe
        ref={ref}
        src={`${config.inventory.frontend.url}/${window.location.pathname.replace('/inventory', '')}${window.location.search}`}
        className="h-full overflow-hidden w-full"
      />
    )
  }),
)

export default PageInventory
