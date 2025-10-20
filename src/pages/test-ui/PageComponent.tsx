// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { DaText } from '@/components/atoms/DaText'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTag } from '@/components/atoms/DaTag'
import { DaImageRatio } from '@/components/atoms/DaImageRatio'
import { DaAvatar } from '@/components/atoms/DaAvatar'
import {
  DaPaging,
  DaPaginationContent,
  DaPaginationItem,
  DaPaginationNext,
  DaPaginationLink,
  DaPaginationPrevious,
  DaPaginationEllipsis,
} from '@/components/atoms/DaPaging'

const PageHome = () => {
  return (
    <div className="grid place-items-center bg-white">
      <div className="px-2 max-w-[1024px] space-y-4">
        <div className="mt-4 flex space-x-4 p-4 border rounded-lg">
          <Button onClick={() => {}}>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="gradient">Gradient</Button>
          <Button variant="outline-nocolor">Outline-nocolor</Button>
          <Button variant="plain">Plain</Button>
          <Button variant="secondary">Secondary</Button>
        </div>

        <div className="mt-4 flex space-x-4 p-4 border rounded-lg">
          <Button size="sm">Default</Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
          <Button size="sm" variant="gradient">
            Gradient
          </Button>
          <Button size="sm" variant="outline-nocolor">
            Outline-nocolor
          </Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
        </div>

        <div className="mt-4 flex space-x-4 p-4 border rounded-lg">
          <Button size="lg">Default</Button>
          <Button size="lg" variant="outline">
            Outline
          </Button>
          <Button size="lg" variant="gradient">
            Gradient
          </Button>
          <Button size="lg" variant="outline-nocolor">
            Outline-nocolor
          </Button>
          <Button size="lg" variant="secondary">
            Secondary
          </Button>
        </div>

        <div className="mt-4 flex flex-col p-4 border rounded-lg">
          <DaText variant="small">This is a text</DaText>

          <DaText variant="small-bold">This is a text</DaText>

          <DaText variant="regular">This is a text</DaText>

          <DaText variant="sub-title">This is a text</DaText>

          <DaText variant="title">This is a text</DaText>

          <DaText variant="huge">This is a text</DaText>

          <DaText variant="huge-bold">This is a text</DaText>
        </div>

        <div className="mt-4 p-4 border rounded-lg">
          <div className="max-w-[360px]">
            <DaInput placeholder="Email" label="Email address" />
            <DaInput
              placeholder="Password"
              label="Give me password"
              type="password"
              className="mt-4"
            />
          </div>
        </div>

        <div className="col-span-full space-x-4 p-4 border rounded-lg">
          <DaTag>Default Tag</DaTag>
          <DaTag variant="secondary">Secondary Tag</DaTag>
        </div>
        <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
          <DaImageRatio src="/imgs/1.jpg" maxWidth={'400px'} ratio={16 / 9} />
          <DaImageRatio src="/imgs/2.jpg" maxWidth={'400px'} ratio={16 / 9} />
          <DaImageRatio src="/imgs/3.jpg" maxWidth={'400px'} ratio={16 / 9} />
        </div>
        <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
          <DaAvatar src="/imgs/1.jpg" />
          <DaAvatar src="/imgs/2.jpg" className="w-16 h-16" />
          <DaAvatar src="/imgs/3.jpg" className="w-24 h-24" />
        </div>

        <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
          <DaPaging>
            <DaPaginationContent>
              <DaPaginationItem>
                <DaPaginationPrevious href="#" />
              </DaPaginationItem>
              <DaPaginationItem>
                <DaPaginationLink href="#">1</DaPaginationLink>
              </DaPaginationItem>
              <DaPaginationItem>
                <DaPaginationLink href="#" isActive>
                  2
                </DaPaginationLink>
              </DaPaginationItem>
              <DaPaginationItem>
                <DaPaginationLink href="#">3</DaPaginationLink>
              </DaPaginationItem>
              <DaPaginationItem>
                <DaPaginationEllipsis />
              </DaPaginationItem>
              <DaPaginationItem>
                <DaPaginationNext href="#" />
              </DaPaginationItem>
            </DaPaginationContent>
          </DaPaging>
        </div>

        {/* <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
          <DaDropdown>
            <DropdownTrigger className="w-[180px]">
              <DropdownValue placeholder="Theme" />
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem value="light">Light</DropdownItem>
              <DropdownItem value="dark">Dark</DropdownItem>
              <DropdownItem value="system">System</DropdownItem>
            </DropdownContent>
          </DaDropdown>
        </div> */}
      </div>
    </div>
  )
}

export default PageHome
