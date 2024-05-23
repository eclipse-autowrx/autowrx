import { DaText } from "@/components/atoms/DaText";
import { DaCardIntro } from "@/components/molecules/DaCardIntro";
import { DaCardIntroBig } from "@/components/molecules/DaCardIntroBig";
import { DaItemStandard } from "@/components/molecules/DaItemStandard";

const PageHome = () => {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100">
      <div className="col-span-full flex flex-col px-2 container space-y-">
        <DaText variant="sub-title" className="text-da-gray-dark">
          DaCardIntro
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaCardIntro
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout "
            maxWidth="320px"
          />
          <DaCardIntro
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="600px"
          />
          <DaCardIntro
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="320px"
          />
        </div>
        <DaText variant="sub-title" className="text-da-gray-dark pt-4">
          DaCardIntroBig
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaCardIntroBig
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="320px"
            buttonText="Learn More"
          />
          <DaCardIntroBig
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="600px"
            buttonText="Learn More"
          />
          <DaCardIntroBig
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="320px"
            buttonText="Learn More"
          />
        </div>
        <DaText variant="sub-title" className="text-da-gray-dark pt-4">
          DaItemStandard
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaItemStandard
            title="Prototypes"
            author="John Doe"
            content="It is a long
                established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            tags={["Tag1", "Tag2"]}
            imageUrl="imgs/1.jpg"
            avatarUrl="imgs/2.jpg"
            maxWidth="500px"
          />
        </div>
      </div>
    </div>
  );
};

export default PageHome;
