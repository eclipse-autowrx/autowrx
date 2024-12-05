import { FC } from 'react'
import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { Partner } from '@/types/common.type'
import config from '@/configs/config'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { cn } from '@/lib/utils'

type HomePartnersProps = {
  items?: Partner[]
  children?: React.ReactNode
}

const HomePartners: FC = ({ items, children }: HomePartnersProps) => {
  const { data: user } = useSelfProfileQuery()

  return (
    <div className={cn('pt-6 pb-10', user && 'bg-gray-100')}>
      <div
        className={cn(
          'flex flex-col xl:flex-row xl:items-center justify-center w-full min-h-[180px]',
        )}
      >
        {config && config.instance === 'digitalauto' && !children ? (
          <>
            <div className="flex flex-col w-fit xl:w-[30%] ml-12 my-6 lg:my-12">
              <div className="text-xl font-bold mb-2 text-da-gray-dark">
                Partnership
              </div>

              <div className="w-fit text-sm xl:max-w-lg">
                Interoperability is key. Therefore, we have teamed up with many
                partners to start an SDV interoperability initiative.
              </div>
            </div>

            <div className="flex gap-24 mx-12 pb-6 xl:pb-0">
              {items?.map((group: any, gIndex: number) => (
                <div key={gIndex} className="flex flex-col w-fit">
                  <DaText
                    variant="small-medium"
                    className="xl:flex hidden mt-2 justify-center text-da-gray-medium"
                  >
                    {group?.title}
                  </DaText>
                  <div className="flex justify-center space-x-4 ">
                    {group?.items.map((partner: any, pIndex: number) => (
                      <a key={pIndex} href={partner.url} target="_blank">
                        <DaImage
                          src={partner.img}
                          alt={partner.name}
                          className="w-32 h-[70px] rounded-lg object-contain"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex gap-8 lg:gap-16 max-w-[1400px] px-8 md:flex-row flex-col">
            <div
              className={cn(
                'flex flex-1 min-w-0 flex-col font-medium',
                !children && 'items-center text-center justify-center',
              )}
            >
              <div
                className={cn(children && '-ml-4', 'flex w-fit items-center')}
              >
                <a href="https://www.digital.auto/" target="_blank">
                  <img src="./imgs/da.png" className="h-[70px]" />
                </a>
              </div>
              <div className="text-sm mt-3 max-w-xl">
                Operated by{' '}
                <a
                  href="https://www.digital.auto/"
                  target="_blank"
                  className="text-da-primary-500 hover:underline"
                >
                  digital.auto
                </a>{' '}
                and based on{' '}
                <a
                  href="https://gitlab.eclipse.org/eclipse/autowrx/autowrx"
                  target="_blank"
                  className="text-da-primary-500 hover:underline"
                >
                  Eclipse SDV autowrx
                </a>
                . Join our thriving community to participate in next-generation,
                SDV-enabled vehicle experiences.
              </div>
            </div>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export { HomePartners }
