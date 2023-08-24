import { ProjectGeneratorError } from "@eclipse-velocitas/velocitas-project-generator"
import { CircularProgress } from "@mui/material"
import clsx from "clsx"
import { FC, useEffect, useState } from "react"
import { VscGithubInverted } from "react-icons/vsc"
import { Model } from "../../../apis/models"
import TransparentInput from "../../../reusable/TransparentInput"
import publishToGithub, { loginToGithub } from "./publishToGithub"
import { buildAllModelAPIs } from "./vssUtils"

interface RepoCreatedDisplayProps {
    repoCreatedUrl: string
    repoCreatedError: ProjectGeneratorError | null
}

const RepoCreatedDisplay: FC<RepoCreatedDisplayProps> = ({repoCreatedUrl, repoCreatedError}) => {
    return (
        repoCreatedError === null ? (
            <div className="flex flex-col">
                <div className="font-bold text-sm mb-2">Repository Created:</div>
                <a href={repoCreatedUrl} target="_blank" rel="noreferrer" className="bg-gray-100 p-2 px-3 rounded-md transition hover:bg-gray-200">{repoCreatedUrl}</a>
            </div>
        ) : (
            <div className="flex flex-col">
                <div className="text-xl font-bold mb-4">Error occured while creating repository:</div>
                <pre className="bg-gray-200 p-5" style={{whiteSpace: "break-spaces", maxWidth: 700, wordBreak: "break-word"}}><code>{JSON.stringify({
                    name: repoCreatedError.name,
                    message: repoCreatedError.message,
                    responseMessages: repoCreatedError.responseMessages,
                    statusCode: repoCreatedError.statusCode
                }, null, 4)}</code></pre>
            </div>
        )
    )
}

interface RepoCreationFormProps {
    code: string
    user: any
    accessToken: string
    setRepoCreatedUrl: React.Dispatch<React.SetStateAction<string | null>>
    setRepoCreatedError: React.Dispatch<React.SetStateAction<ProjectGeneratorError | null>>
    model: Model
}

const RepoCreationForm: FC<RepoCreationFormProps> = ({code, model, user, accessToken, setRepoCreatedUrl, setRepoCreatedError}) => {
    const [repo, setRepo] = useState("")
    const [loadingCreation, setLoadingCreation] = useState(false)

    return (
        <div className="flex flex-col">
            <div className="flex text-xl mb-5 select-none text-purple-700 font-bold">
                <VscGithubInverted size="1.4em" className="mr-3" />Create Repository
            </div>
            <div className="flex h-full h-16 select-none">
                <div className="flex flex-col h-full mr-3">
                    <div className="text-sm mb-1">Owner</div>
                    <div className="flex items-center font-bold select-none my-auto">{user.login} /</div>
                </div>
                <div className="flex flex-col h-full">
                    <div className="text-sm mb-1">Repository name</div>
                    <div className="flex my-auto">
                        <TransparentInput state={[repo, setRepo]} className="flex outline-none bg-gray-100 border border-gray-200 rounded-md py-1 px-3" />
                    </div>
                </div>
            </div>
            <div className="flex mt-6 select-none">
                <button
                disabled={repo.trim() === ""}
                className={clsx(
                    (repo.trim() === "" || loadingCreation) && "pointer-events-none opacity-60",
                    "flex justify-center items-center ml-auto bg-green-600 text-sm text-white font-bold px-4 py-1 rounded-md transition opacity-90 hover:opacity-100 active:bg-green-700",
                )}
                onClick={async () => {
                    setLoadingCreation(true)
                    try {
                        await publishToGithub({
                            accessToken: accessToken,
                            user_login: user.login,
                            code: code,
                            repo: repo,
                            vss_payload: buildAllModelAPIs(model)
                        })
                        
                        setRepoCreatedUrl(`https://github.com/${user.login}/${repo}`)
                    } catch (error) {
                        console.error(error)
                        setRepoCreatedError(error as ProjectGeneratorError)
                        setRepoCreatedUrl("")
                    } finally {
                        setLoadingCreation(false)
                    }
                }}
                >
                    {loadingCreation ? (
                        <>
                        <div className="flex mr-2">
                            <CircularProgress size="1em" style={{color: "white"}}/>
                        </div>
                        Creating
                        </>
                    ) : (
                        <>Create repository</>
                    )}
                </button>
            </div>
        </div>
    )
}

interface CreateRepoProps {
    code: string
    model: Model
}

const CreateRepo: FC<CreateRepoProps> = ({code, model}) => {
    const [loading, setLoading] = useState(true)
    const [accessToken, setAccessToken] = useState<null | string>(null)
    const [user, setUser] = useState<null | any>(null)
    const [repoCreatedUrl, setRepoCreatedUrl] = useState<null | string>(null)
    const [repoCreatedError, setRepoCreatedError] = useState<null | ProjectGeneratorError>(null)

    useEffect(() => {
        (async () => {
            const {accessToken, user} = await loginToGithub()
            setAccessToken(accessToken)
            setUser(user)
            setLoading(false)
        })()
    }, [])

    return repoCreatedUrl !== null ? (
        <RepoCreatedDisplay
        repoCreatedError={repoCreatedError}
        repoCreatedUrl={repoCreatedUrl}
        />
    ) : ((loading || accessToken === null || user === null) ? (
        <div className="flex flex-col select-none font-bold">
            <div className="flex items-center justify-center text-xl mb-4">
                <CircularProgress size="1em" className="mr-3" style={{color: "#9333ea"}} /> Authenticating
            </div>
            <div>Login to your Github account in the new tab opened.</div>
        </div>
    ) : (
        <RepoCreationForm
        model={model}
        code={code}
        user={user}
        accessToken={accessToken}
        setRepoCreatedUrl={setRepoCreatedUrl}
        setRepoCreatedError={setRepoCreatedError}
        />
    ))
}

export default CreateRepo