import { useState } from "react";
import PrototypeSummary from "@/components/organisms/PrototypeSummary";
import { DaInput } from "@/components/atoms/DaInput";
import { DaItemStandard } from "@/components/molecules/DaItemStandard";
import { prototypes } from "@/data/models_mock";
import { DaButton } from "@/components/atoms/DaButton";
import { TbFileImport, TbPlus } from "react-icons/tb";

const PagePrototypeList = () => {
  const [selectedPrototype, setSelectedPrototype] = useState(prototypes[0]);

  return (
    <div className="grid grid-cols-12 h-full">
      <div className="col-span-full h-12 bg-da-primary-100 sticky top-0 z-20"></div>
      <div className="col-span-5 xl:col-span-4 h-[calc(100%-10px)] overflow-y-auto mt-2">
        <DaInput
          type="text"
          placeholder="Enter to search"
          className="w-full py-2 px-4 sticky top-0 !bg-white z-10"
        />
        <div className="flex flex-col px-4 mt-2">
          {prototypes.map((prototype, index) => (
            <div
              key={index}
              onClick={() => setSelectedPrototype(prototype)}
              className="cursor-pointer mb-2"
            >
              <DaItemStandard
                title={prototype.name}
                author={"John Doe"}
                content={prototype.description.problems}
                tags={prototype.tags}
                imageUrl={prototype.image_file}
                avatarUrl="/imgs/2.jpg"
                maxWidth="2000px"
                imageMaxWidth="100px"
              />
            </div>
          ))}
          <div className="grow"></div>
        </div>
        <div className="grid sticky bottom-0 bg-white grid-cols-1 2xl:grid-cols-2 mt-2 gap-2 px-4 py-1">
          <DaButton variant="outline-nocolor">
            <TbFileImport className="w-5 h-5 mr-2" />
            Import Prototype
          </DaButton>
          <DaButton variant="outline-nocolor">
            <TbPlus className="w-5 h-5 mr-2" />
            Create New Prototype
          </DaButton>
        </div>
      </div>
      <div className="col-span-7 xl:col-span-8 border-l">
        {selectedPrototype && (
          <PrototypeSummary
            prototypeName={selectedPrototype.name}
            prototypeImageUrl={selectedPrototype.image_file}
            prototypeAuthorAvatarUrl="https://avatars.githubusercontent.com/u/115630638?v=4"
            prototypeAuthorName="John Doe"
            prototypeTags={["tag1", "tag2", "tag3"]}
            prototypeProperties={[
              {
                property: "Problem",
                value: selectedPrototype.description.problems,
              },
              {
                property: "Says who?",
                value: selectedPrototype.description.says_who,
              },
              {
                property: "Solution",
                value: selectedPrototype.description.solution,
              },
              {
                property: "Status",
                value: selectedPrototype.description.status,
              },
              { property: "Complexity", value: "5" },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default PagePrototypeList;
