import { useState } from "react"
import Input from "../../reusable/Input/Input"
import Popup from "../../reusable/Popup/Popup"
import { HiAtSymbol, HiLockClosed } from "react-icons/hi"
import Button from "../../reusable/Button"
import { Bars } from '@agney/react-loading';
import { auth } from "../../apis/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import LinkWrap from "../../reusable/LinkWrap"

const Link = ({email}: {email: string}) => {
    return (
        <a href={`mailto:${email}`} className="text-aiot-blue">{email}</a>
    )
}

const LoginInner = () => {
    const [displayError, setDisplayError] = useState<null | string>(null)
    const [loading, setLoading] = useState(false)

    const inputEmail = useState("")
    const inputPassword = useState("")


    return (
        <>
            <div className="flex w-full mb-3">
                <Input
                state={inputEmail}
                disabled={loading}
                type="email"
                placeholder="Email"
                defaultValue=""
                Icon={HiAtSymbol}
                iconBefore
                />
            </div>
            <div className="flex w-full mb-2">
                <Input
                state={inputPassword}
                disabled={loading}
                type="password"
                placeholder="Password"
                defaultValue=""
                Icon={HiLockClosed}
                iconBefore
                />
            </div>
            {displayError !== null && <div className="text-red-500 text-sm mb-3 pl-1">{displayError}</div>}
            <div className="w-fit text-lg ml-auto">
                <Button disabled={loading} className="py-0.5" onClick={async () => {
                    setLoading(true)
                    try {
                        await signInWithEmailAndPassword(auth, inputEmail[0], inputPassword[0])                        
                    } catch (error) {
                        setDisplayError((error as any).code)
                    }
                    setLoading(false)
                }}>
                    {loading ? (
                        <div className="w-10 px-2 py-1"><Bars></Bars></div>
                    ) : "Login"}
                </Button>
            </div>
            <div className="mt-5 text-sm text-gray-500">Contact <Link email="support@digital.auto"/> to get login details</div>
        </>
    )
}

interface LoginPopupProps {
    trigger: React.ReactElement
}

const LoginPopup = ({trigger}: LoginPopupProps) => {
    const {isLoggedIn, user, profile} = useCurrentUser()
    
    return (
        <Popup trigger={trigger}>
            {user ? (
                <div className="flex flex-col select-none" style={{width: 240}}>
                    <div className="text-xl mb-2 text-gray-400">You're logged in as</div>
                    {(profile?.name ?? "") !== "" ? (
                        <>
                            <div className="font-bold">{profile?.name}</div>
                            <div className="text-sm">{user.email}</div>
                        </>
                    ) : (
                        <>
                            <div className="font-bold">{user.email}</div>
                        </>
                    )}
                    <div className="flex mt-5 w-full">
                        <LinkWrap to="/edit-profile" className=" ml-auto">
                            <Button className="py-0.5 w-fit mr-2 text-sm" >
                                Edit
                            </Button>
                        </LinkWrap>
                        <Button className="py-0.5 w-fit text-sm" onClick={() => auth.signOut()} >
                            Sign Out
                        </Button>
                    </div>
                </div>
            ) :
                <LoginInner/>
            }
        </Popup>
    )
}

export default LoginPopup