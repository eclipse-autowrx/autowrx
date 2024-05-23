import { DaButton } from "@/components/atoms/DaButton";
import { DaText } from "@/components/atoms/DaText";
import { DaInput } from "@/components/atoms/DaInput";
import { DaTag } from "@/components/atoms/DaTag";
import { DaImage } from "@/components/atoms/DaImage";
import { DaAvatar } from "@/components/atoms/DaAvatar";
import {
  DaPaging,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/DaPaging";
import {
  DaDropdown,
  DropdownContent,
  DropdownTrigger,
  DropdownValue,
  DropdownItem,
} from "@/components/atoms/DaDropdown";

const PageHome = () => {
  return (
    <div className="grid place-items-center">
      <div className="px-2 max-w-[1024px]">
        <div className="mt-4 flex space-x-4 p-4 border rounded-lg">
          <DaButton>Default</DaButton>
          <DaButton variant="outline">Outline</DaButton>
          <DaButton variant="gradient">Gradient</DaButton>
          <DaButton variant="outline-nocolor">Outline-nocolor</DaButton>
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
            <div className="mt-2"></div>
            <DaInput
              placeholder="Password"
              label="Give me password"
              type="password"
            />
          </div>
        </div>

        <div className="col-span-full space-x-4 p-4 border rounded-lg">
          <DaTag variant="outline">Outline Tag</DaTag>
          <DaTag variant="default">Default Tag</DaTag>
          <DaTag variant="secondary">Secondary Tag</DaTag>
        </div>
        <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
          <DaImage src="imgs/1.jpg" width={400} ratio={16 / 9} />
          <DaImage src="imgs/2.jpg" width={400} ratio={16 / 9} />
          <DaImage src="imgs/3.jpg" width={400} ratio={16 / 9} />
        </div>
        <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
          <DaAvatar src="imgs/1.jpg" />
          <DaAvatar src="imgs/2.jpg" className="w-16 h-16" />
          <DaAvatar src="imgs/3.jpg" className="w-24 h-24" />
        </div>
        <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
          <DaPaging>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </DaPaging>
        </div>
        <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
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
        </div>
      </div>
    </div>
  );
};

export default PageHome;
