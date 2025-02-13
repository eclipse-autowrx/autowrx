import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import DaText from '@/components/atoms/DaText'
import { useEffect, useMemo, useState } from 'react'
import SystemInterfaceFields from './SystemInterfaceFields'
import { DaButton } from '@/components/atoms/DaButton'
import { TbPlus } from 'react-icons/tb'

import { CreateInventoryItem } from '@/types/inventory.type'

type FormInventoryItemProps = {
  data?: CreateInventoryItem
  onChange?: (data: CreateInventoryItem) => void
  onSubmit?: (data: CreateInventoryItem) => void
}

const defaultData: CreateInventoryItem = {
  details: {},
  name: '',
  type: 'system_interface',
  visibility: 'private',
}

const FormInventoryItem = ({
  data,
  onChange,
  onSubmit,
}: FormInventoryItemProps) => {
  const [innerData, setInnerData] = useState(defaultData)

  useEffect(() => {
    if (data) {
      setInnerData(data)
    }
  }, [data])

  // useEffect(() => {
  //   try {
  //     ajv.addSchema(interfaceDetailSchema, 'interface_detail')
  //   } catch (error) {}
  //   try {
  //     ajv.addSchema(systemActivitySchema, 'system_activity')
  //   } catch (error) {}
  //   try {
  //     ajv.addSchema(flowHeadersSchema, 'flow_headers')
  //   } catch (error) {}
  //   try {
  //     ajv.addSchema(systemInterfaceSchema, 'system_interface')
  //   } catch (error) {}
  // }, [])

  const handleInventoryTypeChange = (value: string) => {
    setInnerData((prev) => ({
      ...prev,
      type: value,
    }))
    onChange?.({
      ...innerData,
      type: value,
    })
    // switch (value) {
    //   case 'system_interface':
    //     setCurrentSchema(systemInterfaceSchema)
    //     break
    //   case 'system_activity':
    //     setCurrentSchema(systemActivitySchema)
    //     break
    //   case 'flow_headers':
    //     setCurrentSchema(
    //       flowHeadersSchema as unknown as JSONSchemaType<FlowHeaders>,
    //     )
    //     break
    // }
  }

  const UIFields = useMemo(() => {
    switch (innerData.type) {
      case 'system_interface':
        return SystemInterfaceFields
      default:
        return SystemInterfaceFields
    }
  }, [innerData.type])

  const handleChange = (key: string, value: any) => {
    setInnerData((prev) => ({
      ...prev,
      [key]: value,
    }))
    onChange?.({
      ...innerData,
      [key]: value,
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit?.(innerData)
    console.log(innerData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="container flex items-center gap-2 py-4">
        <DaText className="text-da-primary-500" variant="title">
          New Inventory Item
        </DaText>
      </div>

      <div className="border-b" />

      <div className="container flex lg:flex-row flex-col m-auto gap-14 py-6">
        <div className="flex flex-col flex-[6] min-w-0 gap-4">
          <div className="border h-fit shadow rounded-lg">
            <div className="border-b h-[54px] flex items-center px-4">
              <DaText variant="regular-bold" className="!text-da-gray-darkest">
                Basic Information
              </DaText>
            </div>
            <div className="pb-6 px-4 pt-4">
              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Name *
              </DaText>
              <DaInput
                className="mt-1"
                inputClassName="text-sm text-da-gray-darkest"
                placeholder="Inventory Item Name"
                value={innerData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />

              <div className="mt-3" />

              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Visibility *
              </DaText>
              <DaSelect
                value={innerData.visibility}
                onValueChange={(value) => handleChange('visibility', value)}
                className="mt-1 text-sm text-da-gray-darkest"
              >
                <DaSelectItem className="text-sm" value="private">
                  Private
                </DaSelectItem>
                <DaSelectItem className="text-sm" value="public">
                  Public
                </DaSelectItem>
              </DaSelect>
            </div>
          </div>

          <div className="border h-fit shadow rounded-lg">
            <div className="justify-between border-b h-[54px] flex items-center px-4">
              <DaText variant="regular-bold" className="!text-da-gray-darkest">
                Inventory Type
              </DaText>
              <DaButton
                type="button"
                variant="text"
                className="!px-0 !text-da-primary-500"
              >
                <TbPlus className="mr-1" /> Add Type
              </DaButton>
            </div>
            <div className="pb-6 px-4 pt-4">
              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Type *
              </DaText>
              <DaSelect
                value={innerData.type}
                onValueChange={handleInventoryTypeChange}
                className="mt-1 text-sm text-da-gray-darkest"
              >
                <DaSelectItem className="text-sm" value="system_interface">
                  System Interface
                </DaSelectItem>
                <DaSelectItem className="text-sm" value="system_activity">
                  System Activity
                </DaSelectItem>
                <DaSelectItem className="text-sm" value="flow_headers">
                  Flow Headers
                </DaSelectItem>
              </DaSelect>
            </div>
          </div>

          <div className="border min-w-0 h-fit shadow rounded-lg text-sm">
            <div className="border-b h-[54px] flex items-center px-5">
              <DaText variant="regular-bold" className="!text-da-gray-darkest">
                Inventory Details
              </DaText>
            </div>
            <div className="pb-6 px-5 pt-4">
              <UIFields
                onChange={(details) =>
                  setInnerData((prev) => ({
                    ...prev,
                    details,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="border h-fit shadow flex-[4] rounded-lg">
          <div className="border-b h-[54px] flex items-center px-4">
            <DaText variant="regular-bold" className="!text-da-gray-darkest">
              Summary
            </DaText>
          </div>
          <div className="pb-4 px-4 pt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Name
            </DaText>
            <DaText className="block" variant="small">
              New Inventory Item
            </DaText>

            <div className="mt-3" />
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Visibility
            </DaText>
            <DaText className="block" variant="small">
              Private
            </DaText>

            <div className="mt-3" />
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Interface Name
            </DaText>
            <DaText className="block" variant="small">
              Vehicle.ADAS
            </DaText>

            <div className="mt-3" />
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Allowed
            </DaText>
            <DaText className="block" variant="small">
              ACTIVE, INACTIVE
            </DaText>
          </div>
          <div className="border-t justify-between flex items-center py-3 px-4">
            <DaButton type="button" variant="outline-nocolor" className="">
              Cancel
            </DaButton>
            <DaButton className="">Create Item</DaButton>
          </div>
        </div>
      </div>
    </form>
  )
}

export default FormInventoryItem
