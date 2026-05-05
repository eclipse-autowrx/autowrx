import useModelStore from '@/stores/modelStore'
import { shallow } from 'zustand/shallow'
import { Prototype } from '@/types/model.type'
import usePrototypeTabVSCodeResizer from '@/hooks/usePrototypeTabVSCodeResizer'
import usePrototypeTabVSCodeWorkspace from '@/hooks/usePrototypeTabVSCodeWorkspace'

export default function usePrototypeTabVSCodeViewModel(isActive: boolean) {
  const {
    prepareError,
    watchEvents,
    logEvents,
    workspaceAppUrl,
    shouldMountIframe,
    showIframe,
    handleIframeLoad,
    handleIframeError,
  } = usePrototypeTabVSCodeWorkspace(isActive)

  const {
    containerRef,
    resizeRef,
    isResizing,
    isApiPanelCollapsed,
    setIsApiPanelCollapsed,
    rightPanelWidthStyle,
    handleMouseDown,
  } = usePrototypeTabVSCodeResizer(isActive)

  const [prototype] = useModelStore(
    (state) => [state.prototype as Prototype],
    shallow,
  )

  return {
    containerRef,
    resizeRef,
    isResizing,
    isApiPanelCollapsed,
    setIsApiPanelCollapsed,
    rightPanelWidthStyle,
    handleMouseDown,

    prototypeCode: prototype?.code || '',

    prepareError,
    watchEvents,
    logEvents,

    workspaceAppUrl,
    shouldMountIframe,
    showIframe,
    handleIframeLoad,
    handleIframeError,
  }
}

