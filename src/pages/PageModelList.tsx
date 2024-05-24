import { ModelGrid } from "@/components/organisms/ModelGrid";
import { DaText } from "@/components/atoms/DaText";

const PageModelList = () => {
  return (
    <div className="col-span-full flex flex-col px-2 py-4 container space-y-2">
      <DaText variant="huge" className="text-da-primary-500">
        Select Vehicle Models
      </DaText>

      <ModelGrid></ModelGrid>
    </div>
  );
};

export default PageModelList;
