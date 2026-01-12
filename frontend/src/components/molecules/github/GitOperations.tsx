// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Textarea } from '@/components/atoms/textarea'
import { Checkbox } from '@/components/atoms/checkbox'
import { useToast } from '@/components/molecules/toaster/use-toast'
import {
  getLinkedRepository,
  linkRepositoryToPrototype,
  listGithubRepositories,
  createGithubRepository,
  commitGithubFile,
  commitMultipleGithubFiles,
  getGithubCommits,
  getGithubBranches,
  createGithubBranch,
} from '@/services/github.service'
import { GitRepository, GithubRepo, GithubCommit, GithubBranch } from '@/types/git.type'
import {
  VscGitCommit,
  VscGitPullRequest,
  VscCloudUpload,
  VscRepo,
  VscHistory,
  VscListTree,
  VscGithubProject,
  VscSourceControl,
} from 'react-icons/vsc'
import { TbLoader, TbCircleCheckFilled } from 'react-icons/tb'
import { parseAndExtractFiles, parseAndExtractFilesFlat } from '@/lib/fileTreeUtils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'

interface GitOperationsProps {
  prototypeId: string
  projectData: string
  onPull?: (data: string) => void
}

const GitOperations: React.FC<GitOperationsProps> = ({
  prototypeId,
  projectData,
  onPull,
}) => {
  const [linkedRepo, setLinkedRepo] = useState<GitRepository | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRepoDialog, setShowRepoDialog] = useState(false)
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showBranchDialog, setShowBranchDialog] = useState(false)
  const [showNewBranchDialog, setShowNewBranchDialog] = useState(false)
  const [repositories, setRepositories] = useState<GithubRepo[]>([])
  const [commits, setCommits] = useState<GithubCommit[]>([])
  const [branches, setBranches] = useState<GithubBranch[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [newRepoName, setNewRepoName] = useState('')
  const [newRepoDesc, setNewRepoDesc] = useState('')
  const [newRepoNameError, setNewRepoNameError] = useState('')
  const [isPrivateRepo, setIsPrivateRepo] = useState(true)
  const [commitMessage, setCommitMessage] = useState('')
  const [currentBranch, setCurrentBranch] = useState('main')
  const [newBranchName, setNewBranchName] = useState('')
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedData, setLastSavedData] = useState<string>(projectData)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLinkedRepo()
  }, [prototypeId])

  useEffect(() => {
    // Track if project data has changed (dirty state)
    setIsDirty(projectData !== lastSavedData)
  }, [projectData, lastSavedData])

  const loadLinkedRepo = async () => {
    try {
      setLoading(true)
      const repo = await getLinkedRepository(prototypeId)
      setLinkedRepo(repo)
      setCurrentBranch(repo.github_default_branch)
      // Load branches for the linked repository
      await loadBranchesForRepo(repo)
    } catch (error) {
      // No linked repo found
      setLinkedRepo(null)
    } finally {
      setLoading(false)
    }
  }

  const loadBranchesForRepo = async (repo: GitRepository) => {
    try {
      setBranchesLoading(true)
      const [owner, repoName] = repo.github_repo_full_name.split('/')
      const branchesData = await getGithubBranches(owner, repoName)
      setBranches(branchesData)
    } catch (error) {
      console.error('Failed to load branches:', error)
    } finally {
      setBranchesLoading(false)
    }
  }

  const loadRepositories = async () => {
    try {
      setProcessing(true)
      const repos = await listGithubRepositories({ per_page: 100, sort: 'updated' })
      setRepositories(repos)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load repositories',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const loadCommits = async () => {
    if (!linkedRepo) return

    try {
      setProcessing(true)
      const [owner, repo] = linkedRepo.github_repo_full_name.split('/')
      const commitsData = await getGithubCommits(owner, repo, {
        sha: currentBranch,
        per_page: 20,
      })
      setCommits(commitsData)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load commits',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Validates GitHub repository name
   * GitHub rules: alphanumeric, hyphens, underscores, dots; max 255 chars
   * Cannot start/end with dash, cannot have consecutive dots
   */
  const validateRepoName = (name: string): string => {
    if (!name.trim()) {
      return 'Repository name is required'
    }

    if (name.length > 255) {
      return 'Repository name must be 255 characters or less'
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      return 'Repository name can only contain letters, numbers, hyphens, underscores, and dots'
    }

    if (name.startsWith('-') || name.endsWith('-')) {
      return 'Repository name cannot start or end with a hyphen'
    }

    if (name.includes('..')) {
      return 'Repository name cannot contain consecutive dots'
    }

    return ''
  }

  const handleRepoNameChange = (value: string) => {
    setNewRepoName(value)
    setNewRepoNameError(validateRepoName(value))
  }

  const loadBranches = async () => {
    if (!linkedRepo) return

    try {
      const [owner, repo] = linkedRepo.github_repo_full_name.split('/')
      const branchesData = await getGithubBranches(owner, repo)
      setBranches(branchesData)
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  const handleLinkRepo = async () => {
    if (!selectedRepo && !newRepoName) {
      toast({
        title: 'Error',
        description: 'Please select or create a repository',
        variant: 'destructive',
      })
      return
    }

    // Validate new repository name if creating one
    if (newRepoName) {
      const error = validateRepoName(newRepoName)
      if (error) {
        toast({
          title: 'Invalid Repository Name',
          description: error,
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setProcessing(true)

      let repoToLink: GithubRepo

      if (newRepoName) {
        // Create new repository
        repoToLink = await createGithubRepository({
          name: newRepoName,
          description: newRepoDesc,
          private: isPrivateRepo,
          auto_init: true,
        })

        toast({
          title: 'Success',
          description: `Repository "${newRepoName}" created successfully`,
        })

        // Parse project data to files and commit as initial content
        try {
          const files = parseAndExtractFilesFlat(projectData)
          if (files && Object.keys(files).length > 0) {
            await commitMultipleGithubFiles(
              repoToLink.owner.login,
              repoToLink.name,
              {
                branch: repoToLink.default_branch,
                message: 'Initial commit from AutoWRX editor',
                files,
              }
            )

            // Update last saved data
            setLastSavedData(projectData)

            toast({
              title: 'Success',
              description: 'Project files pushed to repository',
            })
          }
        } catch (commitError: any) {
          console.error('Failed to push initial commit:', commitError)
          toast({
            title: 'Warning',
            description: 'Repository created but failed to push initial files',
            variant: 'destructive',
          })
        }
      } else {
        // Use existing repository
        const repo = repositories.find((r) => r.id.toString() === selectedRepo)
        if (!repo) {
          throw new Error('Repository not found')
        }
        repoToLink = repo
      }

      // Link repository to prototype
      const linked = await linkRepositoryToPrototype({
        prototype_id: prototypeId,
        repo_id: repoToLink.id.toString(),
        repo_name: repoToLink.name,
        repo_full_name: repoToLink.full_name,
        repo_url: repoToLink.html_url,
        clone_url: repoToLink.clone_url,
        default_branch: repoToLink.default_branch,
        is_private: repoToLink.private,
      })

      setLinkedRepo(linked)
      setCurrentBranch(linked.github_default_branch)
      // Load branches for newly linked repository
      await loadBranchesForRepo(linked)
      setShowRepoDialog(false)

      toast({
        title: 'Success',
        description: 'Repository linked successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to link repository',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a branch name',
        variant: 'destructive',
      })
      return
    }

    // Validate branch name (no spaces, special chars except - and _)
    if (!/^[a-zA-Z0-9._/-]+$/.test(newBranchName)) {
      toast({
        title: 'Error',
        description: 'Branch name can only contain letters, numbers, dots, hyphens, underscores, and slashes',
        variant: 'destructive',
      })
      return
    }

    if (!linkedRepo) {
      toast({
        title: 'Error',
        description: 'No repository linked',
        variant: 'destructive',
      })
      return
    }

    try {
      setProcessing(true)
      const [owner, repo] = linkedRepo.github_repo_full_name.split('/')

      // Create new branch using backend API
      await createGithubBranch(owner, repo, {
        branchName: newBranchName,
        baseBranch: currentBranch,
      })

      // Reload branches
      await loadBranchesForRepo(linkedRepo)
      setCurrentBranch(newBranchName)
      setNewBranchName('')
      setShowNewBranchDialog(false)

      toast({
        title: 'Success',
        description: `Branch "${newBranchName}" created successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create branch',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCommit = async () => {
    if (!linkedRepo || !commitMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a commit message',
        variant: 'destructive',
      })
      return
    }

    try {
      setProcessing(true)
      const [owner, repo] = linkedRepo.github_repo_full_name.split('/')

      // Parse project data to extract all files
      const filesToCommit = parseAndExtractFiles(projectData)

      if (!filesToCommit || filesToCommit.length === 0) {
        toast({
          title: 'Error',
          description: 'No files found in project to commit',
          variant: 'destructive',
        })
        return
      }

      // Commit all files atomically in a single commit
      const result = await commitMultipleGithubFiles(owner, repo, {
        branch: currentBranch,
        message: commitMessage,
        files: filesToCommit,
      })

      toast({
        title: 'Success',
        description: (
          <p className="flex items-center text-sm">
            <TbCircleCheckFilled className="mr-2 h-4 w-4 text-green-500" />
            {result.filesCount} file{result.filesCount !== 1 ? 's' : ''} committed successfully
          </p>
        ),
      })

      // Mark data as saved after successful commit
      setLastSavedData(projectData)
      setShowCommitDialog(false)
      setCommitMessage('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to commit changes',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handlePush = async () => {
    setShowCommitDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 px-2">
        <TbLoader className="animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1">
      {linkedRepo ? (
        <>
          <div className='grow'>
            <div className="flex items-center space-x-2 text-xs text-gray-600 grow">
              <a
                href={linkedRepo.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                title={linkedRepo.github_repo_full_name}
              >
                {linkedRepo.github_repo_name}
              </a>
            </div>

            <button
              onClick={() => setShowBranchDialog(true)}
              title="Switch Branch"
              className=" text-xs flex items-center gap-1 hover:underline"
            >
              <VscSourceControl />
              <span className="font-medium">{currentBranch}</span>
            </button>
          </div>

          <button
            onClick={handlePush}
            title={isDirty ? 'Commit & Push' : 'No changes to commit'}
            disabled={!isDirty}
            className={`p-1.5 rounded transition-colors ${isDirty
              ? 'hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed'
              }`}
          >
            <VscCloudUpload size={16} />
          </button>

          <button
            onClick={() => {
              setShowHistoryDialog(true)
              loadCommits()
            }}
            title="View History"
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors"
          >
            <VscHistory size={16} />
          </button>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowRepoDialog(true)
            loadRepositories()
          }}
          className="flex items-center space-x-1 w-full"
        >
          <VscRepo />
          <span>Link Repository</span>
        </Button>
      )}

      {/* Link Repository Dialog */}
      <Dialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link GitHub Repository</DialogTitle>
            <DialogDescription>
              Link an existing repository or create a new one for this prototype
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2">Select Existing Repository</Label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Choose a repository..." />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id.toString()}>
                      {repo.full_name} {repo.private && '(Private)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-sm text-gray-500 my-4">— OR —</div>

            <div>
              <Label className="mb-2">Create New Repository</Label>
              <Input
                placeholder="Repository name"
                value={newRepoName}
                onChange={(e) => handleRepoNameChange(e.target.value)}
                className={`mb-2 ${newRepoNameError ? 'border-red-500' : ''}`}
              />
              {newRepoNameError && (
                <p className="text-xs text-red-500 mb-2">{newRepoNameError}</p>
              )}
              <Textarea
                placeholder="Description (optional)"
                value={newRepoDesc}
                onChange={(e) => setNewRepoDesc(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private-repo"
                  checked={isPrivateRepo}
                  onCheckedChange={(checked) => setIsPrivateRepo(checked === true)}
                />
                <Label
                  htmlFor="private-repo"
                  className="text-sm font-normal cursor-pointer"
                >
                  Make this repository private
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {isPrivateRepo
                  ? 'Only you can see this repository'
                  : 'Anyone on the internet can see this repository'}
              </p>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowRepoDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleLinkRepo}
                disabled={processing || (!!newRepoName && !!newRepoNameError)}
              >
                {processing && <TbLoader className="mr-2 animate-spin" />}
                Link Repository
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commit Dialog */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit Changes</DialogTitle>
            <DialogDescription>
              Commit your changes to {linkedRepo?.github_repo_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {branches.length > 0 && (
              <div>
                <Label className="mb-2">Branch</Label>
                <Select value={currentBranch} onValueChange={setCurrentBranch}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="mb-2">Commit Message *</Label>
              <Textarea
                placeholder="Describe your changes..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowCommitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCommit} disabled={processing || !commitMessage.trim()}>
                {processing && <TbLoader className="mr-2 animate-spin" />}
                <VscGitCommit className="mr-2" />
                Commit & Push
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commit History</DialogTitle>
            <DialogDescription>
              Recent commits to {linkedRepo?.github_repo_name}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {processing ? (
              <div className="flex items-center justify-center py-8">
                <TbLoader className="animate-spin text-2xl" />
              </div>
            ) : commits.length > 0 ? (
              <div className="space-y-3">
                {commits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {commit.commit.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                          {commit.author && (
                            <>
                              <img
                                src={commit.author.avatar_url}
                                alt={commit.author.login}
                                className="w-4 h-4 rounded-full"
                              />
                              <span>{commit.author.login}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <code className="text-xs text-gray-500 ml-2">
                        {commit.sha.substring(0, 7)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No commits found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Branch Selection Dialog */}
      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Branch</DialogTitle>
            <DialogDescription>
              Choose a branch to work with in {linkedRepo?.github_repo_name}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {branchesLoading ? (
              <div className="flex items-center justify-center py-8">
                <TbLoader className="animate-spin text-2xl" />
              </div>
            ) : branches.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {branches.map((branch) => (
                  <button
                    key={branch.name}
                    onClick={() => {
                      setCurrentBranch(branch.name)
                      setShowBranchDialog(false)
                      toast({
                        title: 'Branch Changed',
                        description: `Switched to ${branch.name}`,
                      })
                    }}
                    className={`w-full text-left px-4 py-2 rounded border transition-colors ${currentBranch === branch.name
                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{branch.name}</span>
                      {currentBranch === branch.name && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No branches found</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowNewBranchDialog(true)}>
              Create Branch
            </Button>
            <Button variant="outline" onClick={() => setShowBranchDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Branch Dialog */}
      <Dialog open={showNewBranchDialog} onOpenChange={setShowNewBranchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch from {currentBranch}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2">Branch Name *</Label>
              <Input
                placeholder="feature/my-feature"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use lowercase letters, numbers, dots, hyphens, underscores, and slashes
              </p>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Based on: {currentBranch}</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowNewBranchDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={processing || !newBranchName.trim()}
            >
              {processing && <TbLoader className="mr-2 animate-spin" />}
              Create Branch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GitOperations
