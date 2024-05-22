import { Block } from "@/components/molecules/Block";

const PageHome = () => {
  return (
    <div className="p-4 bg-slate-100 min-h-[86vh]">
      <Block title="Home Block" height="100px" />

      <Block
        className="mt-2 rounded-xl"
        title="Home Block"
        variant="outline"
        height="300px"
      />
    </div>
  );
};

export default PageHome;
