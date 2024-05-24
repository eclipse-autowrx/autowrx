import React from "react";
import { useParams } from "react-router-dom";
import { models } from "@/data/models_mock";

const PageModelDetail: React.FC = () => {
  const { model_id } = useParams<{ model_id: string }>();

  const model = models.find((model) => model.id === model_id);

  if (!model) {
    return <div>Model not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Model Detail for ID: {model_id}
      </h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <img
          src={model.model_home_image_file}
          alt={model.name}
          className="w-full h-auto mb-4 rounded"
        />
        <div className="text-lg">
          <p>
            <strong>Name:</strong> {model.name}
          </p>
          <p>
            <strong>CVI:</strong> {model.cvi}
          </p>
          <p>
            <strong>Main API:</strong> {model.main_api}
          </p>
          <p>
            <strong>Visibility:</strong> {model.visibility}
          </p>
          <p>
            <strong>Tenant ID:</strong> {model.tenant_id}
          </p>
          <p>
            <strong>Vehicle Category:</strong> {model.vehicle_category}
          </p>
          <p>
            <strong>Created By:</strong> {model.created_by}
          </p>
          <p>
            <strong>Created At:</strong> {model.created_at.toString()}
          </p>
          <p>{/* <strong>Tags:</strong> {model.tags.join(", ")} */}</p>
        </div>
      </div>
    </div>
  );
};

export default PageModelDetail;
