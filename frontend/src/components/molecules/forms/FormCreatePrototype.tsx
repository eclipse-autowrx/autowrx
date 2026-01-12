// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { FormEvent, useEffect, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { VscGithub } from 'react-icons/vsc'
import { createPrototypeService } from '@/services/prototype.service'
import { useToast } from '../toaster/use-toast'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { isAxiosError } from 'axios'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useNavigate, useLocation } from 'react-router-dom'
import useListModelContribution from '@/hooks/useListModelContribution'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { Model, ModelLite, ModelCreate } from '@/types/model.type'
import { Spinner } from '@/components/atoms/spinner'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import { cn } from '@/lib/utils'
import default_journey from '@/data/default_journey'
import { SAMPLE_PROJECTS } from '@/data/sampleProjects'
import {
  getGithubAuthStatus,
  listGithubRepositories,
  linkRepositoryToPrototype,
  scanGithubRepository,
} from '@/services/github.service'
import { GithubRepo } from '@/types/git.type'
import Cookies from 'js-cookie'

interface FormCreatePrototypeProps {
  onClose?: () => void
  onPrototypeChange?: (data: {
    prototypeName: string
    modelName?: string
    modelId?: string
  }) => void
  disabledState?: [boolean, (disabled: boolean) => void]
  hideCreateButton?: boolean
  code?: string
  widget_config?: string
  title?: string
  buttonText?: string
}

const initialState = {
  prototypeName: '',
  modelName: '',
  language: SAMPLE_PROJECTS[0].language || '',
  code: SAMPLE_PROJECTS[0].data || '',
  cvi: JSON.stringify(CVI),
  mainApi: 'Vehicle',
  githubRepo: '',
}

const DEFAULT_DASHBOARD_CFG = `{
  "autorun": false,
  "widgets": [
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "api": "Vehicle.Body.Lights.Beam.Low.IsOn",
        "defaultImgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png",
        "displayExactMatch": true,
        "valueMaps": [
          {
            "value": true,
            "imgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_on.png"
          },
          {
            "value": false,
            "imgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png"
          }
        ],
        "url": "https://store-be.digitalauto.tech/data/store-be/Image%20by%20Signal%20value/latest/index/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/3c3685b3-0b58-4f75-820e-9af0180cf3f0.png"
      },
      "boxes": [
        2,
        3,
        7,
        8
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "url": "https://store-be.digitalauto.tech/data/store-be/Terminal/latest/terminal/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/e991ea29-5fbf-42e9-9d3d-cceae23600f0.png"
      },
      "boxes": [
        1,
        6
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "api": "Vehicle.Body.Lights.Beam.Low.IsOn",
        "lineColor": "#005072",
        "dataUpdateInterval": "1000",
        "maxDataPoints": "30",
        "url": "https://store-be.digitalauto.tech/data/store-be/Chart%20Signal%20Widget/latest/index/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/f25ceb29-b9e8-470e-897a-4d843e16a0cf.png"
      },
      "boxes": [
        4,
        5
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "apis": [
          "Vehicle.Body.Lights.Beam.Low.IsOn"
        ],
        "vss_json": "https://bewebstudio.digitalauto.tech/data/projects/sHQtNwric0H7/vss_rel_4.0.json",
        "url": "https://store-be.digitalauto.tech/data/store-be/Signal%20List%20Settable/latest/table-settable/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/dccabc84-2128-4e5d-9e68-bc20333441c4.png"
      },
      "boxes": [
        9,
        10
      ],
      "path": ""
    }
  ]
}`

const FormCreatePrototype = ({
  onClose,
  onPrototypeChange,
  disabledState,
  hideCreateButton,
  code,
  widget_config,
  title,
  buttonText,
}: FormCreatePrototypeProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const [disabled, setDisabled] = disabledState ?? useState(false)

  const { data: currentModel } = useCurrentModel()
  const { data: contributionModels, isLoading: isFetchingModelContribution } =
    useListModelContribution()
  const [localModel, setLocalModel] = useState<ModelLite>()
  const { refetch } = useListModelPrototypes(
    currentModel ? currentModel.id : '',
  )
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()


  // GitHub integration state
  const [githubAuthenticated, setGithubAuthenticated] = useState(false)
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>(SAMPLE_PROJECTS[0].label)
  const [selectedGithubRepo, setSelectedGithubRepo] = useState<GithubRepo | null>(null)
  const [repoSearchQuery, setRepoSearchQuery] = useState<string>('')
  const [showRepoDropdown, setShowRepoDropdown] = useState(false)

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const onTemplateChange = (v: string) => {
    setSelectedTemplate(v)
    // Only load code from template if not GitHub repo template
    if (v !== 'github-repo') {
      const template = SAMPLE_PROJECTS.find((project) => project.label === v)
      let code = ''
      let language = ''
      if (template) {
        if (typeof template.data === 'string') {
          code = template.data
          language = template.language
        } else {
          code = JSON.stringify(template.data)
          language = template.language
        }
        setData((prev) => ({ ...prev, code: code, language: language }))
      }
    } else {
      // Don't set language yet for GitHub repo template - will be detected from repo
      setData((prev) => ({ ...prev, code: '', language: '' }))
    }
  }

  const getDefaultDashboardCfg = (lang: string) => {
    if (lang == 'rust') return `{"autorun": false, "widgets": [] }`
    return DEFAULT_DASHBOARD_CFG
  }

  // Convert flat files object to file tree structure
  const convertFilesToFileTree = (files: Record<string, string>, repoName: string = 'project') => {
    interface FileTreeNode {
      type: 'file' | 'folder'
      name: string
      content?: string
      items?: FileTreeNode[]
    }

    const rootItems: FileTreeNode[] = []

    Object.entries(files).forEach(([path, content]) => {
      const parts = path.split('/')
      let currentLevel = rootItems

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1
        let existing = currentLevel.find(item => item.name === part)

        if (!existing) {
          existing = {
            type: isFile ? 'file' : 'folder',
            name: part,
            ...(isFile ? { content } : { items: [] }),
          }
          currentLevel.push(existing)
        }

        if (!isFile && existing.items) {
          currentLevel = existing.items
        }
      })
    })

    // Wrap in a root folder named after the repository
    return [{
      type: 'folder' as const,
      name: repoName,
      items: rootItems
    }]
  }

  // Check GitHub authentication status and load repositories
  useEffect(() => {
    const checkGitHubAuth = async () => {
      try {
        // Check cookie first
        const cachedAuth = Cookies.get('github_auth')
        if (cachedAuth) {
          const auth = JSON.parse(cachedAuth)
          if (auth.authenticated) {
            setGithubAuthenticated(true)
            // Load repositories
            setLoadingRepos(true)
            try {
              const repos = await listGithubRepositories({ per_page: 100, sort: 'updated' })
              setGithubRepos(repos)
            } catch (error) {
              console.error('Failed to load GitHub repositories:', error)
            } finally {
              setLoadingRepos(false)
            }
          }
        }
      } catch (error) {
        console.error('Failed to check GitHub auth:', error)
      }
    }

    checkGitHubAuth()

    // Listen for GitHub auth messages from popup
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        setGithubAuthenticated(true)
        // Load repositories after successful auth
        setLoadingRepos(true)
        try {
          const repos = await listGithubRepositories({ per_page: 100, sort: 'updated' })
          setGithubRepos(repos)
        } catch (error) {
          console.error('Failed to load GitHub repositories:', error)
        } finally {
          setLoadingRepos(false)
        }
      }
    }

    window.addEventListener('message', handleAuthMessage)
    return () => window.removeEventListener('message', handleAuthMessage)
  }, [])

  // Select GitHub repo when chosen
  const handleGithubRepoChange = (repoId: string) => {
    handleChange('githubRepo', repoId)

    if (!repoId) {
      setSelectedGithubRepo(null)
      return
    }

    const repo = githubRepos.find(r => r.id.toString() === repoId)
    if (!repo) return

    // Store the selected repo for later linking
    setSelectedGithubRepo(repo)
    // Clear search query when repo is selected
    setRepoSearchQuery('')
  }

  // Filter repositories based on search query
  const filteredRepos = githubRepos.filter(repo =>
    repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase())
  )

  const createNewPrototype = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Prevent the form from submitting

    try {
      setLoading(true)

      // Load repo data if GitHub template is selected
      let repoCode = data.code
      let detectedLanguage = data.language

      if (selectedTemplate === 'github-repo' && selectedGithubRepo) {
        try {
          const [owner, repoName] = selectedGithubRepo.full_name.split('/')
          const scanResult = await scanGithubRepository(owner, repoName, selectedGithubRepo.default_branch)

          // Parse the scan result
          const repoData = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult

          console.log('Repository scan result:', repoData)
          console.log('Files from repo:', repoData.files)

          // Detect language from repository
          if (repoData.language) {
            detectedLanguage = repoData.language.toLowerCase()
          }

          // Convert flat files structure to file tree structure
          const fileTree = convertFilesToFileTree(repoData.files || {}, repoData.name || 'project')

          console.log('Converted file tree:', fileTree)
          console.log('File tree JSON:', JSON.stringify(fileTree, null, 2))

          // Store as JSON array (expected format for project editor)
          repoCode = JSON.stringify(fileTree, null, 2)

          toast({
            title: 'Success',
            description: `Loaded ${repoData.file_count || 0} files from ${selectedGithubRepo.name}`,
          })
        } catch (error) {
          console.error('Failed to scan repository:', error)
          toast({
            title: 'Warning',
            description: 'Failed to load repository data. Prototype will be created without repository code.',
            variant: 'destructive',
          })
          // Set default language if detection failed
          if (!detectedLanguage) {
            detectedLanguage = 'python'
          }
        }
      }

      // Initialize variables to hold the model ID and response from prototype creation
      let modelId: string
      let response

      if (localModel) {
        // Scenario 1: `localModel` exists, use its ID
        modelId = localModel.id
      } else if (data.modelName) {
        // Scenario 2: `localModel` does not exist, create a new model
        const modelBody: ModelCreate = {
          main_api: data.mainApi,
          name: data.modelName,
          api_version: 'v4.1',
        }

        const newModelId = await createModelService(modelBody)
        modelId = newModelId
      } else {
        throw new Error('Model data is missing')
      }

      const body = {
        model_id: modelId,
        name: data.prototypeName,
        language: detectedLanguage || data.language,
        state: 'development',
        apis: { VSC: [], VSS: [] },
        code: repoCode,
        complexity_level: 3,
        customer_journey: default_journey,
        description: {
          problem: '',
          says_who: '',
          solution: '',
          status: '',
        },
        image_file: '/imgs/default_prototype_cover.jpg',
        skeleton: '{}',
        tags: [],
        widget_config:
          widget_config || getDefaultDashboardCfg(data.language) || '[]',
        autorun: true,
      }

      // Create the prototype using the model ID

      response = await createPrototypeService(body)

      // Link GitHub repository if one was selected
      if (selectedGithubRepo) {
        try {
          await linkRepositoryToPrototype({
            prototype_id: response.id,
            repo_id: selectedGithubRepo.id.toString(),
            repo_name: selectedGithubRepo.name,
            repo_full_name: selectedGithubRepo.full_name,
            repo_url: selectedGithubRepo.html_url,
            clone_url: selectedGithubRepo.clone_url,
            default_branch: selectedGithubRepo.default_branch,
            is_private: selectedGithubRepo.private,
          })
        } catch (error) {
          console.error('Failed to link repository:', error)
          // Don't fail the prototype creation if linking fails
        }
      }

      // Log the prototype creation
      await addLog({
        name: `New prototype '${data.prototypeName}' under model '${localModel?.name || data.modelName}'`,
        description: `Prototype '${data.prototypeName}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
        type: 'new-prototype',
        create_by: currentUser?.id!,
        ref_id: response.id,
        ref_type: 'prototype',
        parent_id: modelId,
      })

      toast({
        title: ``,
        description: (
          <p className="flex items-center text-sm">
            <TbCircleCheckFilled className="mr-2 h-4 w-4 text-green-500" />
            Prototype "{data.prototypeName}" created successfully
          </p>
        ),
        duration: 3000,
      })

      // Navigate to the new prototype's page
      await navigate(`/model/${modelId}/library/prototype/${response.id}`)

      // Optionally close the form/modal
      if (onClose) onClose()

      // Reset form data
      setData(initialState)

      // Refetch data
      await refetch()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentModel) {
      const modelLite = {
        id: currentModel.id,
        name: currentModel.name,
        visibility: currentModel.visibility,
        model_home_image_file: currentModel.model_home_image_file || '',
        created_at: currentModel.created_at,
        created_by: currentModel.created_by,
        tags: currentModel.tags,
      }
      setLocalModel({
        ...modelLite,
        created_by: modelLite.created_by?.id || '',
      })
    } else if (
      contributionModels &&
      !isFetchingModelContribution &&
      contributionModels.results.length > 0
    ) {
      setLocalModel(contributionModels.results[0])
    }
  }, [contributionModels, isFetchingModelContribution, currentModel])

  useEffect(() => {
    if (loading || (!localModel && !data.modelName) || !data.prototypeName) {
      setDisabled(true)
    } else setDisabled(false)
    if (onPrototypeChange) {
      if (localModel) {
        onPrototypeChange({
          prototypeName: data.prototypeName,
          modelId: localModel.id,
          modelName: undefined,
        })
      } else {
        onPrototypeChange({
          prototypeName: data.prototypeName,
          modelName: data.modelName,
          modelId: undefined,
        })
      }
    }
  }, [loading, localModel, data.modelName, data.prototypeName])

  return (
    <form
      onSubmit={createNewPrototype}
      className="flex flex-col bg-background"
    >
      <h2 className="text-lg font-semibold text-primary">
        {title ?? 'New Prototype'}
      </h2>

      {!currentModel &&
        (contributionModels && !isFetchingModelContribution && localModel ? (
          <div className="flex flex-col mt-4">
            <Label className="mb-2">Model Name *</Label>
            <Select
              defaultValue={localModel.id}
              onValueChange={(e: string) => {
                const selectedModel = contributionModels.results.find(
                  (model: ModelLite) => model.id === e,
                )
                selectedModel && setLocalModel(selectedModel)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contributionModels.results.map(
                  (model: ModelLite, index: number) => (
                    <SelectItem key={index} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        ) : isFetchingModelContribution ? (
          <p className="mt-4 flex items-center text-base text-muted-foreground">
            <Spinner className="mr-1 h-4 w-4" />
            Loading vehicle model...
          </p>
        ) : (
          <div className="flex flex-col mt-4">
            <Label className="mb-2">Model Name *</Label>
            <Input
              name="name"
              value={data.modelName}
              onChange={(e) => handleChange('modelName', e.target.value)}
              placeholder="Model name"
              className="bg-background"
            />
          </div>
        ))}

      <div className="flex flex-col mt-4">
        <Label className="mb-2">Prototype Name *</Label>
        <Input
          name="name"
          value={data.prototypeName}
          onChange={(e) => handleChange('prototypeName', e.target.value)}
          placeholder="Name"
          data-id="prototype-name-input"
        />
      </div>

      <div className="flex flex-col mt-4">
        <Label className="mb-2">Project Template *</Label>
        <Select
          value={selectedTemplate}
          onValueChange={(v: string) => {
            onTemplateChange(v)
          }}
        >
          <SelectTrigger data-id="prototype-language-select" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SAMPLE_PROJECTS.map((project) => (
              <SelectItem key={project.label} value={project.label}>
                {project.label}
              </SelectItem>
            ))}
            <SelectItem value="github-repo">
              <VscGithub className="inline mr-2" />
              GitHub Repository
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* GitHub Repository Selector - Only show when GitHub repo template is selected and user is authenticated */}
      {selectedTemplate === 'github-repo' && githubAuthenticated && githubRepos.length > 0 && (
        <div className="flex flex-col mt-4">
          <Label className="mb-2 flex items-center">
            <VscGithub className="mr-2" />
            Start from GitHub Repository (Optional)
          </Label>

          {/* Repository Autocomplete */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search and select a repository..."
              value={repoSearchQuery}
              onChange={(e) => {
                setRepoSearchQuery(e.target.value)
                setShowRepoDropdown(true)
              }}
              onFocus={() => setShowRepoDropdown(true)}
              onBlur={() => {
                // Delay to allow click on dropdown items
                setTimeout(() => setShowRepoDropdown(false), 200)
              }}
              className="w-full bg-background"
            />

            {/* Autocomplete Dropdown */}
            {showRepoDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                {filteredRepos.length > 0 ? (
                  <div>
                    {filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => {
                          handleGithubRepoChange(repo.id.toString())
                          setRepoSearchQuery(repo.full_name)
                          setShowRepoDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2.5 hover:bg-accent border-b border-border last:border-b-0 transition-colors ${selectedGithubRepo?.id === repo.id ? 'bg-accent' : ''
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{repo.name}</div>
                            <div className="text-xs text-muted-foreground">{repo.full_name}</div>
                          </div>
                          {repo.private && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded ml-2 whitespace-nowrap">
                              Private
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {repoSearchQuery ? 'No repositories found' : 'Start typing to search...'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected repo info */}
          {selectedGithubRepo && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="font-medium text-blue-900">Selected: {selectedGithubRepo.name}</div>
              <div className="text-xs text-blue-700">{selectedGithubRepo.full_name}</div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            {selectedGithubRepo
              ? 'Repository will be scanned and loaded when prototype is created'
              : 'Type to search for your repositories'}
          </p>
        </div>
      )}      {/* GitHub Auth Prompt - Show when template is selected but user is not authenticated */}
      {selectedTemplate === 'github-repo' && !githubAuthenticated && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-3">
            <VscGithub className="text-blue-600 mt-1 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Connect GitHub to use this template
              </p>
              <p className="text-xs text-blue-700 mb-3">
                Authenticate with GitHub to browse and load projects from your repositories
              </p>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Open GitHub auth popup
                  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID
                  if (!clientId) {
                    toast({
                      title: 'Configuration Error',
                      description: 'GitHub OAuth is not configured',
                      variant: 'destructive',
                    })
                    return
                  }

                  const scope = 'repo,user:email'
                  const state = Math.random().toString(36).substring(7)
                  let redirectUri = `${window.location.origin}/github/callback?state=${encodeURIComponent(state)}`
                  if (currentUser?.id) {
                    redirectUri += `&userId=${encodeURIComponent(currentUser.id)}`
                  }

                  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`

                  const popupWidth = 500
                  const popupHeight = 600
                  const left = window.screenX + (window.outerWidth - popupWidth) / 2
                  const top = window.screenY + (window.outerHeight - popupHeight) / 2

                  const popup = window.open(
                    authUrl,
                    'github-auth',
                    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
                  )

                  if (!popup) {
                    toast({
                      title: 'Error',
                      description: 'Failed to open popup window. Please check your browser settings.',
                      variant: 'destructive',
                    })
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <VscGithub className="mr-2" />
                Connect GitHub
              </Button>
            </div>
          </div>
        </div>
      )}

      {loadingRepos && (
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <Spinner className="mr-2 h-4 w-4" />
          Loading GitHub repositories...
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Button
        disabled={disabled || (selectedTemplate === 'github-repo' && !selectedGithubRepo)}
        type="submit"
        data-id="btn-create-prototype"
        className={cn('mt-8 w-full', hideCreateButton && 'hidden')}
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        {buttonText ?? 'Create Prototype'}
      </Button>
    </form>
  )
}

export default FormCreatePrototype
