import Architecture from './Architecture'

const PrototypeTabArchitecture = () => {
  return (
    <div className="flex flex-col w-full h-full bg-slate-200 p-2">
      <div className="flex flex-col w-full h-full bg-white rounded-lg overflow-hidden">
        <Architecture displayMode="prototype" />
      </div>
    </div>
  )
}

export default PrototypeTabArchitecture
