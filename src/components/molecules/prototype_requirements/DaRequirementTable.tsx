// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// src/molecules/prototype_requirements/DaRequirementTable.tsx
import React, { useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/atoms/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/atoms/dropdown-menu'
import { TbDots, TbEdit, TbTrash } from 'react-icons/tb'
import DaTooltip from '@/components/atoms/DaTooltip'
import { Requirement } from '@/types/model.type'
import { useRequirementStore } from './hook/useRequirementStore'

interface Props {
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}

const DaRequirementTable: React.FC<Props> = ({ onDelete, onEdit }) => {
  // pull real data from store
  const requirements = useRequirementStore((s) => s.requirements)

  // memoize
  const data = useMemo<Requirement[]>(() => requirements, [requirements])

  const columns = useMemo<ColumnDef<Requirement, any>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'type', header: 'Type' },
      {
        id: 'source',
        header: 'Source',
        accessorFn: (row: any) => row.source,
        cell: ({ getValue }: { getValue: any }) => {
          const src = getValue()
          return src.type === 'external' ? (
            <DaTooltip content={src.link}>
              <a
                href={src.link}
                target="_blank"
                rel="noopener noreferrer"
                className="capitalize text-blue-600 underline"
              >
                external
              </a>
            </DaTooltip>
          ) : (
            <span className="capitalize">internal</span>
          )
        },
      },
      {
        id: 'rating',
        header: 'Rating',
        cell: ({ row }: {row:any}) => {
          const r = row.original.rating
          const avg = (r.priority + r.relevance + r.impact) / 3
          return <span>{avg.toFixed(1)}</span>
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: {row: any}) => {
          const req = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded"
                  aria-label="Open menu"
                >
                  <TbDots />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                className="bg-white"
              >
                <DropdownMenuLabel className="font-medium text-da-primary-500">
                  Metadata
                </DropdownMenuLabel>
                <DropdownMenuItem>
                  <div className="font-medium">Created At:</div>{' '}
                  {req.createdAt
                    ? new Date(req.createdAt).toLocaleString()
                    : '-'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="font-medium">Updated At:</div>{' '}
                  {req.updatedAt
                    ? new Date(req.updatedAt).toLocaleString()
                    : '-'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="font-medium">Creator ID:</div>{' '}
                  {req.creatorUserId}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-medium text-da-primary-500">
                  Rating Detail
                </DropdownMenuLabel>
                <DropdownMenuItem>
                  <div className="font-medium">Priority:</div>{' '}
                  {req.rating.priority}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="font-medium">Relevance:</div>{' '}
                  {req.rating.relevance}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="font-medium">Impact:</div> {req.rating.impact}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-medium text-da-primary-500">
                  Settings
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="flex items-center text-da-gray-medium hover:text-da-primary-500 hover:bg-da-primary-100 cursor-pointer"
                  onClick={() => onEdit(req.id)}
                >
                  <TbEdit className="flex mb-0.5" /> Edit Requirement
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center text-da-gray-medium hover:text-red-500 hover:bg-red-100 cursor-pointer"
                  onClick={() => onDelete(req.id)}
                >
                  <TbTrash className="flex mb-0.5" /> Delete Requirement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onDelete],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full h-full overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg: any) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header: any) => (
                <TableHead
                  key={header.id}
                  className="font-semibold text-da-primary-500"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row: any) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell: any) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No requirements found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default DaRequirementTable
