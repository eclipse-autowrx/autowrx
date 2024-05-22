import { Block } from "@/components/molecules/Block";

const PageHome = () => {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100">
      <Block
        className="col-span-full mt-2 rounded-xl "
        title="Home Block"
        variant="outline"
        height="1300px"
      ></Block>
      <Block className="col-span-full" title="Home Block" height="100px" />
      <Block
        className="col-span-full mt-2 rounded-xl "
        title="Home Block"
        variant="outline"
        height="300px"
      />
      <Block
        className="col-span-full mt-2 rounded-xl "
        title="Home Block"
        variant="outline"
        height="300px"
      />
      <Block className="col-span-full" title="Home Block" height="100px" />
      <Block
        className="col-span-full mt-2 rounded-xl "
        title="Home Block"
        variant="outline"
        height="300px"
      />
    </div>
  );
};

export default PageHome;
