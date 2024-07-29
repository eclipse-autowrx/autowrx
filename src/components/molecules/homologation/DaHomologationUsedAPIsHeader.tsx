import { useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { TbHelp, TbSquare, TbSquareCheck, TbX } from 'react-icons/tb'
import { Tooltip } from '@mui/material'
import { VehicleAPI } from '@/types/api.type'
import { supportedCertivityApis } from '@/services/certivity.service'
import { DaButton } from '@/components/atoms/DaButton'

type HomologationUsedAPIsHeaderProps = {
  selectedAPIs: Set<VehicleAPI>
  setSelectedAPIs: (apis: Set<VehicleAPI>) => void
  usedAPIs: VehicleAPI[]
}

const HomologationUsedAPIsHeader = ({
  selectedAPIs,
  setSelectedAPIs,
  usedAPIs,
}: HomologationUsedAPIsHeaderProps) => {
  const currentSupportedAPIs = useMemo(() => {
    return usedAPIs.filter((api) => supportedCertivityApis.has(api.name))
  }, [usedAPIs])

  const selectAllHandler = () => {
    if (selectedAPIs.size !== currentSupportedAPIs.length) {
      setSelectedAPIs(new Set(currentSupportedAPIs))
    } else {
      setSelectedAPIs(new Set([]))
    }
  }

  useEffect(() => {
    if (currentSupportedAPIs.length > 0) {
      setSelectedAPIs(new Set([currentSupportedAPIs[0]]))
    } else {
      setSelectedAPIs(new Set([]))
    }
  }, [setSelectedAPIs, currentSupportedAPIs])

  return (
    <div className="items-center -mt-1 flex flex-shrink-0 mb-1">
      {/* Title */}
      <h1 className="da-label-title text-da-black">
        Used Signals
        {usedAPIs.length > 0 && ` (${usedAPIs.length})`}
      </h1>

      {/* Select all button */}
      <DaButton
        variant="plain"
        size="sm"
        className={clsx(
          'ml-auto mb-0.5 rounded-lg px-2 transition',
          selectedAPIs.size === currentSupportedAPIs.length &&
            selectedAPIs.size > 0 &&
            'bg-gray-300',
          currentSupportedAPIs.length === 0 && 'pointer-events-none opacity-50',
        )}
        onClick={selectAllHandler}
      >
        <span className="da-label-tiny">Select all</span>
        {selectedAPIs.size === currentSupportedAPIs.length &&
        selectedAPIs.size > 0 ? (
          <TbSquareCheck className="ml-1 mt-0.5" />
        ) : (
          <TbSquare className="ml-1 mt-0.5" />
        )}
      </DaButton>

      {/* Clear selections button */}
      <DaButton
        variant="plain"
        size="sm"
        onClick={() => setSelectedAPIs(new Set([]))}
        className={clsx(
          'ml-2 mb-0.5 rounded-lg px-2 transition',
          selectedAPIs.size === 0 && 'pointer-events-none opacity-50',
        )}
      >
        <span className="da-label-tiny flex">
          Clear
          {selectedAPIs.size !== 0 ? selectedAPIs.size : ''} selection
          {selectedAPIs.size > 1 && 's'} <TbX className="mt-0.5 text-sm ml-1" />
        </span>
      </DaButton>

      {/* Help tooltip (show help about not supported APIs) */}
      <Tooltip
        title={`Some signal are not yet supported (${
          usedAPIs.filter(
            (api) => !supportedCertivityApis.has('Vehicle' + api.shortName),
          ).length
        })`}
      >
        <button className="ml-3 text-gray-500 text-xl hover:text-aiot-blue transition">
          <TbHelp />
        </button>
      </Tooltip>
    </div>
  )
}

export default HomologationUsedAPIsHeader
