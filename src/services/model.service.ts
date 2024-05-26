import { List } from "@/types/common.type"
import { serverAxios } from "./base"
import { Model, ModelLite } from "@/types/model.type"
import { models } from "@/data/models_mock"

const IS_MOCK = true

export const listModelsLite = async () => {
  if(IS_MOCK) {
    return {
      results: models,
      page: 1,
      limit: 10,
      totalPages: 1,
      totalResults: models.length
    }
  }
  return (
    await serverAxios.get<List<ModelLite>>("/models", {
      params: {
        fields: ["name", "visibility", "model_home_image_file", "id", "created_at", "created_by", "tags"].join(","),
      },
    })
  ).data
}

export const getModel = async (model_id: string) => {
  if(IS_MOCK) {
    const model = models.find((model) => model.id === model_id);
    return model
  }
  return (await serverAxios.get<Model>(`/models/${model_id}`)).data
}
