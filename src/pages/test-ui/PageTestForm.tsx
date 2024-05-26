import { useState } from "react";
import { DaText } from "@/components/atoms/DaText";
import FormSignIn from "@/components/molecules/forms/FormSignIn";

const PageOrganisms = () => {
  const [authType, setAuthType] = useState<"sign-in" | "register" | "forgot">("sign-in")
  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100">
      <div className="col-span-full flex flex-col px-2 container space-y-2">
        <div className="mt-4">
          <DaText variant="sub-title">Form Sign In</DaText>
          <div className="flex w-full mt-2 space-x-4 p-4 border rounded-lg">
            <FormSignIn setAuthType={setAuthType}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageOrganisms;
