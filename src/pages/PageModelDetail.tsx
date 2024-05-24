import useCurrentModel from "@/hooks/useCurrentModel"

const PageModelDetail = () => {
  const { data } = useCurrentModel()
  return <div>{data?.name}</div>
}

export default PageModelDetail
