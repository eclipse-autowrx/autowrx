// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useRoutes } from 'react-router-dom'
import routesConfig from '@/configs/routes.tsx'
import 'non.geist'
import 'non.geist/mono'
import useSelfProfileQuery from '@/hooks/useSelfProfile.ts'
import { useEffect } from 'react'
import { addLog } from '@/services/log.service.ts'
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/molecules/toaster/use-toast.ts'

function App() {
  const routes = useRoutes(routesConfig)
  const navigate = useNavigate();
  useEffect(() => {
    (window as any).reactNavigate = navigate;
  }, [navigate]);

  const { toast } = useToast()
  useEffect(() => {
    (window as any).reactToast = toast;
  }, [toast])

  const { data: currentUser } = useSelfProfileQuery()

  useEffect(() => {
    if (!currentUser) {
      return
    }
    //
    let userId = 'anonymous'
    let userName = 'Anonymous'
    if (currentUser) {
      userId = currentUser.id
      userName = currentUser.name
    }
    let lastAnonymousView = localStorage.getItem(`lastview-${userId}`)
    let lastVisitTime = new Date(Number(lastAnonymousView || 0))
    let now = new Date()
    if (now.getTime() - lastVisitTime.getTime() > 60000 * 60) {
      localStorage.setItem(`lastview-${userId}`, now.getTime().toString())
      addLog({
        name: `User ${userName} visited`,
        create_by: userId,
        description: `User ${userName} visited`,
        type: 'visit',
        ref_id: userId,
        ref_type: 'user',
      })
    }
  }, [currentUser])

  return routes || <div>Loading...</div>
}

export default App
