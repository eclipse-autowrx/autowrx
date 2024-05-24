import { List } from "@/types/common.type"
import { serverAxios } from "./base"
import { Model, ModelLite } from "@/types/model.type"

export const listModelsLite = async () => {
  return (
    await serverAxios.get<List<ModelLite>>("/models", {
      params: {
        fields: ["name", "visibility", "model_home_image_file", "id", "created_at", "created_by", "tags"].join(","),
      },
    })
  ).data
}

export const getModel = async (id: string) => {
  return (await serverAxios.get<Model>(`/models/${id}`)).data
}
