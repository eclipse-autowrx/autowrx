import { cn } from "@/lib/utils";

interface DaSectionTitleProps {
    number: number; 
    title: string;
    className?: string;
}

const DaSectionTitle = ({number, title, className}:DaSectionTitleProps) => {
    return(
       
  <div className={cn("flex select-none items-center", className)}>
    <div className="flex h-5 w-5 items-center justify-center rounded bg-da-gray-light p-2 text-xs font-bold">
      {number}
    </div>
    <div className="ml-1 flex font-medium text-gray-600">{title}</div>
  </div>
    )
}

export default DaSectionTitle;