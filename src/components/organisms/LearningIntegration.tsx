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

  useEffect(() => {
    if(frameLearning && frameLearning.current) {
        frameLearning.current.contentWindow?.postMessage(JSON.stringify({
            "cmd": "update-from-host",
            "isShowedAutomationControl": isShowedAutomationControl,
            "automationSequence": automationSequence,
        }), '*')
    }
  }, [isShowedAutomationControl])

  return (
    <div
      style={{ zIndex: 999 }}
      className="fixed top-14 left-0 bottom-0 right-0 
           bg-[#11111188]"
    >
      <div className="pt-1 pl-3 pr-3 pb-1 w-full h-full">
        <iframe
          ref={frameLearning}
          src={`${config?.learning?.url}?user_id=${encodeURIComponent(user?.id || '')}&token=${encodeURIComponent(access?.token || '')}`}
          className="m-0 h-full w-full learning-appear inset-0 shadow-[4px_4px_6px_rgba(0,0,0,0.3)]"
          allow="camera;microphone"
          onLoad={() => {}}
        ></iframe>
      </div>
    </div>
  )
}

export default LearningIntegration
