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

const mdComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold text-foreground mt-10 mb-4 leading-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold text-foreground mt-10 mb-3 leading-snug border-b border-border pb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold text-foreground mt-8 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-base text-foreground leading-7 mb-5">{children}</p>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-6 mb-5 space-y-1.5 text-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-6 mb-5 space-y-1.5 text-foreground">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-base leading-7">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-5 italic text-muted-foreground my-6">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-')
    return isBlock ? (
      <code className={`block bg-muted rounded-md px-4 py-3 text-sm font-mono overflow-x-auto my-4 ${className ?? ''}`} {...props}>
        {children}
      </code>
    ) : (
      <code className="bg-muted rounded px-1.5 py-0.5 text-sm font-mono text-foreground" {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-muted rounded-lg overflow-x-auto my-6">{children}</pre>
  ),
  hr: () => <hr className="border-border my-10" />,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border-collapse border border-border">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-4 py-2 text-foreground">{children}</td>
  ),
  tr: ({ children }) => <tr className="even:bg-muted/40">{children}</tr>,
}

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
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
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
