// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useNavigate } from 'react-router-dom'
import { DaButton } from '@/components/atoms/DaButton'
import DaText from '@/components/atoms/DaText'
import { useEffect } from 'react'

const PageNotFound = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Log the 404 error for analytics
    console.warn('404 - Page not found:', window.location.pathname)
  }, [])

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <div>
            <DaText variant="title" className="mt-4 text-gray-600">
                Page Not Found
            </DaText>
          </div>
          <div>
            <DaText variant="regular" className="mt-2 text-gray-500">
                The page you're looking for doesn't exist or has been moved.
            </DaText>
          </div>
        </div>
        
        <div className="space-y-4">
          <DaButton 
            onClick={handleGoHome}
            className="w-full"
          >
            Go Back Home
          </DaButton>
          
          <DaButton 
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default PageNotFound
