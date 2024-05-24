import { useState } from "react";
import { DaButton } from "../atoms/DaButton";
import Popup from "../atoms/Popup";
import FormSignIn from "./forms/FormSignIn";

const DaNavUser = ({}) => {
  const signinState = useState(false);
  return (
    <div>
      <DaButton
        variant="plain"
        onClick={() => {
          signinState[1](true);
        }}
      >
        Sign in
      </DaButton>

      <Popup state={signinState} trigger={<span></span>}>
        <FormSignIn />
      </Popup>
    </div>
  );
};

export default DaNavUser;
