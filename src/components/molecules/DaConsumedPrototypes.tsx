import useSearchPrototypesBySignal from '@/hooks/useSearchPrototypesBySignal'
import DaText from '../atoms/DaText'
import DaLoader from '../atoms/DaLoader'
import { DaImage } from '../atoms/DaImage'
import { CSSProperties, useState } from 'react'
import { Link } from 'react-router-dom'
import { DaButton } from '../atoms/DaButton'
import { TbChevronDown } from 'react-icons/tb'
import clsx from 'clsx'

type DaRelatedPrototypesProps = {
  signal?: string
}

const DaRelatedPrototypes = ({ signal }: DaRelatedPrototypesProps) => {
  const [expanded, setExpanded] = useState(false)
  const { data: prototypes, isLoading } = useSearchPrototypesBySignal(signal)

  const truncatedPrototypes = prototypes?.slice(
    0,
    expanded ? prototypes.length : 3,
  )

  if (isLoading)
    return (
      <div className="w-full h-[100px] flex">
        <DaLoader className="my-auto" />
      </div>
    )

  return (
    <div className="mt-2">
      <DaText variant="regular-bold" className="flex text-da-secondary-500">
        Dependencies
      </DaText>
      {prototypes &&
      prototypes.length > 0 &&
      truncatedPrototypes &&
      truncatedPrototypes.length > 0 ? (
        <>
          <DaText variant="small">Used by these vehicle app</DaText>
          <div
            className="autofill mt-2 gap-4"
            style={
              {
                '--grid-min-width': '240px',
              } as CSSProperties
            }
          >
            {truncatedPrototypes?.map((prototype) => (
              <Link
                to={`/model/${prototype.model?.id}/library/prototype/${prototype.id}/code`}
                key={prototype.id}
                className="border rounded-md p-2 cursor-pointer hover:border-da-primary-500 relative"
              >
                <DaImage
                  src={prototype.image_file}
                  className="w-full aspect-video object-cover rounded-md"
                />
                <DaText
                  variant="small-bold"
                  className="mt-1 block w-full truncate"
                >
                  {prototype.name}
                </DaText>
                {prototype.model?.name && (
                  <DaText className="da-label-tiny max-w-[160px] truncate absolute py-0.5 px-2 rounded-full bg-white border border-da-gray-medium/50 top-3 right-3">
                    {prototype.model.name}
                  </DaText>
                )}
              </Link>
            ))}
          </div>
          {prototypes.length > 3 && (
            <DaButton
              onClick={() => setExpanded((prev) => !prev)}
              variant="text"
              size="sm"
              className="mt-1 !px-0"
            >
              {expanded ? 'Show less' : `Show ${prototypes.length - 3} more`}{' '}
              <TbChevronDown
                className={clsx('ml-1', expanded && 'rotate-180')}
              />
            </DaButton>
          )}
        </>
      ) : (
        <DaText variant="small">N/A</DaText>
      )}
    </div>
  )
}

export default DaRelatedPrototypes
