// Feedback service stub
export const createFeedbackService = async (data: any) => {
  return data
}

export const createFeedback = async (data: any) => {
  return data
}

export const updateFeedbackService = async (id: string, data: any) => {
  return data
}

export const deleteFeedbackService = async (id: string) => {
  return { success: true }
}

export const deleteFeedback = async (id: string) => {
  return { success: true }
}

export const submitIssueService = async (data: any) => {
  return data
}

export const listPrototypeFeedback = async (prototypeId: string, page: number = 1) => {
  return {
    results: [],
    totalPages: 0,
    currentPage: page,
  }
}
