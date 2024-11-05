import { forwardRef, useState, useEffect, useImperativeHandle } from "react"
import { shallow } from 'zustand/shallow'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useRuntimeStore from '@/stores/runtimeStore'
import { io } from 'socket.io-client'

interface RemoteCompileRustProps {
    remoteServer?: string
    onResponse?: (log: string, isDone: boolean, status: string, app_name: string) => void
  }

//const DEFAULT_RUST_COMPILER_SERVER = "http://127.0.0.1:5001"
const DEFAULT_RUST_COMPILER_SERVER = localStorage.getItem("rusturl") || "https://rust-compiler.digital.auto"

const DaRemoteCompileRust = forwardRef<any, RemoteCompileRustProps>(({remoteServer, onResponse}, ref) => {
    useImperativeHandle(ref, () => {
        return {
          requestCompile,
        }
      })

    const [apisValue, setActiveApis, setAppLog] = useRuntimeStore(
    (state) => [state.apisValue, state.setActiveApis, state.setAppLog],
    shallow,
    )

    const { data: prototype } = useCurrentPrototype()
    const { data: currentUser } = useSelfProfileQuery()

    const [socketio, setSocketIo] = useState<any>(null)
    const [isConnected, setIsConnected] = useState<boolean>(false)

    useEffect(() => {
        setSocketIo(io(remoteServer || DEFAULT_RUST_COMPILER_SERVER))
    }, [remoteServer])

    useEffect(() => {
        if(!socketio) return
        if (!socketio.connected) {
            console.log("Try to connect")
            socketio.connect()
        }
        // console.log(">>>>>>>>>>>>>>>>>>>>>>>>")
        // console.log(socketio)
        socketio.on('connect', onConnected)
        socketio.on('disconnect', onDisconnect)
        socketio.on('compile_rust_reply', onCompileResponse)

        return () => {
            socketio.off('connect', onConnected)
            socketio.off('disconnect', onDisconnect)
            socketio.off('compile_rust_reply', onCompileResponse)
        }
    }, [socketio])

    const onConnected = () => {
        console.log("On Rust remote compiler connected")
        setIsConnected(true)
    }

    const onDisconnect = () => {
        console.log("On Rust remote compiler disconnected")
        setIsConnected(false)
    }

    const onCompileResponse = (payload: any) => {
        // console.log("onCompileResponse", payload)
        // await sio.emit("compile_rust_reply", {
        //     "cmd": "compile_rust",
        //     "data": "",
        //     "isDone": is_done,
        //     "result": content,
        //     "code": retcode
        // }, to=master_id)
        if(payload && payload.result && onResponse) {
            onResponse(payload.result, payload.isDone || false, payload.status, `app_${socketio.id}`)
        }
    }
    
    const requestCompile = (code: string) => {
        if(!code) {
            if(onResponse) {
                onResponse("There is no code to run!", true, '', '')
            }
            return
        }
        if(!socketio || !socketio.connected) {
            if(onResponse) {
                onResponse("Connect to compiler fail!", true, '', '')
            }
            return
        }
        socketio.emit("compile_rust", {
            "code": code,
            "app_name": "app",
            "run": false
        })
    }

    return <div className="px-2 py-1 flex items-center">{isConnected?'1':'0'}</div>
})

export default DaRemoteCompileRust