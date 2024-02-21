import { useState } from "react";
import { Survey } from "../../../apis/models";
import { formatTimestamp } from "./ReportFunctions";

interface SurveyManagementPros {
    surveys: Survey[];
}

const SurveyManagement: React.FC<SurveyManagementPros> = ({ surveys }) => {
    return (
        <div className="w-full flex flex-col">
            <div className="text-xl ml-2 font-bold uppercase mb-2 text-aiot-blue"> Surveys </div>
            <img
                className="object-contain h-[30%]"
                src="https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Feedback%2FAnnotation%202023-08-07%20134742.jpg?alt=media&token=f90f1d29-30c0-4049-9dde-9a9578cd8ee1"
            ></img>
            {surveys.map((survey) => {
                if (!survey.userThoughts) return null; // Only render when userThoughts is available

                return (
                    <div
                        key={survey.email}
                        className="m-2 p-2 border rounded text-xs text-gray-700 border-gray-300 space-y-1"
                    >
                        <div className="items-center flex w-full justify-between">
                            <h2 className="font-bold text-aiot-blue">Survey {survey.orderNumber}</h2>
                            <p className="text-gray-400 text-[10px]">{formatTimestamp(survey.lastSurveyTimestamp)}</p>
                        </div>
                        <p>
                            <span className="text-gray-500">Feedback: </span>
                            {survey.userThoughts}
                        </p>
                        <div className="flex space-x-5">
                            <p>
                                <span className="text-gray-500">Feeling: </span>
                                {survey.feeling}
                            </p>
                            <p>
                                <span className="text-gray-500">User Email: </span>
                                {survey.email}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SurveyManagement;
