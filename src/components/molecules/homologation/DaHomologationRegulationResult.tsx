import { useEffect, useState } from 'react'

import clsx from 'clsx'
import { RegulationRegion } from './types'
import HomologationRegulationResultList from './DaHomologationRegulationResultList'
import DaLoader from '@/components/atoms/DaLoader'
import { VehicleAPI } from '@/types/api.type'
import {
  Regulation,
  getCertivityRegulationsService,
  supportedCertivityApis,
  supportedCertivityApis_v4_map,
} from '@/services/certivity.service'

type HomologationRegulationResultProps = {
  selectedAPIs: Set<VehicleAPI>
}

const HomologationRegulationResult = ({
  selectedAPIs,
}: HomologationRegulationResultProps) => {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [regulationRegions, setRegulationRegions] = useState<
    RegulationRegion[]
  >([])

  // Separate regulations by region, type and regulation
  const formatRegulations = (regulations: Regulation[]) => {
    let formattedRegulations: RegulationRegion[] = []

    regulations.forEach((regulation) => {
      // Regulation Region
      let region = formattedRegulations.find(
        (r) => r.name === regulation.region,
      )
      if (!region) {
        region = {
          name: regulation.region,
          types: [],
        }
        formattedRegulations.push(region)
      }

      // Regulation Type
      let type = region.types.find((t) => t.name === regulation.type)
      if (!type) {
        type = {
          name: regulation.type,
          regulations: [],
        }
        region.types.push(type)
      }

      // Regulation
      type.regulations.push({
        key: regulation.key,
        titleShort: regulation.titleShort,
        titleLong: regulation.titleLong,
      })
    })

    // Sort regulations by key
    formattedRegulations.forEach((region) => {
      region.types.forEach((type) => {
        type.regulations.sort((a, b) => {
          try {
            const aNum = parseInt(a.key.replace(/^[^0-9]+/g, ''))
            const bNum = parseInt(b.key.replace(/^[^0-9]+/g, ''))
            return aNum - bNum
          } catch (error) {
            return a.key.localeCompare(b.key)
          }
        })
      })
    })

    return formattedRegulations
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        // Fetch regulations based on used APIs
        if (selectedAPIs.size > 0) {
          // const credentials = await retrieveCertivityCredentials();

          const regulationsResponse = await getCertivityRegulationsService(
            Array.from(selectedAPIs.values())
              .map((api) => {
                return supportedCertivityApis.has(api.name)
                  ? api.name
                  : supportedCertivityApis_v4_map[api.name]
              })
              .filter((value) => supportedCertivityApis.has(value)),
          )
          if (!regulationsResponse) throw new Error('No regulations found')
          setRegulationRegions(formatRegulations(regulationsResponse))

          setErrorMsg('')
        } else {
          setRegulationRegions([])
        }
      } catch (error) {
        setErrorMsg('Error fetching regulations')
        console.error(error)
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedAPIs])

  return (
    <div className="flex h-full w-full overflow-y-auto pr-5 pt-5">
      <div
        className={clsx(
          ' p-5 w-full h-full min-h-[calc(100%-40px)] rounded-3xl',
          (errorMsg || regulationRegions.length === 0 || loading) &&
            'h-[calc(100%-40px)]',
        )}
      >
        <h1 className="da-label-title text-da-gray-dark mb-2">
          Regulatory Compliance
        </h1>
        {loading ? (
          <div className="flex items-center justify-center h-[calc(100%-50px)]">
            <DaLoader />
          </div>
        ) : (
          <div
            className={clsx(
              'space-y-7 mt-4',
              (errorMsg || regulationRegions.length === 0) &&
                'flex items-center justify-center h-[calc(100%-60px)]',
            )}
          >
            {errorMsg ? (
              <div className="h-full w-full flex items-center justify-center italic text-da-gray-medium">
                {'<' + errorMsg + '>'}
              </div>
            ) : regulationRegions.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center italic text-da-gray-medium">
                {'<Please select a supported API>'}
              </div>
            ) : (
              <HomologationRegulationResultList
                regulationRegions={regulationRegions}
              />
            )}
          </div>
        )}
      </div>
      <div className="h-3" />
    </div>
  )
}

export default HomologationRegulationResult
