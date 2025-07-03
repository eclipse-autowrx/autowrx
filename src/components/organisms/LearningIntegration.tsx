import { useEffect, useRef, useState } from 'react'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import config from '@/configs/config'
import useAuthStore from '@/stores/authStore'
import useGlobalStore from '@/stores/globalStore'
import { shallow } from 'zustand/shallow'

const LearningIntegration = () => {
  const { data: user } = useSelfProfileQuery()
  const { access } = useAuthStore()
  const frameLearning = useRef<HTMLIFrameElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const [
    isShowedAutomationControl,
    automationSequence,
    setIsShowedAutomationControl,
    setAutomationSequence,
    setAutomationSequenceActionAt,
  ] = useGlobalStore(
    (state) => [
      state.isShowedAutomationControl,
      state.automationSequence,
      state.setIsShowedAutomationControl,
      state.setAutomationSequence,
      state.setAutomationSequenceActionAt,
    ],
    shallow,
  )

  const startListeningForAutomationControl = () => {

    // method 2, listen for messages window.postMessage, this can be post from iframe or other windows
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'automation_control') {
        if(event.data?.sequence?.trigger_source === 'learning') {
          setIsMinimized(true)
        }
      }
    })
  }

  useEffect(() => {
    startListeningForAutomationControl()
  }, [])

  useEffect(() => {
    if(frameLearning && frameLearning.current) {
        frameLearning.current.contentWindow?.postMessage(JSON.stringify({
            "cmd": "update-from-host",
            "isShowedAutomationControl": isShowedAutomationControl,
            "automationSequence": automationSequence,
        }), '*')
    }
    if(!isShowedAutomationControl) {
      setIsMinimized(false)
    }
  }, [isShowedAutomationControl, automationSequence])

  return (
    <div
      style={{ zIndex: 999 }}
      className={`fixed top-16 left-4 bottom-4 right-4 bg-[#11111188] ${isMinimized ? 'genie-minimize' : 'genie-restore'}`}
    >
      <div className="w-full h-full shadow-2xl">
        <iframe
          ref={frameLearning}
          src={`${config?.learning?.url}?user_id=${encodeURIComponent(user?.id || '')}&token=${encodeURIComponent(access?.token || '')}`}
          className="m-0 h-full w-full learning-appear1 inset-0 shadow-[4px_4px_6px_rgba(0,0,0,0.3)]"
          allow="camera;microphone"
          onLoad={() => {}}
        ></iframe>
      </div>
    </div>
  )
}

export default LearningIntegration
