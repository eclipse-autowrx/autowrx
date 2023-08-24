import Editor from "@monaco-editor/react"
import type monaco from 'monaco-editor';
import clsx from "clsx"
import styles from "./CodeEditor.module.scss"
import Loader from "../../../reusable/Loader"

export type EditorType = monaco.editor.IStandaloneCodeEditor

export interface CodeEditorProps {
    code: string
    setCode: (code: string) => void
    editable?: boolean
    language: "python" | "json"
}

const CodeEditor = ({code, setCode, editable = false, language}: CodeEditorProps) => {
    return (
        <div className={clsx("flex flex-col h-full w-full overflow-hidden", !editable && styles.HideCursor)}>
            <div className={clsx(styles.PreEditorPadding)}></div>
            <div style={{height: "calc(100% - 20px)"}}>
                <Editor
                theme="vs"
                height="100%"
                defaultLanguage={language}
                onChange={(o) => setCode(o ?? "")}
                value={code}
                options={{
                    scrollBeyondLastLine: false,
                    readOnly: !editable,
                    minimap: {enabled: false},
                    wordWrap: "on",
                    lineNumbers: num => (num + 5).toString(),
                }}
                loading={
                <div
                className={clsx(
                    "flex h-full w-full text-black items-center justify-center select-none",
                    styles.Loading
                )}
                >
                    <Loader/>
                </div>
                }
                />
            </div>
            <div className={clsx(styles.PostEditorPadding)}></div>
        </div>
    )
}

export default CodeEditor