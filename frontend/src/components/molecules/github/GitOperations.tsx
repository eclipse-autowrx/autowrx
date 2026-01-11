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
import { useToast } from '@/components/molecules/toaster/use-toast'
import {
  getLinkedRepository,
  linkRepositoryToPrototype,
  listGithubRepositories,
  createGithubRepository,
  commitGithubFile,
  getGithubCommits,
  getGithubBranches,
} from '@/services/github.service'
import { GitRepository, GithubRepo, GithubCommit, GithubBranch } from '@/types/git.type'
import {
  VscGitCommit,
  VscGitPullRequest,
  VscCloudUpload,
  VscRepo,
  VscHistory,
  VscGitBranch,
} from 'react-icons/vsc'
import { TbLoader, TbCircleCheckFilled } from 'react-icons/tb'
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
  const [repositories, setRepositories] = useState<GithubRepo[]>([])
  const [commits, setCommits] = useState<GithubCommit[]>([])
  const [branches, setBranches] = useState<GithubBranch[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [newRepoName, setNewRepoName] = useState('')
  const [newRepoDesc, setNewRepoDesc] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [currentBranch, setCurrentBranch] = useState('main')
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLinkedRepo()
  }, [prototypeId])

  const loadLinkedRepo = async () => {
    try {
      setLoading(true)
      const repo = await getLinkedRepository(prototypeId)
      setLinkedRepo(repo)
      setCurrentBranch(repo.github_default_branch)
    } catch (error) {
      // No linked repo found
      setLinkedRepo(null)
    } finally {
      setLoading(false)
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

    try {
      setProcessing(true)

      let repoToLink: GithubRepo

      if (newRepoName) {
        // Create new repository
        repoToLink = await createGithubRepository({
          name: newRepoName,
          description: newRepoDesc,
          private: false,
          auto_init: true,
        })

        toast({
          title: 'Success',
          description: `Repository "${newRepoName}" created successfully`,
        })
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

      // Commit the project data as project.json
      await commitGithubFile(owner, repo, {
        path: 'project.json',
        content: projectData,
        message: commitMessage,
        branch: currentBranch,
      })

      toast({
        title: 'Success',
        description: (
          <p className="flex items-center text-sm">
            <TbCircleCheckFilled className="mr-2 h-4 w-4 text-green-500" />
            Changes committed successfully
          </p>
        ),
      })

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
    <div className="flex items-center space-x-1 px-2">
      {linkedRepo ? (
        <>
          <div className="flex items-center space-x-2 text-xs text-gray-600 px-2">
            <VscRepo className="text-blue-600" />
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
            onClick={handlePush}
            title="Commit & Push"
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors"
          >
            <VscCloudUpload size={16} />
          </button>

          <button
            onClick={() => {
              setShowHistoryDialog(true)
              loadCommits()
              loadBranches()
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
          className="flex items-center space-x-1"
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
                <SelectTrigger>
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
                onChange={(e) => setNewRepoName(e.target.value)}
                className="mb-2"
              />
              <Textarea
                placeholder="Description (optional)"
                value={newRepoDesc}
                onChange={(e) => setNewRepoDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowRepoDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleLinkRepo} disabled={processing}>
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
                  <SelectTrigger>
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
    </div>
  )
}

export default GitOperations
