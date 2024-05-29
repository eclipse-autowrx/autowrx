import useModelStore from '@/stores/modelStore'
import { shallow } from 'zustand/shallow'
import useGetModel from '@/hooks/useGetModel'
import { useEffect, FC } from 'react'
import { Model } from '@/types/model.type'
import { useParams } from 'react-router-dom'

const ActiveObjectManagement: FC = () => {
  const { model_id = '' } = useParams()
  const [setActiveModel] = useModelStore(
    (state) => [state.setActiveModel],
    shallow,
  )

  const { data: fetchedModel } = useGetModel(model_id || '')

  useEffect(() => {
    setActiveModel(fetchedModel as Model)
  }, [fetchedModel])

  return <span></span>
}

export default ActiveObjectManagement
