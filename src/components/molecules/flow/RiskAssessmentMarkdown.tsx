// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import ReactMarkdown from 'react-markdown'

interface RiskAssessmentMarkdownProps {
  markdownText: string
}

const RiskAssessmentMarkdown = ({
  markdownText,
}: RiskAssessmentMarkdownProps) => {
  return (
    <ReactMarkdown
      className="markdown-content text-muted-foreground text-xs max-w-none"
      components={{
        h1: ({ children }) => (
          <h1 className="text-xs font-semibold tracking-tight text-da-primary-500 mb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xs font-medium text-da-secondary-500 mb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xs font-medium text-da-secondary-500 pb-1">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-muted-foreground mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc mb-2 space-y-2 ml-6">{children}</ul>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-medium">{children}</strong>
        ),
      }}
    >
      {markdownText || ''}
    </ReactMarkdown>
  )
}

export default RiskAssessmentMarkdown
