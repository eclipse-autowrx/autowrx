import { DaAvatar } from '@/components/atoms/DaAvatar'
import { DaButton } from '@/components/atoms/DaButton'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import DaText from '@/components/atoms/DaText'
import { InventoryItem } from '@/types/inventory.type'
import dayjs from 'dayjs'
import { useState } from 'react'
import {
  TbChevronDown,
  TbEdit,
  TbExternalLink,
  TbEye,
  TbEyeOff,
} from 'react-icons/tb'
import { Link } from 'react-router-dom'
import SyntaxHighlighter from 'react-syntax-highlighter'

const data: InventoryItem = {
  id: '12afwaefj1231jfkawef',
  name: 'ADAS System',
  visibility: 'public',
  type: {
    createdAt: '2021-09-01T00:00:00.000Z',
    updatedAt: '2021-09-01T00:00:00.000Z',
    id: '1rfwe1',
    name: 'System Interface',
    description: 'System Interface',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
        details: {
          type: 'object',
          nullable: true,
          oneOf: [
            {
              type: 'object',
              properties: {
                reference: {
                  type: 'string',
                  model: { type: 'string', nullable: true },
                  apiName: { type: 'string', nullable: true },
                },
              },
              required: ['reference'],
              additionalProperties: false,
            },
            {
              type: 'object',
              $ref: 'interface_detail',
            },
          ],
        },
      },
      required: ['type'],
    },
  },
  details: {
    name: 'Vehicle.ADAS',
    description: 'Advanced Driver Assistance System',
  },
  image: 'https://i.redd.it/3z3lk8ouwjjc1.jpeg',
  created_by: {
    id: '1',
    name: 'Tuan Hoang Dinh Anh',
    image_file: 'https://i.redd.it/3z3lk8ouwjjc1.jpeg',
  },
  createdAt: '2021-09-01T00:00:00.000Z',
  updatedAt: '2021-09-01T00:00:00.000Z',
}

const PageInventoryItemDetail = () => {
  const [showDetail, setShowDetail] = useState(false)

  const titleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
    )
  }

  return (
    <div className="container text-sm pb-10 text-da-gray-dark">
      {/* Header */}
      <div className="mt-5 flex gap-2 items-end py-3">
        <div className="flex flex-col gap-2">
          <DaText variant="title" className="!block text-da-primary-500">
            {data.name}
          </DaText>
          <div className="text-sm flex gap-2">
            <span>{data.type?.name}</span>
            <span>•</span>
            <span>
              {data.visibility.at(0)?.toUpperCase() + data.visibility.slice(1)}
            </span>
          </div>
        </div>

        <DaButton
          size="sm"
          variant="outline-nocolor"
          className="ml-auto !text-xs !text-da-gray-dark"
        >
          <TbEdit className="w-4 h-4 mr-1" />
          Edit
        </DaButton>
        <DaButton
          size="sm"
          variant="outline-nocolor"
          className="!text-xs !text-da-gray-dark"
        >
          <TbChevronDown className="w-4 h-4 mr-1" />
          More
        </DaButton>
      </div>

      <div className="border-t border-t-da-gray-light/50 my-6" />

      <DaText variant="regular-bold" className="text-da-gray-darkest">
        Basic Information
      </DaText>
      <div className="flex md:flex-row flex-col gap-4 justify-between pt-5">
        <div className="flex flex-col gap-4">
          <div>
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[140px]"
            >
              Name
            </DaText>
            <DaText variant="small" className="!text-da-gray-darkest">
              {data.name}
            </DaText>
          </div>
          <div>
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[140px]"
            >
              Description
            </DaText>
            <DaText variant="small" className="!text-da-gray-darkest">
              {data.description || '-'}
            </DaText>
          </div>
          <div>
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[140px]"
            >
              Visibility
            </DaText>
            <DaText variant="small" className="!text-da-gray-darkest">
              {data.visibility.at(0)?.toUpperCase() + data.visibility.slice(1)}
            </DaText>
          </div>
          <div>
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[140px]"
            >
              Created At
            </DaText>
            <DaText variant="small" className="!text-da-gray-darkest">
              {dayjs(data.createdAt).format('DD MMM YYYY - HH:mm')}
            </DaText>
          </div>
          <div>
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[140px]"
            >
              Updated At
            </DaText>
            <DaText variant="small" className="!text-da-gray-darkest">
              {dayjs(data.updatedAt).format('DD MMM YYYY - HH:mm')}
            </DaText>
          </div>
          <div className="flex items-center">
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[140px]"
            >
              Owner
            </DaText>
            <button className="flex cursor-pointer items-center hover:underline gap-2">
              <DaAvatar className="h-7 w-7" src={data.created_by?.image_file} />
              <p className="text-sm text-da-gray-darkest">
                {data.created_by?.name}
              </p>
            </button>
          </div>
        </div>

        <DaFileUpload
          image={data.image}
          isImage
          className="w-[200px] h-[200px]"
          imgClassName="object-cover !h-full !w-full"
        />
      </div>

      <div className="border-t border-t-da-gray-light/50 my-6" />
      <DaText variant="regular-bold" className="text-da-gray-darkest">
        Inventory Type
      </DaText>
      <div className="flex flex-col items-start pt-5 gap-4">
        <div className="flex items-center">
          <DaText
            variant="small"
            className="inline-block text-da-gray-dark w-[140px]"
          >
            Type
          </DaText>
          <DaText variant="small" className="!text-da-gray-darkest">
            {data.type?.name || '-'}
          </DaText>
          <Link to="/inventory/type/abcd" target="_blank">
            <DaButton variant="text" size="sm" className="ml-4">
              <TbExternalLink className="w-4 h-4 mr-1" /> Detail
            </DaButton>
          </Link>
        </div>

        <div>
          <DaText
            variant="small"
            className="inline-block text-da-gray-dark w-[140px]"
          >
            Description
          </DaText>
          <DaText variant="small" className="!text-da-gray-darkest">
            {data.type?.description || '-'}
          </DaText>
        </div>

        <div className="w-full">
          <DaButton
            onClick={() => setShowDetail((prev) => !prev)}
            size="sm"
            variant="text"
            className="!px-0 m-0"
          >
            {showDetail ? (
              <TbEyeOff className="h-4 w-4 mr-1" />
            ) : (
              <TbEye className="w-4 h-4 mr-1" />
            )}{' '}
            {showDetail ? 'Hide' : 'Show'} Detail Schema
          </DaButton>
          {showDetail && (
            <div className="border mt-1 rounded-md p-2 w-full">
              <SyntaxHighlighter className="!bg-white">
                {JSON.stringify(data.type?.schema || {}, null, 4)}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-t-da-gray-light/50 my-6" />
      <DaText variant="regular-bold" className="text-da-gray-darkest">
        Inventory Details
      </DaText>
      <div className="flex flex-col items-start pt-5 gap-4">
        {Object.entries(data.details || {}).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[140px]"
            >
              {titleCase(key)}
            </DaText>
            <DaText variant="small" className="!text-da-gray-darkest">
              {typeof value === 'string' && value}
            </DaText>
          </div>
        ))}
      </div>

      <div className="border-t border-t-da-gray-light/50 my-6" />
      <DaText variant="regular-bold" className="text-da-gray-darkest">
        Activities
      </DaText>
      <div className="flex flex-col items-start pt-5 gap-4">
        <table className="w-full">
          <thead>
            <tr className="text-left text-da-gray-darkest">
              <th className="font-semibold w-[200px]">Timestamp</th>
              <th className="font-semibold ">Description</th>
              <th className="font-semibold w-[240px]">Created By</th>
              <th className="font-semibold ">Old Value</th>
              <th className="font-semibold ">New Value</th>
            </tr>
          </thead>
          <tbody className="text-da-gray-darkest">
            <tr className="border-t-[10px] border-transparent">
              <td>
                <DaText variant="small">
                  {dayjs(data.createdAt).format('DD MMM YYYY - HH:mm')}
                </DaText>
              </td>
              <td>
                <DaText variant="small">
                  This is a new inventory item created by Dinh Anh
                </DaText>
              </td>
              <td className="flex items-center gap-2 hover:underline cursor-pointer">
                <DaAvatar
                  className="h-7 w-7"
                  src={data.created_by?.image_file}
                />
                <p className="text-sm text-da-gray-darkest">
                  {data.created_by?.name}
                </p>
              </td>
              <td>
                <DaText variant="small">Texz</DaText>
              </td>
              <td>
                <DaText variant="small">Text</DaText>
              </td>
            </tr>
            <tr className="border-t-[10px] border-transparent bg-da-gray-light/30">
              <td>
                <DaText variant="small">
                  {dayjs(data.createdAt).format('DD MMM YYYY - HH:mm')}
                </DaText>
              </td>
              <td>
                <DaText variant="small">
                  This is a new inventory item created by Dinh Anh
                </DaText>
              </td>
              <td className="flex items-center gap-2 hover:underline cursor-pointer">
                <DaAvatar
                  className="h-7 w-7"
                  src={data.created_by?.image_file}
                />
                <p className="text-sm text-da-gray-darkest">
                  {data.created_by?.name}
                </p>
              </td>
              <td>
                <DaText variant="small">Texz</DaText>
              </td>
              <td>
                <DaText variant="small">Text</DaText>
              </td>
            </tr>
            <tr className="border-t-[10px] border-transparent">
              <td>
                <DaText variant="small">
                  {dayjs(data.createdAt).format('DD MMM YYYY - HH:mm')}
                </DaText>
              </td>
              <td>
                <DaText variant="small">
                  This is a new inventory item created by Dinh Anh
                </DaText>
              </td>
              <td className="flex items-center gap-2 hover:underline cursor-pointer">
                <DaAvatar
                  className="h-7 w-7"
                  src={data.created_by?.image_file}
                />
                <p className="text-sm text-da-gray-darkest">
                  {data.created_by?.name}
                </p>
              </td>
              <td>
                <DaText variant="small">Texz</DaText>
              </td>
              <td>
                <DaText variant="small">Text</DaText>
              </td>
            </tr>
            <tr className="border-y-[10px] border-transparent bg-da-gray-light/30">
              <td>
                <DaText variant="small">
                  {dayjs(data.createdAt).format('DD MMM YYYY - HH:mm')}
                </DaText>
              </td>
              <td>
                <DaText variant="small">
                  This is a new inventory item created by Dinh Anh
                </DaText>
              </td>
              <td className="flex items-center gap-2 hover:underline cursor-pointer">
                <DaAvatar
                  className="h-7 w-7"
                  src={data.created_by?.image_file}
                />
                <p className="text-sm text-da-gray-darkest">
                  {data.created_by?.name}
                </p>
              </td>
              <td>
                <DaText variant="small">Texz</DaText>
              </td>
              <td>
                <DaText variant="small">Text</DaText>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PageInventoryItemDetail
