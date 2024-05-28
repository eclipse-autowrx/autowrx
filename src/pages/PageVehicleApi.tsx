import { useEffect, useState } from "react";
import { CVI_v4_1 } from "@/data/CVI_v4.1";
import ApiList from "@/components/organisms/ApiList";
import ApiDetail from "@/components/organisms/ApiDetail";

interface Node {
  datatype?: string;
  description: string;
  type: string;
  uuid: string;
  allowed?: string[];
  comment?: string;
  unit?: string;
  max?: number;
  min?: number;
  children?: { [key: string]: Node };
}

interface Cvi {
  Vehicle: Node;
}

const parseCvi = (cvi: Cvi) => {
  const traverse = (
    node: Node,
    prefix: string = "Vehicle"
  ): { api: string; type: string; details: Node }[] => {
    let result: { api: string; type: string; details: Node }[] = [];
    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`;
        result.push({ api: newPrefix, type: child.type, details: child });
        result = result.concat(traverse(child, newPrefix));
      }
    }
    return result;
  };
  return traverse(cvi.Vehicle);
};

const PageVehicleApi = () => {
  const [apiList, setApiList] = useState<
    { api: string; type: string; details: Node }[]
  >([]);
  const [selectedApi, setSelectedApi] = useState<Node | null>(null);

  useEffect(() => {
    const cviData: Cvi = JSON.parse(CVI_v4_1);
    const parsedApiList = parseCvi(cviData);
    setApiList(parsedApiList);
    console.log("CVI_v4_1", cviData);
  }, []);

  const handleApiClick = (apiDetails: Node) => {
    console.log("Selected API", apiDetails);
    setSelectedApi(apiDetails);
  };

  return (
    <div className="grid grid-cols-12 h-full w-full">
      <div className="col-span-6 overflow-auto">
        <ApiList apiList={apiList} onApiClick={handleApiClick} />
      </div>
      <div className="col-span-6">
        {selectedApi && <ApiDetail apiDetails={selectedApi} />}
      </div>
    </div>
  );
};

export default PageVehicleApi;
