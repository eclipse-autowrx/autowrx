import { useState } from "react";
import { HiPlus } from "react-icons/hi";
import { newModel } from "../../apis";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Button from "../../reusable/Button";
import Input from "../../reusable/Input/Input";
import InputContainer from "../../reusable/Input/InputContainer";
import SideNav from "../../reusable/SideNav/SideNav";
import permissions from "../../permissions";
import Select from "../../reusable/Select";

interface NewModelButtonProps {
  onModelCreated: () => void;
}

const NewModelButton = ({ onModelCreated }: NewModelButtonProps) => {
  const newModelSidenavState = useState(false);
  const [loading, setLoading] = useState(false);

  const States = {
    Name: useState(""),
    StartFrom: useState<"vss_api" | "scratch">("vss_api"),
    RootNode: useState(""),
  };

  const options: {
    value: "vss_api" | "scratch"
    name: string;
  }[] = [{ value: "vss_api", name: "Start with the COVESA VSS API" }, { value: "scratch", name: "Start from scratch" }];

  const { user, profile } = useCurrentUser();

  if (!user || !permissions.TENANT(profile).canEdit()) {
    return null;
  }

  return (
    <SideNav
      state={newModelSidenavState}
      trigger={
        <div
          className={`flex rounded-lg border-4 border-dashed items-center justify-center text-gray-200 hover:border-gray-300 hover:text-gray-300 cursor-pointer transition min`}
          style={{ minHeight: 180 }}
        >
          <HiPlus className="text-5xl" />
        </div>
      }
      width="360px"
      className="p-4 h-full"
    >
      <div className="flex flex-col w-full h-full">
        <InputContainer
          label="Name"
          input={<Input state={States.Name} />}
        />
        <InputContainer
          label="VSS API"
          input={<Select state={States.StartFrom as any} options={options} />}
        />
        {States.StartFrom[0] === "scratch" && (
          <InputContainer
            label="Root Node"
            input={<Input state={States.RootNode} />}
          />
        )}
        <Button
          disabled={loading}
          className="ml-auto mt-auto w-fit min-w-fit py-1"
          variant="success"
          onClick={async () => {
            setLoading(true);
            await newModel(States.Name[0], user, States.StartFrom[0] === "vss_api" ? null : States.RootNode[0]);
            newModelSidenavState[1](false);
            setLoading(false);
            onModelCreated();
          }}
        >
          Save
        </Button>
      </div>
    </SideNav>
  );
};

export default NewModelButton;
