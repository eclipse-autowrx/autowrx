import { HomeIntroBlock } from "@/components/organisms/HomeIntroBlock";
import { HomePrototypeProposal } from "@/components/organisms/HomePrototypeProposal";
import { DaText } from "@/components/atoms/DaText";
import { HomePartners } from "@/components/organisms/HomePartners";

const PageOrganisms = () => {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100">
      <div className="col-span-full flex flex-col px-2 container space-y-2">
        <DaText variant="sub-title" className="text-da-gray-dark">
          HomeIntroBlock
        </DaText>
        <div className="flex w-full mt-2 space-x-4 p-4 border rounded-lg">
          <HomeIntroBlock />
        </div>
        <DaText variant="sub-title" className="text-da-gray-dark">
          HomePrototypeProposal
        </DaText>
        <div className="flex w-full mt-2 space-x-4 border rounded-lg">
          <HomePrototypeProposal />
        </div>
        <DaText variant="sub-title" className="text-da-gray-dark">
          HomePartners
        </DaText>
        <div className="flex w-full mt-2 space-x-4 border rounded-lg">
          <HomePartners />
        </div>
      </div>
    </div>
  );
};

export default PageOrganisms;
