import { DaButton } from '@/components/atoms/DaButton'
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
          <DaButton onClick={() => {}}>Default</DaButton>
          <DaButton variant="outline">Outline</DaButton>
          <DaButton variant="gradient">Gradient</DaButton>
          <DaButton variant="outline-nocolor">Outline-nocolor</DaButton>
          <DaButton variant="plain">Plain</DaButton>
          <DaButton variant="secondary">Secondary</DaButton>
        </div>

        <div className="mt-4 flex space-x-4 p-4 border rounded-lg">
          <DaButton size="sm">Default</DaButton>
          <DaButton size="sm" variant="outline">
            Outline
          </DaButton>
          <DaButton size="sm" variant="gradient">
            Gradient
          </DaButton>
          <DaButton size="sm" variant="outline-nocolor">
            Outline-nocolor
          </DaButton>
          <DaButton size="sm" variant="secondary">
            Secondary
          </DaButton>
        </div>

        <div className="mt-4 flex space-x-4 p-4 border rounded-lg">
          <DaButton size="lg">Default</DaButton>
          <DaButton size="lg" variant="outline">
            Outline
          </DaButton>
          <DaButton size="lg" variant="gradient">
            Gradient
          </DaButton>
          <DaButton size="lg" variant="outline-nocolor">
            Outline-nocolor
          </DaButton>
          <DaButton size="lg" variant="secondary">
            Secondary
          </DaButton>
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
