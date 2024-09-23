import { useCallback, useEffect, useState } from 'react'
import HomologationUsedAPIsHeader from './DaHomologationUsedAPIsHeader'
import { VehicleAPI } from '@/types/api.type'
import useCurrentModel from '@/hooks/useCurrentModel'
import { supportedCertivityApis } from '@/services/certivity.service'
import DaHomologationApiListItem from './DaHomologationApiListItem'
import { CVI } from '@/data/CVI'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import { parseCvi_alt } from '@/lib/utils'

type DaHomologationUsedAPIsProps = {
  selectedAPIs: Set<VehicleAPI>
  setSelectedAPIs: (apis: Set<VehicleAPI>) => void
}

const DaGenAI_HomologationUsedAPIs = ({
  selectedAPIs,
  setSelectedAPIs,
}: DaHomologationUsedAPIsProps) => {
  const [usedAPIs, setUsedAPIs] = useState<VehicleAPI[]>([])
  const { wizardPrototype: prototype } = useWizardGenAIStore()

  const fetchAPIs = useCallback(async () => {
    const parsedCviData = typeof CVI === 'string' ? JSON.parse(CVI) : CVI
    const parsedApiList = parseCvi_alt(parsedCviData)
    console.log('Parsed API List: ', parsedApiList)
    return parsedApiList
  }, [CVI, parseCvi_alt])

  // Sort by supported and not supported APIs
  const compareFn = useCallback((a: VehicleAPI, b: VehicleAPI) => {
    const aIsSupported = supportedCertivityApis.has('Vehicle' + a.shortName)
    const bIsSupported = supportedCertivityApis.has('Vehicle' + b.shortName)
    if (Number(aIsSupported) < Number(bIsSupported)) return 1
    if (Number(aIsSupported) > Number(bIsSupported)) return -1
    return a.name.localeCompare(b.name)
  }, [])

  useEffect(() => {
    ;(async () => {
      if (prototype?.code) {
        const allAPIs = await fetchAPIs()
        console.log('GenAI Homo:', allAPIs)
        console.log('GenAI Homo Code: ', prototype.code)
        const res: VehicleAPI[] = []
        for (let api of allAPIs) {
          if (api.shortName && prototype.code.includes(api.shortName)) {
            console.log('Api used: ', api)
            res.push(api)
          }
        }

        return setUsedAPIs(res.sort(compareFn))
      }
      setUsedAPIs([])
    })()
  }, [CVI])

  useEffect(() => {
    console.log('Used api: ', usedAPIs)
  }, [usedAPIs])

  const selectAPIHandler = (api: VehicleAPI) => () => {
    if (selectedAPIs.has(api)) {
      selectedAPIs.delete(api)
    } else {
      selectedAPIs.add(api)
    }
    setSelectedAPIs(new Set(selectedAPIs))
  }

  const getRoundedClassesOfRow = useCallback(
    (index: number) => {
      const res: string[] = []
      if (!selectedAPIs.has(usedAPIs[index])) {
        res.push('rounded-lg')
        return res
      }
      if (index === 0) res.push('rounded-t-lg')
      if (index === usedAPIs.length - 1) res.push('rounded-b-lg')
      if (
        index + 1 >= usedAPIs.length ||
        !selectedAPIs.has(usedAPIs[index + 1])
      )
        res.push('rounded-b-lg')
      if (index - 1 < 0 || !selectedAPIs.has(usedAPIs[index - 1]))
        res.push('rounded-t-lg')
      return res
    },
    [selectedAPIs, usedAPIs],
  )

  return (
    <div className="rounded-3xl flex flex-col w-full bg-da-gray-light/20 px-5 pt-5 pb-3 h-full text-da-gray-medium">
      <HomologationUsedAPIsHeader
        selectedAPIs={selectedAPIs}
        setSelectedAPIs={setSelectedAPIs}
        usedAPIs={usedAPIs}
      />

      {/* List of used APIs */}
      {usedAPIs.length > 0 ? (
        <ul className="flex-1 min-h-0 overflow-y-auto scroll-gray -mx-2">
          {usedAPIs.map((api, index) => (
            <div key={api.name}>
              <DaHomologationApiListItem
                api={{
                  ...api,
                  name: api.name,
                }}
                onClick={selectAPIHandler(api)}
                isSelected={selectedAPIs.has(api)}
                className={getRoundedClassesOfRow(index).join(' ')}
                isDisabled={
                  !supportedCertivityApis.has('Vehicle' + api.shortName)
                }
              />
            </div>
          ))}
        </ul>
      ) : (
        <div className="da-label-small h-full flex italic items-center text-da-gray-medium justify-center py-6">
          {'<'}No APIs used{'>'}
        </div>
      )}
    </div>
  )
}

export default DaGenAI_HomologationUsedAPIs
