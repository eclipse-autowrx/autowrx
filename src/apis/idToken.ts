import { auth } from "./firebase"

const idTokenHeaders = async () => {
    const idToken = await auth.currentUser?.getIdToken() ?? ""
    return {
        "X-Id-Token": idToken
    } as const
}

export default idTokenHeaders