import DaApiList from "../molecules/DaApiList";
import { DaInput } from "../atoms/DaInput";

interface ApiListProps {
  apiList: { api: string; type: string; details: any }[];
  onApiClick: (details: any) => void;
}

const ApiList = ({ apiList, onApiClick }: ApiListProps) => {
  return (
    <div className="p-2">
      <DaInput placeholder="Search API" />
      <DaApiList apis={apiList} onApiClick={onApiClick} />
    </div>
  );
};

export default ApiList;
