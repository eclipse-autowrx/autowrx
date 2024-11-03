import axios from 'axios'
import { Buffer } from 'buffer'
import { Branch } from '@/types/api.type'

const encodeToBase64 = (code: string) => {
  return Buffer.from(code).toString('base64')
}

const publishToGithub = async (params: {
  accessToken: string
  user_login: string
  code: string
  repo: string
  vss_payload: { [key: string]: Branch }
}) => {
  try {
    // API endpoint for creating a new repo based on a template
    const templateRepoOwner = 'eclipse-velocitas'
    const templateRepoName = 'vehicle-app-python-template'

    const response = await axios.post(
      `https://api.github.com/repos/${templateRepoOwner}/${templateRepoName}/generate`,
      {
        owner: params.user_login, // Set the new repo's owner as the authenticated user
        name: params.repo, // New repository name
        description: 'Repository generated from Velocitas vehicle app template',
        include_all_branches: false, // Optional, whether to include all branches
      },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          Accept: 'application/vnd.github.baptiste-preview+json', // Required preview header for templates API
        },
      },
    )

    console.log('Repository created successfully:', response.data)
    return response.data // Return data for the created repository if needed
  } catch (error) {
    console.error('Failed to create repository:', error)
    throw new Error('Failed to create repository from template.')
  }
}

export default publishToGithub
