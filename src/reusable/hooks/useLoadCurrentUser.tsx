import { NextOrObserver, onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { auth, REFS } from "../../apis/firebase"
import { User as UserProfile } from "../../apis/models"

export interface CurrentUserInterface {
    isLoggedIn: boolean
    user: User | null
    profile: UserProfile | null
}

const useLoadCurrentUser = (): [boolean, CurrentUserInterface] => {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        const onUserChange: NextOrObserver<User> = async (user) => {
            if (user === null) {
                setCurrentUser(null)
                setCurrentProfile(null)
                setLoading(false)
            } else {
                setLoading(true)
                const userProfile = (await getDoc(doc(REFS.user, user.uid))).data() as UserProfile
                console.log(userProfile)
                setLoading(false)
                setCurrentUser(user)
                setCurrentProfile(userProfile)
            }
        }
        onAuthStateChanged(auth, onUserChange)
    }, [])


    return [loading, {
        isLoggedIn: auth.currentUser !== null,
        user: currentUser,
        profile: currentProfile
    }]
}

export default useLoadCurrentUser