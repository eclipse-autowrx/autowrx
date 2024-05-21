import { Block } from "@/components/molecules/Block";

const PageHome = () => {
  return (
    <div className="grid md:grid-col-2 md:gap-4 lg:grid-cols-10 xl:grid-cols-12 xl:gap-4 p-4">
      <Block className="col-span-full" title="Home Block" height="100px" />

      <Block
        className="col-span-full"
        title="Home Block"
        variant="outline"
        height="300px"
      />
    </div>
  );
};

export default PageHome;
