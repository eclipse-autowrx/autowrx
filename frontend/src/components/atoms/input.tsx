import * as React from 'react'
import { IconType } from 'react-icons'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  inputClassName?: string
  wrapperClassName?: string
  Icon?: IconType
  iconBefore?: boolean
  IconOnClick?: () => void
  iconSize?: number
  labelClassName?: string
  dataId?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      wrapperClassName,
      label,
      type,
      Icon,
      iconBefore = false,
      IconOnClick,
      iconSize,
      labelClassName,
      dataId,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false)

    // If no label and no Icon, render simple input
    if (!label && !Icon) {
      return (
        <input
          type={type}
          data-slot="input"
          data-id={dataId}
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className,
            inputClassName,
          )}
          ref={ref}
          {...props}
        />
      )
    }

    // Render with label and/or icon wrapper
    return (
      <div className={cn('flex flex-col', className)}>
        {label && (
          <label
            className={cn(
              'text-base font-medium mb-1',
              focused ? 'text-primary' : 'text-muted-foreground',
              labelClassName,
            )}
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'h-10 py-1 flex items-center rounded-md border bg-background text-base shadow-xs transition-colors text-foreground',
            !focused && 'border-input',
            focused && 'border-primary text-primary',
            wrapperClassName,
          )}
        >
          {Icon && iconBefore && (
            <Icon
              size={iconSize || 20}
              className={iconBefore ? 'ml-2' : 'mr-2'}
              onClick={IconOnClick}
            />
          )}

          <input
            type={type}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            data-id={dataId}
            className={cn(
              'grow flex px-2 py-1 h-8 w-full placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed',
              inputClassName,
            )}
            ref={ref}
            {...props}
          />

          {Icon && !iconBefore && (
            <Icon
              size={iconSize || 20}
              className="mx-2"
              onClick={IconOnClick}
            />
          )}
        </div>
      </div>
    )
  },
)
Input.displayName = 'Input'

// InputWithLabel - Horizontal layout with label on the left
interface InputWithLabelProps {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  inputClassName?: string
}

const InputWithLabel = ({
  label,
  value,
  onChange,
  className,
  inputClassName,
}: InputWithLabelProps) => (
  <div className={cn('flex w-full items-center mb-4', className)}>
    <label className="text-sm font-semibold flex min-w-[150px] text-foreground">
      {label}
    </label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex w-full"
      inputClassName={cn('text-sm', inputClassName)}
    />
  </div>
)

export { Input, InputWithLabel }
