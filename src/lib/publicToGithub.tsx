// publicToGithub.tsx
import { Buffer } from 'buffer'
import { Branch } from '@/types/api.type'
import { ProjectGenerator } from '@digital-auto/velocitas-project-generator'

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
    // Import and instantiate ProjectGenerator from velocitas-project-generator
    const { ProjectGenerator } = await import(
      '@digital-auto/velocitas-project-generator'
    )

    const generator = new ProjectGenerator(
      params.user_login, // Owner (authenticated user’s account)
      params.repo, // Repository name to create
      params.accessToken, // GitHub access token
    )

    // Prepare payloads for the generator
    const appName = params.repo.replace(/[^a-zA-Z0-9]/gi, '')
    const codePayload = encodeToBase64(params.code)
    const vssPayload = encodeToBase64(JSON.stringify(params.vss_payload))

    // Run the generator with the provided payloads
    await generator.runWithPayload(codePayload, appName, vssPayload)
    console.log(
      `Repository ${params.repo} created successfully in user ${params.user_login}'s GitHub account.`,
    )
  } catch (error) {
    console.error('Failed to create repository:', error)
    throw new Error(
      'Failed to create repository from template using ProjectGenerator.',
    )
  }
}

export default publishToGithub
