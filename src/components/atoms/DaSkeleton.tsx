import { cn } from '@/lib/utils'

function DaSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-100 pointer-events-none',
        className,
      )}
      {...props}
    />
  )
}

export { DaSkeleton }
