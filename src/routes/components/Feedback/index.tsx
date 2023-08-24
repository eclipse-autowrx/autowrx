import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Model } from "../../../apis/models"
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel"
import Stars from "../../../reusable/Stars"
import Tab from "../../../reusable/Tabs/Tab"
import { FiExternalLink } from "react-icons/fi"
import LinkWrap from "../../../reusable/LinkWrap"

interface DisplayDescriptionProps {
    name: string
    value?: React.ReactNode
}

const DisplayDescription = ({name, value}: DisplayDescriptionProps) => {
    return (
        <tr>
            <td className="py-2 font-bold select-none pr-2 whitespace-nowrap align-top">{name}</td>
            <td className="py-2 " style={{whiteSpace: "break-spaces"}} >{value}</td>
        </tr>
    )
}

interface FeedbackModel {
    needs_addressed: number
    relevance: number
    ease_of_use: number
    questions: string
    recommendations: string
    interview: {
        interviewer: string
        interviewee: string
        date: "6/15/2022"
    }
}

const feedbacks: FeedbackModel[] = [
    {
        needs_addressed: 3.96,
        relevance: 4.35,
        ease_of_use: 4.7,
        questions: "Does this work automatically?",
        recommendations: "Might also include doors",
        interview: {
            interviewer: "Tom Jones",
            interviewee: "Jannet Jackson",
            date: "6/15/2022"
        }
    },
    {
        needs_addressed: 5,
        relevance: 2.82,
        ease_of_use: 1.7,
        questions: "Does this work automatically?",
        recommendations: "",
        interview: {
            interviewer: "Tom Jones",
            interviewee: "Tom Cruise",
            date: "6/15/2022"
        }
    },
    {
        needs_addressed: 1,
        relevance: 2.3,
        ease_of_use: 4.7,
        questions: "Does this work automatically?",
        recommendations: "Something you could do is....",
        interview: {
            interviewer: "Tom Jones",
            interviewee: "Manuel Neuer",
            date: "6/15/2022"
        }
    },
    {
        needs_addressed: 3.1,
        relevance: 4.7,
        ease_of_use: 2.6,
        questions: "How can I get this to work?",
        recommendations: "Recommendation Example",
        interview: {
            interviewer: "Tom Jones",
            interviewee: "Example Interviewee",
            date: "6/15/2022"
        }
    },
]

const Feedback = () => {
    const [activeFeedback, setActiveFeedback] = useState(0)
    const feedback = feedbacks[activeFeedback]
    const navigate = useNavigate()
    const model = useCurrentModel() as Model

    if (typeof feedback === "undefined") {
        return null
    }
    
    return (
        <div className="flex flex-col p-3 w-full">
            <div className="flex pb-2 relative">
                {feedbacks.map((feedback, i) => (
                    <Tab
                    label={i+1}
                    className="flex h-full text-xl items-center px-4 !w-fit text-gray-400"
                    active={activeFeedback === i}
                    onClick={() => setActiveFeedback(i)}
                    />
                ))}
                <LinkWrap to={`/model/${model.id}/library/portfolio`} className="text-gray-400 flex items-center ml-auto mb-4 mr-2">
                    <FiExternalLink className="mr-1" />
                    Portfolio
                </LinkWrap>
            </div>
            <div className="flex px-4">
                <table className="table-auto leading-relaxed w-full h-fit">
                    <DisplayDescription name="Needs addressed?" value={<Stars rating={feedback.needs_addressed} />} />
                    <DisplayDescription name="Relevance" value={<Stars  rating={feedback.relevance} />} />
                    <DisplayDescription name="Ease of use" value={<Stars rating={feedback.ease_of_use}/>} />
                    <DisplayDescription name="Questions" value={feedback.questions} />
                    <DisplayDescription name="Recommendations" value={feedback.recommendations} />
                </table>
            </div>
            <div className="flex flex-col px-4 mt-8">
                <div><strong>Interviewer:</strong> {feedback.interview.interviewer}</div>
                <div><strong>Interviewee:</strong> {feedback.interview.interviewee}</div>
                <div><strong>Date:</strong> {feedback.interview.date}</div>
            </div>
        </div>
    )
}

export default Feedback