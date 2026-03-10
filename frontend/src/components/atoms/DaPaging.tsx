// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
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
            'flex items-center hover:bg-slate-100 hover:text-slate-700 rounded-md px-2 py-1 cursor-pointer',
            isActive ? 'bg-slate-100 text-slate-700 font-semibold' : '',
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

export {
    DaPaging,
    DaPaginationContent,
    DaPaginationItem,
    DaPaginationLink,
    DaPaginationPrevious,
    DaPaginationNext,
}
