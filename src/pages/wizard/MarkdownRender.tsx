import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRenderProps {
  markdownText: string
}

interface CodeProps {
  node: any
  inline: boolean
  className?: string
  children: React.ReactNode[]
  [key: string]: any
}

const MarkdownRender = ({ markdownText }: MarkdownRenderProps) => {
  // First, preprocess the markdown to convert "•" bullets into standard "-" bullets
  // This transformation happens before ReactMarkdown processes the text
  const processedMarkdown = markdownText
    // Convert bullet points to standard markdown list items
    .replace(/^([ \t]*)(•)(\s+)/gm, '$1-$3')

    // Remove lines containing only horizontal line characters (─) or dashes
    .replace(/^[ \t]*[─–—_\-]+[ \t]*$/gm, '')

    // Convert en dashes (–) at the beginning of lines to standard list format
    .replace(/^([ \t]*)(–)(\s+)/gm, '$1-$3')

    // Handle em dashes (—) at the beginning of lines
    .replace(/^([ \t]*)(—)(\s+)/gm, '$1-$3')

    // The original safety replacement for horizontal rules
    .replace(/^(\*{3,}|-{3,}|_{3,}|={3,}|)\s*$/gm, '')

  console.log(processedMarkdown)

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown-content text-base max-w-none text-primary space-y-3"
      components={{
        // Headings
        h1: ({ children }) => (
          <div className="flex text-[16px] pt-2 font-semibold leading-normal">
            {children}
          </div>
        ),
        h2: ({ children }) => (
          <div className="flex text-[16px] pt-2 font-semibold leading-normal">
            {children}
          </div>
        ),
        h3: ({ children }) => (
          <div className="flex text-[16px] pt-2 font-semibold leading-normal">
            {children}
          </div>
        ),

        // Text
        p: ({ children }) => (
          <p className="text-base whitespace-pre-nowrap leading-normal">
            {children}
          </p>
        ),
        label: ({ children }) => <div className="font-medium">{children}</div>,
        strong: ({ children }) => (
          <div className="text-base font-semibold inline">{children}</div>
        ),

        // List
        ul: ({ children }) => (
          <ul className="list-disc ml-4 space-y-2 my-2 leading-normal">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-4 space-y-2 my-2 leading-normal">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-normal pl-1.5">{children}</li>
        ),

        // Links with blue text and underline on hover.
        a: ({ children, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {children}
          </a>
        ),

        // Code: inline code uses Badge, code blocks use CodeBlockRender.
        code: ({
          node,
          inline,
          className,
          children,
          ...props
        }: {
          node?: any
          inline?: boolean
          className?: string
          children?: React.ReactNode
          [key: string]: any
        }) => {
          if (inline || !className) {
            const { ref, ...rest } = props
            return (
              <div
                className="w-fit text-sm font-normal select-text px-1 h-[18px] rounded-sm mx-0.5 font-mono dark:text-fuchsia-400/90"
                {...rest}
              >
                {children}
              </div>
            )
          } else {
            const language = className
              ? className.replace('language-', '')
              : 'plaintext'
            const codeContent = String(children).replace(/\n$/, '')
            const codeString = `\`\`\`${language}\n${codeContent}\n\`\`\``
            // return <CodeBlockRender code={codeString} className="w-full my-2" />;
            return <div>codeString</div>
          }
        },

        // Table
        table: ({ children }) => (
          <div className="flex">
            <table className="min-w-full border-collapse border border-muted-foreground/40">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted rounded">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-muted-foreground/40">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 border border-muted-foreground/40 text-left font-medium bg-muted">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 border border-muted-foreground/40">
            {children}
          </td>
        ),
      }}
    >
      {processedMarkdown || ''}
    </ReactMarkdown>
  )
}

export default MarkdownRender
