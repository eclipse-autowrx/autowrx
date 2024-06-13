import React, { useMemo } from 'react'
import { TbExternalLink } from 'react-icons/tb'
import { useParams } from 'react-router-dom'
import useCurrentModel from '@/hooks/useCurrentModel'
import { convertJSONToProperty } from '@/lib/vehiclePropertyUtils'
import DaViewVehicleProperty from '../DaViewVehicleProperty'

const HomologationVehicleProperties = () => {
  const { id } = useParams()

  const { data: model } = useCurrentModel()

  const customProperties = useMemo(() => {
    if (model?.property) {
      return convertJSONToProperty(model.property)
    }
    return []
  }, [model?.property])

  if (!model) return null

  return (
    <div className="rounded-3xl h-full flex flex-col bg-da-gray-light/20 p-5">
      <div className="mb-1 flex justify-between flex-shrink-0 items-center">
        <h1 className="da-label-sub-title text-da-black">Vehicle Properties</h1>
        <a
          href={`/model/${id}`}
          target="__blank"
          className="hover:text-aiot-blue text-gray-700 transition text-sm flex items-center gap-1"
        >
          <TbExternalLink />
          Detail
        </a>
      </div>
      <div className="flex-1 min-h-0 h-full flex justify-center flex-col overflow-y-auto scroll-gray">
        <DaViewVehicleProperty
          customProperties={customProperties}
          vehicleCategory={model.vehicle_category}
        />
      </div>
    </div>
  )
}

export default HomologationVehicleProperties
