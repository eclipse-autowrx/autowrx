import { Block } from "@/components/molecules/Block";
import { DaButton } from "@/components/atoms/DaButton";
import { DaText } from "@/components/atoms/DaText";
import { DaInput } from "@/components/atoms/DaInput";
import { DaTag } from "@/components/atoms/DaTag";
import { DaImage } from "@/components/atoms/DaImage";
import { DaAvatar } from "@/components/atoms/DaAvatar";

const PageHome = () => {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100">
      <div className="col-span-full space-x-4 p-4 border rounded-lg">
        <DaButton variant={"default"}>Default Button</DaButton>
        <DaButton variant={"outline"}>Outline Button</DaButton>
        <DaButton variant={"gradient"}>Gradient Button</DaButton>
        <DaButton variant={"outline-nocolor"}>Outline-nocolor Button</DaButton>
        <DaButton variant={"destructive"}>Destructive Button</DaButton>
        <DaButton variant={"secondary"}>Secondary Button</DaButton>
      </div>
      <div className="col-span-full space-x-4 p-4 border rounded-lg">
        <DaText variant="default">This is a text</DaText>
        <DaText variant="small">This is a text</DaText>
        <DaText variant="title">This is a text</DaText>
        <DaText variant="sub-title">This is a text</DaText>
        <DaText variant="small-bold">This is a text</DaText>
      </div>
      <div className="col-span-full space-x-4 p-4 border rounded-lg">
        <DaInput placeholder="Input" />
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
        <DaImage src="imgs/1.jpg" width={400} ratio={16 / 9} />
        <DaImage src="imgs/2.jpg" width={400} ratio={16 / 9} />
        <DaImage src="imgs/3.jpg" width={400} ratio={16 / 9} />
      </div>
      <div className="flex col-span-full space-x-4 p-4 border rounded-lg">
        <DaAvatar src="imgs/1.jpg" />
        <DaAvatar src="imgs/2.jpg" className="w-16 h-16" />
        <DaAvatar src="imgs/3.jpg" className="w-24 h-24" />
      </div>
    </div>
  );
};

export default PageHome;
