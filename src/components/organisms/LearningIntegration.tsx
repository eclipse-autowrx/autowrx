import { useEffect, useRef, useState } from 'react'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import config from '@/configs/config'
import useAuthStore from '@/stores/authStore'
import useGlobalStore from '@/stores/globalStore'
import { shallow } from 'zustand/shallow'

interface LearningIntegrationProps {
  requestClose: () => void
}

const LearningIntegration = ({requestClose}: LearningIntegrationProps) => {
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
      className={`fixed  top-0 left-0 bottom-0 right-0 bg-[#11111188] ${isMinimized ? 'genie-minimize' : 'genie-restore'}`}
    >
      <div className="w-full h-full pt-6 pl-6 pr-6 pb-2 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={requestClose}
          className="absolute top-0.5 right-0.5 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 
              text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
          title="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
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
