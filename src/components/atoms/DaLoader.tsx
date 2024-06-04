import clsx from 'clsx'
import { TbLoader } from 'react-icons/tb'

interface DaLoaderProps {
  className?: string
}

const DaLoader = ({ className }: DaLoaderProps) => {
  return (
    <TbLoader
      className={clsx(
        'da-label-huge text-da-primary-500 animate-spin',
        className,
      )}
    />
  )
}

export default DaLoader
