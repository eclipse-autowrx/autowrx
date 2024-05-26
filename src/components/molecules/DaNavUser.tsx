import { useState } from "react"
import { DaButton } from "../atoms/DaButton"
import DaPopup from "../atoms/DaPopup"
import FormSignIn from "./forms/FormSignIn"
import FormRegister from "./forms/FormRegister"
import useSelfProfileQuery from "@/hooks/useSelfProfile"
import DaUserDropdown from "./DaUserDropdown"

const DaNavUser = () => {
  const openState = useState(false)
  const [authType, setAuthType] = useState<"sign-in" | "register" | "forgot">("sign-in")
  const { data: user } = useSelfProfileQuery()

  return (
    <div>
      {user ? (
        <DaUserDropdown user={user} />
      ) : (
        <DaButton
          variant='plain'
          onClick={() => {
            openState[1](true)
          }}
        >
          Sign in
        </DaButton>
      )}

      <DaPopup state={openState} trigger={<span></span>}>
        {authType === "sign-in" && <FormSignIn setAuthType={setAuthType} />}
        {authType === "register" && <FormRegister setAuthType={setAuthType} />}
      </DaPopup>
    </div>
  )
}

export default DaNavUser
