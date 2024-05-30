import clsx from 'clsx'
import { TbLoader } from 'react-icons/tb'

interface DaLoaderProps {
  className?: string
}

const DaLoader = ({ className }: DaLoaderProps) => {
  return (
    <TbLoader
      className={clsx('text-3xl text-da-primary-500 animate-spin', className)}
    />
  )
}

export default DaLoader
