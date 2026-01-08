import { useEffect, useRef, useState } from 'react'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useSiteConfig } from '@/utils/siteConfig'
import useAuthStore from '@/stores/authStore'
import useGlobalStore from '@/stores/globalStore'
import { shallow } from 'zustand/shallow'

interface LearningIntegrationProps {
  requestClose: () => void
}

const LearningIntegration = ({ requestClose }: LearningIntegrationProps) => {
  const { data: user } = useSelfProfileQuery()
  const { access } = useAuthStore()
  const frameLearning = useRef<HTMLIFrameElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const learningUrl = useSiteConfig('LEARNING_MODE_URL', '')

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
    shallow
  )

  const startListeningForAutomationControl = () => {
    // method 2, listen for messages window.postMessage, this can be post from iframe or other windows
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'automation_control') {
        if (event.data?.sequence?.trigger_source === 'learning') {
          setIsMinimized(true)
        }
      }

      if (event.data && event.data === 'exit_iframe') {
        requestClose()
      }
    })
  }

  useEffect(() => {
    startListeningForAutomationControl()
  }, [])

  useEffect(() => {
    if (frameLearning && frameLearning.current) {
      frameLearning.current.contentWindow?.postMessage(
        JSON.stringify({
          cmd: 'update-from-host',
          isShowedAutomationControl: isShowedAutomationControl,
          automationSequence: automationSequence,
        }),
        '*'
      )
    }
    if (!isShowedAutomationControl) {
      setIsMinimized(false)
    }
  }, [isShowedAutomationControl, automationSequence])

  if (!learningUrl) return null

  return (
    <div
      style={{ zIndex: 999 }}
      className={`fixed top-0 left-0 bottom-0 right-0 bg-[#11111188] ${
        isMinimized ? 'genie-minimize' : 'genie-restore'
      }`}
    >
      <div className="w-full h-full pt-6 pl-6 pr-6 pb-2 shadow-2xl relative">
        <iframe
          ref={frameLearning}
          src={`${learningUrl}?user_id=${encodeURIComponent(
            user?.id || ''
          )}&token=${encodeURIComponent(access?.token || '')}`}
          className="m-0 h-full w-full inset-0 shadow-[4px_4px_6px_rgba(0,0,0,0.3)] bg-white rounded-lg"
          allow="camera;microphone"
          onLoad={() => {}}
        ></iframe>
      </div>
    </div>
  )
}

export default LearningIntegration

