import { useState } from "react";
import PrototypeSummary from "@/components/organisms/PrototypeSummary";
import { DaInput } from "@/components/atoms/DaInput";
import { DaItemStandard } from "@/components/molecules/DaItemStandard";
import { prototypes } from "@/data/models_mock";

const PagePrototypeList = () => {
  const [selectedPrototype, setSelectedPrototype] = useState(prototypes[0]);

  return (
    <div className="grid grid-cols-12 h-full">
      <div className="col-span-full h-12 bg-da-primary-500/10"></div>
      <div className="col-span-3 px-4 y mt-2 h-full overflow-y-auto">
        <DaInput
          type="text"
          placeholder="Enter to search"
          className="w-full mb-4"
        />
        <div className="overflow-y-auto h-[500px]">
          {prototypes.map((prototype, index) => (
            <div
              key={index}
              onClick={() => setSelectedPrototype(prototype)}
              className="cursor-pointer mb-2 "
            >
              <DaItemStandard
                title={prototype.name}
                author={"John Doe"}
                content={prototype.description.problems}
                tags={prototype.tags}
                imageUrl={prototype.image_file}
                avatarUrl="/imgs/2.jpg"
                maxWidth="1000px"
                imageMaxWidth="100px"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-9 h-full overflow-y-auto border-l">
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
