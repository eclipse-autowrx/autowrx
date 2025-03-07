import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import DaText from '@/components/atoms/DaText'
import { Fragment, useEffect, useMemo, useState } from 'react'
import FieldsSystemInterface from './FieldsSystemInterface'
import { DaButton } from '@/components/atoms/DaButton'
import { TbPlus, TbReload } from 'react-icons/tb'
import { CreateInventoryItem } from '@/types/inventory.type'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import clsx from 'clsx'

type FormInventoryItemProps = {
  data?: CreateInventoryItem
  onChange?: (data: CreateInventoryItem) => void
  onSubmit?: (data: CreateInventoryItem) => void
}

const defaultData: CreateInventoryItem = {
  // details: {},
  name: '',
  type: 'system_interface',
  // visibility: 'private',
}

const FormInventoryItem = ({
  data,
  onChange,
  onSubmit,
}: FormInventoryItemProps) => {
  const [innerData, setInnerData] = useState(defaultData)
  const [detailSummary, setDetailSummary] = useState<Record<
    string,
    { name: string; value: string }
  > | null>(null)

  useEffect(() => {
    if (data) {
      setInnerData(data)
    }
  }, [data])

  const handleInventoryTypeChange = (value: string) => {
    setInnerData((prev) => ({
      ...prev,
      type: value,
    }))
    onChange?.({
      ...innerData,
      type: value,
    })
  }

  const UIFields = useMemo(() => {
    switch (innerData.type) {
      case 'system_interface':
        return FieldsSystemInterface
      default:
        return FieldsSystemInterface
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

              {/* <DaText variant="small-bold" className="!text-da-gray-darkest">
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
              </DaSelect> */}

              <div className="mt-3" />

              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Image
              </DaText>
              <DaFileUpload
                onFileUpload={(url) =>
                  setInnerData((prev) => ({
                    ...prev,
                    image: url,
                  }))
                }
                isImage={true}
                className={clsx(
                  'mt-1',
                  innerData.image && 'w-full max-w-[140px]',
                )}
                imgClassName="object-cover w-full aspect-square max-w-[140px]"
                accept="image/*"
              />
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
                className="!px-0 !text-sm !text-da-primary-500"
                onClick={() => window.open('/inventory/type', '_blank')}
              >
                <TbPlus className="mr-1" /> Add Type
              </DaButton>
            </div>
            <div className="pb-6 px-4 pt-4">
              <div className="flex justify-between items-center">
                <DaText variant="small-bold" className="!text-da-gray-darkest">
                  Type *
                </DaText>
                <TbReload className="text-da-gray-dark cursor-pointer" />
              </div>
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
                onSummaryChange={(summary) => setDetailSummary(summary)}
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

        <div className="border h-fit shadow flex-[4] max-w-[512px] rounded-lg">
          <div className="border-b h-[54px] flex items-center px-4">
            <DaText variant="regular-bold" className="!text-da-gray-darkest">
              Summary
            </DaText>
          </div>
          <div className="pb-4 px-4">
            {innerData.name && (
              <>
                <div className="mt-3" />
                <DaText variant="small-bold" className="!text-da-gray-darkest">
                  Name
                </DaText>
                <DaText className="block" variant="small">
                  {innerData.name}
                </DaText>
              </>
            )}

            {/* <div className="mt-3" />
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Visibility
            </DaText>
            <DaText className="block" variant="small">
              {innerData.visibility.at(0)?.toUpperCase() +
                innerData.visibility.slice(1)}
            </DaText> */}

            {innerData.image && (
              <>
                <div className="mt-3" />
                <DaText variant="small-bold" className="!text-da-gray-darkest">
                  Image
                </DaText>{' '}
                <object
                  data={innerData.image}
                  className="mt-1 w-full max-w-[140px] rounded-md object-cover aspect-square"
                >
                  <img
                    src="/imgs/default_photo.jpg"
                    alt={innerData.name}
                    className="rounded w-full h-full text-sm object-cover"
                  />
                </object>
              </>
            )}

            {detailSummary && (
              <>
                <div className="mt-3" />
                <DaText variant="small-bold" className="!text-da-gray-darkest">
                  Inventory Details
                </DaText>
                <div className="mt-1 border rounded-md px-3 pb-3 pt-2">
                  {Object.entries(detailSummary).map(([key, data], index) => (
                    <Fragment key={key}>
                      <DaText
                        variant="small-bold"
                        className="!text-da-gray-darkest"
                      >
                        {data.name}
                      </DaText>
                      <DaText className="block" variant="small">
                        {data.value}
                      </DaText>

                      {index < Object.keys(detailSummary).length - 1 && (
                        <div className="mt-3" />
                      )}
                    </Fragment>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="border-t justify-between flex items-center py-3 px-4">
            <DaButton
              type="button"
              variant="outline-nocolor"
              className="!text-sm"
            >
              Cancel
            </DaButton>
            <DaButton className="!text-sm !px-4">Create Item</DaButton>
          </div>
        </div>
      </div>
    </form>
  )
}

export default FormInventoryItem
