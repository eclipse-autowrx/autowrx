import { FC } from 'react'
import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { Partner } from '@/types/common.type'
import config from '@/configs/config'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { cn } from '@/lib/utils'

type HomePartnersProps = {
  items?: Partner[]
}

const HomePartners: FC = ({ items }: HomePartnersProps) => {
  const { data: user } = useSelfProfileQuery()

  return (
    <div
      className={cn(
        'flex flex-col xl:flex-row xl:items-center justify-center w-full min-h-[180px]',
        user && 'bg-gray-100',
      )}
    >
      {config && config.instance === 'digitalauto' ? (
        <>
          <div className="flex flex-col w-full xl:w-[30%] ml-12 my-12">
            <div className="flex w-full items-center">
              <div className="text-xl font-bold mb-2 text-da-gray-dark">
                Partnership
              </div>
            </div>

            <div className="w-full text-sm xl:max-w-lg">
              Interoperability is key. Therefore, we have teamed up with many
              partners to start an SDV interoperability initiative.
            </div>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-24 mx-12 pb-6 xl:pb-0"
            style={{
              gridTemplateColumns: `repeat(${items?.length || 3}, minmax(200px, 1fr))`,
            }}
          >
            {items?.map((group: any, gIndex: number) => (
              <div key={gIndex} className="text-center w-fit">
                <DaText
                  variant="small-medium"
                  className="xl:flex hidden mt-2 justify-center text-da-gray-medium"
                >
                  {group?.title}
                </DaText>
                <div className="flex justify-center space-x-4">
                  {group?.items.map((partner: any, pIndex: number) => (
                    <a key={pIndex} href={partner.url} target="_blank">
                      <DaImage
                        src={partner.img}
                        alt={partner.name}
                        className="w-32 h-20 rounded-lg object-contain"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col w-full text-center justify-center items-center font-medium">
          <div className="flex pt-6 w-fit items-center">
            <a href="https://www.digital.auto/" target="_blank">
              <img src="./imgs/da.png" className="h-[70px]" />
            </a>
          </div>
          <div className="max-w-xl pb-10 text-sm">
            Operated by{' '}
            <a
              href="https://www.digital.auto/"
              target="_blank"
              className="text-da-primary-500 hover:underline"
            >
              digital.auto
            </a>{' '}
            and based on Eclipse SDV autowrx. Join our thriving community to
            participate in next-generation, SDV-enabled vehicle experiences.
          </div>
        </div>
      )}
    </div>
  )
}

export { HomePartners }
