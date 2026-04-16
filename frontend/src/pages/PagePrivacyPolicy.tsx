// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { configManagementService } from '@/services/configManagement.service'
import { Spinner } from '@/components/atoms/spinner'
import privacyMarkdownComponents from '@/lib/privacyMarkdownComponents'

const PagePrivacyPolicy: React.FC = () => {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    configManagementService
      .getPublicConfig('PRIVACY_POLICY_CONTENT')
      .then((res) => {
        setContent(typeof res?.value === 'string' ? res.value : '')
      })
      .catch(() => setContent(''))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner />
          </div>
        ) : content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={privacyMarkdownComponents}>
            {content}
          </ReactMarkdown>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg">No privacy policy content has been configured.</p>
            <p className="text-sm mt-2">Please contact the site administrator.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PagePrivacyPolicy
