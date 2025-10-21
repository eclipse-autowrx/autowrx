// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DotsHorizontalIcon,
} from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'
import { DaText } from './DaText'

const DaPaging = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
)
DaPaging.displayName = 'Pagination'

const DaPaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
))
DaPaginationContent.displayName = 'PaginationContent'

const DaPaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
))
DaPaginationItem.displayName = 'PaginationItem'

type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
} & React.ComponentProps<'a'>

const DaPaginationLink = ({
  className,
  isActive,
  disabled,
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'flex items-center hover:bg-da-gray-light hover:text-da-gray-dark rounded-md px-2 py-1',
      isActive
        ? 'bg-da-gray-light text-da-gray-dark da-label-regular-bold'
        : '',
      disabled ? 'select-none pointer-events-none opacity-50' : '',
      className,
    )}
    {...(disabled
      ? { 'aria-disabled': true, onClick: (e) => e.preventDefault() }
      : {})}
    {...props}
  />
)
DaPaginationLink.displayName = 'PaginationLink'

const DaPaginationPrevious = ({
  className,
  disabled,
  ...props
}: PaginationLinkProps) => (
  <DaPaginationLink
    aria-label="Go to previous page"
    className={cn('gap-1 pl-2.5', className)}
    disabled={disabled}
    {...props}
  >
    <ChevronLeftIcon className="h-4 w-4" />
    <DaText variant="small-bold" className="cursor-pointer">
      Previous
    </DaText>
  </DaPaginationLink>
)
DaPaginationPrevious.displayName = 'PaginationPrevious'

const DaPaginationNext = ({
  className,
  disabled,
  ...props
}: PaginationLinkProps) => (
  <DaPaginationLink
    aria-label="Go to next page"
    className={cn('gap-1 pr-2.5', className)}
    disabled={disabled}
    {...props}
  >
    <DaText variant="small-bold" className="cursor-pointer">
      Next
    </DaText>
    <ChevronRightIcon className="h-4 w-4" />
  </DaPaginationLink>
)
DaPaginationNext.displayName = 'PaginationNext'

const DaPaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <DotsHorizontalIcon className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
DaPaginationEllipsis.displayName = 'PaginationEllipsis'

export {
  DaPaging,
  DaPaginationContent,
  DaPaginationLink,
  DaPaginationPrevious,
  DaPaginationNext,
  DaPaginationEllipsis,
  DaPaginationItem,
}
