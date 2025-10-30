// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Textarea } from '@/components/atoms/textarea'
import { Checkbox } from '@/components/atoms/checkbox'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/atoms/avatar'
import { Skeleton } from '@/components/atoms/skeleton'
import { Spinner } from '@/components/atoms/spinner'
import { AspectRatio } from '@/components/atoms/aspect-ratio'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/atoms/context-menu'
import DaDialog from '@/components/molecules/DaDialog'
import DaTooltip from '@/components/molecules/DaTooltip'

const PageTest = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const [selectValue, setSelectValue] = useState('')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-semibold text-primary">
            Component Showcase
          </h1>
          <p className="text-lg text-muted-foreground">
            Testing all atom components: styling, themes, colors, and fonts
          </p>
        </div>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Typography
          </h2>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-semibold">Heading 3</h3>
            <h4 className="text-xl font-medium">Heading 4</h4>
            <p className="text-base text-foreground">
              Regular paragraph text with <strong>bold</strong> and{' '}
              <em>italic</em>
            </p>
            <p className="text-sm text-muted-foreground">Small muted text</p>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="default" size="sm">
              Small
            </Button>
            <Button variant="default" size="lg">
              Large
            </Button>
            <Button disabled>Disabled</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Primary (Brand)
            </Button>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Secondary (Brand)
            </Button>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Form Elements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Type your message here" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={checked}
                onCheckedChange={(checked) => setChecked(checked as boolean)}
              />
              <Label htmlFor="terms" className="cursor-pointer">
                Accept terms and conditions
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="select">Select</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger id="select">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Avatar */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Avatar
          </h2>
          <div className="flex gap-4 items-center">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8">
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
          </div>
        </section>

        {/* Loading States */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Loading States
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <Spinner />
              <Spinner className="text-primary" size={32} />
              <Spinner className="text-destructive" size={24} />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        </section>

        {/* Aspect Ratio */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Aspect Ratio
          </h2>
          <div className="w-full max-w-md">
            <AspectRatio ratio={16 / 9}>
              <img
                src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                alt="Aspect ratio example"
                className="rounded-md object-cover w-full h-full"
              />
            </AspectRatio>
          </div>
        </section>

        {/* Table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Table
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">Name</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-primary text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John Doe</TableCell>
                <TableCell>Active</TableCell>
                <TableCell className="text-right">$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Jane Smith</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell className="text-right">$150.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bob Johnson</TableCell>
                <TableCell>Inactive</TableCell>
                <TableCell className="text-right">$350.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        {/* Interactive Components */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Interactive Components
          </h2>
          <div className="flex flex-wrap gap-4">
            {/* Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me (Tooltip)</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip</p>
              </TooltipContent>
            </Tooltip>

            {/* DaTooltip Wrapper */}
            <DaTooltip tooltipMessage="This is a simple DaTooltip wrapper!">
              <Button variant="outline">Hover me (DaTooltip)</Button>
            </DaTooltip>

            {/* DaTooltip with custom side */}
            <DaTooltip
              tooltipMessage="This tooltip appears on the right"
              side="right"
              tooltipDelay={500}
            >
              <Button variant="outline">Right Tooltip</Button>
            </DaTooltip>

            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Dropdown Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Context Menu */}
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <Button variant="outline">Right-click me (Context)</Button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>Copy</ContextMenuItem>
                <ContextMenuItem>Paste</ContextMenuItem>
                <ContextMenuItem>Delete</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {/* Dialog */}
            <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
            <DaDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              dialogTitle="Dialog Title"
              description="This is a dialog description"
              className="max-w-md"
            >
              <div className="space-y-4">
                <p>This is the dialog content. You can put any content here.</p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
                </div>
              </div>
            </DaDialog>
          </div>
        </section>

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 rounded-lg bg-background border flex items-center justify-center">
              <span className="text-sm font-medium">background</span>
            </div>
            <div className="h-24 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-sm font-medium text-background">
                foreground
              </span>
            </div>
            <div className="h-24 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                primary
              </span>
            </div>
            <div className="h-24 rounded-lg bg-destructive flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                destructive
              </span>
            </div>
            <div className="h-24 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">muted</span>
            </div>
            <div className="h-24 rounded-lg border border-input flex items-center justify-center">
              <span className="text-sm font-medium">border</span>
            </div>
            <div className="h-24 rounded-lg bg-secondary flex items-center justify-center">
              <span className="text-sm font-medium text-secondary-foreground">
                secondary
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PageTest
