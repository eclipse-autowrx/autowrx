import { DaAvatar } from '@/components/atoms/DaAvatar'
import { DaButton } from '@/components/atoms/DaButton'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import DaMenu from '@/components/atoms/DaMenu'
import DaText from '@/components/atoms/DaText'
import { InventoryItem } from '@/types/inventory.type'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useState } from 'react'
import {
  TbChevronDown,
  TbCopy,
  TbEdit,
  TbExternalLink,
  TbEye,
  TbEyeOff,
  TbPaperclip,
  TbPlus,
  TbTrash,
} from 'react-icons/tb'
import { Link, useParams } from 'react-router-dom'
import InventoryItemRelationships from '@/components/molecules/inventory/InventoryItemRelationships'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import AccessInvitation from '@/components/organisms/AccessInvitation'

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

const tabs = [
  {
    key: 'general',
    name: 'General',
    path: '',
  },
  {
    key: 'relationships',
    name: 'Relationships (3)',
    path: 'relationships',
  },
  {
    key: 'assets',
    name: 'Assets (3)',
    path: 'assets',
  },
  {
    key: 'activities',
    name: 'Activities (154)',
    path: 'activities',
  },
  {
    key: 'comments',
    name: 'Comments (5)',
    path: 'comments',
  },
  {
    key: 'access-control',
    name: 'Access Control (3)',
    path: 'access-control',
  },
]

const PageInventoryItemDetail = () => {
  const { inventory_id, tab } = useParams()

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
          className="ml-auto !text-da-gray-dark w-[80px]"
        >
          <TbEdit className="w-4 h-4 mr-1" />
          Edit
        </DaButton>
        <DaMenu
          trigger={
            <DaButton
              size="sm"
              variant="outline-nocolor"
              className="!text-da-gray-dark w-[80px]"
            >
              <TbChevronDown className="w-4 h-4 mr-1" />
              More
            </DaButton>
          }
        >
          <div className="flex flex-col px-0.5 -my-0.5">
            <DaButton
              size="sm"
              variant="plain"
              className="text-left !justify-start w-[144px]"
            >
              <TbCopy className="w-4 h-4 mr-2" />
              Duplicate Item
            </DaButton>
          </div>
        </DaMenu>
      </div>

      <div className="border-b flex font-medium border-t-da-gray-light/50 mb-6">
        {tabs.map((t) => (
          <Link
            key={t.key}
            className={clsx(
              'w-[160px] flex justify-center border-b items-center h-[48px]',
              t.path === (tab || '')
                ? 'text-da-primary-500 border-b-da-primary-500'
                : 'border-b-transparent',
            )}
            to={`/inventory/${inventory_id}/${t.path}`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {!tab && <General />}

      {tab === 'relationships' && <InventoryItemRelationships />}

      {tab === 'assets' && (
        <div className="flex mt-4 gap-7 flex-col">
          <div className="border flex-1 min-w-0 shadow rounded-lg flex flex-col">
            <div className="border-b h-[54px] flex items-center px-4">
              <DaText className="!text-da-gray-darkest" variant="regular-bold">
                Diagrams
              </DaText>
              <DaButton variant="text" className="ml-auto" size="sm">
                <TbPlus className="w-4 h-4 mr-1" />
                Add Diagram
              </DaButton>
            </div>
            <div className="px-4 py-2">
              <DaText variant="small" className="!block py-3">
                This item has no diagrams.
              </DaText>
            </div>
          </div>
          <div className="border flex-1 min-w-0 shadow rounded-lg flex flex-col">
            <div className="border-b h-[54px] flex items-center px-4">
              <DaText className="!text-da-gray-darkest" variant="regular-bold">
                Attachments (2)
              </DaText>
            </div>
            <div className="px-4 py-2">
              <div className="group flex gap-2 -mx-4 px-4 h-[44px] items-center hover:bg-da-gray-light/20">
                <DaText
                  variant="small"
                  className="flex-1 text-da-gray-darkest truncate"
                >
                  hello World.
                </DaText>

                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="destructive"
                  size="sm"
                >
                  <TbTrash className="w-4 h-4 mr-1" /> Delete
                </DaButton>
              </div>
              <div className="group flex gap-2 -mx-4 px-4 h-[44px] items-center hover:bg-da-gray-light/20">
                <DaText
                  variant="small"
                  className="flex-1 text-da-gray-darkest truncate"
                >
                  hello World.
                </DaText>

                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="destructive"
                  size="sm"
                >
                  <TbTrash className="w-4 h-4 mr-1" /> Delete
                </DaButton>
              </div>

              <DaFileUpload
                className="mb-4 mt-3"
                label="Drag drop or click here to attach file"
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'activities' && (
        <>
          <DaText variant="regular-bold" className="text-da-gray-darkest">
            Activities
          </DaText>

          <div className="mt-4 flex gap-2">
            <DaInput
              placeholder="Search by description or user"
              className="w-[360px]"
              inputClassName="!text-sm"
            />
            <DaSelect className="!w-[240px]" value="timestamp:asc">
              <DaSelectItem className="text-sm" value="timestamp:asc">
                Timestamp Ascending
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="timestamp:desc">
                Timestamp Descending
              </DaSelectItem>
            </DaSelect>

            <div className="rounded-md border shadow p-2">Date Picker</div>
          </div>

          <div className="mt-6 rounded-lg overflow-hidden shadow border border-da-gray-light/50">
            <table className="w-full">
              <thead>
                <tr className="text-left text-da-gray-darkest">
                  <th className="font-semibold p-3 w-[200px]">Timestamp</th>
                  <th className="font-semibold p-3">Description</th>
                  <th className="font-semibold p-3 w-[240px]">Created By</th>
                  <th className="font-semibold p-3">Old Value</th>
                  <th className="font-semibold p-3">New Value</th>
                </tr>
              </thead>
              <tbody className="text-da-gray-darkest">
                <tr className="border-transparent bg-da-gray-light/30">
                  <td className="p-3">
                    <DaText variant="small">
                      {dayjs(data.createdAt).format('DD.MM.YYYY - HH:mm')}
                    </DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">
                      This is a new inventory item created by Dinh Anh
                    </DaText>
                  </td>
                  <td className="p-3 flex items-center gap-2 hover:underline cursor-pointer">
                    <DaAvatar
                      className="h-7 w-7"
                      src={data.created_by?.image_file}
                    />
                    <p className="text-sm text-da-gray-darkest">
                      {data.created_by?.name}
                    </p>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Texz</DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Text</DaText>
                  </td>
                </tr>
                <tr className="border-transparent">
                  <td className="p-3">
                    <DaText variant="small">
                      {dayjs(data.createdAt).format('DD.MM.YYYY - HH:mm')}
                    </DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">
                      This is a new inventory item created by Dinh Anh
                    </DaText>
                  </td>
                  <td className="p-3 flex items-center gap-2 hover:underline cursor-pointer">
                    <DaAvatar
                      className="h-7 w-7"
                      src={data.created_by?.image_file}
                    />
                    <p className="text-sm text-da-gray-darkest">
                      {data.created_by?.name}
                    </p>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Texz</DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Text</DaText>
                  </td>
                </tr>
                <tr className="border-transparent bg-da-gray-light/30">
                  <td className="p-3">
                    <DaText variant="small">
                      {dayjs(data.createdAt).format('DD.MM.YYYY - HH:mm')}
                    </DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">
                      This is a new inventory item created by Dinh Anh
                    </DaText>
                  </td>
                  <td className="p-3 flex items-center gap-2 hover:underline cursor-pointer">
                    <DaAvatar
                      className="h-7 w-7"
                      src={data.created_by?.image_file}
                    />
                    <p className="text-sm text-da-gray-darkest">
                      {data.created_by?.name}
                    </p>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Texz</DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Text</DaText>
                  </td>
                </tr>
                <tr className="border-transparent">
                  <td className="p-3">
                    <DaText variant="small">
                      {dayjs(data.createdAt).format('DD.MM.YYYY - HH:mm')}
                    </DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">
                      This is a new inventory item created by Dinh Anh
                    </DaText>
                  </td>
                  <td className="p-3 flex items-center gap-2 hover:underline cursor-pointer">
                    <DaAvatar
                      className="h-7 w-7"
                      src={data.created_by?.image_file}
                    />
                    <p className="text-sm text-da-gray-darkest">
                      {data.created_by?.name}
                    </p>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Texz</DaText>
                  </td>
                  <td className="p-3">
                    <DaText variant="small">Text</DaText>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'access-control' && (
        <div>
          <DaText variant="regular-bold" className="text-da-gray-darkest">
            Access Control
          </DaText>

          <div className="border flex-1 mt-4 min-w-0 shadow rounded-lg flex flex-col">
            <div className="border-b h-[54px] flex items-center px-4">
              <DaText className="!text-da-gray-darkest" variant="regular-bold">
                Viewers
              </DaText>
              <DaButton variant="text" className="ml-auto" size="sm">
                <TbPlus className="w-4 h-4 mr-1" />
                Add Viewer
              </DaButton>
            </div>
            <div className="px-4 py-2">
              <DaText variant="small" className="!block py-3">
                This item has no diagrams.
              </DaText>
            </div>
          </div>
          <div className="border mt-7 flex-1 min-w-0 shadow rounded-lg flex flex-col">
            <div className="border-b h-[54px] flex items-center px-4">
              <DaText className="!text-da-gray-darkest" variant="regular-bold">
                Contributors
              </DaText>
              <DaButton variant="text" className="ml-auto" size="sm">
                <TbPlus className="w-4 h-4 mr-1" />
                Add Contributor
              </DaButton>
            </div>

            <div className="px-4 py-2">
              <div className="group flex gap-2 -mx-4 px-4 h-[44px] items-center hover:bg-da-gray-light/20">
                <DaText
                  variant="small"
                  className="flex-1 text-da-gray-darkest truncate"
                >
                  hello World.
                </DaText>

                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="outline-nocolor"
                  size="sm"
                >
                  <TbEdit className="w-4 h-4 mr-1" /> Edit
                </DaButton>
                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="destructive"
                  size="sm"
                >
                  <TbTrash className="w-4 h-4 mr-1" /> Delete
                </DaButton>
              </div>
              <div className="group flex gap-2 -mx-4 px-4 h-[44px] items-center hover:bg-da-gray-light/20">
                <DaText
                  variant="small"
                  className="flex-1 text-da-gray-darkest truncate"
                >
                  hello World.
                </DaText>

                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="outline-nocolor"
                  size="sm"
                >
                  <TbEdit className="w-4 h-4 mr-1" /> Edit
                </DaButton>
                <DaButton
                  className="opacity-0 group-hover:opacity-100 transition"
                  variant="destructive"
                  size="sm"
                >
                  <TbTrash className="w-4 h-4 mr-1" /> Delete
                </DaButton>
              </div>
            </div>
          </div>

          <AccessInvitation
            accessLevels={[]}
            label="Access Control"
            onClose={() => {}}
            onInviteUsers={async (data: any) => {}}
            onRemoveUserAccess={async (data: any) => {}}
            open={false}
          />
        </div>
      )}
    </div>
  )
}

const General = () => {
  const [showDetail, setShowDetail] = useState(false)

  const titleCase = (str: string) => {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="flex gap-20 lg:flex-row flex-col">
      <div className="flex-1 min-w-0">
        <DaText variant="regular-bold" className="text-da-gray-darkest">
          Basic Information
        </DaText>
        <div className="flex md:flex-row flex-col gap-4 justify-between pt-5">
          <div className="flex flex-col gap-4">
            <div>
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[144px]"
              >
                Name
              </DaText>
              <DaText variant="small" className="text-da-gray-darkest ml-2">
                {data.name}
              </DaText>
            </div>
            <div>
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[144px]"
              >
                Description
              </DaText>
              <DaText variant="small" className="text-da-gray-darkest ml-2">
                {data.description || '-'}
              </DaText>
            </div>
            <div>
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[144px]"
              >
                Visibility
              </DaText>
              <DaText variant="small" className="text-da-gray-darkest ml-2">
                {data.visibility.at(0)?.toUpperCase() +
                  data.visibility.slice(1)}
              </DaText>
            </div>
            <div>
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[144px]"
              >
                Created At
              </DaText>
              <DaText variant="small" className="text-da-gray-darkest ml-2">
                {dayjs(data.createdAt).format('DD.MM.YYYY - HH:mm')}
              </DaText>
            </div>
            <div>
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[144px]"
              >
                Updated At
              </DaText>
              <DaText variant="small" className="text-da-gray-darkest ml-2">
                {dayjs(data.updatedAt).format('DD.MM.YYYY - HH:mm')}
              </DaText>
            </div>
            <div className="flex items-center -mt-0.5">
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[144px]"
              >
                Owner
              </DaText>
              <button className="flex cursor-pointer items-center hover:underline gap-2 ml-2">
                <DaAvatar
                  className="h-7 w-7"
                  src={data.created_by?.image_file}
                />
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
          <div className="flex items-center h-[20px]">
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[144px]"
            >
              Type
            </DaText>
            <DaText variant="small" className="text-da-gray-darkest ml-2">
              {data.type?.name || '-'}
            </DaText>
            <Link to="/inventory/type/abcd" target="_blank">
              <DaButton variant="text" size="sm" className="!py-0 ml-4">
                <TbExternalLink className="w-4 h-4 mr-1" /> Detail
              </DaButton>
            </Link>
          </div>

          <div>
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[144px]"
            >
              Description
            </DaText>
            <DaText variant="small" className="text-da-gray-darkest ml-2">
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
              <div className="border mt-1 rounded-md p-4 w-full">
                <pre>{JSON.stringify(data.type?.schema || {}, null, 4)}</pre>
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
                className="inline-block text-da-gray-dark w-[144px]"
              >
                {titleCase(key)}
              </DaText>
              <DaText variant="small" className="text-da-gray-darkest ml-2">
                {typeof value === 'string' && value}
              </DaText>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg p-5 flex gap-4 flex-col h-fit w-[320px] bg-white border shadow">
        <div className="flex gap-2 w-full">
          <DaText variant="small" className="w-[92px]">
            Type
          </DaText>
          <DaText variant="small" className="flex-1 text-da-gray-darkest">
            System Interface
          </DaText>
        </div>
        <div className="flex gap-2 w-full">
          <DaText variant="small" className="w-[92px]">
            Visibility
          </DaText>
          <DaText variant="small" className="flex-1 text-da-gray-darkest">
            Private
          </DaText>
        </div>
        <div className="flex gap-2 w-full">
          <DaText variant="small" className="w-[92px]">
            State
          </DaText>
          <DaText variant="small" className="flex-1 text-da-gray-darkest">
            Draft
          </DaText>
        </div>
        <div className="flex gap-2 w-full">
          <DaText variant="small" className="w-[92px]">
            Attachments
          </DaText>
          <DaMenu
            trigger={
              <button className="flex items-center gap-0.5 border px-1 rounded-md">
                {0}
                <TbPaperclip className="w-3 h-3" />
                <TbChevronDown className="w-3 h-3" />
              </button>
            }
          >
            <div className="px-2 w-[220px]">
              <div className="flex justify-between -mt-1 items-center">
                <DaText variant="small">Attachments</DaText>
                <button className="p-1 border rounded-md">
                  <TbPlus className="w-3 h-3" />
                </button>
              </div>
              <div className="border-b -mx-3 mt-1" />
              <div>
                <div className="h-[80px] flex items-center justify-center">
                  <DaText variant="small" className="text-da-gray-dark">
                    No attachments
                  </DaText>
                </div>
              </div>
            </div>
          </DaMenu>
        </div>

        <div className="border-t -mx-5 border-t-da-gray-light/50" />

        <div className="flex flex-col gap-2">
          <DaText variant="small-bold" className="text-da-gray-darkest">
            Relationships
          </DaText>
          <div className="flex truncate">
            <DaText className="w-[92px]" variant="small">
              Parents
            </DaText>
            <div className="flex flex-col flex-1 min-w-0">
              <Link
                to="#"
                className="ml-2 truncate text-da-primary-500 hover:underline"
              >
                Vehicle.ADAS
              </Link>
            </div>
          </div>
          <div className="flex">
            <DaText className="w-[92px]" variant="small">
              Children
            </DaText>
            <div className="flex flex-col flex-1 min-w-0">
              <Link
                to="#"
                className="ml-2 truncate text-da-primary-500 hover:underline"
              >
                Vehicle.ADAS
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t -mx-5 border-t-da-gray-light/50" />

        <div className="flex flex-col gap-2">
          <DaText variant="small-bold" className="text-da-gray-darkest">
            Diagrams
          </DaText>
          <DaText variant="small">There are no diagrams.</DaText>
        </div>
        <div className="flex flex-col gap-2">
          <DaText variant="small-bold" className="text-da-gray-darkest">
            Linked Diagrams
          </DaText>
          <Link className="text-da-primary-500 hover:underline" to="#">
            Diagram #1
          </Link>
          <Link className="text-da-primary-500 hover:underline" to="#">
            Connected VSS
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PageInventoryItemDetail
