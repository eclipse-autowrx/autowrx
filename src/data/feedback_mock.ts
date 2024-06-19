import { Feedback } from '@/types/model.type'

const mockFeedbackData: Feedback[] = [
  {
    id: '1',
    interviewee: {
      name: 'John Doe',
      organization: 'Acme Corp',
    },
    recommendation: 'Add more features.',
    question: 'How can we improve?',
    model_id: 'model-1',
    score: {
      easy_to_use: 3,
      need_address: 4,
      relevance: 5,
    },
    created: {
      created_time: new Date(),
      user_id: 'user-1',
      user_fullname: 'Admin User',
    },
  },
  {
    id: '2',
    interviewee: {
      name: 'Jane Smith',
      organization: 'Global Inc',
    },
    recommendation: 'Provide 24/7 support.',
    question: 'What about support?',
    model_id: 'model-2',
    score: {
      easy_to_use: 5,
      need_address: 5,
      relevance: 4,
    },
    created: {
      created_time: new Date(),
      user_id: 'user-2',
      user_fullname: 'Admin User',
    },
  },
]

export default mockFeedbackData
